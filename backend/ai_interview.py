import os
import json
import logging
import re
import requests
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_URL = f"{OLLAMA_BASE_URL}/api/chat"
OLLAMA_TAGS_URL = f"{OLLAMA_BASE_URL}/api/tags"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "60"))

# ==========================================
# SKILL DOMAIN CATEGORIZATION
# ==========================================

SKILL_DOMAINS = {
    "AI_ML": {
        "python", "machine learning", "deep learning", "artificial intelligence",
        "generative ai", "nlp", "computer vision", "tensorflow", "pytorch",
        "scikit-learn", "pandas", "numpy", "opencv", "yolo", "langchain",
        "rag", "llm", "ollama", "gemini", "openai"
    },
    "BACKEND": {
        "python", "java", "c++", "javascript", "node.js", "express",
        "fastapi", "django", "flask", "c#", "go"
    },
    "FRONTEND": {
        "html", "css", "javascript", "react", "vue", "angular", "next.js", "tailwind"
    },
    "DATABASE": {
        "sql", "mysql", "postgresql", "mongodb", "redis"
    },
    "CLOUD_TOOLS": {
        "aws", "azure", "google cloud", "docker", "kubernetes", "jenkins",
        "terraform", "git", "github", "power bi", "tableau"
    }
}


def categorize_skills(skills: List[str]) -> Dict[str, List[str]]:
    """Categorizes a list of skills into technical domains."""
    categorized = {
        "AI_ML": [],
        "BACKEND": [],
        "FRONTEND": [],
        "DATABASE": [],
        "CLOUD_TOOLS": []
    }
    for skill in skills:
        s_clean = skill.strip()
        s_lower = s_clean.lower()
        matched_domain = False

        for domain, domain_set in SKILL_DOMAINS.items():
            if s_lower in domain_set:
                categorized[domain].append(s_clean)
                matched_domain = True

        if not matched_domain:
            categorized["BACKEND"].append(s_clean)

    return categorized


def filter_relevant_skills_for_role(skills: List[str], target_role: str) -> List[str]:
    """
    Selects only role-relevant skills for question generation.
    Excludes non-relevant technologies (e.g. CSS/HTML for AI ML Engineer).
    """
    if not skills:
        return []

    categorized = categorize_skills(skills)
    role_lower = target_role.lower()

    if any(kw in role_lower for kw in ["ai", "machine learning", "ml", "data scientist", "nlp", "vision", "generative"]):
        # Prioritize AI/ML, Backend, Database, Cloud
        relevant = categorized["AI_ML"] + categorized["BACKEND"] + categorized["DATABASE"] + categorized["CLOUD_TOOLS"]
        # Exclude purely frontend skills unless role specifically includes frontend
        if not any(kw in role_lower for kw in ["full stack", "frontend", "web"]):
            relevant = [s for s in relevant if s.lower() not in SKILL_DOMAINS["FRONTEND"]]
        return relevant if relevant else skills

    elif any(kw in role_lower for kw in ["frontend", "web developer", "ui"]):
        return categorized["FRONTEND"] + categorized["BACKEND"]

    elif any(kw in role_lower for kw in ["full stack"]):
        return skills

    elif any(kw in role_lower for kw in ["backend", "software engineer", "java", "python"]):
        relevant = categorized["BACKEND"] + categorized["DATABASE"] + categorized["CLOUD_TOOLS"] + categorized["AI_ML"]
        if not any(kw in role_lower for kw in ["full stack", "frontend"]):
            relevant = [s for s in relevant if s.lower() not in SKILL_DOMAINS["FRONTEND"]]
        return relevant if relevant else skills

    return skills


