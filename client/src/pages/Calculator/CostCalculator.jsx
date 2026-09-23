import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import '../DataPages.css';

const COUNTRY_CURRENCY_MAP = {
  'united-states': 'USD',
  'united-kingdom': 'GBP',
  'canada': 'CAD',
  'germany': 'EUR',
  'australia': 'AUD',
  'netherlands': 'EUR',
  'switzerland': 'CHF',
  'singapore': 'SGD',
  'japan': 'JPY',
  'south-korea': 'KRW',
  'ireland': 'EUR',
  'france': 'EUR',
  'sweden': 'SEK',
  'italy': 'EUR',
  'new-zealand': 'NZD',
  'china': 'CNY',
  'denmark': 'DKK',
  'finland': 'EUR',
  'norway': 'NOK',
  'uae': 'AED',
  'luxembourg': 'EUR',
  'belgium': 'EUR',
  'austria': 'EUR',
  'russia': 'RUB',
  'spain': 'EUR',
  'malaysia': 'MYR',
  'portugal': 'EUR',
  'poland': 'PLN',
};

const ALL_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'SGD', 'JPY', 'KRW',
  'NZD', 'INR', 'CNY', 'DKK', 'NOK', 'AED', 'RUB', 'MYR', 'PLN',
  'AFN', 'PKR', 'BDT', 'NGN', 'IDR', 'PHP', 'VND', 'THB', 'EGP', 'TRY',
  'BRL', 'MXN', 'ZAR', 'KES', 'GHS', 'SAR'
];

const getCurrencyForNationality = (nationality) => {
  if (!nationality) return null;
  const n = nationality.toLowerCase();
  if (n.includes('india') || n.includes('indian')) return 'INR';
  if (n.includes('china') || n.includes('chinese')) return 'CNY';
  if (n.includes('uk') || n.includes('british')) return 'GBP';
  if (n.includes('canada') || n.includes('canadian')) return 'CAD';
  if (n.includes('australia')) return 'AUD';
  if (n.includes('malaysia')) return 'MYR';
  if (n.includes('singapore')) return 'SGD';
  if (n.includes('arab') || n.includes('emirati')) return 'AED';
  if (n.includes('russia')) return 'RUB';
  if (n.includes('poland') || n.includes('polish')) return 'PLN';
  if (n.includes('afghan')) return 'AFN';
  if (n.includes('pakistan')) return 'PKR';
  if (n.includes('bangladesh')) return 'BDT';
  if (n.includes('nigeria')) return 'NGN';
  if (n.includes('indonesia')) return 'IDR';
  if (n.includes('philippin')) return 'PHP';
  if (n.includes('vietnam')) return 'VND';
  if (n.includes('thai')) return 'THB';
  if (n.includes('egypt')) return 'EGP';
  if (n.includes('turk')) return 'TRY';
  if (n.includes('brazil')) return 'BRL';
  if (n.includes('mexic')) return 'MXN';
  if (n.includes('south africa')) return 'ZAR';
  if (n.includes('kenya')) return 'KES';
  if (n.includes('ghana')) return 'GHS';
  if (n.includes('saudi')) return 'SAR';
  return null;
};

