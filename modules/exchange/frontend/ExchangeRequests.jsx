import React, { useCallback, useEffect, useState } from "react";
import { exchangeApi } from "./exchangeApi";

const BOXES = [
  ["INBOX", "Inbox"],
  ["OUTBOX", "Sent"],
  ["ALL", "All"],
];

/**
 * Exchange Requests page — inbox/outbox with the accept / reject / withdraw UI.
 * Accepting a request is what creates the exchange.
 */
export default function ExchangeRequests({ user, navigate }) {
  const [box, setBox] = useState("INBOX");
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [requestData, summary] = await Promise.all([
        exchangeApi.getRequests(box),
        exchangeApi.getRequestSummary(),
      ]);
      setRequests(requestData.requests);
      setCounts(summary.counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [box, user && user.userId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action, id, message) => {
    setError("");
    setNotice("");
    try {
      await action(id);
      setNotice(message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="ex-stats">
        <div className="ex-stat">
          <strong>{counts.pending}</strong>
          <span>Awaiting your reply</span>
        </div>
        <div className="ex-stat">
          <strong>{counts.accepted}</strong>
          <span>Accepted</span>
        </div>
        <div className="ex-stat">
          <strong>{counts.rejected}</strong>
          <span>Declined</span>
        </div>
      </div>

      <div className="ex-toolbar">
        <div className="ex-tabs">
          {BOXES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`ex-tab ${box === value ? "active" : ""}`}
              onClick={() => setBox(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="ex-alert ex-alert-error">{error}</div>}
      {notice && <div className="ex-alert ex-alert-success">{notice}</div>}

      {loading ? (
        <div className="ex-loading">Loading requests…</div>
      ) : requests.length === 0 ? (
        <div className="ex-empty">
          <h2>No requests here</h2>
          <p>
            Browse the <strong>Skill Exchange</strong> tab and propose a swap, or
            check the matcher for partners.
          </p>
        </div>
      ) : (
        <div className="ex-grid">
          {requests.map((request) => {
            const outgoing = user && request.senderId === user.userId;
            return (
              <article className="ex-card" key={request.requestId}>
                <div className="ex-card-meta">
                  <span className={`ex-status ${request.status}`}>{request.status}</span>
                  <span className="ex-chip neutral">
                    {outgoing ? "You sent" : "Sent to you"}
                  </span>
                </div>

                <h3>
                  {request.offeredSkillName} ⇄ {request.requestedSkillName}
                </h3>

                <p>
                  {outgoing ? (
                    <>
                      To <strong>{request.recipientName}</strong>
                    </>
                  ) : (
                    <>
                      From <strong>{request.senderName}</strong>
                    </>
                  )}
                  {request.listingTitle ? ` · re: ${request.listingTitle}` : ""}
                </p>

                {request.message && <p className="ex-hint">“{request.message}”</p>}

                <div className="ex-card-actions">
                  {request.status === "PENDING" && !outgoing && (
                    <>
                      <button
                        type="button"
                        className="ex-btn ex-btn-success"
                        onClick={() =>
                          act(
                            (id) => exchangeApi.acceptRequest(id),
                            request.requestId,
                            "Request accepted — the exchange is now live."
                          )
                        }
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="ex-btn ex-btn-danger"
                        onClick={() =>
                          act(
                            (id) => exchangeApi.rejectRequest(id),
                            request.requestId,
                            "Request declined."
                          )
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {request.status === "PENDING" && outgoing && (
                    <button
                      type="button"
                      className="ex-btn ex-btn-ghost"
                      onClick={() =>
                        act(
                          (id) => exchangeApi.cancelRequest(id),
                          request.requestId,
                          "Request withdrawn."
                        )
                      }
                    >
                      Withdraw
                    </button>
                  )}

                  {request.status === "ACCEPTED" && (
                    <button
                      type="button"
                      className="ex-btn ex-btn-primary"
                      onClick={() => navigate("my-exchanges")}
                    >
                      View Exchange
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
