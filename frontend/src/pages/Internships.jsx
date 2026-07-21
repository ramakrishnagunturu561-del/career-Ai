import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, MapPin, Clock, IndianRupee, CheckCircle, BookOpen } from "lucide-react";

/* ── Sample internship data per career ──────────────────────── */
const SAMPLE_INTERNSHIPS = {
  "AI ML Engineer": [
    {
      id: "int-1",
      role: "Machine Learning Intern",
      company: "Google",
      location: "Bangalore, India (Hybrid)",
      duration: "3 Months",
      stipend: "₹60,000/month",
      type: "Summer Internship",
      requiredSkills: ["Python", "Machine Learning", "TensorFlow", "NumPy", "Pandas"],
    },
    {
      id: "int-2",
      role: "AI Research Intern",
      company: "Microsoft Research",
      location: "Hyderabad, India (Remote)",
      duration: "6 Months",
      stipend: "₹50,000/month",
      type: "Research Internship",
      requiredSkills: ["Python", "Deep Learning", "NLP", "PyTorch", "Research"],
    },
    {
      id: "int-3",
      role: "Generative AI Intern",
      company: "Adobe",
      location: "Noida, India",
      duration: "4 Months",
      stipend: "₹45,000/month",
      type: "Industry Internship",
      requiredSkills: ["Python", "LLMs", "Transformers", "API Integration", "Prompt Engineering"],
    },
    {
      id: "int-4",
      role: "Data Science Intern",
      company: "Flipkart",
      location: "Bangalore, India",
      duration: "3 Months",
      stipend: "₹40,000/month",
      type: "Summer Internship",
      requiredSkills: ["Python", "SQL", "Statistics", "Machine Learning", "Data Visualization"],
    },
    {
      id: "int-5",
      role: "NLP Research Intern",
      company: "Amazon Alexa",
      location: "Remote",
      duration: "6 Months",
      stipend: "₹55,000/month",
      type: "Research Internship",
      requiredSkills: ["Python", "NLP", "BERT", "Transformers", "Linguistics"],
    },
    {
      id: "int-6",
      role: "Computer Vision Intern",
      company: "Ola Electric",
      location: "Bangalore, India",
      duration: "3 Months",
      stipend: "₹35,000/month",
      type: "Industry Internship",
      requiredSkills: ["Python", "OpenCV", "Deep Learning", "TensorFlow", "Computer Vision"],
    },
  ],
  "Data Scientist": [
    {
      id: "int-1",
      role: "Data Science Intern",
      company: "Zomato",
      location: "Gurgaon, India",
      duration: "3 Months",
      stipend: "₹30,000/month",
      type: "Summer Internship",
      requiredSkills: ["Python", "SQL", "Pandas", "Data Visualization", "Statistics"],
    },
    {
      id: "int-2",
      role: "Analytics Intern",
      company: "PhonePe",
      location: "Bangalore, India",
      duration: "6 Months",
      stipend: "₹40,000/month",
      type: "Industry Internship",
      requiredSkills: ["Python", "SQL", "Tableau", "Excel", "Statistics"],
    },
    {
      id: "int-3",
      role: "ML Engineer Intern",
      company: "Paytm",
      location: "Noida, India",
      duration: "4 Months",
      stipend: "₹35,000/month",
      type: "Industry Internship",
      requiredSkills: ["Python", "Machine Learning", "SQL", "Scikit-learn", "Feature Engineering"],
    },
  ],
  "Software Engineer": [
    {
      id: "int-1",
      role: "Software Developer Intern",
      company: "Infosys",
      location: "Pune, India",
      duration: "6 Months",
      stipend: "₹20,000/month",
      type: "Industry Internship",
      requiredSkills: ["Java", "SQL", "REST APIs", "Spring Boot", "Git"],
    },
    {
      id: "int-2",
      role: "Backend Developer Intern",
      company: "Razorpay",
      location: "Bangalore, India",
      duration: "3 Months",
      stipend: "₹40,000/month",
      type: "Summer Internship",
      requiredSkills: ["Python", "Django", "REST APIs", "SQL", "Redis"],
    },
  ],
  "Web Developer": [
    {
      id: "int-1",
      role: "Frontend Intern",
      company: "Swiggy",
      location: "Bangalore, India",
      duration: "3 Months",
      stipend: "₹25,000/month",
      type: "Summer Internship",
      requiredSkills: ["React", "JavaScript", "CSS", "HTML", "REST APIs"],
    },
    {
      id: "int-2",
      role: "Full Stack Intern",
      company: "Zoho",
      location: "Chennai, India",
      duration: "6 Months",
      stipend: "₹20,000/month",
      type: "Industry Internship",
      requiredSkills: ["React", "Node.js", "SQL", "JavaScript", "Git"],
    },
  ],
};

/* ── Skill match helper ──────────────────────────────────────── */
function computeMatch(candidateSkills, jobSkills) {
  if (!jobSkills.length) return 0;
  const cLower = candidateSkills.map((s) => s.toLowerCase());
  const matched = jobSkills.filter((s) => cLower.includes(s.toLowerCase())).length;
  return Math.round((matched / jobSkills.length) * 100);
}

function getBestInternshipSet(career) {
  const keys = Object.keys(SAMPLE_INTERNSHIPS);
  const exact = keys.find((k) => k.toLowerCase() === career?.toLowerCase());
  if (exact) return SAMPLE_INTERNSHIPS[exact];
  const fuzzy = keys.find(
    (k) =>
      career?.toLowerCase().includes(k.toLowerCase().split(" ")[0]) ||
      k.toLowerCase().includes(career?.toLowerCase().split(" ")[0])
  );
  return SAMPLE_INTERNSHIPS[fuzzy || "AI ML Engineer"];
}

