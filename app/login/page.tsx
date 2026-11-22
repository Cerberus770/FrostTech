'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CaptchaWidget from '@/components/CaptchaWidget';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Store session and redirect based on role
  const handleAuthSuccess = (data: { id: string; email: string; firstName: string; lastName: string; role: string }) => {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userId', data.id);
    sessionStorage.setItem('userEmail', data.email);
    sessionStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
    sessionStorage.setItem('userRole', data.role);

    if (data.role === 'ADMIN') {
      sessionStorage.setItem('isAdmin', 'true');
      router.push('/admin');
    } else if (data.role === 'TECHNICIAN') {
      sessionStorage.setItem('isTech', 'true');
      router.push('/technician');
    } else {
      sessionStorage.setItem('isCustomer', 'true');
      router.push('/');
    }
  };

  // Initialize Google Sign-In
  useEffect(() => {
    const clientId = '1037203276384-91thq0li7fl7n49hljrf3dte0ickuv04.apps.googleusercontent.com';

    // Load the Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 380,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) existingScript.remove();
    };
  }, []);

  // Handle Google credential response
  const handleGoogleResponse = async (response: { credential: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Google login failed');
        setLoading(false);
        return;
      }

      handleAuthSuccess(data);
    } catch {
      setError('Google login failed. Please try again.');
      setLoading(false);
    }
  };

  const executeLogin = async () => {
    setLoading(true);
    setError('');
    setCaptchaError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      handleAuthSuccess(data);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setCaptchaError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (!isCaptchaVerified) {
      setShowCaptchaModal(true);
      return;
    }

    await executeLogin();
  };

  return (
    <>
      <header>
        <Link href="/" className="logo">
          <img 
            src="/LOGO.jpg" 
            alt="FrostTech Logo"
            style={{ height: '35px', verticalAlign: 'middle', borderRadius: '4px', marginRight: '8px' }}
          /> 
          <span style={{ fontWeight: 700, fontSize: '1.2rem', verticalAlign: 'middle', color: 'white', letterSpacing: '-0.5px' }}>
            FrostTech
          </span>
        </Link>

        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.querySelector('input') as HTMLInputElement;
            if (input?.value.trim()) {
              router.push(`/?q=${encodeURIComponent(input.value.trim())}`);
            }
          }}
        >
          <input type="text" placeholder="Search for air conditioners, brands..." />
          <button type="submit"><i className="fa-solid fa-magnifying-glass"></i></button>
        </form>

        <div className="header-icons">
          <Link href="/feedback"><i className="fa-solid fa-comments"></i> Feedback</Link>
          <Link href="/login"><i className="fa-solid fa-user"></i> Account</Link>
          <Link href="/cart"><i className="fa-solid fa-cart-shopping"></i> Cart (0)</Link>
        </div>
      </header>

      <section className="login-section">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <form id="loginForm" onSubmit={handleLogin}>
            {error && <div style={{background: 'rgba(220,53,69,0.1)', color: '#dc3545', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(220,53,69,0.3)'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight: '6px'}}></i>{error}</div>}
            <div className="form-group">
              <label htmlFor="email">Email Address or Username</label>
              <input 
                type="text" 
                id="email" 
                placeholder="Enter your email or username" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '2.8rem' }}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>

            <button type="submit" className="btn login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 10px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {/* Real Google Sign-In Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div ref={googleBtnRef}></div>
            </div>
          </form>
          <div className="signup-link">
            Don&apos;t have an account? <Link href="/signup">Create one here</Link>
          </div>
        </div>
      </section>

      {/* CAPTCHA / SECURITY VERIFICATION POPUP MODAL */}
      {showCaptchaModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowCaptchaModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '430px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              position: 'relative',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowCaptchaModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.4rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px',
              }}
              title="Close"
              aria-label="Close"
            >
              &times;
            </button>

            {/* FrostGuard Shield Icon */}
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.65rem',
                margin: '0 auto 1rem auto',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.18)',
              }}
            >
              <i className="fa-solid fa-shield-halved"></i>
            </div>

            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Security Verification
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.86rem', color: '#64748b', lineHeight: 1.45 }}>
              Please check the box below to verify you are not a robot and proceed with sign in.
            </p>

            {/* Captcha Widget Container */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <CaptchaWidget
                verified={isCaptchaVerified}
                onVerify={(v) => {
                  setIsCaptchaVerified(v);
                  setCaptchaError('');
                  if (v) {
                    setTimeout(() => {
                      setShowCaptchaModal(false);
                      executeLogin();
                    }, 500);
                  }
                }}
                error={captchaError}
              />
            </div>

            {isCaptchaVerified && (
              <div style={{ color: '#10b981', fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '0.25rem' }}>
                <i className="fa-solid fa-circle-check"></i> Verification Successful! Signing you in...
              </div>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setShowCaptchaModal(false)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ 
        marginTop: 0, 
        padding: '1rem 5%', 
        background: 'linear-gradient(135deg, #072a6b 0%, #0b3080 100%)',
        borderTop: '1px solid rgba(56, 189, 248, 0.15)'
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
            <i className="fa-solid fa-snowflake" style={{ color: '#38bdf8', fontSize: '0.9rem' }}></i>
            <span>&copy; 2026 FrostTech Cooling Solutions Co.</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
            <Link href="/feedback" style={{ color: 'rgba(224,242,254,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}>
              <i className="fa-solid fa-comments" style={{ marginRight: '4px', fontSize: '0.72rem' }}></i>Customer Feedback
            </Link>
            <Link href="/#products" style={{ color: 'rgba(224,242,254,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}>
              <i className="fa-solid fa-store" style={{ marginRight: '4px', fontSize: '0.72rem' }}></i>Shop
            </Link>
            <a href="https://www.facebook.com/FrostTechCoolingSolutionsCo" target="_blank" rel="noreferrer" style={{ color: 'rgba(224,242,254,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}>
              <i className="fa-brands fa-facebook" style={{ marginRight: '4px', fontSize: '0.72rem' }}></i>Facebook
            </a>
            <Link href="/signup" style={{ color: 'rgba(224,242,254,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}>
              <i className="fa-solid fa-user-plus" style={{ marginRight: '4px', fontSize: '0.72rem' }}></i>Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

