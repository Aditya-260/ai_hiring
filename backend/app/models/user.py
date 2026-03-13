from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone: str
    role: str  # candidate, recruiter, admin


class UserLogin(BaseModel):
    email_or_phone: str
    password: str


class UserOut(BaseModel):
    id: str
    first_name: str
    last_name: Optional[str] = None
    email: str
    role: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    university: Optional[str] = None
    resume_url: Optional[str] = None
    blocked: bool = False
    created_at: Optional[str] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    university: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[list[str]] = None
