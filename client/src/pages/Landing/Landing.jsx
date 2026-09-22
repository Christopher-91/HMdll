import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { BsSearch, BsBullseye, BsMortarboard, BsClipboard2, BsMap, BsCurrencyExchange, BsPerson, BsSend } from 'react-icons/bs';
import TextMorph from '../../components/Landing/TextMorph';
import './Landing.css';




const FEATURES = [
  { icon: <BsSearch />, title: 'Smart Discovery', desc: 'AI-powered matching across 25+ countries. Find programs that fit your profile, budget, and career goals.' },
  { icon: <BsBullseye />, title: 'Match Scoring', desc: 'Safe / Target / Reach categorization for every program. Know your chances before you apply.' },
  { icon: <BsCurrencyExchange />, title: 'Cost Calculator', desc: 'Comprehensive cost breakdowns including tuition, living expenses, visa fees, and hidden costs.' },
  { icon: <BsMortarboard />, title: 'Scholarship Finder', desc: 'Discover scholarships you qualify for — from Fulbright to DAAD to university-specific awards.' },
  { icon: <BsClipboard2 />, title: 'Application Tracker', desc: 'Track every document, deadline, and application status in one organized dashboard.' },
  { icon: <BsMap />, title: 'Career Pathways', desc: 'Reverse-plan your education: start with your dream career and find the right degree path.' },
];

