'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

      // Store user session data
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userId', data.id);
      sessionStorage.setItem('userEmail', data.email);
      sessionStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
      sessionStorage.setItem('userRole', data.role);

      // Role-based redirect
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

            <button type="button" className="btn" style={{ background: 'white', color: '#333', border: '1px solid #ddd', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch('/api/auth/google', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                  sessionStorage.setItem('userId', data.id);
                  sessionStorage.setItem('userRole', data.role);
                  sessionStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
                  sessionStorage.setItem('userEmail', data.email);
                  router.push(data.role === 'ADMIN' ? '/admin' : data.role === 'TECHNICIAN' ? '/technician' : '/profile');
                } else {
                  setError(data.error);
                }
              } catch (e) {
                setError('Google login failed');
              } finally {
                setLoading(false);
              }
            }}>
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
          </form>
          <div className="signup-link">
            Don't have an account? <Link href="/signup">Create one here</Link>
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
