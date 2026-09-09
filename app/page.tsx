'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const { state } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [storeInventory, setStoreInventory] = useState<DBProduct[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then((data: DBProduct[]) => setStoreInventory(data))
      .catch(() => setStoreInventory(fallbackProducts.map(p => ({ ...p, slug: p.id, originalPrice: p.originalPrice ?? null, badge: p.badge ?? null, description: p.description ?? null, specs: p.specs ?? [] }))));
  }, []);

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); }, 2500);
  };

  const addToCart = (name: string, price: number) => {
    const cart = JSON.parse(sessionStorage.getItem('productCart') || '[]');
    cart.push({ id: Date.now(), name, price });
    sessionStorage.setItem('productCart', JSON.stringify(cart));
    // Dispatch an event so Header can update if needed
    window.dispatchEvent(new Event('storage'));
    showToast('<i class="fa-solid fa-check-circle"></i> ' + name + ' added to cart!');
  };

  const filteredProducts = storeInventory.filter(item => {
    const matchesSearch = item.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(item.brand);
    return matchesSearch && matchesBrand;
  });

  return (
    <>
      <Header />

      {/* Category Nav */}
      <nav className="category-nav">
        <ul className="nav-links">
          <li><Link href="#">All Air Conditioners</Link></li>
          <li><Link href="#">Window Type</Link></li>
          <li><Link href="#">Split Type Inverter</Link></li>
          <li><Link href="#">Floor Standing</Link></li>
          <li><Link href="#">Second Hand Deals</Link></li>
          <li><Link href="#spare-parts">Spare Parts</Link></li>
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

          {/* Brand Filter */}
          <div className="filter-section">
            <div className="filter-title">
              <span>Brand</span>
              <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
            </div>
            {['Panasonic', 'LG', 'Carrier', 'Daikin'].map(brand => (
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
            <label className="filter-option"><input type="checkbox" /> Under ₱20,000</label>
            <label className="filter-option"><input type="checkbox" defaultChecked /> ₱20,000 - ₱40,000</label>
            <label className="filter-option"><input type="checkbox" /> ₱40,000 - ₱60,000</label>
            <label className="filter-option"><input type="checkbox" /> Over ₱60,000</label>
          </div>
        </aside>

        {/* Main Product Area */}
        <main className="products-main">
          {/* Top Toolbar */}
          <div className="product-toolbar">
            <div className="toolbar-count">
              Showing {filteredProducts.length} products
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
                <select className="sort-select">
                  <option>Featured</option>
                  <option>Best Selling</option>
                  <option>Price, low to high</option>
                  <option>Price, high to low</option>
                  <option>Date, new to old</option>
                </select>
              </div>
              <div className="view-toggles">
                <button className="view-btn active"><i className="fa-solid fa-table-cells"></i></button>
                <button className="view-btn"><i className="fa-solid fa-list"></i></button>
              </div>
            </div>
          </div>

          <div className="facets__active-filters" id="active-filters-container"></div>

          {/* Product Grid */}
          <div className="product-grid" id="dynamic-products">
            {filteredProducts.length === 0 ? (
              <div className="empty-cart-msg" style={{ gridColumn: '1 / -1' }}>No products found matching your criteria.</div>
            ) : (
              filteredProducts.map(item => {
                const price = item.price;
                const imgPlaceholder = item.image;
                
                return (
                  <div key={item.id} className="product-card">
                    <img src={imgPlaceholder} alt={item.name} className="product-image" />
                    <div className="product-brand">{item.brand}</div>
                    <h3 className="product-title">{item.name}</h3>
                    <div className="product-price">₱ {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="product-stock">{item.sold} Ratings &bull; {item.rating} Stars</div>
                    <div className="product-actions">
                      <Link href={`/product/${item.slug || item.id}`} className="btn btn-secondary">Details &rarr;</Link>
                      <button className="btn btn-buy" onClick={() => addToCart(`${item.brand} ${item.name}`, price)}>
                        <i className="fa-solid fa-cart-plus"></i> Add
                      </button>
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
          <div className="brand-tile">DAIKIN</div>
          <div className="brand-tile">LG</div>
          <div className="brand-tile">CARRIER</div>
          <div className="brand-tile">PANASONIC</div>
        </div>
      </section>

      {/* Genuine Spare Parts Section */}
      <section id="spare-parts" className="section-container" style={{ background: 'rgba(15, 31, 56, 0.4)', scrollMarginTop: '80px' }}>
        <h2 className="section-title">Genuine Spare Parts</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Keep your units running efficiently with original replacement parts.</p>
        <div className="product-grid">
          <div className="product-card">
            <img src="/hero-bg.png" alt="AC Compressor" className="product-image" style={{ height: '150px' }} />
            <div className="product-brand">Panasonic</div>
            <h3 className="product-title">Inverter Compressor Unit</h3>
            <div className="product-price">₱ 8,500.00</div>
            <div className="product-stock">15 in stock</div>
            <div className="product-actions">
              <button className="btn btn-buy" onClick={() => addToCart('Panasonic Inverter Compressor', 8500)}>
                <i className="fa-solid fa-cart-plus"></i> Add
              </button>
            </div>
          </div>
          <div className="product-card">
            <img src="/service-bg.png" alt="Air Filter" className="product-image" style={{ height: '150px' }} />
            <div className="product-brand">Carrier</div>
            <h3 className="product-title">High-Efficiency Air Filter</h3>
            <div className="product-price">₱ 1,200.00</div>
            <div className="product-stock">45 in stock</div>
            <div className="product-actions">
              <button className="btn btn-buy" onClick={() => addToCart('Carrier Air Filter', 1200)}>
                <i className="fa-solid fa-cart-plus"></i> Add
              </button>
            </div>
          </div>
          <div className="product-card">
            <img src="/hero-bg.png" alt="Remote Control" className="product-image" style={{ height: '150px' }} />
            <div className="product-brand">Universal</div>
            <h3 className="product-title">Universal Smart AC Remote</h3>
            <div className="product-price">₱ 850.00</div>
            <div className="product-stock">100+ in stock</div>
            <div className="product-actions">
              <button className="btn btn-buy" onClick={() => addToCart('Universal Smart Remote', 850)}>
                <i className="fa-solid fa-cart-plus"></i> Add
              </button>
            </div>
          </div>
          <div className="product-card">
            <img src="/service-bg.png" alt="Capacitor" className="product-image" style={{ height: '150px' }} />
            <div className="product-brand">LG</div>
            <h3 className="product-title">Dual Run Capacitor 45+5 uF</h3>
            <div className="product-price">₱ 600.00</div>
            <div className="product-stock">30 in stock</div>
            <div className="product-actions">
              <button className="btn btn-buy" onClick={() => addToCart('LG Dual Capacitor', 600)}>
                <i className="fa-solid fa-cart-plus"></i> Add
              </button>
            </div>
          </div>
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

      {/* Toast Notification */}
      <div id="toast" className={`toast ${toastVisible ? 'visible' : ''}`} dangerouslySetInnerHTML={{ __html: toastMessage }}></div>
    </>
  );
}
