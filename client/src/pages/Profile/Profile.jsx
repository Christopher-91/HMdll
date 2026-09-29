import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { BsLightbulb, BsAsterisk } from 'react-icons/bs';
import './Profile.css';

const COUNTRIES = [
  'Australia', 'Canada', 'China', 'France', 'Germany', 'India', 'Japan', 'Netherlands',
  'New Zealand', 'Singapore', 'South Korea', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Other',
];
const EDUCATION_LEVELS = [
  { value: 'high_school', label: 'High School / Secondary' },
  { value: 'class_11', label: 'Class 11' },
  { value: 'class_12', label: 'Class 12 / HSC / A-Levels' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'professional', label: 'Professional Degree (MD, JD, etc.)' },
];
const DESIRED_DEGREES = [
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'mba', label: 'MBA' },
  { value: 'diploma', label: 'Diploma / Certificate' },
];
const STUDY_FIELDS = [
  'Computer Science', 'Engineering', 'Business & Management', 'Medicine & Health Sciences',
  'Law', 'Architecture', 'Arts & Design', 'Social Sciences', 'Natural Sciences',
  'Mathematics & Statistics', 'Education', 'Economics', 'Psychology', 'Environmental Studies',
  'Data Science & AI', 'Finance', 'Marketing', 'Information Technology', 'Biotechnology', 'Other',
];
const TESTS = ['IELTS', 'TOEFL', 'GRE', 'GMAT', 'SAT', 'Duolingo English Test'];

const NATIONALITIES = [
  'Afghan', 'Australian', 'Austrian', 'Bangladeshi', 'Belgian', 'Brazilian', 'British',
  'Canadian', 'Chinese', 'Danish', 'Dutch', 'Egyptian', 'Emirati', 'Ethiopian',
  'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Indian', 'Indonesian', 'Iranian',
  'Iraqi', 'Irish', 'Israeli', 'Italian', 'Japanese', 'Jordanian', 'Kenyan', 'Korean',
  'Lebanese', 'Malaysian', 'Mexican', 'Moroccan', 'Nepali', 'New Zealander', 'Nigerian',
  'Norwegian', 'Pakistani', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Saudi',
  'Singaporean', 'South African', 'Spanish', 'Sri Lankan', 'Swedish', 'Swiss', 'Taiwanese',
  'Thai', 'Turkish', 'Ukrainian', 'American', 'Vietnamese', 'Other',
];

const LANGUAGES = [
  'English', 'French', 'German', 'Spanish', 'Mandarin', 'Arabic', 'Hindi', 'Portuguese',
  'Russian', 'Japanese', 'Korean', 'Italian', 'Dutch', 'Other',
];

const CAREER_GOALS = [
  'Software Engineer', 'Data Scientist', 'AI/ML Engineer', 'Product Manager',
  'Business Analyst', 'Management Consultant', 'Investment Banker', 'Financial Analyst',
  'Doctor / Physician', 'Research Scientist', 'Academic / Professor', 'Lawyer',
  'Architect', 'UX Designer', 'Marketing Manager', 'Entrepreneur',
  'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Biomedical Engineer',
  'Nurse / Healthcare Professional', 'Public Policy Analyst', 'Journalist / Writer', 'Other',
];

