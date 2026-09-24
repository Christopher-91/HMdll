import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Search, Globe, Clock, Briefcase, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import '../DataPages.css';
import './Immigration.css';

export default function Immigration() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    api.get('/immigration')
      .then(res => {
        const data = res.data.data || [];
        // Sort by some intuitive order, let's say alphabetical
        data.sort((a, b) => a.countryName.localeCompare(b.countryName));
        setProfiles(data);
      })
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  const getSearchableText = (p) => {
    let aliases = [];
    if (p.countryCode === 'US') aliases.push('usa', 'america');
    if (p.countryCode === 'GB') aliases.push('uk', 'britain', 'england');
    if (p.countryCode === 'AE') aliases.push('uae', 'emirates', 'dubai');
    if (p.countryCode === 'KR') aliases.push('korea');
    if (p.countryCode === 'CN') aliases.push('prc');
    if (p.countryCode === 'DE') aliases.push('deutschland');
    
    return [
      p.countryName.toLowerCase(),
      p.countryCode.toLowerCase(),
      ...aliases
    ].join(' ');
  };

  const filteredProfiles = profiles.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return getSearchableText(p).includes(query);
  });

  return (
    <div className="page container">
      <div className="page-header">
        <div className="header-icon">
          <Plane size={32} />
        </div>
        <h1>Immigration & Visas</h1>
        <p className="page-subtitle">
          Comprehensive guides on student visas, work rights, and post-study pathways for 28 countries.
        </p>
      </div>

      <div className="filters-bar animate-fadeInUp">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <span className="search-icon"><Search size={16} /></span>
          <input 
            type="text" 
            placeholder="Search countries..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="cards-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card skeleton" style={{ height: '220px' }}></div>
          ))}
        </div>
      ) : (
        <div className="cards-grid">
          {filteredProfiles.map(profile => (
            <Link to={`/immigration/${profile.countrySlug}`} key={profile.countrySlug} className="card">
              <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img 
                      src={`/flags/${profile.countryCode.toLowerCase()}.webp`} 
                      alt={`${profile.countryName} flag`} 
                      style={{ width: '40px', height: 'auto', borderRadius: '4px', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{profile.countryName}</h3>
                  </div>
                  <ChevronRight size={20} className="card-arrow" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Briefcase size={16} />
                    <span>Post-Study: <strong>{profile.postStudyWorkMax ? `${profile.postStudyWorkMax} months` : 'Varies'}</strong></span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Clock size={16} />
                    <span>Work Rights: <strong>{profile.workHoursPerWeek === 'No limit' ? 'Unlimited' : profile.workHoursPerWeek ? `${profile.workHoursPerWeek} hrs/week` : 'Restricted'}</strong></span>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {profile.verificationStatus === 'verified' ? (
                    <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>Verified Data</span>
                  ) : (
                    <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>Best Effort</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {!loading && filteredProfiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No countries match your search.
        </div>
      )}
    </div>
  );
}
