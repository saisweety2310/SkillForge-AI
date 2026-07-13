import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

MODEL_NAME = "gemini-1.5-flash"
EMBEDDING_MODEL = "models/text-embedding-004"

def get_gemini_client():
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set. Please set it in your .env file.")
    return genai.GenerativeModel(MODEL_NAME)

def generate_notes(content: str, style: str) -> str:
    """
    Generates study notes based on selected style:
    quick, detailed, bullet, story, beginner, advanced
    """
    model = get_gemini_client()
    
    style_prompts = {
        "quick": "Create a ultra-concise 1-page revision cheat sheet summarizing the most critical points, definitions, and equations.",
        "detailed": "Provide a comprehensive, in-depth explanation of the concepts, with detailed definitions, examples, subtopics, and step-by-step mathematical or logical breakdowns.",
        "bullet": "Summarize the material entirely in bullet points, highlighting key takeaways, exam tips, and quick reference facts.",
        "story": "Explain the concepts using an engaging narrative or real-world analogy. Create characters or scenarios to make dry topics relatable, simple, and memorable.",
        "beginner": "Explain the material as if writing for a complete beginner. Avoid jargon where possible (or explain it immediately), use simple words, and outline foundational concepts step-by-step.",
        "advanced": "Explain the material at a high technical level. Dive deep into formulas, hardware/software details, mathematical proofs, edge cases, and industry applications. Use professional jargon."
    }
    
    prompt = f"""
    You are an elite academic tutor. Please generate revision notes based on the following text:
    ---
    {content[:15000]}
    ---
    
    Style requested: {style_prompts.get(style, style_prompts["detailed"])}
    
    Format the response using beautiful and clean Markdown headers, lists, code snippets (if applicable), and tables. Do not include introductory or concluding meta-sentences; output the notes directly.
    """
    
    response = model.generate_content(prompt)
    return response.text

def extract_concepts(content: str) -> str:
    """
    Extracts key concepts, definitions, formulas, and keywords from the text, returning a JSON array.
    """
    model = get_gemini_client()
    
    prompt = f"""
    Analyze the following academic text and extract the key core concepts, formulas, definitions, and keywords:
    ---
    {content[:15000]}
    ---
    
    Format the output as a JSON array of objects. Each object MUST have these exact fields:
    - "concept": The name of the concept or topic (string)
    - "description": A clear, concise definition or explanation of the concept (string)
    - "formula": Important formula(s) related to it, or null/empty if none (string)
    - "keywords": A list of 3-5 keywords associated with the topic (array of strings)

    Ensure the output is valid JSON, containing only the JSON array. Do not wrap it in markdown code blocks like ```json ... ```. Just return the raw JSON text.
    """
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    # Strip markdown backticks if Gemini accidentally adds them
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def generate_quiz(content: str, num_questions: int = 5, difficulty: str = "medium") -> str:
    """
    Generates questions from the text, returning a JSON array of questions.
    """
    model = get_gemini_client()
    
    prompt = f"""
    You are an expert academic tester. Generate a quiz containing {num_questions} questions from the following text:
    ---
    {content[:12000]}
    ---
    
    Difficulty: {difficulty} (easy, medium, hard). Adjust the depth of reasoning required accordingly.
    
    You must generate a variety of question types selected from:
    - "mcq" (Multiple choice: 4 options, 1 correct)
    - "blank" (Fill in the blank)
    - "true_false" (True or false question)
    - "coding" (A short coding task, if applicable to the subject, or a logical query)
    - "numerical" (A math/calculation question, if applicable, or logic test)
    - "case_study" (A brief scenario with a conceptual question)

    Format the output as a JSON array of objects. Each object MUST have these exact fields:
    - "question": The question prompt (string)
    - "options": An array of 4 string options for MCQ, or empty array [] for other types
    - "answer": The correct answer (string: for MCQ it should match one option exactly; for true_false it should be "True" or "False"; for others, a concise correct answer)
    - "type": One of: "mcq", "blank", "true_false", "coding", "numerical", "case_study"
    - "difficulty": "{difficulty}"
    - "explanation": A detailed explanation of why this answer is correct and the underlying concept (string)

    Ensure the output is valid, parseable JSON. Do not wrap it in markdown code blocks like ```json ... ```. Just return the raw JSON text.
    """
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def get_tutor_response(context: str, chat_history: list, question: str) -> str:
    """
    Grounded RAG tutor chat response.
    """
    model = get_gemini_client()
    
    # Format chat history for prompt
    history_str = ""
    for msg in chat_history[-6:]:  # Keep last 6 exchanges
        sender = "Student" if msg.get("sender") == "user" else "AI Tutor"
        history_str += f"{sender}: {msg.get('text')}\n"
        
    prompt = f"""
    You are SkillForge AI, a personalized AI learning mentor. You answer questions using ONLY the provided course reference materials. If the information is not in the materials, say 'I cannot find that in your uploaded study documents, but based on general knowledge...' and give a brief helpful answer.
    
    Uploaded Study Reference Materials:
    ---
    {context}
    ---
    
    Conversation History:
    {history_str}
    
    Student's Question: "{question}"
    
    Provide a clear, detailed, and encouraging response. Highlight keywords, use bullets where appropriate, and supply step-by-step explanations.
    """
    
    response = model.generate_content(prompt)
    return response.text

