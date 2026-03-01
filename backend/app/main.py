from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os

from app.auth import get_current_user
from app.routers import auth_routes, candidate_routes, recruiter_routes, admin_routes

app = FastAPI(title="AI Hiring Platform", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_routes.router)
app.include_router(candidate_routes.router)
app.include_router(recruiter_routes.router)
app.include_router(admin_routes.router)

proctor_process = None

@app.on_event("startup")
async def startup_event():
    global proctor_process
    proctor_dir = r"D:\Artificial-Intelligence-based-Online-Exam-Proctoring-System-main"
    if os.path.exists(proctor_dir):
        # We start it silently
        proctor_process = subprocess.Popen(
            ["python", "server.py"],
            cwd=proctor_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

@app.on_event("shutdown")
async def shutdown_event():
    global proctor_process
    if proctor_process:
        proctor_process.terminate()
        try:
            proctor_process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proctor_process.kill()


@app.get("/")
async def root():
    return {"message": "AI Hiring Platform API", "version": "1.0.0"}


@app.get("/api/auth/me")
async def me(user=Depends(get_current_user)):
    return {
        "id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "resume_url": user.get("resume_url"),
        "experience_years": user.get("experience_years", 0),
        "skills": user.get("skills", []),
    }
