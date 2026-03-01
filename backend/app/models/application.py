from pydantic import BaseModel
from typing import Optional


class ApplicationOut(BaseModel):
    id: str
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_id: str
    aptitude_score: Optional[float] = None
    interview_score: Optional[float] = None
    final_score: Optional[float] = None
    recommendation: Optional[str] = None  # "Highly Recommended", "Recommended", "Not Recommended"
    status: str = "applied"  # applied, aptitude_done, interview_done, shortlisted, rejected
    created_at: Optional[str] = None
    
    # Proctoring integrations
    proctoring_warnings: Optional[list] = []
    cheating_probability: Optional[float] = 0.0


class AptitudeSubmission(BaseModel):
    answers: dict[str, str]  # question_id -> selected_option


class InterviewAnswer(BaseModel):
    question_id: str
    question: str
    answer: str


class InterviewSubmission(BaseModel):
    answers: list[InterviewAnswer]
