"""
Proctoring Router — FastAPI native (replaces Flask server.py on port 5000)

Two-thread architecture for zero-lag live camera + async analysis:
  Thread 1 (camera_reader):   cam.read() → store raw numpy frame in shared buffer (no analysis)
  Thread 2 (analysis_loop):   read shared buffer → face/head/object analysis → push warnings
  video_feed endpoint:        read shared buffer → encode JPEG → yield MJPEG (instant, no lag)
  warnings_feed endpoint:     SSE stream from warnings_queue
"""

import os
import sys
import io
import cv2
import time
import json
import queue
import threading
import logging
import contextlib
from datetime import datetime

import numpy as np
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ── Path setup: add proctoring folder so its modules can be imported ──────────
# Points to backend/proctoring/ inside this repo — fully self-contained, no external folder needed
PROCTOR_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "proctoring")
PROCTOR_DIR = os.path.normpath(PROCTOR_DIR)

_orig_cwd = os.getcwd()
_proctor_available = False

if os.path.isdir(PROCTOR_DIR) and PROCTOR_DIR not in sys.path:
    sys.path.insert(0, PROCTOR_DIR)

try:
    os.chdir(PROCTOR_DIR)
    # Suppress stdout/stderr during model loading (dlib prints a lot)
    with open(os.devnull, 'w') as devnull:
        with contextlib.redirect_stdout(devnull), contextlib.redirect_stderr(devnull):
            from facial_detections import detectFace           # noqa: E402
            from head_pose_estimation import head_pose_detection  # noqa: E402
            from object_detection import detectObject          # noqa: E402
    _proctor_available = True
    logger.info("✅ Proctoring modules loaded successfully")
except Exception as e:
    logger.warning(f"⚠️  Proctoring modules not available: {e}")
finally:
    os.chdir(_orig_cwd)

# ── Shared state ──────────────────────────────────────────────────────────────
# Share raw numpy array (not JPEG) so object detection works on original quality
_latest_raw_frame: np.ndarray | None = None
_frame_lock = threading.Lock()

_warnings_queue: queue.Queue = queue.Queue(maxsize=100)
_active_user_email: str | None = None
_camera_running = False

_last_warning_time: dict = {}
WARNING_COOLDOWN_SECS = 5


# ── Warning helper ────────────────────────────────────────────────────────────
def _push_warning(warning_type: str, message: str):
    now = time.time()
    key = f"{warning_type}:{message}"
    if key in _last_warning_time and (now - _last_warning_time[key]) < WARNING_COOLDOWN_SECS:
        return
    _last_warning_time[key] = now
    timestamp = datetime.now().strftime("%H:%M:%S")
    warning = {"type": warning_type, "message": message, "time": timestamp}
    try:
        _warnings_queue.put_nowait(warning)
    except queue.Full:
        try:
            _warnings_queue.get_nowait()
            _warnings_queue.put_nowait(warning)
        except queue.Empty:
            pass


# ── Thread 1: Camera reader (fast — just grabs raw numpy frames) ──────────────
def _camera_reader_thread():
    global _latest_raw_frame, _camera_running
    cam = None
    try:
        cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        cam.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cam.set(cv2.CAP_PROP_FPS, 20)

        if not cam.isOpened():
            logger.error("Camera could not be opened")
            _camera_running = False
            return

        logger.info("📷 Camera reader thread started")
        while _camera_running:
            ret, frame = cam.read()
            if not ret:
                time.sleep(0.05)
                continue
            with _frame_lock:
                _latest_raw_frame = frame  # store raw numpy — no encoding
    except Exception as e:
        logger.error(f"Camera reader error: {e}")
    finally:
        if cam:
            cam.release()
        with _frame_lock:
            _latest_raw_frame = None
        logger.info("📷 Camera reader thread stopped")


