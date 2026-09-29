import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight } from 'lucide-react';
import useShortlist from '../../hooks/useShortlist';
import Logo from '../../components/Logo/Logo';
import api from '../../lib/api';
import '../DataPages.css';

export default function Shortlist() {
  const { shortlist, toggle, count } = useShortlist();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShortlisted = async () => {
      if (shortlist.length === 0) {
        setUniversities([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch all universities and filter client-side by shortlisted IDs
        const res = await api.get('/universities', { params: { limit: 200 } });
        const all = res.data.data || [];
        const saved = all.filter((u) => shortlist.includes(u.id));
        setUniversities(saved);
      } catch {
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShortlisted();
  }, [shortlist]);

  return (
    <div className="page container">
      <div className="page-header">
        <h1 className="page-title">
          <Bookmark style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Your Shortlist
        </h1>
        <p className="page-subtitle">
          Review and compare your saved universities.
          {count > 0 && <span className="text-muted" style={{ marginLeft: 8 }}>({count} saved)</span>}
        </p>
      </div>

      {loading ? (
        <div className="cards-grid stagger-children">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 16 }} />
          ))}
        </div>
      ) : universities.length > 0 ? (
        <div className="cards-grid stagger-children">
          {universities.map((u) => (
            <Link
              key={u.id}
              to={`/universities/${u.slug}`}
              className="uni-card card"
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                className="shortlist-card-btn shortlisted"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(u.id);
                }}
                aria-label="Remove from shortlist"
              >
                <Bookmark size={18} />
              </button>

              <div className="uni-card-header">
                <div className="uni-logo">
                  <Logo website={u.website} name={u.name} slug={u.slug} logoUrl={u.logoUrl} size={48} />
                </div>
                <div className="flex-1">
                  <h3 className="uni-name">{u.name}</h3>
                  <p className="uni-location text-sm text-muted">
                    {u.country && (
                      <img
                        src={`/flags/${u.country.code.toLowerCase()}.webp`}
                        alt={u.country.name}
                        style={{ width: '1.2em', verticalAlign: 'middle', marginRight: '4px' }}
                      />
                    )}{' '}
                    {u.city}, {u.country?.name}
                  </p>
                </div>
              </div>

              <div className="uni-meta">
                {u.qsRanking && (
                  <div className="uni-meta-item">
                    <span className="uni-meta-label">QS Rank</span>
                    <span className="uni-meta-value">#{u.qsRanking}</span>
                  </div>
                )}
                <div className="uni-meta-item">
                  <span className="uni-meta-label">Avg. Tuition</span>
                  <span className="uni-meta-value">
                    ${Number(u.avgTuitionUsd || 0).toLocaleString('en-US')}/yr
                  </span>
                </div>
                <div className="uni-meta-item">
                  <span className="uni-meta-label">Programs</span>
                  <span className="uni-meta-value">{u.programCount || '-'}</span>
                </div>
              </div>

              <div className="uni-tags">
                <span className="badge badge-primary">{u.universityType}</span>
                {u.internationalStudentsPct && (
                  <span className="badge badge-accent">
                    {u.internationalStudentsPct}% International
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="empty-state card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(79, 70, 229, 0.1)',
              color: 'var(--brand-500, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <Bookmark size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No universities saved yet
          </h3>
          <p className="text-muted" style={{ maxWidth: 420, margin: '0 auto 1.5rem' }}>
            Explore global universities and click the bookmark icon to save them here for easy
            comparison.
          </p>
          <Link to="/universities" className="btn btn-primary">
            Browse Universities <ArrowRight size={16} style={{ marginLeft: 6 }} />
          </Link>
        </div>
      )}
    </div>
  );
}