const normalizeGpaScale = (val) => {
  if (!val) return '4.0';
  const num = parseFloat(val);
  if (num === 10) return '10.0';
  if (num === 5) return '5.0';
  if (num === 4) return '4.0';
  if (num === 100) return '100';
  return '4.0';
};

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [academic, setAcademic] = useState({
    currentEducationLevel: '', schoolUniversity: '', currentDegree: '', currentMajor: '',
    graduationYear: '', gpa: '', gpaScale: '4.0', class10Percentage: '', class12Percentage: '',
    bachelorsPercentage: '', bachelorsCgpa: '',
  });
  const [preferences, setPreferences] = useState({
    desiredDegree: '', desiredField: '', desiredSpecialization: '', preferredCountries: [],
    budgetMin: '', budgetMax: '', budgetCurrency: 'USD', preferredIntake: '',
  });
  const [testScores, setTestScores] = useState([]);
  const [newScore, setNewScore] = useState({ testName: '', overallScore: '', testDate: '' });
  const [personal, setPersonal] = useState({
    nationality: '', countryOfResidence: '', dateOfBirth: '', preferredLanguage: '', phone: '',
  });
  const [careerGoal, setCareerGoal] = useState('');

  useEffect(() => {
    api.get('/users/me')
      .then(res => {
        const d = res.data.data;
        setProfileData(d);
        if (d.academic) {
          setAcademic({
            currentEducationLevel: d.academic.currentEducationLevel || '',
            schoolUniversity: d.academic.schoolUniversity || '',
            currentDegree: d.academic.currentDegree || '',
            currentMajor: d.academic.currentMajor || '',
            graduationYear: d.academic.graduationYear || '',
            gpa: d.academic.gpa || '',
            gpaScale: normalizeGpaScale(d.academic.gpaScale),
            class10Percentage: d.academic.class10Percentage || '',
            class12Percentage: d.academic.class12Percentage || '',
            bachelorsPercentage: d.academic.bachelorsPercentage || '',
            bachelorsCgpa: d.academic.bachelorsCgpa || '',
          });
        }
        if (d.preferences) {
          setPreferences({
            desiredDegree: d.preferences.desiredDegree || '',
            desiredField: d.preferences.desiredField || '',
            desiredSpecialization: d.preferences.desiredSpecialization || '',
            preferredCountries: d.preferences.preferredCountries || [],
            budgetMin: d.preferences.budgetMin || '',
            budgetMax: d.preferences.budgetMax || '',
            budgetCurrency: d.preferences.budgetCurrency || 'USD',
            preferredIntake: d.preferences.preferredIntake || '',
          });
        }
        if (d.testScores) setTestScores(d.testScores);
        if (d.personal) {
          setPersonal({
            nationality: d.personal.nationality || '',
            countryOfResidence: d.personal.countryOfResidence || '',
            dateOfBirth: d.personal.dateOfBirth ? d.personal.dateOfBirth.split('T')[0] : '',
            preferredLanguage: d.personal.preferredLanguage || '',
            phone: d.personal.phone || '',
          });
        }
        if (d.careerGoals?.length > 0) {
          setCareerGoal(d.careerGoals[0].careerName || d.careerGoals[0].customCareer || '');
        }
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveAcademic = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', {
        academic: {
          currentEducationLevel: academic.currentEducationLevel || undefined,
          schoolUniversity: academic.schoolUniversity || undefined,
          currentDegree: academic.currentDegree || undefined,
          currentMajor: academic.currentMajor || undefined,
          graduationYear: academic.graduationYear ? parseInt(academic.graduationYear) : undefined,
          gpa: academic.gpa ? parseFloat(academic.gpa) : undefined,
          gpaScale: academic.gpaScale ? parseFloat(academic.gpaScale) : undefined,
          class10Percentage: academic.class10Percentage ? parseFloat(academic.class10Percentage) : undefined,
          class12Percentage: academic.class12Percentage ? parseFloat(academic.class12Percentage) : undefined,
          bachelorsPercentage: academic.bachelorsPercentage ? parseFloat(academic.bachelorsPercentage) : undefined,
          bachelorsCgpa: academic.bachelorsCgpa ? parseFloat(academic.bachelorsCgpa) : undefined,
        },
      });
      // Update local profile data so completion ring refreshes
      if (res.data?.data) setProfileData(res.data.data);
      await refreshProfile();
      toast.success('Academic info saved!');
    } catch (err) {
      console.error('Save academic error:', err.response?.data || err.message);
      toast.error('Failed to save. Please try again.');
    }
    finally { setSaving(false); }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', {
        preferences: {
          desiredDegree: preferences.desiredDegree || undefined,
          desiredField: preferences.desiredField || undefined,
          desiredSpecialization: preferences.desiredSpecialization || undefined,
          preferredCountries: preferences.preferredCountries.length > 0 ? preferences.preferredCountries : undefined,
          budgetMin: preferences.budgetMin ? parseInt(preferences.budgetMin) : undefined,
          budgetMax: preferences.budgetMax ? parseInt(preferences.budgetMax) : undefined,
          budgetCurrency: preferences.budgetCurrency || undefined,
          preferredIntake: preferences.preferredIntake || undefined,
        },
      });
      if (res.data?.data) setProfileData(res.data.data);
      await refreshProfile();
      toast.success('Study preferences saved!');
    } catch (err) {
      console.error('Save preferences error:', err.response?.data || err.message);
      toast.error('Failed to save. Please try again.');
    }
    finally { setSaving(false); }
  };

  const handleAddScore = async () => {
    if (!newScore.testName || !newScore.overallScore) { toast.error('Please enter test name and score'); return; }
    setSaving(true);
    try {
      const allScores = [
        ...testScores.map(s => ({ testName: s.testName, overallScore: s.overallScore, testDate: s.testDate, expiryDate: s.expiryDate })),
        { testName: newScore.testName, overallScore: parseFloat(newScore.overallScore), testDate: newScore.testDate || null },
      ];
      await api.put('/users/me/test-scores', { scores: allScores });
      const res = await api.get('/users/me');
      setTestScores(res.data.data.testScores || []);
      await refreshProfile();
      setNewScore({ testName: '', overallScore: '', testDate: '' });
      toast.success('Test score added!');
    } catch { toast.error('Failed to save score.'); }
    finally { setSaving(false); }
  };

  const handleRemoveScore = async (scoreId) => {
    setSaving(true);
    try {
      const remaining = testScores.filter(s => s.id !== scoreId).map(s => ({ testName: s.testName, overallScore: s.overallScore, testDate: s.testDate, expiryDate: s.expiryDate }));
      await api.put('/users/me/test-scores', { scores: remaining });
      setTestScores(prev => prev.filter(s => s.id !== scoreId));
      await refreshProfile();
      toast.success('Score removed');
    } catch { toast.error('Failed to remove score.'); }
    finally { setSaving(false); }
  };

  const toggleCountry = (country) => {
    setPreferences(prev => ({
      ...prev,
      preferredCountries: prev.preferredCountries.includes(country)
        ? prev.preferredCountries.filter(c => c !== country)
        : [...prev.preferredCountries, country],
    }));
  };

  const completionPct = profileData?.profileCompletion || 0;

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', {
        personal: {
          nationality: personal.nationality || undefined,
          countryOfResidence: personal.countryOfResidence || undefined,
          dateOfBirth: personal.dateOfBirth || undefined,
          preferredLanguage: personal.preferredLanguage || undefined,
          phone: personal.phone || undefined,
        },
      });

      // Save career goal if filled
      if (careerGoal) {
        await api.put('/users/me/career-goals', {
          goals: [{ customCareer: careerGoal, isPrimary: true }],
        });
      }

      // Re-fetch to get updated completion %
      const fresh = await api.get('/users/me');
      if (fresh.data?.data) setProfileData(fresh.data.data);
      await refreshProfile();
      toast.success('Personal info saved!');
    } catch (err) {
      console.error('Save personal error:', err.response?.data || err.message);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <div className="skeleton" style={{ height: 80, borderRadius: 16, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    );
  }

  const TABS = [
    { key: 'personal', label: 'Personal' },
    { key: 'academic', label: 'Academic' },
    { key: 'preferences', label: 'Study Goals' },
    { key: 'tests', label: 'Test Scores' },
  ];

  return (
    <div className="page container">
      <div className="profile-header animate-fadeInUp">
        <div className="profile-header-left">
          <div className="profile-avatar">
            {user?.firstName?.[0]?.toUpperCase() || 'U'}{user?.lastName?.[0]?.toUpperCase() || ''}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>{user?.firstName} {user?.lastName}</h1>
            <p className="text-muted">{user?.email}</p>
          </div>
        </div>
        <div className="profile-completion-ring">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-secondary)" strokeWidth="7" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--primary-400)" strokeWidth="7"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - completionPct / 100)}`}
              strokeLinecap="round" transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            <text x="40" y="44" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="700">
              {completionPct}%
            </text>
          </svg>
          <div className="profile-completion-label">Profile Complete</div>
        </div>
      </div>

      <div className="profile-info-banner animate-fadeInUp">
        <BsLightbulb style={{ verticalAlign: 'middle' }} />
        <span>A complete profile unlocks personalized <strong>university match scores</strong> on every university page. Fill in your GPA, budget, and desired field to see your match.</span>
      </div>

      <div className="profile-tabs animate-fadeInUp">
        {TABS.map(tab => (
          <button key={tab.key} className={`profile-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'personal' && (
        <div className="profile-card animate-fadeInUp">
          <h2 className="profile-section-title">Personal Information</h2>
          <p className="profile-section-desc">These fields count toward your profile completion score and help us personalise your experience.</p>
          <div className="profile-form-grid">
            <div className="form-group">
              <label className="form-label">Nationality <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <select className="form-input" value={personal.nationality} onChange={e => setPersonal(p => ({ ...p, nationality: e.target.value }))}>
                <option value="">Select nationality...</option>
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Country of Residence <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <select className="form-input" value={personal.countryOfResidence} onChange={e => setPersonal(p => ({ ...p, countryOfResidence: e.target.value }))}>
                <option value="">Select country...</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <input className="form-input" type="date" value={personal.dateOfBirth} onChange={e => setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Language <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <select className="form-input" value={personal.preferredLanguage} onChange={e => setPersonal(p => ({ ...p, preferredLanguage: e.target.value }))}>
                <option value="">Select language...</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <input className="form-input" type="tel" placeholder="e.g. +91 98765 43210" value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Career Goal <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <select className="form-input" value={careerGoal} onChange={e => setCareerGoal(e.target.value)}>
                <option value="">Select your goal career...</option>
                {CAREER_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSavePersonal} disabled={saving}>
            {saving ? 'Saving…' : 'Save Personal Info →'}
          </button>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="profile-card animate-fadeInUp">
          <h2 className="profile-section-title">Academic Background</h2>
          <p className="profile-section-desc">Your GPA and education level are used to calculate your match score with universities.</p>
          <div className="profile-form-grid">
            <div className="form-group">
              <label className="form-label">Current Education Level</label>
              <select className="form-input" value={academic.currentEducationLevel} onChange={e => setAcademic(p => ({ ...p, currentEducationLevel: e.target.value }))}>
                <option value="">Select level...</option>
                {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Class 10 % (if applicable)</label>
              <input className="form-input" type="number" placeholder="e.g. 92" min="0" max="100" value={academic.class10Percentage} onChange={e => setAcademic(p => ({ ...p, class10Percentage: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Class 12 HSC %</label>
              <input className="form-input" type="number" placeholder="e.g. 88" min="0" max="100" value={academic.class12Percentage} onChange={e => setAcademic(p => ({ ...p, class12Percentage: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">School / University Name</label>
              <input className="form-input" placeholder="e.g. Delhi University" value={academic.schoolUniversity} onChange={e => setAcademic(p => ({ ...p, schoolUniversity: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Current / Most Recent Degree</label>
              <input className="form-input" placeholder="e.g. Bachelor of Technology" value={academic.currentDegree} onChange={e => setAcademic(p => ({ ...p, currentDegree: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Major / Field of Study</label>
              <input className="form-input" placeholder="e.g. Computer Science" value={academic.currentMajor} onChange={e => setAcademic(p => ({ ...p, currentMajor: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Graduation Year</label>
              <input className="form-input" type="number" placeholder="e.g. 2025" min="2000" max="2030" value={academic.graduationYear} onChange={e => setAcademic(p => ({ ...p, graduationYear: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">GPA / CGPA <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="form-input" type="number" step="0.01" placeholder="e.g. 3.7" value={academic.gpa} onChange={e => setAcademic(p => ({ ...p, gpa: e.target.value }))} style={{ flex: 2 }} />
                <select className="form-input" value={academic.gpaScale} onChange={e => setAcademic(p => ({ ...p, gpaScale: e.target.value }))} style={{ flex: 1 }}>
                  <option value="4.0">/ 4.0</option>
                  <option value="5.0">/ 5.0</option>
                  <option value="10.0">/ 10.0</option>
                  <option value="100">/ 100%</option>
                </select>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSaveAcademic} disabled={saving}>
            {saving ? 'Saving…' : 'Save Academic Info →'}
          </button>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="profile-card animate-fadeInUp">
          <h2 className="profile-section-title">Study Goals & Preferences</h2>
          <p className="profile-section-desc">Your desired field and budget directly power the university match score.</p>
          <div className="profile-form-grid">
            <div className="form-group">
              <label className="form-label">Desired Degree <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <select className="form-input" value={preferences.desiredDegree} onChange={e => setPreferences(p => ({ ...p, desiredDegree: e.target.value }))}>
                <option value="">Select degree...</option>
                {DESIRED_DEGREES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Desired Field of Study <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <select className="form-input" value={preferences.desiredField} onChange={e => setPreferences(p => ({ ...p, desiredField: e.target.value }))}>
                <option value="">Select field...</option>
                {STUDY_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Specialization (optional)</label>
              <input className="form-input" placeholder="e.g. Machine Learning, Corporate Finance..." value={preferences.desiredSpecialization} onChange={e => setPreferences(p => ({ ...p, desiredSpecialization: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Annual Budget (Min) <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="form-input" value={preferences.budgetCurrency} onChange={e => setPreferences(p => ({ ...p, budgetCurrency: e.target.value }))} style={{ flex: 1 }}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AUD">AUD</option>
                  <option value="INR">INR</option>
                </select>
                <input className="form-input" type="number" placeholder="e.g. 10000" value={preferences.budgetMin} onChange={e => setPreferences(p => ({ ...p, budgetMin: e.target.value }))} style={{ flex: 2 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Annual Budget (Max) <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
              <input className="form-input" type="number" placeholder="e.g. 50000" value={preferences.budgetMax} onChange={e => setPreferences(p => ({ ...p, budgetMax: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Intake</label>
              <select className="form-input" value={preferences.preferredIntake} onChange={e => setPreferences(p => ({ ...p, preferredIntake: e.target.value }))}>
                <option value="">Any intake</option>
                <option value="fall">Fall / Semester 1</option>
                <option value="spring">Spring / Semester 2</option>
                <option value="summer">Summer</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="form-label">Preferred Countries (select all that apply)</label>
            <div className="country-chips">
              {COUNTRIES.map(c => (
                <button key={c} type="button" className={`country-chip ${preferences.preferredCountries.includes(c) ? 'selected' : ''}`} onClick={() => toggleCountry(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSavePreferences} disabled={saving} style={{ marginTop: 24 }}>
            {saving ? 'Saving…' : 'Save Preferences →'}
          </button>
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="profile-card animate-fadeInUp">
          <h2 className="profile-section-title">Test Scores</h2>
          <p className="profile-section-desc">Add your English proficiency and standardized test scores. These are used to check university requirements.</p>
          {testScores.length > 0 && (
            <div className="scores-list">
              {testScores.map(score => (
                <div key={score.id} className="score-row">
                  <div className="score-row-left">
                    <span className="score-badge">{score.testName}</span>
                    <span className="score-value">{score.overallScore}</span>
                    {score.testDate && <span className="score-date">{new Date(score.testDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', fontSize: '0.8rem' }} onClick={() => handleRemoveScore(score.id)} disabled={saving}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="add-score-form">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Add a Test Score</h3>
            <div className="profile-form-grid">
              <div className="form-group">
                <label className="form-label">Test Name <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
                <select className="form-input" value={newScore.testName} onChange={e => setNewScore(p => ({ ...p, testName: e.target.value }))}>
                  <option value="">Select test...</option>
                  {TESTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Overall Score <BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /></label>
                <input className="form-input" type="number" step="0.5" placeholder="e.g. 7.5 (IELTS), 110 (TOEFL)" value={newScore.overallScore} onChange={e => setNewScore(p => ({ ...p, overallScore: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Test Date (optional)</label>
                <input className="form-input" type="date" value={newScore.testDate} onChange={e => setNewScore(p => ({ ...p, testDate: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAddScore} disabled={saving}>
              {saving ? 'Saving…' : '+ Add Score'}
            </button>
          </div>
          <div className="score-hint">
            <strong><BsLightbulb style={{ verticalAlign: 'middle', marginRight: 4 }} /> Tips:</strong>
            <ul>
              <li>IELTS: scored 0–9 (most universities require 6.0–7.5)</li>
              <li>TOEFL iBT: scored 0–120 (most universities require 80–100)</li>
              <li>GRE: scored 260–340</li>
              <li>GMAT: scored 200–800</li>
            </ul>
          </div>
        </div>
      )}

      <div className="profile-footer animate-fadeInUp">
        <p className="text-muted" style={{ fontSize: '0.9rem' }}><BsAsterisk size={9} style={{ verticalAlign: 'middle', color: 'var(--primary-400)' }} /> Fields marked with a star directly affect your university match score.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/universities')}>← Browse Universities</button>
      </div>
    </div>
  );
}
