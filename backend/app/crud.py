import datetime
import json
from sqlalchemy.orm import Session
from sqlalchemy import desc
from . import models, schemas

# User Twin helpers
def get_user_twin(db: Session) -> models.UserTwin:
    twin = db.query(models.UserTwin).first()
    if not twin:
        twin = models.UserTwin(
            username="ForgeStudent",
            learning_speed=1.0,
            preferred_time="Evening",
            streak=1,
            xp=100,
            badges='["Welcome Badge"]',
            level=1,
            study_time_total=0.0,
            accuracy_total=0.0,
            weekly_hours="[0,0,0,0,0,0,0]",
            motivation_score=75,
            current_mood="Focused"
        )
        db.add(twin)
        db.commit()
        db.refresh(twin)
    return twin

def update_user_twin(db: Session, update_data: schemas.UserTwinUpdate) -> models.UserTwin:
    twin = get_user_twin(db)
    obj_data = update_data.model_dump(exclude_unset=True)
    for key, value in obj_data.items():
        setattr(twin, key, value)
    twin.last_active = datetime.datetime.utcnow()
    db.commit()
    db.refresh(twin)
    return twin

# Document helpers
def create_document(db: Session, doc: schemas.DocumentCreate) -> models.Document:
    db_doc = models.Document(
        title=doc.title,
        filename=doc.filename,
        content=doc.content,
        concepts=doc.concepts
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def get_documents(db: Session):
    return db.query(models.Document).order_by(desc(models.Document.upload_date)).all()

def get_document(db: Session, doc_id: int):
    return db.query(models.Document).filter(models.Document.id == doc_id).first()

def delete_document(db: Session, doc_id: int):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if doc:
        db.delete(doc)
        db.commit()
        return True
    return False

# Chunks
def create_document_chunks(db: Session, document_id: int, chunks: list):
    for text, emb in chunks:
        db_chunk = models.DocumentChunk(
            document_id=document_id,
            chunk_text=text,
            embedding=json.dumps(emb)
        )
        db.add(db_chunk)
    db.commit()

def get_document_chunks(db: Session, document_id: int):
    return db.query(models.DocumentChunk).filter(models.DocumentChunk.document_id == document_id).all()

def get_all_document_chunks(db: Session):
    return db.query(models.DocumentChunk).all()

# Note helpers
def create_note(db: Session, note: schemas.NoteCreate) -> models.Note:
    db_note = models.Note(
        title=note.title,
        style=note.style,
        content=note.content,
        document_id=note.document_id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def get_notes(db: Session):
    return db.query(models.Note).order_by(desc(models.Note.created_at)).all()

def get_note(db: Session, note_id: int):
    return db.query(models.Note).filter(models.Note.id == note_id).first()

# Daily Goals
def get_daily_goals(db: Session):
    # Ensure there are goals, else seed default ones
    goals = db.query(models.DailyGoal).all()
    if not goals:
        default_goals = [
            "Complete a 15-minute study session",
            "Generate study notes from a document",
            "Pass an adaptive quiz with >80% accuracy"
        ]
        for g in default_goals:
            db_goal = models.DailyGoal(goal_text=g, completed=False)
            db.add(db_goal)
        db.commit()
        goals = db.query(models.DailyGoal).all()
    return goals

def create_daily_goal(db: Session, goal_text: str):
    db_goal = models.DailyGoal(goal_text=goal_text, completed=False)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def toggle_daily_goal(db: Session, goal_id: int):
    db_goal = db.query(models.DailyGoal).filter(models.DailyGoal.id == goal_id).first()
    if db_goal:
        db_goal.completed = not db_goal.completed
        db.commit()
        db.refresh(db_goal)
    return db_goal

# Quiz helpers
def create_quiz(db: Session, quiz: schemas.QuizCreate) -> models.Quiz:
    db_quiz = models.Quiz(
        title=quiz.title,
        document_id=quiz.document_id,
        questions=quiz.questions,
        total_questions=quiz.total_questions
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

def get_quizzes(db: Session):
    return db.query(models.Quiz).order_by(desc(models.Quiz.created_at)).all()

def get_quiz(db: Session, quiz_id: int):
    return db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()

def submit_quiz_score(db: Session, quiz_id: int, score: int):
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if db_quiz:
        db_quiz.score = score
        db.commit()
        db.refresh(db_quiz)
    return db_quiz

# Spaced Repetition helpers
def get_spaced_repetition_items(db: Session):
    return db.query(models.SpacedRepetitionItem).order_by(models.SpacedRepetitionItem.next_review).all()

def create_spaced_repetition_item(db: Session, item: schemas.SpacedRepetitionCreate) -> models.SpacedRepetitionItem:
    # Check if item already exists
    existing = db.query(models.SpacedRepetitionItem).filter(
        models.SpacedRepetitionItem.concept_name == item.concept_name
    ).first()
    if existing:
        return existing
        
    db_item = models.SpacedRepetitionItem(
        concept_name=item.concept_name,
        subject=item.subject,
        interval=1,
        ease_factor=2.5,
        repetitions=0,
        next_review=datetime.datetime.utcnow(),
        last_reviewed=datetime.datetime.utcnow()
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def review_spaced_repetition_item(db: Session, item_id: int, quality: int):
    item = db.query(models.SpacedRepetitionItem).filter(models.SpacedRepetitionItem.id == item_id).first()
    if not item:
        return None
    
    # SM-2 Spaced Repetition Algorithm
    # Quality: 0 (forgot) to 5 (perfect response)
    if quality >= 3:
        if item.repetitions == 0:
            item.interval = 1
        elif item.repetitions == 1:
            item.interval = 6
        else:
            item.interval = int(round(item.interval * item.ease_factor))
        item.repetitions += 1
    else:
        item.repetitions = 0
        item.interval = 1

    # Adjust ease factor
    item.ease_factor = item.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if item.ease_factor < 1.3:
        item.ease_factor = 1.3

    item.last_reviewed = datetime.datetime.utcnow()
    item.next_review = datetime.datetime.utcnow() + datetime.timedelta(days=item.interval)
    
    db.commit()
    db.refresh(item)
    return item

# Weakness helpers
def get_weaknesses(db: Session):
    return db.query(models.Weakness).order_by(desc(models.Weakness.incorrect_attempts)).all()

def upsert_weakness(db: Session, concept_name: str, subject: str, misconception: str, is_correct: bool):
    weakness = db.query(models.Weakness).filter(models.Weakness.concept_name == concept_name).first()
    if not weakness:
        weakness = models.Weakness(
            concept_name=concept_name,
            subject=subject,
            misconception=misconception,
            attempts=0,
            incorrect_attempts=0,
            severity="Low"
        )
        db.add(weakness)
        
    weakness.attempts += 1
    if not is_correct:
        weakness.incorrect_attempts += 1
        
    # Calculate severity
    ratio = weakness.incorrect_attempts / max(weakness.attempts, 1)
    if weakness.incorrect_attempts >= 5 or ratio > 0.7:
        weakness.severity = "High"
    elif weakness.incorrect_attempts >= 3 or ratio > 0.4:
        weakness.severity = "Medium"
    else:
        weakness.severity = "Low"
        
    db.commit()
    db.refresh(weakness)
    return weakness

# Study Plan
def create_study_plan(db: Session, plan: schemas.StudyPlanCreate, schedule_json: str) -> models.StudyPlan:
    db_plan = models.StudyPlan(
        subject=plan.subject,
        exam_date=datetime.datetime.strptime(plan.exam_date, "%Y-%m-%d"),
        daily_hours=plan.daily_hours,
        schedule=schedule_json
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def get_study_plans(db: Session):
    return db.query(models.StudyPlan).order_by(desc(models.StudyPlan.created_at)).all()

# Debate Helpers
def create_debate_session(db: Session, debate: schemas.DebateCreate) -> models.DebateSession:
    db_debate = models.DebateSession(
        topic=debate.topic,
        history='[]'
    )
    db.add(db_debate)
    db.commit()
    db.refresh(db_debate)
    return db_debate

def get_debate_sessions(db: Session):
    return db.query(models.DebateSession).order_by(desc(models.DebateSession.created_at)).all()

def get_debate_session(db: Session, debate_id: int):
    return db.query(models.DebateSession).filter(models.DebateSession.id == debate_id).first()

def update_debate_history(db: Session, debate_id: int, history_json: str):
    db_debate = db.query(models.DebateSession).filter(models.DebateSession.id == debate_id).first()
    if db_debate:
        db_debate.history = history_json
        db.commit()
        db.refresh(db_debate)
    return db_debate
