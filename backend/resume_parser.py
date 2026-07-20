import fitz
import re

SKILLS = [
    "Python", "Java", "C++", "JavaScript",
    "HTML", "CSS", "React", "Node.js",
    "Express", "FastAPI", "Django", "Flask",

    "Machine Learning", "Deep Learning",
    "Artificial Intelligence", "Generative AI",
    "NLP", "Computer Vision",

    "TensorFlow", "PyTorch", "Scikit-learn",
    "Pandas", "NumPy", "OpenCV", "YOLO",

    "SQL", "MySQL", "PostgreSQL", "MongoDB",

    "AWS", "Azure", "Google Cloud",
    "Docker", "Kubernetes", "Jenkins", "Terraform",

    "Git", "GitHub",

    "LangChain", "RAG", "LLM",
    "Gemini", "OpenAI", "Ollama",

    "Power BI", "Tableau"
]


def extract_text_from_pdf(pdf_path):
    document = fitz.open(pdf_path)
    text = ""

    for page in document:
        text += page.get_text() + "\n"

    document.close()

    return text


def extract_skills(text):
    found_skills = []
    text_lower = text.lower()

    for skill in SKILLS:

        pattern = (
            r"(?<!\w)"
            + re.escape(skill.lower())
            + r"(?!\w)"
        )

        if re.search(pattern, text_lower):
            found_skills.append(skill)

    return sorted(set(found_skills))