from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from app.auth import hash_password, verify_password, create_access_token
from app.database import users_collection, system_logs_collection
from app.models.user import UserCreate, UserLogin

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup")
async def signup(user: UserCreate):
    if user.role not in ("candidate", "recruiter", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role,
        "resume_url": None,
        "blocked": False,
        "experience_years": 0,
        "skills": [],
        "phone": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await users_collection.insert_one(doc)

    await system_logs_collection.insert_one({
        "event": "user_signup",
        "user_id": str(result.inserted_id),
        "email": user.email,
        "role": user.role,
        "timestamp": datetime.utcnow().isoformat(),
    })

    token = create_access_token({"sub": user.email, "role": user.role})
    return {"token": token, "user": {"id": str(result.inserted_id), "name": user.name, "email": user.email, "role": user.role}}


@router.post("/login")
async def login(creds: UserLogin):
    user = await users_collection.find_one({"email": creds.email})
    if not user or not verify_password(creds.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked")

    token = create_access_token({"sub": user["email"], "role": user["role"]})

    await system_logs_collection.insert_one({
        "event": "user_login",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }


