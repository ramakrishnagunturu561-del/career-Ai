from pathlib import Path
import shutil
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from resume_parser import (
    extract_text_from_pdf,
    extract_skills
)

from career_predictor import (
    predict_career,
    analyze_skill_gap
)


app = FastAPI(
    title="CareerLens AI API",
    description="AI Career Analysis and Recommendation API",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():

    return {
        "message": "CareerLens AI API is running",
        "status": "success"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


@app.post("/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...)
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume."
        )

    temp_path = None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf"
        ) as temp_file:

            shutil.copyfileobj(
                file.file,
                temp_file
            )

            temp_path = Path(
                temp_file.name
            )

        # Extract resume text
        resume_text = extract_text_from_pdf(
            str(temp_path)
        )

        if not resume_text.strip():

            raise HTTPException(
                status_code=400,
                detail="Could not extract text from resume."
            )

        # Detect skills
        skills = extract_skills(
            resume_text
        )

        if not skills:

            raise HTTPException(
                status_code=400,
                detail="No supported skills detected."
            )

        # Career prediction
        prediction = predict_career(
            skills
        )

        if not prediction:

            raise HTTPException(
                status_code=500,
                detail="Career prediction failed."
            )

        # Skill gap
        skill_gap = analyze_skill_gap(
            skills,
            prediction["best_career"]
        )

        return {

            "success": True,

            "filename":
                file.filename,

            "skills_detected":
                skills,

            "total_skills":
                len(skills),

            "best_career": {
                "role":
                    prediction["best_career"],

                "confidence":
                    round(
                        prediction["confidence"],
                        2
                    )
            },

            "top_careers":
                prediction["top_careers"],

            "skill_gap": {
                "coverage":
                    skill_gap["coverage"],

                "matched_skills":
                    skill_gap["matched"],

                "missing_skills":
                    skill_gap["missing"]
            }
        }

    finally:

        await file.close()

        if (
            temp_path is not None
            and temp_path.exists()
        ):
            temp_path.unlink(
                missing_ok=True
            )