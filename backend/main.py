import os
import logging
from pathlib import Path
import shutil
import tempfile
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load .env environment variables
load_dotenv()

from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

from resume_parser import (
    extract_text_from_pdf,
    extract_skills
)

from career_predictor import (
    predict_career,
    analyze_skill_gap,
    get_ml_status
)

from ai_interview import (
    check_ollama_health,
    generate_interview_questions,
    evaluate_interview_answer,
    generate_personalized_roadmap
)

from jobs_service import (
    fetch_real_jobs,
    is_jobs_service_configured
)

app = FastAPI(
    title="CareerLens AI API",
    description="AI Career Analysis, Real-Time Opportunity Discovery, and AI Interview Platform API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models
class StartInterviewRequest(BaseModel):
    skills: List[str] = []
    predicted_career: Optional[str] = "Software Engineer"
    target_role: Optional[str] = None
    difficulty: str = "intermediate"


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    target_role: Optional[str] = "Software Engineer"
    difficulty: str = "intermediate"


class GenerateRoadmapRequest(BaseModel):
    target_role: str
    skills_detected: List[str] = []
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    coverage: float = 0.0


@app.get("/")
def home():
    return {
        "message": "CareerLens AI API is running",
        "status": "success"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "ml_model": get_ml_status()
    }


@app.get("/ai-interview/health")
def ai_interview_health():
    """Returns status of local Ollama AI service."""
    return check_ollama_health()


@app.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF resume.")

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = Path(temp_file.name)

        # Extract resume text
        resume_text = extract_text_from_pdf(str(temp_path))

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF resume.")

        # Detect skills
        skills = extract_skills(resume_text)

        if not skills:
            raise HTTPException(status_code=400, detail="No supported technical skills detected in resume.")

        # ML Career prediction with resource error handling
        try:
            prediction = predict_career(skills)
        except Exception as e:
            logger.error(f"Career prediction failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"ML Model initialization or prediction error: {str(e)}"
            )

        if not prediction:
            raise HTTPException(status_code=500, detail="Career prediction failed.")

        # Skill gap analysis
        try:
            skill_gap = analyze_skill_gap(skills, prediction["best_career"])
        except Exception as e:
            logger.error(f"Skill gap analysis failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Skill gap analysis error: {str(e)}"
            )

        return {
            "success": True,
            "filename": file.filename,
            "skills_detected": skills,
            "total_skills": len(skills),
            "best_career": {
                "role": prediction["best_career"],
                "confidence": round(prediction["confidence"], 2)
            },
            "top_careers": prediction["top_careers"],
            "skill_gap": {
                "coverage": skill_gap["coverage"],
                "matched_skills": skill_gap["matched"],
                "missing_skills": skill_gap["missing"]
            }
        }

    finally:
        await file.close()
        if temp_path is not None and temp_path.exists():
            temp_path.unlink(missing_ok=True)


@app.post("/generate-roadmap")
def generate_roadmap_endpoint(req: GenerateRoadmapRequest):
    """Generates personalized multi-stage learning roadmap using Ollama."""
    res = generate_personalized_roadmap(
        target_role=req.target_role,
        skills_detected=req.skills_detected,
        matched_skills=req.matched_skills,
        missing_skills=req.missing_skills,
        coverage=req.coverage
    )
    return res


@app.post("/ai-interview/start")
def start_ai_interview(request: StartInterviewRequest):
    role = request.target_role or request.predicted_career or "Software Engineer"
    result = generate_interview_questions(
        skills=request.skills,
        target_role=role,
        difficulty=request.difficulty
    )
    return {
        "success": True,
        "target_role": role,
        "difficulty": request.difficulty,
        "questions": result["questions"],
        "is_llm": result["is_llm"],
        "model": result.get("model", "llama3.2:3b")
    }


@app.post("/ai-interview/evaluate")
def evaluate_ai_interview(request: EvaluateAnswerRequest):
    result = evaluate_interview_answer(
        question=request.question,
        answer=request.answer,
        target_role=request.target_role or "Software Engineer",
        difficulty=request.difficulty
    )
    return {
        "success": True,
        "score": result["score"],
        "technical_accuracy": result.get("technical_accuracy", result["score"]),
        "relevance": result.get("relevance", result["score"]),
        "clarity": result.get("clarity", result["score"]),
        "strengths": result["strengths"],
        "improvements": result["improvements"],
        "feedback": result.get("feedback", "Evaluation complete"),
        "suggested_answer": result["suggested_answer"],
        "suggestedAnswer": result["suggested_answer"],
        "is_llm": result["is_llm"],
        "model": result.get("model", "llama3.2:3b")
    }


@app.get("/jobs")
def get_jobs_endpoint(
    role: str = Query("AI ML Engineer"),
    location: str = Query("India"),
    page: int = Query(1),
    skills: Optional[str] = Query(None)
):
    """Fetches real-time jobs from backend provider service abstraction."""
    skills_list = [s.strip() for s in skills.split(",")] if skills else []
    return fetch_real_jobs(query=role, location=location, is_internship=False, page=page, candidate_skills=skills_list)


@app.get("/internships")
def get_internships_endpoint(
    role: str = Query("AI ML Engineer"),
    location: str = Query("India"),
    page: int = Query(1),
    skills: Optional[str] = Query(None)
):
    """Fetches real-time internships from backend provider service abstraction."""
    skills_list = [s.strip() for s in skills.split(",")] if skills else []
    return fetch_real_jobs(query=role, location=location, is_internship=True, page=page, candidate_skills=skills_list)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)