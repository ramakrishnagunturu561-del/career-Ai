# CareerLens AI

### AI-Powered Career Intelligence, Job Discovery & Interview Preparation Platform

CareerLens AI is an intelligent career guidance platform that analyzes a candidate's resume, identifies skills, predicts suitable career paths using Machine Learning, generates personalized learning roadmaps, discovers real-time jobs and internships, tracks applications, and provides AI-powered video and voice interview practice.

The platform combines **Machine Learning, NLP, Local LLMs, Real-Time Job APIs, FastAPI, and React** into one complete career development ecosystem.

---

## Key Features

### AI Resume Analyzer

Upload a PDF resume and automatically:

- Extract resume content
- Detect technical skills
- Analyze the candidate's profile
- Predict the best career path
- Display Top Career Matches
- Calculate career confidence
- Identify matched skills
- Detect missing skills
- Calculate skill coverage

Example:

```text
Detected Skills

Python
Machine Learning
Deep Learning
TensorFlow
Scikit-learn
FastAPI
NLP
Generative AI
MongoDB
MySQL
Git
GitHub

Best Career Match

AI ML Engineer

Top Career Matches

AI ML Engineer
Full Stack Developer
Generative AI Engineer
```

---

## Machine Learning Career Prediction

CareerLens AI uses a trained Machine Learning pipeline to predict suitable career paths based on detected resume skills.

Architecture:

```text
Resume
   ↓
PDF Text Extraction
   ↓
Skill Detection
   ↓
Sentence Embeddings
   ↓
ONNX Runtime
   ↓
Scikit-learn Career Classifier
   ↓
Career Prediction
   ↓
Skill Gap Analysis
```

The system uses an ONNX-based embedding pipeline for efficient local inference.

---

## Skill Gap Analysis

CareerLens compares the candidate's current skills with skills relevant to the predicted career.

It identifies:

- Matched Skills
- Missing Skills
- Skill Coverage
- Areas to Improve

Example:

```text
Target Career

AI ML Engineer

Matched Skills

Python
Machine Learning
Deep Learning
TensorFlow
Scikit-learn
Pandas
NumPy
NLP

Skills to Learn

PyTorch
Computer Vision
Model Deployment
Artificial Intelligence
```

---

## Personalized AI Career Roadmap

CareerLens generates a personalized learning roadmap based on:

- Predicted career
- Current skills
- Matched skills
- Missing skills
- Skill coverage

The roadmap can use the local **Ollama Llama 3.2** model to generate personalized recommendations.

Example roadmap:

```text
Stage 1
Foundation

        ↓

Stage 2
Core AI/ML Skills

        ↓

Stage 3
Advanced Technologies

        ↓

Stage 4
Real-World Projects

        ↓

Stage 5
Interview Preparation

        ↓

Stage 6
Job Readiness
```

---

## Real-Time Job Discovery

CareerLens integrates with a live job API to discover current opportunities.

Current integration:

**Adzuna Jobs API**

Users can search using:

- Career role
- Keywords
- Location

CareerLens displays information available from the live provider, such as:

- Job title
- Company
- Location
- Description
- Employment type
- Posted date
- Source
- Real application URL

No fake job listings are used as a fallback when the live service is unavailable.

---

## CareerLens Skill Match

CareerLens compares detected resume skills with information available in job and internship listings.

The system can calculate a personalized:

**CareerLens Skill Match**

This helps candidates understand how closely their current profile aligns with an opportunity.

The score is a CareerLens recommendation metric and should not be interpreted as an employer ATS score.

---

## Real-Time Internship Discovery

CareerLens also discovers internships relevant to the candidate's career.

Examples include:

- AI Internships
- Machine Learning Internships
- Data Science Internships
- Software Development Internships
- NLP Internships
- Generative AI Internships

Internship results are retrieved from the configured live opportunity provider.

---

## Application Tracker

CareerLens includes a built-in application tracking system.

Users can:

- Save jobs
- Save internships
- Open real application links
- Track application progress
- Update application status
- Remove tracked opportunities

Supported statuses include:

```text
Saved
Application Opened
Applied
Interview
Selected
Rejected
```

Application data is persisted locally in the current implementation.

---

