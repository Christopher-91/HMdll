import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { BsMortarboard, BsExclamationTriangleFill, BsEye, BsEyeSlash } from 'react-icons/bs';
import './Auth.css';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GOOGLE_CONFIGURED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE';

export default function Register() {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP flow state
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setOauthLoading('google');
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.access_token, userInfo }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Google sign-up failed');
        const { accessToken, refreshToken, user } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success('Welcome to HMdll!');
        window.location.href = '/dashboard';
      } catch (err) {
        toast.error(err.message || 'Google sign-up failed');
      } finally {
        setOauthLoading('');
      }
    },
    onError: () => toast.error('Google sign-up was cancelled'),
    flow: 'implicit',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      toast.success(res.message || 'Verification code sent!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(form.email, otp);
      toast.success('Account verified! Welcome to HMdll 🎓');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', { email: form.email });
      toast.success('A new verification code has been sent!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to resend code');
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-register animate-fadeInUp">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <BsMortarboard size={22} />
            <span className="logo-text">HMdll<span className="blinking-dot"></span></span>
          </Link>
          <h1 className="auth-title">
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="auth-subtitle">
            {step === 1 
              ? "Start your education journey today — it's free" 
              : `We sent a 6-digit code to ${form.email}`}
          </p>
        </div>

        {step === 1 ? (
          <>
            <div className="auth-oauth">
          <button
            id="google-register-btn"
            type="button"
            className="auth-oauth-btn auth-oauth-btn--google"
            onClick={() => GOOGLE_CONFIGURED ? googleLogin() : toast('Add your VITE_GOOGLE_CLIENT_ID to .env to enable Google Sign-In', { icon: 'ℹ️' })}
            disabled={oauthLoading === 'google'}
          >
            <GoogleIcon />
            {oauthLoading === 'google' ? 'Signing up...' : 'Continue with Google'}
          </button>
        </div>

        <div className="auth-divider">or register with email</div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error animate-fadeIn"><BsExclamationTriangleFill style={{ verticalAlign: 'middle', marginRight: 6 }} /> {error}</div>}

          <div className="auth-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-first">First Name</label>
              <input id="reg-first" type="text" className="form-input" placeholder="John" value={form.firstName} onChange={update('firstName')} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-last">Last Name</label>
              <input id="reg-last" type="text" className="form-input" placeholder="Doe" value={form.lastName} onChange={update('lastName')} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Create a password (min 8 chars)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Must contain at least 1 uppercase, 1 lowercase, and 1 number.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-confirm"
                type={showConfirmPassword ? "text" : "password"}
                className="form-input"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirmPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="auth-terms text-xs text-muted text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

            <p className="auth-footer-text">
              Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit} className="auth-form animate-fadeIn">
            {error && <div className="auth-error"><BsExclamationTriangleFill style={{ verticalAlign: 'middle', marginRight: 6 }} /> {error}</div>}
            
            <div className="form-group">
              <label className="form-label" htmlFor="verify-otp">6-Digit Code</label>
              <input 
                id="verify-otp" 
                type="text" 
                className="form-input" 
                placeholder="123456" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\\D/g, '').slice(0, 6))} 
                required 
                autoFocus
                style={{ fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center', padding: '15px' }}
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            
            <p className="auth-footer-text" style={{ marginTop: '20px' }}>
              Didn't receive the code? <button type="button" onClick={handleResendOtp} className="auth-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Resend code</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
