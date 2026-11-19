import React, { useCallback, useEffect, useState } from "react";
import { exchangeApi } from "./exchangeApi";
import RequestComposer from "./RequestComposer";

/**
 * Matching Recommendations page — calls GET /api/exchanges/matching and renders
 * the ranked shortlist with the score breakdown and human-readable reasons.
 */
export default function MatchingRecommendations({ user, navigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [composerListing, setComposerListing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await exchangeApi.getMatching({
        limit: 20,
        minScore: minScore || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [minScore, user && user.userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className="ex-toolbar">
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Recommended for you</h2>
          <p className="ex-hint" style={{ margin: 0 }}>
            Ranked by complementary skills, teaching strength, availability and
            trust. Scores are out of 100.
          </p>
        </div>

        <select
          className="ex-select"
          style={{ marginLeft: "auto" }}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
        >
          <option value={0}>Any score</option>
          <option value={50}>50+</option>
          <option value={70}>70+</option>
          <option value={85}>85+</option>
        </select>
      </div>

      {error && <div className="ex-alert ex-alert-error">{error}</div>}

      {loading ? (
        <div className="ex-loading">Finding compatible partners…</div>
      ) : !data || data.matches.length === 0 ? (
        <div className="ex-empty">
          <h2>No matches yet</h2>
          <p>
            Post a skill you can teach or one you want to learn — the matcher reads
            your listings to find two-way swaps.
          </p>
          <button
            type="button"
            className="ex-btn ex-btn-primary"
            style={{ marginTop: 16, flex: "none" }}
            onClick={() => navigate("offer")}
          >
            + Offer a Skill
          </button>
        </div>
      ) : (
        <div className="ex-grid">
          {data.matches.map((match) => (
            <article className="ex-card" key={match.listingId}>
              <div className="ex-card-meta">
                <span className={`ex-chip type-${match.listingType}`}>
                  {match.listingType === "OFFER" ? "Offering" : "Seeking"}
                </span>
                {match.offerSkillName && (
                  <span className="ex-chip">Teaches: {match.offerSkillName}</span>
                )}
                {match.wantSkillName && (
                  <span className="ex-chip neutral">Wants: {match.wantSkillName}</span>
                )}
              </div>

              <h3>{match.title}</h3>
              <p>{match.userName}</p>

              <div className="ex-score">
                <strong>{match.score}</strong>
                <span>/ 100 match</span>
              </div>

              <ul className="ex-reasons">
                {match.reasons.slice(0, 4).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <details>
                <summary className="ex-hint" style={{ cursor: "pointer" }}>
                  Score breakdown
                </summary>
                <div className="ex-breakdown">
                  {Object.entries(match.breakdown).map(([key, value]) => (
                    <div key={key}>
                      <b>{value}</b>
                      {key}
                    </div>
                  ))}
                </div>
              </details>

              <div className="ex-card-actions">
                <button
                  type="button"
                  className="ex-btn ex-btn-primary"
                  onClick={() => setComposerListing(match)}
                >
                  Propose Swap
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {composerListing && (
        <RequestComposer
          listing={composerListing}
          onClose={() => setComposerListing(null)}
          onSent={() => {
            setComposerListing(null);
            load();
          }}
        />
      )}
    </section>
  );
}
