import os
import json
import shutil
from typing import List, Optional
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud, ai_service, rag_service
from .database import engine, get_db

# Create SQLite tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SkillForge AI Backend API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to temporarily store uploaded files
UPLOAD_DIR = "./temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ----------------- USER TWIN ENDPOINTS -----------------
@app.get("/api/twin", response_model=schemas.UserTwinResponse)
def get_user_twin(db: Session = Depends(get_db)):
    return crud.get_user_twin(db)

@app.put("/api/twin", response_model=schemas.UserTwinResponse)
def update_user_twin(twin_data: schemas.UserTwinUpdate, db: Session = Depends(get_db)):
    return crud.update_user_twin(db, twin_data)

@app.post("/api/twin/mood", response_model=schemas.UserTwinResponse)
def check_in_mood(mood: str = Form(...), db: Session = Depends(get_db)):
    # Adjust stats based on mood check-in
    twin = crud.get_user_twin(db)
    
    mood_adjustments = {
        "Focused": {"motivation": 90, "xp_bonus": 10},
        "Energetic": {"motivation": 95, "xp_bonus": 15},
        "Stressed": {"motivation": 50, "xp_bonus": 5},
        "Tired": {"motivation": 40, "xp_bonus": 5},
        "Anxious": {"motivation": 55, "xp_bonus": 5}
    }
    
    adj = mood_adjustments.get(mood, {"motivation": 70, "xp_bonus": 0})
    
    update_schema = schemas.UserTwinUpdate(
        current_mood=mood,
        motivation_score=adj["motivation"],
        xp=twin.xp + adj["xp_bonus"]
    )
    
    # Check levels
    new_xp = twin.xp + adj["xp_bonus"]
    new_level = int(new_xp // 500) + 1
    if new_level > twin.level:
        update_schema.level = new_level
        # Append badge
        badges_list = json.loads(twin.badges)
        badge_name = f"Level {new_level} Explorer"
        if badge_name not in badges_list:
            badges_list.append(badge_name)
            update_schema.badges = json.dumps(badges_list)
            
    return crud.update_user_twin(db, update_schema)


# ----------------- DOCUMENT INTELLIGENCE -----------------
@app.post("/api/documents/upload")
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Save file locally temporarily
    temp_file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Run ingestion (Parse -> Extract Concepts -> Chunk -> Embed -> SQLite)
        db_doc = rag_service.ingest_document(db, temp_file_path, file.filename, title)
        
        # Award XP for upload
        twin = crud.get_user_twin(db)
        update_schema = schemas.UserTwinUpdate(xp=twin.xp + 50)
        crud.update_user_twin(db, update_schema)
        
        return {"status": "success", "document_id": db_doc.id, "title": db_doc.title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return crud.get_documents(db)

@app.get("/api/documents/{doc_id}", response_model=schemas.DocumentDetailResponse)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    success = crud.delete_document(db, doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "success", "message": "Document deleted successfully"}


# ----------------- NOTES GENERATION -----------------
@app.post("/api/notes/generate", response_model=schemas.NoteResponse)
def generate_study_notes(
    title: str = Form(...),
    style: str = Form(...),
    document_id: int = Form(...),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Generate notes using Gemini
    try:
        content = ai_service.generate_notes(doc.content, style)
        
        # Create Note model
        note_schema = schemas.NoteCreate(
            title=title,
            style=style,
            content=content,
            document_id=document_id
        )
        db_note = crud.create_note(db, note_schema)
        
        # Award XP
        twin = crud.get_user_twin(db)
        crud.update_user_twin(db, schemas.UserTwinUpdate(xp=twin.xp + 30))
        
        return db_note
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate notes: {str(e)}")

@app.get("/api/notes", response_model=List[schemas.NoteResponse])
def list_notes(db: Session = Depends(get_db)):
    return crud.get_notes(db)

@app.get("/api/notes/{note_id}", response_model=schemas.NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = crud.get_note(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


# ----------------- RAG TUTOR CHAT -----------------
@app.post("/api/tutor/chat")
def tutor_chat(
    question: str = Form(...),
    chat_history: str = Form("[]"), # JSON list of messages
    document_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        history_list = json.loads(chat_history)
    except Exception:
        history_list = []
        
    # Search SQLite for matching vectors
    relevant_chunks = rag_service.search_relevant_chunks(db, question, document_id=document_id, top_k=4)
    
    if not relevant_chunks:
        context = "No relevant uploaded documents found."
    else:
        context_parts = []
        for chunk, score in relevant_chunks:
            # Only include chunks with positive similarity or reasonable threshold
            if score > 0.1:
                context_parts.append(f"Source Document Segment: {chunk.chunk_text}")
        context = "\n\n".join(context_parts)
        
    try:
        response_text = ai_service.get_tutor_response(context, history_list, question)
        
        # Log active study time: add a minute
        twin = crud.get_user_twin(db)
        current_hours = json.loads(twin.weekly_hours)
        # Update today (assuming Sunday=0, Monday=1, ..., Saturday=6)
        import datetime
        today_idx = datetime.datetime.now().weekday()
        current_hours[today_idx] = round(current_hours[today_idx] + 0.02, 2)
        
        crud.update_user_twin(db, schemas.UserTwinUpdate(
            study_time_total=round(twin.study_time_total + 0.02, 2),
            weekly_hours=json.dumps(current_hours),
            xp=twin.xp + 5
        ))
        
        return {
            "answer": response_text,
            "sources": [{"id": c.document_id, "text": c.chunk_text[:100] + "...", "score": s} for c, s in relevant_chunks if s > 0.1]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tutor engine error: {str(e)}")


# ----------------- ADAPTIVE QUIZ -----------------
@app.post("/api/quiz/generate", response_model=schemas.QuizResponse)
def generate_quiz(
    title: str = Form(...),
    document_id: int = Form(...),
    num_questions: int = Form(5),
    difficulty: str = Form("medium"),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        questions_json = ai_service.generate_quiz(doc.content, num_questions, difficulty)
        # Validate JSON formatting
        json.loads(questions_json)
        
        quiz_schema = schemas.QuizCreate(
            title=title,
            document_id=document_id,
            questions=questions_json,
            total_questions=num_questions
        )
        return crud.create_quiz(db, quiz_schema)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@app.get("/api/quiz", response_model=List[schemas.QuizResponse])
def list_quizzes(db: Session = Depends(get_db)):
    return crud.get_quizzes(db)

@app.get("/api/quiz/{quiz_id}", response_model=schemas.QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = crud.get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@app.post("/api/quiz/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    submission: schemas.QuizSubmit,
    review_results: str = Form("[]"), # JSON array of {concept, is_correct, misconception}
    db: Session = Depends(get_db)
):
    quiz = crud.get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    crud.submit_quiz_score(db, quiz_id, submission.score)
    
    # Calculate performance and award XP/Stats
    accuracy = (submission.score / quiz.total_questions) * 100
    xp_gained = submission.score * 20
    
    twin = crud.get_user_twin(db)
    
    # Update twin metrics
    total_quizzes = len([q for q in crud.get_quizzes(db) if q.score is not None])
    new_avg_accuracy = ((twin.accuracy_total * max(total_quizzes - 1, 0)) + accuracy) / max(total_quizzes, 1)
    
    # Add streak progress
    new_streak = twin.streak
    if accuracy >= 60:
        new_streak += 1
        
    update_schema = schemas.UserTwinUpdate(
        xp=twin.xp + xp_gained,
        accuracy_total=round(new_avg_accuracy, 1),
        streak=new_streak
    )
    
    # Award Quiz badge
    badges_list = json.loads(twin.badges)
    if accuracy == 100 and "Perfect Score" not in badges_list:
        badges_list.append("Perfect Score")
        update_schema.badges = json.dumps(badges_list)
        
    crud.update_user_twin(db, update_schema)
    
    # Process weakness analytics
    try:
        results = json.loads(review_results)
        doc = crud.get_document(db, quiz.document_id)
        subject = doc.title if doc else "General"
        for r in results:
            concept = r.get("concept")
            is_correct = r.get("is_correct", True)
            misconception = r.get("misconception", "Conceptual gap")
            if concept:
                crud.upsert_weakness(db, concept, subject, misconception, is_correct)
    except Exception as e:
        print(f"Error compiling weakness data: {e}")
        
    return {
        "status": "success",
        "xp_gained": xp_gained,
        "accuracy": accuracy,
        "streak": new_streak
    }


# ----------------- SPACED REPETITION -----------------
@app.get("/api/spaced-repetition", response_model=List[schemas.SpacedRepetitionResponse])
def get_spaced_repetition(db: Session = Depends(get_db)):
    # Seed default concepts if list is empty, just for database graph completeness
    items = crud.get_spaced_repetition_items(db)
    if not items:
        default_concepts = [
            ("ER Diagrams", "DBMS"),
            ("1NF Normalization", "DBMS"),
            ("SQL SELECT Statements", "DBMS"),
            ("SQL JOIN Queries", "DBMS"),
            ("2NF Normalization", "DBMS"),
            ("3NF Normalization", "DBMS")
        ]
        for c, sub in default_concepts:
            crud.create_spaced_repetition_item(db, schemas.SpacedRepetitionCreate(concept_name=c, subject=sub))
        items = crud.get_spaced_repetition_items(db)
    return items

@app.post("/api/spaced-repetition/{item_id}/review", response_model=schemas.SpacedRepetitionResponse)
def review_concept(item_id: int, review: schemas.SpacedRepetitionReview, db: Session = Depends(get_db)):
    # quality is from 0 to 5
    item = crud.review_spaced_repetition_item(db, item_id, review.quality)
    if not item:
        raise HTTPException(status_code=404, detail="Spaced repetition item not found")
        
    # Award small XP
    twin = crud.get_user_twin(db)
    crud.update_user_twin(db, schemas.UserTwinUpdate(xp=twin.xp + 10))
    
    return item


# ----------------- STUDY PLANNER -----------------
@app.post("/api/planner/generate", response_model=schemas.StudyPlanResponse)
def generate_planner(
    subject: str = Form(...),
    exam_date: str = Form(...),
    daily_hours: float = Form(...),
    db: Session = Depends(get_db)
):
    try:
        schedule_json = ai_service.generate_study_plan(subject, exam_date, daily_hours)
        # Validate JSON
        json.loads(schedule_json)
        
        plan_schema = schemas.StudyPlanCreate(
            subject=subject,
            exam_date=exam_date,
            daily_hours=daily_hours
        )
        return crud.create_study_plan(db, plan_schema, schedule_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate study plan: {str(e)}")

@app.get("/api/planner", response_model=List[schemas.StudyPlanResponse])
def list_planners(db: Session = Depends(get_db)):
    return crud.get_study_plans(db)


# ----------------- WEAKNESS PREDICTIONS -----------------
@app.get("/api/weaknesses", response_model=List[schemas.WeaknessResponse])
def get_weaknesses(db: Session = Depends(get_db)):
    return crud.get_weaknesses(db)


# ----------------- DEBATE PARTNER -----------------
@app.post("/api/debate/create", response_model=schemas.DebateResponse)
def create_debate(topic: str = Form(...), db: Session = Depends(get_db)):
    debate_schema = schemas.DebateCreate(topic=topic)
    return crud.create_debate_session(db, debate_schema)

@app.get("/api/debate", response_model=List[schemas.DebateResponse])
def list_debates(db: Session = Depends(get_db)):
    return crud.get_debate_sessions(db)

@app.post("/api/debate/{debate_id}/message")
def debate_message(
    debate_id: int,
    user_message: str = Form(...),
    db: Session = Depends(get_db)
):
    session = crud.get_debate_session(db, debate_id)
    if not session:
        raise HTTPException(status_code=404, detail="Debate session not found")
        
    try:
        history_list = json.loads(session.history)
    except Exception:
        history_list = []
        
    # Append user argument
    history_list.append({"sender": "user", "text": user_message})
    
    try:
        # Get AI Debate partner response
        ai_response = ai_service.get_debate_partner_response(session.topic, history_list[:-1], user_message)
        
        # Append AI response
        history_list.append({"sender": "ai", "text": ai_response})
        
        # Save history back to DB
        crud.update_debate_history(db, debate_id, json.dumps(history_list))
        
        # Award XP
        twin = crud.get_user_twin(db)
        crud.update_user_twin(db, schemas.UserTwinUpdate(xp=twin.xp + 15))
        
        return {"answer": ai_response, "history": history_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debate engine error: {str(e)}")


# ----------------- EXAM PREP MODE -----------------
@app.post("/api/exam/generate")
def generate_exam_material(
    document_id: int = Form(...),
    university: str = Form(...),
    subject: str = Form(...),
    unit: int = Form(...),
    marks: int = Form(...),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        material = ai_service.generate_exam_questions(doc.content, university, subject, unit, marks)
        
        # Save as Note for student reference
        note_schema = schemas.NoteCreate(
            title=f"Mock Exam: {subject} - Unit {unit} ({marks} Marks)",
            style="detailed",
            content=material,
            document_id=document_id
        )
        crud.create_note(db, note_schema)
        
        return {"material": material}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate exam material: {str(e)}")


# ----------------- EXTRA ANALYTICS & GOALS -----------------
@app.get("/api/goals", response_model=List[schemas.DailyGoalResponse])
def get_daily_goals(db: Session = Depends(get_db)):
    return crud.get_daily_goals(db)

@app.post("/api/goals", response_model=schemas.DailyGoalResponse)
def create_goal(goal_text: str = Form(...), db: Session = Depends(get_db)):
    return crud.create_daily_goal(db, goal_text)

@app.put("/api/goals/{goal_id}/toggle", response_model=schemas.DailyGoalResponse)
def toggle_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = crud.toggle_daily_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    # Award small XP if completed
    if goal.completed:
        twin = crud.get_user_twin(db)
        crud.update_user_twin(db, schemas.UserTwinUpdate(xp=twin.xp + 15))
        
    return goal
