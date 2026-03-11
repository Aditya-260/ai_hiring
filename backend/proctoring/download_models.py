"""
Run this script once to download the large dlib shape predictor model (~99MB).
It cannot be stored in Git due to file size.

Usage:
    python backend/proctoring/download_models.py
"""

import os
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "shape_predictor_model")
MODEL_PATH = os.path.join(MODEL_DIR, "shape_predictor_68_face_landmarks.dat")
BZ2_PATH = MODEL_PATH + ".bz2"

# Official dlib model hosted on dlib.net
MODEL_URL = "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"


def download_with_progress(url: str, dest: str):
    print(f"Downloading from {url} ...")
    def reporthook(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, downloaded * 100 / total_size)
            print(f"\r  {pct:.1f}%  ({downloaded // 1024 // 1024} MB / {total_size // 1024 // 1024} MB)", end="", flush=True)
    urllib.request.urlretrieve(url, dest, reporthook)
    print()


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)

    if os.path.exists(MODEL_PATH):
        print(f"✅ Model already exists at:\n   {MODEL_PATH}")
        return

    # Download .bz2
    download_with_progress(MODEL_URL, BZ2_PATH)

    # Decompress
    print("Decompressing...")
    import bz2
    with bz2.open(BZ2_PATH, "rb") as f_in, open(MODEL_PATH, "wb") as f_out:
        f_out.write(f_in.read())
    os.remove(BZ2_PATH)

    print(f"✅ Model saved to:\n   {MODEL_PATH}")


if __name__ == "__main__":
    main()
