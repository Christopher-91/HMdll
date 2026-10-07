import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { BsBullseye, BsBriefcase, BsGraphUpArrow } from 'react-icons/bs';
import {
  FcCommandLine, FcComboChart, FcAndroidOs, FcPrivacy,
  FcEngineering, FcLineChart, FcMoneyTransfer, FcLike,
  FcMindMap, FcIdea
} from 'react-icons/fc';
import { FaStethoscope } from 'react-icons/fa6';
import '../DataPages.css';

const careerIconMap = {
  'Software Engineer': <FcCommandLine size={36} />,
  'Data Scientist': <FcComboChart size={36} />,
  'Robotics Software Engineer': <FcAndroidOs size={36} />,
  'Cybersecurity Engineer': <FcPrivacy size={36} />,
  'Mechanical Engineer': <FcEngineering size={36} />,
  'Business Analyst': <FcLineChart size={36} />,
  'Financial Analyst': <FcMoneyTransfer size={36} />,
  'Doctor (Physician)': <FaStethoscope size={32} color="#0d9488" />,
  'AI/ML Researcher': <FcMindMap size={36} />,
  'Product Manager': <FcIdea size={36} />,
};

const priority = [
  'AI/ML Researcher',
  'Software Engineer',
  'Data Scientist',
  'Cybersecurity Engineer',
  'Robotics Software Engineer',
  'Mechanical Engineer'
];

export default function Careers() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/careers')
      .then(res => setCareers(res.data.data || []))
      .catch(() => setCareers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page container">
      <div className="page-header">
        <h1 className="page-title"><BsBullseye style={{ verticalAlign: 'middle', marginRight: 8 }} /> Career Explorer</h1>
        <p className="page-subtitle">Start with your dream career — we'll show you the right degree path</p>
      </div>

      {loading ? (
        <div className="cards-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      ) : (
        <div className="cards-grid stagger-children" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
          {[...careers].sort((a, b) => {
            const pA = priority.indexOf(a.name) !== -1 ? priority.indexOf(a.name) : 99;
            const pB = priority.indexOf(b.name) !== -1 ? priority.indexOf(b.name) : 99;
            return pA - pB;
          }).map((c) => (
            <Link key={c.id} to={`/careers/${c.slug}`} className="career-card card">
              <div className="career-icon">{careerIconMap[c.name] || <BsBriefcase size={28} />}</div>
              <div className="career-info">
                <h3 className="career-name">{c.name}</h3>
                <p className="career-desc">{c.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100">
                    ${(c.avgSalaryUsd / 1000).toFixed(0)}k avg salary
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1">
                    <BsGraphUpArrow size={11} /> {c.growthOutlook} growth
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap bg-slate-50 text-slate-700 border-slate-200">
                    {c.pathwayCount} pathways
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
                  {(c.requiredSkills || []).slice(0, 4).map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[11px] font-medium">{s}</span>
                  ))}
                  {(c.requiredSkills || []).length > 4 && (
                    <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[11px] font-medium">+{c.requiredSkills.length - 4}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
