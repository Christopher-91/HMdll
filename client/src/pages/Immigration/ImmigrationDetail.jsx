import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, ShieldCheck, AlertCircle, Clock, Briefcase, FileText, Globe, GraduationCap } from 'lucide-react';
import api from '../../lib/api';
import '../DataPages.css';
import './Immigration.css';

function NewsFeed({ slug, countryName }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/immigration/${slug}/news`)
      .then(res => setNews(res.data.data || []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="immigration-news-feed">
        {[1, 2, 3].map(i => (
          <div key={i} className="card skeleton" style={{ height: '100px' }}></div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="news-empty">
        <Globe size={24} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>No recent immigration news found for {countryName}.</p>
      </div>
    );
  }

  return (
    <div className="immigration-news-feed">
      {news.map((article, idx) => (
        <a key={idx} href={article.url} target="_blank" rel="noopener noreferrer" className="news-card">
          <h4 className="news-title">{article.title}</h4>
          <div className="news-meta">
            <span className="news-domain">{article.domain}</span>
            {article.seendate && (
              <span>
                {new Date(
                  article.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
                ).toLocaleDateString()}
              </span>
            )}
            <ExternalLink size={12} />
          </div>
        </a>
      ))}
    </div>
  );
}

export default function ImmigrationDetail() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('student-visa');

  useEffect(() => {
    setLoading(true);
    api.get(`/immigration/${slug}`)
      .then(res => setProfile(res.data.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="page container">
        <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }}></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2>Profile not found</h2>
        <Link to="/immigration" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Immigration Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="immigration-hero-card" style={{ padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', marginBottom: '2rem', marginTop: '-40px' }}>
        <Link to="/immigration" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Back to Immigration Hub
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <img 
            src={`/flags/${profile.countryCode.toLowerCase()}.webp`} 
            alt={`${profile.countryName} flag`} 
            style={{ width: '120px', height: 'auto', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{profile.countryName}</h1>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Calendar size={16} />
                <span>Verified: {new Date(profile.lastVerifiedDate).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: profile.verificationStatus === 'verified' ? 'var(--accent-500)' : 'var(--warning-500)', fontSize: '0.9rem' }}>
                {profile.verificationStatus === 'verified' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                <span>{profile.verificationStatus === 'verified' ? 'Verified with Official Source' : 'Best Effort / Pending Revalidation'}</span>
              </div>
            </div>

            {profile.officialPortalUrl && (
              <a href={profile.officialPortalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Official Immigration Portal <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-400)' }}>
            <Clock size={32} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Work During Studies</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {profile.workDuringStudies?.allowedHoursPerWeek === 'No limit' 
                ? 'Unlimited' 
                : profile.workDuringStudies?.allowedHoursPerWeek 
                  ? `${profile.workDuringStudies.allowedHoursPerWeek} hrs/week` 
                  : 'Restricted'}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-400)' }}>
            <Briefcase size={32} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Post-Study Work Visa</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {profile.postStudyWork?.durationMaxMonths 
                ? `Up to ${profile.postStudyWork.durationMaxMonths} months` 
                : 'Varies'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Content */}
        <div>
          <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-primary)', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {['student-visa', 'work-rights', 'post-study', 'pr-pathways'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.75rem 0',
                  color: activeTab === tab ? 'var(--primary-400)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--primary-400)' : '2px solid transparent',
                  fontWeight: activeTab === tab ? '600' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'pr-pathways' ? 'PR Pathways' : tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>

          <div className="immigration-tab-content">
            {activeTab === 'student-visa' && profile.studentVisa && (
              <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <FileText size={24} color="var(--primary-400)" />
                  {profile.studentVisa.name || 'Student Visa Information'}
                </h2>
                
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Key Requirements</h3>
                {profile.studentVisa.requirements?.length > 0 ? (
                  <ul className="structured-list" style={{ marginBottom: '2rem' }}>
                    {profile.studentVisa.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Requirements not specified.</p>
                )}

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Financial Proof</h3>
                <div style={{ padding: '1rem', background: 'var(--bg-section-alt)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '2rem' }}>
                  {profile.studentVisa.financialProof || 'Financial requirements vary. Check official sources.'}
                </div>

                {profile.studentVisa.sourceUrl && (
                  <a href={profile.studentVisa.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: '500' }}>
                    Read official guidelines <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}

            {activeTab === 'work-rights' && profile.workDuringStudies && (
              <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <Clock size={24} color="var(--primary-400)" />
                  Working While Studying
                </h2>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Term-time Limit</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    {profile.workDuringStudies.allowedHoursPerWeek === 'No limit' 
                      ? 'No restriction on hours' 
                      : profile.workDuringStudies.allowedHoursPerWeek 
                        ? `Up to ${profile.workDuringStudies.allowedHoursPerWeek} hours per week` 
                        : 'Restricted / See conditions'}
                  </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Holiday Rules</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{profile.workDuringStudies.holidayRules || 'Check official guidelines.'}</p>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Conditions</h3>
                {profile.workDuringStudies.conditions?.length > 0 ? (
                  <ul className="structured-list" style={{ marginBottom: '2rem' }}>
                    {profile.workDuringStudies.conditions.map((cond, idx) => (
                      <li key={idx}>{cond}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Conditions not specified.</p>
                )}

                {profile.workDuringStudies.sourceUrl && (
                  <a href={profile.workDuringStudies.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: '500' }}>
                    Read official guidelines <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}

            {activeTab === 'post-study' && profile.postStudyWork && (
              <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <Briefcase size={24} color="var(--primary-400)" />
                  {profile.postStudyWork.visaName || 'Post-Study Work Options'}
                </h2>
                
                <div style={{ padding: '1rem', background: 'var(--bg-section-alt)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '2rem' }}>
                  {profile.postStudyWork.eligibilitySummary || 'Information varies. Check official sources.'}
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Minimum Duration</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{profile.postStudyWork.durationMinMonths ? `${profile.postStudyWork.durationMinMonths} months` : 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Maximum Duration</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{profile.postStudyWork.durationMaxMonths ? `${profile.postStudyWork.durationMaxMonths} months` : 'N/A'}</div>
                  </div>
                </div>

                {profile.postStudyWork.sourceUrl && (
                  <a href={profile.postStudyWork.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: '500' }}>
                    Read official guidelines <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}

            {activeTab === 'pr-pathways' && profile.prPathways && (
              <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <Globe size={24} color="var(--primary-400)" />
                  Permanent Residency (PR) Pathways
                </h2>
                
                <div style={{ padding: '1.25rem', background: 'var(--bg-section-alt)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem', fontStyle: 'italic' }}>
                  "{profile.prPathways.summary || 'Pathways vary significantly based on individual circumstances.'}"
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Key Requirements & Pathways</h3>
                {profile.prPathways.keyRequirements?.length > 0 ? (
                  <ul className="structured-list" style={{ marginBottom: '2rem' }}>
                    {profile.prPathways.keyRequirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Requirements not specified.</p>
                )}

                {profile.prPathways.sourceUrl && (
                  <a href={profile.prPathways.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: '500' }}>
                    Read official guidelines <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}

            <div className="disclaimer-banner">
              {profile.disclaimer}
            </div>
          </div>
        </div>

        {/* Sidebar / News Feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-primary)' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Live News & Updates</h3>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>GDELT API</span>
          </div>
          <NewsFeed slug={slug} countryName={profile.countryName} />
          
          <div className="card" style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center' }}>
            <GraduationCap size={32} color="var(--primary-400)" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Explore Universities</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Find programs and universities in {profile.countryName} that match your profile.
            </p>
            <Link to="/universities" className="btn btn-outline" style={{ width: '100%' }}>
              Browse Universities
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