## AI Video & Voice Interview

CareerLens provides an AI-powered mock interview environment personalized using the candidate's resume.

The interview system uses:

**Ollama + Llama 3.2:3b**

Questions can be generated based on:

- Target career
- Resume skills
- Skill gaps
- Selected difficulty

Difficulty levels:

```text
Beginner
Intermediate
Advanced
```

---

## Video Interview Experience

CareerLens supports browser-based webcam and microphone functionality.

Features include:

- Live webcam preview
- Camera ON/OFF
- Microphone ON/OFF
- Camera permission handling
- Microphone permission handling
- Automatic media-track cleanup

Browser Media APIs are used for the video interview experience.

---

## Voice Interview

Candidates can answer interview questions using voice where browser support is available.

Features:

```text
AI Question
      ↓
Text-to-Speech
      ↓
Candidate Voice Answer
      ↓
Speech-to-Text
      ↓
Transcript Review
      ↓
Submit Answer
      ↓
Ollama Evaluation
      ↓
Score + Feedback
```

The application can use:

- Web Speech API for Speech-to-Text
- Browser SpeechSynthesis for Text-to-Speech

A typed-answer fallback can be used when speech recognition is unsupported.

---

## AI Interview Evaluation

Candidate answers are evaluated using the local Ollama model.

Evaluation can include:

- Technical Accuracy
- Relevance
- Clarity
- Overall Score
- Strengths
- Areas for Improvement
- Detailed Feedback
- Suggested Better Answer

The evaluation is based on the candidate's submitted answer rather than random scoring.

---

## System Architecture

```text
                     CAREERLENS AI

                           │
                           ▼

                     Resume Upload

                           │
                           ▼

                    Resume Parser

                           │
                           ▼

                    Skill Detection

                           │
                           ▼

             ONNX + ML Career Prediction

                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼

        Career         Skill Gap      Top Career
       Prediction      Analysis        Matches

             │
             ▼

       Personalized Roadmap
       Ollama Llama 3.2:3b

             │
             ▼

       Real-Time Opportunities

         ┌─────────┴─────────┐
         ▼                   ▼

       Jobs              Internships

         └─────────┬─────────┘
                   ▼

           Application Tracker

                   │
                   ▼

          AI Video + Voice Interview

                   │
                   ▼

            FastAPI → Ollama

                   │
                   ▼

        AI Evaluation & Feedback
```

---

## Technology Stack

### Frontend

- React.js
- Vite
- React Router
- JavaScript
- CSS
- Browser Media APIs
- Web Speech API
- SpeechSynthesis API

### Backend

- Python
- FastAPI
- Uvicorn
- REST APIs

### Machine Learning

- Scikit-learn
- ONNX Runtime
- Sentence Transformer-based embeddings
- Joblib
- Pandas
- NumPy

### Local Generative AI

- Ollama
- Llama 3.2:3b

### Real-Time Opportunity Data

- Adzuna Jobs API

### Development Tools

- Git
- GitHub
- VS Code
- Swagger / OpenAPI

---

## Project Structure

```text
career-Ai/
│
├── backend/
│   ├── main.py
│   ├── resume_parser.py
│   ├── career_predictor.py
│   ├── ai_interview.py
│   ├── jobs_service.py
│   ├── requirements.txt
│   ├── .env.example
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ResumeAnalyzer.jsx
│   │   │   ├── CareerRoadmap.jsx
│   │   │   ├── Jobs.jsx
│   │   │   ├── Internships.jsx
│   │   │   ├── Applications.jsx
│   │   │   └── AIInterview.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env.example
│
├── model/
│
├── notebooks/
│
├── .gitignore
│
└── README.md
```

The exact structure may vary slightly as the project evolves.

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/ramakrishnagunturu561-del/career-Ai.git

cd career-Ai
```

---

## 2. Create Python Virtual Environment

Python 3.12 is recommended for the current local setup.

Windows:

```powershell
py -3.12 -m venv venv

