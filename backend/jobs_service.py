import os
import html
import re
import logging
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Standard technical skill taxonomy for normalization & matching
TECH_SKILLS_TAXONOMY = [
    "Python", "Java", "C++", "JavaScript", "TypeScript", "HTML", "CSS", "React",
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Machine Learning",
    "Deep Learning", "Artificial Intelligence", "Generative AI", "NLP", "Computer Vision",
    "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "OpenCV", "YOLO",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "AWS", "Azure", "Google Cloud",
    "Docker", "Kubernetes", "Jenkins", "Terraform", "Git", "GitHub", "Power BI", "Tableau"
]


def clean_text(text: str) -> str:
    """
    Cleans malformed character encoding, HTML tags, and mojibake artifacts.
    Preserves valid Unicode.
    """
    if not text:
        return ""
    # 1. HTML unescape (&amp;, &quot;, &#39;, &lt;, &gt;)
    cleaned = html.unescape(text)
    # 2. Remove HTML tags (<strong>, </strong>, <br/>, etc.)
    cleaned = re.sub(r'<[^>]+>', '', cleaned)
    # 3. Fix common Windows-1252 / UTF-8 mojibake patterns
    mojibake_map = {
        "â€™": "'",
        "â€œ": '"',
        "â€\x9d": '"',
        "â€“": "–",
        "â€”": "—",
        "â€¦": "…",
        "â": "",
        "□": "",
        "\u00e2\u0080\u0099": "'",
        "\u00e2\u0080\u009c": '"',
        "\u00e2\u0080\u009d": '"',
        "\u00e2\u0080\u0093": "-",
    }
    for bad, good in mojibake_map.items():
        cleaned = cleaned.replace(bad, good)
    return cleaned.strip()


def get_jobs_config():
    load_dotenv()
    provider = os.getenv("JOBS_API_PROVIDER", "adzuna").lower()
    api_key = os.getenv("JOBS_API_KEY", "")
    app_id = os.getenv("JOBS_API_APP_ID", "")
    host = os.getenv("JOBS_API_HOST", "jsearch.p.rapidapi.com")
    return provider, api_key, app_id, host


def is_jobs_service_configured() -> bool:
    """Checks if a legitimate live jobs provider API key is present."""
    provider, api_key, app_id, _ = get_jobs_config()
    if provider == "adzuna":
        return bool(api_key and app_id and api_key != "YOUR_ACTUAL_API_KEY")
    elif provider in ["jsearch", "rapidapi"]:
        return bool(api_key and api_key != "YOUR_ACTUAL_API_KEY")
    return False


def get_query_fallbacks(query: str) -> List[str]:
    """
    Returns a sequence of sensible fallback search queries for role search.
    Example: AI ML Engineer -> Machine Learning Engineer -> AI Engineer -> Machine Learning -> Artificial Intelligence.
    """
    q_lower = query.lower().strip()
    if any(k in q_lower for k in ["ai ml engineer", "ai/ml engineer", "ai & ml engineer"]):
        return ["Machine Learning Engineer", "AI Engineer", "Machine Learning", "Artificial Intelligence"]
    elif "data scientist" in q_lower:
        return ["Data Scientist", "Data Science", "Machine Learning"]
    elif "generative ai" in q_lower:
        return ["Generative AI", "AI Engineer", "Machine Learning Engineer"]
    elif "cybersecurity" in q_lower:
        return ["Cybersecurity Analyst", "Security Analyst", "Information Security"]
    elif "web developer" in q_lower:
        return ["Frontend Developer", "Web Developer", "Full Stack Developer"]
    
    return [query]


def calculate_dynamic_skill_match(candidate_skills: List[str], job_title: str, job_description: str) -> Dict[str, Any]:
    """
    Calculates meaningful dynamic skill match percentage and matched/missing skills
    by comparing candidate resume skills against real job title and description.
    """
    combined_text = f"{clean_text(job_title)} {clean_text(job_description)}".lower()

    if not candidate_skills:
        return {
            "match_percentage": 50,
            "matched_skills": [],
            "missing_skills": []
        }

    # Normalize and find candidate skill overlap in description
    matched_skills = []
    for skill in candidate_skills:
        s_clean = skill.strip()
        pattern = r"(?<!\w)" + re.escape(s_clean.lower()) + r"(?!\w)"
        if re.search(pattern, combined_text):
            matched_skills.append(s_clean)

    # Extract required job skills from taxonomy present in job text
    job_skills_found = []
    for skill in TECH_SKILLS_TAXONOMY:
        pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"
        if re.search(pattern, combined_text):
            job_skills_found.append(skill)

    all_job_skills = list(set(job_skills_found + matched_skills))

    if all_job_skills:
        overlap_count = len([s for s in all_job_skills if any(cs.lower() == s.lower() for cs in candidate_skills)])
        match_pct = round((overlap_count / len(all_job_skills)) * 100)
    else:
        # Fallback based on ratio of matched candidate skills
        match_pct = round((len(matched_skills) / max(1, len(candidate_skills))) * 100)

    # Clamp match percentage to realistic range [25%, 98%]
    final_match_pct = max(25, min(98, match_pct))

    missing_skills = [s for s in job_skills_found if not any(cs.lower() == s.lower() for cs in candidate_skills)]

    return {
        "match_percentage": final_match_pct,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "job_skills": all_job_skills
    }


