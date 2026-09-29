import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import Logo from '../../components/Logo/Logo';
import UserAvatar from '../../components/UserAvatar/UserAvatar';
import { formatDegree } from '../../lib/formatters';
import { Bookmark } from 'lucide-react';
import useShortlist from '../../hooks/useShortlist';
import {
  BsBullseye, BsCashCoin, BsMortarboard, BsPeopleFill,
  BsChatSquareDots, BsHouseDoor, BsForkKnife, BsBusFront, BsBox,
  BsStarFill, BsStarHalf, BsCash, BsExclamationTriangleFill, BsCheckCircleFill,
  BsClipboard2, BsClock, BsGlobe2, BsPaperclip, BsLightningCharge, BsShieldCheck,

} from 'react-icons/bs';
import {
  FcCommandLine, FcComboChart, FcAndroidOs, FcPrivacy,
  FcEngineering, FcLineChart, FcMoneyTransfer,
  FcMindMap, FcIdea
} from 'react-icons/fc';
import { FaStethoscope } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import '../DataPages.css';

const careerIconMap = {
  'Software Engineer': <FcCommandLine />,
  'Data Scientist': <FcComboChart />,
  'Robotics Software Engineer': <FcAndroidOs />,
  'Cybersecurity Engineer': <FcPrivacy />,
  'Mechanical Engineer': <FcEngineering />,
  'Business Analyst': <FcLineChart />,
  'Financial Analyst': <FcMoneyTransfer />,
  'Doctor (Physician)': <FaStethoscope color="#0d9488" />,
  'AI/ML Researcher': <FcMindMap />,
  'Product Manager': <FcIdea />,
};

// ── Reviews ────────────────────────────────────────

function StarRating({ value, onChange, max = 5 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0, lineHeight: 1 }}
        >
          <BsStarFill
            size={onChange ? 22 : 14}
            color={(hovered || value) >= star ? '#f59e0b' : 'var(--border-primary)'}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserAvatar user={review.author} size={38} showBadge />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {review.author.displayName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {/* Authenticated badge — separate from "Verified Student" */}
              {(review.author.authProvider === 'google' || review.author.authProvider === 'apple') && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: 'rgba(99,102,241,0.12)', color: 'var(--primary-400)',
                  borderRadius: 99, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                }}>
                  <BsShieldCheck size={10} /> Authenticated
                </span>
              )}
              {review.isVerifiedStudent && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: 'rgba(16,185,129,0.12)', color: '#10b981',
                  borderRadius: 99, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                }}>
                  <BsCheckCircleFill size={10} /> Verified Student
                </span>
              )}
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
        <StarRating value={review.rating} max={5} />
      </div>

      {/* Review body */}
      {review.title && <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{review.title}</p>}
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{review.body}</p>

      {(review.pros || review.cons) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {review.pros && (
            <div style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.07)', borderRadius: 8, padding: '8px 12px' }}>
              <strong>👍 Pros:</strong> {review.pros}
            </div>
          )}
          {review.cons && (
            <div style={{ fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245,158,11,0.07)', borderRadius: 8, padding: '8px 12px' }}>
              <strong>⚠️ Cons:</strong> {review.cons}
            </div>
          )}
        </div>
      )}

      {review.programStudied && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          📚 {review.programStudied}{review.yearAttended ? ` · ${review.yearAttended}` : ''}
        </div>
      )}
    </div>
  );
}