def sanitize_and_validate_questions(questions: List[str], target_role: str) -> List[str]:
    """
    Validates and fixes technically incongruous question combinations
    (e.g., 'Machine Learning pipeline using CSS' -> 'Machine Learning pipeline using Python').
    """
    role_lower = target_role.lower()
    is_aiml_role = any(kw in role_lower for kw in ["ai", "machine", "ml", "data scientist", "generative", "nlp"])

    cleaned_questions = []

    for q in questions:
        q_str = str(q).strip()

        if is_aiml_role:
            # Fix nonsensical pairings where frontend tech is combined with ML pipeline/model training
            # Matches: pipeline using CSS, neural network using HTML, ML using CSS, etc.
            q_str = re.sub(
                r'(pipeline|neural network|ml model|machine learning model|classifier|deep learning|nlp model|training)\s+(using|with|in)\s+(CSS|HTML|React|CSS3|HTML5)',
                r'\1 using Python and Scikit-learn',
                q_str,
                flags=re.IGNORECASE
            )
            # Fix standalone forced CSS/HTML references in core ML context
            if any(term in q_str.lower() for term in ["machine learning", "deep learning", "neural network", "pipeline", "model training"]):
                q_str = re.sub(r'\bCSS\b', 'Python', q_str)
                q_str = re.sub(r'\bHTML\b', 'Python', q_str)

        cleaned_questions.append(q_str)

    return cleaned_questions


def check_ollama_health() -> Dict[str, Any]:
    """Checks whether Ollama local service is running and model llama3.2:3b is available."""
    try:
        res = requests.get(OLLAMA_TAGS_URL, timeout=5)
        if res.status_code == 200:
            models = res.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            has_target = any(OLLAMA_MODEL in name for name in model_names)
            return {
                "online": True,
                "model_available": has_target,
                "target_model": OLLAMA_MODEL,
                "available_models": model_names
            }
    except Exception as e:
        logger.warning(f"Ollama health check failed: {e}")

    return {
        "online": False,
        "model_available": False,
        "target_model": OLLAMA_MODEL,
        "available_models": []
    }


def generate_interview_questions(skills: List[str], target_role: str, difficulty: str = "intermediate") -> Dict[str, Any]:
    """
    Generates 5 role-aware, domain-filtered interview questions using Ollama llama3.2:3b.
    Enforces balanced categories and strict prompt instructions against nonsensical skill combinations.
    """
    relevant_skills = filter_relevant_skills_for_role(skills, target_role)
    skills_str = ", ".join(relevant_skills) if relevant_skills else "Core domain programming skills"

    system_prompt = (
        "You are a senior technical interviewer conducting an interview for a software professional. "
        "CRITICAL RULE: Only combine technologies that have a technically meaningful relationship. "
        "Never force a resume skill into a question simply because it appears in the candidate's skill list. "
        "Select skills based on relevance to the target role and question topic. "
        "Never generate nonsensical combinations such as using frontend styling (HTML/CSS) to build ML pipelines, "
        "train neural networks, or query databases unless the question specifically concerns full-stack integration. "
        "Return valid JSON only."
    )

    user_prompt = f"""Candidate Target Role: {target_role}
Candidate Relevant Skills: {skills_str}
Target Difficulty Level: {difficulty}

Task: Generate exactly 5 realistic, technical, and role-appropriate interview questions with the following balanced category structure:

1. Core Concept Question: Fundamental concepts relevant to {target_role}
2. Practical Coding/Technical Question: Hands-on implementation or coding scenario using relevant tools ({skills_str})
3. Model/System Architecture Question: Design, training, optimization, or architectural trade-offs
4. Project or Deployment Scenario: Deployment, CI/CD, MLOps, or real-world execution
5. Problem-Solving / System-Design Question: High-level system design or troubleshooting under constraints

Return ONLY a valid JSON object matching this exact schema:
{{
  "questions": [
    "Question 1 (Core Concept)...",
    "Question 2 (Practical Coding)...",
    "Question 3 (Architecture/Model)...",
    "Question 4 (Project/Deployment)...",
    "Question 5 (System Design)..."
  ]
}}
"""
    try:
        res = requests.post(
            OLLAMA_CHAT_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "format": "json",
                "stream": False
            },
            timeout=OLLAMA_TIMEOUT
        )
        res.raise_for_status()
        content = res.json().get("message", {}).get("content", "")
        data = json.loads(content)

        raw_qs = data.get("questions", [])
        if isinstance(raw_qs, list) and len(raw_qs) >= 5:
            validated_qs = sanitize_and_validate_questions([str(q).strip() for q in raw_qs[:5]], target_role)
            return {
                "questions": validated_qs,
                "is_llm": True,
                "model": OLLAMA_MODEL
            }
    except Exception as e:
        logger.warning(f"Ollama question generation failed: {e}")

    # Role-appropriate deterministic fallback bank
    role_lower = target_role.lower()
    if any(kw in role_lower for kw in ["ai", "machine", "ml", "data scientist", "nlp", "generative"]):
        py_skill = next((s for s in relevant_skills if "python" in s.lower()), "Python")
        ml_skill = next((s for s in relevant_skills if "scikit" in s.lower() or "tensor" in s.lower() or "torch" in s.lower()), "Scikit-learn")
        fallback_qs = [
            f"What is the difference between supervised and unsupervised learning, and how do you decide which to use for {target_role}?",
            f"Explain how you would implement and evaluate a baseline Machine Learning classifier using {py_skill} and {ml_skill}.",
            "Explain overfitting, underfitting, and how regularization techniques (L1/L2, Dropout) address them.",
            f"Walk me through deploying a trained model as a REST API microservice using {next((s for s in relevant_skills if 'fastapi' in s.lower() or 'flask' in s.lower()), 'FastAPI')}.",
            "How do you monitor and handle data drift or performance degradation of a deployed model in production?"
        ]
    elif any(kw in role_lower for kw in ["full stack", "web"]):
        fallback_qs = [
            "Explain the difference between client-side rendering and server-side rendering in modern web applications.",
            "How do you handle state management and REST API communication between a React frontend and Node/Python backend?",
            "What security measures do you implement to prevent XSS, CSRF, and SQL injection in full-stack applications?",
            "Describe how you design relational database schemas and optimize query performance using indexing.",
            "How would you architect a scalable full-stack application with authentication, caching, and CI/CD deployment?"
        ]
    else:
        fallback_qs = [
            f"Explain core object-oriented principles and software design patterns relevant to {target_role}.",
            "What is the difference between concurrency and parallelism, and how do you handle thread safety?",
            "How do you design RESTful APIs for high availability and low latency?",
            "Walk me through your strategy for automated unit testing, integration testing, and CI/CD pipelines.",
            "Describe a high-level system design for a rate-limited API gateway handling high traffic."
        ]

    validated_fallback = sanitize_and_validate_questions(fallback_qs, target_role)

    return {
        "questions": validated_fallback,
        "is_llm": False,
        "model": "role_aware_fallback_bank"
    }


