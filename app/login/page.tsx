'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
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

        <div className="search-bar">
          <input type="text" placeholder="Search for air conditioners, brands..." />
          <button><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>

        <div className="header-icons">
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
              <input 
                type="password" 
                id="password" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>
            <button type="submit" className="btn login-btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            
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

      <footer>
        <div className="footer-bottom" style={{ borderTop: 'none', paddingTop: 0, marginTop: '-2rem' }}>
          &copy; 2026 FrostTech Cooling Solutions Co. All rights reserved.
        </div>
      </footer>
    </>
  );
}

