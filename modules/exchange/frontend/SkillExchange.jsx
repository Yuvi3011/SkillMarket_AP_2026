import React, { useCallback, useEffect, useState } from "react";
import { exchangeApi } from "./exchangeApi";
import RequestComposer from "./RequestComposer";

const EMPTY_FILTERS = { q: "", type: "", skillId: "" };

/**
 * Skill Exchange page — the browse/discovery view. Every active listing is a
 * card; "Propose swap" opens the request composer.
 */
export default function SkillExchange({ user, navigate }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [skills, setSkills] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerListing, setComposerListing] = useState(null);
  const [sentId, setSentId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listingData, skillData] = await Promise.all([
        exchangeApi.getListings({
          q: filters.q || undefined,
          type: filters.type || undefined,
          skillId: filters.skillId || undefined,
        }),
        exchangeApi.getSkills(),
      ]);
      setListings(listingData.listings);
      setSkills(skillData.skills);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, user && user.userId]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (event) =>
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <section>
      <div className="ex-toolbar">
        <input
          className="ex-input"
          placeholder="Search listings…"
          value={filters.q}
          onChange={set("q")}
        />

        <div className="ex-tabs">
          {[
            ["", "All"],
            ["OFFER", "Offers"],
            ["REQUEST", "Requests"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`ex-tab ${filters.type === value ? "active" : ""}`}
              onClick={() => setFilters((prev) => ({ ...prev, type: value }))}
            >
              {label}
            </button>
          ))}
        </div>

        <select className="ex-select" value={filters.skillId} onChange={set("skillId")}>
          <option value="">All skills</option>
          {skills.map((skill) => (
            <option key={skill.skillId} value={skill.skillId}>
              {skill.skillName}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="ex-btn ex-btn-primary"
          style={{ flex: "none" }}
          onClick={() => navigate("offer")}
        >
          + Offer a Skill
        </button>
        <button
          type="button"
          className="ex-btn ex-btn-ghost"
          style={{ flex: "none" }}
          onClick={() => navigate("request")}
        >
          + Request a Skill
        </button>
      </div>

      {error && <div className="ex-alert ex-alert-error">{error}</div>}
      {sentId && (
        <div className="ex-alert ex-alert-success">
          Request sent. Track it under <strong>Requests</strong>.
        </div>
      )}

      {loading ? (
        <div className="ex-loading">Loading listings…</div>
      ) : listings.length === 0 ? (
        <div className="ex-empty">
          <h2>No listings found</h2>
          <p>Try a different search, or be the first to post a skill.</p>
        </div>
      ) : (
        <div className="ex-grid">
          {listings.map((listing) => (
            <article className="ex-card" key={listing.listingId}>
              <div className="ex-card-meta">
                <span className={`ex-chip type-${listing.listingType}`}>
                  {listing.listingType === "OFFER" ? "Offering" : "Seeking"}
                </span>
                {listing.offerSkillName && (
                  <span className="ex-chip">Teaches: {listing.offerSkillName}</span>
                )}
                {listing.wantSkillName && (
                  <span className="ex-chip neutral">Wants: {listing.wantSkillName}</span>
                )}
              </div>

              <h3>{listing.title}</h3>
              <p>{listing.description}</p>

              <p className="ex-hint">
                {listing.userName}
                {listing.availability ? ` · ${listing.availability}` : ""}
                {listing.offerProficiency ? ` · ${listing.offerProficiency}` : ""}
              </p>

              <div className="ex-card-actions">
                {user && user.userId !== listing.userId ? (
                  <button
                    type="button"
                    className="ex-btn ex-btn-primary"
                    onClick={() => setComposerListing(listing)}
                  >
                    Propose Swap
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ex-btn ex-btn-ghost"
                    onClick={() => navigate("my-exchanges")}
                  >
                    This is your listing
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {composerListing && (
        <RequestComposer
          listing={composerListing}
          onClose={() => setComposerListing(null)}
          onSent={(request) => {
            setSentId(request.requestId);
            setComposerListing(null);
          }}
        />
      )}
    </section>
  );
}
