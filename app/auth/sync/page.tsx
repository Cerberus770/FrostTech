'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncAuth() {
  const router = useRouter();
  const [message, setMessage] = useState('Syncing your Google Account...');

  useEffect(() => {
    // Read the temporary cookie set by the callback handler
    const cookies = document.cookie.split(';').reduce((acc, c) => {
      const [key, ...val] = c.trim().split('=');
      acc[key] = decodeURIComponent(val.join('='));
      return acc;
    }, {} as Record<string, string>);

    const authData = cookies['google_auth_data'];

    if (authData) {
      try {
        const user = JSON.parse(authData);

        // Populate sessionStorage
        sessionStorage.setItem('userId', user.id);
        sessionStorage.setItem('userRole', user.role);
        sessionStorage.setItem('userName', `${user.firstName} ${user.lastName}`);
        sessionStorage.setItem('userEmail', user.email);

        // Clear the temporary cookie
        document.cookie = 'google_auth_data=; path=/; max-age=0';

        // Redirect based on role
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else if (user.role === 'TECHNICIAN') {
          router.push('/technician');
        } else {
          router.push('/profile');
        }
        return;
      } catch (err) {
        console.error('Failed to parse auth data:', err);
      }
    }

    // Fallback: no cookie found
    setMessage('Authentication failed. Redirecting to login...');
    setTimeout(() => router.push('/login'), 2000);
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: 'var(--bg-dark, #0a0a1a)' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary, #3b82f6)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <h2 style={{ color: 'var(--text-dark, white)' }}>{message}</h2>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
