import logging
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# ==========================================
# PATHS & CONSTANTS
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Global lazy cache variables
_classifier = None
_career_skill_map = None
_tokenizer = None
_embedding_model = None
_ml_status = "not_loaded"
_ml_error = None


def get_ml_status() -> str:
    """Returns status of ML model initialization: 'not_loaded', 'loaded', or 'error'."""
    global _ml_status
    return _ml_status


def get_career_classifier():
    """Lazily loads and caches the scikit-learn career classifier & skill map."""
    global _classifier, _career_skill_map, _ml_status, _ml_error

    if _classifier is not None and _career_skill_map is not None:
        return _classifier, _career_skill_map

    try:
        classifier_path = MODEL_DIR / "career_classifier.pkl"
        skill_map_path = MODEL_DIR / "career_skill_map.pkl"

        if not classifier_path.exists() or not skill_map_path.exists():
            raise FileNotFoundError(f"Model files not found in {MODEL_DIR}")

        _classifier = joblib.load(classifier_path)
        _career_skill_map = joblib.load(skill_map_path)
        logger.info("Career classifier loaded successfully.")
        return _classifier, _career_skill_map
    except Exception as e:
        _ml_status = "error"
        _ml_error = str(e)
        logger.error(f"Failed to load career classifier: {e}")
        raise


def get_embedding_model():
    """Lazily loads and caches ONNX embedding model with low-memory CPU configuration."""
    global _tokenizer, _embedding_model, _ml_status, _ml_error

    if _tokenizer is not None and _embedding_model is not None:
        return _tokenizer, _embedding_model

    try:
        import onnxruntime as ort
        from transformers import AutoTokenizer
        from optimum.onnxruntime import ORTModelForFeatureExtraction

        # Conservative ONNX Runtime session configuration for 512MB RAM constraint
        session_options = ort.SessionOptions()
        session_options.intra_op_num_threads = 1
        session_options.inter_op_num_threads = 1
        session_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC

        logger.info(f"Loading ONNX embedding model '{MODEL_NAME}' lazily...")

        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        embedding_model = ORTModelForFeatureExtraction.from_pretrained(
            MODEL_NAME,
            session_options=session_options
        )

        _tokenizer = tokenizer
        _embedding_model = embedding_model
        _ml_status = "loaded"
        logger.info("ONNX embedding model loaded successfully!")
        return _tokenizer, _embedding_model
    except Exception as e:
        _ml_status = "error"
        _ml_error = str(e)
        logger.error(f"Failed to load ONNX embedding model: {e}")
        raise


# ==========================================
# MEAN POOLING
# ==========================================

def mean_pooling(token_embeddings, attention_mask):
    mask = np.expand_dims(attention_mask, axis=-1).astype(np.float32)
    summed = np.sum(token_embeddings * mask, axis=1)
    counts = np.clip(np.sum(mask, axis=1), a_min=1e-9, a_max=None)
    return summed / counts


# ==========================================
# CREATE EMBEDDINGS
# ==========================================

def create_embedding(text):
    tokenizer, embedding_model = get_embedding_model()

    encoded = tokenizer(
        [text],
        padding=True,
        truncation=True,
        max_length=256,
        return_tensors="np"
    )

    outputs = embedding_model(**encoded)
    token_embeddings = outputs.last_hidden_state
    embeddings = mean_pooling(token_embeddings, encoded["attention_mask"])

    # L2 normalization
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / np.clip(norms, a_min=1e-12, a_max=None)
    return embeddings


# ==========================================
# CAREER PREDICTION
# ==========================================

def predict_career(skills, top_n=3):
    if not skills:
        return None

    classifier, _ = get_career_classifier()

    skills_text = " ".join(skills)
    embedding = create_embedding(skills_text)

    probabilities = classifier.predict_proba(embedding)[0]

    results = pd.DataFrame({
        "career": classifier.classes_,
        "confidence": probabilities * 100
    })

    results = results.sort_values("confidence", ascending=False).head(top_n)
    results = results.reset_index(drop=True)

    return {
        "best_career": results.iloc[0]["career"],
        "confidence": float(results.iloc[0]["confidence"]),
        "top_careers": results.to_dict(orient="records")
    }


# ==========================================
# SKILL GAP ANALYSIS
# ==========================================

def analyze_skill_gap(skills, role):
    _, career_skill_map = get_career_classifier()

    required = career_skill_map.get(role, [])
    candidate = {skill.lower() for skill in skills}

    matched = [skill for skill in required if skill.lower() in candidate]
    missing = [skill for skill in required if skill.lower() not in candidate]

    coverage = (len(matched) / len(required) * 100) if required else 0

    return {
        "matched": matched,
        "missing": missing,
        "coverage": round(coverage, 2)
    }