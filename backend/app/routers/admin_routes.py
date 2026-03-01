from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.database import (
    users_collection,
    companies_collection,
    jobs_collection,
    applications_collection,
    aptitude_questions_collection,
    interview_records_collection,
    system_logs_collection,
)
from app.models.question import QuestionCreate, QuestionUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Dashboard ────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    total_candidates = await users_collection.count_documents({"role": "candidate"})
    total_recruiters = await users_collection.count_documents({"role": "recruiter"})
    total_companies = await companies_collection.count_documents({})
    total_jobs = await jobs_collection.count_documents({})
    total_applications = await applications_collection.count_documents({})
    total_questions = await aptitude_questions_collection.count_documents({})

    return {
        "total_candidates": total_candidates,
        "total_recruiters": total_recruiters,
        "total_companies": total_companies,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
        "total_questions": total_questions,
    }


# ── User Management ─────────────────────────────────────

@router.get("/users")
async def list_users():
    users = []
    async for u in users_collection.find():
        users.append({
            "id": str(u["_id"]),
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "blocked": u.get("blocked", False),
            "created_at": u.get("created_at"),
        })
    return users


@router.put("/users/{user_id}/block")
async def toggle_block(user_id: str, body: dict):
    target = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    blocked = body.get("blocked", True)
    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"blocked": blocked}})

    await system_logs_collection.insert_one({
        "event": "user_block_toggle",
        "admin_id": "public_admin",
        "target_user_id": user_id,
        "blocked": blocked,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {"message": f"User {'blocked' if blocked else 'unblocked'}"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    target = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    await users_collection.delete_one({"_id": ObjectId(user_id)})

    if target.get("role") == "recruiter":
        # Cascade delete all companies and jobs owned by this recruiter
        await companies_collection.delete_many({"recruiter_id": ObjectId(user_id)})
        await jobs_collection.delete_many({"recruiter_id": ObjectId(user_id)})
    elif target.get("role") == "candidate":
        # Cascade delete all applications and interview records owned by this candidate
        await applications_collection.delete_many({"candidate_id": user_id})
        await interview_records_collection.delete_many({"candidate_id": user_id})

    # Log the deletion
    await system_logs_collection.insert_one({
        "event": "user_deleted",
        "admin_id": "public_admin",
        "target_user_id": user_id,
        "target_email": target.get("email"),
        "timestamp": datetime.utcnow().isoformat(),
    })
    return {"message": "User permanently deleted"}


# ── Company Management ─────────────────────────────────

@router.get("/companies")
async def list_companies():
    companies = []
    async for c in companies_collection.find():
        companies.append({
            "id": str(c["_id"]),
            "name": c["name"],
            "industry": c.get("industry"),
            "website": c.get("website"),
            "location": c.get("location"),
            "recruiter_id": str(c.get("recruiter_id", "")),
            "created_at": c.get("created_at"),
        })
    return companies


@router.delete("/companies/{company_id}")
async def delete_company(company_id: str):
    target = await companies_collection.find_one({"_id": ObjectId(company_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Company not found")

    await companies_collection.delete_one({"_id": ObjectId(company_id)})
    
    # Cascade delete all jobs under this company
    await jobs_collection.delete_many({"company_id": company_id})

    await system_logs_collection.insert_one({
        "event": "company_deleted",
        "admin_id": "public_admin",
        "target_company_id": company_id,
        "target_company_name": target.get("name"),
        "timestamp": datetime.utcnow().isoformat(),
    })
    return {"message": "Company permanently deleted"}


# ── Question Bank ────────────────────────────────────────

@router.get("/questions")
async def list_questions():
    questions = []
    async for q in aptitude_questions_collection.find():
        questions.append({
            "id": str(q["_id"]),
            "text": q["text"],
            "options": q["options"],
            "correct_answer": q["correct_answer"],
            "category": q.get("category"),
            "difficulty": q.get("difficulty"),
            "role_tag": q.get("role_tag"),
        })
    return questions


@router.post("/questions")
async def create_question(data: QuestionCreate):
    doc = {
        **data.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await aptitude_questions_collection.insert_one(doc)
    return {"message": "Question created", "id": str(result.inserted_id)}


@router.put("/questions/{question_id}")
async def update_question(question_id: str, data: QuestionUpdate):
    q = await aptitude_questions_collection.find_one({"_id": ObjectId(question_id)})
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await aptitude_questions_collection.update_one({"_id": ObjectId(question_id)}, {"$set": update})
    return {"message": "Question updated"}


@router.delete("/questions/{question_id}")
async def delete_question(question_id: str):
    result = await aptitude_questions_collection.delete_one({"_id": ObjectId(question_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted"}


# ── Security Logs ────────────────────────────────────────

@router.get("/logs")
async def get_logs(limit: int = 100):
    logs = []
    async for log in system_logs_collection.find().sort("timestamp", -1).limit(limit):
        logs.append({
            "id": str(log["_id"]),
            "event": log.get("event"),
            "user_id": log.get("user_id"),
            "email": log.get("email"),
            "details": {k: v for k, v in log.items() if k not in ("_id", "event", "user_id", "email")},
            "timestamp": log.get("timestamp"),
        })
    return logs
