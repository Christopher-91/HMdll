import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import Logo from '../../components/Logo/Logo';
import { BsBank2, BsSearch } from 'react-icons/bs';
import { Bookmark } from 'lucide-react';
import useShortlist from '../../hooks/useShortlist';
import '../DataPages.css';

export default function Universities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [universities, setUniversities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [institutionType, setInstitutionType] = useState(searchParams.get('institutionType') || '');
  const [distinction, setDistinction] = useState(searchParams.get('distinction') || '');
  const { toggle, isShortlisted } = useShortlist();

  const eurCountries = ['germany', 'austria', 'finland', 'norway', 'sweden', 'switzerland', 'netherlands', 'ireland', 'denmark', 'france', 'portugal', 'estonia', 'belgium'];
  const showInstitutionType = eurCountries.includes(country);

  const eliteMap = {
    'united-states': ['Ivy League'],
    'united-kingdom': ['Russell Group'],
    'germany': ['TU9'],
    'china': ['C9'],
    'australia': ['Go8', 'ATN', 'IRU'],
    'japan': ['RU11'],
    'france': ['Grandes Écoles'],
    'netherlands': ['4TU'],
    'switzerland': ['ETH Domain'],
    'canada': ['U15']
  };
  const activeDistinctions = eliteMap[country];

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { limit: 50, sort: 'ranking' };
      if (search) params.search = search;
      if (country) params.country = country;
      if (type) params.type = type;
      if (institutionType) params.institutionType = institutionType;
      if (distinction) params.distinction = distinction;
      const res = await api.get('/universities', { params });
      setUniversities(res.data.data || []);
      setTotal(res.data.meta?.pagination?.total || 0);
    } catch {
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [country, type, institutionType, distinction]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (country) params.set('country', country);
    if (type) params.set('type', type);
    if (institutionType) params.set('institutionType', institutionType);
    if (distinction) params.set('distinction', distinction);
    setSearchParams(params, { replace: true });
  }, [search, country, type, institutionType, distinction, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="page container">
      <div className="page-header">
        <h1 className="page-title"><BsBank2 style={{ verticalAlign: 'middle', marginRight: 8 }} /> Explore Universities</h1>
        <p className="page-subtitle">Discover world-class institutions across 25+ countries</p>
      </div>

      {/* Filters */}
      <div className="filters-bar animate-fadeInUp">
        <form onSubmit={handleSearch} className="search-bar" style={{ maxWidth: 400 }}>
          <span className="search-icon"><BsSearch /></span>
          <input
            type="text"
            placeholder="Search universities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <select className="form-input filter-select" value={country} onChange={(e) => {
          setCountry(e.target.value);
          if (!eurCountries.includes(e.target.value)) setInstitutionType('');
          setDistinction('');
        }}>
          <option value="">All Countries</option>
          <option value="united-states">United States</option>
          <option value="united-kingdom">United Kingdom</option>
          <option value="china">China</option>
          <option value="australia">Australia</option>
          <option value="germany">Germany</option>
          <option value="new-zealand">New Zealand</option>
          <option value="netherlands">Netherlands</option>
          <option value="ireland">Ireland</option>
          <option value="canada">Canada</option>
          <option value="denmark">Denmark</option>
          <option value="finland">Finland</option>
          <option value="sweden">Sweden</option>
          <option value="norway">Norway</option>
          <option value="japan">Japan</option>
          <option value="south-korea">South Korea</option>
          <option value="france">France</option>
          <option value="switzerland">Switzerland</option>
          <option value="singapore">Singapore</option>
          <option value="uae">UAE</option>
          <option value="luxembourg">Luxembourg</option>
          <option value="italy">Italy</option>
          <option value="belgium">Belgium</option>
          <option value="austria">Austria</option>
          <option value="russia">Russia</option>
          <option value="spain">Spain</option>
          <option value="malaysia">Malaysia</option>
          <option value="portugal">Portugal</option>
          <option value="poland">Poland</option>
        </select>

        <select className="form-input filter-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        {showInstitutionType && (
          <select className="form-input filter-select" value={institutionType} onChange={(e) => setInstitutionType(e.target.value)}>
            <option value="">All Institutions</option>
            <option value="research_oriented">Research-oriented</option>
            <option value="industry_oriented">Industry-oriented</option>
          </select>
        )}

        {activeDistinctions && (
          <select className="form-input filter-select" value={distinction} onChange={(e) => setDistinction(e.target.value)}>
            <option value="">Distinctions</option>
            {activeDistinctions.map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        )}

        <span className="filter-count text-sm text-muted">{total} universities found</span>
      </div>

      {/* Results */}
      {loading ? (
        <div className="cards-grid stagger-children">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 16 }} />
          ))}
        </div>
      ) : universities.length > 0 ? (
        <div className="cards-grid stagger-children">
          {universities.map((u) => (
            <Link key={u.id} to={`/universities/${u.slug}`} state={{ fromParams: searchParams.toString() }} className="uni-card card" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`shortlist-card-btn ${isShortlisted(u.id) ? 'shortlisted' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(u.id);
                }}
                aria-label={isShortlisted(u.id) ? 'Remove from shortlist' : 'Add to shortlist'}
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
                    {u.country && <img src={`/flags/${u.country.code.toLowerCase()}.webp`} alt={u.country.name} style={{ width: '1.2em', verticalAlign: 'middle', marginRight: '4px' }} />} {u.city}, {u.country?.name}
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
                  <span className="uni-meta-value">${Number(u.avgTuitionUsd || 0).toLocaleString('en-US')}/yr</span>
                </div>
                <div className="uni-meta-item">
                  <span className="uni-meta-label">Programs</span>
                  <span className="uni-meta-value">{u.programCount || '-'}</span>
                </div>
              </div>

              <div className="uni-tags">
                <span className="badge badge-primary">{u.universityType}</span>
                {u.internationalStudentsPct && (
                  <span className="badge badge-accent">{u.internationalStudentsPct}% International</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state card" style={{ padding: 64 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}><BsSearch /></div>
          <p className="font-semibold">No universities found</p>
          <p className="text-muted text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
