import React, { useCallback, useEffect, useState } from "react";
import { exchangeApi } from "./exchangeApi";

/**
 * My Exchanges page — lifecycle management of confirmed swaps plus a compact
 * manager for the student's own listings.
 */
export default function MyExchanges({ user, navigate }) {
  const [exchanges, setExchanges] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [exchangeData, listingData] = await Promise.all([
        exchangeApi.getExchanges(),
        exchangeApi.getMyListings(),
      ]);
      setExchanges(exchangeData.exchanges);
      setListings(listingData.listings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user && user.userId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action, message) => {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const live = exchanges.filter(
    (e) => e.status === "ACTIVE" || e.status === "IN_PROGRESS"
  ).length;
  const completed = exchanges.filter((e) => e.status === "COMPLETED").length;
  const cancelled = exchanges.filter((e) => e.status === "CANCELLED").length;

  const counterpart = (exchange) =>
    user && exchange.initiatorId === user.userId
      ? exchange.partnerName
      : exchange.initiatorName;

  return (
    <section>
      <div className="ex-stats">
        <div className="ex-stat">
          <strong>{live}</strong>
          <span>Live exchanges</span>
        </div>
        <div className="ex-stat">
          <strong>{completed}</strong>
          <span>Completed</span>
        </div>
        <div className="ex-stat">
          <strong>{cancelled}</strong>
          <span>Cancelled</span>
        </div>
      </div>

      {error && <div className="ex-alert ex-alert-error">{error}</div>}
      {notice && <div className="ex-alert ex-alert-success">{notice}</div>}

      {loading ? (
        <div className="ex-loading">Loading your exchanges…</div>
      ) : exchanges.length === 0 ? (
        <div className="ex-empty">
          <h2>No exchanges yet</h2>
          <p>Accept a request and your swap will show up here.</p>
        </div>
      ) : (
        <div className="ex-grid" style={{ marginBottom: 40 }}>
          {exchanges.map((exchange) => (
            <article className="ex-card" key={exchange.exchangeId}>
              <div className="ex-card-meta">
                <span className={`ex-status ${exchange.status}`}>{exchange.status}</span>
                <span className="ex-chip neutral">
                  {exchange.myRole === "INITIATOR" ? "You initiated" : "You joined"}
                </span>
              </div>

              <h3>
                {exchange.offeredSkillName} ⇄ {exchange.requestedSkillName}
              </h3>

              <p>
                With <strong>{counterpart(exchange)}</strong>
              </p>
              <p className="ex-hint">Started {new Date(exchange.initiatedAt).toLocaleDateString()}</p>

              <div className="ex-card-actions">
                {exchange.status === "ACTIVE" && (
                  <>
                    <button
                      type="button"
                      className="ex-btn ex-btn-primary"
                      onClick={() =>
                        act(
                          () => exchangeApi.updateExchangeStatus(exchange.exchangeId, "IN_PROGRESS"),
                          "Exchange started."
                        )
                      }
                    >
                      Start Session
                    </button>
                    <button
                      type="button"
                      className="ex-btn ex-btn-ghost"
                      onClick={() =>
                        act(
                          () => exchangeApi.updateExchangeStatus(exchange.exchangeId, "CANCELLED"),
                          "Exchange cancelled."
                        )
                      }
                    >
                      Cancel
                    </button>
                  </>
                )}

                {exchange.status === "IN_PROGRESS" && (
                  <>
                    <button
                      type="button"
                      className="ex-btn ex-btn-success"
                      onClick={() =>
                        act(
                          () => exchangeApi.updateExchangeStatus(exchange.exchangeId, "COMPLETED"),
                          "Exchange completed — nice work."
                        )
                      }
                    >
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      className="ex-btn ex-btn-ghost"
                      onClick={() =>
                        act(
                          () => exchangeApi.updateExchangeStatus(exchange.exchangeId, "CANCELLED"),
                          "Exchange cancelled."
                        )
                      }
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 20, marginBottom: 14 }}>My listings</h2>

      {listings.length === 0 ? (
        <div className="ex-empty">
          <h2>No listings</h2>
          <p>
            Post what you can teach or what you want to learn.{" "}
            <button
              type="button"
              className="ex-btn ex-btn-primary"
              style={{ flex: "none", marginTop: 14 }}
              onClick={() => navigate("offer")}
            >
              + Offer a Skill
            </button>
          </p>
        </div>
      ) : (
        <div className="ex-grid">
          {listings.map((listing) => (
            <article className="ex-card" key={listing.listingId}>
              <div className="ex-card-meta">
                <span className={`ex-chip type-${listing.listingType}`}>
                  {listing.listingType}
                </span>
                <span className={`ex-status ${listing.status}`}>{listing.status}</span>
                <span className="ex-chip neutral">
                  {listing.pendingRequests} pending
                </span>
              </div>

              <h3>{listing.title}</h3>
              <p>
                {listing.offerSkillName || "—"} ⇄ {listing.wantSkillName || "open"}
              </p>

              <div className="ex-card-actions">
                {listing.status === "ACTIVE" && (
                  <button
                    type="button"
                    className="ex-btn ex-btn-ghost"
                    onClick={() =>
                      act(
                        () => exchangeApi.updateListing(listing.listingId, { status: "PAUSED" }),
                        "Listing paused."
                      )
                    }
                  >
                    Pause
                  </button>
                )}
                {listing.status === "PAUSED" && (
                  <button
                    type="button"
                    className="ex-btn ex-btn-primary"
                    onClick={() =>
                      act(
                        () => exchangeApi.updateListing(listing.listingId, { status: "ACTIVE" }),
                        "Listing reactivated."
                      )
                    }
                  >
                    Reactivate
                  </button>
                )}
                {listing.status !== "CLOSED" && (
                  <button
                    type="button"
                    className="ex-btn ex-btn-danger"
                    onClick={() =>
                      act(
                        () => exchangeApi.closeListing(listing.listingId),
                        "Listing closed."
                      )
                    }
                  >
                    Close
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