function ReviewsSection({ uniSlug, user, isAuthenticated }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', body: '', pros: '', cons: '', programStudied: '', yearAttended: '' });
  const [formError, setFormError] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      const res = await api.get(`/universities/${uniSlug}/reviews?limit=20`);
      setReviews(res.data.data.reviews || []);
      setStats(res.data.data.stats || null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [uniSlug]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.rating) { setFormError('Please select a star rating'); return; }
    if (!form.body || form.body.trim().length < 20) { setFormError('Review must be at least 20 characters'); return; }
    setSubmitting(true);
    try {
      await api.post(`/universities/${uniSlug}/reviews`, form);
      toast.success('Your review has been posted!');
      setShowForm(false);
      setForm({ rating: 0, title: '', body: '', pros: '', cons: '', programStudied: '', yearAttended: '' });
      loadReviews();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats row */}
      {stats && stats.totalCount > 0 && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stats.avgRating.toFixed(1)}
            </div>
            <StarRating value={Math.round(stats.avgRating)} max={5} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>{stats.totalCount} review{stats.totalCount !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            {[5,4,3,2,1].map(star => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', width: 10 }}>{star}</span>
                <BsStarFill size={10} color="#f59e0b" />
                <div style={{ flex: 1, height: 6, background: 'var(--border-primary)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#f59e0b', borderRadius: 99, width: `${stats.totalCount ? (stats.distribution[star] / stats.totalCount) * 100 : 0}%` }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', width: 16 }}>{stats.distribution[star]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write review CTA */}
      {isAuthenticated && !showForm && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          ✍️ Write a Review
        </button>
      )}
      {!isAuthenticated && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
          <a href="/login" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Sign in</a> to share your experience at this university.
        </p>
      )}

      {/* Review form */}
      {showForm && isAuthenticated && (
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--primary-400)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <UserAvatar user={user} size={36} showBadge />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Your name and photo are locked to your account — they cannot be changed per review.
              </div>
            </div>
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--error-400)', marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Overall Rating *</label>
              <StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} max={5} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Title (optional)</label>
              <input className="form-input" placeholder="Sum up your experience..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={200} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Your Experience *</label>
              <textarea
                className="form-input"
                placeholder="Share your honest experience — academics, social life, career support, and more. Min 20 characters."
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Pros (optional)</label>
                <textarea className="form-input" placeholder="What did you love?" value={form.pros} onChange={e => setForm(f => ({ ...f, pros: e.target.value }))} rows={2} style={{ resize: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Cons (optional)</label>
                <textarea className="form-input" placeholder="What could be better?" value={form.cons} onChange={e => setForm(f => ({ ...f, cons: e.target.value }))} rows={2} style={{ resize: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Program Studied (optional)</label>
                <input className="form-input" placeholder="e.g. MSc Computer Science" value={form.programStudied} onChange={e => setForm(f => ({ ...f, programStudied: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Year Attended (optional)</label>
                <input className="form-input" type="number" placeholder="e.g. 2023" value={form.yearAttended} onChange={e => setForm(f => ({ ...f, yearAttended: e.target.value }))} min="1950" max={new Date().getFullYear() + 2} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎓</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </div>
  );
}



// ── Client-side match calculation ─────────────────────────
function computeMatch(profile, uni) {
  if (!profile || !uni) return null;

  // Extract from nested API shape
  const academic = profile.academic || {};
  const prefs = profile.preferences || {};
  const testScores = profile.testScores || [];

  const rawGpa = parseFloat(academic.gpa) || null;
  const gpaScale = parseFloat(academic.gpaScale) || 4.0;
  
  // 1. Universal GPA Normalization (Convert to 4.0 scale)
  const gpa = rawGpa ? (rawGpa / gpaScale) * 4.0 : null;

  const desiredField = prefs.desiredField || academic.currentMajor || null;
  const budgetMax = parseFloat(prefs.budgetMax) || null;
  
  const ielts = testScores.find(s => s.testName === 'IELTS')?.overallScore || null;
  const toefl = testScores.find(s => s.testName === 'TOEFL')?.overallScore || null;
  const gre = testScores.find(s => s.testName === 'GRE')?.overallScore || null;
  const gmat = testScores.find(s => s.testName === 'GMAT')?.overallScore || null;

  if (!gpa && !desiredField && !budgetMax && !ielts && !toefl && !gre && !gmat) return null;

  const factors = {};
  let totalScore = 0;
  let count = 0;

  // Academic
  if (gpa && uni.requirements?.minGpa) {
    if (gpa >= uni.requirements.minGpa) {
      const ratio = gpa / uni.requirements.minGpa;
      const score = Math.min(100, Math.round(ratio * 100));
      factors.academic = { level: score >= 95 ? 'strong' : score >= 85 ? 'moderate' : 'difficult', score, reason: null };
      totalScore += score;
    } else {
      const ratio = gpa / uni.requirements.minGpa;
      const score = Math.round(ratio * 60); // Severely penalize below minimum
      factors.academic = { 
        level: 'difficult', 
        score, 
        reason: `Your GPA (${gpa.toFixed(1)}/4.0) is below the minimum required (${Number(uni.requirements.minGpa).toFixed(1)}/4.0).` 
      };
      totalScore += score;
    }
    count++;
  } else {
    factors.academic = { level: 'unknown', score: null, reason: null };
  }

  // Program / Career fit
  if (desiredField && uni.faculties?.length > 0) {
    const fieldLower = desiredField.toLowerCase();
    const matched = uni.faculties.some(f => f.toLowerCase().includes(fieldLower) || fieldLower.includes(f.toLowerCase()));
    factors.career = { 
      level: matched ? 'strong' : 'difficult', 
      score: matched ? 100 : 0,
      reason: matched ? null : 'This university does not strongly feature your desired field of study.'
    };
    totalScore += matched ? 100 : 0;
    count++;
  } else {
    factors.career = { level: 'unknown', score: null, reason: null };
  }

  // Budget
  if (budgetMax && uni.financial?.avgTuitionUsd) {
    const totalCost = Number(uni.financial.avgTuitionUsd) + Number(uni.financial.avgLivingCostUsd || 0) * 12;
    if (budgetMax >= totalCost) {
      const ratio = budgetMax / totalCost;
      const score = Math.min(100, Math.round(ratio * 100));
      factors.budget = { level: score >= 100 ? 'strong' : score >= 85 ? 'moderate' : 'difficult', score, reason: null };
      totalScore += score;
    } else {
      const ratio = budgetMax / totalCost;
      const score = Math.round(ratio * 70); // Penalize below budget
      factors.budget = { 
        level: 'difficult', 
        score, 
        reason: `Your budget is below the estimated total cost ($${totalCost.toLocaleString('en-US')}).` 
      };
      totalScore += score;
    }
    count++;
  } else {
    factors.budget = { level: 'unknown', score: null, reason: null };
  }

  // English requirement
  if ((ielts || toefl) && (uni.requirements?.minIelts || uni.requirements?.minToefl)) {
    let score = null;
    let level = null;
    let reason = null;
    if (ielts && uni.requirements?.minIelts) {
      if (ielts >= uni.requirements.minIelts) {
        score = Math.min(100, Math.round((ielts / uni.requirements.minIelts) * 100));
      } else {
        score = Math.round((ielts / uni.requirements.minIelts) * 60);
        reason = `Your IELTS score (${ielts}) is below the required minimum (${uni.requirements.minIelts}).`;
      }
    } else if (toefl && uni.requirements?.minToefl) {
      if (toefl >= uni.requirements.minToefl) {
        score = Math.min(100, Math.round((toefl / uni.requirements.minToefl) * 100));
      } else {
        score = Math.round((toefl / uni.requirements.minToefl) * 60);
        reason = `Your TOEFL score (${toefl}) is below the required minimum (${uni.requirements.minToefl}).`;
      }
    }

    if (score !== null) {
      level = score >= 100 ? 'strong' : score >= 90 ? 'moderate' : 'difficult';
      factors.requirements = { 
        level, 
        score, 
        reason: level === 'difficult' && !reason ? 'Your test scores are slightly below competitive averages.' : reason 
      };
      totalScore += score;
      count++;
    } else {
      factors.requirements = { level: 'unknown', score: null, reason: null };
    }
  } else {
    factors.requirements = { level: 'unknown', score: null, reason: null };
  }

  if (count === 0) return null;

  let overall = Math.round(totalScore / count);

  // 2. The "Competitiveness Penalty"
  // Since acceptanceRate isn't explicitly in the DB yet, we use qsRanking as an accurate proxy.
  // QS Top 20 is ~ < 10% acceptance. QS Top 50 is ~ < 20% acceptance.
  let maxPossibleScore = 100;
  if (uni.qsRanking) {
    if (uni.qsRanking <= 20) maxPossibleScore = 75; // e.g. MIT, Stanford, Oxford
    else if (uni.qsRanking <= 50) maxPossibleScore = 85; 
    else if (uni.qsRanking <= 100) maxPossibleScore = 92;
  }
  
  if (overall > maxPossibleScore) {
    overall = maxPossibleScore;
  }

  // 3. Missing Data Penalties (Standardized Tests)
  if (uni.requirements?.minGre && !gre) {
    overall = Math.max(0, overall - 15); // 15% penalty for missing required GRE
  }
  if (uni.requirements?.minGmat && !gmat) {
    overall = Math.max(0, overall - 15); // 15% penalty for missing required GMAT
  }

  return { overall, factors };
}

function MatchIndicator({ factor }) {
  if (!factor) return null;
  const config = {
    strong: { label: 'Strong', color: 'var(--accent-500)' },
    moderate: { label: 'Moderate', color: 'var(--warning-500)' },
    difficult: { label: 'Difficult', color: 'var(--error-500)' },
    unknown: { label: 'Unknown', color: 'var(--text-tertiary)' },
  };
  const c = config[factor.level] || config.unknown;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', width: '100%' }}>
      <span style={{ color: c.color, fontSize: '0.85rem', fontWeight: 600 }}>
        {c.label}
      </span>
      {factor.score !== null && (
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: c.color, textAlign: 'right' }}>
          {factor.score}%
        </span>
      )}
    </div>
  );
}

function ProgressRing({ percent }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="match-ring">
      <svg viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border-secondary)" strokeWidth="7" />
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--primary-400)" strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="match-ring-value">{percent}%</div>
    </div>
  );
}

function StarDisplay({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '★';
  if (half) stars += '★';
  while (stars.length < 5) stars += '☆';
  return <span>{stars}</span>;
}

export default function UniversityDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toggle, isShortlisted } = useShortlist();
  const [uni, setUni] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [careers, setCareers] = useState([]);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'details'

  useEffect(() => {
    setLoading(true);
    setUni(null);
    api.get(`/universities/${slug}`)
      .then(res => setUni(res.data.data))
      .catch(() => navigate('/universities'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/users/me').then(res => {
        const u = res.data.data;
        // Store the full user object (with nested academic/preferences/testScores)
        setProfile(u);
      }).catch(() => { });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    api.get('/careers', { params: { limit: 10 } })
      .then(res => setCareers(res.data.data || []))
      .catch(() => { });
  }, []);

  const match = useMemo(() => computeMatch(profile, uni), [profile, uni]);

  if (loading) {
    return (
      <div className="page container">
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 32 }} />
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div className="skeleton" style={{ height: 180, borderRadius: 16, marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 16, marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!uni) return null;

  const totalAnnualCost = (uni.financial?.avgTuitionUsd || 0) + (uni.financial?.avgLivingCostUsd || 0) * 12;
  const userBudget = profile?.preferences?.budgetMax || null;
  const budgetDiffPct = userBudget ? Math.round(((totalAnnualCost - userBudget) / userBudget) * 100) : null;

  // Placeholder student ratings based on university data
  const seed = (uni.name || '').length;
  const ratings = {
    academics: 3.8 + (seed % 12) / 10,
    career: 3.5 + (seed % 14) / 10,
    costValue: 2.8 + (seed % 17) / 10,
    campusLife: 3.5 + (seed % 11) / 10,
  };
  const avgRating = ((ratings.academics + ratings.career + ratings.costValue + ratings.campusLife) / 4).toFixed(1);
  const reviewCount = 100 + (seed * 7) % 400;

  // Mock Acceptance Rate based on QS ranking
  const acceptanceRate = uni.rankings?.qs
    ? Math.max(4, Math.min(85, Math.floor(uni.rankings.qs / 1.5))) + '%'
    : (20 + (seed % 40)) + '%';

  // Placeholder deadlines
  const nextYear = new Date().getFullYear() + 1;
  const deadlines = [
    { label: 'Application Deadline', value: `Jan 1, ${nextYear}` },
    { label: 'Scholarship Deadline', value: `Dec 15, ${nextYear - 1}` },
    { label: 'Housing Application', value: `Mar 1, ${nextYear}` },
  ];

  // Living costs
  const monthlyLiving = uni.financial?.avgLivingCostUsd || 0;
  const livingCosts = [
    { label: 'Housing', icon: <BsHouseDoor size={14} />, value: Math.round(monthlyLiving * 0.5) },
    { label: 'Food', icon: <BsForkKnife size={14} />, value: Math.round(monthlyLiving * 0.25) },
    { label: 'Transport', icon: <BsBusFront size={14} />, value: Math.round(monthlyLiving * 0.12) },
    { label: 'Other', icon: <BsBox size={14} />, value: Math.round(monthlyLiving * 0.13) },
  ];

  // Career outcomes - match uni faculties to career data
  const relatedCareers = careers.filter(c => {
    const faculties = (uni.faculties || []).map(f => f.toLowerCase());
    return faculties.some(f =>
      c.name.toLowerCase().includes(f) ||
      f.includes('computer') && c.name.toLowerCase().includes('software') ||
      f.includes('engineering') && c.name.toLowerCase().includes('engineer') ||
      f.includes('business') && (c.name.toLowerCase().includes('business') || c.name.toLowerCase().includes('financial') || c.name.toLowerCase().includes('product'))
    );
  }).slice(0, 4);

  // Dynamic description generation
  const generatedDesc = `Established in ${uni.foundedYear || 'its founding year'}, ${uni.name} is a leading ${uni.universityType || 'higher education'} institution located in ${uni.city || 'its vibrant city'}, ${uni.country?.name}. ` +
    (uni.faculties?.length > 0 ? `It is highly recognized globally for its exceptional academic programs, particularly in ${uni.faculties.slice(0, 3).join(', ')}. ` : '') +
    (uni.totalStudents ? `The university is home to approximately ${Number(uni.totalStudents).toLocaleString('en-US')} students, fostering a diverse and vibrant campus life. ` : '') +
    (uni.internationalStudentsPct ? `With an international student body comprising ${uni.internationalStudentsPct}% of its population, it offers a truly global perspective and an inclusive environment for students from all over the world.` : '');

  const finalDescription = (uni.description && uni.description.length > 200)
    ? uni.description
    : `${uni.description ? uni.description + ' ' : ''}${generatedDesc}`;

  return (
    <div className="page">
      {/* ══════════ HERO ══════════ */}
      <div className="detail-hero" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)', marginBottom: 0 }}>
        <div className="container" style={{ position: 'relative' }}>
          <button
            type="button"
            className={`shortlist-card-btn ${isShortlisted(uni.id) ? 'shortlisted' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              toggle(uni.id);
            }}
            aria-label={isShortlisted(uni.id) ? 'Remove from shortlist' : 'Add to shortlist'}
            style={{ position: 'absolute', top: '-12px', right: 0 }}
          >
            <Bookmark size={18} />
          </button>

          <Link to={location.state?.fromParams ? `/universities?${location.state.fromParams}` : '/universities'} className="text-sm text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, textDecoration: 'none', marginTop: '-1.5rem' }}>
            ← Back to Universities
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div className="uni-logo" style={{ width: 72, height: 72, fontSize: '2rem', flexShrink: 0, padding: 0 }}>
              <Logo website={uni.website} name={uni.name} slug={uni.slug} logoUrl={uni.logoUrl} size={72} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 className="detail-title">{uni.name}</h1>
              <p className="detail-subtitle">
                {uni.country && <img src={`/flags/${uni.country.code.toLowerCase()}.webp`} alt={uni.country.name} style={{ width: '1.2em', verticalAlign: 'middle', marginRight: '4px' }} />} {uni.city}{uni.stateProvince ? `, ${uni.stateProvince}` : ''} · {uni.country?.name}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <span className="badge badge-primary">{uni.universityType}</span>
                {uni.foundedYear && <span className="badge">Est. {uni.foundedYear}</span>}
                {uni.rankings?.qs && <span className="badge badge-accent">QS #{uni.rankings.qs}</span>}
                {uni.rankings?.the && <span className="badge">THE World#{uni.rankings.the}</span>}
              </div>
            </div>
          </div>

          {/* Quick Stats and Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, flexWrap: 'wrap', gap: 24 }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Avg. Tuition', value: uni.financial?.avgTuitionUsd ? `$${Number(uni.financial.avgTuitionUsd).toLocaleString('en-US')}/yr` : 'N/A' },
              { label: 'Total Students', value: uni.totalStudents ? Number(uni.totalStudents).toLocaleString('en-US') : 'N/A' },
              { label: 'Intl. Students', value: uni.internationalStudentsPct ? `${uni.internationalStudentsPct}%` : 'N/A' },
              { label: 'Verified Programs', value: uni.verifiedProgramCount ?? 0 },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-300)', marginTop: 2 }}>{stat.value}</div>
              </div>
            ))}
            </div>
            
            {uni.website && (
              <a href={uni.website} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                Visit Website ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ PAGE CONTENT ══════════ */}
      <div className="container" style={{ padding: '16px 20px 80px' }}>
        <div className="overview-section animate-fadeInUp" style={{ marginBottom: '40px' }}>
          <style>{`
              .overview-grid-custom {
                display: grid;
                grid-template-columns: 2.7fr 1fr;
                gap: 40px;
              }
              @media (max-width: 768px) {
                .overview-grid-custom {
                  grid-template-columns: 1fr;
                }
              }
            `}</style>

          <h2 className="decision-section-title">About {uni.name}</h2>
          <div className="overview-grid-custom">
            <div className="overview-left">
              <div className="card" style={{ padding: '24px 32px', marginBottom: 32 }}>
                <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  {finalDescription}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border-secondary)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Acceptance Rate</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{acceptanceRate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>QS World Ranking</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{uni.rankings?.qs ? `#${uni.rankings.qs}` : 'Not Ranked'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overview-right detail-sidebar">
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>Rankings</h3>
                {[
                  { label: 'QS World', value: uni.rankings?.qs ? `#${uni.rankings.qs}` : '—' },
                  { label: 'THE World', value: uni.rankings?.the ? `#${uni.rankings.the}` : '—' },
                  { label: 'ARWU (Shanghai)', value: uni.rankings?.arwu ? `#${uni.rankings.arwu}` : '—' },
                  { label: 'National', value: uni.rankings?.national ? `#${uni.rankings.national}` : '—' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.value !== '—' ? 'var(--primary-300)' : 'inherit' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="decision-page">
          <div className="animate-fadeInUp">

            <div className="decision-section">
              <h2 className="decision-section-title"><BsBullseye style={{ verticalAlign: 'middle', marginRight: 8 }} />Your Match</h2>
              {match ? (
                <div className="match-card">
                  <div className="match-header">
                    <ProgressRing percent={match.overall} />
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Profile Match</div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Based on your academic profile, budget, and preferences</p>
                    </div>
                  </div>
                  <div className="match-factors">
                    <div className="match-factor">
                      <span className="match-factor-label">Academic</span>
                      <MatchIndicator factor={match.factors.academic} />
                    </div>
                    <div className="match-factor">
                      <span className="match-factor-label">Career</span>
                      <MatchIndicator factor={match.factors.career} />
                    </div>
                    <div className="match-factor">
                      <span className="match-factor-label">Budget</span>
                      <MatchIndicator factor={match.factors.budget} />
                    </div>
                    <div className="match-factor">
                      <span className="match-factor-label">Requirements</span>
                      <MatchIndicator factor={match.factors.requirements} />
                    </div>
                  </div>
                  {(() => {
                    const reasons = Object.values(match.factors)
                      .filter(f => f?.level === 'difficult' && f.reason)
                      .map(f => f.reason);
                    
                    if (reasons.length > 0) {
                      return (
                        <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>Areas of Concern</h4>
                          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                            {reasons.map((r, idx) => (
                              <li key={idx} style={{ marginBottom: 6 }}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="match-cta">
                  <div className="match-cta-icon"><BsBullseye size={32} /></div>
                  <div className="match-cta-title">See how well you match with {uni.name}</div>
                  <p className="match-cta-desc">Sign in and complete your profile to get a personalized match score based on your academics, budget, and career goals.</p>
                  <Link to={isAuthenticated ? '/profile' : '/register'} className="btn btn-primary btn-sm">
                    {isAuthenticated ? 'Complete Profile' : 'Sign Up Free'}
                  </Link>
                </div>
              )}
            </div>

            {/* ── 2. CAN YOU AFFORD IT? ── */}
            <div className="decision-section">
              <h2 className="decision-section-title"><BsCashCoin style={{ verticalAlign: 'middle', marginRight: 6 }} /> Can You Afford It?</h2>
              <div className="afford-card">
                <div className="afford-comparison">
                  <div className="afford-item">
                    <div className="afford-item-label">Estimated Annual Cost</div>
                    <div className="afford-item-value">${Number(totalAnnualCost).toLocaleString('en-US')}</div>
                  </div>
                  <div className="afford-vs">vs</div>
                  <div className="afford-item">
                    <div className="afford-item-label">Your Budget</div>
                    <div className="afford-item-value">{userBudget ? `$${Number(userBudget).toLocaleString('en-US')}` : '—'}</div>
                  </div>
                </div>
                {budgetDiffPct !== null ? (
                  <div className={`afford-warning ${budgetDiffPct > 0 ? 'over' : 'under'}`}>
                    {budgetDiffPct > 0 ? (
                      <><BsExclamationTriangleFill style={{ verticalAlign: 'middle', marginRight: 6 }} /> Above your budget by {budgetDiffPct}%</>
                    ) : (
                      <><BsCheckCircleFill style={{ verticalAlign: 'middle', marginRight: 6 }} /> Within your budget — {Math.abs(budgetDiffPct)}% headroom</>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    {isAuthenticated
                      ? <Link to="/profile" style={{ color: 'var(--primary-300)' }}>Set your budget</Link>
                      : <Link to="/register" style={{ color: 'var(--primary-300)' }}>Sign up</Link>
                    } to compare with your finances
                  </p>
                )}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Link to="/calculator" className="btn btn-ghost btn-sm">Calculate Your Cost →</Link>
                </div>
              </div>
            </div>

            {/* ── 3. PROGRAMS ── */}
            <div className="decision-section">
              {(() => {
                const allPrograms = uni.programs || [];
                const verifiedPrograms = allPrograms.filter(p => p.verificationStatus === 'verified');
                const hasVerified = verifiedPrograms.length > 0;
                const totalCount = allPrograms.length;

                return (
                  <>
                    <h2 className="decision-section-title">
                      <BsMortarboard style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      {hasVerified
                        ? `${verifiedPrograms.length} Verified Program${verifiedPrograms.length !== 1 ? 's' : ''}`
                        : 'Programs'}
                    </h2>

                    {/* Unverified catalog banner */}
                    {!hasVerified && totalCount > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        background: 'color-mix(in srgb, var(--warning-400, #f59e0b) 8%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--warning-400, #f59e0b) 25%, transparent)',
                        borderRadius: '10px', padding: '0.75rem 1rem',
                        marginBottom: '1rem', fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                      }}>
                        <BsExclamationTriangleFill style={{ flexShrink: 0, marginTop: 2, color: '#f59e0b' }} />
                        <span>
                          <strong>Catalog under verification</strong> — Showing {totalCount} unverified
                          record{totalCount !== 1 ? 's' : ''}. These programs are not confirmed
                          against an official source.{' '}
                          {uni.website && (
                            <a href={uni.website} target="_blank" rel="noreferrer"
                               style={{ color: 'var(--primary-300)' }}>
                              Check the official university website ↗
                            </a>
                          )}
                        </span>
                      </div>
                    )}

                    {totalCount > 0 ? (
                      <>
                        <div className="programs-mini-grid">
                          {allPrograms.slice(0, 6).map(p => (
                            <Link key={p.id} to={`/programs/${p.slug}`} className="program-mini-card">
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span
                                  className={`badge ${p.degree === 'masters' ? 'badge-primary' : p.degree === 'phd' ? 'badge-accent' : 'badge-warning'}`}
                                  style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                                >
                                  {formatDegree(p.degree)}
                                </span>
                                {p.verificationStatus === 'verified' ? (
                                  <span title="Verified against official source" style={{
                                    fontSize: '0.6rem', fontWeight: 700,
                                    color: 'var(--accent-400)',
                                    background: 'color-mix(in srgb, var(--accent-400) 12%, transparent)',
                                    border: '1px solid color-mix(in srgb, var(--accent-400) 30%, transparent)',
                                    borderRadius: '999px', padding: '1px 6px',
                                  }}>
                                    ✓ Verified
                                  </span>
                                ) : (
                                  <span title="Not yet verified against an official source" style={{
                                    fontSize: '0.6rem', fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    background: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
                                    border: '1px solid color-mix(in srgb, var(--text-muted) 18%, transparent)',
                                    borderRadius: '999px', padding: '1px 6px',
                                  }}>
                                    Unverified
                                  </span>
                                )}
                              </div>
                              <div className="program-mini-name">{p.name}</div>
                              <div className="program-mini-meta">
                                {p.field}{p.specialization ? ` · ${p.specialization}` : ''} · {p.durationLabel || '—'}
                              </div>
                            </Link>
                          ))}
                        </div>
                        {totalCount > 6 && (
                          <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Link to={`/programs?university=${slug}`} className="btn btn-ghost btn-sm">
                              View All {totalCount} Programs →
                            </Link>
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                        Official program catalog currently being verified for this institution.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            {/* ── 4. STUDENT REALITY ── */}
            <div className="decision-section">
              <h2 className="decision-section-title"><BsPeopleFill style={{ verticalAlign: 'middle', marginRight: 8 }} /> Student Reality</h2>
              <div className="rating-overview">
                <div className="rating-big">
                  <div className="rating-big-value">{avgRating}</div>
                  <div className="rating-big-stars"><StarDisplay rating={parseFloat(avgRating)} /></div>
                  <div className="rating-big-count">{reviewCount} students</div>
                </div>
                <div className="rating-bars">
                  {[
                    { label: 'Academics', value: ratings.academics },
                    { label: 'Career', value: ratings.career },
                    { label: 'Cost / Value', value: ratings.costValue },
                    { label: 'Campus Life', value: ratings.campusLife },
                  ].map(r => (
                    <div key={r.label} className="rating-bar-row">
                      <span className="rating-bar-label">{r.label}</span>
                      <div className="rating-bar-track">
                        <div className="rating-bar-fill" style={{ width: `${(r.value / 5) * 100}%` }} />
                      </div>
                      <span className="rating-bar-value">{r.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ReviewsSection uniSlug={slug} user={user} isAuthenticated={isAuthenticated} />
            </div>

            {/* ── 5. COMMUNITY ── */}
            <div className="decision-section">
              <h2 className="decision-section-title"><BsChatSquareDots style={{ verticalAlign: 'middle', marginRight: 8 }} /> Community</h2>
              <div className="coming-soon-card">
                <span className="coming-soon-badge">Coming Soon</span>
                <div className="coming-soon-title">{uni.name} — Fall {new Date().getFullYear() + 1}</div>
                <p className="coming-soon-desc">Connect with prospective and current students. Ask questions, share experiences, and get real answers.</p>
              </div>
            </div>

            {/* ── 6. LIFE IN [CITY] ── */}
            <div className="decision-section">
              <h2 className="decision-section-title">Life in {uni.city || 'This City'}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>Average monthly student expenses</p>
              <div className="living-cost-grid">
                {livingCosts.map(c => (
                  <div key={c.label} className="living-cost-item">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{c.icon} {c.label}</span>
                    <span>{c.value ? `$${Number(c.value).toLocaleString('en-US')}/mo` : '—'}</span>
                  </div>
                ))}
              </div>
              {uni.financial?.avgLivingCostUsd && (
                <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Monthly</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-300)' }}>${Number(uni.financial.avgLivingCostUsd).toLocaleString('en-US')}/mo</span>
                </div>
              )}
            </div>

            {/* ── 7. CAREER OUTCOMES ── */}
            <div className="decision-section">
              <h2 className="decision-section-title">Career Outcomes</h2>
              {relatedCareers.length > 0 ? (
                <>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>Popular career paths for graduates</p>
                  <div className="career-outcomes-grid">
                    {relatedCareers.map(c => (
                      <Link key={c.id} to={`/careers/${c.slug}`} className="career-outcome-card">
                        <div className="career-outcome-icon">{careerIconMap[c.name] || c.icon}</div>
                        <div className="career-outcome-name">{c.name}</div>
                        <div className="career-outcome-salary">Avg. ${(Number(c.avgSalaryUsd) || 0).toLocaleString('en-US')}/yr</div>
                      </Link>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Link to="/careers" className="btn btn-ghost btn-sm">Explore All Careers →</Link>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: 12 }}>Explore career paths suited to {uni.name} graduates.</p>
                  <Link to="/careers" className="btn btn-ghost btn-sm">Browse Careers →</Link>
                </div>
              )}
            </div>

            {/* ── 8. SCHOLARSHIPS ── */}
            <div className="decision-section">
              <h2 className="decision-section-title"><BsMortarboard style={{ verticalAlign: 'middle', marginRight: 8 }} /> Scholarships ({uni.scholarships?.length || 0})</h2>
              {uni.scholarships?.length > 0 ? (
                <>
                  <div className="scholarship-mini-grid">
                    {uni.scholarships.slice(0, 4).map(s => (
                      <Link key={s.id} to={`/scholarships/${s.slug}`} className="scholarship-mini-card">
                        <span className={`badge ${s.coverage === 'full' ? 'badge-accent' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '2px 8px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {s.coverage === 'full' ? <><BsStarFill size={9} /> Full</> : <><BsCash size={9} /> Partial</>}
                        </span>
                        <div className="scholarship-mini-name">{s.name}</div>
                        {s.amountUsd && <div className="scholarship-mini-amount">Up to ${Number(s.amountUsd).toLocaleString('en-US')}</div>}
                      </Link>
                    ))}
                  </div>
                  {uni.scholarships.length > 4 && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Link to={`/scholarships?university=${slug}`} className="btn btn-ghost btn-sm">View All {uni.scholarships.length} Scholarships →</Link>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No scholarships listed yet. Check the university website for funding opportunities.</p>
              )}
            </div>

            {/* ── 9. REQUIREMENTS ── */}
            <div className="decision-section">
              <h2 className="decision-section-title">Requirements</h2>
              <div className="requirements-grid">
                {[
                  { label: 'Minimum GPA', value: uni.requirements?.minGpa ? `${uni.requirements.minGpa} / 4.0` : 'Not specified' },
                  { label: 'IELTS (minimum)', value: uni.requirements?.minIelts || 'Not specified' },
                  { label: 'TOEFL (minimum)', value: uni.requirements?.minToefl || 'Not specified' },
                  { label: 'GRE', value: uni.requirements?.minGre || 'Not required / Not specified' },
                  { label: 'GMAT', value: uni.requirements?.minGmat || 'Not required / Not specified' },
                ].map(item => (
                  <div key={item.label} className="requirement-row">
                    <span className="requirement-label">{item.label}</span>
                    <span className="requirement-value">{item.value}</span>
                  </div>
                ))}
              </div>
              {uni.applicationPortal && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <a href={uni.applicationPortal} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Apply Now ↗</a>
                </div>
              )}
            </div>

            {/* ── 10. DEADLINES ── */}
            <div className="decision-section">
              <h2 className="decision-section-title">Deadlines — Fall {nextYear}</h2>
              <div className="deadline-grid">
                {deadlines.map(d => (
                  <div key={d.label} className="deadline-row">
                    <span className="deadline-row-label">{d.label}</span>
                    <span className="deadline-row-value">{d.value}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 12, textAlign: 'center' }}>Dates are approximate — verify on the university website</p>
            </div>

            {/* ── 11. BETTER ALTERNATIVES ── */}
            <div className="decision-section">
              <h2 className="decision-section-title">Better Alternatives</h2>
              <div className="coming-soon-card">
                <span className="coming-soon-badge">Coming Soon</span>
                <div className="coming-soon-title">Universities that may fit your profile better</div>
                <p className="coming-soon-desc">We'll compare your profile against similar universities and suggest better-matched alternatives.</p>
              </div>
            </div>

            {/* ── 12. QUESTIONS ── */}
            <div className="decision-section">
              <h2 className="decision-section-title">Questions?</h2>
              <div className="coming-soon-card">
                <span className="coming-soon-badge">Coming Soon</span>
                <div className="coming-soon-title">Ask {uni.name} students</div>
                <p className="coming-soon-desc">Get your questions answered by current students and alumni who've been through the process.</p>
              </div>
            </div>

            {/* ── COUNTRY INFO LINK ── */}
            <div className="decision-section" style={{ borderBottom: 'none' }}>
              <Link to={`/countries/${uni.country?.slug}`} className="card" style={{ padding: 20, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                {uni.country && <img src={`/flags/${uni.country.code.toLowerCase()}.webp`} alt={uni.country.name} style={{ width: '2.5rem' }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700 }}>Study in {uni.country?.name}</p>
                  <p className="text-xs text-muted">Visa requirements, costs, work rights & more</p>
                </div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '1.2rem' }}>→</span>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
