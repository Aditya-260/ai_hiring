import httpx
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_role
from app.database import (
    companies_collection,
    jobs_collection,
    applications_collection,
    interview_records_collection,
    users_collection,
)
from app.models.company import CompanyCreate, CompanyUpdate
from app.models.job import JobCreate, JobUpdate
from app.services.ai_service import rank_candidates

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])


# ── Company ──────────────────────────────────────────────

@router.post("/company")
async def create_company(data: CompanyCreate, user=Depends(require_role("recruiter"))):
    doc = {
        **data.model_dump(),
        "recruiter_id": user["_id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await companies_collection.insert_one(doc)
    return {"message": "Company created", "id": str(result.inserted_id)}


@router.get("/company")
async def get_my_companies(user=Depends(require_role("recruiter"))):
    companies = []
    async for c in companies_collection.find({"recruiter_id": user["_id"]}):
        companies.append({
            "id": str(c["_id"]),
            "name": c["name"],
            "description": c.get("description"),
            "website": c.get("website"),
            "industry": c.get("industry"),
            "location": c.get("location"),
            "created_at": c.get("created_at"),
        })
    return companies


@router.put("/company/{company_id}")
async def update_company(company_id: str, data: CompanyUpdate, user=Depends(require_role("recruiter"))):
    company = await companies_collection.find_one({"_id": ObjectId(company_id), "recruiter_id": user["_id"]})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await companies_collection.update_one({"_id": ObjectId(company_id)}, {"$set": update})
    return {"message": "Company updated"}


@router.delete("/company/{company_id}")
async def delete_company(company_id: str, user=Depends(require_role("recruiter"))):
    company = await companies_collection.find_one({"_id": ObjectId(company_id), "recruiter_id": user["_id"]})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    await companies_collection.delete_one({"_id": ObjectId(company_id)})
    # Cascade delete all jobs under this company
    await jobs_collection.delete_many({"company_id": company_id})
    return {"message": "Company deleted"}


# ── Jobs ─────────────────────────────────────────────────

@router.post("/jobs")
async def create_job(data: JobCreate, user=Depends(require_role("recruiter"))):
    # Verify ownership of company
    company = await companies_collection.find_one({"_id": ObjectId(data.company_id), "recruiter_id": user["_id"]})
    if not company:
        raise HTTPException(status_code=403, detail="You don't own this company")

    doc = {
        **data.model_dump(),
        "recruiter_id": user["_id"],
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await jobs_collection.insert_one(doc)
    return {"message": "Job posted", "id": str(result.inserted_id)}


@router.get("/jobs")
async def get_my_jobs(user=Depends(require_role("recruiter"))):
    jobs = []
    async for j in jobs_collection.find({"recruiter_id": user["_id"]}):
        company = await companies_collection.find_one({"_id": ObjectId(j["company_id"])})
        app_count = await applications_collection.count_documents({"job_id": str(j["_id"])})
        jobs.append({
            "id": str(j["_id"]),
            "title": j["title"],
            "role": j["role"],
            "experience": j["experience"],
            "skills": j.get("skills", []),
            "company_name": company["name"] if company else "Unknown",
            "applicant_count": app_count,
            "is_active": j.get("is_active", True),
            "created_at": j.get("created_at"),
        })
    return jobs


@router.put("/jobs/{job_id}")
async def update_job(job_id: str, data: JobUpdate, user=Depends(require_role("recruiter"))):
    job = await jobs_collection.find_one({"_id": ObjectId(job_id), "recruiter_id": user["_id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await jobs_collection.update_one({"_id": ObjectId(job_id)}, {"$set": update})
    return {"message": "Job updated"}


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, user=Depends(require_role("recruiter"))):
    job = await jobs_collection.find_one({"_id": ObjectId(job_id), "recruiter_id": user["_id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await jobs_collection.update_one({"_id": ObjectId(job_id)}, {"$set": {"is_active": False}})
    return {"message": "Job deactivated"}



# ── Candidate Resume (for recruiter) ────────────────────

@router.get("/candidates/{candidate_id}/resume")
async def get_candidate_resume(candidate_id: str, user=Depends(require_role("recruiter"))):
    """Let a recruiter view a candidate's resume for any job they own."""
    candidate = await users_collection.find_one({"_id": ObjectId(candidate_id)})
    if not candidate or not candidate.get("resume_url"):
        raise HTTPException(status_code=404, detail="Resume not found")
    return {
        "resume_url": candidate["resume_url"],
        "resume_filename": candidate.get("resume_filename", "resume"),
    }


# ── Candidate Evaluation ────────────────────────────────

@router.get("/jobs/{job_id}/candidates")
async def get_candidates(job_id: str, user=Depends(require_role("recruiter"))):
    job = await jobs_collection.find_one({"_id": ObjectId(job_id), "recruiter_id": user["_id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    apps = []
    async for app in applications_collection.find({"job_id": job_id}):
        candidate = await users_collection.find_one({"_id": ObjectId(app["candidate_id"])}) if ObjectId.is_valid(app["candidate_id"]) else None
        apps.append({
            "id": str(app["_id"]),
            "candidate_id": app["candidate_id"],
            "candidate_name": f"{candidate.get('first_name', candidate.get('name', ''))} {candidate.get('last_name', '')}".strip() if candidate else "Unknown",
            "candidate_email": candidate["email"] if candidate else "",
            "aptitude_score": app.get("aptitude_score"),
            "interview_score": app.get("interview_score"),
            "final_score": app.get("final_score"),
            "recommendation": app.get("recommendation"),
            "status": app["status"],
            "created_at": app.get("created_at"),
            "proctoring_warnings": app.get("proctoring_warnings", []),
            "cheating_probability": app.get("cheating_probability"),
            "disqualified": app.get("disqualified", False),
            "disqualify_reason": app.get("disqualify_reason", ""),
            "tab_switches": app.get("tab_switches", 0),
        })

    ranked = rank_candidates(apps)

    return ranked


@router.get("/decisions")
async def get_decisions(user=Depends(require_role("recruiter"))):
    """Fetch all shortlisted and rejected candidates across all jobs for a recruiter."""
    # 1. Get all jobs owned by this recruiter
    job_cursor = jobs_collection.find({"recruiter_id": user["_id"]})
    jobs = await job_cursor.to_list(length=None)
    job_ids = [str(job["_id"]) for job in jobs]
    job_map = {str(job["_id"]): job["title"] for job in jobs}

    if not job_ids:
        return []

    # 2. Get applications for these jobs with status shortlisted or rejected
    apps = []
    async for app in applications_collection.find({
        "job_id": {"$in": job_ids},
        "status": {"$in": ["shortlisted", "rejected"]}
    }):
        candidate = await users_collection.find_one({"_id": ObjectId(app["candidate_id"])}) if ObjectId.is_valid(app["candidate_id"]) else None
        
        apps.append({
            "id": str(app["_id"]),
            "candidate_id": app["candidate_id"],
            "candidate_name": f"{candidate.get('first_name', candidate.get('name', ''))} {candidate.get('last_name', '')}".strip() if candidate else "Unknown",
            "candidate_email": candidate["email"] if candidate else "",
            "job_id": app["job_id"],
            "job_title": job_map.get(app["job_id"], "Unknown Job"),
            "aptitude_score": app.get("aptitude_score"),
            "interview_score": app.get("interview_score"),
            "final_score": app.get("final_score"),
            "recommendation": app.get("recommendation"),
            "status": app["status"],
            "created_at": app.get("created_at"),
            "proctoring_warnings": app.get("proctoring_warnings", []),
            "cheating_probability": app.get("cheating_probability"),
            "disqualified": app.get("disqualified", False),
            "disqualify_reason": app.get("disqualify_reason", ""),
            "tab_switches": app.get("tab_switches", 0),
        })

    # Sort primarily by status (shortlisted first) then by score
    apps.sort(key=lambda x: (0 if x["status"] == "shortlisted" else 1, -(x.get("final_score") or 0)))
    
    return apps


@router.get("/candidates/{application_id}/interview")
async def get_interview_detail(application_id: str, user=Depends(require_role("recruiter"))):
    record = await interview_records_collection.find_one({"application_id": application_id})
    if not record:
        raise HTTPException(status_code=404, detail="Interview record not found")

    return {
        "id": str(record["_id"]),
        "application_id": record["application_id"],
        "candidate_id": record["candidate_id"],
        "questions": record.get("questions", []),
        "total_score": record.get("total_score"),
        "created_at": record.get("created_at"),
        "recording_b64": record.get("recording_b64"),
        "recording_saved_at": record.get("recording_saved_at"),
    }


@router.post("/candidates/{application_id}/decision")
async def make_decision(application_id: str, decision: dict, user=Depends(require_role("recruiter"))):
    action = decision.get("action")
    if action not in ("shortlisted", "rejected"):
        raise HTTPException(status_code=400, detail="Action must be 'shortlisted' or 'rejected'")

    app = await applications_collection.find_one({"_id": ObjectId(application_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify recruiter owns the job
    job = await jobs_collection.find_one({"_id": ObjectId(app["job_id"]), "recruiter_id": user["_id"]})
    if not job:
        raise HTTPException(status_code=403, detail="Not authorized")

    await applications_collection.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": action}},
    )
    return {"message": f"Candidate {action}"}
