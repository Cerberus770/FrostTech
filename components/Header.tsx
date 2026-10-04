'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header({ hideSearch = false }: { hideSearch?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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
    setIsLoggedIn(sessionStorage.getItem('isLoggedIn') === 'true');

    // Listen for storage events (fired by addToCart)
    window.addEventListener('storage', updateCartCount);

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('storage', updateCartCount);
    };
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

      {!hideSearch && (
        <form className="search-bar" onSubmit={(e) => {
          e.preventDefault();
          const query = (document.getElementById('search-input') as HTMLInputElement).value;
          if (query.trim()) {
            router.push(`/?q=${encodeURIComponent(query.trim())}`);
          } else {
            router.push('/');
          }
        }}>
          <input type="text" id="search-input" placeholder="Search for air conditioners, brands..." />
          <button type="submit" id="search-btn"><i className="fa-solid fa-magnifying-glass"></i></button>
        </form>
      )}

      <div className="header-icons">
        <div className="kebab-menu" ref={menuRef}>
          <button className="kebab-btn" onClick={toggleMenu}><i className="fa-solid fa-bars"></i></button>
          <div className={`kebab-dropdown ${menuOpen ? 'active' : ''}`} id="kebab-dropdown">
            <Link href="/profile"><i className="fa-solid fa-user"></i> My Profile</Link>
            <Link href="/cart"><i className="fa-solid fa-cart-shopping"></i> My Cart (<span id="cart-count">{cartCount}</span>)</Link>
            <div className="divider"></div>
            <Link href="/profile#settings"><i className="fa-solid fa-gear"></i> Settings</Link>
            {isLoggedIn ? (
              <a href="#" id="logout-link" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Log Out</a>
            ) : (
              <Link href="/login"><i className="fa-solid fa-right-to-bracket"></i> Log In</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
