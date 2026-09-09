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
