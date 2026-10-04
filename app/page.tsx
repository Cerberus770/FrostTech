'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAppState } from '@/context/AppStateContext';
import { products as fallbackProducts } from '@/lib/products';

interface DBProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
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
        setPendingCartItem({ name, price, brand, image, productId });
        setShowDownpaymentModal(true);
        return;
      }
    }

    const actualProductId = productId || 'PROD-' + Date.now();
    const itemImage = image || '/hero-bg.png';
    const itemBrand = brand || '';

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
    } else {
      const cart = JSON.parse(localStorage.getItem('frostTechCart') || '[]');
      const existing = cart.find((i: any) => i.productId === actualProductId || i.name === name);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id: Date.now(), productId: actualProductId, name, brand: itemBrand, price, quantity: 1, image: itemImage });
      }
      localStorage.setItem('frostTechCart', JSON.stringify(cart));
    }
    
    // Toast notification
    showToast('<i class="fa-solid fa-check-circle"></i> ' + name + ' added to cart!');
  };

  const filteredProducts = storeInventory.filter(item => {
    const matchesSearch = item.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(item.brand);
    const matchesCategory = selectedCategory === 'All' 
      ? !(item.category === 'Parts' || item.category === 'Spare Parts' || item.category === 'Parts & Accessories')
      : (
          item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          (selectedCategory === 'Second Hand Deals' && item.badge === 'Used') ||
          (selectedCategory === 'Spare Parts' && (item.category === 'Parts' || item.category === 'Spare Parts' || item.category === 'Parts & Accessories'))
        );
    
    const matchesPrice = selectedPrices.length === 0 || selectedPrices.some(range => {
      if (range === 'under-20k') return item.price < 20000;
      if (range === '20k-40k') return item.price >= 20000 && item.price <= 40000;
      if (range === '40k-60k') return item.price > 40000 && item.price <= 60000;
      if (range === 'over-60k') return item.price > 60000;
      return false;
    });
    
    const matchesType = selectedTypes.length === 0 || selectedTypes.some(type => {
      const isPart = item.category === 'Parts' || item.category === 'Spare Parts' || item.category === 'Parts & Accessories';
      if (type === 'Spare Parts') return isPart;
      if (type === 'Air Conditioners') return !isPart;
      return false;
    });

    return matchesSearch && matchesBrand && matchesCategory && matchesPrice && matchesType;
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

  const sparePartProducts = storeInventory.filter(item => 
    item.category === 'Parts' || item.category === 'Spare Parts' || item.category === 'Parts & Accessories'
  );

  return (
    <>
      <Header />

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
            {['Carrier', 'Chiq', 'iFFALCON', 'Midea', 'Samsung', 'TCL'].map(brand => (
              <label key={brand} className="filter-option">
                <input 
                  type="checkbox" 
                  className="brand-filter" 
                  value={brand}
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                /> {brand}
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

          {/* Product Grid */}
          <div className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`} id="dynamic-products">
            {sortedProducts.length === 0 ? (
              <div className="empty-cart-msg" style={{ gridColumn: '1 / -1' }}>No products found matching your criteria.</div>
            ) : (
              sortedProducts.map(item => {
                const price = item.price;
                const imgPlaceholder = item.image;
                
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

      {/* Genuine Spare Parts Section */}
      <section id="spare-parts" className="section-container" style={{ background: 'rgba(15, 31, 56, 0.4)', scrollMarginTop: '80px' }}>
        <h2 className="section-title">Genuine Spare Parts</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Keep your units running efficiently with original replacement parts.</p>
        <div className="product-grid">
          {sparePartProducts.length === 0 ? (
            <div className="empty-cart-msg" style={{ gridColumn: '1 / -1' }}>No spare parts available.</div>
          ) : (
            sparePartProducts.map(item => {
              const price = item.price;
              const imgPlaceholder = item.image || '/hero-bg.png';
              
              return (
                <div 
                  key={item.id} 
                  className="product-card" 
                  onClick={() => router.push(`/product/${item.slug || item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-image-wrapper">
                    <img src={imgPlaceholder} alt={item.name} className="product-image" />
                    {item.badge && <span className="product-badge">{item.badge}</span>}
                  </div>
                  <div className="product-card-body">
                    <div className="product-brand">{item.brand}</div>
                    <h3 className="product-title">{item.name}</h3>
                    <div className="product-price">
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
                    {/* Optional feedback/description area if it's a spare part */}
                    <div className="product-feedback" style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '0.5rem', padding: '0.4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                      <i className="fa-solid fa-quote-left" style={{ opacity: 0.5, marginRight: '4px' }}></i>
                      {item.description ? item.description.substring(0, 50) + "..." : "High-quality genuine replacement part."}
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
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: 'var(--accent-blue)', marginBottom: '1rem' }}></i>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', border: 'none', padding: 0 }}>Downpayment Required</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>As a first-time buyer of Air Conditioning units, a 15% downpayment is required.</p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-light)' }}>{pendingCartItem.name}</span>
                <span style={{ fontWeight: 'bold' }}>₱ {pendingCartItem.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>
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

      {/* Toast Notification */}
      <div id="toast" className={`toast ${toastVisible ? 'visible' : ''}`} dangerouslySetInnerHTML={{ __html: toastMessage }}></div>
    </>
  );
}
