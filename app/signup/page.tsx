'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Auto-login after signup
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('isCustomer', 'true');
      sessionStorage.setItem('userId', data.id);
      sessionStorage.setItem('userEmail', data.email);
      sessionStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
      sessionStorage.setItem('userRole', data.role);
      router.push('/');
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

      {/* Sign Up Form */}
      <section className="login-section">
        <div className="login-card" style={{ maxWidth: '500px' }}>
          <h2>Create an Account</h2>
          <form onSubmit={handleSignup}>
            {error && <div style={{background: 'rgba(220,53,69,0.1)', color: '#dc3545', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(220,53,69,0.3)'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight: '6px'}}></i>{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fname">First Name</label>
                <input 
                  type="text" 
                  id="fname" 
                  placeholder="First Name" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="lname">Last Name</label>
                <input 
                  type="text" 
                  id="lname" 
                  placeholder="Last Name" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                placeholder="Enter your email" 
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
                placeholder="Create a password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                placeholder="Confirm your password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn login-btn" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>
          </form>
          <div className="signup-link">
            Already have an account? <Link href="/login">Sign In</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-bottom" style={{ borderTop: 'none', paddingTop: 0, marginTop: '-2rem' }}>
          &copy; 2026 FrostTech Cooling Solutions Co. All rights reserved.
        </div>
      </footer>
    </>
  );
}
