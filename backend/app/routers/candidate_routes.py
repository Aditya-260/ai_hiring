# ── Imports ──────────────────────────────────────────────
from pydantic import BaseModel
import base64
import random
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.auth import get_current_user, require_role
from app.database import (
    users_collection,
    jobs_collection,
    preset_jobs_collection,
    applications_collection,
    aptitude_questions_collection,
    interview_records_collection,
    companies_collection,
    system_logs_collection,
)
from app.models.application import AptitudeSubmission, InterviewSubmission
from app.models.user import UserUpdate
from app.services.ai_service import (
    generate_interview_questions,
    evaluate_answer,
    compute_final_score,
    get_recommendation,
)

router = APIRouter(prefix="/api/candidate", tags=["candidate"])

class ProctoringWarningsInput(BaseModel):
    warnings: list
    cheating_probability: float

class RecordingInput(BaseModel):
    recording_b64: str  # data:video/webm;base64,...
from app.models.user import UserUpdate
from app.services.ai_service import (
    generate_interview_questions,
    evaluate_answer,
    compute_final_score,
    get_recommendation,
)

router = APIRouter(prefix="/api/candidate", tags=["candidate"])


# ── Profile ──────────────────────────────────────────────

@router.get("/profile")
async def get_profile(user=Depends(require_role("candidate"))):
    return {
        "id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "experience_years": user.get("experience_years", 0),
        "skills": user.get("skills", []),
        "resume_url": user.get("resume_url"),
    }


@router.put("/profile")
async def update_profile(data: UserUpdate, user=Depends(require_role("candidate"))):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await users_collection.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    return {"message": "Profile updated"}


@router.post("/resume")
async def upload_resume(file: UploadFile = File(...), user=Depends(require_role("candidate"))):
    contents = await file.read()
    encoded = base64.b64encode(contents).decode("utf-8")
    resume_data = f"data:{file.content_type};base64,{encoded}"
    await users_collection.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"resume_url": resume_data, "resume_filename": file.filename}},
    )
    return {"message": "Resume uploaded", "filename": file.filename}


# ── Jobs ─────────────────────────────────────────────────

@router.get("/jobs")
async def list_jobs(user=Depends(require_role("candidate"))):
    jobs = []
    async for job in jobs_collection.find({"is_active": True}):
        job_id = str(job["_id"])
        company = await companies_collection.find_one({"_id": job["company_id"]}) if job.get("company_id") else None
        # Check if already applied
        existing = await applications_collection.find_one({
            "candidate_id": user["_id"],
            "job_id": job_id,
        })
        jobs.append({
            "id": job_id,
            "title": job["title"],
            "role": job.get("role"),
            "experience": job.get("experience"),
            "eligibility": job.get("eligibility"),
            "skills": job.get("skills", []),
            "description": job.get("description"),
            "company_name": company["name"] if company else job.get("company_name"),
            "company_location": company.get("location") if company else None,
            "created_at": job.get("created_at"),
            "already_applied": existing is not None,
            "application_status": existing.get("status") if existing else None,
        })
    return jobs


