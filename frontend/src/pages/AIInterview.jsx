import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, ChevronRight, RotateCcw, LayoutDashboard,
  CheckCircle, AlertCircle, Brain,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   QUESTION BANK  (local / mock — no LLM API required)
   Plug in Gemini / OpenAI by replacing generateQuestions()
══════════════════════════════════════════════════════════════ */
const QUESTION_BANK = {
  beginner: {
    "AI ML Engineer": [
      "What is the difference between supervised and unsupervised learning?",
      "What is overfitting and how can it be prevented?",
      "What is a neural network and how does it work?",
      "Explain what Python libraries you have used for machine learning.",
      "What is the purpose of a train-test split?",
    ],
    "Data Scientist": [
      "What is the difference between mean, median, and mode?",
      "What is data cleaning and why is it important?",
      "What tools have you used for data visualization?",
      "Explain what a correlation coefficient tells you.",
      "What is the difference between a bar chart and a histogram?",
    ],
    "Software Engineer": [
      "What is Object-Oriented Programming?",
      "Explain the difference between a stack and a queue.",
      "What is version control and why is Git important?",
      "What is an API and how does REST work?",
      "Explain time complexity in simple terms.",
    ],
    default: [
      "Tell me about yourself and your technical background.",
      "What programming languages are you most comfortable with?",
      "Describe a technical challenge you have solved.",
      "What motivated you to pursue this career path?",
      "How do you stay updated with the latest technology trends?",
    ],
  },
  intermediate: {
    "AI ML Engineer": [
      "Explain the bias-variance tradeoff and how it affects model selection.",
      "How does backpropagation work in neural networks?",
      "When would you use Random Forest over Gradient Boosting?",
      "How do you handle class imbalance in a classification problem?",
      "Explain the transformer architecture and self-attention mechanism.",
    ],
    "Data Scientist": [
      "Explain the difference between L1 and L2 regularization.",
      "How do you handle missing data in a production dataset?",
      "Walk me through the steps of a complete data science project.",
      "What metrics would you use to evaluate a classification model?",
      "Explain the concept of feature engineering with an example.",
    ],
    "Software Engineer": [
      "Explain the SOLID principles of software design.",
      "What is a microservices architecture and when would you use it?",
      "Explain database indexing and when it helps performance.",
      "How would you design a URL shortening service?",
      "What is the difference between concurrency and parallelism?",
    ],
    default: [
      "Describe your most challenging technical project in detail.",
      "How do you approach debugging a complex problem?",
      "Explain how you would optimize a slow-performing system.",
      "How do you ensure code quality in a team environment?",
      "Walk me through a design decision you had to make recently.",
    ],
  },
  advanced: {
    "AI ML Engineer": [
      "How would you design and deploy an ML pipeline at scale for millions of users?",
      "Explain how you would implement a real-time recommendation engine.",
      "Compare RLHF, DPO, and SFT for fine-tuning LLMs.",
      "How would you detect and mitigate model drift in production?",
      "Design a distributed training setup for a large language model.",
    ],
    "Data Scientist": [
      "How would you build a causal inference model to evaluate an A/B test?",
      "Explain Bayesian optimization for hyperparameter tuning.",
      "How do you detect and address concept drift in streaming data?",
      "Design a fraud detection system with very low false positive tolerance.",
      "How would you handle multi-objective optimization in a recommendation system?",
    ],
    "Software Engineer": [
      "How would you design a distributed message queue like Kafka?",
      "Explain your approach to building a system that handles 1 million requests per second.",
      "How do you implement distributed transactions across microservices?",
      "Design a global CDN caching strategy for dynamic content.",
      "How would you architect a zero-downtime deployment pipeline?",
    ],
    default: [
      "How have you led a complex technical initiative from ideation to production?",
      "Describe a system design challenge at scale that you have solved.",
      "How do you approach technical debt in a rapidly growing product?",
      "Explain how you mentor junior developers effectively.",
      "What is your philosophy on engineering trade-offs?",
    ],
  },
};

/* ── Pick questions for this session ───────────────────────── */
function generateQuestions(career, difficulty) {
  const level = QUESTION_BANK[difficulty] || QUESTION_BANK.beginner;
  const keys = Object.keys(level).filter((k) => k !== "default");
  const matchedKey = keys.find(
    (k) =>
      career?.toLowerCase().includes(k.toLowerCase().split(" ")[0]) ||
      k.toLowerCase().includes(career?.toLowerCase().split(" ")[0])
  );
  return level[matchedKey] || level.default;
}

