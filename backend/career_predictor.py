from pathlib import Path

import joblib
import pandas as pd
import numpy as np

from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForFeatureExtraction


# ==========================================
# PATHS
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# ==========================================
# LOAD CAREER CLASSIFIER
# ==========================================

print("Loading CareerLens AI classifier...")

career_classifier = joblib.load(
    MODEL_DIR / "career_classifier.pkl"
)

career_skill_map = joblib.load(
    MODEL_DIR / "career_skill_map.pkl"
)

print("Career classifier loaded!")


# ==========================================
# LOAD ONNX EMBEDDING MODEL
# ==========================================

print("Loading ONNX embedding model...")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME
)

embedding_model = ORTModelForFeatureExtraction.from_pretrained(
    MODEL_NAME
)
print("ONNX embedding model loaded!")

print(
    "CareerLens AI model ready!"
)


# ==========================================
# MEAN POOLING
# ==========================================

def mean_pooling(
    token_embeddings,
    attention_mask
):

    mask = np.expand_dims(
        attention_mask,
        axis=-1
    ).astype(np.float32)

    summed = np.sum(
        token_embeddings * mask,
        axis=1
    )

    counts = np.clip(
        np.sum(mask, axis=1),
        a_min=1e-9,
        a_max=None
    )

    return summed / counts


# ==========================================
# CREATE EMBEDDINGS
# ==========================================

def create_embedding(text):

    encoded = tokenizer(
        [text],
        padding=True,
        truncation=True,
        max_length=256,
        return_tensors="np"
    )

    outputs = embedding_model(
        **encoded
    )

    token_embeddings = (
        outputs.last_hidden_state
    )

    embeddings = mean_pooling(
        token_embeddings,
        encoded["attention_mask"]
    )

    # L2 normalization
    norms = np.linalg.norm(
        embeddings,
        axis=1,
        keepdims=True
    )

    embeddings = (
        embeddings /
        np.clip(
            norms,
            a_min=1e-12,
            a_max=None
        )
    )

    return embeddings


# ==========================================
# CAREER PREDICTION
# ==========================================

def predict_career(
    skills,
    top_n=3
):

    if not skills:

        return None

    skills_text = " ".join(
        skills
    )

    embedding = create_embedding(
        skills_text
    )

    probabilities = (
        career_classifier.predict_proba(
            embedding
        )[0]
    )

    results = pd.DataFrame({

        "career":
            career_classifier.classes_,

        "confidence":
            probabilities * 100
    })

    results = results.sort_values(
        "confidence",
        ascending=False
    ).head(top_n)

    results = results.reset_index(
        drop=True
    )

    return {

        "best_career":
            results.iloc[0]["career"],

        "confidence":
            float(
                results.iloc[0][
                    "confidence"
                ]
            ),

        "top_careers":
            results.to_dict(
                orient="records"
            )
    }


# ==========================================
# SKILL GAP ANALYSIS
# ==========================================

def analyze_skill_gap(
    skills,
    role
):

    required = career_skill_map.get(
        role,
        []
    )

    candidate = {
        skill.lower()
        for skill in skills
    }

    matched = [

        skill

        for skill in required

        if skill.lower()
        in candidate
    ]

    missing = [

        skill

        for skill in required

        if skill.lower()
        not in candidate
    ]

    coverage = (

        len(matched)
        / len(required)
        * 100

        if required

        else 0
    )

    return {

        "matched":
            matched,

        "missing":
            missing,

        "coverage":
            round(
                coverage,
                2
            )
    }