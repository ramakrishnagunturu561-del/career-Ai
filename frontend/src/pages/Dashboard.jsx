import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText, Map, Briefcase, Video, Sparkles,
  ArrowRight, CheckCircle, ClipboardList,
  GraduationCap, TrendingUp, Star, VideoOff
} from "lucide-react";

function Dashboard() {
  const [analysis, setAnalysis] = useState(null);
  const [apps, setApps] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load resume analysis
    try {
      const raw = localStorage.getItem("careerLensAnalysis");
      if (raw) setAnalysis(JSON.parse(raw));
    } catch (e) {
      console.error("Error reading careerLensAnalysis:", e);
    }

    // Load applications
    try {
      const raw = localStorage.getItem("careerLensApplications");
      if (raw) setApps(JSON.parse(raw));
    } catch (e) {
      console.error("Error reading careerLensApplications:", e);
    }

    // Load interview results
    try {
      const raw = localStorage.getItem("careerLensInterviewResults");
      if (raw) setInterviews(JSON.parse(raw));
    } catch (e) {
      console.error("Error reading careerLensInterviewResults:", e);
    }
  }, []);

  const career = analysis?.best_career?.role || null;
  const confidence = analysis?.best_career?.confidence ?? null;
  const totalSkills = analysis?.total_skills ?? null;
  const coverage = analysis?.skill_gap?.coverage ?? null;
  const latestInterview = interviews.length > 0 ? interviews[interviews.length - 1] : null;

  const jobApps = apps.filter((a) => a.type === "Job");
  const internApps = apps.filter((a) => a.type === "Internship");

  /* ── No analysis yet ─────────────────────────────────────── */
  if (!analysis) {
    return (
      <div className="page">
        <header>
          <div>
            <p className="eyebrow">DASHBOARD OVERVIEW</p>
            <h1>Welcome to your <span>Career Copilot.</span></h1>
            <p className="subtitle">
              Upload your resume to get started with personalized AI career intelligence.
            </p>
          </div>
          <div className="status">
            <span></span>AI Engine Online
          </div>
        </header>

        {/* CTA */}
        <div className="uploadCard" style={{ textAlign: "center", padding: "50px 38px" }}>
          <div className="uploadIcon" style={{ margin: "0 auto 20px" }}>
            <FileText size={30} />
          </div>
          <h2>Analyze Your Resume to Get Started</h2>
          <p>Upload your PDF resume and let CareerLens AI identify your best career path, skill gaps, and opportunities.</p>
          <button
            onClick={() => navigate("/resume-analyzer")}
            className="analyzeButton"
            style={{ marginTop: "22px" }}
          >
            <Sparkles size={17} /> Analyze Resume
          </button>
        </div>
      </div>
    );
  }

  /* ── Has analysis ────────────────────────────────────────── */
  return (
    <div className="page">
      <header>
        <div>
          <p className="eyebrow">DASHBOARD OVERVIEW</p>
          <h1>
            Welcome back, <span>{career}.</span>
          </h1>
          <p className="subtitle">
            Here's your personalized career intelligence summary based on your resume analysis.
          </p>
        </div>
        <div className="status">
          <span></span>AI Engine Online
        </div>
      </header>

      {/* Primary Metrics row */}
      <div className="metrics" style={{ marginBottom: "28px" }}>
        <div className="metricCard highlight">
          <span>BEST CAREER MATCH</span>
          <h2 style={{ fontSize: "22px" }}>{career}</h2>
          <strong>{confidence != null ? `${Number(confidence).toFixed(1)}% AI confidence` : "Predicted"}</strong>
        </div>

        <div className="metricCard">
          <span>SKILLS DETECTED</span>
          <h2>{totalSkills ?? 0}</h2>
          <strong>From your analyzed resume</strong>
        </div>

        <div className="metricCard">
          <span>SKILL COVERAGE</span>
          <h2>{coverage != null ? `${Number(coverage).toFixed(1)}%` : "0%"}</h2>
          <strong>For {career} profile</strong>
        </div>
      </div>

      {/* Activity & Tracking row */}
      <div className="metrics" style={{ marginBottom: "32px" }}>
        <div className="metricCard">
          <span>JOB APPLICATIONS</span>
          <h2>{jobApps.length}</h2>
          <strong>Tracked Jobs</strong>
        </div>

        <div className="metricCard">
          <span>INTERNSHIPS</span>
          <h2>{internApps.length}</h2>
          <strong>Tracked Internships</strong>
        </div>

        <div className="metricCard">
          <span>AI INTERVIEW ATTEMPTS</span>
          <h2>{interviews.length}</h2>
          <strong>
            {latestInterview
              ? `Latest: ${latestInterview.overallScore?.toFixed(1)}/10 (${latestInterview.difficulty})`
              : "No attempts yet"}
          </strong>
        </div>
      </div>

      {/* Quick actions */}
      <h3 style={{ color: "#a598ff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <TrendingUp size={18} /> Career Action Plan
      </h3>
      <div className="dashboardGrid" style={{ marginBottom: "28px" }}>
        <div className="featureCard" onClick={() => navigate("/roadmap")} style={{ cursor: "pointer" }}>
          <Map size={30} />
          <h3>Career Roadmap</h3>
          <p>
            {analysis.skill_gap?.missing_skills?.length > 0
              ? `${analysis.skill_gap.missing_skills.length} priority skills to master for ${career}.`
              : "View your structured 6-stage career roadmap."}
          </p>
          <span>View Roadmap <ArrowRight size={15} /></span>
        </div>

        <div className="featureCard" onClick={() => navigate("/jobs")} style={{ cursor: "pointer" }}>
          <Briefcase size={30} />
          <h3>Matched Jobs</h3>
          <p>
            Explore real-time job openings aligned with your <strong style={{ color: "#a598ff" }}>{career}</strong> profile.
          </p>
          <span>Explore Jobs <ArrowRight size={15} /></span>
        </div>

        <div className="featureCard" onClick={() => navigate("/internships")} style={{ cursor: "pointer" }}>
          <GraduationCap size={30} />
          <h3>Matched Internships</h3>
          <p>
            Discover internship opportunities matched to your target career and skills.
          </p>
          <span>Find Internships <ArrowRight size={15} /></span>
        </div>

        <div className="featureCard" onClick={() => navigate("/ai-interview")} style={{ cursor: "pointer" }}>
          <Video size={30} />
          <h3>AI Mock Interview</h3>
          <p>
            {latestInterview
              ? `Last score: ${latestInterview.overallScore?.toFixed(1)}/10 · Retake interview to improve.`
              : `Practice video & voice interview with Ollama AI.`}
          </p>
          <span>
            {latestInterview ? "Retake Interview" : "Start Video Interview"}
            <ArrowRight size={15} />
          </span>
        </div>
      </div>

      {/* Applications summary if any */}
      {apps.length > 0 && (
        <>
          <h3 style={{ color: "#a598ff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardList size={18} /> Tracked Applications ({apps.length})
          </h3>
          <div className="resultCard" style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {apps.slice(-3).reverse().map((app, i) => (
                <div key={app.id + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? "1px solid #1d2635" : "none" }}>
                  <div>
                    <strong style={{ fontSize: "14px" }}>{app.role}</strong>
                    <p style={{ margin: "2px 0 0", color: "#8491a6", fontSize: "12px" }}>{app.company} · {app.type}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {app.matchPercentage > 0 && (
                      <span style={{ fontSize: "12px", color: "#a598ff" }}>{app.matchPercentage}% match</span>
                    )}
                    <span style={{ fontSize: "11px", color: "#6ee7b7", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", padding: "3px 10px", borderRadius: "20px" }}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/applications" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "14px", color: "#8073ff", fontSize: "13px", textDecoration: "none", fontWeight: 600 }}>
              View All Applications Tracker <ArrowRight size={14} />
            </Link>
          </div>
        </>
      )}

      {/* Detected skills */}
      <h3 style={{ color: "#a598ff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <Star size={18} /> Resume Skills Profile ({analysis.skills_detected?.length || 0})
      </h3>
      <div className="resultCard">
        <div className="skills matched">
          {(analysis.skills_detected || []).map((s) => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle size={11} /> {s}
            </span>
          ))}
        </div>
        <Link to="/resume-analyzer" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "14px", color: "#8073ff", fontSize: "13px", textDecoration: "none", fontWeight: 600 }}>
          Re-analyze Different Resume <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