/* ── Save application to localStorage ───────────────────────── */
function saveApplication(internship, matchPct) {
  const raw = localStorage.getItem("careerLensApplications");
  const apps = raw ? JSON.parse(raw) : [];

  const alreadySaved = apps.some((a) => a.id === internship.id && a.type === "Internship");
  if (alreadySaved) return false;

  apps.push({
    id: internship.id,
    type: "Internship",
    role: internship.role,
    company: internship.company,
    location: internship.location,
    matchPercentage: matchPct,
    status: "Saved",
    appliedAt: new Date().toISOString(),
  });

  localStorage.setItem("careerLensApplications", JSON.stringify(apps));
  return true;
}

/* ── Component ──────────────────────────────────────────────── */
function Internships() {
  const [analysis, setAnalysis] = useState(null);
  const [internships, setInternships] = useState([]);
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

      const base = getBestInternshipSet(detectedCareer);
      const scored = base.map((item) => ({
        ...item,
        matchPct: computeMatch(skills, item.requiredSkills),
        matchedSkills: item.requiredSkills.filter((s) =>
          skills.map((c) => c.toLowerCase()).includes(s.toLowerCase())
        ),
      }));
      scored.sort((a, b) => b.matchPct - a.matchPct);
      setInternships(scored);
    } catch (e) {
      console.error("Failed to load analysis:", e);
    }
  }, []);

  function handleApply(internship) {
    const saved = saveApplication(internship, internship.matchPct);
    setApplied((prev) => ({
      ...prev,
      [internship.id]: saved ? "saved" : "duplicate",
    }));
  }

  /* ── No resume ─────────────────────────────────────────────── */
  if (!analysis) {
    return (
      <div className="page">
        <div className="pageHero">
          <p className="eyebrow">STUDENT OPPORTUNITIES</p>
          <h1>Discover <span>Internships.</span></h1>
          <p>Find internships that match your skills and career direction.</p>
        </div>
        <div className="emptyState" style={{ flexDirection: "column", gap: "18px" }}>
          <p style={{ margin: 0 }}>Analyze your resume first to discover matching internships.</p>
          <Link
            to="/resume-analyzer"
            className="analyzeButton"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            Go to Resume Analyzer
          </Link>
        </div>
      </div>
    );
  }

  /* ── Internships view ──────────────────────────────────────── */
  return (
    <div className="page">
      <div className="pageHero">
        <p className="eyebrow">STUDENT OPPORTUNITIES</p>
        <h1>Internships Matched <span>For You.</span></h1>
        <p>
          Internship opportunities matched to your career goal, skills, and resume.
          <br />
          Target Career:{" "}
          <strong style={{ color: "#a598ff" }}>{career}</strong>
        </p>
      </div>

      <p style={{ fontSize: "12px", color: "#4a5568", marginBottom: "24px" }}>
        ⚠️ Demo Opportunities — not real live listings.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {internships.map((item) => (
          <div key={item.id} className="resultCard" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "17px" }}>{item.role}</h3>
                <p style={{ margin: 0, color: "#8491a6", fontSize: "14px" }}>{item.company}</p>
              </div>

              {/* Match badge */}
              <div style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 700,
                background: item.matchPct >= 60 ? "rgba(52,211,153,0.1)" : item.matchPct >= 30 ? "rgba(251,191,36,0.1)" : "rgba(109,93,252,0.1)",
                color: item.matchPct >= 60 ? "#6ee7b7" : item.matchPct >= 30 ? "#fbbf24" : "#a598ff",
                border: `1px solid ${item.matchPct >= 60 ? "rgba(52,211,153,0.25)" : item.matchPct >= 30 ? "rgba(251,191,36,0.25)" : "rgba(109,93,252,0.25)"}`,
              }}>
                {item.matchPct}% Resume Match
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                <MapPin size={13} /> {item.location}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                <Clock size={13} /> {item.duration}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                <IndianRupee size={13} /> {item.stipend}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8491a6", fontSize: "13px" }}>
                <BookOpen size={13} /> {item.type}
              </span>
            </div>

            {/* Match bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Skill Match</span>
                <span style={{ fontSize: "12px", color: "#8491a6" }}>
                  {item.matchedSkills.length} / {item.requiredSkills.length} skills
                </span>
              </div>
              <div className="progress">
                <div style={{ width: `${item.matchPct}%` }} />
              </div>
            </div>

            {/* Skills */}
            <div className="skills">
              {item.requiredSkills.map((skill) => {
                const matched = item.matchedSkills.map((s) => s.toLowerCase()).includes(skill.toLowerCase());
                return (
                  <span key={skill} style={matched ? {
                    color: "#6ee7b7",
                    background: "rgba(52,211,153,0.07)",
                    borderColor: "rgba(52,211,153,0.25)",
                    display: "flex", alignItems: "center", gap: "4px",
                  } : {}}>
                    {matched && <CheckCircle size={11} />}
                    {skill}
                  </span>
                );
              })}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
              <button
                className="navLink active"
                style={{ padding: "10px 18px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "7px", fontSize: "14px", cursor: "pointer" }}
                onClick={() => alert(`Viewing ${item.role} at ${item.company} — Demo only`)}
              >
                <GraduationCap size={15} /> View Details
              </button>

              <button
                className="navLink"
                disabled={applied[item.id] === "saved" || applied[item.id] === "duplicate"}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "14px",
                  cursor: applied[item.id] ? "default" : "pointer",
                  border: "1px solid #2a3547",
                  opacity: applied[item.id] ? 0.7 : 1,
                }}
                onClick={() => handleApply(item)}
              >
                {applied[item.id] === "saved"
                  ? "✅ Saved to Applications"
                  : applied[item.id] === "duplicate"
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

export default Internships;