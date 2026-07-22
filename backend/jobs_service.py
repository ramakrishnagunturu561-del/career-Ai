import os
import logging
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

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



def fetch_real_jobs(
    query: str = "AI ML Engineer",
    location: str = "India",
    is_internship: bool = False,
    page: int = 1
) -> Dict[str, Any]:
    """
    Fetches real live jobs/internships from configured provider.
    If no API key is configured, returns configured=False cleanly.
    """
    if not is_jobs_service_configured():
        return {
            "success": False,
            "configured": False,
            "message": "Live job service is not configured. Please set JOBS_API_KEY in environment configuration.",
            "results": []
        }

    provider, api_key, app_id, host = get_jobs_config()
    
    # Sensible query fallback to get better results
    normalized_query = query
    if query.lower() == "ai ml engineer":
        normalized_query = "Machine Learning Engineer"
    elif query.lower() == "ai/ml engineer":
        normalized_query = "Machine Learning Engineer"
        
    search_query = f"{normalized_query} intern" if is_internship else normalized_query

    try:
        if provider == "adzuna":
            # Adzuna REST API
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
            
            raw_results = data.get("results", [])
            formatted = []
            for item in raw_results:
                formatted.append({
                    "id": str(item.get("id", "")),
                    "title": item.get("title", "Software Engineer"),
                    "company": item.get("company", {}).get("display_name", "Unknown Company"),
                    "location": item.get("location", {}).get("display_name", location),
                    "description": item.get("description", ""),
                    "type": "Internship" if is_internship else item.get("contract_time", "Full-time"),
                    "source": "Adzuna",
                    "sourceUrl": item.get("redirect_url", ""),
                    "salary": f"₹{item.get('salary_min', 0):,.0f} - ₹{item.get('salary_max', 0):,.0f}" if item.get("salary_min") else None,
                    "postedDate": item.get("created", "")
                })

            return {
                "success": True,
                "configured": True,
                "results": formatted
            }

        elif provider in ["jsearch", "rapidapi"]:
            # JSearch RapidAPI
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

            raw_results = data.get("data", [])
            formatted = []
            for item in raw_results:
                formatted.append({
                    "id": str(item.get("job_id", "")),
                    "title": item.get("job_title", "Software Engineer"),
                    "company": item.get("employer_name", "Unknown Company"),
                    "location": f"{item.get('job_city', '')}, {item.get('job_country', '')}".strip(", "),
                    "description": item.get("job_description", ""),
                    "type": "Internship" if is_internship or item.get("job_employment_type") == "INTERN" else item.get("job_employment_type", "Full-time"),
                    "source": "JSearch",
                    "sourceUrl": item.get("job_apply_link", ""),
                    "salary": item.get("job_min_salary"),
                    "postedDate": item.get("job_posted_at_datetime_utc", "")
                })

            return {
                "success": True,
                "configured": True,
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
        "message": f"Unsupported job provider: {JOBS_API_PROVIDER}",
        "results": []
    }
