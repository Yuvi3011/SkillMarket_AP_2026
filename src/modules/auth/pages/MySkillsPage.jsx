import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { skillsAPI } from '../../../api/config';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

export default function MySkillsPage() {
  const { user } = useAuth();
  const [skills,    setSkills]    = useState([]);
  const [newSkill,  setNewSkill]  = useState('');
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [error,     setError]     = useState('');
  const [msg,       setMsg]       = useState('');

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      const data = await skillsAPI.getSkills();
      setSkills(data.skills);
    } catch (err) {
      setError('Could not load skills.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!newSkill.trim()) {
      setError('Enter a skill name.');
      return;
    }

    setAdding(true);
    try {
      await skillsAPI.addSkill({ skill_name: newSkill.trim() });
      setNewSkill('');
      setMsg('Skill added!');
      await loadSkills();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userSkillId) {
    setError('');
    setMsg('');
    try {
      await skillsAPI.removeSkill(userSkillId);
      setMsg('Skill removed.');
      setSkills(prev => prev.filter(s => s.user_skill_id !== userSkillId));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="container page-wrap"><div className="spinner" /></div>;

  return (
    <div className="skills-page">
      <div className="container">
        <div className="skills-page-header">
          <div>
            <h1>My Skills & Specializations</h1>
            <p>{skills.length} skill{skills.length !== 1 ? 's' : ''} listed in your profile for marketplace and skill exchange</p>
          </div>
        </div>

        <form className="add-skill-form" onSubmit={handleAdd}>
          <div className="form-group">
            <label>Add a Skill / Specialization</label>
            <input
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              placeholder="e.g. React, Figma, Python, Video Editing, Calculus Tutoring…"
            />
          </div>
          <button className="btn-primary" disabled={adding} style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>
            {adding ? 'Adding…' : '+ Add Skill'}
          </button>
        </form>

        {error && <div className="msg-error">{error}</div>}
        {msg   && <div className="msg-success">{msg}</div>}

        {skills.length === 0 ? (
          <div className="empty-skills">
            <div style={{ fontSize: '2rem' }}>🛠️</div>
            <p>No skills added yet. Add your first skill above.</p>
          </div>
        ) : (
          <div className="skills-grid">
            {skills.map(s => (
              <div key={s.user_skill_id} className="skill-pill">
                {s.skill_name}
                <button
                  className="remove-btn"
                  onClick={() => handleRemove(s.user_skill_id)}
                  title="Remove skill"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
