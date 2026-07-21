import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, ExternalLink, CheckCircle } from "lucide-react";

/* ── Sample job data per career ────────────────────────────── */
const SAMPLE_JOBS = {
  "AI ML Engineer": [
    {
      id: 1,
      title: "Machine Learning Engineer",
      company: "Google DeepMind",
      location: "Bangalore, India (Hybrid)",
      type: "Full-time",
      requiredSkills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "NLP"],
    },
    {
      id: 2,
      title: "AI Engineer",
      company: "Microsoft Azure AI",
      location: "Hyderabad, India (Remote)",
      type: "Full-time",
      requiredSkills: ["Python", "Machine Learning", "Azure ML", "REST APIs", "Docker"],
    },
    {
      id: 3,
      title: "MLOps Engineer",
      company: "Flipkart",
      location: "Bangalore, India",
      type: "Full-time",
      requiredSkills: ["Python", "Kubernetes", "MLflow", "Docker", "CI/CD", "Machine Learning"],
    },
    {
      id: 4,
      title: "Deep Learning Researcher",
      company: "NVIDIA",
      location: "Pune, India",
      type: "Full-time",
      requiredSkills: ["PyTorch", "CUDA", "Deep Learning", "Computer Vision", "Python", "Research"],
    },
    {
      id: 5,
      title: "Data Scientist – AI Products",
      company: "Swiggy",
      location: "Bangalore, India",
      type: "Full-time",
      requiredSkills: ["Python", "Machine Learning", "SQL", "Feature Engineering", "Statistics"],
    },
  ],
  "Data Scientist": [
    {
      id: 1,
      title: "Senior Data Scientist",
      company: "Amazon",
      location: "Hyderabad, India (Hybrid)",
      type: "Full-time",
      requiredSkills: ["Python", "Machine Learning", "SQL", "Statistics", "R", "Tableau"],
    },
    {
      id: 2,
      title: "Data Scientist – Analytics",
      company: "Zomato",
      location: "Gurgaon, India",
      type: "Full-time",
      requiredSkills: ["Python", "SQL", "Data Visualization", "Pandas", "Scikit-learn"],
    },
    {
      id: 3,
      title: "ML Data Scientist",
      company: "Ola",
      location: "Bangalore, India",
      type: "Full-time",
      requiredSkills: ["Python", "Machine Learning", "Spark", "Hadoop", "SQL"],
    },
  ],
  "Software Engineer": [
    {
      id: 1,
      title: "Software Development Engineer II",
      company: "Amazon",
      location: "Hyderabad, India",
      type: "Full-time",
      requiredSkills: ["Java", "Python", "REST APIs", "System Design", "SQL", "AWS"],
    },
    {
      id: 2,
      title: "Full Stack Engineer",
      company: "Razorpay",
      location: "Bangalore, India",
      type: "Full-time",
      requiredSkills: ["React", "Node.js", "JavaScript", "MongoDB", "REST APIs"],
    },
    {
      id: 3,
      title: "Backend Engineer",
      company: "PhonePe",
      location: "Bangalore, India",
      type: "Full-time",
      requiredSkills: ["Java", "Spring Boot", "Kafka", "SQL", "Microservices"],
    },
  ],
  "Web Developer": [
    {
      id: 1,
      title: "Frontend Engineer",
      company: "Freshworks",
      location: "Chennai, India",
      type: "Full-time",
      requiredSkills: ["React", "JavaScript", "CSS", "HTML", "TypeScript", "REST APIs"],
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "Zoho",
      location: "Chennai, India",
      type: "Full-time",
      requiredSkills: ["React", "Node.js", "SQL", "JavaScript", "REST APIs"],
    },
  ],
  "Cybersecurity Analyst": [
    {
      id: 1,
      title: "Security Analyst",
      company: "Infosys",
      location: "Pune, India",
      type: "Full-time",
      requiredSkills: ["Network Security", "SIEM", "Python", "Linux", "Penetration Testing"],
    },
    {
      id: 2,
      title: "SOC Analyst",
      company: "TCS",
      location: "Bangalore, India",
      type: "Full-time",
      requiredSkills: ["SIEM", "Incident Response", "Firewall", "Linux", "Threat Analysis"],
    },
  ],
};

/* ── Compute match % ────────────────────────────────────────── */
function computeMatch(candidateSkills, jobSkills) {
  if (!jobSkills.length) return 0;
  const cLower = candidateSkills.map((s) => s.toLowerCase());
  const matched = jobSkills.filter((s) =>
    cLower.includes(s.toLowerCase())
  ).length;
  return Math.round((matched / jobSkills.length) * 100);
}

/* ── Fallback: pick closest career from our keys ───────────── */
function getBestJobSet(career) {
  const keys = Object.keys(SAMPLE_JOBS);
  const exact = keys.find(
    (k) => k.toLowerCase() === career?.toLowerCase()
  );
  if (exact) return { key: exact, jobs: SAMPLE_JOBS[exact] };

  // fuzzy: check if any keyword matches
  const fuzzy = keys.find(
    (k) =>
      career?.toLowerCase().includes(k.toLowerCase().split(" ")[0]) ||
      k.toLowerCase().includes(career?.toLowerCase().split(" ")[0])
  );
  if (fuzzy) return { key: fuzzy, jobs: SAMPLE_JOBS[fuzzy] };

  // default to AI ML Engineer
  return { key: "AI ML Engineer", jobs: SAMPLE_JOBS["AI ML Engineer"] };
}