const COUNTRIES = [
  { name: 'United States', city: 'New York City', sector: 'Technology | Innovation', slug: 'united-states', flag: '/flags/us.webp', image: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=900&q=85' },
  { name: 'United Kingdom', city: 'London', sector: 'Finance | Business', slug: 'united-kingdom', flag: '/flags/gb.webp', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=85' },
  { name: 'Canada', city: 'Toronto', sector: 'Technology | Healthcare', slug: 'canada', flag: '/flags/ca.webp', image: 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?auto=format&fit=crop&w=900&q=85' },
  { name: 'Germany', city: 'Berlin', sector: 'Engineering | Automotive', slug: 'germany', flag: '/flags/de.webp', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=900&q=85' },
  { name: 'Australia', city: 'Sydney', sector: 'Healthcare | Mining', slug: 'australia', flag: '/flags/au.webp', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=85' },
  { name: 'Ireland', city: 'Dublin', sector: 'Technology | Life Sciences', slug: 'ireland', flag: '/flags/ie.webp', image: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&w=900&q=85' },
  { name: 'Singapore', city: 'Singapore', sector: 'Finance | Technology', slug: 'singapore', flag: '/flags/sg.webp', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=85' },
  { name: 'United Arab Emirates', city: 'Dubai', sector: 'Business | Hospitality', slug: 'united-arab-emirates', flag: '/flags/ae.webp', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=85' },
  { name: 'Finland', city: 'Helsinki', sector: 'Technology | Clean Energy', slug: 'finland', flag: '/flags/fi.webp', image: 'https://images.unsplash.com/photo-1683119167545-c7ba61e6c6c6?auto=format&fit=crop&w=900&q=85' },
  { name: 'Norway', city: 'Oslo', sector: 'Energy | Maritime', slug: 'norway', flag: '/flags/no.webp', image: 'https://images.unsplash.com/photo-1433757741270-94a3bcadc2f3?auto=format&fit=crop&w=900&q=85' },
  { name: 'Sweden', city: 'Stockholm', sector: 'Technology | Sustainability', slug: 'sweden', flag: '/flags/se.webp', image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=900&q=85' },
  { name: 'Denmark', city: 'Copenhagen', sector: 'Life Sciences | Renewable Energy', slug: 'denmark', flag: '/flags/dk.webp', image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=900&q=85' },
  { name: 'New Zealand', city: 'Auckland', sector: 'Agriculture | Technology', slug: 'new-zealand', flag: '/flags/nz.webp', image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=900&q=85' },
  { name: 'Switzerland', city: 'Zurich', sector: 'Finance | Life Sciences', slug: 'switzerland', flag: '/flags/ch.webp', image: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=900&q=85' },
  { name: 'Netherlands', city: 'Amsterdam', sector: 'Technology | Logistics', slug: 'netherlands', flag: '/flags/nl.webp', image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=85' },
  { name: 'Japan', city: 'Tokyo', sector: 'Engineering | Robotics', slug: 'japan', flag: '/flags/jp.webp', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=900&q=85' },
  { name: 'South Korea', city: 'Seoul', sector: 'Technology | Electronics', slug: 'south-korea', flag: '/flags/kr.webp', image: 'https://images.unsplash.com/photo-1702738684583-8bdb8ca121bf?auto=format&fit=crop&w=900&q=85' },
  { name: 'France', city: 'Paris', sector: 'Luxury | Aerospace', slug: 'france', flag: '/flags/fr.webp', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85' },
  { name: 'Austria', city: 'Vienna', sector: 'Engineering | Tourism', slug: 'austria', flag: '/flags/at.webp', image: 'https://images.unsplash.com/photo-1681493162127-c9148f64f938?auto=format&fit=crop&w=900&q=85' },
  { name: 'Belgium', city: 'Brussels', sector: 'Life Sciences | International Trade', slug: 'belgium', flag: '/flags/be.webp', image: 'https://images.unsplash.com/photo-1690747072873-6a62628edf0b?auto=format&fit=crop&w=900&q=85' },
  { name: 'China', city: 'Shanghai', sector: 'Technology | Manufacturing', slug: 'china', flag: '/flags/cn.webp', image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=900&q=85' },
  { name: 'Portugal', city: 'Lisbon', sector: 'Technology | Tourism', slug: 'portugal', flag: '/flags/pt.webp', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=85' },
  { name: 'Italy', city: 'Rome', sector: 'Fashion | Manufacturing', slug: 'italy', flag: '/flags/it.webp', image: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=900&q=85' },
  { name: 'Russia', city: 'Moscow', sector: 'Engineering | Energy', slug: 'russia', flag: '/flags/ru.webp', image: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=900&q=85' },
  { name: 'Poland', city: 'Warsaw', sector: 'Technology | Business Services', slug: 'poland', flag: '/flags/pl.webp', image: 'https://images.unsplash.com/photo-1573157268862-704a1e780907?auto=format&fit=crop&w=900&q=85' },
  { name: 'Spain', city: 'Barcelona', sector: 'Tourism | Renewable Energy', slug: 'spain', flag: '/flags/es.webp', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=85' },
  { name: 'Malaysia', city: 'Kuala Lumpur', sector: 'Technology | Finance', slug: 'malaysia', flag: '/flags/my.webp', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=900&q=85' },
  { name: 'Luxembourg', city: 'Luxembourg City', sector: 'Finance | Business', slug: 'luxembourg', flag: '/flags/lu.webp', image: '/images/luxembourg.jpg' },
];

const STEPS = [
  { num: '1', icon: <BsPerson size={28} />, title: 'Build Your Profile', desc: 'Tell us about your education, scores, budget, and career aspirations. We\'ll do the heavy lifting.' },
  { num: '2', icon: <BsSearch size={24} />, title: 'Discover & Compare', desc: 'Browse personalized recommendations. Compare universities, costs, and requirements side by side.' },
  { num: '3', icon: <BsSend size={24} />, title: 'Plan & Apply', desc: 'Track deadlines, manage documents, and submit applications — all from one dashboard.' },
];

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState('');
  const destinationsRef = useRef(null);
  const destinationsPausedRef = useRef(false);
  const destinationsResumeTimerRef = useRef(null);

  useEffect(() => {
    const carousel = destinationsRef.current;
    if (!carousel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = window.setInterval(() => {
      if (destinationsPausedRef.current) return;

      const loopPoint = carousel.scrollWidth / 2;
      if (carousel.scrollLeft >= loopPoint) carousel.scrollLeft = 0;
      carousel.scrollLeft += 1;
    }, 20);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(destinationsResumeTimerRef.current);
    };
  }, []);

  const pauseDestinations = () => {
    destinationsPausedRef.current = true;
  };

  const resumeDestinations = () => {
    destinationsPausedRef.current = false;
  };

  const moveDestinations = (direction) => {
    const carousel = destinationsRef.current;
    if (!carousel) return;

    const loopPoint = carousel.scrollWidth / 2;
    if (direction > 0 && carousel.scrollLeft >= loopPoint - 4) carousel.scrollLeft = 0;
    if (direction < 0 && carousel.scrollLeft <= 4) carousel.scrollLeft = loopPoint;

    destinationsPausedRef.current = true;
    window.clearTimeout(destinationsResumeTimerRef.current);
    carousel.scrollBy({ left: direction * Math.min(360, carousel.clientWidth * 0.8), behavior: 'smooth' });
    destinationsResumeTimerRef.current = window.setTimeout(resumeDestinations, 2500);
  };

  return (
    <div className="landing">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-orb hero-orb-1" />
        <div className="hero-bg-orb hero-orb-2" />
        <div className="hero-bg-orb hero-orb-3" />

        <div className="container hero-content">
          <TextMorph />
        </div>
      </section>

      {/* ── Study Destinations ──────────────────── */}
      <section className="destinations-section">
        <div className="container">
          <div className="destinations-header">
            <span className="section-badge">Study destinations</span>
            <h2 className="section-title">Explore Your Next<br />Global Opportunity</h2>
            <p className="section-subtitle">
              See the cities students love, and the industries where graduates can make their mark.
            </p>
            <div className="destinations-nav" aria-label="Destination carousel controls">
              <button type="button" className="destinations-nav-button" onClick={() => moveDestinations(-1)} aria-label="Show previous destinations">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7" /></svg>
              </button>
              <button type="button" className="destinations-nav-button" onClick={() => moveDestinations(1)} aria-label="Show next destinations">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5 7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="destinations-viewport">
          <div
            className="destinations-carousel"
            ref={destinationsRef}
            role="region"
            aria-label="Popular study destinations"
            onMouseEnter={pauseDestinations}
            onMouseLeave={resumeDestinations}
          >
            <div className="destinations-track">
              {[0, 1].map(set => (
                <div className="destinations-group" key={set}>
                  {COUNTRIES.map(country => (
                    <Link key={`${set}-${country.slug}`} to={`/countries/${country.slug}`} className="destination-card">
                      <div className="destination-image-wrap">
                        <img src={country.image} alt={`${country.city}, ${country.name}`} className="destination-image" />
                        <span className="destination-city">{country.city}</span>
                      </div>
                      <div className="destination-card-content">
                        <div className="destination-country">
                          <h3>{country.name}</h3>
                          <img src={country.flag} alt="" className="destination-flag" />
                        </div>
                        <p className="destination-sector-label">Leading job sector</p>
                        <p className="destination-sector">{country.sector}</p>
                        <span className="destination-link">Explore destination <span aria-hidden="true">→</span></span>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything You Need to<br />Make the Right Choice</h2>
            <p className="section-subtitle">
              We've built every tool a student needs — from initial research to final application submission.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">Three Steps to Your<br />Dream University</h2>
          </div>

          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-icon-wrapper">
                  <div className="step-icon">{s.icon}</div>
                  <div className="step-badge">{s.num}</div>
                </div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                {i < STEPS.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────── */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-glow" />
            <h2 className="cta-title">Ready to Find Your Perfect University?</h2>
            <p className="cta-subtitle">
              Join thousands of students who've already found their ideal program.
              Create your free profile and get personalized recommendations in minutes.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Account →
              </Link>
              <Link to="/universities" className="btn btn-secondary btn-lg">
                Browse Universities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="navbar-logo">
                <span className="logo-text">HMdll<span className="blinking-dot"></span></span>
              </div>
              <p className="footer-tagline">
                Helping students make informed education decisions across 25+ countries.
              </p>
            </div>
            <div className="footer-col">
              <h4>Explore</h4>
              <Link to="/universities">Universities</Link>
              <Link to="/programs">Programs</Link>
              <Link to="/countries">Countries</Link>
              <Link to="/scholarships">Scholarships</Link>
            </div>
            <div className="footer-col">
              <h4>Tools</h4>
              <Link to="/careers">Career Explorer</Link>
              <Link to="/calculator">Cost Calculator</Link>
              <Link to="/compare">Compare</Link>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <Link to="/register">Sign Up</Link>
              <Link to="/login">Log In</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} HMdll. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
