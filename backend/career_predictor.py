from pathlib import Path
import joblib
import pandas as pd
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"

print("Loading CareerLens AI model...")

career_classifier = joblib.load(
    MODEL_DIR / "career_classifier.pkl"
)

career_skill_map = joblib.load(
    MODEL_DIR / "career_skill_map.pkl"
)

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

print("CareerLens AI model loaded!")


def predict_career(skills, top_n=3):

    skills_text = " ".join(skills)

    embedding = embedding_model.encode(
        [skills_text],
        normalize_embeddings=True
    )

    probabilities = career_classifier.predict_proba(
        embedding
    )[0]

    results = pd.DataFrame({
        "career": career_classifier.classes_,
        "confidence": probabilities * 100
    })

    results = results.sort_values(
        "confidence",
        ascending=False
    ).head(top_n)

    return {
        "best_career": results.iloc[0]["career"],
        "confidence": float(
            results.iloc[0]["confidence"]
        ),
        "top_careers": results.to_dict(
            orient="records"
        )
    }


def analyze_skill_gap(skills, role):

    required = career_skill_map.get(role, [])

    candidate = {
        skill.lower()
        for skill in skills
    }

    matched = [
        skill for skill in required
        if skill.lower() in candidate
    ]

    missing = [
        skill for skill in required
        if skill.lower() not in candidate
    ]

    coverage = (
        len(matched) / len(required) * 100
        if required else 0
    )

    return {
        "matched": matched,
        "missing": missing,
        "coverage": coverage
    }