import React, { useEffect, useState } from "react";
import { exchangeApi } from "./exchangeApi";

/**
 * Modal used by the Skill Exchange and Matching pages to propose a swap for a
 * specific listing. Defaults are derived from the listing:
 *   - what you give  = the skill the listing asks for
 *   - what you get  = the skill the listing offers
 */
export default function RequestComposer({ listing, onClose, onSent }) {
  const [skills, setSkills] = useState([]);
  const [teachable, setTeachable] = useState([]);
  const [offeredSkillId, setOfferedSkillId] = useState(listing.wantSkillId || "");
  const [requestedSkillId, setRequestedSkillId] = useState(listing.offerSkillId || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([exchangeApi.getSkills(), exchangeApi.getProfile()])
      .then(([skillData, profileData]) => {
        setSkills(skillData.skills);
        setTeachable(profileData.teachableSkills || []);
      })
      .catch(() => setSkills([]));
  }, []);

  const offerOptions = teachable.length > 0 ? teachable : skills;

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!offeredSkillId || !requestedSkillId) {
      setError("Pick both skills — what you teach and what you want to learn.");
      return;
    }
    if (Number(offeredSkillId) === Number(requestedSkillId)) {
      setError("The two skills must be different.");
      return;
    }

    setSaving(true);
    try {
      const data = await exchangeApi.sendRequest({
        listingId: listing.listingId,
        recipientId: listing.userId,
        offeredSkillId: Number(offeredSkillId),
        requestedSkillId: Number(requestedSkillId),
        message: message.trim() || undefined,
      });
      onSent(data.request);
    } catch (err) {
      setError(err.message || "Could not send the request.");
    } finally {
      setSaving(false);
    }
  };

  const nameOf = (id) => {
    const skill = skills.find((s) => s.skillId === Number(id));
    return skill ? skill.skillName : "—";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 16, 40, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <form
        className="ex-panel"
        style={{ maxWidth: 560, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h1 style={{ fontSize: 22 }}>Propose a swap</h1>
        <p>
          With <strong>{listing.userName}</strong> — {listing.title}
        </p>

        {error && <div className="ex-alert ex-alert-error">{error}</div>}

        <label className="ex-label" htmlFor="composer-offer">
          You teach
        </label>
        <select
          id="composer-offer"
          className="ex-select"
          value={offeredSkillId}
          onChange={(e) => setOfferedSkillId(e.target.value)}
        >
          <option value="">Select a skill…</option>
          {offerOptions.map((skill) => (
            <option key={skill.skillId} value={skill.skillId}>
              {skill.skillName}
              {skill.proficiency ? ` (${skill.proficiency})` : ""}
            </option>
          ))}
        </select>

        <label className="ex-label" htmlFor="composer-request">
          You want to learn
        </label>
        <select
          id="composer-request"
          className="ex-select"
          value={requestedSkillId}
          onChange={(e) => setRequestedSkillId(e.target.value)}
        >
          <option value="">Select a skill…</option>
          {skills.map((skill) => (
            <option key={skill.skillId} value={skill.skillId}>
              {skill.skillName}
            </option>
          ))}
        </select>

        <p className="ex-hint">
          {nameOf(offeredSkillId)} ⇄ {nameOf(requestedSkillId)}
        </p>

        <label className="ex-label" htmlFor="composer-message">
          Message (optional)
        </label>
        <textarea
          id="composer-message"
          className="ex-textarea"
          placeholder="Introduce yourself and suggest a first session…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="ex-card-actions">
          <button type="button" className="ex-btn ex-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ex-btn ex-btn-primary" disabled={saving}>
            {saving ? "Sending…" : "Send Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
