import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { Briefcase, MapPin, ExternalLink, CheckCircle, Search, AlertCircle, Bookmark, CheckSquare } from "lucide-react";

function Jobs() {
  const [analysis, setAnalysis] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [configMessage, setConfigMessage] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("India");
  const [applied, setApplied] = useState({});

  useEffect(() => {
    const raw = localStorage.getItem("careerLensAnalysis");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setAnalysis(parsed);
      const targetRole = parsed.best_career?.role || "AI ML Engineer";
      setRoleSearch(targetRole);
      fetchJobs(targetRole, "India", parsed);
    } catch (e) {
      console.error("Failed to load analysis:", e);
    }
  }, []);

  const fetchJobs = async (role, loc, currentAnalysis) => {
    setLoading(true);
    try {
      const userSkills = currentAnalysis?.skills_detected || [];
      const skillsQuery = userSkills.length > 0 ? `&skills=${encodeURIComponent(userSkills.join(","))}` : "";
      const res = await fetch(`${API_BASE_URL}/jobs?role=${encodeURIComponent(role)}&location=${encodeURIComponent(loc)}${skillsQuery}`);
      const data = await res.json();

      if (data.configured === false) {
        setConfigured(false);
        setConfigMessage(data.message || "Live job service is not configured. Please set JOBS_API_KEY in backend environment.");
        setJobs([]);
      } else {
        setConfigured(true);
        setJobs(data.results || []);
      }
    } catch (err) {
      console.error("Jobs API error:", err);
      setConfigured(false);
      setConfigMessage("Unable to connect to backend Jobs API service.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(roleSearch, locationSearch, analysis);
  };

  const saveApplicationRecord = (job, status = "Saved") => {
    const raw = localStorage.getItem("careerLensApplications");
    const apps = raw ? JSON.parse(raw) : [];

    const existingIndex = apps.findIndex((a) => a.id === job.id && a.type === "Job");
    
    if (existingIndex >= 0) {
      apps[existingIndex].status = status;
      if (status === "Applied") apps[existingIndex].userConfirmedAppliedAt = new Date().toISOString();
      if (status === "Application Opened") apps[existingIndex].applicationOpenedAt = new Date().toISOString();
    } else {
      apps.push({
        id: job.id,
        type: "Job",
        role: job.title,
        company: job.company,
        location: job.location,
        source: job.source || "Web Provider",
        sourceUrl: job.sourceUrl || "#",
        matchPercentage: job.matchPercentage || 50,
        status: status,
        savedAt: new Date().toISOString(),
        applicationOpenedAt: status === "Application Opened" ? new Date().toISOString() : null,
        userConfirmedAppliedAt: status === "Applied" ? new Date().toISOString() : null
      });
    }

    localStorage.setItem("careerLensApplications", JSON.stringify(apps));
    setApplied((prev) => ({ ...prev, [job.id]: status }));
  };

  /* ── No resume analysis ─────────────────────────────────────── */
  if (!analysis) {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">OPPORTUNITIES</p>
          <h1>Find your next <span>Job.</span></h1>
          <p>Discover real-time jobs matched to your skills and career goals.</p>
        </div>

        <div className="emptyState" style={{ flexDirection: "column", gap: "18px" }}>
          <p style={{ margin: 0 }}>Analyze your resume first to discover matching real-time jobs.</p>
          <Link to="/resume-analyzer" className="analyzeButton" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            Go to Resume Analyzer
          </Link>
        </div>
      </div>
    );
  }

  const detectedCareer = analysis.best_career?.role || "AI ML Engineer";

  return (
    <div className="page">
      <div className="pageHero">
        <p className="eyebrow">REAL-TIME JOB DISCOVERY</p>
        <h1>Jobs Matched <span>For You.</span></h1>
        <p>
          Search real-time job openings tailored for <strong style={{ color: "#a598ff" }}>{detectedCareer}</strong>.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={roleSearch}
          onChange={(e) => setRoleSearch(e.target.value)}
          placeholder="Job title or role..."
          style={{
            flex: 2, minWidth: "200px", padding: "12px 16px", borderRadius: "10px",
            background: "#0a1020", border: "1px solid #273247", color: "#e2e8f0", outline: "none"
          }}
        />
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder="Location (e.g. India, Remote)..."
          style={{
            flex: 1, minWidth: "150px", padding: "12px 16px", borderRadius: "10px",
            background: "#0a1020", border: "1px solid #273247", color: "#e2e8f0", outline: "none"
          }}
        />
        <button type="submit" className="analyzeButton" style={{ padding: "12px 20px" }} disabled={loading}>
          <Search size={16} /> Search Jobs
        </button>
      </form>

      {/* Unconfigured Truthful State */}
      {!configured && (
        <div className="emptyState" style={{ flexDirection: "column", gap: "14px", border: "1px dashed rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.04)" }}>
          <AlertCircle size={32} style={{ color: "#fbbf24" }} />
          <h3 style={{ margin: 0, color: "#fbbf24" }}>Live Job Service Not Configured</h3>
          <p style={{ margin: 0, textAlign: "center", color: "#a0aec0", maxWidth: "600px", lineHeight: 1.6 }}>
            {configMessage}
          </p>
          <div style={{ background: "#0a1020", padding: "12px 18px", borderRadius: "8px", border: "1px solid #1f2a38", fontSize: "12px", color: "#8491a6" }}>
            <code>Set JOBS_API_KEY=your_key in backend environment variables to enable real-time listings.</code>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="loadingCard">
          <div className="loader"></div>
          <div>
            <h3>Fetching Real-Time Job Listings...</h3>
            <p>Searching configured jobs provider for {roleSearch}.</p>
          </div>
        </div>
      )}

      {/* Results */}
      {configured && !loading && jobs.length === 0 && (
        <div className="emptyState">
          No active job listings found for "{roleSearch}" in "{locationSearch}". Try broadening your search query.
        </div>
      )}

      {configured && !loading && jobs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {jobs.map((job) => {
            const currentStatus = applied[job.id] || "None";

            return (
              <div key={job.id} className="resultCard" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "17px", color: "#e2e8f0" }}>{job.title}</h3>
                    <p style={{ margin: 0, color: "#8491a6", fontSize: "14px" }}>{job.company}</p>
                  </div>
                  <div style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 700,
                    background: "rgba(109,93,252,0.1)", color: "#a598ff", border: "1px solid rgba(109,93,252,0.25)"
                  }}>
                    {job.matchPercentage}% CareerLens Skill Match
                  </div>
                </div>

                <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                    <MapPin size={13} /> {job.location || "Remote / Unspecified"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                    <Briefcase size={13} /> {job.type || "Full-time"}
                  </span>
                  {job.source && (
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Source: {job.source}</span>
                  )}
                </div>

                {job.description && (
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {job.description}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px", alignItems: "center" }}>
                  {job.sourceUrl && (
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="navLink active"
                      style={{ padding: "10px 18px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", textDecoration: "none" }}
                      onClick={() => saveApplicationRecord(job, "Application Opened")}
                    >
                      <ExternalLink size={15} /> Apply on Source Site
                    </a>
                  )}

                  <button
                    className="navLink"
                    style={{
                      padding: "10px 18px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "7px", fontSize: "14px",
                      border: "1px solid #2a3547", cursor: "pointer", background: currentStatus === "Saved" ? "rgba(109,93,252,0.2)" : "transparent"
                    }}
                    onClick={() => saveApplicationRecord(job, "Saved")}
                  >
                    <Bookmark size={15} /> {currentStatus === "Saved" ? "Saved to Tracker" : "Save Job"}
                  </button>

                  <button
                    className="navLink"
                    style={{
                      padding: "10px 18px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "7px", fontSize: "14px",
                      border: "1px solid rgba(52,211,153,0.3)", cursor: "pointer", color: "#6ee7b7", background: currentStatus === "Applied" ? "rgba(52,211,153,0.2)" : "transparent"
                    }}
                    onClick={() => saveApplicationRecord(job, "Applied")}
                  >
                    <CheckSquare size={15} /> {currentStatus === "Applied" ? "✓ Applied - Confirmed" : "Mark as Applied"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Jobs;