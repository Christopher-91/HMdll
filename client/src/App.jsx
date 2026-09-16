import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './router/ProtectedRoute';
import Navbar from './components/Navbar/Navbar';
import { BsCompass } from 'react-icons/bs';
import { Analytics } from '@vercel/analytics/react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Pages
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import Planner from './pages/Planner/Planner';
import Universities from './pages/Universities/Universities';
import UniversityDetail from './pages/Universities/UniversityDetail';
import Programs from './pages/Programs/Programs';
import ProgramDetail from './pages/Programs/ProgramDetail';
import Countries from './pages/Countries/Countries';
import CountryDetail from './pages/Countries/CountryDetail';
import Immigration from './pages/Immigration/Immigration';
import ImmigrationDetail from './pages/Immigration/ImmigrationDetail';
import Scholarships from './pages/Scholarships/Scholarships';
import ScholarshipDetail from './pages/Scholarships/ScholarshipDetail';
import Careers from './pages/Careers/Careers';
import CareerDetail from './pages/Careers/CareerDetail';
import CostCalculator from './pages/Calculator/CostCalculator';
import ChatLayout from './pages/Chat/ChatLayout';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import TermsOfService from './pages/Legal/TermsOfService';

import './index.css';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Data Pages (public) */}
          <Route path="/universities" element={<Universities />} />
          <Route path="/universities/:slug" element={<UniversityDetail />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:slug" element={<ProgramDetail />} />
          <Route path="/countries" element={<Countries />} />
          <Route path="/countries/:slug" element={<CountryDetail />} />
          <Route path="/immigration" element={<Immigration />} />
          <Route path="/immigration/:slug" element={<ImmigrationDetail />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/scholarships/:slug" element={<ScholarshipDetail />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/careers/:slug" element={<CareerDetail />} />
          <Route path="/calculator" element={<CostCalculator />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/chat/*" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <div className="page container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}><BsCompass /></div>
                <h1 className="page-title" style={{ marginBottom: 8 }}>Page Not Found</h1>
                <p className="text-muted">The page you're looking for doesn't exist or has been moved.</p>
                <a href="/" className="btn btn-primary mt-4">Go Home</a>
              </div>
            </div>
          } />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
            },
          }}
        />
      </AuthProvider>
      <Analytics />
    </Router>
  );
}

export default App;
