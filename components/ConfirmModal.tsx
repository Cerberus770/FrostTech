'use client';

import React, { useState } from 'react';

export type ConfirmType = 'confirm' | 'success' | 'error' | 'warning';

interface ConfirmModalProps {
  show: boolean;
  type?: ConfirmType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  showCancel?: boolean;
}

const iconMap: Record<ConfirmType, { icon: string; color: string; bg: string }> = {
  confirm: { icon: 'fa-solid fa-circle-question', color: '#009BD5', bg: 'rgba(0,155,213,0.15)' },
  success: { icon: 'fa-solid fa-circle-check', color: '#28a745', bg: 'rgba(40,167,69,0.15)' },
  error:   { icon: 'fa-solid fa-circle-xmark', color: '#dc3545', bg: 'rgba(220,53,69,0.15)' },
  warning: { icon: 'fa-solid fa-triangle-exclamation', color: '#ff6b35', bg: 'rgba(255,107,53,0.15)' },
};

export default function ConfirmModal({
  show,
  type = 'confirm',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = true,
}: ConfirmModalProps) {
  if (!show) return null;

  const { icon, color, bg } = iconMap[type];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <i className={icon} style={{ fontSize: '1.75rem', color }}></i>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-dark, #f1f5f9)',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-display, inherit)',
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-light, #94a3b8)',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          {showCancel && (
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.7rem 1.5rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #334155)',
                background: 'transparent',
                color: 'var(--text-light, #94a3b8)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-input, #334155)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '0.7rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: type === 'error' ? '#dc3545' : type === 'warning' ? '#ff6b35' : type === 'success' ? '#28a745' : color,
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 4px 15px ${type === 'error' ? 'rgba(220,53,69,0.3)' : type === 'warning' ? 'rgba(255,107,53,0.3)' : type === 'success' ? 'rgba(40,167,69,0.3)' : 'rgba(0,155,213,0.3)'}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// Hook for easy usage
export function useConfirmModal() {
  const [state, setState] = useState<{
    show: boolean;
    type: ConfirmType;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    showCancel: boolean;
    onConfirm?: () => void;
  }>({
    show: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    showCancel: true,
  });

  const confirm = (opts: {
    title: string;
    message: string;
    type?: ConfirmType;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        show: true,
        type: opts.type || 'confirm',
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        showCancel: true,
        onConfirm: () => {
          setState(s => ({ ...s, show: false }));
          resolve(true);
        },
      });
    });
  };

  const showAlert = (opts: {
    title: string;
    message: string;
    type?: ConfirmType;
    buttonText?: string;
  }) => {
    setState({
      show: true,
      type: opts.type || 'success',
      title: opts.title,
      message: opts.message,
      confirmText: opts.buttonText || 'OK',
      cancelText: 'Cancel',
      showCancel: false,
      onConfirm: () => {
        setState(s => ({ ...s, show: false }));
      },
    });
  };

  const close = () => setState(s => ({ ...s, show: false }));

  const ModalComponent = () => (
    <ConfirmModal
      show={state.show}
      type={state.type}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      showCancel={state.showCancel}
      onConfirm={state.onConfirm}
      onCancel={close}
    />
  );

  return { confirm, showAlert, close, ModalComponent };
}
