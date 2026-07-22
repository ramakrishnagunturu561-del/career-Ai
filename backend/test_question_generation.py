import sys
from ai_interview import generate_interview_questions, filter_relevant_skills_for_role

test_skills = ["Python", "Machine Learning", "Deep Learning", "FastAPI", "React", "HTML", "CSS", "SQL", "Git", "TensorFlow", "Pandas", "Scikit-learn"]

roles_to_test = [
    "AI ML Engineer",
    "Full Stack Developer",
    "Generative AI Engineer"
]

print("\n=======================================================", flush=True)
print("TESTING ROLE-AWARE QUESTION GENERATION SYSTEM", flush=True)
print("=======================================================\n", flush=True)

print("Candidate Detected Skills (Raw):", test_skills, flush=True)

for role in roles_to_test:
    print(f"\n-------------------------------------------------------", flush=True)
    print(f"TARGET ROLE: {role}", flush=True)
    filtered = filter_relevant_skills_for_role(test_skills, role)
    print(f"Filtered Relevant Skills for Prompt: {filtered}", flush=True)
    print("-------------------------------------------------------", flush=True)
    
    result = generate_interview_questions(skills=test_skills, target_role=role, difficulty="intermediate")
    print(f"Model Used: {result.get('model')} (is_llm: {result.get('is_llm')})\n", flush=True)
    print("Generated Questions:", flush=True)
    for idx, q in enumerate(result.get("questions", []), 1):
        print(f"  {idx}. {q}", flush=True)
        
        # Verify no nonsensical pairings
        if "ai" in role.lower() or "generative" in role.lower() or "machine" in role.lower():
            assert not ("pipeline using css" in q.lower() or "pipeline using html" in q.lower()), f"INCONGRUOUS QUESTION DETECTED: {q}"

print("\n=======================================================", flush=True)
print("ALL ROLE-AWARE QUESTION GENERATION VERIFICATIONS PASSED!", flush=True)
print("=======================================================\n", flush=True)
