'use client';

import { useState, useEffect } from 'react';
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
  price: number;
  originalPrice: number | null;
  rating: number;
  sold: number;
  image: string;
  badge: string | null;
  specs: string[];
  description: string | null;
  horsepower?: string | null;
  variants?: { id: string; condition: string; price: number; stock: number }[];
}


interface InstallationProof {
  id: string;
  customerName: string;
  customerLocation: string;
  customerAvatar: string;
  unitModel: string;
  unitType: 'Split' | 'Window' | 'Floor';
  horsepower: string;
  technicianName: string;
  technicianRole: string;
  jobOrderNo: string;
  installDate: string;
  installType: string;
  rating: number;
  review: string;
  photoUrl: string;
  checklist: string[];
}

const installationProofs: InstallationProof[] = [
  {
    id: 'proof-1',
    customerName: 'Engr. Roberto Martinez',
    customerLocation: 'Quezon City, Metro Manila',
    customerAvatar: 'RM',
    unitModel: 'Carrier Aura Inverter 1.5 HP Split Type',
    unitType: 'Split',
    horsepower: '1.5 HP',
    technicianName: 'Carlos Rivera',
    technicianRole: 'Senior HVAC Field Specialist',
    jobOrderNo: 'JO-2026-4891',
    installDate: 'November 2, 2026',
    installType: 'Standard Back-to-Back Installation',
    rating: 5,
    review: 'Outstanding installation! Technician Carlos arrived right on schedule with complete PPE and a calibrated vacuum pump. Piping was cleanly wrapped with UV insulation tape and sealed. Cooling reached 20°C in less than 4 minutes!',
    photoUrl: '/hero-bg.png',
    checklist: [
      'Vacuum Pressure Tested (-30 inHg / 500 microns)',
      'Flare Nuts Torqued to Carrier Specs',
      'Condensate Gravity Drain Flow Verified',
      'Dedicated 20A Circuit Breaker Installed',
    ],
  },
  {
    id: 'proof-2',
    customerName: 'Dr. Maria Carmela Santos',
    customerLocation: 'BGC, Taguig City',
    customerAvatar: 'MS',
    unitModel: 'Daikin D-Smart King Inverter 2.0 HP',
    unitType: 'Split',
    horsepower: '2.0 HP',
    technicianName: 'Mark Anthony Bautista',
    technicianRole: 'Certified AC Technician #884',
    jobOrderNo: 'JO-2026-4762',
    installDate: 'October 29, 2026',
    installType: 'High-Rise Condominium Balcony Mounting',
    rating: 5,
    review: 'Very neat and polite technician! Our condo admin has strict permits and vibration guidelines. The FrostTech team followed all safety rules, used heavy-duty anti-vibration rubber pads, and left the room spotless.',
    photoUrl: '/service-bg.png',
    checklist: [
      'Condo Admin Safety & Permit Compliant',
      'Heavy-Duty Vibration Dampener Pads',
      'R32 Refrigerant Operating Pressure Normal',
      'Condensate Leak & P-Trap Tested',
    ],
  },
  {
    id: 'proof-3',
    customerName: 'Arch. Kenneth Ramos',
    customerLocation: 'Ortigas, Pasig City',
    customerAvatar: 'KR',
    unitModel: 'Panasonic Premium Inverter 1.0 HP Split Type',
    unitType: 'Split',
    horsepower: '1.0 HP',
    technicianName: 'Carlos Rivera',
    technicianRole: 'Senior HVAC Field Specialist',
    jobOrderNo: 'JO-2026-4630',
    installDate: 'October 25, 2026',
    installType: 'Living Room Concealed Trunking Setup',
    rating: 5,
    review: 'As an architect, aesthetics matter a lot to me. The FrostTech technicians routed the copper tubings and drainage seamlessly along the molding with clean white trunking. Unit looks sleek and whisper quiet!',
    photoUrl: '/Inverter.jpg',
    checklist: [
      'Precision Tube Bending Without Kinks',
      'Aesthetic Wall Trunking Installed',
      'Electrical Grounding & Amperage Normal',
      'Full Remote Handover & Function Briefing',
    ],
  },
  {
    id: 'proof-4',
    customerName: 'Lourdes & Antonio Dela Cruz',
    customerLocation: 'Marikina Heights, Marikina',
    customerAvatar: 'DC',
    unitModel: 'Condura Prima Standard Window Type 1.5 HP',
    unitType: 'Window',
    horsepower: '1.5 HP',
    technicianName: 'Arnel Salcedo',
    technicianRole: 'Window AC Mounting Specialist',
    jobOrderNo: 'JO-2026-4518',
    installDate: 'October 20, 2026',
    installType: 'Window Frame Custom Steel Bracket Mount',
    rating: 5,
    review: 'Fast and seamless window AC setup. They fabricated a heavy-duty steel bracket outside for extra safety and sealed all window gaps with high-grade weather foam so no cool air escapes. Highly recommended!',
    photoUrl: '/Window.jpg',
    checklist: [
      'Heavy-Duty Exterior Steel Bracket Anchored',
      'Weatherproof Polyurethane Sealant Applied',
      'Proper 1/4 inch Drainage Tilt Angle Set',
      'Operating Wattage & Temperature Verified',
    ],
  },
  {
    id: 'proof-5',
    customerName: 'Atty. Ferdinand Morales',
    customerLocation: 'Ayala Alabang, Muntinlupa',
    customerAvatar: 'FM',
    unitModel: 'Samsung WindFree Elite Inverter 2.5 HP',
    unitType: 'Split',
    horsepower: '2.5 HP',
    technicianName: 'Mark Anthony Bautista',
    technicianRole: 'Certified AC Technician #884',
    jobOrderNo: 'JO-2026-4402',
    installDate: 'October 16, 2026',
    installType: 'Master Suite Split Inverter Installation',
    rating: 5,
    review: 'The WindFree technology is amazing and technician Mark took extra time to demonstrate how to configure the SmartThings Wi-Fi connectivity on my phone. Very knowledgeable and thorough technician!',
    photoUrl: '/service-bg.png',
    checklist: [
      'SmartThings Wi-Fi Module Paired',
      'Nitrogen Pressure Leak Check Passed',
      'Ultra-Silent Compressor Vibration Verified',
      'Official FrostTech Warranty Card Signed',
    ],
  },
  {
    id: 'proof-6',
    customerName: 'Katrina Joy Lim',
    customerLocation: 'Greenhills, San Juan City',
    customerAvatar: 'KL',
    unitModel: 'TCL FreshIN Inverter 1.5 HP Split Type',
    unitType: 'Split',
    horsepower: '1.5 HP',
    technicianName: 'Carlos Rivera & Team',
    technicianRole: 'FrostTech Field Service Team',
    jobOrderNo: 'JO-2026-4310',
    installDate: 'October 12, 2026',
    installType: 'Fresh Air Intake & Inverter AC Setup',
    rating: 5,
    review: 'Technicians arrived on time in complete uniform and service van. Used dust collection vacuum while core-drilling, so zero wall dust on my furniture. Unit cooling is ice-cold and fresh air system works great!',
    photoUrl: '/hero-bg.png',
    checklist: [
      'Clean Core Drilling With Dust Collector',
      'Fresh Air Ducting Sealed & Tested',
      'Condensate Pump Connected & Inspected',
      'Official Work Order & Receipt Provided',
    ],
  },
];

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
  const [selectedProofModal, setSelectedProofModal] = useState<InstallationProof | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<'All' | 'Split' | 'Window'>('All');
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
    
  const topBrandLogos = [
    {
      name: 'Carrier',
      logo: (
        <svg viewBox="0 0 160 52" width="125" height="40" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="80" cy="26" rx="76" ry="24" fill="#003da5" />
          <ellipse cx="80" cy="26" rx="72" ry="20" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <text x="80" y="34" fontFamily="'Brush Script MT', 'Segoe Script', cursive, sans-serif" fontSize="30" fontWeight="bold" fontStyle="italic" fill="#ffffff" textAnchor="middle">Carrier</text>
        </svg>
      ),
    },
    {
      name: 'Daikin',
      logo: (
        <svg viewBox="0 0 160 46" width="130" height="36" xmlns="http://www.w3.org/2000/svg">
          <polygon points="14,35 34,9 34,35" fill="#0097e6" />
          <polygon points="26,35 34,22 34,35" fill="#005ea6" />
          <text x="96" y="32" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="24" fontWeight="900" letterSpacing="1px" fill="#0097e6" textAnchor="middle">DAIKIN</text>
        </svg>
      ),
    },
    {
      name: 'Panasonic',
      logo: (
        <svg viewBox="0 0 160 42" width="135" height="34" xmlns="http://www.w3.org/2000/svg">
          <text x="80" y="29" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="22" fontWeight="900" letterSpacing="1px" fill="#004098" textAnchor="middle">Panasonic</text>
        </svg>
      ),
    },
    {
      name: 'Samsung',
      logo: (
        <svg viewBox="0 0 160 42" width="135" height="34" xmlns="http://www.w3.org/2000/svg">
          <text x="80" y="29" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="24" fontWeight="900" letterSpacing="2px" fill="#1428a0" textAnchor="middle">SAMSUNG</text>
        </svg>
      ),
    },
    {
      name: 'Midea',
      logo: (
        <svg viewBox="0 0 150 44" width="125" height="36" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="14" fill="#00b0b9" />
          <path d="M14 22 Q22 10 30 22" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
          <text x="88" y="30" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="24" fontWeight="800" fill="#002d72" textAnchor="middle">Midea</text>
        </svg>
      ),
    },
    {
      name: 'TCL',
      logo: (
        <svg viewBox="0 0 140 44" width="115" height="36" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="5" width="124" height="34" rx="8" fill="#e60012" />
          <text x="70" y="30" fontFamily="'Inter', 'Arial Black', sans-serif" fontSize="24" fontWeight="900" letterSpacing="2px" fill="#ffffff" textAnchor="middle">TCL</text>
        </svg>
      ),
    },
    {
      name: 'Condura',
      logo: (
        <svg viewBox="0 0 160 46" width="130" height="38" xmlns="http://www.w3.org/2000/svg">
          <text x="80" y="27" fontFamily="'Inter', 'Arial Black', sans-serif" fontSize="21" fontWeight="900" fill="#0f2b5c" textAnchor="middle">CONDURA</text>
          <path d="M38 34 Q80 44 122 34" stroke="#e60012" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      name: 'Kolin',
      logo: (
        <svg viewBox="0 0 150 42" width="125" height="34" xmlns="http://www.w3.org/2000/svg">
          <text x="76" y="29" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="25" fontWeight="900" letterSpacing="1px" fill="#0284c7" textAnchor="middle">kolin</text>
          <circle cx="118" cy="15" r="3.5" fill="#10b981" />
        </svg>
      ),
    },
  ];

  const handleBrandTileClick = (brandName: string) => {
    if (selectedBrands.some(b => b.toLowerCase() === brandName.toLowerCase())) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands([brandName]);
    }
    setSelectedCategory('All');
    const productsEl = document.getElementById('products');
    if (productsEl) {
      productsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
                    (selectedCategory === 'Spare Parts' && isSpareCategory)
        );
    
    const matchesPrice = selectedPrices.length === 0 || selectedPrices.some(range => {
      if (range === 'under-20k') return item.price < 20000;
      if (range === '20k-40k') return item.price >= 20000 && item.price <= 40000;
      if (range === '40k-60k') return item.price > 40000 && item.price <= 60000;
      if (range === 'over-60k') return item.price > 60000;
      return false;
    });
    
    const matchesType = selectedTypes.length === 0 || selectedTypes.some(type => {
      if (type === 'Spare Parts') return isSpareCategory;
      if (type === 'Air Conditioners') return !isSpareCategory;
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


  const showDashboard = mounted && isCustomerLoggedIn;

  if (showDashboard) {
    return <ProfilePage />;
  }

  return (
    <>
      <Header />

      {/* Customer Shop Navigation Bar */}
      {isCustomerLoggedIn && (
        <div style={{ background: '#d8e9fd', borderBottom: '1px solid #b9d4f6', padding: '0.65rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: '#06255b', fontWeight: 700 }}>
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
          
          <li className={selectedCategory === 'Spare Parts' ? 'active' : ''}><a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Spare Parts'); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}}>Spare Parts</a></li>
          <li className={selectedCategory === 'Customer Feedback' ? 'active' : ''}><Link href="/feedback"><i className="fa-solid fa-shield-check" style={{ marginRight: '6px', fontSize: '0.82rem' }}></i>Customer Feedback</Link></li>
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
                      <div className="product-tag-row">
                        {item.horsepower && (
                          <span className="product-hp-tag">
                            <i className="fa-solid fa-bolt"></i> {item.horsepower}
                          </span>
                        )}
                        {item.category && !['Parts', 'Spare Parts', 'Parts & Accessories'].includes(item.category) && (
                          <span className={`product-type-tag ${item.category.toLowerCase().includes('inverter') ? 'inverter' : ''}`}>
                            {item.category.toLowerCase().includes('inverter') ? '⚡ Inverter' : item.category}
                          </span>
                        )}
                      </div>
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
                      {(() => {
                        const totalStock = item.variants ? item.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) : 0;
                        if (totalStock > 5) return <div className="product-stock-status in-stock"><i className="fa-solid fa-circle-check"></i> In Stock</div>;
                        if (totalStock > 0) return <div className="product-stock-status low-stock"><i className="fa-solid fa-triangle-exclamation"></i> Only {totalStock} left</div>;
                        return <div className="product-stock-status out-of-stock"><i className="fa-solid fa-circle-xmark"></i> Out of Stock</div>;
                      })()}
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
