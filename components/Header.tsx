'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Get cart count
    try {
      const cart = JSON.parse(sessionStorage.getItem('productCart') || '[]');
      setCartCount(cart.length);
    } catch {
      setCartCount(0);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('isTech');
    sessionStorage.removeItem('isCustomer');
    window.location.reload();
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header>
      <Link href="/" className="logo">
        <img src="/LOGO.jpg" alt="FrostTech Logo" className="logo-mark" />
        <span className="logo-text">FrostTech</span>
      </Link>

      <div className="search-bar">
        <input type="text" id="search-input" placeholder="Search for air conditioners, brands..." />
        <button id="search-btn"><i className="fa-solid fa-magnifying-glass"></i></button>
      </div>

      <div className="header-icons">
        <div className="kebab-menu" ref={menuRef}>
          <button className="kebab-btn" onClick={toggleMenu}><i className="fa-solid fa-bars"></i></button>
          <div className={`kebab-dropdown ${menuOpen ? 'active' : ''}`} id="kebab-dropdown">
            <Link href="/profile"><i className="fa-solid fa-user"></i> My Profile</Link>
            <Link href="/cart"><i className="fa-solid fa-cart-shopping"></i> My Cart (<span id="cart-count">{cartCount}</span>)</Link>
            <div className="divider"></div>
            <Link href="/profile#settings"><i className="fa-solid fa-gear"></i> Settings</Link>
            <a href="#" id="logout-link" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Log Out</a>
          </div>
        </div>
      </div>
    </header>
  );
}
