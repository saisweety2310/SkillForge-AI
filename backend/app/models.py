import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class UserTwin(Base):
    __tablename__ = "user_twins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, default="Student")
    learning_speed = Column(Float, default=1.0) # Speed modifier
    preferred_time = Column(String, default="Evening") # Morning, Afternoon, Evening, Night
    streak = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    badges = Column(String, default="[]") # JSON string array
    level = Column(Integer, default=1)
    study_time_total = Column(Float, default=0.0) # Hours
    accuracy_total = Column(Float, default=0.0) # Percent
    last_active = Column(DateTime, default=datetime.datetime.utcnow)
    weekly_hours = Column(String, default="[0,0,0,0,0,0,0]") # JSON array of 7 elements
    motivation_score = Column(Integer, default=70)
    current_mood = Column(String, default="Focused")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    filename = Column(String)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    content = Column(Text) # Full extracted text
    concepts = Column(Text, default="[]") # JSON list of extracted concepts
    
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    chunk_text = Column(Text)
    embedding = Column(Text) # JSON serialized float list
    
    document = relationship("Document", back_populates="chunks")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    style = Column(String) # quick, detailed, bullet, story, beginner, advanced
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)

class DailyGoal(Base):
    __tablename__ = "daily_goals"

    id = Column(Integer, primary_key=True, index=True)
    goal_text = Column(String)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    questions = Column(Text) # JSON list of questions
    score = Column(Integer, nullable=True)
    total_questions = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SpacedRepetitionItem(Base):
    __tablename__ = "spaced_repetition_items"

    id = Column(Integer, primary_key=True, index=True)
    concept_name = Column(String, index=True)
    subject = Column(String)
    interval = Column(Integer, default=1) # days
    ease_factor = Column(Float, default=2.5)
    repetitions = Column(Integer, default=0)
    next_review = Column(DateTime, default=datetime.datetime.utcnow)
    last_reviewed = Column(DateTime, default=datetime.datetime.utcnow)

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    exam_date = Column(DateTime)
    daily_hours = Column(Float)
    schedule = Column(Text) # JSON structure containing calendar schedule
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Weakness(Base):
    __tablename__ = "weaknesses"

    id = Column(Integer, primary_key=True, index=True)
    concept_name = Column(String, index=True)
    subject = Column(String)
    misconception = Column(String)
    attempts = Column(Integer, default=0)
    incorrect_attempts = Column(Integer, default=0)
    severity = Column(String, default="Low") # Low, Medium, High

class DebateSession(Base):
    __tablename__ = "debate_sessions"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String)
    history = Column(Text, default="[]") # JSON list of message objects
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
