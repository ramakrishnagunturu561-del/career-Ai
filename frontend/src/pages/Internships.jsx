import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, MapPin, ExternalLink, Search, AlertCircle, Bookmark, CheckSquare } from "lucide-react";

function Internships() {
  const [analysis, setAnalysis] = useState(null);
  const [internships, setInternships] = useState([]);
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
      fetchInternships(targetRole, "India", parsed);
    } catch (e) {
      console.error("Failed to load analysis:", e);
    }
  }, []);

  const fetchInternships = async (role, loc, currentAnalysis) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/internships?role=${encodeURIComponent(role)}&location=${encodeURIComponent(loc)}`);
      const data = await res.json();

      if (data.configured === false) {
        setConfigured(false);
        setConfigMessage(data.message || "Live internship service is not configured. Please set JOBS_API_KEY in backend environment.");
        setInternships([]);
      } else {
        setConfigured(true);
        const userSkills = currentAnalysis?.skills_detected || [];

        const results = (data.results || []).map((j) => {
          const descLower = (j.description || "").toLowerCase();
          const matched = userSkills.filter((s) => descLower.includes(s.toLowerCase()));
          const matchPct = userSkills.length > 0 ? Math.round((matched.length / userSkills.length) * 100) : 50;
          return {
            ...j,
            matchedSkills: matched,
            matchPercentage: Math.max(25, Math.min(98, matchPct))
          };
        });

        setInternships(results);
      }
    } catch (err) {
      console.error("Internships API error:", err);
      setConfigured(false);
      setConfigMessage("Unable to connect to backend Internships API service.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInternships(roleSearch, locationSearch, analysis);
  };

  const saveApplicationRecord = (item, status = "Saved") => {
    const raw = localStorage.getItem("careerLensApplications");
    const apps = raw ? JSON.parse(raw) : [];

    const existingIndex = apps.findIndex((a) => a.id === item.id && a.type === "Internship");
    
    if (existingIndex >= 0) {
      apps[existingIndex].status = status;
      if (status === "Applied") apps[existingIndex].userConfirmedAppliedAt = new Date().toISOString();
      if (status === "Application Opened") apps[existingIndex].applicationOpenedAt = new Date().toISOString();
    } else {
      apps.push({
        id: item.id,
        type: "Internship",
        role: item.title,
        company: item.company,
        location: item.location,
        source: item.source || "Web Provider",
        sourceUrl: item.sourceUrl || "#",
        matchPercentage: item.matchPercentage || 50,
        status: status,
        savedAt: new Date().toISOString(),
        applicationOpenedAt: status === "Application Opened" ? new Date().toISOString() : null,
        userConfirmedAppliedAt: status === "Applied" ? new Date().toISOString() : null
      });
    }

    localStorage.setItem("careerLensApplications", JSON.stringify(apps));
    setApplied((prev) => ({ ...prev, [item.id]: status }));
  };

  /* ── No resume ─────────────────────────────────────────────── */
  if (!analysis) {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">STUDENT OPPORTUNITIES</p>
          <h1>Discover <span>Internships.</span></h1>
          <p>Find real-time internships that match your skills and career direction.</p>
        </div>
        <div className="emptyState" style={{ flexDirection: "column", gap: "18px" }}>
          <p style={{ margin: 0 }}>Analyze your resume first to discover matching internships.</p>
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
        <p className="eyebrow">REAL-TIME INTERNSHIP DISCOVERY</p>
        <h1>Internships Matched <span>For You.</span></h1>
        <p>
          Internship opportunities matched for <strong style={{ color: "#a598ff" }}>{detectedCareer}</strong>.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={roleSearch}
          onChange={(e) => setRoleSearch(e.target.value)}
          placeholder="Internship role (e.g. AI Intern, ML Trainee)..."
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
          <Search size={16} /> Search Internships
        </button>
      </form>

      {/* Unconfigured Truthful State */}
      {!configured && (
        <div className="emptyState" style={{ flexDirection: "column", gap: "14px", border: "1px dashed rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.04)" }}>
          <AlertCircle size={32} style={{ color: "#fbbf24" }} />
          <h3 style={{ margin: 0, color: "#fbbf24" }}>Live Internship Service Not Configured</h3>
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
            <h3>Fetching Real-Time Internship Opportunities...</h3>
            <p>Searching configured provider for {roleSearch} internships.</p>
          </div>
        </div>
      )}

      {/* Results */}
      {configured && !loading && internships.length === 0 && (
        <div className="emptyState">
          No active internship listings found for "{roleSearch}" in "{locationSearch}".
        </div>
      )}

      {configured && !loading && internships.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {internships.map((item) => {
            const currentStatus = applied[item.id] || "None";

            return (
              <div key={item.id} className="resultCard" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "17px", color: "#e2e8f0" }}>{item.title}</h3>
                    <p style={{ margin: 0, color: "#8491a6", fontSize: "14px" }}>{item.company}</p>
                  </div>
                  <div style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 700,
                    background: "rgba(52,211,153,0.1)", color: "#6ee7b7", border: "1px solid rgba(52,211,153,0.25)"
                  }}>
                    {item.matchPercentage}% Skill Match
                  </div>
                </div>

                <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                    <MapPin size={13} /> {item.location || "Remote / Unspecified"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                    <GraduationCap size={13} /> {item.type || "Internship"}
                  </span>
                </div>

                {item.description && (
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.description}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px", alignItems: "center" }}>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="navLink active"
                      style={{ padding: "10px 18px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", textDecoration: "none" }}
                      onClick={() => saveApplicationRecord(item, "Application Opened")}
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
                    onClick={() => saveApplicationRecord(item, "Saved")}
                  >
                    <Bookmark size={15} /> {currentStatus === "Saved" ? "Saved to Tracker" : "Save Internship"}
                  </button>

                  <button
                    className="navLink"
                    style={{
                      padding: "10px 18px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "7px", fontSize: "14px",
                      border: "1px solid rgba(52,211,153,0.3)", cursor: "pointer", color: "#6ee7b7", background: currentStatus === "Applied" ? "rgba(52,211,153,0.2)" : "transparent"
                    }}
                    onClick={() => saveApplicationRecord(item, "Applied")}
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

export default Internships;