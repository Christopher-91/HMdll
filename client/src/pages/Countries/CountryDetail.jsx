import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  BsBank2, BsCurrencyDollar, BsStarFill, BsCash, BsClock,
  BsPassport, BsBriefcase, BsRocketTakeoff, BsChatDots, BsLightningCharge,
} from 'react-icons/bs';
import '../DataPages.css';

export default function CountryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get(`/countries/${slug}`)
      .then(res => setCountry(res.data.data))
      .catch(() => navigate('/countries'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="page container">
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    );
  }

  if (!country) return null;

  const tabs = ['overview', 'universities', 'scholarships', 'visa & work'];

  return (
    <div className="page">
      {/* Hero */}
      <div className="detail-hero" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="container">
          <Link to="/countries" className="text-sm text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, textDecoration: 'none' }}>
            ← Back to Countries
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <img src={`/flags/${country.code.toLowerCase()}.webp`} alt={country.name} style={{ width: '4rem', display: 'block', marginBottom: '1rem' }} />
            <div>
              <h1 className="detail-title">{country.name}</h1>
              <p className="detail-subtitle">{country.continent}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {country.general?.officialLanguages?.map((l, i) => (
                  <span key={i} className="badge">{l}</span>
                ))}
                {country.visa?.postStudyWorkDuration && (
                  <span className="badge badge-accent">{country.visa.postStudyWorkDuration} post-study work</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Universities', value: country.universities?.length || 0 },
              { label: 'Avg. Tuition', value: `$${((country.costs?.avgTuitionMinUsd || 0) / 1000).toFixed(0)}k–$${((country.costs?.avgTuitionMaxUsd || 0) / 1000).toFixed(0)}k/yr` },
              { label: 'Avg. Living Cost', value: country.costs?.avgLivingCostUsd ? `$${country.costs.avgLivingCostUsd.toLocaleString('en-US')}/mo` : 'N/A' },
              { label: 'Work Hours', value: country.visa?.workHoursPerWeek ? `${country.visa.workHoursPerWeek}hrs/wk` : 'N/A' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-300)', marginTop: 2 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)', position: 'sticky', top: 60, zIndex: 10 }}>
        <div className="container" style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === t ? '2px solid var(--primary-400)' : '2px solid transparent',
                color: activeTab === t ? 'var(--primary-300)' : 'var(--text-secondary)',
                fontWeight: activeTab === t ? 700 : 500,
                fontSize: '0.875rem', textTransform: 'capitalize', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>

        {activeTab === 'overview' && (
          <div className="detail-content">
            <div>
              {country.description && (
                <div className="detail-section">
                  <h2 className="detail-section-title">About Studying Here</h2>
                  <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{country.description}</p>
                </div>
              )}

              {country.education?.educationSystem && (
                <div className="detail-section">
                  <h2 className="detail-section-title">Education System</h2>
                  <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{country.education.educationSystem}</p>
                  {country.education.academicCalendar && (
                    <div className="card" style={{ padding: 16, marginTop: 16 }}>
                      <p className="text-xs text-muted font-semibold mb-1">ACADEMIC CALENDAR</p>
                      <p style={{ fontWeight: 600 }}>{country.education.academicCalendar}</p>
                    </div>
                  )}
                </div>
              )}

              {country.education?.popularDegrees?.length > 0 && (
                <div className="detail-section">
                  <h2 className="detail-section-title">Popular Fields of Study</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {country.education.popularDegrees.map((d, i) => (
                      <span key={i} className="tag">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {country.general?.applicationProcess && (
                <div className="detail-section">
                  <h2 className="detail-section-title">How to Apply</h2>
                  <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{country.general.applicationProcess}</p>
                </div>
              )}

              {country.general?.popularStudentCities?.length > 0 && (
                <div className="detail-section">
                  <h2 className="detail-section-title">Popular Student Cities</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {country.general.popularStudentCities.map((city, i) => (
                      <span key={i} className="badge">{city}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="detail-sidebar">
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Cost Overview</h3>
                {[
                  { label: 'Tuition Range', value: `$${((country.costs?.avgTuitionMinUsd || 0) / 1000).toFixed(0)}k–$${((country.costs?.avgTuitionMaxUsd || 0) / 1000).toFixed(0)}k/yr` },
                  { label: 'Avg. Living Cost', value: country.costs?.avgLivingCostUsd ? `$${country.costs.avgLivingCostUsd.toLocaleString('en-US')}/mo` : '-' },
                  { label: 'Avg. Rent', value: country.costs?.avgRentUsd ? `$${country.costs.avgRentUsd.toLocaleString('en-US')}/mo` : '-' },
                  { label: 'Currency', value: country.costs?.currency || '-' },
                  { label: 'Visa Cost', value: country.visa?.visaCostUsd ? `$${country.visa.visaCostUsd}` : '-' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
                <Link to="/calculator" className="btn btn-primary w-full" style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>
                  Calculate Full Cost
                </Link>
              </div>

              {country.general?.employmentEnvironment && (
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.95rem' }}>Employment Environment</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{country.general.employmentEnvironment}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'universities' && (
          <div>
            <h2 className="detail-section-title" style={{ marginBottom: 24 }}>
              <BsBank2 style={{ verticalAlign: 'middle', marginRight: 8 }} /> Universities in {country.name} ({country.universities?.length || 0})
            </h2>
            {country.universities?.length > 0 ? (
              <div className="cards-grid">
                {country.universities.map(u => (
                  <Link key={u.id} to={`/universities/${u.slug}`} className="uni-card card">
                    <div className="uni-card-header">
                      <div className="uni-logo">
                        {u.logoUrl ? <img src={u.logoUrl} alt={u.name} /> : <span className="uni-logo-placeholder">{u.name[0]}</span>}
                      </div>
                      <div className="flex-1">
                        <h3 className="uni-name">{u.name}</h3>
                        <p className="uni-location text-sm text-muted">{u.city}</p>
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
                        <span className="uni-meta-value">${(u.avgTuitionUsd || 0).toLocaleString('en-US')}/yr</span>
                      </div>
                      <div className="uni-meta-item">
                        <span className="uni-meta-label">Programs</span>
                        <span className="uni-meta-value">{u.programCount || '-'}</span>
                      </div>
                    </div>
                    <div className="uni-tags">
                      <span className="badge badge-primary">{u.universityType}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state card" style={{ padding: 64, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}><BsBank2 /></div>
                <p className="font-semibold">No universities listed yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scholarships' && (
          <div>
            <h2 className="detail-section-title" style={{ marginBottom: 24 }}>
              <BsCurrencyDollar style={{ verticalAlign: 'middle', marginRight: 6 }} /> Scholarships in {country.name} ({country.scholarships?.length || 0})
            </h2>
            {country.scholarships?.length > 0 ? (
              <div className="cards-grid">
                {country.scholarships.map(s => (
                  <Link key={s.id} to={`/scholarships/${s.slug}`} className="scholarship-card card">
                    <span className={`badge ${s.coverage === 'full' ? 'badge-accent' : 'badge-warning'}`}>
                      {s.coverage === 'full'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><BsStarFill size={10} /> Full Scholarship</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><BsCash size={10} /> Partial</span>
                      }
                    </span>
                    <h3 className="program-name">{s.name}</h3>
                    {s.amount_usd && <div className="scholarship-amount">Up to ${Number(s.amount_usd).toLocaleString('en-US')}</div>}
                    {s.deadline && (
                      <p className="text-xs text-muted"><BsClock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Deadline: {new Date(s.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state card" style={{ padding: 64, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}><BsCurrencyDollar /></div>
                <p className="font-semibold">No scholarships listed for this country yet</p>
                <p className="text-sm text-muted mt-1">Browse all scholarships</p>
                <Link to="/scholarships" className="btn btn-primary" style={{ marginTop: 16 }}>View All Scholarships</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'visa & work' && (
          <div className="detail-content">
            <div>
              {country.visa?.studentVisaInfo && (
                <div className="detail-section">
                  <h2 className="detail-section-title"><BsPassport style={{ verticalAlign: 'middle', marginRight: 8 }} /> Student Visa Information</h2>
                  <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{country.visa.studentVisaInfo}</p>
                </div>
              )}

              {country.visa?.studentWorkRights && (
                <div className="detail-section">
                  <h2 className="detail-section-title"><BsBriefcase style={{ verticalAlign: 'middle', marginRight: 8 }} /> Work Rights During Study</h2>
                  <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{country.visa.studentWorkRights}</p>
                </div>
              )}

              {country.visa?.postStudyWork && (
                <div className="detail-section">
                  <h2 className="detail-section-title"><BsRocketTakeoff style={{ verticalAlign: 'middle', marginRight: 8 }} /> Post-Study Work Options</h2>
                  <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{country.visa.postStudyWork}</p>
                </div>
              )}

              {country.general?.languageRequirements && (
                <div className="detail-section">
                  <h2 className="detail-section-title"><BsChatDots style={{ verticalAlign: 'middle', marginRight: 8 }} /> Language Requirements</h2>
                  <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{country.general.languageRequirements}</p>
                </div>
              )}
            </div>

            <div className="detail-sidebar">
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}><BsLightningCharge /> Quick Facts</h3>
                {[
                  { label: 'Visa Cost', value: country.visa?.visaCostUsd ? `$${country.visa.visaCostUsd}` : '-' },
                  { label: 'Work Hours/Week', value: country.visa?.workHoursPerWeek ? `${country.visa.workHoursPerWeek} hrs` : '-' },
                  { label: 'Post-Study Work', value: country.visa?.postStudyWorkDuration || '-' },
                  { label: 'Official Languages', value: (country.general?.officialLanguages || []).join(', ') || '-' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