.\venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
python -m pip install -r backend\requirements.txt
```

---

## 3. Install Ollama

Install Ollama from:

https://ollama.com/

Verify:

```bash
ollama --version
```

Download the AI model:

```bash
ollama pull llama3.2:3b
```

Test:

```bash
ollama run llama3.2:3b
```

The default local Ollama endpoint is:

```text
http://localhost:11434
```

---

## 4. Configure Environment Variables

Create:

```text
backend/.env
```

Use `backend/.env.example` as a template.

Example:

```env
JOBS_API_PROVIDER=adzuna

JOBS_API_APP_ID=YOUR_APPLICATION_ID

JOBS_API_KEY=YOUR_APPLICATION_KEY
```

Never commit real API credentials.

The `.env` file must remain ignored by Git.

---

## 5. Start FastAPI Backend

From the project root:

```powershell
.\venv\Scripts\Activate.ps1

cd backend

python -m uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 6. Start React Frontend

Open another terminal:

```powershell
cd frontend

npm install

npm run dev
```

Open the URL displayed by Vite, typically:

```text
http://localhost:5173
```

---

# Running CareerLens AI

For full functionality, ensure these services are available:

```text
1. Ollama
       ↓
2. FastAPI Backend
       ↓
3. React Frontend
```

Then use the application:

```text
Upload Resume

      ↓

Analyze Resume

      ↓

View Career Prediction

      ↓

Analyze Skill Gaps

      ↓

Generate Career Roadmap

      ↓

Discover Jobs / Internships

      ↓

Track Applications

      ↓

Start AI Video + Voice Interview

      ↓

Receive AI Feedback
```

---

# API Endpoints

Examples of backend endpoints used by CareerLens include:

```text
GET  /
GET  /health

POST /analyze-resume

POST /generate-roadmap

GET  /jobs
GET  /internships

GET  /ai-interview/health
POST /ai-interview/start
POST /ai-interview/evaluate
```

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

# Security

CareerLens follows basic security practices:

- API keys are stored in environment variables
- `.env` files are excluded from Git
- API credentials are not exposed in frontend code
- Real application URLs are opened through their source
- Ollama runs locally
- Webcam and microphone require explicit browser permission

Never commit:

```text
.env
API keys
access tokens
passwords
private credentials
```

If a credential is accidentally exposed publicly, revoke or rotate it immediately.

---

# Current Limitations

- Ollama currently runs locally, so cloud deployment requires a different production AI architecture or a remotely accessible model service.
- Job and internship availability depends on the configured external provider.
- Speech recognition support depends on the user's browser.
- Application submission generally occurs on external employer/source websites; CareerLens tracks the process but does not claim external submission unless confirmed.
- Career predictions and skill-match scores are recommendation tools and should not be treated as guaranteed hiring outcomes.

---

# Future Enhancements

Planned improvements may include:

- User authentication
- PostgreSQL / MongoDB persistence
- Cloud deployment
- Multi-user dashboards
- Advanced resume scoring
- AI resume optimization
- Cover letter generation
- Job alerts
- Email notifications
- Advanced application analytics
- Interview history analytics
- Coding interview rounds
- Behavioral interview modes
- Recruiter dashboard
- More job providers
- Advanced RAG-based career guidance

---

# Project Vision

CareerLens AI aims to create a complete AI-powered career ecosystem where candidates can move through the entire career preparation journey:

```text
Understand My Resume

        ↓

Find My Best Career

        ↓

Identify My Skill Gaps

        ↓

Learn What I Need

        ↓

Find Real Opportunities

        ↓

Track My Applications

        ↓

Practice Realistic Interviews

        ↓

Improve With AI Feedback

        ↓

Become Job Ready
```

---

## Author

**Guntru Venkata Ramakrishna**

B.Tech — Artificial Intelligence & Machine Learning

GitHub:

https://github.com/ramakrishnagunturu561-del

Project Repository:

https://github.com/ramakrishnagunturu561-del/career-Ai

---

## Disclaimer

CareerLens AI provides AI-assisted career recommendations, opportunity discovery, and interview practice.

Career predictions, skill-match percentages, and AI interview feedback are advisory and should not be interpreted as guarantees of employment, employer ATS scores, or official hiring decisions.

Job and internship information is provided through external data sources and may change over time.

---

## Support

If you find CareerLens AI useful, consider starring the repository.

Contributions, suggestions, and improvements are welcome.
