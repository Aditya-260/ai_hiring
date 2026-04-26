from datetime import datetime
import re

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.database import users_collection, system_logs_collection
from app.models.user import UserCreate, UserLogin

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup")
async def signup(user: UserCreate):
    if user.role not in ("candidate", "recruiter", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = await users_collection.find_one({"$or": [{"email": user.email}, {"phone": user.phone}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or Phone already registered")

    # Password validation
    pwd = user.password
    if len(pwd) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[A-Z]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r"\d", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not re.search(r"[@$!%*?&#]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")
    
    common_pwds = {"Password123!", "Admin123!", "Qwerty@123", "12345678aA!"}
    if pwd in common_pwds:
        raise HTTPException(status_code=400, detail="Password is too common. Choose a stronger one.")

    doc = {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role,
        "resume_url": None,
        "blocked": False,
        "experience_years": 0,
        "skills": [],
        "phone": user.phone,
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
    return {"token": token, "user": {"id": str(result.inserted_id), "first_name": user.first_name, "last_name": user.last_name, "email": user.email, "role": user.role}}


@router.post("/login")
async def login(creds: UserLogin):
    user = await users_collection.find_one({"$or": [{"email": creds.email_or_phone}, {"phone": creds.email_or_phone}]})
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
            "first_name": user.get("first_name", user.get("name")),
            "last_name": user.get("last_name"),
            "email": user["email"],
            "role": user["role"],
        },
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "first_name": current_user.get("first_name", current_user.get("name")),
        "last_name": current_user.get("last_name"),
        "email": current_user["email"],
        "role": current_user["role"],
    }


