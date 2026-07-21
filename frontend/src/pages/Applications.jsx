import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, GraduationCap, Trash2, ArrowRight } from "lucide-react";

const STATUS_COLORS = {
  Saved:     { color: "#a598ff", bg: "rgba(109,93,252,0.08)",  border: "rgba(109,93,252,0.25)" },
  Applied:   { color: "#6ee7b7", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)" },
  Interview: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)" },
  Selected:  { color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.4)"  },
  Rejected:  { color: "#fca5a5", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
};

const STATUS_TABS = ["All", "Saved", "Applied", "Interview", "Selected", "Rejected"];

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
    const updated = apps.map((a) =>
      a.id === id && a.type === type ? { ...a, status: newStatus } : a
    );
    setApps(updated);
    localStorage.setItem("careerLensApplications", JSON.stringify(updated));
  }

  function removeApp(id, type) {
    const updated = apps.filter((a) => !(a.id === id && a.type === type));
    setApps(updated);
    localStorage.setItem("careerLensApplications", JSON.stringify(updated));
  }

  const filtered =
    activeTab === "All"
      ? apps
      : apps.filter((a) => a.status === activeTab);

  return (
    <div className="page">
      <div className="pageHero">
        <p className="eyebrow">APPLICATION TRACKER</p>
        <h1>Track your <span>Applications.</span></h1>
        <p>Manage saved jobs, internships, and interview progress.</p>
      </div>

      {/* Stats */}
      <div className="metrics" style={{ marginBottom: "28px" }}>
        <div className="metricCard">
          <span>TOTAL</span>
          <h2>{apps.length}</h2>
          <strong>Applications</strong>
        </div>
        <div className="metricCard">
          <span>JOBS</span>
          <h2>{apps.filter((a) => a.type === "Job").length}</h2>
          <strong>Saved / Applied</strong>
        </div>
        <div className="metricCard">
          <span>INTERNSHIPS</span>
          <h2>{apps.filter((a) => a.type === "Internship").length}</h2>
          <strong>Saved / Applied</strong>
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
              ? "No applications yet. Save jobs or internships to track them here."
              : `No ${activeTab.toLowerCase()} applications.`}
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

      {/* Application cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {filtered.map((app) => {
          const st = STATUS_COLORS[app.status] || STATUS_COLORS.Saved;
          const statuses = ["Saved", "Applied", "Interview", "Selected", "Rejected"];

          return (
            <div key={app.id + app.type} className="resultCard" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Header */}
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
                    <strong style={{ fontSize: "15px" }}>{app.role}</strong>
                    <p style={{ margin: "2px 0 0", color: "#8491a6", fontSize: "13px" }}>
                      {app.company} · {app.location}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontSize: "12px", fontWeight: 700,
                    color: app.matchPercentage >= 60 ? "#6ee7b7" : app.matchPercentage >= 30 ? "#fbbf24" : "#a598ff",
                  }}>
                    {app.matchPercentage}% match
                  </span>
                  <span style={{
                    fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                    color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                    fontWeight: 700,
                  }}>
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Applied date */}
              <p style={{ margin: 0, color: "#4a5568", fontSize: "12px" }}>
                Saved on {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>

              {/* Progress bar */}
              <div>
                <div className="progress">
                  <div style={{ width: `${app.matchPercentage}%` }} />
                </div>
              </div>

              {/* Status update + delete */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#8491a6", marginRight: "4px" }}>Update status:</span>
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(app.id, app.type, s)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      border: app.status === s ? `1px solid ${STATUS_COLORS[s]?.color}` : "1px solid #2a3547",
                      background: app.status === s ? STATUS_COLORS[s]?.bg : "transparent",
                      color: app.status === s ? STATUS_COLORS[s]?.color : "#8491a6",
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => removeApp(app.id, app.type)}
                  title="Remove application"
                  style={{
                    marginLeft: "auto",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(239,68,68,0.2)",
                    background: "rgba(239,68,68,0.06)",
                    color: "#fca5a5",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer nav */}
      {apps.length > 0 && (
        <div style={{ display: "flex", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
          <Link to="/jobs" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#8073ff", fontSize: "13px", textDecoration: "none", fontWeight: 600 }}>
            <Briefcase size={14} /> Find More Jobs <ArrowRight size={13} />
          </Link>
          <Link to="/internships" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#8073ff", fontSize: "13px", textDecoration: "none", fontWeight: 600 }}>
            <GraduationCap size={14} /> Find More Internships <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default Applications;