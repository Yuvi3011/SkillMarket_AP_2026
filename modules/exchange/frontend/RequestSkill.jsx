import React, { useEffect, useState } from "react";
import { exchangeApi } from "./exchangeApi";

/**
 * Request a Skill page — the student publishes what they want to learn, plus
 * optionally what they can offer in return.
 */
export default function RequestSkill({ navigate }) {
  const [skills, setSkills] = useState([]);
  const [teachable, setTeachable] = useState([]);
  const [form, setForm] = useState({
    title: "",
    wantSkillId: "",
    offerSkillId: "",
    description: "",
    availability: "",
  });
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

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.wantSkillId) {
      setError("Pick the skill you want to learn.");
      return;
    }
    if (form.offerSkillId && Number(form.offerSkillId) === Number(form.wantSkillId)) {
      setError("The offered and wanted skills must be different.");
      return;
    }

    setSaving(true);
    try {
      await exchangeApi.createListing({
        listingType: "REQUEST",
        title: form.title.trim(),
        offerSkillId: form.offerSkillId ? Number(form.offerSkillId) : null,
        wantSkillId: Number(form.wantSkillId),
        description: form.description.trim() || null,
        availability: form.availability.trim() || null,
      });
      navigate("my-exchanges");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const skillName = (id) => {
    const skill = skills.find((s) => s.skillId === Number(id));
    return skill ? skill.skillName : "";
  };

  const offerChoices = teachable.length > 0 ? teachable : skills;

  return (
    <div className="ex-panel">
      <h1>Request a Skill</h1>
      <p>Say what you want to learn. Offer something in return to attract a partner faster.</p>

      {error && <div className="ex-alert ex-alert-error">{error}</div>}

      <form onSubmit={submit}>
        <label className="ex-label" htmlFor="request-title">
          Listing title *
        </label>
        <input
          id="request-title"
          className="ex-input"
          placeholder="e.g. Looking for guitar lessons"
          value={form.title}
          onChange={set("title")}
          required
          minLength={3}
          maxLength={200}
        />

        <label className="ex-label" htmlFor="request-want">
          Skill you want to learn *
        </label>
        <select
          id="request-want"
          className="ex-select"
          value={form.wantSkillId}
          onChange={set("wantSkillId")}
          required
        >
          <option value="">Select a skill…</option>
          {skills.map((skill) => (
            <option key={skill.skillId} value={skill.skillId}>
              {skill.skillName}
            </option>
          ))}
        </select>

        <label className="ex-label" htmlFor="request-offer">
          Skill you can offer in return (optional)
        </label>
        <select
          id="request-offer"
          className="ex-select"
          value={form.offerSkillId}
          onChange={set("offerSkillId")}
        >
          <option value="">Nothing specific</option>
          {offerChoices
            .filter((s) => s.skillId !== Number(form.wantSkillId))
            .map((skill) => (
              <option key={skill.skillId} value={skill.skillId}>
                {skill.skillName}
                {skill.proficiency ? ` (${skill.proficiency})` : ""}
              </option>
            ))}
        </select>

        {form.offerSkillId && (
          <p className="ex-hint">
            {skillName(form.offerSkillId)} ⇄ {skillName(form.wantSkillId)}
          </p>
        )}

        <label className="ex-label" htmlFor="request-description">
          Description
        </label>
        <textarea
          id="request-description"
          className="ex-textarea"
          placeholder="Your current level, goals, and how much time you can commit…"
          value={form.description}
          onChange={set("description")}
        />

        <label className="ex-label" htmlFor="request-availability">
          Availability
        </label>
        <input
          id="request-availability"
          className="ex-input"
          placeholder="e.g. Weekdays, evenings"
          value={form.availability}
          onChange={set("availability")}
          maxLength={120}
        />

        <div className="ex-card-actions" style={{ marginTop: 24 }}>
          <button
            type="button"
            className="ex-btn ex-btn-ghost"
            onClick={() => navigate("")}
          >
            Cancel
          </button>
          <button type="submit" className="ex-btn ex-btn-primary" disabled={saving}>
            {saving ? "Publishing…" : "Publish Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
