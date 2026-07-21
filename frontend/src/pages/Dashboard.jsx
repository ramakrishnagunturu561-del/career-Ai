import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Map, Briefcase, Video, Sparkles,
  ArrowRight, CheckCircle, ClipboardList,
  GraduationCap, TrendingUp, Star,
} from "lucide-react";

function Dashboard() {
  const [analysis, setAnalysis] = useState(null);
  const [apps, setApps] = useState([]);
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    // Load resume analysis
    try {
      const raw = localStorage.getItem("careerLensAnalysis");
      if (raw) setAnalysis(JSON.parse(raw));
    } catch (e) { /* ignore */ }

    // Load applications
    try {
      const raw = localStorage.getItem("careerLensApplications");
      if (raw) setApps(JSON.parse(raw));
    } catch (e) { /* ignore */ }

    // Load interview results
    try {
      const raw = localStorage.getItem("careerLensInterviewResults");
      if (raw) setInterviews(JSON.parse(raw));
    } catch (e) { /* ignore */ }
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
          <Link to="/resume-analyzer" className="analyzeButton" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "9px", marginTop: "22px" }}>
            <Sparkles size={17} /> Analyze Resume
          </Link>
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

      {/* Stats row */}
      <div className="metrics" style={{ marginBottom: "28px" }}>
        <div className="metricCard highlight">
          <span>BEST CAREER MATCH</span>
          <h2 style={{ fontSize: "22px" }}>{career}</h2>
          <strong>{confidence?.toFixed(1)}% AI confidence</strong>
        </div>

        <div className="metricCard">
          <span>SKILLS DETECTED</span>
          <h2>{totalSkills ?? "—"}</h2>
          <strong>From your resume</strong>
        </div>

        <div className="metricCard">
          <span>SKILL COVERAGE</span>
          <h2>{coverage != null ? `${coverage.toFixed(1)}%` : "—"}</h2>
          <strong>For {career}</strong>
        </div>
      </div>

      {/* Activity row */}
      <div className="metrics" style={{ marginBottom: "32px" }}>
        <div className="metricCard">
          <span>JOB APPLICATIONS</span>
          <h2>{jobApps.length}</h2>
          <strong>Saved / Applied</strong>
        </div>

        <div className="metricCard">
          <span>INTERNSHIPS</span>
          <h2>{internApps.length}</h2>
          <strong>Saved / Applied</strong>
        </div>

        <div className="metricCard">
          <span>INTERVIEW ATTEMPTS</span>
          <h2>{interviews.length}</h2>
          <strong>
            {latestInterview
              ? `Latest: ${latestInterview.overallScore?.toFixed(1)}/10`
              : "Not started yet"}
          </strong>
        </div>
      </div>

      {/* Quick actions */}
      <h3 style={{ color: "#a598ff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <TrendingUp size={18} /> Next Steps
      </h3>
      <div className="dashboardGrid" style={{ marginBottom: "28px" }}>

        <Link to="/roadmap" className="featureCard">
          <Map size={30} />
          <h3>Career Roadmap</h3>
          <p>
            {analysis.skill_gap?.missing_skills?.length > 0
              ? `${analysis.skill_gap.missing_skills.length} skills to learn for ${career}.`
              : "View your personalized learning path."}
          </p>
          <span>View Roadmap <ArrowRight size={15} /></span>
        </Link>

        <Link to="/jobs" className="featureCard">
          <Briefcase size={30} />
          <h3>Matched Jobs</h3>
          <p>
            Discover job openings matched to your <strong style={{ color: "#a598ff" }}>{career}</strong> profile.
          </p>
          <span>Explore Jobs <ArrowRight size={15} /></span>
        </Link>

        <Link to="/internships" className="featureCard">
          <GraduationCap size={30} />
          <h3>Matched Internships</h3>
          <p>
            Find internships aligned with your detected skills and career goal.
          </p>
          <span>Find Internships <ArrowRight size={15} /></span>
        </Link>

        <Link to="/ai-interview" className="featureCard">
          <Video size={30} />
          <h3>AI Mock Interview</h3>
          <p>
            {latestInterview
              ? `Last score: ${latestInterview.overallScore?.toFixed(1)}/10 · Try again to improve.`
              : `Practice ${career} interview questions with AI scoring.`}
          </p>
          <span>
            {latestInterview ? "Retry Interview" : "Start Interview"}
            <ArrowRight size={15} />
          </span>
        </Link>
      </div>

      {/* Applications summary if any */}
      {apps.length > 0 && (
        <>
          <h3 style={{ color: "#a598ff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardList size={18} /> Recent Applications
          </h3>
          <div className="resultCard" style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {apps.slice(-3).reverse().map((app) => (
                <div key={app.id + app.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1d2635" }}>
                  <div>
                    <strong style={{ fontSize: "14px" }}>{app.role}</strong>
                    <p style={{ margin: "2px 0 0", color: "#8491a6", fontSize: "12px" }}>{app.company} · {app.type}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#a598ff" }}>{app.matchPercentage}% match</span>
                    <span style={{ fontSize: "11px", color: "#6ee7b7", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", padding: "3px 10px", borderRadius: "20px" }}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/applications" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "14px", color: "#8073ff", fontSize: "13px", textDecoration: "none", fontWeight: 600 }}>
              View All Applications <ArrowRight size={14} />
            </Link>
          </div>
        </>
      )}

      {/* Detected skills */}
      <h3 style={{ color: "#a598ff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <Star size={18} /> Your Detected Skills
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
          Re-analyze Resume <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