export default function CostCalculator() {
  const { user, isAuthenticated, refreshProfile } = useAuth();

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  const [form, setForm] = useState({
    countrySlug: 'united-states',
    tuitionUsd: 30000,
    durationMonths: 24,
    currency: 'USD',
    estimationMode: 'average',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch countries on mount
  useEffect(() => {
    api.get('/countries')
      .then(res => {
        const data = res.data.data || [];
        const countryOrder = [
          'united-states', 'united-kingdom', 'china', 'australia', 'germany', 'new-zealand', 'netherlands', 'ireland', 'canada', 'denmark', 'finland', 'sweden', 'norway', 'japan', 'south-korea', 'france', 'switzerland', 'singapore', 'uae', 'luxembourg', 'italy', 'belgium', 'austria', 'russia', 'spain', 'malaysia', 'portugal', 'poland'
        ];
        data.sort((a, b) => {
          const aIndex = countryOrder.indexOf(a.slug);
          const bIndex = countryOrder.indexOf(b.slug);
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
        setCountries(data);
      })
      .catch(() => setCountries([]))
      .finally(() => setCountriesLoading(false));

    // Refresh profile to ensure we have the latest nationality data
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated, refreshProfile]);

  const selectedCountryCurrency = COUNTRY_CURRENCY_MAP[form.countrySlug] || 'USD';

  // Smart currency sorting logic (Max 3 options at top, then all others)
  const displayCurrencies = useMemo(() => {
    const options = new Set();

    // 1. Target country currency
    options.add(selectedCountryCurrency);

    // 2. User's native currency (if logged in and known)
    if (isAuthenticated && user?.personal?.nationality) {
      const nativeCurrency = getCurrencyForNationality(user.personal.nationality);
      if (nativeCurrency) {
        options.add(nativeCurrency);
      }
    }

    // 3. USD (always added)
    options.add('USD');

    return Array.from(options);
  }, [selectedCountryCurrency, isAuthenticated, user]);

  // Ensure selected currency is valid when display currencies change
  useEffect(() => {
    if (displayCurrencies.length > 0 && !displayCurrencies.includes(form.currency)) {
      setForm(prev => ({ ...prev, currency: displayCurrencies[0] }));
    }
  }, [displayCurrencies, form.currency]);

  // Automatically update currency when country changes if the user hasn't explicitly set it to something else
  useEffect(() => {
    setForm(prev => ({ ...prev, currency: displayCurrencies[0] }));
  }, [form.countrySlug]);


  const calculate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/costs/calculate', form);
      setResult(res.data.data);
    } catch { }
    finally { setLoading(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculate();
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page container">
      <div className="page-header">
        <h1 className="page-title">Cost Calculator</h1>
        <p className="page-subtitle">Get a detailed cost breakdown for studying abroad</p>
      </div>

      <div className="calculator-layout animate-fadeInUp">
        {/* Inputs */}
        <form onSubmit={handleSubmit} className="card">
          <h2 className="text-lg font-bold mb-4">Study Details</h2>
          <div className="calc-input-group">
            <div className="form-group">
              <label className="form-label">Country</label>
              <select className="form-input" value={form.countrySlug} onChange={update('countrySlug')} disabled={countriesLoading}>
                {countriesLoading ? <option>Loading...</option> : null}
                {countries.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Annual Tuition ({selectedCountryCurrency})</label>
              <input type="number" className="form-input" value={form.tuitionUsd} onChange={update('tuitionUsd')} min="0" step="500" />
            </div>

            <div className="form-group">
              <label className="form-label">Program Duration (months)</label>
              <input type="number" className="form-input" value={form.durationMonths} onChange={update('durationMonths')} min="1" max="72" />
            </div>

            <div className="form-group">
              <label className="form-label">Display Currency</label>
              <select className="form-input" value={form.currency} onChange={update('currency')}>
                {displayCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Estimation Mode</label>
              <select className="form-input" value={form.estimationMode} onChange={update('estimationMode')} style={{ borderColor: form.estimationMode === 'worst-case' ? 'var(--warning-400)' : undefined }}>
                <option value="average">National Average Costs (Standard)</option>
                <option value="worst-case">Worst-Case Scenario (High Cost of Living)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ gridColumn: '1 / -1' }}>
              {loading ? 'Calculating...' : 'Calculate Costs'}
            </button>
            {result && result.disclaimer && (
              <p className="text-xs text-muted text-center" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                {result.disclaimer}
              </p>
            )}
          </div>
        </form>

        {/* Results */}
        <div>
          {result ? (
            <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="calc-result-card">
                <p className="text-sm text-muted font-semibold">Total Program Cost</p>
                <p className="calc-total">
                  {result.currency} {result.totalProgram.total.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted mt-1">
                  Over {result.durationMonths} months ({(result.durationMonths / 12).toFixed(1)} years)
                </p>
              </div>

              <div className="card">
                <h3 className="font-bold mb-2">Monthly Breakdown</h3>
                <div className="calc-breakdown">
                  {Object.entries(result.monthly).filter(([k]) => k !== 'total').map(([key, value]) => (
                    <div key={key} className="calc-row">
                      <span className="calc-row-label">{key}</span>
                      <span className="calc-row-value">{result.currency} {value.toLocaleString('en-US')}</span>
                    </div>
                  ))}
                  <div className="calc-row" style={{ borderBottom: 'none', fontWeight: 700 }}>
                    <span>Monthly Total</span>
                    <span style={{ color: 'var(--primary-300)' }}>{result.currency} {result.monthly.total.toLocaleString('en-US')}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="font-bold mb-2">First Year Costs</h3>
                <div className="calc-breakdown">
                  <div className="calc-row">
                    <span className="calc-row-label">Tuition</span>
                    <span className="calc-row-value">{result.currency} {result.firstYear.tuition.toLocaleString('en-US')}</span>
                  </div>
                  <div className="calc-row">
                    <span className="calc-row-label">Living Expenses</span>
                    <span className="calc-row-value">{result.currency} {result.firstYear.living.toLocaleString('en-US')}</span>
                  </div>
                  <div className="calc-row">
                    <span className="calc-row-label">One-time Costs</span>
                    <span className="calc-row-value">{result.currency} {result.firstYear.oneTimeCosts.toLocaleString('en-US')}</span>
                  </div>
                  <div className="calc-row" style={{ borderBottom: 'none', fontWeight: 700 }}>
                    <span>First Year Total</span>
                    <span style={{ color: 'var(--accent-400)' }}>{result.currency} {result.firstYear.total.toLocaleString('en-US')}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <div className="text-center">
                <p style={{ fontSize: '3rem', marginBottom: 12 }}></p>
                <p className="font-semibold">Enter your details</p>
                <p className="text-sm text-muted mt-1">Click "Calculate Costs" to see a detailed breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
