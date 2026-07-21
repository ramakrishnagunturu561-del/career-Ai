import { useEffect, useState } from "react";

function CareerRoadmap() {

  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {

    const savedAnalysis =
      localStorage.getItem("careerLensAnalysis");

    if (savedAnalysis) {

      try {

        const parsed =
          JSON.parse(savedAnalysis);

        console.log(
          "Roadmap Analysis:",
          parsed
        );

        setAnalysis(parsed);

      } catch (error) {

        console.error(
          "Failed to load analysis:",
          error
        );

      }

    }

  }, []);

  if (!analysis) {

    return (
      <div className="page">

        <div className="pageHero">

          <p className="eyebrow">
            PERSONALIZED LEARNING
          </p>

          <h1>
            Your Career{" "}
            <span>Roadmap.</span>
          </h1>

          <p>
            Build the skills required to
            reach your target career.
          </p>

        </div>

        <div className="emptyState">

          Analyze your resume first to
          generate your personalized roadmap.

        </div>

      </div>
    );
  }

  /*
    Support both possible API structures:
    nested and direct.
  */

  const career =
    analysis.best_career?.role ||
    analysis.career_prediction?.best_career?.role ||
    analysis.career_prediction?.best_career ||
    "Recommended Career";

  const confidence =
    analysis.best_career?.confidence ??
    analysis.career_prediction?.best_career?.confidence ??
    analysis.career_prediction?.confidence ??
    0;

  const missingSkills =
    analysis.skill_gap?.missing_skills ||
    analysis.skill_gap?.missing ||
    analysis.missing_skills ||
    [];

  const matchedSkills =
    analysis.skill_gap?.matched_skills ||
    analysis.skill_gap?.matched ||
    analysis.matched_skills ||
    [];

  const coverage =
    analysis.skill_gap?.coverage ??
    analysis.skill_coverage ??
    analysis.coverage ??
    0;

  return (

    <div className="page">

      <div className="pageHero">

        <p className="eyebrow">
          PERSONALIZED LEARNING
        </p>

        <h1>
          Your Career{" "}
          <span>Roadmap.</span>
        </h1>

        <p>
          Personalized roadmap generated
          from your resume analysis.
        </p>

      </div>


      {/* TARGET CAREER */}

      <div className="resultCard">

        <p className="eyebrow">
          YOUR TARGET CAREER
        </p>

        <h2>
          {career}
        </h2>

        <p>
          AI Match Confidence:{" "}
          <strong>
            {Number(confidence).toFixed(1)}%
          </strong>
        </p>

        <p>
          Current skill coverage:{" "}
          <strong>
            {Number(coverage).toFixed(1)}%
          </strong>
        </p>

      </div>


      {/* CURRENT SKILLS */}

      <div className="resultCard">

        <h3>
          Your Current Skills
        </h3>

        <div className="skills matched">

          {matchedSkills.length > 0 ? (

            matchedSkills.map(
              (skill, index) => (

                <span key={index}>
                  ✓ {skill}
                </span>

              )
            )

          ) : (

            <p>
              No matched skills detected.
            </p>

          )}

        </div>

      </div>


      {/* LEARNING ROADMAP */}

      <div className="resultCard">

        <p className="eyebrow">
          PERSONALIZED ROADMAP
        </p>

        <h2>
          Skills You Need to Learn
        </h2>

        {missingSkills.length > 0 ? (

          missingSkills.map(
            (skill, index) => (

              <div
                className="setupItem"
                key={index}
              >

                <strong>
                  Step {index + 1}
                </strong>

                <span>
                  Learn {skill}
                </span>

              </div>

            )
          )

        ) : (

          <p>
            Great! No major skill gaps
            were detected for this career.
          </p>

        )}

      </div>

    </div>
  );
}

export default CareerRoadmap;