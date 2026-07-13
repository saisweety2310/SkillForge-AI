from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# User Twin
class UserTwinBase(BaseModel):
    username: str
    learning_speed: float
    preferred_time: str
    streak: int
    xp: int
    badges: str
    level: int
    study_time_total: float
    accuracy_total: float
    weekly_hours: str
    motivation_score: int
    current_mood: str

class UserTwinUpdate(BaseModel):
    username: Optional[str] = None
    learning_speed: Optional[float] = None
    preferred_time: Optional[str] = None
    streak: Optional[int] = None
    xp: Optional[int] = None
    badges: Optional[str] = None
    level: Optional[int] = None
    study_time_total: Optional[float] = None
    accuracy_total: Optional[float] = None
    weekly_hours: Optional[str] = None
    motivation_score: Optional[int] = None
    current_mood: Optional[str] = None

class UserTwinResponse(UserTwinBase):
    id: int
    last_active: datetime

    class Config:
        from_attributes = True

# Document
class DocumentBase(BaseModel):
    title: str
    filename: str

class DocumentCreate(DocumentBase):
    content: str
    concepts: str

class DocumentResponse(DocumentBase):
    id: int
    upload_date: datetime
    concepts: str # JSON

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    content: str

    class Config:
        from_attributes = True

# Notes
class NoteBase(BaseModel):
    title: str
    style: str
    content: str
    document_id: Optional[int] = None

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Daily Goal
class DailyGoalBase(BaseModel):
    goal_text: str
    completed: bool

class DailyGoalCreate(BaseModel):
    goal_text: str

class DailyGoalResponse(DailyGoalBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Quiz
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    type: str # mcq, blank, true_false, coding, numerical, case_study
    difficulty: str # easy, medium, hard
    explanation: Optional[str] = None

class QuizBase(BaseModel):
    title: str
    document_id: Optional[int] = None
    total_questions: int

class QuizCreate(QuizBase):
    questions: str # JSON

class QuizSubmit(BaseModel):
    score: int

class QuizResponse(QuizBase):
    id: int
    questions: str # JSON
    score: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Spaced Repetition Item
class SpacedRepetitionBase(BaseModel):
    concept_name: str
    subject: str
    interval: int
    ease_factor: float
    repetitions: int

class SpacedRepetitionCreate(BaseModel):
    concept_name: str
    subject: str

class SpacedRepetitionReview(BaseModel):
    quality: int # 0 to 5 score based on SM-2 spaced repetition grading

class SpacedRepetitionResponse(SpacedRepetitionBase):
    id: int
    next_review: datetime
    last_reviewed: datetime

    class Config:
        from_attributes = True

# Study Planner
class StudyPlanCreate(BaseModel):
    subject: str
    exam_date: str # YYYY-MM-DD
    daily_hours: float

class StudyPlanResponse(BaseModel):
    id: int
    subject: str
    exam_date: datetime
    daily_hours: float
    schedule: str # JSON
    created_at: datetime

    class Config:
        from_attributes = True

# Weakness
class WeaknessResponse(BaseModel):
    id: int
    concept_name: str
    subject: str
    misconception: str
    attempts: int
    incorrect_attempts: int
    severity: str

    class Config:
        from_attributes = True

# Debate Session
class DebateCreate(BaseModel):
    topic: str

class DebateMessage(BaseModel):
    sender: str # user, ai
    text: str

class DebateHistoryUpdate(BaseModel):
    history: str # JSON list of DebateMessage

class DebateResponse(BaseModel):
    id: int
    topic: str
    history: str # JSON
    created_at: datetime

    class Config:
        from_attributes = True
