import React, { useCallback, useEffect, useState } from "react";
import "./exchange.css";
import { exchangeApi, getCurrentUser, setCurrentUser } from "./exchangeApi";
import SkillExchange from "./SkillExchange";
import MatchingRecommendations from "./MatchingRecommendations";
import ExchangeRequests from "./ExchangeRequests";
import MyExchanges from "./MyExchanges";
import OfferSkill from "./OfferSkill";
import RequestSkill from "./RequestSkill";

const ROUTES = [
  { path: "", label: "Skill Exchange", Component: SkillExchange },
  { path: "matching", label: "Matching", Component: MatchingRecommendations },
  { path: "requests", label: "Requests", Component: ExchangeRequests },
  { path: "my-exchanges", label: "My Exchanges", Component: MyExchanges },
  { path: "offer", label: "Offer a Skill", Component: OfferSkill },
  { path: "request", label: "Request a Skill", Component: RequestSkill },
];

function readPath() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return ROUTES.some((r) => r.path === hash) ? hash : "";
}

/**
 * Drop-in shell for the Skill Exchange module. The repository has no router,
 * so this uses a tiny hash router; each page is also exported on its own and
 * can be mounted by the host application's own router.
 */
export default function ExchangeApp() {
  const [path, setPath] = useState(readPath());
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(getCurrentUser());
  const [pending, setPending] = useState(0);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState("");

  const navigate = useCallback((next) => {
    window.location.hash = `/${next}`;
    setPath(next);
  }, []);

  useEffect(() => {
    const onHashChange = () => setPath(readPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    exchangeApi
      .getUsers()
      .then((data) => {
        setUsers(data.users);
        setUser((current) => {
          if (current && data.users.some((u) => u.userId === current.userId)) return current;
          const fallback = data.users[0] || null;
          setCurrentUser(fallback);
          return fallback;
        });
      })
      .catch((err) => setBootError(err.message))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    exchangeApi
      .getRequestSummary()
      .then((data) => setPending(data.counts.pending))
      .catch(() => setPending(0));
    return undefined;
  }, [user, path]);

  const active = ROUTES.find((r) => r.path === path) || ROUTES[0];

  if (!ready) {
    return (
      <div className="ex-page">
        <div className="ex-loading">Loading Skill Exchange…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ex-page">
        <div className="ex-panel" style={{ textAlign: "center" }}>
          <h1>No student account</h1>
          <p>
            The exchange service did not return any users. Start the backend and
            make sure the <code>users</code> table is populated.
          </p>
          {bootError && <div className="ex-alert ex-alert-error">{bootError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="ex-page">
      <div className="ex-header">
        <div>
          <h1>Skill Exchange</h1>
          <p>Trade skills with other students — no money changes hands.</p>
        </div>

        <div className="ex-user-bar">
          <label htmlFor="ex-user">Acting as</label>
          <select
            id="ex-user"
            value={user ? user.userId : ""}
            onChange={(e) => {
              const next = users.find((u) => u.userId === Number(e.target.value));
              if (next) {
                setUser(next);
                setCurrentUser(next);
              }
            }}
          >
            {users.length === 0 && <option value="">No users</option>}
            {users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.userName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ex-nav">
        {ROUTES.map(({ path: routePath, label }) => (
          <button
            key={routePath}
            type="button"
            className={`ex-nav-link ${routePath === active.path ? "active" : ""}`}
            onClick={() => navigate(routePath)}
          >
            {label}
            {routePath === "requests" && pending > 0 && (
              <span className="ex-badge-count">{pending}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ height: 20 }} />

      <active.Component user={user} navigate={navigate} />
    </div>
  );
}
