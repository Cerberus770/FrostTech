'use client';

import { useState } from 'react';

interface CaptchaWidgetProps {
  verified: boolean;
  onVerify: (isVerified: boolean) => void;
  error?: string;
}

export default function CaptchaWidget({ verified, onVerify, error }: CaptchaWidgetProps) {
  const [checking, setChecking] = useState(false);

  const handleClick = () => {
    if (verified || checking) return;

    setChecking(true);
    // Simulate smart client-side security verification (browser environment & human interaction check)
    setTimeout(() => {
      setChecking(false);
      onVerify(true);
    }, 700);
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f9fafb',
          border: error ? '1.5px solid #ef4444' : verified ? '1.5px solid #10b981' : '1.5px solid #d1d5db',
          borderRadius: '8px',
          padding: '0.65rem 1rem',
          minWidth: '280px',
          maxWidth: '340px',
          cursor: verified ? 'default' : 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          userSelect: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Checkbox / Spinner / Checkmark */}
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '4px',
              border: verified ? '2px solid #10b981' : '2px solid #9ca3af',
              background: verified ? '#10b981' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s ease',
              flexShrink: 0,
            }}
          >
            {checking ? (
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #38bdf8',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
            ) : verified ? (
              <i className="fa-solid fa-check" style={{ color: '#ffffff', fontSize: '0.9rem' }}></i>
            ) : null}
          </div>

          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: verified ? '#0f766e' : '#1f2937',
            }}
          >
            {checking ? 'Verifying...' : verified ? "I'm not a robot" : "I'm not a robot"}
          </span>
        </div>

        {/* Security Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#0284c7' }}>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.1rem' }}></i>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>FrostGuard</span>
          <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>Privacy • Terms</span>
        </div>
      </div>

      {error && (
        <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 500 }}>
          <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '4px' }}></i>
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
