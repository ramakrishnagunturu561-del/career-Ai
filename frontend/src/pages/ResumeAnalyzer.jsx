import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Map,
  Briefcase,
  GraduationCap,
  Video,
  AlertCircle
} from "lucide-react";

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    try {
      const raw = localStorage.getItem("careerLensAnalysis");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const analyzeResume = async () => {
    if (!file) {
      setError("Please select your PDF resume.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/analyze-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume analysis failed.");
      }

      console.log("Resume Analysis Result:", data);
      localStorage.setItem("careerLensAnalysis", JSON.stringify(data));
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const bestCareer = result?.best_career?.role || "Software Professional";
  const confidence = result?.best_career?.confidence ?? 0;
  const coverage = result?.skill_gap?.coverage ?? 0;
  const totalSkills = result?.total_skills ?? 0;
  const skillsDetected = result?.skills_detected || [];
  const topCareers = result?.top_careers || [];
  const matchedSkills = result?.skill_gap?.matched_skills || [];
  const missingSkills = result?.skill_gap?.missing_skills || [];

  return (
    <div className="page">
      <header>
        <div>
          <p className="eyebrow">AI-POWERED CAREER INTELLIGENCE</p>
          <h1>Discover where your <span>skills can take you.</span></h1>
          <p className="subtitle">
            Upload your resume and let CareerLens AI identify your skills, career matches, and skill gaps.
          </p>
        </div>

        <div className="status">
          <span></span> AI Engine Online
        </div>
      </header>

      {/* Upload Card */}
      <section className="uploadCard">
        <div className="uploadIcon">
          <UploadCloud size={34} />
        </div>

        <h2>Analyze your resume</h2>
        <p>Upload your PDF resume to generate your personalized career intelligence report.</p>

        <label className="dropZone">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <UploadCloud size={30} />

          {file ? (
            <>
              <strong>{file.name}</strong>
              <span>Ready for AI analysis</span>
            </>
          ) : (
            <>
              <strong>Drop your resume here</strong>
              <span>or click to browse • PDF only</span>
            </>
          )}
        </label>

        <button
          className="analyzeButton"
          onClick={analyzeResume}
          disabled={loading}
        >
          <Sparkles size={18} />
          {loading ? "Analyzing your career..." : "Analyze with CareerLens AI"}
        </button>

        {error && (
          <div className="error" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </section>

      {loading && (
        <section className="loadingCard">
          <div className="loader"></div>
          <div>
            <h3>CareerLens AI is thinking...</h3>
            <p>Extracting skills, generating embeddings, and predicting your best career paths.</p>
          </div>
        </section>
      )}

      {/* Analysis Results */}
      {result && (
        <section className="results">
          <div className="sectionTitle">
            <p>YOUR CAREER INTELLIGENCE</p>
            <h2>Resume Analysis Report</h2>
          </div>

          <div className="metrics">
            <div className="metricCard highlight">
              <span>BEST CAREER MATCH</span>
              <h2>{bestCareer}</h2>
              <strong>{Number(confidence).toFixed(1)}% AI confidence</strong>
            </div>

            <div className="metricCard">
              <span>SKILLS DETECTED</span>
              <h2>{totalSkills}</h2>
              <strong>Skills found in your resume</strong>
            </div>

            <div className="metricCard">
              <span>SKILL COVERAGE</span>
              <h2>{Number(coverage).toFixed(1)}%</h2>
              <strong>For {bestCareer}</strong>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="resultCard" style={{ marginBottom: "28px", background: "rgba(109,93,252,0.06)", borderColor: "rgba(109,93,252,0.2)" }}>
            <h3 style={{ color: "#a598ff", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} /> Take Action on Your Result
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                className="analyzeButton"
                style={{ padding: "10px 18px", fontSize: "14px" }}
                onClick={() => navigate("/roadmap")}
              >
                <Map size={16} /> View Career Roadmap
              </button>

              <button
                className="navLink active"
                style={{ padding: "10px 18px", fontSize: "14px", cursor: "pointer" }}
                onClick={() => navigate("/jobs")}
              >
                <Briefcase size={16} /> Find Matched Jobs
              </button>

              <button
                className="navLink"
                style={{ padding: "10px 18px", fontSize: "14px", cursor: "pointer", border: "1px solid #2a3547" }}
                onClick={() => navigate("/internships")}
              >
                <GraduationCap size={16} /> Find Internships
              </button>

              <button
                className="navLink"
                style={{ padding: "10px 18px", fontSize: "14px", cursor: "pointer", border: "1px solid #2a3547" }}
                onClick={() => navigate("/ai-interview")}
              >
                <Video size={16} /> Start AI Interview
              </button>
            </div>
          </div>

          <div className="resultGrid">
            <div className="resultCard">
              <h3>Top Career Matches</h3>
              {topCareers.map((career, index) => (
                <div className="careerRow" key={career.career}>
                  <div className="rank">{index + 1}</div>
                  <div className="careerInfo">
                    <div>
                      <strong>{career.career}</strong>
                      <span>{Number(career.confidence).toFixed(1)}%</span>
                    </div>
                    <div className="progress">
                      <div style={{ width: `${career.confidence}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="resultCard">
              <h3>Skills Detected ({skillsDetected.length})</h3>
              <div className="skills">
                {skillsDetected.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="resultGrid">
            <div className="resultCard">
              <h3>
                <CheckCircle2 size={19} /> Matched Skills ({matchedSkills.length})
              </h3>
              <div className="skills matched">
                {matchedSkills.map((skill) => (
                  <span key={skill}>✓ {skill}</span>
                ))}
              </div>
            </div>

            <div className="resultCard">
              <h3>Skills to Learn Next ({missingSkills.length})</h3>
              <div className="skills missing">
                {missingSkills.map((skill) => (
                  <span key={skill}>△ {skill}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ResumeAnalyzer;
