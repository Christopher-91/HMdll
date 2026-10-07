import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatDegree } from '../../lib/formatters';
import { BsArrowLeft, BsBriefcase, BsGraphUpArrow, BsCashCoin, BsMortarboard, BsListCheck } from 'react-icons/bs';
import {
  FcCommandLine, FcComboChart, FcAndroidOs, FcPrivacy,
  FcEngineering, FcLineChart, FcMoneyTransfer,
  FcMindMap, FcIdea
} from 'react-icons/fc';
import { FaStethoscope } from 'react-icons/fa6';
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

export default function CareerDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/careers/${slug}`)
      .then(res => setCareer(res.data.data))
      .catch(() => navigate('/careers'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="page container">
        <div className="skeleton" style={{ height: 180, borderRadius: 16, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    );
  }

  if (!career) return null;

  return (
    <div className="page">
      <div className="detail-hero" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)', paddingTop: '48px' }}>
        <div className="container">
          <Link to="/careers" className="text-sm text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, textDecoration: 'none' }}>
            <BsArrowLeft /> Back to Careers
          </Link>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ fontSize: '3rem', color: 'var(--primary-400)' }}>{careerIconMap[career.name] || <BsBriefcase />}</div>
            <div>
              <h1 className="detail-title">{career.name}</h1>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                <span className="badge badge-accent" style={{ fontSize: '1rem', padding: '6px 12px' }}>
                  <BsCashCoin style={{ marginRight: 6 }} /> ${(career.avgSalaryUsd / 1000).toFixed(0)}k Avg Salary
                </span>
                <span className={`badge ${career.growthOutlook === 'high' ? 'badge-safe' : 'badge-warning'}`} style={{ fontSize: '1rem', padding: '6px 12px' }}>
                  <BsGraphUpArrow style={{ marginRight: 6 }} /> {career.growthOutlook} Growth
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="career-layout-grid">
          <div className="career-main-content">
            <div className="detail-section">
              <h2 className="career-section-header">About the Role</h2>
              <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{career.description}</p>
            </div>

            <div className="detail-section">
              <h2 className="career-section-header"><BsListCheck /> Required Skills</h2>
              <div className="flex gap-2 flex-wrap">
                {(career.requiredSkills || []).map((skill, idx) => (
                  <span key={idx} className="tag tag-primary" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h2 className="career-section-header"><BsMortarboard /> Recommended Degree Pathways</h2>
              {career.degreeMappings && career.degreeMappings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {career.degreeMappings.map((mapping, idx) => (
                    <div key={idx} className="pathway-card" style={{ borderLeft: mapping.isPrimary ? '4px solid var(--accent-500)' : undefined }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{formatDegree(mapping.degreeType)} in {mapping.field}</h4>
                        {mapping.specialization && <p className="text-muted mt-2">Recommended specialization: <strong>{mapping.specialization}</strong></p>}
                      </div>
                      {mapping.isPrimary && (
                        <div className="pathway-badge-wrapper">
                          <span className="badge badge-accent">Primary Path</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No specific degree pathways recorded yet.</p>
              )}
            </div>

          </div>

          <div className="career-sidebar">
            <div className="career-data-card" style={{ marginBottom: 24 }}>
              <h3 className="career-section-header" style={{ marginBottom: 16, borderBottom: '1px solid var(--border-primary)', paddingBottom: 12 }}>Career Data</h3>

              <div style={{ marginBottom: 16 }}>
                <div className="career-data-header">Typical Industries</div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {(career.typicalIndustries || []).map((ind, idx) => (
                    <span key={idx} className="badge badge-primary">{ind}</span>
                  ))}
                </div>
              </div>

              {career.potentialEmployers && career.potentialEmployers.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="career-data-header">Top Employers</div>
                  <p className="mt-1 font-medium">{career.potentialEmployers.join(', ')}</p>
                </div>
              )}

              {career.recommendedCountries && career.recommendedCountries.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="career-data-header">Best Countries for this Career</div>
                  <p className="mt-1 font-medium">{career.recommendedCountries.join(', ')}</p>
                </div>
              )}
            </div>

            {career.relevantPrograms && career.relevantPrograms.length > 0 && (
              <div className="detail-section">
                <h3 style={{ marginBottom: 16 }}>Top Programs to Prepare You</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {career.relevantPrograms.slice(0, 5).map((p) => (
                    <Link key={p.id} to={`/programs/${p.slug}`} className="card" style={{ padding: 16, textDecoration: 'none', color: 'inherit' }}>
                      <div className="flex justify-between" style={{ alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{p.name}</h4>
                          <p className="text-sm text-muted">{p.university.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <span className="badge badge-primary">{formatDegree(p.degree)}</span>
                        {p.tuitionUsd && <span className="badge bg-secondary">${p.tuitionUsd.toLocaleString('en-US')}/yr</span>}
                      </div>
                    </Link>
                  ))}
                </div>
                {career.relevantPrograms.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Link to="/programs" className="text-primary text-sm font-medium">Browse more programs →</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
