from pydantic import BaseModel
from typing import Optional


class InterviewQA(BaseModel):
    question_id: str
    question: str
    answer: Optional[str] = None
    score: Optional[float] = None  # 0-10
    feedback: Optional[str] = None


class InterviewRecordOut(BaseModel):
    id: str
    application_id: str
    candidate_id: str
    job_id: str
    questions: list[InterviewQA] = []
    total_score: Optional[float] = None
    created_at: Optional[str] = None
