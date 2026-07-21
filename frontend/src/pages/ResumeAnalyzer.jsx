import { useState } from "react";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyzeResume = async () => {
    if (!file) {
      setError("Please select your resume PDF.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze-resume",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Resume analysis failed."
        );
      }

      console.log("Resume Analysis:", data);
      localStorage.setItem(
        "careerLensAnalysis",
        JSON.stringify(data)
      );
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header>
        <div>
          <p className="eyebrow">
            AI-POWERED CAREER INTELLIGENCE
          </p>

          <h1>
            Discover where your
            <span> skills can take you.</span>
          </h1>

          <p className="subtitle">
            Upload your resume and let CareerLens AI
            identify your skills, career matches and
            skill gaps.
          </p>
        </div>

        <div className="status">
          <span></span>
          AI Engine Online
        </div>
      </header>

      <section className="uploadCard">
        <div className="uploadIcon">
          <UploadCloud size={34} />
        </div>

        <h2>Analyze your resume</h2>

        <p>
          Upload your PDF resume to generate your
          personalized career intelligence report.
        </p>

        <label className="dropZone">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFile(e.target.files[0])
            }
          />

          <UploadCloud size={30} />

          {file ? (
            <>
              <strong>{file.name}</strong>
              <span>Ready for AI analysis</span>
            </>
          ) : (
            <>
              <strong>
                Drop your resume here
              </strong>
              <span>
                or click to browse • PDF only
              </span>
            </>
          )}
        </label>

        <button
          className="analyzeButton"
          onClick={analyzeResume}
          disabled={loading}
        >
          <Sparkles size={18} />

          {loading
            ? "Analyzing your career..."
            : "Analyze with CareerLens AI"}
        </button>

        {error && (
          <div className="error">
            {error}
          </div>
        )}
      </section>

      {loading && (
        <section className="loadingCard">
          <div className="loader"></div>

          <div>
            <h3>CareerLens AI is thinking...</h3>
            <p>
              Extracting skills, generating embeddings
              and predicting your best career paths.
            </p>
          </div>
        </section>
      )}

      {result && (
        <section className="results">
          <div className="sectionTitle">
            <p>YOUR CAREER INTELLIGENCE</p>
            <h2>Resume Analysis Report</h2>
          </div>

          <div className="metrics">
            <div className="metricCard highlight">
              <span>BEST CAREER MATCH</span>

              <h2>
                {result.best_career.role}
              </h2>

              <strong>
                {result.best_career.confidence.toFixed(1)}%
                AI confidence
              </strong>
            </div>

            <div className="metricCard">
              <span>SKILLS DETECTED</span>

              <h2>{result.total_skills}</h2>

              <strong>
                Skills found in your resume
              </strong>
            </div>

            <div className="metricCard">
              <span>SKILL COVERAGE</span>

              <h2>
                {result.skill_gap.coverage.toFixed(1)}%
              </h2>

              <strong>
                For {result.best_career.role}
              </strong>
            </div>
          </div>

          <div className="resultGrid">
            <div className="resultCard">
              <h3>Top Career Matches</h3>

              {result.top_careers.map(
                (career, index) => (
                  <div
                    className="careerRow"
                    key={career.career}
                  >
                    <div className="rank">
                      {index + 1}
                    </div>

                    <div className="careerInfo">
                      <div>
                        <strong>
                          {career.career}
                        </strong>

                        <span>
                          {career.confidence.toFixed(1)}%
                        </span>
                      </div>

                      <div className="progress">
                        <div
                          style={{
                            width: `${career.confidence}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="resultCard">
              <h3>Skills Detected</h3>

              <div className="skills">
                {result.skills_detected.map(
                  (skill) => (
                    <span key={skill}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="resultGrid">
            <div className="resultCard">
              <h3>
                <CheckCircle2 size={19} />
                Matched Skills
              </h3>

              <div className="skills matched">
                {result.skill_gap.matched_skills.map(
                  (skill) => (
                    <span key={skill}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="resultCard">
              <h3>Skills to Learn Next</h3>

              <div className="skills missing">
                {result.skill_gap.missing_skills.map(
                  (skill) => (
                    <span key={skill}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ResumeAnalyzer;