def get_debate_partner_response(topic: str, chat_history: list, user_argument: str) -> str:
    """
    Simulates a debate partner. The AI plays devil's advocate to challenge the student's statement.
    """
    model = get_gemini_client()
    
    history_str = ""
    for msg in chat_history[-6:]:
        sender = "Student" if msg.get("sender") == "user" else "Debate Partner"
        history_str += f"{sender}: {msg.get('text')}\n"
        
    prompt = f"""
    You are an AI Debate Partner. The student is practicing defending their understanding of a technical concept.
    Your role is to play a constructive Devil's Advocate. Do not agree with the user. Instead, challenge their assumptions, point out logical fallacies, present edge cases, or ask follow-up probing questions to test their conceptual depth. Keep it academic, polite, but challenging.
    
    Debate Topic: {topic}
    
    Debate History:
    {history_str}
    
    Student's Latest Argument: "{user_argument}"
    
    Provide your debate response. Keep it to 2-3 concise paragraphs. End with one strong challenging question.
    """
    
    response = model.generate_content(prompt)
    return response.text

def generate_study_plan(subject: str, exam_date: str, daily_hours: float) -> str:
    """
    Generates a personalized daily schedule leading up to an exam, outputting JSON.
    """
    model = get_gemini_client()
    
    prompt = f"""
    Create a personalized study schedule leading up to an exam.
    Subject: {subject}
    Exam Date: {exam_date}
    Daily time commitment: {daily_hours} hours.
    Today's Date: {datetime.datetime.now().strftime('%Y-%m-%d')}
    
    Generate a day-by-day checklist. Format the output as a JSON object with this structure:
    {{
      "summary": "High-level strategy summary",
      "calendar": [
         {{
           "day": "Day 1 (Date)",
           "topic": "Topic to study",
           "tasks": ["Task 1", "Task 2"],
           "duration": {daily_hours}
         }}
      ]
    }}
    
    Generate at least 7 days of schedule (or count the number of days until the exam if it's less).
    Ensure the output is raw valid JSON. Do not wrap in ```json ... ``` markdown block.
    """
    import datetime
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def generate_exam_questions(content: str, university: str, subject: str, unit: int, marks: int) -> str:
    """
    Generates exam-style questions, expected answers, and viva questions.
    """
    model = get_gemini_client()
    
    prompt = f"""
    You are an examiner at {university}. Based on the following study content:
    ---
    {content[:10000]}
    ---
    
    Create exam resources for Subject: {subject}, Unit: {unit}.
    Generate the following specifically for a {marks}-mark question category:
    1. Two expected University-style Questions.
    2. Comprehensive, model answers for each question, structured with intro, points, diagrams descriptions, and conclusion.
    3. Three related Viva (Oral Exam) questions that an examiner might ask to test practical understanding, along with quick answers.

    Provide the output in beautiful Markdown with clear headings and bold highlights.
    """
    
    response = model.generate_content(prompt)
    return response.text

def generate_embeddings(text: str) -> list:
    """
    Generates embeddings vector for text chunk.
    """
    if not api_key:
        return [0.0] * 768  # Return dummy vector if no API key
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return [0.0] * 768

def generate_query_embedding(text: str) -> list:
    """
    Generates query embedding vector.
    """
    if not api_key:
        return [0.0] * 768
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating query embedding: {e}")
        return [0.0] * 768