/* ── Mock evaluation (replace with real LLM call later) ─────── */
function mockEvaluate(question, answer, difficulty) {
  const wordCount = answer.trim().split(/\s+/).length;
  let base = Math.min(10, Math.max(3, Math.round(wordCount / 10)));

  if (difficulty === "advanced") base = Math.min(base, 8);
  if (difficulty === "beginner") base = Math.min(base + 1, 10);

  const score = Math.min(10, base + Math.floor(Math.random() * 2));

  return {
    score,
    strengths: score >= 7
      ? ["Clear explanation", "Good use of technical terminology"]
      : ["Attempted to answer the question", "Shows basic understanding"],
    improvements: score < 8
      ? ["Add specific examples or code snippets", "Elaborate on edge cases and trade-offs"]
      : ["Consider discussing real-world applications"],
    suggestedAnswer: `A strong answer to this question would cover: (1) a clear definition, (2) a concrete example from your experience, and (3) key trade-offs or considerations relevant to production scenarios.`,
    isRealAI: false,
  };
}

/* ── Score label helper ─────────────────────────────────────── */
function performanceLabel(score) {
  if (score >= 8.5) return { label: "Excellent", color: "#6ee7b7" };
  if (score >= 6.5) return { label: "Good", color: "#a598ff" };
  if (score >= 4.5) return { label: "Average", color: "#fbbf24" };
  return { label: "Needs Improvement", color: "#fca5a5" };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
function AIInterview() {
  const [analysis, setAnalysis] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [candidateSkills, setCandidateSkills] = useState([]);

  // phases: "setup" | "interview" | "feedback" | "report"
  const [phase, setPhase] = useState("setup");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [sessionAnswers, setSessionAnswers] = useState([]);

  /* Load analysis from localStorage */
  useEffect(() => {
    const raw = localStorage.getItem("careerLensAnalysis");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setAnalysis(parsed);
      setTargetRole(parsed.best_career?.role || "Software Professional");
      setCandidateSkills(parsed.skills_detected || []);
    } catch (e) {
      console.error("Failed to load analysis:", e);
    }
  }, []);

  /* ── No resume ───────────────────────────────────────────── */
  if (!analysis) {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">AI INTERVIEW LAB</p>
          <h1>Practice a <span>Face-to-Face AI Interview.</span></h1>
          <p>Analyze your resume first to start a personalized AI interview.</p>
        </div>
        <div className="emptyState" style={{ flexDirection: "column", gap: "18px" }}>
          <p style={{ margin: 0 }}>Resume analysis required to generate personalized questions.</p>
          <Link
            to="/resume-analyzer"
            className="analyzeButton"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Sparkles size={16} /> Analyze Your Resume
          </Link>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     PHASE 1 — SETUP
  ═══════════════════════════════════════════════════════════ */
  function startInterview() {
    const qs = generateQuestions(targetRole, difficulty);
    setQuestions(qs);
    setCurrentQ(0);
    setAnswer("");
    setCurrentFeedback(null);
    setSessionAnswers([]);
    setPhase("interview");
  }

  if (phase === "setup") {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">AI INTERVIEW LAB</p>
          <h1>AI Mock <span>Interview.</span></h1>
          <p>
            Practice real-time AI interviews with personalized questions,
            instant scoring and detailed feedback.
          </p>
        </div>

        <div className="interviewPreview">
          {/* Left: visual */}
          <div className="interviewVisual">
            <Brain size={55} />
            <h2>AI Interview Ready</h2>
            <p>
              Target Role: <strong style={{ color: "#a598ff" }}>{targetRole}</strong>
            </p>
            <div className="skills" style={{ justifyContent: "center", marginTop: "14px" }}>
              {candidateSkills.slice(0, 6).map((s) => (
                <span key={s}>{s}</span>
              ))}
              {candidateSkills.length > 6 && (
                <span>+{candidateSkills.length - 6} more</span>
              )}
            </div>
          </div>

          {/* Right: setup */}
          <div className="interviewSetup">
            <h2>Interview Setup</h2>

            <p style={{ color: "#8491a6", fontSize: "14px" }}>Select difficulty:</p>

            {["beginner", "intermediate", "advanced"].map((level) => (
              <div
                key={level}
                className="setupItem"
                onClick={() => setDifficulty(level)}
                style={{
                  cursor: "pointer",
                  border: difficulty === level
                    ? "1px solid #7063ff"
                    : "1px solid #1f2a3a",
                  background: difficulty === level
                    ? "rgba(112,99,255,0.1)"
                    : "#121a27",
                  transition: "0.2s",
                }}
              >
                {difficulty === level
                  ? <CheckCircle size={17} style={{ color: "#7063ff" }} />
                  : <div style={{ width: 17, height: 17, border: "2px solid #2a3547", borderRadius: "50%" }} />
                }
                <span style={{ textTransform: "capitalize", fontWeight: difficulty === level ? 700 : 400 }}>
                  {level}
                </span>
              </div>
            ))}

            <div className="setupItem" style={{ marginTop: "8px" }}>
              <Sparkles size={17} />
              5 questions · Local AI evaluation
            </div>

            <button
              className="analyzeButton"
              onClick={startInterview}
              style={{ width: "100%", marginTop: "18px" }}
            >
              <Sparkles size={17} /> Start AI Interview
            </button>

            <p style={{ fontSize: "11px", color: "#4a5568", marginTop: "10px", textAlign: "center" }}>
              ⚠️ Evaluation is local/mock — not a real LLM API.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     PHASE 2 — INTERVIEW + FEEDBACK (interleaved)
  ═══════════════════════════════════════════════════════════ */
  function submitAnswer() {
    if (!answer.trim()) {
      setAnswerError("Please type your answer before submitting.");
      return;
    }
    setAnswerError("");
    setEvaluating(true);

    // Simulate async evaluation
    setTimeout(() => {
      const fb = mockEvaluate(questions[currentQ], answer, difficulty);
      setCurrentFeedback({ ...fb, question: questions[currentQ], answer });
      setSessionAnswers((prev) => [
        ...prev,
        { question: questions[currentQ], answer, ...fb },
      ]);
      setEvaluating(false);
      setPhase("feedback");
    }, 900);
  }

  function nextQuestion() {
    if (currentQ + 1 >= questions.length) {
      finishInterview();
      return;
    }
    setCurrentQ((q) => q + 1);
    setAnswer("");
    setCurrentFeedback(null);
    setPhase("interview");
  }

  function finishInterview() {
    const allAnswers = [...sessionAnswers];
    if (currentFeedback) {
      // already appended in submitAnswer
    }
    const overallScore =
      allAnswers.reduce((sum, a) => sum + a.score, 0) / allAnswers.length;

    // Save to localStorage
    const raw = localStorage.getItem("careerLensInterviewResults");
    const results = raw ? JSON.parse(raw) : [];
    results.push({
      targetRole,
      difficulty,
      overallScore: +overallScore.toFixed(2),
      questions: allAnswers,
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem("careerLensInterviewResults", JSON.stringify(results));

    setPhase("report");
  }

  const progress = ((currentQ) / questions.length) * 100;

  if (phase === "interview") {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">AI INTERVIEW · {difficulty.toUpperCase()}</p>
          <h1>Question <span>{currentQ + 1} of {questions.length}</span></h1>
        </div>

        {/* Progress bar */}
        <div className="progress" style={{ marginBottom: "30px" }}>
          <div style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        <div className="resultCard" style={{ marginBottom: "20px" }}>
          <p className="eyebrow" style={{ marginBottom: "10px" }}>QUESTION {currentQ + 1}</p>
          <h3 style={{ margin: 0, fontSize: "18px", lineHeight: 1.5, color: "#e2e8f0" }}>
            {questions[currentQ]}
          </h3>
        </div>

        {/* Answer textarea */}
        <div className="resultCard">
          <label style={{ display: "block", color: "#8491a6", fontSize: "13px", marginBottom: "10px" }}>
            Your Answer
          </label>
          <textarea
            value={answer}
            onChange={(e) => { setAnswer(e.target.value); setAnswerError(""); }}
            placeholder="Type your answer here..."
            rows={8}
            style={{
              width: "100%",
              background: "#0a1020",
              border: "1px solid #273247",
              borderRadius: "10px",
              color: "#e2e8f0",
              padding: "14px",
              fontSize: "14px",
              lineHeight: 1.7,
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          {answerError && (
            <p style={{ color: "#fca5a5", fontSize: "13px", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={14} /> {answerError}
            </p>
          )}

          <button
            className="analyzeButton"
            onClick={submitAnswer}
            disabled={evaluating}
            style={{ marginTop: "14px" }}
          >
            {evaluating ? (
              <>
                <div className="loader" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Evaluating...
              </>
            ) : (
              <><ChevronRight size={17} /> Submit Answer</>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     PHASE 3 — PER-QUESTION FEEDBACK
  ═══════════════════════════════════════════════════════════ */
  if (phase === "feedback" && currentFeedback) {
    const isLast = currentQ + 1 >= questions.length;
    const perf = performanceLabel(currentFeedback.score);

    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">FEEDBACK · QUESTION {currentQ + 1}</p>
          <h1>Answer <span>Score: {currentFeedback.score}/10</span></h1>
        </div>

        {/* Score badge */}
        <div className="metricCard highlight" style={{ marginBottom: "18px", textAlign: "center" }}>
          <span>PERFORMANCE</span>
          <h2 style={{ color: perf.color, margin: "10px 0 4px" }}>{perf.label}</h2>
          <strong>{currentFeedback.score} / 10</strong>
        </div>

        {/* Your answer */}
        <div className="resultCard" style={{ marginBottom: "14px" }}>
          <p className="eyebrow" style={{ marginBottom: "8px" }}>YOUR ANSWER</p>
          <p style={{ color: "#8491a6", lineHeight: 1.7, margin: 0 }}>
            {currentFeedback.answer}
          </p>
        </div>

        {/* Strengths */}
        <div className="resultCard" style={{ marginBottom: "14px" }}>
          <h3 style={{ color: "#6ee7b7", marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={17} /> Strengths
          </h3>
          <ul style={{ paddingLeft: "18px", color: "#a0aec0", lineHeight: 2 }}>
            {currentFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>

        {/* Improvements */}
        <div className="resultCard" style={{ marginBottom: "14px" }}>
          <h3 style={{ color: "#fbbf24", marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={17} /> Improvements
          </h3>
          <ul style={{ paddingLeft: "18px", color: "#a0aec0", lineHeight: 2 }}>
            {currentFeedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>

        {/* Suggested answer */}
        <div className="resultCard" style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#a598ff", marginTop: 0 }}>💡 Suggested Answer</h3>
          <p style={{ color: "#8491a6", lineHeight: 1.7, margin: 0 }}>
            {currentFeedback.suggestedAnswer}
          </p>
          <p style={{ fontSize: "11px", color: "#4a5568", marginTop: "10px", marginBottom: 0 }}>
            ⚠️ Mock evaluation — not real AI scoring.
          </p>
        </div>

        <button
          className="analyzeButton"
          onClick={nextQuestion}
          style={{ width: "100%" }}
        >
          {isLast ? "View Final Report" : `Next Question →`}
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     PHASE 4 — FINAL REPORT
  ═══════════════════════════════════════════════════════════ */
  if (phase === "report") {
    const overallScore =
      sessionAnswers.reduce((sum, a) => sum + a.score, 0) / sessionAnswers.length;
    const perf = performanceLabel(overallScore);

    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">INTERVIEW COMPLETED</p>
          <h1>Overall Score: <span>{overallScore.toFixed(1)} / 10</span></h1>
          <p>
            Target Role: <strong style={{ color: "#a598ff" }}>{targetRole}</strong>
            {" · "}
            Difficulty: <strong style={{ textTransform: "capitalize" }}>{difficulty}</strong>
          </p>
        </div>

        {/* Score cards */}
        <div className="metrics" style={{ marginBottom: "24px" }}>
          <div className="metricCard highlight">
            <span>OVERALL SCORE</span>
            <h2 style={{ color: perf.color }}>{overallScore.toFixed(1)}</h2>
            <strong>{perf.label}</strong>
          </div>
          <div className="metricCard">
            <span>QUESTIONS</span>
            <h2>{sessionAnswers.length}</h2>
            <strong>Answered</strong>
          </div>
          <div className="metricCard">
            <span>BEST SCORE</span>
            <h2>{Math.max(...sessionAnswers.map((a) => a.score))}</h2>
            <strong>/ 10</strong>
          </div>
        </div>

        {/* Per question breakdown */}
        <h3 style={{ color: "#a598ff", marginBottom: "14px" }}>Question Breakdown</h3>
        {sessionAnswers.map((item, idx) => {
          const p = performanceLabel(item.score);
          return (
            <div key={idx} className="resultCard" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p className="eyebrow" style={{ margin: 0 }}>Q{idx + 1}</p>
                <span style={{ color: p.color, fontWeight: 700 }}>{item.score}/10 — {p.label}</span>
              </div>
              <p style={{ color: "#e2e8f0", margin: "0 0 6px", fontWeight: 600 }}>{item.question}</p>
              <p style={{ color: "#718096", margin: 0, fontSize: "13px" }}>{item.answer.slice(0, 180)}{item.answer.length > 180 ? "..." : ""}</p>
            </div>
          );
        })}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
          <button
            className="analyzeButton"
            onClick={() => {
              setPhase("setup");
              setSessionAnswers([]);
              setCurrentQ(0);
              setAnswer("");
              setCurrentFeedback(null);
            }}
          >
            <RotateCcw size={16} /> Retry Interview
          </button>
          <Link
            to="/dashboard"
            className="navLink"
            style={{
              padding: "14px 22px",
              borderRadius: "11px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid #2a3547",
            }}
          >
            <LayoutDashboard size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default AIInterview;