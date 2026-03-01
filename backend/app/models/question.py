from pydantic import BaseModel
from typing import Optional


class QuestionCreate(BaseModel):
    text: str
    options: list[str]  # 4 options
    correct_answer: str  # the correct option text
    category: Optional[str] = None  # e.g. "logical", "verbal", "quantitative", "technical"
    difficulty: Optional[str] = "medium"  # easy, medium, hard
    role_tag: Optional[str] = None  # optional: related job role


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    options: Optional[list[str]] = None
    correct_answer: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    role_tag: Optional[str] = None


class QuestionOut(BaseModel):
    id: str
    text: str
    options: list[str]
    correct_answer: Optional[str] = None  # hidden from candidates
    category: Optional[str] = None
    difficulty: Optional[str] = None
    role_tag: Optional[str] = None
