import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { Map, Sparkles, CheckCircle2, ArrowRight, Video, Briefcase, RefreshCw, AlertCircle } from "lucide-react";

function CareerRoadmap() {
  const [analysis, setAnalysis] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedAnalysis = localStorage.getItem("careerLensAnalysis");
    if (savedAnalysis) {
      try {
        const parsed = JSON.parse(savedAnalysis);
        setAnalysis(parsed);
        fetchRoadmap(parsed);
      } catch (err) {
        console.error("Failed to parse analysis:", err);
      }
    }
  }, []);

  const fetchRoadmap = async (currentAnalysis) => {
    if (!currentAnalysis) return;
    setLoading(true);
    setError("");

    const career = currentAnalysis.best_career?.role || "Software Professional";
    const skillsDetected = currentAnalysis.skills_detected || [];
    const matchedSkills = currentAnalysis.skill_gap?.matched_skills || [];
    const missingSkills = currentAnalysis.skill_gap?.missing_skills || [];
    const coverage = currentAnalysis.skill_gap?.coverage || 0;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout to prevent infinite loading

    try {
      const res = await fetch(`${API_BASE_URL}/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          target_role: career,
          skills_detected: skillsDetected,
          matched_skills: matchedSkills,
          missing_skills: missingSkills,
          coverage: coverage,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error("Local AI service is unavailable. Please start Ollama and try again.");
      }

      const data = await res.json();
      if (data.is_llm === false) {
        setError("Local AI service is unavailable. Please start Ollama and try again.");
      }
      setRoadmap(data);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn("Roadmap API call error:", err);
      if (err.name === "AbortError") {
        setError("Ollama request timed out after 60 seconds. Please check local server performance and try again.");
      } else {
        setError("Local AI service is unavailable. Please start Ollama and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">PERSONALIZED LEARNING</p>
          <h1>Your Career <span>Roadmap.</span></h1>
          <p>Build the skills required to reach your target career.</p>
        </div>

        <div className="emptyState" style={{ flexDirection: "column", gap: "18px" }}>
          <p style={{ margin: 0 }}>Analyze your resume first to generate your personalized roadmap.</p>
          <Link to="/resume-analyzer" className="analyzeButton" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} /> Go to Resume Analyzer
          </Link>
        </div>
      </div>
    );
  }

  const career = analysis.best_career?.role || "Software Professional";
  const confidence = analysis.best_career?.confidence ?? 0;
  const coverage = analysis.skill_gap?.coverage ?? 0;
  const matchedSkills = analysis.skill_gap?.matched_skills || [];
  const missingSkills = analysis.skill_gap?.missing_skills || [];

  return (
    <div className="page">
      <div className="pageHero">
        <p className="eyebrow">PERSONALIZED LEARNING ROADMAP</p>
        <h1>Your Personalized <span>Career Roadmap.</span></h1>
        <p>
          A structured multi-stage learning path tailored to your <strong style={{ color: "#a598ff" }}>{career}</strong> target profile.
        </p>
      </div>

      {error && (
        <div className="emptyState" style={{ marginBottom: "24px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", color: "#fca5a5", flexDirection: "row", gap: "10px" }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Target Career Header */}
      <div className="metrics" style={{ marginBottom: "28px" }}>
        <div className="metricCard highlight">
          <span>TARGET CAREER</span>
          <h2 style={{ fontSize: "22px" }}>{career}</h2>
          <strong>{Number(confidence).toFixed(1)}% AI confidence match</strong>
        </div>

        <div className="metricCard">
          <span>SKILL COVERAGE</span>
          <h2>{Number(coverage).toFixed(1)}%</h2>
          <strong>Current readiness for {career}</strong>
        </div>

        <div className="metricCard">
          <span>SKILLS TO MASTER</span>
          <h2>{missingSkills.length}</h2>
          <strong>Identified skill gaps</strong>
        </div>
      </div>

      {/* Action shortcuts */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
        <button
          className="analyzeButton"
          style={{ padding: "10px 18px", fontSize: "14px" }}
          onClick={() => navigate("/ai-interview")}
        >
          <Video size={16} /> Practice {career} Interview
        </button>
        <button
          className="navLink active"
          style={{ padding: "10px 18px", fontSize: "14px", cursor: "pointer" }}
          onClick={() => navigate("/jobs")}
        >
          <Briefcase size={16} /> Search Matched Jobs
        </button>
        <button
          className="navLink"
          style={{ padding: "10px 18px", fontSize: "14px", cursor: "pointer", border: "1px solid #2a3547" }}
          onClick={() => fetchRoadmap(analysis)}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Regenerate Roadmap
        </button>
      </div>

      {/* Skills Comparison Row */}
      <div className="resultGrid" style={{ marginBottom: "32px" }}>
        <div className="resultCard">
          <h3 style={{ color: "#6ee7b7", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} /> Matched Resume Skills ({matchedSkills.length})
          </h3>
          <div className="skills matched">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((s) => <span key={s}>✓ {s}</span>)
            ) : (
              <p style={{ color: "#8491a6", fontSize: "13px" }}>No direct skill overlaps detected.</p>
            )}
          </div>
        </div>

        <div className="resultCard">
          <h3 style={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} /> Priority Skill Gaps ({missingSkills.length})
          </h3>
          <div className="skills missing">
            {missingSkills.length > 0 ? (
              missingSkills.map((s) => <span key={s}>△ {s}</span>)
            ) : (
              <p style={{ color: "#6ee7b7", fontSize: "13px" }}>Great work! No major missing skills for this role.</p>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Stage Roadmap */}
      <div className="sectionTitle">
        <p>ACTIONABLE LEARNING PATHWAY</p>
        <h2>6-Stage Professional Roadmap</h2>
      </div>

      {loading && (
        <div className="loadingCard" style={{ marginBottom: "24px" }}>
          <div className="loader"></div>
          <div>
            <h3>Generating Personalized Ollama Roadmap...</h3>
            <p>Tailoring stages for {career} using local Llama 3.2 3B.</p>
          </div>
        </div>
      )}

      {roadmap?.stages && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {roadmap.stages.map((st, idx) => (
            <div key={idx} className="resultCard" style={{ borderLeft: "4px solid #7063ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#a598ff", fontSize: "18px" }}>{st.title}</h3>
                <span style={{ fontSize: "12px", color: "#6ee7b7", background: "rgba(52,211,153,0.1)", padding: "4px 12px", borderRadius: "20px", border: "1px solid rgba(52,211,153,0.2)" }}>
                  Duration: {st.duration}
                </span>
              </div>

              {/* Focus Skills */}
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ fontSize: "12px", color: "#8491a6", textTransform: "uppercase" }}>Focus Skills:</strong>
                <div className="skills" style={{ marginTop: "6px" }}>
                  {(st.focus_skills || []).map((fs) => (
                    <span key={fs} style={{ background: "rgba(112,99,255,0.1)", color: "#a598ff", borderColor: "rgba(112,99,255,0.2)" }}>
                      {fs}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ fontSize: "12px", color: "#8491a6", textTransform: "uppercase" }}>Action Steps:</strong>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", color: "#e2e8f0", fontSize: "14px", lineHeight: 1.7 }}>
                  {(st.action_items || []).map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              {/* Milestone Project */}
              {st.milestone_project && (
                <div style={{ background: "#0a1020", padding: "10px 14px", borderRadius: "8px", border: "1px solid #1e2838", fontSize: "13px" }}>
                  <strong style={{ color: "#fbbf24" }}>🏆 Milestone Project: </strong>
                  <span style={{ color: "#cbd5e1" }}>{st.milestone_project}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {roadmap && (
        <p style={{ fontSize: "11px", color: roadmap.is_llm ? "#6ee7b7" : "#8491a6", marginTop: "16px", textAlign: "center" }}>
          {roadmap.is_llm ? "⚡ Enhanced with Local Ollama AI (Llama 3.2 3B)" : "ℹ️ Structured Skill-Gap Roadmap"}
        </p>
      )}
    </div>
  );
}

export default CareerRoadmap;