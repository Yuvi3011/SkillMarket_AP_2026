import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { exchangeAPI } from '../../../api/config';
import '../exchange.css';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const MODES  = ['Online', 'Offline', 'Both'];
const CATEGORIES = [
  'Coding & Development',
  'Graphic & UI/UX Design',
  'Web Development',
  'Academic Tutoring',
  'Content & Writing',
  'Video & Animation',
  'Music & Audio',
  'Digital Marketing'
];

export default function OfferSkillPage() {
  const navigate = useNavigate();
  const { id }   = useParams(); 
  const isEdit   = Boolean(id);

  const [offered, setOffered]       = useState([]);
  const [wanted, setWanted]         = useState([]);
  const [offerInput, setOfferInput] = useState('');
  const [wantInput, setWantInput]   = useState('');
  const [category, setCategory]     = useState('Coding & Development');
  const [description, setDesc]      = useState('');
  const [level, setLevel]           = useState('Beginner');
  const [availability, setAvail]    = useState('');
  const [mode, setMode]             = useState('Both');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (isEdit) loadListing();
  }, [id]);

  async function loadListing() {
    try {
      const data = await exchangeAPI.getSingleListing(id);
      const l = data.listing;
      setOffered(l.offered || []);
      setWanted(l.wanted   || []);
      setCategory(l.category || 'Coding & Development');
      setDesc(l.description || '');
      setLevel(l.experience_level || 'Beginner');
      setAvail(l.availability || '');
      setMode(l.learning_mode || 'Both');
    } catch { setError('Could not load listing.'); }
  }

  function addTag(value, list, setList, setInput) {
    const v = value.trim();
    if (!v) return;
    if (!list.map(s => s.toLowerCase()).includes(v.toLowerCase())) {
      setList([...list, v]);
    }
    setInput('');
  }

  function removeTag(value, setList) {
    setList(prev => prev.filter(s => s !== value));
  }

  function handleKeyDown(e, value, list, setList, setInput) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(value, list, setList, setInput);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (offered.length === 0) return setError('Add at least one skill you can teach.');
    if (wanted.length  === 0) return setError('Add at least one skill you want to learn.');

    setLoading(true);
    try {
      const body = {
        offer_skills:     offered,
        want_skills:      wanted,
        category,
        description,
        experience_level: level,
        availability,
        learning_mode:    mode,
      };

      if (isEdit) {
        await exchangeAPI.updateListing(id, body);
      } else {
        await exchangeAPI.createListing(body);
      }

      navigate('/exchange');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="exchange-form-page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="exchange-form-header">
          <h1>{isEdit ? 'Edit Listing' : 'Offer a Skill'}</h1>
          <p>{isEdit ? 'Update your exchange listing.' : 'Tell students what you can teach and what you want to learn.'}</p>
        </div>

        {error && <div className="msg-error" style={{ marginBottom:20, padding:'12px 16px', background:'rgba(255,112,79,0.1)', border:'1px solid var(--coral)', borderRadius:4, color:'var(--coral)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'Space Grotesk' }}>
              Skills I Can Teach
            </label>
            <div className="skill-input-row">
              <input
                value={offerInput}
                onChange={e => setOfferInput(e.target.value)}
                onKeyDown={e => handleKeyDown(e, offerInput, offered, setOffered, setOfferInput)}
                placeholder="e.g. Python, React, Figma…"
                style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, width:'100%' }}
              />
              <button type="button" className="btn-outline" style={{ padding:'10px 18px', whiteSpace:'nowrap' }}
                onClick={() => addTag(offerInput, offered, setOffered, setOfferInput)}>
                Add
              </button>
            </div>
            <div className="skill-tags-preview">
              {offered.map(s => (
                <span key={s} className="skill-tag offered" style={{ cursor:'pointer' }} onClick={() => removeTag(s, setOffered)}>
                  {s} ✕
                </span>
              ))}
            </div>
            <p style={{ fontSize:'0.78rem', color:'var(--ink-soft)', marginTop:4 }}>Press Enter or comma to add. Click tag to remove.</p>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'Space Grotesk' }}>
              Skills I Want to Learn
            </label>
            <div className="skill-input-row">
              <input
                value={wantInput}
                onChange={e => setWantInput(e.target.value)}
                onKeyDown={e => handleKeyDown(e, wantInput, wanted, setWanted, setWantInput)}
                placeholder="e.g. UI/UX Design, Machine Learning…"
                style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, width:'100%' }}
              />
              <button type="button" className="btn-outline" style={{ padding:'10px 18px', whiteSpace:'nowrap' }}
                onClick={() => addTag(wantInput, wanted, setWanted, setWantInput)}>
                Add
              </button>
            </div>
            <div className="skill-tags-preview">
              {wanted.map(s => (
                <span key={s} className="skill-tag wanted" style={{ cursor:'pointer' }} onClick={() => removeTag(s, setWanted)}>
                  {s} ✕
                </span>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'Space Grotesk' }}>
              Skill Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, fontSize:'0.9rem', background:'var(--white)' }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'Space Grotesk' }}>
              About You (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Briefly describe your background, what you can teach and what you hope to learn…"
              rows={3}
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, fontSize:'0.9rem', resize:'vertical' }}
            />
          </div>

          <div className="form-two-col" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'Space Grotesk' }}>
                Experience Level
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, fontSize:'0.9rem', background:'var(--white)' }}
              >
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'Space Grotesk' }}>
                Learning Mode
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, fontSize:'0.9rem', background:'var(--white)' }}
              >
                {MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8, fontFamily:'Space Grotesk' }}>
              Availability (optional)
            </label>
            <input
              value={availability}
              onChange={e => setAvail(e.target.value)}
              placeholder="e.g. Weekends, Mon–Fri evenings, 2 hrs/week…"
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, fontSize:'0.9rem' }}
            />
          </div>

          <div style={{ display:'flex', gap:12 }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding:'13px 32px' }}>
              {loading ? 'Saving…' : isEdit ? 'Update Listing' : 'Post Listing'}
            </button>
            <button type="button" className="btn-outline" style={{ padding:'13px 24px' }} onClick={() => navigate('/exchange')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