# ── Thread 2: Analysis loop (slow, background — does not block camera reader) ──
def _analysis_thread():
    global _camera_running
    if not _proctor_available:
        logger.warning("Proctoring modules not available — analysis thread idle")
        return

    frame_count = 0
    logger.info("🔍 Analysis thread started")
    try:
        while _camera_running:
            with _frame_lock:
                frame = _latest_raw_frame.copy() if _latest_raw_frame is not None else None

            if frame is None:
                time.sleep(0.1)
                continue

            try:
                faceCount, faces = detectFace(frame)

                if faceCount > 1:
                    _push_warning("danger", "Multiple faces detected!")
                elif faceCount == 0:
                    _push_warning("danger", "No face detected!")

                if faceCount >= 1:
                    # Head pose — suppress console print spam, but STILL send SSE warnings to the UI
                    with open(os.devnull, 'w') as devnull:
                        with contextlib.redirect_stdout(devnull):
                            head_status = head_pose_detection(faces, frame)
                    # Warn for ALL abnormal head positions — shown in interview UI, NOT in terminal
                    if isinstance(head_status, str) and head_status in (
                        "Head Right", "Head Left", "Head Up", "Head Down"
                    ):
                        _push_warning("danger", f"Head pose: {head_status}")

                # Object detection — runs every 2nd frame REGARDLESS of face count
                # This ensures phones/books are caught even when multiple people are in frame
                if frame_count % 2 == 0:
                    detected_items = detectObject(frame)
                    
                    # 1. Check for multiple people via YOLO (fallback for dlib side-profile misses)
                    person_count = sum(1 for obj in detected_items if obj[0] == "person")
                    if person_count > 1 and faceCount <= 1:
                        _push_warning("danger", "Multiple faces detected!")
                    elif person_count >= 1 and faceCount == 0:
                        # YOLO sees a person but dlib doesn't see a face (e.g. looking away)
                        # We suppress the 'No face detected' warning to avoid annoying the user
                        pass

                    # 2. Check for actual suspicious objects
                    suspicious_objs = [obj for obj in detected_items if obj[0] != "person"]
                    if suspicious_objs:
                        names = ", ".join(o[0] for o in suspicious_objs)
                        _push_warning("danger", f"Suspicious object(s): {names}")

            except Exception as e:
                logger.debug(f"Analysis error (non-fatal): {e}")

            frame_count += 1
            time.sleep(0.1)

    except Exception as e:
        logger.error(f"Analysis thread error: {e}")
    finally:
        logger.info("🔍 Analysis thread stopped")


# ── Camera lifecycle ──────────────────────────────────────────────────────────
def start_camera():
    global _camera_running
    if _camera_running:
        return
    _camera_running = True
    threading.Thread(target=_camera_reader_thread, daemon=True, name="proctor-camera").start()
    threading.Thread(target=_analysis_thread, daemon=True, name="proctor-analysis").start()
    logger.info("🚀 Proctoring threads started")


def stop_camera():
    global _camera_running, _latest_raw_frame
    _camera_running = False
    _latest_raw_frame = None
    logger.info("🛑 Proctoring threads stopping")


# ── FastAPI Router ────────────────────────────────────────────────────────────
router = APIRouter(prefix="/api/proctor", tags=["proctoring"])


def _mjpeg_generator():
    """Yields MJPEG frames from raw numpy buffer — Thread 1 keeps it fresh."""
    while _camera_running:
        with _frame_lock:
            frame = _latest_raw_frame.copy() if _latest_raw_frame is not None else None

        if frame is None:
            time.sleep(0.05)
            continue

        ok, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if not ok:
            continue

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"
        )
        time.sleep(1 / 20)


@router.get("/video_feed")
def video_feed():
    """MJPEG stream — raw camera, zero analysis delay."""
    if not _camera_running:
        start_camera()
    return StreamingResponse(
        _mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        },
    )


def _sse_generator():
    while True:
        try:
            warning = _warnings_queue.get(timeout=1)
            yield f"data: {json.dumps(warning)}\n\n"
        except queue.Empty:
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"


@router.get("/warnings_feed")
def warnings_feed():
    """SSE stream of proctoring warnings."""
    return StreamingResponse(
        _sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


class ActiveUserPayload(BaseModel):
    email: str


@router.post("/set_active_user")
def set_active_user(payload: ActiveUserPayload):
    global _active_user_email
    _active_user_email = payload.email
    if not _camera_running:
        start_camera()
    return {"message": "Active user set", "email": payload.email}


@router.post("/stop")
def stop_proctoring():
    """Stop camera and analysis threads — called when interview ends."""
    stop_camera()
    return {"message": "Proctoring stopped"}