def evaluate_interview_answer(question: str, answer: str, target_role: str = "Software Engineer", difficulty: str = "intermediate") -> Dict[str, Any]:
    """Evaluates candidate's actual answer using Ollama llama3.2:3b."""
    if not answer or not answer.strip():
        return {
            "score": 0.0,
            "technical_accuracy": 0.0,
            "relevance": 0.0,
            "clarity": 0.0,
            "strengths": ["No answer was submitted."],
            "improvements": ["Please provide a complete spoken or typed answer."],
            "feedback": "Answer was empty.",
            "suggested_answer": f"A standard answer to '{question}' should clearly define the core concept, provide a practical implementation detail, and discuss trade-offs.",
            "is_llm": False,
            "model": "none"
        }

    prompt = f"""You are an expert technical interviewer evaluating a job candidate's actual response.
Target Role: {target_role}
Difficulty Level: {difficulty}

Question Asked: {question}
Candidate Answer: {answer}

Task: Evaluate the candidate's answer thoroughly and strictly.
1. Provide an overall score from 1.0 to 10.0 based on technical accuracy, relevance, and clarity.
2. Provide individual sub-scores for technical_accuracy (1-10), relevance (1-10), and clarity (1-10).
3. List 2 to 3 specific strengths of their answer.
4. List 1 to 3 specific areas for technical improvement.
5. Provide a constructive feedback summary.
6. Provide an ideal suggested answer.

Return ONLY a valid JSON object matching this exact schema:
{{
  "score": 8.0,
  "technical_accuracy": 8.5,
  "relevance": 9.0,
  "clarity": 7.5,
  "strengths": ["Clear definition of core terms", "Addressed the primary question directly"],
  "improvements": ["Include a concrete practical example", "Discuss performance or trade-off implications"],
  "feedback": "Solid conceptual understanding, but would benefit from real-world project context.",
  "suggested_answer": "A comprehensive answer should state..."
}}
"""
    try:
        res = requests.post(
            OLLAMA_CHAT_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": "You are an expert technical evaluator. Respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "format": "json",
                "stream": False
            },
            timeout=OLLAMA_TIMEOUT
        )
        res.raise_for_status()
        content = res.json().get("message", {}).get("content", "")
        data = json.loads(content)

        def clamp(val, default=7.0):
            try:
                num = float(val)
                return max(1.0, min(10.0, round(num, 1)))
            except (TypeError, ValueError):
                return default

        score = clamp(data.get("score"), 7.0)
        acc = clamp(data.get("technical_accuracy"), score)
        rel = clamp(data.get("relevance"), score)
        cla = clamp(data.get("clarity"), score)

        strengths = [str(s) for s in data.get("strengths", []) if s]
        if not strengths:
            strengths = ["Directly addressed the technical question"]

        improvements = [str(i) for i in data.get("improvements", []) if i]
        if not improvements:
            improvements = ["Elaborate further with project implementation examples"]

        suggested = str(data.get("suggested_answer", "A complete answer covers core theory, execution details, and production trade-offs."))

        return {
            "score": score,
            "technical_accuracy": acc,
            "relevance": rel,
            "clarity": cla,
            "strengths": strengths,
            "improvements": improvements,
            "feedback": str(data.get("feedback", "Answer evaluated successfully.")),
            "suggested_answer": suggested,
            "is_llm": True,
            "model": OLLAMA_MODEL
        }

    except Exception as e:
        logger.warning(f"Ollama answer evaluation failed: {e}")

    # Transparent deterministic fallback when Ollama service is unreachable
    words = len(answer.strip().split())
    tech_keywords = ["python", "model", "data", "system", "process", "code", "algorithm", "function", "api", "database", "service", "train", "test", "optim"]
    keyword_count = sum(1 for kw in tech_keywords if kw in answer.lower())

    calc_score = max(3.0, min(9.0, round(3.0 + (words / 15.0) + (keyword_count * 0.4), 1)))

    return {
        "score": calc_score,
        "technical_accuracy": calc_score,
        "relevance": calc_score,
        "clarity": max(3.0, min(9.0, round(words / 12.0, 1))),
        "strengths": ["Structured initial attempt at answering"],
        "improvements": [
            "Provide deeper technical specifics and real-world project context",
            "Discuss architectural trade-offs and edge cases"
        ],
        "feedback": "Evaluated using deterministic rule engine because local Ollama LLM was unreachable.",
        "suggested_answer": f"A strong response to '{question}' should define core concepts, detail implementation steps, and analyze performance trade-offs.",
        "is_llm": False,
        "model": "deterministic_eval"
    }


