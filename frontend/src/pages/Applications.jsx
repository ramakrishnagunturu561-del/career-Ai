import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, GraduationCap, Trash2, ArrowRight, ExternalLink, CheckCircle } from "lucide-react";

const STATUS_COLORS = {
  Saved: { color: "#a598ff", bg: "rgba(109,93,252,0.08)", border: "rgba(109,93,252,0.25)" },
  "Application Opened": { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.25)" },
  Applied: { color: "#6ee7b7", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)" },
  Interview: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)" },
  Selected: { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.4)" },
  Rejected: { color: "#fca5a5", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
};

const STATUS_TABS = ["All", "Saved", "Application Opened", "Applied", "Interview", "Selected", "Rejected"];

function Applications() {
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  function loadApps() {
    try {
      const raw = localStorage.getItem("careerLensApplications");
      setApps(raw ? JSON.parse(raw) : []);
    } catch (e) {
      setApps([]);
    }
  }

  useEffect(() => { loadApps(); }, []);

  function updateStatus(id, type, newStatus) {
    const updated = apps.map((a) => {
      if (a.id === id && a.type === type) {
        return {
          ...a,
          status: newStatus,
          userConfirmedAppliedAt: newStatus === "Applied" ? new Date().toISOString() : a.userConfirmedAppliedAt
        };
      }
      return a;
    });
    setApps(updated);
    localStorage.setItem("careerLensApplications", JSON.stringify(updated));
  }

  function removeApp(id, type) {
    const updated = apps.filter((a) => !(a.id === id && a.type === type));
    setApps(updated);
    localStorage.setItem("careerLensApplications", JSON.stringify(updated));
  }

  const filtered = activeTab === "All" ? apps : apps.filter((a) => a.status === activeTab);

  return (
    <div className="page">
      <div className="pageHero">
        <p className="eyebrow">APPLICATION TRACKER</p>
        <h1>Track your <span>Applications.</span></h1>
        <p>Manage saved jobs, internships, and interview progress with real status tracking.</p>
      </div>

      {/* Stats */}
      <div className="metrics" style={{ marginBottom: "28px" }}>
        <div className="metricCard">
          <span>TOTAL TRACKED</span>
          <h2>{apps.length}</h2>
          <strong>Saved & Applied Opportunities</strong>
        </div>
        <div className="metricCard">
          <span>JOBS</span>
          <h2>{apps.filter((a) => a.type === "Job").length}</h2>
          <strong>Tracked Job Openings</strong>
        </div>
        <div className="metricCard">
          <span>INTERNSHIPS</span>
          <h2>{apps.filter((a) => a.type === "Internship").length}</h2>
          <strong>Tracked Internships</strong>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {STATUS_TABS.map((tab) => {
          const count = tab === "All" ? apps.length : apps.filter((a) => a.status === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: isActive ? "1px solid #7063ff" : "1px solid #2a3547",
                background: isActive ? "rgba(112,99,255,0.15)" : "transparent",
                color: isActive ? "#a598ff" : "#8491a6",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 400,
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              {tab} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="emptyState" style={{ flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0 }}>
            {activeTab === "All"
              ? "No applications saved yet. Discover jobs or internships to start tracking."
              : `No applications with status '${activeTab}'.`}
          </p>
          {activeTab === "All" && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <Link to="/jobs" className="analyzeButton" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <Briefcase size={15} /> Browse Jobs
              </Link>
              <Link to="/internships" className="navLink" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 20px", border: "1px solid #2a3547", borderRadius: "10px" }}>
                <GraduationCap size={15} /> Browse Internships
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {filtered.map((app) => {
          const st = STATUS_COLORS[app.status] || STATUS_COLORS.Saved;
          const statuses = ["Saved", "Application Opened", "Applied", "Interview", "Selected", "Rejected"];

          return (
            <div key={app.id + app.type} className="resultCard" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    display: "grid", placeItems: "center",
                    background: app.type === "Job" ? "rgba(109,93,252,0.15)" : "rgba(52,211,153,0.1)",
                    color: app.type === "Job" ? "#a598ff" : "#6ee7b7",
                    flexShrink: 0,
                  }}>
                    {app.type === "Job" ? <Briefcase size={16} /> : <GraduationCap size={16} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: "15px", color: "#e2e8f0" }}>{app.role}</strong>
                    <p style={{ margin: "2px 0 0", color: "#8491a6", fontSize: "13px" }}>
                      {app.company} · {app.location}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {app.matchPercentage > 0 && (
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#a598ff" }}>
                      {app.matchPercentage}% match
                    </span>
                  )}
                  <span style={{
                    fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                    color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                    fontWeight: 700,
                  }}>
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Source link & dates */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                <span>Saved on {new Date(app.savedAt || Date.now()).toLocaleDateString()}</span>
                {app.sourceUrl && app.sourceUrl !== "#" && (
                  <a href={app.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#8073ff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    View Source Listing <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Status updater */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "12px", color: "#8491a6", marginRight: "4px" }}>Update status:</span>
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(app.id, app.type, s)}
                    style={{
                      padding: "5px 12px", borderRadius: "20px",
                      border: app.status === s ? `1px solid ${STATUS_COLORS[s]?.color || '#7063ff'}` : "1px solid #2a3547",
                      background: app.status === s ? STATUS_COLORS[s]?.bg || 'rgba(112,99,255,0.1)' : "transparent",
                      color: app.status === s ? STATUS_COLORS[s]?.color || '#a598ff' : "#8491a6",
                      fontSize: "11px", cursor: "pointer", transition: "0.2s"
                    }}
                  >
                    {s}
                  </button>
                ))}

                <button
                  onClick={() => removeApp(app.id, app.type)}
                  title="Remove application"
                  style={{
                    marginLeft: "auto", padding: "6px 10px", borderRadius: "8px",
                    border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)",
                    color: "#fca5a5", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px"
                  }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Applications;