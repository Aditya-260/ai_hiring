from pydantic import BaseModel
from typing import Optional


class JobCreate(BaseModel):
    title: str
    role: str
    experience: str  # e.g. "Fresher", "1-3 years", "3+ years"
    eligibility: Optional[str] = None
    skills: list[str] = []
    description: Optional[str] = None
    salary: Optional[str] = None  # hidden from candidates
    company_id: str
    expires_in_days: int  # Recruiter must explicitly choose (7, 14, 30, or 60)


class JobUpdate(BaseModel):
    title: Optional[str] = None
    role: Optional[str] = None
    experience: Optional[str] = None
    eligibility: Optional[str] = None
    skills: Optional[list[str]] = None
    description: Optional[str] = None
    salary: Optional[str] = None
    expires_in_days: Optional[int] = None  # Allows extending expiry on edit


class JobOut(BaseModel):
    id: str
    title: str
    role: str
    experience: str
    eligibility: Optional[str] = None
    skills: list[str] = []
    description: Optional[str] = None
    salary: Optional[str] = None
    company_id: str
    company_name: Optional[str] = None
    recruiter_id: str
    created_at: Optional[str] = None
    expires_at: Optional[str] = None
    is_active: bool = True
