import React, { useEffect, useState } from "react";
import { exchangeApi } from "./exchangeApi";

/**
 * Offer a Skill page — the student publishes what they can teach, plus
 * optionally what they want in return.
 */
export default function OfferSkill({ navigate }) {
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({
    title: "",
    offerSkillId: "",
    wantSkillId: "",
    description: "",
    availability: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    exchangeApi
      .getSkills()
      .then((data) => setSkills(data.skills))
      .catch(() => setSkills([]));
  }, []);

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.offerSkillId) {
      setError("Pick the skill you are offering.");
      return;
    }
    if (form.wantSkillId && Number(form.offerSkillId) === Number(form.wantSkillId)) {
      setError("The offered and wanted skills must be different.");
      return;
    }

    setSaving(true);
    try {
      await exchangeApi.createListing({
        listingType: "OFFER",
        title: form.title.trim(),
        offerSkillId: Number(form.offerSkillId),
        wantSkillId: form.wantSkillId ? Number(form.wantSkillId) : null,
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

  return (
    <div className="ex-panel">
      <h1>Offer a Skill</h1>
      <p>Tell others what you can teach. Add a skill you want in return to get two-way matches.</p>

      {error && <div className="ex-alert ex-alert-error">{error}</div>}

      <form onSubmit={submit}>
        <label className="ex-label" htmlFor="offer-title">
          Listing title *
        </label>
        <input
          id="offer-title"
          className="ex-input"
          placeholder="e.g. Python mentoring for design help"
          value={form.title}
          onChange={set("title")}
          required
          minLength={3}
          maxLength={200}
        />

        <label className="ex-label" htmlFor="offer-skill">
          Skill you teach *
        </label>
        <select
          id="offer-skill"
          className="ex-select"
          value={form.offerSkillId}
          onChange={set("offerSkillId")}
          required
        >
          <option value="">Select a skill…</option>
          {skills.map((skill) => (
            <option key={skill.skillId} value={skill.skillId}>
              {skill.skillName}
            </option>
          ))}
        </select>

        <label className="ex-label" htmlFor="offer-want">
          Skill you want to learn (optional)
        </label>
        <select
          id="offer-want"
          className="ex-select"
          value={form.wantSkillId}
          onChange={set("wantSkillId")}
        >
          <option value="">Open to anything</option>
          {skills
            .filter((s) => s.skillId !== Number(form.offerSkillId))
            .map((skill) => (
              <option key={skill.skillId} value={skill.skillId}>
                {skill.skillName}
              </option>
            ))}
        </select>

        {form.wantSkillId && (
          <p className="ex-hint">
            {skillName(form.offerSkillId)} ⇄ {skillName(form.wantSkillId)}
          </p>
        )}

        <label className="ex-label" htmlFor="offer-description">
          Description
        </label>
        <textarea
          id="offer-description"
          className="ex-textarea"
          placeholder="What will a session look like? How many weeks?"
          value={form.description}
          onChange={set("description")}
        />

        <label className="ex-label" htmlFor="offer-availability">
          Availability
        </label>
        <input
          id="offer-availability"
          className="ex-input"
          placeholder="e.g. Weekends, evenings"
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