def fetch_real_jobs(
    query: str = "AI ML Engineer",
    location: str = "India",
    is_internship: bool = False,
    page: int = 1,
    candidate_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Fetches real live jobs/internships from Adzuna or JSearch API.
    Applies query fallbacks, character cleaning, and dynamic skill matching.
    """
    if not is_jobs_service_configured():
        return {
            "success": False,
            "configured": False,
            "message": "Live job service is not configured. Please set JOBS_API_KEY in environment configuration.",
            "results": []
        }

    provider, api_key, app_id, host = get_jobs_config()
    fallback_queries = get_query_fallbacks(query)

    raw_results = []
    used_query = query

    try:
        if provider == "adzuna":
            for q_term in fallback_queries:
                search_query = f"{q_term} intern" if is_internship else q_term
                url = f"https://api.adzuna.com/v1/api/jobs/in/search/{page}"
                params = {
                    "app_id": app_id,
                    "app_key": api_key,
                    "results_per_page": 10,
                    "what": search_query,
                    "where": location,
                    "content-type": "application/json"
                }
                res = requests.get(url, params=params, timeout=10)
                res.raise_for_status()
                data = res.json()
                items = data.get("results", [])
                if items:
                    raw_results = items
                    used_query = q_term
                    break

            formatted = []
            for item in raw_results:
                clean_title = clean_text(item.get("title", "Software Engineer"))
                clean_company = clean_text(item.get("company", {}).get("display_name", "Unknown Company"))
                clean_loc = clean_text(item.get("location", {}).get("display_name", location))
                clean_desc = clean_text(item.get("description", ""))

                # Dynamic skill match calculation
                match_info = calculate_dynamic_skill_match(candidate_skills or [], clean_title, clean_desc)

                formatted.append({
                    "id": str(item.get("id", "")),
                    "title": clean_title,
                    "company": clean_company,
                    "location": clean_loc,
                    "description": clean_desc,
                    "type": "Internship" if is_internship else clean_text(item.get("contract_time", "Full-time")),
                    "source": "Adzuna",
                    "sourceUrl": item.get("redirect_url", ""),
                    "salary": f"₹{item.get('salary_min', 0):,.0f} - ₹{item.get('salary_max', 0):,.0f}" if item.get("salary_min") else None,
                    "postedDate": item.get("created", ""),
                    "matchPercentage": match_info["match_percentage"],
                    "matchedSkills": match_info["matched_skills"],
                    "missingSkills": match_info["missing_skills"],
                    "requiredSkills": match_info["job_skills"]
                })

            return {
                "success": True,
                "configured": True,
                "query_used": used_query,
                "results": formatted
            }

        elif provider in ["jsearch", "rapidapi"]:
            for q_term in fallback_queries:
                search_query = f"{q_term} intern" if is_internship else q_term
                url = "https://jsearch.p.rapidapi.com/search"
                headers = {
                    "X-RapidAPI-Key": api_key,
                    "X-RapidAPI-Host": host
                }
                params = {
                    "query": f"{search_query} in {location}",
                    "page": str(page),
                    "num_pages": "1"
                }

                res = requests.get(url, headers=headers, params=params, timeout=10)
                res.raise_for_status()
                data = res.json()
                items = data.get("data", [])
                if items:
                    raw_results = items
                    used_query = q_term
                    break

            formatted = []
            for item in raw_results:
                clean_title = clean_text(item.get("job_title", "Software Engineer"))
                clean_company = clean_text(item.get("employer_name", "Unknown Company"))
                clean_loc = clean_text(f"{item.get('job_city', '')}, {item.get('job_country', '')}".strip(", "))
                clean_desc = clean_text(item.get("job_description", ""))

                match_info = calculate_dynamic_skill_match(candidate_skills or [], clean_title, clean_desc)

                formatted.append({
                    "id": str(item.get("job_id", "")),
                    "title": clean_title,
                    "company": clean_company,
                    "location": clean_loc,
                    "description": clean_desc,
                    "type": "Internship" if is_internship or item.get("job_employment_type") == "INTERN" else clean_text(item.get("job_employment_type", "Full-time")),
                    "source": "JSearch",
                    "sourceUrl": item.get("job_apply_link", ""),
                    "salary": item.get("job_min_salary"),
                    "postedDate": item.get("job_posted_at_datetime_utc", ""),
                    "matchPercentage": match_info["match_percentage"],
                    "matchedSkills": match_info["matched_skills"],
                    "missingSkills": match_info["missing_skills"],
                    "requiredSkills": match_info["job_skills"]
                })

            return {
                "success": True,
                "configured": True,
                "query_used": used_query,
                "results": formatted
            }

    except Exception as e:
        logger.error(f"Jobs API request failed: {e}")
        return {
            "success": False,
            "configured": True,
            "message": f"Real-time job provider request failed: {str(e)}",
            "results": []
        }

    return {
        "success": False,
        "configured": False,
        "message": f"Unsupported job provider: {provider}",
        "results": []
    }
