import sys
from pathlib import Path
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_all_backend_tests():
    print("\n==========================================", flush=True)
    print("RUNNING CAREERLENS AI BACKEND VERIFICATION", flush=True)
    print("==========================================\n", flush=True)

    # 1. GET /
    res = client.get("/")
    assert res.status_code == 200
    print("[PASS] GET / ->", res.json(), flush=True)

    # 2. GET /health (before ML load)
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json().get("ml_model") == "not_loaded"
    print("[PASS] GET /health (before ML load) ->", res.json(), flush=True)

    # 3. GET /ai-interview/health
    res = client.get("/ai-interview/health")
    assert res.status_code == 200
    print("[PASS] GET /ai-interview/health ->", res.json(), flush=True)

    # 4. POST /analyze-resume
    pdf_path = Path(__file__).resolve().parent.parent / "test_resume.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post("/analyze-resume", files={"file": ("test_resume.pdf", f, "application/pdf")})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    print(f"[PASS] POST /analyze-resume -> Role: {data['best_career']['role']} ({data['best_career']['confidence']}%), Skills: {len(data['skills_detected'])}", flush=True)

    # 4b. GET /health (after ML load)
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json().get("ml_model") == "loaded"
    print("[PASS] GET /health (after ML load) ->", res.json(), flush=True)

    # 5. POST /generate-roadmap
    res = client.post("/generate-roadmap", json={
        "target_role": data['best_career']['role'],
        "skills_detected": data['skills_detected'],
        "matched_skills": data['skill_gap']['matched_skills'],
        "missing_skills": data['skill_gap']['missing_skills'],
        "coverage": data['skill_gap']['coverage']
    })
    assert res.status_code == 200
    roadmap_data = res.json()
    assert roadmap_data["success"] is True
    assert len(roadmap_data["stages"]) >= 4
    print(f"[PASS] POST /generate-roadmap -> {len(roadmap_data['stages'])} stages generated (LLM: {roadmap_data['is_llm']})", flush=True)

    # 6. POST /ai-interview/start
    res = client.post("/ai-interview/start", json={
        "skills": data['skills_detected'],
        "target_role": data['best_career']['role'],
        "difficulty": "intermediate"
    })
    assert res.status_code == 200
    interview_start = res.json()
    assert interview_start["success"] is True
    assert len(interview_start["questions"]) == 5
    print(f"[PASS] POST /ai-interview/start -> 5 Questions generated (LLM: {interview_start['is_llm']})", flush=True)

    # 7. POST /ai-interview/evaluate
    res = client.post("/ai-interview/evaluate", json={
        "question": interview_start["questions"][0],
        "answer": "To prevent overfitting in neural networks, I use dropout layers, L2 weight regularization, early stopping based on validation loss, and data augmentation.",
        "target_role": data['best_career']['role'],
        "difficulty": "intermediate"
    })
    assert res.status_code == 200
    eval_data = res.json()
    assert eval_data["success"] is True
    assert "score" in eval_data
    print(f"[PASS] POST /ai-interview/evaluate -> Score: {eval_data['score']}/10 (LLM: {eval_data['is_llm']})", flush=True)

    # 8. GET /jobs
    res = client.get("/jobs?role=AI+ML+Engineer&skills=Python,Machine+Learning,TensorFlow")
    assert res.status_code == 200
    jobs_data = res.json()
    print(f"[PASS] GET /jobs -> Configured: {jobs_data['configured']}, Results count: {len(jobs_data['results'])}", flush=True)
    if jobs_data["results"]:
        j0 = jobs_data["results"][0]
        print(f"       Top Job: {j0['title']} at {j0['company']} (Match: {j0['matchPercentage']}%)", flush=True)

    # 9. GET /internships
    res = client.get("/internships?role=AI+ML+Engineer&skills=Python,Machine+Learning,TensorFlow")
    assert res.status_code == 200
    intern_data = res.json()
    print(f"[PASS] GET /internships -> Configured: {intern_data['configured']}, Results count: {len(intern_data['results'])}", flush=True)
    if intern_data["results"]:
        i0 = intern_data["results"][0]
        print(f"       Top Internship: {i0['title']} at {i0['company']} (Match: {i0['matchPercentage']}%)", flush=True)

    print("\n==========================================", flush=True)
    print("ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!", flush=True)
    print("==========================================\n", flush=True)

if __name__ == "__main__":
    run_all_backend_tests()
