'use client';

import { useState, useEffect, useMemo } from 'react';
import CoolingCalculator from '@/components/CoolingCalculator';
import VisualCategories from '@/components/VisualCategories';
import { getProductBadgeInfo } from '@/lib/productUtils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import ProfilePage from '@/app/profile/page';
import { useAppState } from '@/context/AppStateContext';
import { products as fallbackProducts } from '@/lib/products';

interface DBProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  horsepower?: string | null;
  price: number;
  originalPrice: number | null;
  rating: number;
  sold: number;
  image: string;
  badge: string | null;
  specs: string[];
  description: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedHp, setSelectedHp] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Featured');
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [storeInventory, setStoreInventory] = useState<DBProduct[]>([]);
  
  // Downpayment state
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [showDownpaymentModal, setShowDownpaymentModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<any>(null);

  // Auth modal state for guest add-to-cart
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAuthCartItem, setPendingAuthCartItem] = useState<any>(null);

  // Auth & Dashboard switch state
  const [mounted, setMounted] = useState(false);
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      const role = sessionStorage.getItem('userRole');
      const isCust = sessionStorage.getItem('isCustomer') === 'true' || role === 'CUSTOMER';
      setIsCustomerLoggedIn(loggedIn && isCust);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      // Optional: scroll to products if there's a search query
      setTimeout(() => {
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: DBProduct[]) => setStoreInventory(data))
      .catch(() => setStoreInventory(fallbackProducts.map(p => ({ ...p, slug: p.id, originalPrice: p.originalPrice ?? null, badge: p.badge ?? null, description: p.description ?? null, specs: p.specs ?? [] }))));

    const userId = sessionStorage.getItem('userId');
    if (userId) {
      fetch(`/api/user/status?userId=${userId}`)
        .then(r => r.json())
        .then(data => setIsNewCustomer(data.isNewCustomer))
        .catch(console.error);
    } else {
      setIsNewCustomer(true);
    }
  }, []);

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleHpChange = (hp: string) => {
    setSelectedHp(prev => 
      prev.includes(hp) ? prev.filter(h => h !== hp) : [...prev, hp]
    );
  };

  const handlePriceChange = (priceRange: string) => {
    setSelectedPrices(prev => 
      prev.includes(priceRange) ? prev.filter(p => p !== priceRange) : [...prev, priceRange]
    );
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); }, 2500);
  };

    const addToCart = async (name: string, price: number, brand?: string, image?: string, productId?: string, skipModal?: boolean) => {
    const actualProductId = productId || 'PROD-' + Date.now();
    const itemImage = image || '/hero-bg.png';
    const itemBrand = brand || '';

    // 1. Force login/register: if guest, prompt AuthModal immediately
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
      setPendingAuthCartItem({ name, price, brand: itemBrand, image: itemImage, productId: actualProductId });
      setShowAuthModal(true);
      return;
    }

    const userId = sessionStorage.getItem('userId');

    // Check if it's an AC (price > 10000 heuristic)
    if (price > 10000 && !skipModal) {
      // Dynamically fetch status to ensure it's up-to-date
      let isNew = isNewCustomer;
      if (userId) {
        try {
          const res = await fetch(`/api/user/status?userId=${userId}`);
          const data = await res.json();
          isNew = data.isNewCustomer;
          setIsNewCustomer(isNew);
        } catch (e) {}
      } else {
        isNew = true; // Guests are considered new customers for downpayment purposes
      }

      if (isNew) {
        setPendingCartItem({ name, price, brand: itemBrand, image: itemImage, productId: actualProductId });
        setShowDownpaymentModal(true);
        return;
      }
    }

    // 1. Always update local storage for immediate UI responsiveness & Header count
    try {
      const cart = JSON.parse(localStorage.getItem('frostTechCart') || '[]');
      const existing = cart.find((i: any) => i.productId === actualProductId || i.name === name);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id: Date.now(), productId: actualProductId, name, brand: itemBrand, price, quantity: 1, image: itemImage, addedAt: Date.now() });
      }
      localStorage.setItem('frostTechCart', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.error('Local cart error:', e);
    }

    // 2. If logged in, sync to database & reduce inventory stock
    if (userId) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            productId: actualProductId,
            name,
            brand: itemBrand,
            price,
            image: itemImage,
            quantity: 1
          })
        });
      } catch (err) {
        console.error('Failed to add to cart API', err);
      }
    }
    
    // Toast notification
    showToast('<i class="fa-solid fa-check-circle"></i> ' + name + ' added to cart!');
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: storeInventory.length,
      Split: 0,
      Window: 0,
      Floor: 0,
      'Second Hand Deals': 0,
      'Spare Parts': 0,
    };
    storeInventory.forEach(item => {
      const badge = getProductBadgeInfo(item);
      const catLower = (item.category || '').toLowerCase();
      const isSpare = catLower.includes('part') || badge.typeLabel === 'Spare Part';

      if (item.badge === 'Used') counts['Second Hand Deals'] = (counts['Second Hand Deals'] || 0) + 1;
      if (isSpare) counts['Spare Parts'] = (counts['Spare Parts'] || 0) + 1;
      if (catLower.includes('split') || badge.typeLabel === 'Split Type') counts['Split'] = (counts['Split'] || 0) + 1;
      if (catLower.includes('window') || badge.typeLabel === 'Window Type') counts['Window'] = (counts['Window'] || 0) + 1;
      if (catLower.includes('floor') || badge.typeLabel === 'Floor Standing') counts['Floor'] = (counts['Floor'] || 0) + 1;
    });
    return counts;
  }, [storeInventory]);

  const productCountForHp = (targetHp: string) => {
    return storeInventory.filter(item => {
      const badge = getProductBadgeInfo(item);
      if (!badge.hp) return false;
      return badge.hp.toLowerCase().replace(/\s/g, '') === targetHp.toLowerCase().replace(/\s/g, '');
    }).length;
  };

  const defaultBrands = ['Carrier', 'Chiq', 'iFFALCON', 'Midea', 'Samsung', 'TCL'];
  const availableBrands = Array.from(
    new Set([
      ...defaultBrands,
      ...storeInventory.map((p) => p.brand).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const filteredProducts = storeInventory.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const specsString = (item.specs || []).join(' ').toLowerCase();
    const descString = (item.description || '').toLowerCase();
    const brandLower = (item.brand || '').toLowerCase();
    const nameLower = (item.name || '').toLowerCase();
    const catLower = (item.category || '').toLowerCase();

    // Check brand, name, category, specs array, and description
    const matchesSearch = !q ||
      brandLower.includes(q) ||
      nameLower.includes(q) ||
      catLower.includes(q) ||
      specsString.includes(q) ||
      descString.includes(q);

    const matchesBrand = selectedBrands.length === 0 || selectedBrands.some(b => b.toLowerCase() === (item.brand || '').toLowerCase());
    const isSpareCategory = item.category === 'Parts' || item.category === 'Spare Parts' || item.category === 'Parts & Accessories';

    const matchesCategory = selectedCategory === 'All' 
      ? true
      : (
          catLower.includes(selectedCategory.toLowerCase()) ||
          (selectedCategory === 'Second Hand Deals' && item.badge === 'Used') ||
          (selectedCategory === 'Spare Parts' && isSpareCategory)
        );
    
    const matchesPrice = selectedPrices.length === 0 || selectedPrices.some(range => {
      if (range === 'under-20k') return item.price < 20000;
      if (range === '20k-40k') return item.price >= 20000 && item.price <= 40000;
      if (range === '40k-60k') return item.price > 40000 && item.price <= 60000;
      if (range === 'over-60k') return item.price > 60000;
      return false;
    });
    
    const badgeInfo = getProductBadgeInfo(item);
    const matchesHp = selectedHp.length === 0 || selectedHp.some(hp => {
      if (!badgeInfo.hp) return false;
      if (hp === '2.5 HP+') {
        const val = parseFloat(badgeInfo.hp);
        return val >= 2.5;
      }
      return badgeInfo.hp.toLowerCase().replace(/\s/g, '') === hp.toLowerCase().replace(/\s/g, '');
    });

    const matchesType = selectedTypes.length === 0 || selectedTypes.some(type => {
      if (type === 'Spare Parts') return isSpareCategory;
      if (type === 'Air Conditioners') return !isSpareCategory;
      return false;
    });

    return matchesSearch && matchesBrand && matchesCategory && matchesPrice && matchesType && matchesHp;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'Price, low to high':
        return a.price - b.price;
      case 'Price, high to low':
        return b.price - a.price;
      case 'Best Selling':
        return b.sold - a.sold;
      case 'Date, new to old':
        return b.rating - a.rating; // fallback to rating since no date
      case 'Featured':
      default:
        return 0;
    }
  });


  const showDashboard = mounted && isCustomerLoggedIn;

  if (showDashboard) {
    return <ProfilePage />;
  }

  return (
    <>
      <Header />

      {/* Customer Shop Navigation Bar */}
      {isCustomerLoggedIn && (
        <div style={{ background: '#e0f2fe', borderBottom: '1px solid #bae6fd', padding: '0.65rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: '#0369a1', fontWeight: 600 }}>
            <i className="fa-solid fa-store" style={{ marginRight: '6px' }}></i>
            Browsing Air Conditioners & Parts Catalog
          </span>
          <Link
            href="/"
            style={{
              background: '#0284c7',
              color: 'white',
              padding: '5px 16px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            &larr; Return to Customer Dashboard
          </Link>
        </div>
      )}

      {/* Category Nav */}
      <nav className="category-nav">
        <ul className="nav-links">
          <li className={selectedCategory === 'All' ? 'active' : ''}><a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('All'); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}}>All Air Conditioners</a></li>
          <li className={selectedCategory === 'Window' ? 'active' : ''}><a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Window'); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}}>Window Type</a></li>
          <li className={selectedCategory === 'Split' ? 'active' : ''}><a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Split'); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}}>Split Type Inverter</a></li>
          <li className={selectedCategory === 'Floor' ? 'active' : ''}><a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Floor'); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}}>Floor Standing</a></li>
          <li className={selectedCategory === 'Second Hand Deals' ? 'active' : ''}><a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Second Hand Deals'); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}}>Second Hand Deals</a></li>
          <li className={selectedCategory === 'Spare Parts' ? 'active' : ''}><a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Spare Parts'); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}}>Spare Parts</a></li>
        </ul>
      </nav>

      {/* Promotional Banner (Shopee Style) */}
      <section className="shopee-banner-section">
        <div className="shopee-main-banner">
          <div className="main-banner-content">
            <span className="badge">FREE SHIPPING ARAW-ARAW</span>
            <h2>LESS GASTOS WHEN YOU<br />SHOP FROM HOME!</h2>
            <p>UNLI ₱249 MIN. SPEND • Free Standard Installation</p>
            <Link href="#products" className="btn">Shop Now &rarr;</Link>
          </div>
          <img src="/hero-bg.png" alt="Main AC Promo" className="main-banner-img" />

          {/* Carousel Dots */}
          <div className="carousel-dots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>

        <div className="shopee-side-banners">
          <div className="side-banner side-banner-top">
            <div className="side-banner-content">
              <h4><i className="fa-solid fa-shield-heart"></i> FrostCare Protect</h4>
              <p>EXTENDED WARRANTY FOR<br />CRITICAL BREAKDOWNS</p>
              <span className="small-text">Up to ₱50,000 coverage</span>
            </div>
            <img src="/service-bg.png" alt="FrostCare" className="side-banner-img" />
          </div>
          <div className="side-banner side-banner-bottom">
            <div className="side-banner-content">
              <h4><i className="fa-solid fa-building-columns"></i> Metrobank</h4>
              <p>EXTRA ₱1,500 OFF<br /><span className="highlight">EVERY FRIDAY</span></p>
              <div className="tags">
                <span><i className="fa-solid fa-truck"></i> Free Ship</span>
                <span><i className="fa-solid fa-tags"></i> Vouchers</span>
              </div>
            </div>
            <img src="/hero-bg.png" alt="Bank Promo" className="side-banner-img" />
          </div>
        </div>
      </section>

            {/* Visual Category Navigation Grid */}
      <VisualCategories
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
        }}
        categoryCounts={categoryCounts}
      />

      {/* Room Size & Horsepower Calculator */}
      <CoolingCalculator
        onSelectHp={(recHp) => {
          setSelectedHp([recHp]);
          if (selectedCategory === 'Spare Parts') {
            setSelectedCategory('All');
          }
        }}
        productCountForHp={productCountForHp}
      />

      {/* Main Products Section */}
      <section id="products" className="store-layout section-container">
        {/* Sidebar Filters */}
        <aside className={`sidebar-filters ${mobileFiltersOpen ? 'active' : ''}`}>
          <h3>
            <i className="fa-solid fa-filter"></i> Filters
          </h3>

          {/* Product Type Filter */}
          <div className="filter-section">
            <div className="filter-title">
              <span>Product Type</span>
              <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
            </div>
            {['Air Conditioners', 'Spare Parts'].map(type => (
              <label key={type} className="filter-option">
                <input 
                  type="checkbox" 
                  value={type}
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeChange(type)}
                /> {type}
              </label>
            ))}
          </div>

          {/* Brand Filter */}
          <div className="filter-section">
            <div className="filter-title">
              <span>Brand</span>
              <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
            </div>
            {availableBrands.map(brand => (
              <label key={brand} className="filter-option">
                <input 
                  type="checkbox" 
                  className="brand-filter" 
                  value={brand}
                  checked={selectedBrands.some(b => b.toLowerCase() === brand.toLowerCase())}
                  onChange={() => handleBrandChange(brand)}
                /> {brand}
              </label>
            ))}
          </div>

          {/* Horsepower Filter */}
          <div className="filter-section">
            <div className="filter-title">
              <span>Horsepower (HP)</span>
              <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
            </div>
            {['0.75 HP', '1.0 HP', '1.5 HP', '2.0 HP', '2.5 HP+'].map(hp => (
              <label key={hp} className="filter-option">
                <input 
                  type="checkbox" 
                  value={hp}
                  checked={selectedHp.includes(hp)} 
                  onChange={() => handleHpChange(hp)} 
                /> {hp}
              </label>
            ))}
          </div>

          {/* Price Filter */}
          <div className="filter-section">
            <div className="filter-title">
              <span>Price Range</span>
              <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
            </div>
            <label className="filter-option">
              <input type="checkbox" checked={selectedPrices.includes('under-20k')} onChange={() => handlePriceChange('under-20k')} /> Under ₱20,000
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={selectedPrices.includes('20k-40k')} onChange={() => handlePriceChange('20k-40k')} /> ₱20,000 - ₱40,000
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={selectedPrices.includes('40k-60k')} onChange={() => handlePriceChange('40k-60k')} /> ₱40,000 - ₱60,000
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={selectedPrices.includes('over-60k')} onChange={() => handlePriceChange('over-60k')} /> Over ₱60,000
            </label>
          </div>
        </aside>

        {/* Main Product Area */}
        <main className="products-main">
          {/* Top Toolbar */}
          <div className="product-toolbar">
            <div className="toolbar-count">
              Showing {sortedProducts.length} products
            </div>
            <div className="toolbar-actions">
              <button 
                id="mobile-filter-btn" 
                className="btn btn-secondary mobile-only"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              >
                <i className="fa-solid fa-filter"></i> Filters
              </button>
              <div className="sort-group">
                <label>Sort By:</label>
                <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option>Featured</option>
                  <option>Best Selling</option>
                  <option>Price, low to high</option>
                  <option>Price, high to low</option>
                  <option>Date, new to old</option>
                </select>
              </div>
              <div className="view-toggles">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><i className="fa-solid fa-table-cells"></i></button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><i className="fa-solid fa-list"></i></button>
              </div>
            </div>
          </div>

          <div className="facets__active-filters" id="active-filters-container"></div>

          {searchQuery.trim() && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.25rem',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
                color: '#0369a1',
                boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-magnifying-glass"></i>
                <span>
                  Search results for: <strong>"{searchQuery}"</strong> ({sortedProducts.length} product{sortedProducts.length === 1 ? '' : 's'} found)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  router.push('/');
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <i className="fa-solid fa-xmark"></i> Clear Search
              </button>
            </div>
          )}

                    {selectedHp.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem', padding: '0.65rem 1rem', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1' }}>
                <i className="fa-solid fa-bolt" style={{ marginRight: '4px' }}></i> Active HP Filter:
              </span>
              {selectedHp.map(hp => (
                <span key={hp} className="active-filter-badge" style={{ margin: 0 }}>
                  {hp}
                  <button
                    type="button"
                    onClick={() => handleHpChange(hp)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', marginLeft: '4px', fontSize: '1rem', lineHeight: 1 }}
                  >
                    &times;
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setSelectedHp([])}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', marginLeft: 'auto' }}
              >
                Clear HP filter
              </button>
            </div>
          )}

          {/* Product Grid */}
          <div className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`} id="dynamic-products">
            {sortedProducts.length === 0 ? (
              <div
                className="empty-cart-msg"
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.5rem', color: '#cbd5e1', display: 'block', marginBottom: '1rem' }}></i>
                <h3 style={{ margin: '0 0 0.5rem', color: '#334155', fontSize: '1.2rem' }}>No products found</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  {searchQuery.trim()
                    ? `We couldn't find any products matching "${searchQuery}". Try different keywords or clear your search.`
                    : 'No products match your selected filters.'}
                </p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="btn btn-secondary"
                    style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fa-solid fa-arrow-rotate-left"></i> Clear Search
                  </button>
                )}
              </div>
            ) : (
              sortedProducts.map(item => {
                const price = item.price;
                const imgPlaceholder = item.image;
                const badgeInfo = getProductBadgeInfo(item);
                
                return (
                  <div 
                    key={item.id} 
                    className="product-card" 
                    onClick={() => router.push(`/product/${item.slug || item.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-image-wrapper">
                      {item.badge && <span className="product-badge">{item.badge}</span>}
                      <img src={imgPlaceholder} alt={item.name} className="product-image" />
                    </div>
                    <div className="product-card-body">
                      <div className="product-brand">{item.brand}</div>
                      <h3 className="product-title">{item.name}</h3>
                      {/* Spec Chips (HP, Inverter, AC Type) */}
                      <div className="product-chips-row">
                        {badgeInfo.hp && (
                          <span className="product-chip hp-chip" title="Cooling Capacity">
                            <i className="fa-solid fa-bolt" style={{ color: '#fde047' }}></i> {badgeInfo.hp}
                          </span>
                        )}
                        {badgeInfo.isInverter && (
                          <span className="product-chip inverter-chip" title="Inverter Technology">
                            <i className="fa-solid fa-leaf" style={{ color: '#6ee7b7' }}></i> Inverter
                          </span>
                        )}
                        {badgeInfo.typeLabel && (
                          <span className="product-chip type-chip">
                            {badgeInfo.typeLabel}
                          </span>
                        )}
                      </div>
                      <div className="product-price">
                        {(item as any).variants && (item as any).variants.length > 1 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginRight: '4px' }}>From</span>
                        )}
                        ₱ {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        {item.originalPrice && item.originalPrice > price && (
                          <span className="original-price">₱ {item.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        )}
                      </div>
                      <div className="product-rating">
                        <span className="stars">
                          {'★'.repeat(Math.floor(item.rating))}{'☆'.repeat(5 - Math.floor(item.rating))}
                        </span>
                        <span>{item.rating}</span>
                        <span className="sold-count">&bull; {item.sold} sold</span>
                      </div>
                      <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/product/${item.slug || item.id}`} className="btn btn-secondary">
                          <i className="fa-solid fa-eye"></i> Details
                        </Link>
                        <button className="btn btn-buy" onClick={(e) => { e.stopPropagation(); addToCart(`${item.brand} ${item.name}`, price, item.brand, imgPlaceholder, item.id); }}>
                          <i className="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </section>

      {/* Brands Section */}
      <section className="section-container">
        <h2 className="section-title">Shop by Top Brands</h2>
        <div className="brand-grid">
          <div className="brand-tile">CARRIER</div>
          <div className="brand-tile">CHIQ</div>
          <div className="brand-tile">iFFALCON</div>
          <div className="brand-tile">MIDEA</div>
          <div className="brand-tile">SAMSUNG</div>
          <div className="brand-tile">TCL</div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-grid">
          <div className="footer-col">
            <h3>Customer Service</h3>
            <ul>
              <li><Link href="#">Contact Us</Link></li>
              <li><Link href="#">Track Order</Link></li>
              <li><Link href="#">Return Policy</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>About FrostTech</h3>
            <ul>
              <li><Link href="#">Our Story</Link></li>
              <li><Link href="#">Store Locations</Link></li>
              <li><Link href="#">Careers</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Connect With Us</h3>
            <ul>
              <li>
                <a href="https://www.facebook.com/FrostTechCoolingSolutionsCo" target="_blank" rel="noreferrer">
                  <i className="fa-brands fa-facebook"></i> Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2026 FrostTech Cooling Solutions Co. All rights reserved.
        </div>
      </footer>

      {/* Downpayment Modal */}
      {showDownpaymentModal && pendingCartItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '90%', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: '#38bdf8', marginBottom: '1rem' }}></i>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', border: 'none', padding: 0 }}>Downpayment Required</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>As a first-time buyer of Air Conditioning units, a 15% downpayment is required.</p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-light)' }}>{pendingCartItem.name}</span>
                <span style={{ fontWeight: 'bold' }}>₱ {pendingCartItem.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', color: '#38bdf8', fontWeight: 'bold' }}>
                <span>15% Downpayment</span>
                <span>₱ {(pendingCartItem.price * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                setShowDownpaymentModal(false);
                setPendingCartItem(null);
              }}>Cancel</button>
              <button className="btn btn-buy" style={{ flex: 1 }} onClick={() => {
                setShowDownpaymentModal(false);
                addToCart(pendingCartItem.name, pendingCartItem.price, pendingCartItem.brand, pendingCartItem.image, pendingCartItem.productId, true);
                setPendingCartItem(null);
              }}>I Understand, Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for guest add-to-cart */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAuthCartItem(null);
        }}
        onSuccess={() => {
          setShowAuthModal(false);
          // After successful login, retry the pending add-to-cart
          if (pendingAuthCartItem) {
            const item = pendingAuthCartItem;
            setPendingAuthCartItem(null);
            // Small delay to ensure session is set
            setTimeout(() => {
              addToCart(item.name, item.price, item.brand, item.image, item.productId);
            }, 300);
          }
        }}
        actionPrompt="Please sign in or create an account to add items to your cart."
      />

      {/* Toast Notification */}
      <div id="toast" className={`toast ${toastVisible ? 'visible' : ''}`} dangerouslySetInnerHTML={{ __html: toastMessage }}></div>
    </>
  );
}
