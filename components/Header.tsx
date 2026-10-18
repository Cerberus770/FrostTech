'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'warning' | 'service';
  link?: string;
}

export default function Header({ hideSearch = false }: { hideSearch?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Get cart count from localStorage (matching cart page)
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('frostTechCart') || '[]');
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    // Fetch user status notifications if logged in
    const userId = sessionStorage.getItem('userId');
    if (loggedIn && userId) {
      Promise.all([
        fetch(`/api/orders?userId=${userId}`).then(r => r.json()).catch(() => []),
        fetch(`/api/dispatch?userId=${userId}`).then(r => r.json()).catch(() => []),
        fetch(`/api/maintenance?userId=${userId}`).then(r => r.json()).catch(() => [])
      ]).then(([orders, dispatches, maints]) => {
        const notifs: NotificationItem[] = [];

        if (Array.isArray(orders)) {
          orders.forEach((o: any) => {
            if (o.status === 'Cancelled') {
              notifs.push({
                id: `cancel-${o.id}`,
                title: 'Order Cancelled',
                message: `Order ${o.orderNo} was cancelled.`,
                time: o.date || 'Recent',
                type: 'warning',
                link: '/profile#tab-orders',
              });
            } else {
              notifs.push({
                id: `order-${o.id}`,
                title: `Order Status: ${o.status}`,
                message: `Your AC order (${o.orderNo}) is currently ${o.status.toLowerCase()}.`,
                time: o.date || 'Recent',
                type: 'order',
                link: '/profile#tab-orders',
              });
            }
          });
        }

        if (Array.isArray(dispatches)) {
          dispatches.forEach((d: any) => {
            if (d.scheduledDate) {
              notifs.push({
                id: `disp-${d.id}`,
                title: 'Installation/Delivery Scheduled',
                message: `AC unit "${d.item}" scheduled for ${d.scheduledDate}.`,
                time: 'Scheduled',
                type: 'service',
                link: '/profile',
              });
            }
          });
        }

        if (Array.isArray(maints)) {
          maints.forEach((m: any) => {
            notifs.push({
              id: `maint-${m.id}`,
              title: 'AC Maintenance Reminder',
              message: `${m.serviceType} for "${m.item}" on ${m.scheduledDate}.`,
              time: m.scheduledDate || 'Upcoming',
              type: 'service',
              link: '/profile',
            });
          });
        }

        setNotifications(notifs);
      }).catch(console.error);
    }

    // Listen for storage events (fired by addToCart)
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('isTech');
    sessionStorage.removeItem('isCustomer');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userRole');
    window.location.reload();
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.15)',
      color: '#f0f4f8',
      padding: '0.8rem 5%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 15px rgba(2, 100, 160, 0.25)',
    }}>
      <Link href="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/LOGO.jpg" alt="FrostTech Logo" className="logo-mark" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
        <span className="logo-text" style={{ fontWeight: 800, fontSize: '1.4rem', color: '#f5f5f5', letterSpacing: '-0.5px' }}>
          Frost<span style={{ color: '#c3e4ff' }}>Tech</span>
        </span>
      </Link>

      {!hideSearch && (
        <form className="search-bar" onSubmit={(e) => {
          e.preventDefault();
          const query = (document.getElementById('search-input') as HTMLInputElement).value;
          if (query.trim()) {
            router.push(`/?q=${encodeURIComponent(query.trim())}`);
          } else {
            router.push('/');
          }
        }} style={{
          display: 'flex',
          flex: 1,
          maxWidth: '520px',
          margin: '0 1.5rem',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '999px',
          overflow: 'hidden',
          transition: 'all 0.2s',
        }}>
          <input
            type="text"
            id="search-input"
            placeholder="Search air conditioners, horsepower, parts..."
            style={{
              flex: 1,
              padding: '0.65rem 1.2rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.92rem',
              color: '#f5f5f5',
              outline: 'none',
            }}
          />
          <button type="submit" id="search-btn" style={{
            background: 'transparent',
            border: 'none',
            padding: '0 1.2rem',
            cursor: 'pointer',
            color: '#c3e4ff',
            fontSize: '1rem',
          }}>
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </form>
      )}

      <div className="header-icons" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Cart Icon */}
        <Link
          href="/cart"
          id="header-cart-btn"
          title="My Cart"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '1.15rem',
            transition: 'all 0.2s',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
        >
          <i className="fa-solid fa-cart-shopping"></i>
          {cartCount > 0 && (
            <span
              id="cart-badge-count"
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '999px',
                minWidth: '20px',
                height: '20px',
                padding: '0 5px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>

        {/* Notification Icon */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            id="header-notif-btn"
            title="Order Updates & Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: notifOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.25)',
              fontSize: '1.15rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <i className="fa-regular fa-bell"></i>
            {notifications.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#0284c7',
                  color: 'white',
                  borderRadius: '999px',
                  minWidth: '19px',
                  height: '19px',
                  padding: '0 4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '340px',
                maxHeight: '420px',
                overflowY: 'auto',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2)',
                border: '1px solid #e2e8f0',
                padding: '0.8rem',
                zIndex: 200,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.6rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.6rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  <i className="fa-solid fa-bell" style={{ color: '#0284c7', marginRight: '6px' }}></i> AC Order Updates
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{notifications.length} updates</span>
              </div>

              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#64748b' }}>
                  <i className="fa-regular fa-bell-slash" style={{ fontSize: '1.8rem', color: '#cbd5e1', marginBottom: '0.5rem', display: 'block' }}></i>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>No new notifications at this time.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link || '/profile'}
                      onClick={() => setNotifOpen(false)}
                      style={{
                        display: 'block',
                        textDecoration: 'none',
                        background: n.type === 'warning' ? '#fffbeb' : '#f8fafc',
                        border: n.type === 'warning' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.65rem 0.8rem',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: n.type === 'warning' ? '#b45309' : '#0284c7' }}>
                          {n.type === 'warning' && <i className="fa-solid fa-clock" style={{ marginRight: '5px' }}></i>}
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.time}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.35 }}>
                        {n.message}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kebab / User Menu */}
        <div className="kebab-menu" ref={menuRef}>
          <button
            className="kebab-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: menuOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
            }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div
            className={`kebab-dropdown ${menuOpen ? 'active' : ''}`}
            id="kebab-dropdown"
            style={{
              display: menuOpen ? 'block' : 'none',
              position: 'absolute',
              top: '50px',
              right: 0,
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2)',
              border: '1px solid #e2e8f0',
              minWidth: '220px',
              overflow: 'hidden',
              zIndex: 200,
            }}
          >
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.85rem 1.2rem',
                color: '#0f172a',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <i className="fa-solid fa-gauge" style={{ color: '#0284c7', width: '18px' }}></i> Customer Dashboard
            </Link>
            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.85rem 1.2rem',
                color: '#0f172a',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <i className="fa-solid fa-cart-shopping" style={{ color: '#0284c7', width: '18px' }}></i> My Cart ({cartCount})
            </Link>
            <Link
              href="/profile#tab-settings"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.85rem 1.2rem',
                color: '#0f172a',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <i className="fa-solid fa-gear" style={{ color: '#0284c7', width: '18px' }}></i> Settings
            </Link>
            {isLoggedIn ? (
              <a
                href="#"
                id="logout-link"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.85rem 1.2rem',
                  color: '#ef4444',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                <i className="fa-solid fa-right-from-bracket" style={{ width: '18px' }}></i> Log Out
              </a>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.85rem 1.2rem',
                  color: '#0284c7',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                <i className="fa-solid fa-right-to-bracket" style={{ width: '18px' }}></i> Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

