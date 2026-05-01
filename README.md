# Beyond-Hiring

An AI-powered end-to-end hiring platform with intelligent interview assessment, aptitude testing, and real-time proctoring.

Detail Description:
AI Hiring Platform is a full-stack recruitment system designed to simulate a structured hiring process for both candidates and recruiters. The platform enables candidates to register, upload resumes, take aptitude tests, and participate in AI-driven interview stages, followed by a final evaluation. Recruiters can manage candidates through a dedicated dashboard, review performance, and make hiring decisions such as shortlisting or rejection. The system focuses on scalable backend architecture, role-based access control, and integrates computer vision modules for monitoring and behavior analysis during assessments.

## Features

- 🧠 **AI Interview** — Voice-based interviews with LLM-powered questions & answer evaluation
- 📝 **Aptitude Test** — Automated MCQ assessment with scoring
- 📷 **Proctoring** — Real-time face detection, head-pose estimation, and object detection (phone, etc.)
- 👔 **Recruiter Dashboard** — Candidate ranking, proctoring logs, video playback, decision dashboard
- 🔐 **Auth** — JWT-based auth with candidate, recruiter & admin roles

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI + Python |
| Database | MongoDB|
| AI/LLM | Groq API |
| Proctoring | OpenCV + dlib + YOLOv3-tiny |

> ⚡ **No GPU required** — All AI runs via Groq Cloud API. Proctoring uses lightweight CPU-based OpenCV/dlib models.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/Aditya-260/ai_hiring.git
cd ai_hiring
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

**Create `backend/.env`:**
```env
MONGO_URI=your_mongodb_atlas_uri
SECRET_KEY=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Download the proctoring model (one-time, ~99MB)

```bash
python backend/proctoring/download_models.py
```

This downloads `shape_predictor_68_face_landmarks.dat` (dlib face landmark model) which is too large for GitHub.

### 4. Run Backend

```bash
cd backend
uvicorn app.main:app --reload
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
ai_hiring/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── services/
│   ├── proctoring/           # Self-contained proctoring engine
│   │   ├── facial_detections.py
│   │   ├── head_pose_estimation.py
│   │   ├── object_detection.py
│   │   ├── download_models.py   ← run once to get the dlib model
│   │   ├── shape_predictor_model/
│   │   └── object_detection_model/
│   └── requirements.txt
└── frontend/
    └── src/
```
