from pathlib import Path

from resume_parser import (
    extract_text_from_pdf,
    extract_skills
)

from career_predictor import (
    predict_career,
    analyze_skill_gap
)

BASE_DIR = Path(__file__).resolve().parent.parent
resume_path = BASE_DIR / "test_resume.pdf"

print("\nAnalyzing Resume...")

text = extract_text_from_pdf(
    str(resume_path)
)

skills = extract_skills(text)

print("\n===== DETECTED SKILLS =====")

for skill in skills:
    print("✓", skill)

prediction = predict_career(skills)

print("\n===== BEST CAREER =====")

print(prediction["best_career"])

print(
    f"Confidence: "
    f"{prediction['confidence']:.2f}%"
)

print("\n===== TOP 3 CAREERS =====")

for i, item in enumerate(
    prediction["top_careers"],
    1
):
    print(
        f"{i}. {item['career']} - "
        f"{item['confidence']:.2f}%"
    )

gap = analyze_skill_gap(
    skills,
    prediction["best_career"]
)

print(
    f"\n===== SKILL COVERAGE: "
    f"{gap['coverage']:.2f}% ====="
)

print("\nMATCHED SKILLS:")

for skill in gap["matched"]:
    print("✓", skill)

print("\nSKILLS TO LEARN:")

for skill in gap["missing"]:
    print("△", skill)