from resume_parser import (
    extract_text_from_pdf,
    extract_skills
)

pdf_path = "../test_resume.pdf"

text = extract_text_from_pdf(pdf_path)

skills = extract_skills(text)

print("\n===== DETECTED SKILLS =====\n")

for skill in skills:
    print("✓", skill)

print(
    "\nTotal skills detected:",
    len(skills)
)