def generate_personalized_roadmap(
    target_role: str,
    skills_detected: List[str],
    matched_skills: List[str],
    missing_skills: List[str],
    coverage: float
) -> Dict[str, Any]:
    """Generates structured 6-stage personalized learning roadmap using Ollama llama3.2:3b."""
    
    prompt = f"""You are a principal tech career architect.
Target Role: {target_role}
Candidate Current Skills: {', '.join(skills_detected) if skills_detected else 'Basic Technical Knowledge'}
Matched Skills: {', '.join(matched_skills) if matched_skills else 'None'}
Missing Skills: {', '.join(missing_skills) if missing_skills else 'Advanced Domain Skills'}
Skill Coverage: {coverage}%

Task: Generate a personalized 6-stage career roadmap to help this candidate master the missing skills and achieve role readiness.

Return ONLY a valid JSON object matching this exact schema:
{{
  "stages": [
    {{
      "stage": 1,
      "title": "Stage 1 — Core Foundation",
      "duration": "2-3 Weeks",
      "focus_skills": ["Skill A", "Skill B"],
      "action_items": ["Action 1", "Action 2"],
      "milestone_project": "Build a..."
    }},
    {{
      "stage": 2,
      "title": "Stage 2 — Core Technical Skills",
      "duration": "3-4 Weeks",
      "focus_skills": ["Skill C"],
      "action_items": ["Action 1"],
      "milestone_project": "Develop a..."
    }},
    {{
      "stage": 3,
      "title": "Stage 3 — Advanced Domain Expertise",
      "duration": "4 Weeks",
      "focus_skills": ["Skill D"],
      "action_items": ["Action 1"],
      "milestone_project": "Implement..."
    }},
    {{
      "stage": 4,
      "title": "Stage 4 — Hands-On Portfolio Projects",
      "duration": "3 Weeks",
      "focus_skills": ["End-to-End System"],
      "action_items": ["Action 1"],
      "milestone_project": "Deploy..."
    }},
    {{
      "stage": 5,
      "title": "Stage 5 — Technical Interview Prep",
      "duration": "2 Weeks",
      "focus_skills": ["System Design", "Algorithms"],
      "action_items": ["Action 1"],
      "milestone_project": "Mock Interviews..."
    }},
    {{
      "stage": 6,
      "title": "Stage 6 — Job & Internship Readiness",
      "duration": "Ongoing",
      "focus_skills": ["Resume Polish", "Portfolio Deployment"],
      "action_items": ["Action 1"],
      "milestone_project": "Apply to real roles..."
    }}
  ]
}}
"""
    try:
        res = requests.post(
            OLLAMA_CHAT_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a technical career advisor. Respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "format": "json",
                "stream": False
            },
            timeout=OLLAMA_TIMEOUT
        )
        res.raise_for_status()
        content = res.json().get("message", {}).get("content", "")
        data = json.loads(content)
        stages = data.get("stages", [])
        if isinstance(stages, list) and len(stages) >= 4:
            return {
                "success": True,
                "stages": stages,
                "is_llm": True,
                "model": OLLAMA_MODEL
            }
    except Exception as e:
        logger.warning(f"Ollama roadmap generation failed: {e}")

    # Deterministic 6-stage roadmap fallback
    default_missing = missing_skills if missing_skills else ["Advanced Architecture", "System Design", "Cloud Deployment"]
    
    stages = [
        {
            "stage": 1,
            "title": "Stage 1 — Core Foundation",
            "duration": "2 Weeks",
            "focus_skills": matched_skills[:3] if matched_skills else ["Fundamentals"],
            "action_items": ["Review core programming patterns and syntax", "Strengthen baseline data structures"],
            "milestone_project": "Refactor baseline projects for production readiness"
        },
        {
            "stage": 2,
            "title": "Stage 2 — Essential Missing Skills",
            "duration": "3 Weeks",
            "focus_skills": default_missing[:2],
            "action_items": [f"Complete practical hands-on exercises in {skill}" for skill in default_missing[:2]],
            "milestone_project": f"Build a modular library using {default_missing[0] if default_missing else 'Core Skill'}"
        },
        {
            "stage": 3,
            "title": "Stage 3 — Advanced Domain Expertise",
            "duration": "4 Weeks",
            "focus_skills": default_missing[2:4] if len(default_missing) > 2 else ["System Optimization"],
            "action_items": ["Implement end-to-end data/ML workflows", "Benchmark performance and optimize latency"],
            "milestone_project": "Build an end-to-end full-stack AI feature pipeline"
        },
        {
            "stage": 4,
            "title": "Stage 4 — Portfolio & Production Deployment",
            "duration": "3 Weeks",
            "focus_skills": ["Docker", "API Integration", "CI/CD"],
            "action_items": ["Containerize applications with Docker", "Deploy APIs to cloud infrastructure"],
            "milestone_project": "Deploy live interactive portfolio project"
        },
        {
            "stage": 5,
            "title": "Stage 5 — Technical Interview Preparation",
            "duration": "2 Weeks",
            "focus_skills": ["System Design", "Behavioral & Technical Questions"],
            "action_items": ["Practice role-specific questions on CareerLens AI", "Conduct mock technical interviews"],
            "milestone_project": "Complete 5 CareerLens AI mock interview sessions"
        },
        {
            "stage": 6,
            "title": "Stage 6 — Job Readiness & Application",
            "duration": "Ongoing",
            "focus_skills": ["Resume Alignment", "Opportunity Tracking"],
            "action_items": ["Tailor resume skills to matched job openings", "Track applications systematically"],
            "milestone_project": "Submit applications for matched career roles"
        }
    ]

    return {
        "success": True,
        "stages": stages,
        "is_llm": False,
        "model": "deterministic_fallback"
    }