@router.post("/apply/{job_id}")
async def apply_job(job_id: str, user=Depends(require_role("candidate"))):
    # Check resume
    if not user.get("resume_url"):
        raise HTTPException(status_code=400, detail="Please upload your resume before applying")

    job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = await applications_collection.find_one({
        "candidate_id": user["_id"],
        "job_id": job_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")

    doc = {
        "candidate_id": user["_id"],
        "job_id": job_id,
        "aptitude_score": None,
        "interview_score": None,
        "final_score": None,
        "recommendation": None,
        "status": "applied",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await applications_collection.insert_one(doc)
    return {"message": "Application submitted", "application_id": str(result.inserted_id)}


# ── Aptitude Test ────────────────────────────────────────

@router.get("/assessment/{job_id}")
async def get_aptitude_questions(job_id: str, user=Depends(require_role("candidate"))):
    app = await applications_collection.find_one({
        "candidate_id": user["_id"],
        "job_id": job_id,
    })
    if not app:
        raise HTTPException(status_code=400, detail="Apply to this job first")
    if app.get("status") not in ("applied",):
        raise HTTPException(status_code=400, detail="Aptitude test already completed")

    # Get 20 random MCQs
    all_questions = []
    async for q in aptitude_questions_collection.find():
        all_questions.append(q)

    if len(all_questions) < 20:
        selected = all_questions
    else:
        selected = random.sample(all_questions, 20)

    questions_out = []
    for q in selected:
        questions_out.append({
            "id": str(q["_id"]),
            "text": q["text"],
            "options": q["options"],
            "category": q.get("category"),
        })

    return {"questions": questions_out, "application_id": str(app["_id"]), "time_limit_minutes": 30}


@router.post("/assessment/{job_id}/submit")
async def submit_aptitude(job_id: str, submission: AptitudeSubmission, user=Depends(require_role("candidate"))):
    app = await applications_collection.find_one({
        "candidate_id": user["_id"],
        "job_id": job_id,
    })
    if not app:
        raise HTTPException(status_code=400, detail="Application not found")

    # Score it out of TOTAL QUESTIONS ASKED (max 20), not just attempted
    correct = 0
    total_q_in_db = await aptitude_questions_collection.count_documents({})
    total_asked = min(20, total_q_in_db)
    
    for qid, selected in submission.answers.items():
        if selected: # Only score if they actually picked an option
            q = await aptitude_questions_collection.find_one({"_id": ObjectId(qid)})
            if q and q.get("correct_answer") == selected:
                correct += 1

    # Calculate percentage based on the full 20 questions (or however many were shown)
    score = round((correct / max(total_asked, 1)) * 100, 2) if total_asked > 0 else 0
    passed = score >= 40

    new_status = "aptitude_done" if passed else "rejected"
    await applications_collection.update_one(
        {"_id": app["_id"]},
        {"$set": {"aptitude_score": score, "status": new_status}},
    )

    await system_logs_collection.insert_one({
        "event": "aptitude_completed",
        "user_id": user["_id"],
        "job_id": job_id,
        "score": score,
        "passed": passed,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {"score": score, "passed": passed, "correct": correct, "total": total_asked}


# ── AI Interview ─────────────────────────────────────────

@router.get("/interview/{job_id}")
async def get_interview_questions(job_id: str, user=Depends(require_role("candidate"))):
    app = await applications_collection.find_one({
        "candidate_id": user["_id"],
        "job_id": job_id,
    })
    if not app:
        raise HTTPException(status_code=400, detail="Application not found")
    if app.get("status") != "aptitude_done":
        raise HTTPException(status_code=400, detail="Complete the aptitude test first (with passing score)")

    # Check if interview already exists
    existing = await interview_records_collection.find_one({"application_id": str(app["_id"]), "submitted": True})
    if existing:
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Get job — try preset_jobs first, fallback to recruiter jobs
    job = await preset_jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    questions = generate_interview_questions(
        role=job["role"],
        skills=job.get("skills", []),
        experience=job["experience"],
        num_questions=5,
    )

    # Save the interview record (not yet submitted)
    record = {
        "application_id": str(app["_id"]),
        "candidate_id": user["_id"],
        "job_id": job_id,
        "questions": questions,
        "submitted": False,
        "created_at": datetime.utcnow().isoformat(),
    }
    await interview_records_collection.insert_one(record)

    return {"questions": questions, "time_limit_minutes": 30}


@router.post("/interview/{job_id}/submit")
async def submit_interview(job_id: str, submission: InterviewSubmission, user=Depends(require_role("candidate"))):
    app = await applications_collection.find_one({
        "candidate_id": user["_id"],
        "job_id": job_id,
    })
    if not app:
        raise HTTPException(status_code=400, detail="Application not found")

    record = await interview_records_collection.find_one({
        "application_id": str(app["_id"]),
        "submitted": False,
    })
    if not record:
        raise HTTPException(status_code=400, detail="No pending interview found")

    # Evaluate each answer
    scored_questions = []
    total_score = 0
    for ans in submission.answers:
        result = evaluate_answer(ans.question, ans.answer)
        scored_questions.append({
            "question_id": ans.question_id,
            "question": ans.question,
            "answer": ans.answer,
            "score": result["score"],
            "feedback": result["feedback"],
        })
        total_score += result["score"]

    avg_score = round((total_score / max(len(submission.answers), 1)) * 10, 2)  # Scale to 100

    await interview_records_collection.update_one(
        {"_id": record["_id"]},
        {"$set": {"questions": scored_questions, "total_score": avg_score, "submitted": True}},
    )

    # Update application
    aptitude = app.get("aptitude_score", 0) or 0
    final = compute_final_score(aptitude, avg_score)
    recommendation = get_recommendation(final)

    await applications_collection.update_one(
        {"_id": app["_id"]},
        {"$set": {
            "interview_score": avg_score,
            "final_score": final,
            "recommendation": recommendation,
            "status": "interview_done",
        }},
    )

    await system_logs_collection.insert_one({
        "event": "interview_completed",
        "user_id": user["_id"],
        "job_id": job_id,
        "interview_score": avg_score,
        "final_score": final,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {"message": "Interview submitted", "interview_score": avg_score, "final_score": final}


@router.post("/interview/{job_id}/save-recording")
async def save_interview_recording(job_id: str, payload: RecordingInput, user=Depends(require_role("candidate"))):
    """Stores the base64-encoded WebM recording against the candidate's interview record."""
    app = await applications_collection.find_one({
        "candidate_id": user["_id"],
        "job_id": job_id,
    })
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    record = await interview_records_collection.find_one({
        "application_id": str(app["_id"]),
    })
    if not record:
        raise HTTPException(status_code=404, detail="Interview record not found")

    await interview_records_collection.update_one(
        {"_id": record["_id"]},
        {"$set": {"recording_b64": payload.recording_b64, "recording_saved_at": datetime.utcnow().isoformat()}}
    )

    await system_logs_collection.insert_one({
        "event": "interview_recording_saved",
        "user_id": user["_id"],
        "job_id": job_id,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {"message": "Recording saved successfully"}


# ── Proctoring Warnings ──────────────────────────────────

@router.post("/assessment/{job_id}/warnings")
async def save_proctoring_warnings(job_id: str, data: ProctoringWarningsInput, user=Depends(require_role("candidate"))):
    app = await applications_collection.find_one({
        "candidate_id": user["_id"],
        "job_id": job_id,
    })
    if not app:
        raise HTTPException(status_code=400, detail="Application not found")

    await applications_collection.update_one(
        {"_id": app["_id"]},
        {"$set": {
            "proctoring_warnings": data.warnings,
            "cheating_probability": data.cheating_probability
        }},
    )
    
    await system_logs_collection.insert_one({
        "event": "proctoring_warnings_saved",
        "user_id": user["_id"],
        "job_id": job_id,
        "warnings_count": len(data.warnings),
        "cheating_probability": data.cheating_probability,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {"message": "Proctoring warnings saved successfully"}


# ── Application Status ───────────────────────────────────

@router.get("/applications")
async def my_applications(user=Depends(require_role("candidate"))):
    apps = []
    async for app in applications_collection.find({"candidate_id": user["_id"]}):
        job = await jobs_collection.find_one({"_id": ObjectId(app["job_id"])})
        apps.append({
            "id": str(app["_id"]),
            "job_id": app["job_id"],
            "job_title": job["title"] if job else "Unknown",
            "status": app["status"],
            "aptitude_score": app.get("aptitude_score"),
            "created_at": app.get("created_at"),
        })
    return apps