/* ── Save job application to localStorage ───────────────────── */
function saveApplication(job, matchPct) {
  const raw = localStorage.getItem("careerLensApplications");
  const apps = raw ? JSON.parse(raw) : [];
  const alreadySaved = apps.some((a) => a.id === job.id && a.type === "Job");
  if (alreadySaved) return false;
  apps.push({
    id: job.id,
    type: "Job",
    role: job.title,
    company: job.company,
    location: job.location,
    matchPercentage: matchPct,
    status: "Saved",
    appliedAt: new Date().toISOString(),
  });
  localStorage.setItem("careerLensApplications", JSON.stringify(apps));
  return true;
}

/* ── Component ──────────────────────────────────────────────── */
function Jobs() {
  const [analysis, setAnalysis] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [career, setCareer] = useState("");
  const [applied, setApplied] = useState({});

  useEffect(() => {
    const raw = localStorage.getItem("careerLensAnalysis");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const detectedCareer = parsed.best_career?.role || "AI ML Engineer";
      const skills = parsed.skills_detected || [];

      setAnalysis(parsed);
      setCareer(detectedCareer);

      const { jobs: baseJobs } = getBestJobSet(detectedCareer);

      const scored = baseJobs.map((job) => ({
        ...job,
        matchPct: computeMatch(skills, job.requiredSkills),
        matchedSkills: job.requiredSkills.filter((s) =>
          skills.map((c) => c.toLowerCase()).includes(s.toLowerCase())
        ),
      }));

      scored.sort((a, b) => b.matchPct - a.matchPct);
      setJobs(scored);
    } catch (e) {
      console.error("Failed to load analysis:", e);
    }
  }, []);

  /* ── No resume yet ─────────────────────────────────────────── */
  if (!analysis) {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">OPPORTUNITIES</p>
          <h1>
            Find your next <span>Job.</span>
          </h1>
          <p>Discover jobs matched to your skills and career goals.</p>
        </div>

        <div className="emptyState" style={{ flexDirection: "column", gap: "18px" }}>
          <p style={{ margin: 0 }}>
            Analyze your resume first to discover matching jobs.
          </p>
          <Link to="/resume-analyzer" className="analyzeButton" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            Go to Resume Analyzer
          </Link>
        </div>
      </div>
    );
  }

  /* ── Jobs view ─────────────────────────────────────────────── */
  return (
    <div className="page">
      <div className="pageHero">
        <p className="eyebrow">OPPORTUNITIES</p>
        <h1>
          Jobs Matched <span>For You.</span>
        </h1>
        <p>
          Based on your <strong style={{ color: "#a598ff" }}>{career}</strong> career
          profile and resume skills.
        </p>
      </div>

      <p style={{ fontSize: "12px", color: "#4a5568", marginBottom: "24px" }}>
        ⚠️ Demo listings only — not real live job openings.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {jobs.map((job) => (
          <div key={job.id} className="resultCard" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "17px" }}>{job.title}</h3>
                <p style={{ margin: 0, color: "#8491a6", fontSize: "14px" }}>{job.company}</p>
              </div>

              {/* Match badge */}
              <div style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 700,
                background: job.matchPct >= 60
                  ? "rgba(52,211,153,0.1)"
                  : job.matchPct >= 30
                  ? "rgba(251,191,36,0.1)"
                  : "rgba(109,93,252,0.1)",
                color: job.matchPct >= 60
                  ? "#6ee7b7"
                  : job.matchPct >= 30
                  ? "#fbbf24"
                  : "#a598ff",
                border: `1px solid ${job.matchPct >= 60 ? "rgba(52,211,153,0.25)" : job.matchPct >= 30 ? "rgba(251,191,36,0.25)" : "rgba(109,93,252,0.25)"}`,
              }}>
                {job.matchPct}% Resume Match
              </div>
            </div>

            {/* Meta info */}
            <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                <MapPin size={13} /> {job.location}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                <Briefcase size={13} /> {job.type}
              </span>
            </div>

            {/* Match bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Skill Match</span>
                <span style={{ fontSize: "12px", color: "#8491a6" }}>
                  {job.matchedSkills.length} / {job.requiredSkills.length} skills
                </span>
              </div>
              <div className="progress">
                <div style={{ width: `${job.matchPct}%` }} />
              </div>
            </div>

            {/* Required skills */}
            <div className="skills">
              {job.requiredSkills.map((skill) => {
                const matched = job.matchedSkills
                  .map((s) => s.toLowerCase())
                  .includes(skill.toLowerCase());
                return (
                  <span
                    key={skill}
                    style={matched ? {
                      color: "#6ee7b7",
                      background: "rgba(52,211,153,0.07)",
                      borderColor: "rgba(52,211,153,0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    } : {}}
                  >
                    {matched && <CheckCircle size={11} />}
                    {skill}
                  </span>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
              <button
                className="navLink active"
                style={{ padding: "10px 18px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "7px", fontSize: "14px", cursor: "pointer" }}
                onClick={() => alert(`Viewing ${job.title} at ${job.company} — Demo only`)}
              >
                <ExternalLink size={15} /> View Job
              </button>

              <button
                className="navLink"
                disabled={applied[job.id] === "saved" || applied[job.id] === "duplicate"}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "14px",
                  cursor: applied[job.id] ? "default" : "pointer",
                  border: "1px solid #2a3547",
                  opacity: applied[job.id] ? 0.7 : 1,
                }}
                onClick={() => {
                  const saved = saveApplication(job, job.matchPct);
                  setApplied((prev) => ({
                    ...prev,
                    [job.id]: saved ? "saved" : "duplicate",
                  }));
                }}
              >
                {applied[job.id] === "saved"
                  ? "✅ Saved to Applications"
                  : applied[job.id] === "duplicate"
                  ? "Already Applied"
                  : "Save & Apply"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Jobs;