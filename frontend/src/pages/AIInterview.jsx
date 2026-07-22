import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, ChevronRight, RotateCcw, LayoutDashboard,
  CheckCircle, AlertCircle, Brain, Camera, CameraOff,
  Mic, MicOff, Volume2, VolumeX, Radio, Check, RefreshCw
} from "lucide-react";

function AIInterview() {
  const [analysis, setAnalysis] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [candidateSkills, setCandidateSkills] = useState([]);

  // Ollama Health State
  const [ollamaStatus, setOllamaStatus] = useState({ checked: false, online: false, modelAvailable: false, error: "" });

  // Interview phases: "setup" | "interview" | "feedback" | "report"
  const [phase, setPhase] = useState("setup");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [startingInterview, setStartingInterview] = useState(false);

  // Video & Audio Stream States
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [mediaError, setMediaError] = useState("");
  const videoRef = useRef(null);

  // Speech Recognition (STT) State
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Text-to-Speech (TTS) State
  const [ttsMuted, setTtsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const navigate = useNavigate();

  /* Load analysis from localStorage */
  useEffect(() => {
    const raw = localStorage.getItem("careerLensAnalysis");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setAnalysis(parsed);
        setTargetRole(parsed.best_career?.role || "Software Professional");
        setCandidateSkills(parsed.skills_detected || []);
      } catch (e) {
        console.error("Failed to parse analysis:", e);
      }
    }
    checkHealth();
  }, []);

  /* Check Ollama Health via FastAPI */
  const checkHealth = async () => {
    try {
      const res = await fetch("http://localhost:8000/ai-interview/health");
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus({
          checked: true,
          online: data.online,
          modelAvailable: data.model_available,
          error: data.online ? "" : "Ollama is not running on http://localhost:11434"
        });
      } else {
        setOllamaStatus({ checked: true, online: false, modelAvailable: false, error: "Health check failed." });
      }
    } catch (err) {
      setOllamaStatus({ checked: true, online: false, modelAvailable: false, error: "Cannot reach FastAPI backend." });
    }
  };

  /* Initialize Web Media Stream (Camera + Mic) */
  const startWebcam = async () => {
    setMediaError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setMicOn(true);
    } catch (err) {
      console.warn("Media devices access error:", err);
      setMediaError("Could not access camera/microphone. Please verify browser permissions.");
    }
  };

  /* Stop Web Media Stream */
  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  };

  /* Cleanup on Component Unmount */
  useEffect(() => {
    return () => {
      stopWebcam();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [mediaStream]);

  /* Toggle Camera Track */
  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  };

  /* Toggle Microphone Track */
  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  /* Initialize Web Speech Recognition (STT) */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      rec.onerror = (e) => {
        console.warn("STT Error:", e.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setSttSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("STT start error:", err);
      }
    }
  };

  /* TTS Speaker helper */
  const speakQuestion = (text) => {
    if (ttsMuted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  /* Attach mediaStream to video tag when rendering interview phase */
  useEffect(() => {
    if (phase === "interview" && mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [phase, mediaStream]);

  /* Speak question on phase or Q change */
  useEffect(() => {
    if (phase === "interview" && questions[currentQ]) {
      speakQuestion(questions[currentQ]);
    }
  }, [phase, currentQ, questions]);

  /* Start Interview Handler */
  const startInterview = async () => {
    setStartingInterview(true);
    await startWebcam();

    try {
      const res = await fetch("http://localhost:8000/ai-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: candidateSkills,
          predicted_career: targetRole,
          target_role: targetRole,
          difficulty: difficulty,
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.warn("Interview start API error:", err);
    } finally {
      setStartingInterview(false);
      setCurrentQ(0);
      setAnswer("");
      setCurrentFeedback(null);
      setSessionAnswers([]);
      setPhase("interview");
    }
  };

  /* Submit Answer Handler */
  const submitAnswer = async () => {
    if (!answer.trim()) {
      setAnswerError("Please type or speak your answer before submitting.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setAnswerError("");
    setEvaluating(true);

    try {
      const res = await fetch("http://localhost:8000/ai-interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[currentQ],
          answer: answer,
          target_role: targetRole,
          difficulty: difficulty,
        }),
      });

      const data = await res.json();
      const fb = {
        score: data.score,
        technical_accuracy: data.technical_accuracy || data.score,
        relevance: data.relevance || data.score,
        clarity: data.clarity || data.score,
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        feedback: data.feedback || "",
        suggestedAnswer: data.suggested_answer || data.suggestedAnswer || "",
        isRealAI: !!data.is_llm,
      };

      setCurrentFeedback({ ...fb, question: questions[currentQ], answer });
      setSessionAnswers((prev) => [
        ...prev,
        { question: questions[currentQ], answer, ...fb },
      ]);
    } catch (err) {
      console.error("Answer evaluation failed:", err);
    } finally {
      setEvaluating(false);
      setPhase("feedback");
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      finishInterview();
      return;
    }
    setCurrentQ((q) => q + 1);
    setAnswer("");
    setCurrentFeedback(null);
    setPhase("interview");
  };

  const finishInterview = () => {
    stopWebcam();
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const overallScore = sessionAnswers.reduce((sum, a) => sum + a.score, 0) / (sessionAnswers.length || 1);

    // Save attempt to localStorage array without overwriting
    try {
      const raw = localStorage.getItem("careerLensInterviewResults");
      const results = raw ? JSON.parse(raw) : [];
      results.push({
        id: `int-${Date.now()}`,
        targetRole,
        difficulty,
        overallScore: Number(overallScore.toFixed(2)),
        questions: sessionAnswers,
        completedAt: new Date().toISOString(),
      });
      localStorage.setItem("careerLensInterviewResults", JSON.stringify(results));
    } catch (e) {
      console.error("Failed to save interview result:", e);
    }

    setPhase("report");
  };

  /* Performance Label Helper */
  const performanceLabel = (score) => {
    if (score >= 8.5) return { label: "Excellent Performance", color: "#6ee7b7" };
    if (score >= 6.5) return { label: "Good Technical Response", color: "#a598ff" };
    if (score >= 4.5) return { label: "Average Response", color: "#fbbf24" };
    return { label: "Needs Technical Depth", color: "#fca5a5" };
  };

  /* ── No resume uploaded ───────────────────────────────────── */
  if (!analysis) {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">AI INTERVIEW LAB</p>
          <h1>Practice a <span>Video & Voice AI Interview.</span></h1>
          <p>Analyze your resume first to start a personalized AI interview.</p>
        </div>
        <div className="emptyState" style={{ flexDirection: "column", gap: "18px" }}>
          <p style={{ margin: 0 }}>Resume analysis required to generate personalized questions.</p>
          <Link to="/resume-analyzer" className="analyzeButton" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} /> Analyze Your Resume
          </Link>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     PHASE 1 — SETUP
  ═══════════════════════════════════════════════════════════ */
  if (phase === "setup") {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">AI INTERVIEW LAB</p>
          <h1>AI Video & Voice <span>Mock Interview.</span></h1>
          <p>
            Experience realistic technical interviews with webcam preview, voice responses, TTS questions,
            and answer evaluation powered by Ollama Llama 3.2.
          </p>
        </div>

        {/* Ollama Health Banner */}
        {ollamaStatus.checked && !ollamaStatus.online && (
          <div className="emptyState" style={{ marginBottom: "24px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
            <AlertCircle size={28} style={{ color: "#fca5a5" }} />
            <div>
              <h4 style={{ margin: "0 0 4px", color: "#fca5a5" }}>Local Ollama AI Service Unavailable</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
                Please ensure Ollama is running on <code>http://localhost:11434</code> with model <code>llama3.2:3b</code>.
              </p>
            </div>
            <button onClick={checkHealth} className="navLink" style={{ border: "1px solid #2a3547", cursor: "pointer", marginLeft: "auto" }}>
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        )}

        <div className="interviewPreview">
          <div className="interviewVisual">
            <Brain size={55} />
            <h2>AI Interview Studio</h2>
            <p>Target Role: <strong style={{ color: "#a598ff" }}>{targetRole}</strong></p>
            <div className="skills" style={{ justifyContent: "center", marginTop: "14px" }}>
              {candidateSkills.slice(0, 6).map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>

          <div className="interviewSetup">
            <h2>Select Setup</h2>
            <p style={{ color: "#8491a6", fontSize: "14px" }}>Difficulty Level:</p>

            {["beginner", "intermediate", "advanced"].map((level) => (
              <div
                key={level}
                className="setupItem"
                onClick={() => setDifficulty(level)}
                style={{
                  cursor: "pointer",
                  border: difficulty === level ? "1px solid #7063ff" : "1px solid #1f2a3a",
                  background: difficulty === level ? "rgba(112,99,255,0.1)" : "#121a27",
                  transition: "0.2s"
                }}
              >
                {difficulty === level ? <CheckCircle size={17} style={{ color: "#7063ff" }} /> : <div style={{ width: 17, height: 17, border: "2px solid #2a3547", borderRadius: "50%" }} />}
                <span style={{ textTransform: "capitalize", fontWeight: difficulty === level ? 700 : 400 }}>{level}</span>
              </div>
            ))}

            <div className="setupItem" style={{ marginTop: "12px", background: "rgba(109,93,252,0.06)" }}>
              <Radio size={16} style={{ color: "#6ee7b7" }} />
              Live Webcam + Microphone Required
            </div>

            <button
              className="analyzeButton"
              onClick={startInterview}
              disabled={startingInterview}
              style={{ width: "100%", marginTop: "18px" }}
            >
              {startingInterview ? (
                <>
                  <div className="loader" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Preparing Video & Questions...
                </>
              ) : (
                <><Sparkles size={17} /> Start Video & Voice Interview</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     PHASE 2 — INTERVIEW STAGE (Webcam + Voice + TTS)
  ═══════════════════════════════════════════════════════════ */
  const progress = ((currentQ + 1) / (questions.length || 5)) * 100;

  if (phase === "interview") {
    return (
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>AI INTERVIEW STUDIO · {difficulty.toUpperCase()}</p>
            <h1 style={{ margin: "4px 0 0", fontSize: "24px" }}>
              Target Role: <span style={{ color: "#a598ff" }}>{targetRole}</span>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#6ee7b7", background: "rgba(52,211,153,0.1)", padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(52,211,153,0.2)" }}>
              Question {currentQ + 1} of {questions.length}
            </span>
          </div>
        </div>

        <div className="progress" style={{ marginBottom: "24px" }}>
          <div style={{ width: `${progress}%` }} />
        </div>

        {/* Video & Interviewer Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          {/* Question & TTS Card */}
          <div className="resultCard" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p className="eyebrow" style={{ margin: 0 }}>AI INTERVIEWER QUESTION</p>
                <button
                  onClick={() => setTtsMuted(!ttsMuted)}
                  style={{ background: "transparent", border: "none", color: "#8491a6", cursor: "pointer" }}
                  title={ttsMuted ? "Unmute Interviewer" : "Mute Interviewer"}
                >
                  {ttsMuted ? <VolumeX size={18} /> : <Volume2 size={18} style={{ color: isSpeaking ? "#6ee7b7" : "#8491a6" }} />}
                </button>
              </div>

              <h3 style={{ margin: "0 0 16px 0", fontSize: "19px", lineHeight: 1.5, color: "#e2e8f0" }}>
                "{questions[currentQ]}"
              </h3>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                className="navLink"
                onClick={() => speakQuestion(questions[currentQ])}
                style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", border: "1px solid #2a3547" }}
              >
                <Volume2 size={14} /> Replay Question
              </button>
            </div>
          </div>

          {/* Candidate Webcam Preview */}
          <div className="resultCard" style={{ padding: "12px", background: "#060a12", position: "relative", minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px", transform: "scaleX(-1)", background: "#0a1020" }}
            />

            {/* Media Overlay Status & Toggles */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={toggleCamera}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #2a3547", background: cameraOn ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)", color: cameraOn ? "#6ee7b7" : "#fca5a5", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  {cameraOn ? <Camera size={13} /> : <CameraOff size={13} />}
                  Camera: {cameraOn ? "ON" : "OFF"}
                </button>

                <button
                  onClick={toggleMic}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #2a3547", background: micOn ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)", color: micOn ? "#6ee7b7" : "#fca5a5", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  {micOn ? <Mic size={13} /> : <MicOff size={13} />}
                  Mic: {micOn ? "ON" : "OFF"}
                </button>
              </div>

              {mediaError && <span style={{ fontSize: "11px", color: "#fca5a5" }}>{mediaError}</span>}
            </div>
          </div>
        </div>

        {/* Candidate Voice Transcript & Typed Input */}
        <div className="resultCard">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <label style={{ color: "#8491a6", fontSize: "13px" }}>Your Answer (Voice or Typed)</label>
            {sttSupported && (
              <button
                onClick={toggleListening}
                style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                  background: isListening ? "rgba(239,68,68,0.2)" : "rgba(109,93,252,0.15)",
                  color: isListening ? "#fca5a5" : "#a598ff",
                  border: isListening ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(109,93,252,0.3)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                }}
              >
                <Mic size={14} className={isListening ? "spin" : ""} />
                {isListening ? "Recording Voice (Click to Stop)..." : "Start Voice Answer"}
              </button>
            )}
          </div>

          <textarea
            value={answer}
            onChange={(e) => { setAnswer(e.target.value); setAnswerError(""); }}
            placeholder="Speak into microphone or type your answer here..."
            rows={6}
            style={{
              width: "100%", background: "#0a1020", border: "1px solid #273247", borderRadius: "10px",
              color: "#e2e8f0", padding: "14px", fontSize: "14px", lineHeight: 1.7, outline: "none", boxSizing: "border-box"
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
            style={{ marginTop: "14px", width: "100%" }}
          >
            {evaluating ? (
              <>
                <div className="loader" style={{ width: 16, height: 16, borderWidth: 2 }} />
                FastAPI → Ollama Evaluating Actual Answer...
              </>
            ) : (
              <><ChevronRight size={17} /> Submit Answer for AI Evaluation</>
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
          <h1>Answer Score: <span>{currentFeedback.score} / 10</span></h1>
        </div>

        <div className="metrics" style={{ marginBottom: "20px" }}>
          <div className="metricCard highlight" style={{ textAlign: "center" }}>
            <span>OVERALL SCORE</span>
            <h2 style={{ color: perf.color }}>{currentFeedback.score} / 10</h2>
            <strong>{perf.label}</strong>
          </div>
          <div className="metricCard">
            <span>TECHNICAL ACCURACY</span>
            <h2>{currentFeedback.technical_accuracy} / 10</h2>
            <strong>Concept correctness</strong>
          </div>
          <div className="metricCard">
            <span>RELEVANCE</span>
            <h2>{currentFeedback.relevance} / 10</h2>
            <strong>Question alignment</strong>
          </div>
        </div>

        <div className="resultCard" style={{ marginBottom: "14px" }}>
          <p className="eyebrow" style={{ marginBottom: "8px" }}>YOUR SUBMITTED ANSWER</p>
          <p style={{ color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>"{currentFeedback.answer}"</p>
        </div>

        <div className="resultGrid" style={{ marginBottom: "14px" }}>
          <div className="resultCard">
            <h3 style={{ color: "#6ee7b7", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={17} /> Strengths Identified
            </h3>
            <ul style={{ paddingLeft: "18px", color: "#a0aec0", lineHeight: 1.8, margin: 0 }}>
              {currentFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="resultCard">
            <h3 style={{ color: "#fbbf24", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={17} /> Key Improvements
            </h3>
            <ul style={{ paddingLeft: "18px", color: "#a0aec0", lineHeight: 1.8, margin: 0 }}>
              {currentFeedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>

        <div className="resultCard" style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#a598ff", margin: "0 0 8px 0" }}>💡 Ideal Suggested Answer</h3>
          <p style={{ color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>{currentFeedback.suggestedAnswer}</p>
        </div>

        <button className="analyzeButton" onClick={nextQuestion} style={{ width: "100%" }}>
          {isLast ? "View Final Interview Report →" : "Next Question →"}
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     PHASE 4 — FINAL REPORT & HISTORY PERSISTENCE
  ═══════════════════════════════════════════════════════════ */
  if (phase === "report") {
    const overallScore = sessionAnswers.reduce((sum, a) => sum + a.score, 0) / (sessionAnswers.length || 1);
    const perf = performanceLabel(overallScore);

    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">INTERVIEW COMPLETED</p>
          <h1>Overall Evaluation: <span>{overallScore.toFixed(1)} / 10</span></h1>
          <p>
            Target Role: <strong style={{ color: "#a598ff" }}>{targetRole}</strong> · Difficulty: <strong style={{ textTransform: "capitalize" }}>{difficulty}</strong>
          </p>
        </div>

        <div className="metrics" style={{ marginBottom: "24px" }}>
          <div className="metricCard highlight">
            <span>FINAL RATING</span>
            <h2 style={{ color: perf.color }}>{overallScore.toFixed(1)}</h2>
            <strong>{perf.label}</strong>
          </div>
          <div className="metricCard">
            <span>TOTAL QUESTIONS</span>
            <h2>{sessionAnswers.length}</h2>
            <strong>Evaluated by Ollama</strong>
          </div>
          <div className="metricCard">
            <span>HIGHEST SUB-SCORE</span>
            <h2>{sessionAnswers.length > 0 ? Math.max(...sessionAnswers.map((a) => a.score)) : 0}</h2>
            <strong>/ 10</strong>
          </div>
        </div>

        <h3 style={{ color: "#a598ff", marginBottom: "14px" }}>Question Breakdown & Analysis</h3>
        {sessionAnswers.map((item, idx) => {
          const p = performanceLabel(item.score);
          return (
            <div key={idx} className="resultCard" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <p className="eyebrow" style={{ margin: 0 }}>Q{idx + 1}</p>
                <span style={{ color: p.color, fontWeight: 700 }}>{item.score} / 10</span>
              </div>
              <p style={{ color: "#e2e8f0", margin: "0 0 6px", fontWeight: 600 }}>{item.question}</p>
              <p style={{ color: "#8491a6", margin: "0 0 8px", fontSize: "13px" }}>"{item.answer}"</p>
              <div style={{ background: "#0a1020", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                <strong style={{ color: "#a598ff" }}>Suggested Answer: </strong>{item.suggestedAnswer}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
          <button
            className="analyzeButton"
            onClick={() => {
              setPhase("setup");
              setSessionAnswers([]);
              setCurrentQ(0);
              setAnswer("");
            }}
          >
            <RotateCcw size={16} /> Retake AI Interview
          </button>
          <button
            className="navLink"
            style={{ padding: "14px 22px", borderRadius: "11px", display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #2a3547", cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default AIInterview;