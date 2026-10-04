'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In
  useEffect(() => {
    const clientId = '1037203276384-91thq0li7fl7n49hljrf3dte0ickuv04.apps.googleusercontent.com';
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
          text: 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      const s = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (s) s.remove();
    };
  }, []);

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
        setError(data.error || 'Google sign up failed');
        setLoading(false);
        return;
      }
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userId', data.id);
      sessionStorage.setItem('userEmail', data.email);
      sessionStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
      sessionStorage.setItem('userRole', data.role);
      sessionStorage.setItem('isCustomer', 'true');
      router.push('/');
    } catch {
      setError('Google sign up failed. Please try again.');
      setLoading(false);
    }
  };

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
    if (role === 'TECHNICIAN' && !phone) {
      setError('Phone number is required for technician accounts.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          email: email.toLowerCase(),
          password,
          firstName,
          lastName,
          phone: phone || null,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          // Technician pending approval
          setSuccess('Your technician account has been submitted! Please wait for admin approval before logging in.');
          setLoading(false);
          return;
        }
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Auto-login after signup (only for customers)
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userId', data.id);
      sessionStorage.setItem('userEmail', data.email);
      sessionStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
      sessionStorage.setItem('userRole', data.role);

      if (data.role === 'TECHNICIAN') {
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'white',
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
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
        <div className="login-card" style={{ maxWidth: '520px' }}>
          <h2>Create an Account</h2>

          {/* Role Toggle Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '0', 
            marginBottom: '1.5rem', 
            borderRadius: 'var(--radius-pill)', 
            overflow: 'hidden', 
            border: '1px solid var(--border-color)',
            background: 'var(--bg-input)'
          }}>
            <button 
              type="button"
              onClick={() => setRole('CUSTOMER')}
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                border: 'none', 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                background: role === 'CUSTOMER' ? 'var(--primary)' : 'transparent',
                color: role === 'CUSTOMER' ? 'white' : 'var(--text-light)',
              }}
            >
              <i className="fa-solid fa-user" style={{ marginRight: '6px' }}></i> Customer
            </button>
            <button 
              type="button"
              onClick={() => setRole('TECHNICIAN')}
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                border: 'none', 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                background: role === 'TECHNICIAN' ? 'var(--secondary)' : 'transparent',
                color: role === 'TECHNICIAN' ? 'white' : 'var(--text-light)',
              }}
            >
              <i className="fa-solid fa-wrench" style={{ marginRight: '6px' }}></i> Technician
            </button>
          </div>

          {/* Technician Info Banner */}
          {role === 'TECHNICIAN' && (
            <div style={{
              background: 'rgba(255, 107, 53, 0.1)',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <i className="fa-solid fa-circle-info" style={{ marginTop: '2px' }}></i>
              <span>Technician accounts require <strong>admin approval</strong> before you can access the dashboard. You&apos;ll be notified once approved.</span>
            </div>
          )}

          <form onSubmit={handleSignup}>
            {error && <div style={{background: 'rgba(220,53,69,0.1)', color: '#dc3545', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(220,53,69,0.3)'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight: '6px'}}></i>{error}</div>}
            {success && <div style={{background: 'rgba(40,167,69,0.1)', color: '#28a745', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(40,167,69,0.3)'}}><i className="fa-solid fa-circle-check" style={{marginRight: '6px'}}></i>{success}</div>}
            
            {/* Name Row */}
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

            {/* Email */}
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

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="phone">Phone Number {role === 'TECHNICIAN' && <span style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>(Required)</span>}</label>
              <input 
                type="tel" 
                id="phone" 
                placeholder="e.g. 09123456789" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={role === 'TECHNICIAN'}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                placeholder="Create a password (min 6 chars)" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            {/* Confirm Password */}
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

            {/* Submit */}
            <button 
              type="submit" 
              className="btn login-btn" 
              disabled={loading}
              style={{
                background: role === 'TECHNICIAN' ? 'var(--secondary)' : undefined,
              }}
            >
              {loading ? 'Creating account...' : role === 'TECHNICIAN' ? 'Apply as Technician' : 'Sign Up'}
            </button>
            
            {/* Google Sign-In (only for customers) */}
            {role === 'CUSTOMER' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                  <span style={{ padding: '0 10px' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div ref={googleBtnRef}></div>
                </div>
              </>
            )}
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
