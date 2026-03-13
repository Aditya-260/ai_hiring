import os
import sys
import cv2
import threading
import time

PROCTOR_DIR = os.path.normpath(os.path.join(os.path.abspath(__file__), "..", "proctoring"))
sys.path.insert(0, PROCTOR_DIR)
os.chdir(PROCTOR_DIR)

from object_detection import detectObject

cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)
time.sleep(1) # Let camera warm up
ret, frame = cam.read()

if not ret:
    print("Could not grab frame")
else:
    print(f"Captured frame shape: {frame.shape}")
    
    # Save test image so I can see what it's analyzing
    cv2.imwrite("test_frame.jpg", frame)
    print("Saved test_frame.jpg")

    objs = detectObject(frame)
    print(f"Detected objects: {objs}")

cam.release()
