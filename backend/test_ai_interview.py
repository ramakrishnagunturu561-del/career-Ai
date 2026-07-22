from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_start_interview_endpoint():
    print("\n[TEST] Testing /ai-interview/start endpoint...")
    response = client.post(
        "/ai-interview/start",
        json={
            "skills": ["Python", "SQL", "PyTorch"],
            "predicted_career": "Data Scientist",
            "difficulty": "intermediate"
        }
    )
    print("Status Code:", response.status_code)
    data = response.json()
    print("Response:", data)
    assert response.status_code == 200
    assert data["success"] is True
    assert len(data["questions"]) == 5
    print("[OK] /ai-interview/start passed successfully!")

def test_evaluate_answer_endpoint():
    print("\n[TEST] Testing /ai-interview/evaluate endpoint...")
    response = client.post(
        "/ai-interview/evaluate",
        json={
            "question": "What is overfitting and how do you prevent it?",
            "answer": "Overfitting happens when a model fits training data too closely. We prevent it using dropout, regularization, and cross validation.",
            "target_role": "Data Scientist",
            "difficulty": "intermediate"
        }
    )
    print("Status Code:", response.status_code)
    data = response.json()
    print("Response:", data)
    assert response.status_code == 200
    assert data["success"] is True
    assert "score" in data
    assert len(data["strengths"]) > 0
    assert len(data["improvements"]) > 0
    assert "suggested_answer" in data
    print("[OK] /ai-interview/evaluate passed successfully!")


if __name__ == "__main__":
    test_start_interview_endpoint()
    test_evaluate_answer_endpoint()
