'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface CustomerFeedback {
  id: string;
  customerName: string;
  customerLocation?: string;
  customerAvatar?: string;
  unitModel: string;
  serviceType?: string;
  rating: number;
  review: string;
  verified?: boolean;
  date?: string;
  createdAt?: string;
}

interface InstallmentProof {
  id: string;
  customerName: string;
  customerLocation: string;
  customerAvatar?: string;
  unitModel: string;
  unitType: 'Split' | 'Window' | 'Floor';
  horsepower?: string;
  technicianName: string;
  technicianRole?: string;
  jobOrderNo: string;
  installDate: string;
  installType: string;
  rating: number;
  review?: string;
  photoUrl: string;
  photoUrl2?: string;
  checklist: string[];
  createdAt?: string;
}

const getProofPhotoPair = (proof: any): [string, string] => {
  const p1 = proof.photoUrl || proof.photourl || '/installed-ac/midea1.jpg';
  const p2 = proof.photoUrl2 || proof.photourl2;
  if (p2) return [p1, p2];
  if (p1.includes('midea1')) return [p1, '/installed-ac/midea2.jpg'];
  if (p1.includes('midea2')) return ['/installed-ac/midea1.jpg', p1];
  if (p1.toLowerCase().includes('matrix1')) return [p1, '/installed-ac/matrix2.jpg'];
  if (p1.toLowerCase().includes('matrix2')) return ['/installed-ac/Matrix1.jpg', p1];
  if (p1.includes('carrier.jpg')) return [p1, '/products/carrier1.jpg'];
  if (p1.includes('carrier1')) return [p1, '/products/carrier.jpg'];
  if (p1.includes('TCL1')) return [p1, '/products/TCL2.webp'];
  if (p1.includes('TCL2')) return ['/products/TCL1.webp', p1];
  return [p1, p1];
};

const FALLBACK_PROOFS: InstallmentProof[] = [
  {
    id: 'proof-1',
    customerName: 'Engr. Roberto Martinez',
    customerLocation: 'Quezon City, Metro Manila',
    customerAvatar: 'RM',
    unitModel: 'Midea Full DC Inverter 1.5 HP Split Type',
    unitType: 'Split',
    horsepower: '1.5 HP',
    technicianName: 'Carlos Rivera',
    technicianRole: 'Senior HVAC Field Specialist',
    jobOrderNo: 'JO-2026-4891',
    installDate: 'November 2, 2026',
    installType: 'Standard Back-to-Back Installation',
    rating: 5,
    review: 'Outstanding installment delivery! Technician Carlos arrived right on schedule with complete PPE and calibrated vacuum pump. Piping was cleanly wrapped with UV insulation tape and sealed.',
    photoUrl: '/installed-ac/midea1.jpg',
    photoUrl2: '/installed-ac/midea2.jpg',
    checklist: [
      'Vacuum Pressure Tested (-30 inHg / 500 microns)',
      'Flare Nuts Torqued to Carrier Specs',
      'Condensate Gravity Drain Flow Verified',
      'Dedicated 20A Circuit Breaker Installed',
      'Refrigerant Operating Pressure Normal',
      'Customer Remote Operation Demo Given',
    ],
  },
  {
    id: 'proof-2',
    customerName: 'Dr. Maria Carmela Santos',
    customerLocation: 'BGC, Taguig City',
    customerAvatar: 'MS',
    unitModel: 'Matrix Inverter 1.5 HP Split Type',
    unitType: 'Split',
    horsepower: '1.5 HP',
    technicianName: 'Mark Anthony Bautista',
    technicianRole: 'Certified AC Technician #884',
    jobOrderNo: 'JO-2026-4762',
    installDate: 'October 29, 2026',
    installType: 'High-Rise Condominium Balcony Mounting',
    rating: 5,
    review: 'Very neat and polite technician! Our condo admin has strict permits and vibration guidelines. The FrostTech team followed all safety rules and used heavy-duty anti-vibration rubber pads.',
    photoUrl: '/installed-ac/Matrix1.jpg',
    photoUrl2: '/installed-ac/matrix2.jpg',
    checklist: [
      'Condo Admin Safety & Permit Compliant',
      'Heavy-Duty Vibration Dampener Pads',
      'R32 Refrigerant Operating Pressure Normal',
      'Condensate Leak & P-Trap Tested',
      'Wall Sealant & Weatherproofing Applied',
      'Electrical Load Balance Verified',
    ],
  },
  {
    id: 'proof-3',
    customerName: 'Arch. Kenneth Ramos',
    customerLocation: 'San Juan, Metro Manila',
    customerAvatar: 'KR',
    unitModel: 'Carrier Inverter 1.0 HP Split Type',
    unitType: 'Split',
    horsepower: '1.0 HP',
    technicianName: 'Carlos Rivera',
    technicianRole: 'Senior HVAC Field Specialist',
    jobOrderNo: 'JO-2026-4630',
    installDate: 'October 24, 2026',
    installType: 'Concealed Piping Wall Chasing',
    rating: 5,
    review: 'The FrostTech team handled our residential architectural project smoothly. Embedded the copper tubing with zero aesthetic blemishes on our newly plastered concrete walls.',
    photoUrl: '/products/carrier.jpg',
    photoUrl2: '/products/carrier1.jpg',
    checklist: [
      'Chased Wall Conduit 100% Leveled',
      'Braze Joint Nitrogen Testing Passed',
      'Condensate Pump Connected & Powered',
      'Clean Vacuum Level Maintained 20 Mins',
      'Inverter Power Amp Draw Normal',
      'Handover Certificate Signed',
    ],
  },
  {
    id: 'proof-4',
    customerName: 'Atty. Patricia Mae Tan',
    customerLocation: 'Makati City, Metro Manila',
    customerAvatar: 'PT',
    unitModel: 'TCL Split Type Inverter 1.0 HP',
    unitType: 'Split',
    horsepower: '1.0 HP',
    technicianName: 'Ronald Maclang',
    technicianRole: 'Master HVAC Technician',
    jobOrderNo: 'JO-2026-4512',
    installDate: 'October 19, 2026',
    installType: 'Heavy-Duty Bracket Exterior Wall Mount',
    rating: 5,
    review: 'Top-tier service! The outdoor condenser was securely mounted on heavy-gauge stainless steel L-brackets with rubber isolators. Very quiet even at full turbo load.',
    photoUrl: '/products/TCL1.webp',
    photoUrl2: '/products/TCL2.webp',
    checklist: [
      'Heavy Gauge Stainless 304 L-Brackets',
      'Anti-Vibration Rubber Isolators Fitted',
      'Nitrogen Purge During Brazing Done',
      'Weatherproof Polyurethane Sealant Applied',
      'Thermal Imaging Pipe Insulation Check OK',
      'Digital Voltage & Current Logged Normal',
    ],
  },
  {
    id: 'proof-5',
    customerName: 'Mrs. Bernadette Lim',
    customerLocation: 'Binondo, Manila',
    customerAvatar: 'BL',
    unitModel: 'Midea Eco Inverter 1.0 HP Split Type',
    unitType: 'Split',
    horsepower: '1.0 HP',
    technicianName: 'Mark Anthony Bautista',
    technicianRole: 'Certified AC Technician #884',
    jobOrderNo: 'JO-2026-4389',
    installDate: 'October 12, 2026',
    installType: 'Standard Back-to-Back Installation',
    rating: 5,
    review: 'Replacing our old loud window AC with this modern Carrier Inverter was a breeze. The technicians fitted the sleeve tightly, added acoustic sealing tape, and clean exterior bracket.',
    photoUrl: '/installed-ac/midea2.jpg',
    photoUrl2: '/installed-ac/midea1.jpg',
    checklist: [
      'Structural Window Frame Leveled with 1/4" Slope',
      'High-Density Acoustic Foam Weatherstrip',
      'Exterior Bottom Support Angle Bracket',
      'Condensate Gravity Drainage Drainpipe Fitted',
      'Dedicated 15A Convenience Outlet Checked',
      'Energy Meter Wattage Verification Passed',
    ],
  },
  {
    id: 'proof-6',
    customerName: 'Capt. Antonio De Leon',
    customerLocation: 'Alabang, Muntinlupa City',
    customerAvatar: 'AD',
    unitModel: 'Matrix Heavy-Duty Inverter 2.0 HP',
    unitType: 'Split',
    horsepower: '2.0 HP',
    technicianName: 'Ronald Maclang',
    technicianRole: 'Master HVAC Technician',
    jobOrderNo: 'JO-2026-4277',
    installDate: 'October 5, 2026',
    installType: 'Master Bedroom Custom Louver Fitment',
    rating: 5,
    review: 'Solid workmanship! Cleanly caulked silicone around the perimeter so no rain or insects can enter. Smart WiFi connects easily and cools our 22sqm room in minutes.',
    photoUrl: '/installed-ac/matrix2.jpg',
    photoUrl2: '/installed-ac/Matrix1.jpg',
    checklist: [
      'All-Weather Neutral Silicone Perimeter Seal',
      'Custom Aluminum Finishing Trim Installed',
      'Circuit Ground Fault (GFCI) Verified',
      'WiFi App Remote Pairing & Demo Given',
      'Decibel Sound Level Meter Check (< 42dB)',
      'Full 1-Year Workmanship Warranty Signed',
    ],
  },
];

export default function CustomerFeedbackAndProofsPage() {
  const [activeMainTab, setActiveMainTab] = useState<'FEEDBACK' | 'PROOFS'>('FEEDBACK');

  // Customer Feedback state
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<'ALL' | '5' | '4' | '3'>('ALL');
  const [feedbackSearch, setFeedbackSearch] = useState('');

  // Installment Proofs state
  const [proofs, setProofs] = useState<InstallmentProof[]>([]);
  const [isLoadingProofs, setIsLoadingProofs] = useState(true);
  const [proofTypeFilter, setProofTypeFilter] = useState<'All' | 'Split' | 'Window'>('All');
  const [proofSearch, setProofSearch] = useState('');
  const [selectedProof, setSelectedProof] = useState<InstallmentProof | null>(null);

  // Submit Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formServiceType, setFormServiceType] = useState('Installment AC Purchase');
  const [formRating, setFormRating] = useState(5);
  const [formReview, setFormReview] = useState('');
  const [submitToast, setSubmitToast] = useState('');

  useEffect(() => {
    // Check URL parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'proofs' || tabParam === 'installment') {
        setActiveMainTab('PROOFS');
      }
      if (params.get('action') === 'new') {
        setShowFeedbackModal(true);
      }

      // Pre-fill user details if logged in
      const storedName = sessionStorage.getItem('userName');
      if (storedName) setFormName(storedName);
    }

    loadFeedbacks();
    loadProofs();
  }, []);

  const loadFeedbacks = async () => {
    setIsLoadingFeedbacks(true);
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (e) {
      console.error('Failed to load feedbacks:', e);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  const loadProofs = async () => {
    setIsLoadingProofs(true);
    try {
      const res = await fetch('/api/installment-proofs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProofs(data);
          return;
        }
      }
      setProofs(FALLBACK_PROOFS);
    } catch (e) {
      console.error('Failed to load proofs:', e);
      setProofs(FALLBACK_PROOFS);
    } finally {
      setIsLoadingProofs(false);
    }
  };

  const handleSubmitCustomerFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReview.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formName || 'Valued Customer',
          customerLocation: formLocation || 'Philippines',
          unitModel: formModel || 'FrostTech Air Conditioner',
          serviceType: formServiceType,
          rating: formRating,
          review: formReview,
        }),
      });

      if (res.ok) {
        const newFb = await res.json();
        setFeedbacks([newFb, ...feedbacks]);
        setShowFeedbackModal(false);
        setFormReview('');
        setSubmitToast('Thank you! Your feedback has been posted successfully.');
        setTimeout(() => setSubmitToast(''), 4500);
      } else {
        alert('Could not submit feedback. Please try again.');
      }
    } catch (e) {
      console.error('Submit feedback error:', e);
      alert('An error occurred while submitting feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (feedbackRatingFilter !== 'ALL' && fb.rating.toString() !== feedbackRatingFilter) {
      return false;
    }
    const q = feedbackSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      fb.customerName.toLowerCase().includes(q) ||
      (fb.customerLocation && fb.customerLocation.toLowerCase().includes(q)) ||
      fb.unitModel.toLowerCase().includes(q) ||
      fb.review.toLowerCase().includes(q)
    );
  });

  // Filtered proofs
  const filteredProofs = proofs.filter((p) => {
    if (proofTypeFilter !== 'All' && p.unitType !== proofTypeFilter) {
      return false;
    }
    const q = proofSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.customerName.toLowerCase().includes(q) ||
      p.customerLocation.toLowerCase().includes(q) ||
      p.unitModel.toLowerCase().includes(q) ||
      p.technicianName.toLowerCase().includes(q) ||
      p.jobOrderNo.toLowerCase().includes(q)
    );
  });

  const avgFeedbackRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 5), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  return (
    <>
      <Header />

      {/* Toast Alert */}
      {submitToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#16a34a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          fontWeight: 700,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <i className="fa-solid fa-circle-check"></i>
          {submitToast}
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 5%' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <Link href="/" style={{ color: '#0369a1', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ color: '#0f172a', fontWeight: 800 }}>
            {activeMainTab === 'FEEDBACK' ? 'Customer Feedback & Reviews' : 'Installment Proofs'}
          </span>
        </div>
      </div>

      {/* Hero Banner Header with Dual Section Selector */}
      <section style={{ background: 'linear-gradient(135deg, #072a6b 0%, #0c3d98 50%, #0369a1 100%)', padding: '2.8rem 5% 2.4rem', color: '#ffffff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', backdropFilter: 'blur(4px)' }}>
                <i className="fa-solid fa-certificate" style={{ color: '#38bdf8' }}></i> FrostTech Verified Trust & Transparency
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.3rem', fontWeight: 800, margin: '0 0 0.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {activeMainTab === 'FEEDBACK' ? 'Customer Feedback & Ratings' : 'Verified AC Installment & Installation Proofs'}
              </h1>
              <p style={{ color: '#e0f2fe', fontSize: '1rem', margin: 0, maxWidth: '720px', lineHeight: 1.55 }}>
                {activeMainTab === 'FEEDBACK'
                  ? 'Real, unfiltered reviews from verified FrostTech clients across the Philippines. Share your personal cooling experience or explore what our community is saying.'
                  : 'Official completed installment handovers and AC installations posted directly by FrostTech Admin. Every unit is certified with vacuum testing and electrical sign-off.'}
              </p>
            </div>

            {/* Main Action Button */}
            {activeMainTab === 'FEEDBACK' ? (
              <button
                type="button"
                onClick={() => setShowFeedbackModal(true)}
                style={{
                  background: '#ffffff',
                  color: '#072a6b',
                  border: 'none',
                  padding: '0.85rem 1.6rem',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <i className="fa-solid fa-pen-to-square" style={{ color: '#0284c7' }}></i>
                Leave Customer Feedback
              </button>
            ) : (
              <Link
                href="/admin"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <i className="fa-solid fa-lock" style={{ color: '#38bdf8' }}></i>
                Admin: Post Installment Proof
              </Link>
            )}
          </div>

          {/* Primary Separation Tabs */}
          <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.25)', padding: '6px', borderRadius: '14px', width: 'fit-content', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveMainTab('FEEDBACK')}
              style={{
                background: activeMainTab === 'FEEDBACK' ? '#ffffff' : 'transparent',
                color: activeMainTab === 'FEEDBACK' ? '#072a6b' : '#ffffff',
                border: 'none',
                padding: '0.7rem 1.4rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeMainTab === 'FEEDBACK' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <i className="fa-solid fa-comments"></i>
              Customer Feedback ({feedbacks.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('PROOFS')}
              style={{
                background: activeMainTab === 'PROOFS' ? '#ffffff' : 'transparent',
                color: activeMainTab === 'PROOFS' ? '#072a6b' : '#ffffff',
                border: 'none',
                padding: '0.7rem 1.4rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeMainTab === 'PROOFS' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <i className="fa-solid fa-camera-retro"></i>
              Installment Proofs ({proofs.length})
            </button>
          </div>

        </div>
      </section>

      {/* Main Container */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 5% 5rem' }}>

        {/* ============================================================== */}
        {/* TAB 1: CUSTOMER FEEDBACK */}
        {/* ============================================================== */}
        {activeMainTab === 'FEEDBACK' && (
          <div>
            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#072a6b' }}>{avgFeedbackRating} ★</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Average Customer Rating</div>
              </div>
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#072a6b' }}>{feedbacks.length}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Total Verified Reviews</div>
              </div>
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#16a34a' }}>100%</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Authentic Customer Accounts</div>
              </div>
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0284c7' }}>24/7</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Customer Service Support</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  placeholder="Search reviews by customer, unit, or city..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                    borderRadius: '999px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Rating Filters */}
              <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                {(['ALL', '5', '4', '3'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFeedbackRatingFilter(r)}
                    style={{
                      background: feedbackRatingFilter === r ? '#072a6b' : 'transparent',
                      color: feedbackRatingFilter === r ? '#ffffff' : '#334155',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {r === 'ALL' ? 'All Reviews' : `${r} Stars ★`}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Grid */}
            {isLoadingFeedbacks ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#0284c7', marginBottom: '1rem' }}></i>
                <p>Loading genuine customer feedback...</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <i className="fa-solid fa-comment-slash" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 700 }}>No feedback matches your filter</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try clearing your search query or reset rating filters.</p>
                <button
                  type="button"
                  onClick={() => { setFeedbackSearch(''); setFeedbackRatingFilter('ALL'); }}
                  style={{ background: '#072a6b', color: '#ffffff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '8px', fontWeight: 700, marginTop: '1rem', cursor: 'pointer' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {filteredFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Header: Avatar, Name & Location */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #072a6b, #0284c7)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                          {fb.customerAvatar || fb.customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.96rem' }}>{fb.customerName}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{fb.customerLocation || 'Philippines'}</div>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-circle-check"></i> Verified
                      </span>
                    </div>

                    {/* Star Rating and Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '2px' }}>
                        {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                      </div>
                      {fb.date && (
                        <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{fb.date}</span>
                      )}
                    </div>

                    {/* Unit / Service Pill */}
                    <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: '8px', padding: '7px 11px', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 800, textTransform: 'uppercase' }}>
                        {fb.serviceType || 'AC Purchase'}
                      </div>
                      <div style={{ fontWeight: 700, color: '#0c4a6e', fontSize: '0.88rem', marginTop: '2px' }}>
                        {fb.unitModel}
                      </div>
                    </div>

                    {/* Review Body */}
                    <p style={{ color: '#334155', fontSize: '0.92rem', lineHeight: 1.6, fontStyle: 'italic', margin: 0, flex: 1 }}>
                      &ldquo;{fb.review}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: INSTALLMENT PROOFS */}
        {/* ============================================================== */}
        {activeMainTab === 'PROOFS' && (
          <div>
            {/* Explanatory banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#072a6b', display: 'block' }}>
                  <i className="fa-solid fa-camera-retro" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                  Installment Proofs Showcase
                </strong>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  These records document completed customer AC installments, verifying electrical safety, vacuum testing, pipe insulation, and signed technician handovers with paired on-site photography.
                </span>
              </div>
              <Link
                href="/admin"
                style={{
                  background: '#072a6b',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="fa-solid fa-plus"></i> Post Installment Proof
              </Link>
            </div>

            {/* Controls: Search and Unit Type filter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  value={proofSearch}
                  onChange={(e) => setProofSearch(e.target.value)}
                  placeholder="Search proofs by customer, technician, or model..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                    borderRadius: '999px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Unit Type Filter */}
              <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                {(['All', 'Split', 'Window'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProofTypeFilter(t)}
                    style={{
                      background: proofTypeFilter === t ? '#072a6b' : 'transparent',
                      color: proofTypeFilter === t ? '#ffffff' : '#334155',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t === 'All' ? 'All Proofs' : t === 'Split' ? 'Split Inverter' : 'Window Type'}
                  </button>
                ))}
              </div>
            </div>

            {/* Proofs Grid */}
            {isLoadingProofs ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#0284c7', marginBottom: '1rem' }}></i>
                <p>Loading official installment proofs...</p>
              </div>
            ) : filteredProofs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 700 }}>No installment proofs found</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try clearing your search query or reset type filters.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem' }}>
                {filteredProofs.map((proof) => (
                  <div
                    key={proof.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* On-Site Paired Photos (by pair) */}
                    {(() => {
                      const [photo1, photo2] = getProofPhotoPair(proof);
                      return (
                        <div style={{ position: 'relative', height: '220px', background: '#0a1d37', overflow: 'hidden' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', gap: '3px' }}>
                            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                              <img
                                src={photo1}
                                alt={`${proof.unitModel} - Photo 1`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <span style={{ position: 'absolute', bottom: '38px', left: '8px', background: 'rgba(0,0,0,0.65)', color: '#ffffff', fontSize: '0.66rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                Photo 1
                              </span>
                            </div>
                            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                              <img
                                src={photo2}
                                alt={`${proof.unitModel} - Photo 2`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <span style={{ position: 'absolute', bottom: '38px', right: '8px', background: 'rgba(0,0,0,0.65)', color: '#ffffff', fontSize: '0.66rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                Photo 2
                              </span>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(22, 163, 74, 0.95)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <i className="fa-solid fa-circle-check"></i> Verified Installment Proof
                          </div>
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(7, 42, 107, 0.9)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {proof.jobOrderNo}
                          </div>
                          <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', background: 'rgba(5, 20, 45, 0.85)', backdropFilter: 'blur(8px)', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>
                              <i className="fa-solid fa-calendar-day" style={{ marginRight: '6px', color: '#38bdf8' }}></i>
                              {proof.installDate}
                            </span>
                            <span style={{ color: '#bae6fd', fontSize: '0.74rem' }}>{proof.installType}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Card Content */}
                    <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Customer info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{proof.customerName}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{proof.customerLocation}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', fontSize: '0.92rem' }}>
                          {'★'.repeat(proof.rating)}
                        </div>
                      </div>

                      {/* Installed Unit */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', marginBottom: '0.9rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#072a6b', fontWeight: 800, textTransform: 'uppercase' }}>Installed Unit</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginTop: '2px' }}>{proof.unitModel}</div>
                      </div>

                      {/* Review note if available */}
                      {proof.review && (
                        <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.55, fontStyle: 'italic', marginBottom: '1rem', flex: 1 }}>
                          &ldquo;{proof.review}&rdquo;
                        </p>
                      )}

                      {/* Technician Attribution */}
                      <div style={{ background: '#f8fafc', borderLeft: '3px solid #072a6b', padding: '8px 12px', borderRadius: '0 8px 8px 0', marginBottom: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Certified Installer</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#072a6b' }}>
                            <i className="fa-solid fa-user-check" style={{ color: '#072a6b', marginRight: '6px' }}></i>{proof.technicianName}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#072a6b', background: '#e0f2fe', padding: '3px 8px', borderRadius: '999px', fontWeight: 700 }}>Certified Tech</span>
                      </div>

                      {/* Checklist summary */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.2rem' }}>
                        {proof.checklist.slice(0, 3).map((item, idx) => (
                          <span key={idx} style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '5px', fontWeight: 600, border: '1px solid #dcfce7' }}>
                            ✓ {item.split('(')[0].trim()}
                          </span>
                        ))}
                      </div>

                      {/* Inspect Proof Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedProof(proof)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#072a6b',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(7, 42, 107, 0.2)',
                        }}
                      >
                        <i className="fa-solid fa-magnifying-glass-plus"></i> Inspect Installation Sign-Off
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* MODAL 1: SUBMIT CUSTOMER FEEDBACK */}
      {/* ============================================================== */}
      {showFeedbackModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 20, 45, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.5rem',
          }}
          onClick={() => setShowFeedbackModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: '1px solid #d4e5fa',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #072a6b 0%, #0369a1 100%)', color: '#ffffff', padding: '1.4rem 1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Leave Customer Feedback</h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#e0f2fe' }}>
                  Share your experience with FrostTech air conditioning & services
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitCustomerFeedback} style={{ padding: '1.6rem' }}>
              {/* Star Rating Selector */}
              <div style={{ marginBottom: '1.25rem', textAlign: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  Rate Your Experience
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.8rem',
                        cursor: 'pointer',
                        color: star <= formRating ? '#f59e0b' : '#cbd5e1',
                        transition: 'transform 0.1s',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#072a6b', marginTop: '4px', display: 'block' }}>
                  {formRating === 5 ? 'Excellent (5/5)' : formRating === 4 ? 'Very Good (4/5)' : formRating === 3 ? 'Good (3/5)' : formRating === 2 ? 'Fair (2/5)' : 'Poor (1/5)'}
                </span>
              </div>

              {/* Customer Name & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Cagayan de Oro"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Service Type & AC Unit Model */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Type of Service
                  </label>
                  <select
                    value={formServiceType}
                    onChange={(e) => setFormServiceType(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
                  >
                    <option value="Installment AC Purchase">Installment AC Purchase</option>
                    <option value="Direct Store AC Purchase">Direct Store AC Purchase</option>
                    <option value="Cleaning & Maintenance">Cleaning & Maintenance</option>
                    <option value="Repair & Diagnostic">Repair & Diagnostic</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    AC Unit / Brand Model
                  </label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="e.g. Carrier Inverter 1.5 HP"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Review Text */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Your Review / Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formReview}
                  onChange={(e) => setFormReview(e.target.value)}
                  placeholder="Tell us about the cooling performance, technician workmanship, installment approval, or delivery..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'vertical' }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !formReview.trim()}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#072a6b',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: isSubmittingFeedback ? 'not-allowed' : 'pointer',
                    opacity: isSubmittingFeedback || !formReview.trim() ? 0.7 : 1,
                  }}
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Post Customer Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: INSPECT INSTALLMENT PROOF */}
      {/* ============================================================== */}
      {selectedProof && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 20, 45, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedProof(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: '1px solid #d4e5fa',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #072a6b 0%, #0369a1 100%)', color: '#ffffff', padding: '1.4rem 1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Verified AC Installment Sign-Off
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0' }}>Job Order {selectedProof.jobOrderNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '1.8rem' }}>
              {/* Paired Photos in Inspect Modal */}
              {(() => {
                const [photo1, photo2] = getProofPhotoPair(selectedProof);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', height: '240px', marginBottom: '1.4rem' }}>
                    <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#0a1d37' }}>
                      <img src={photo1} alt="Installation photo 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(7, 42, 107, 0.9)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                        <i className="fa-solid fa-camera" style={{ marginRight: '6px' }}></i> Photo 1 (Indoor / Unit)
                      </div>
                    </div>
                    <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#0a1d37' }}>
                      <img src={photo2} alt="Installation photo 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(7, 42, 107, 0.9)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                        <i className="fa-solid fa-camera" style={{ marginRight: '6px' }}></i> Photo 2 (Outdoor / Piping)
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.4rem' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Customer Name</div>
                  <div style={{ fontWeight: 800, color: '#072a6b', fontSize: '0.95rem' }}>{selectedProof.customerName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>{selectedProof.customerLocation}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Lead Field Installer</div>
                  <div style={{ fontWeight: 800, color: '#072a6b', fontSize: '0.95rem' }}>{selectedProof.technicianName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 700 }}>{selectedProof.technicianRole || 'Certified AC Tech'}</div>
                </div>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '12px 16px', marginBottom: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 800, textTransform: 'uppercase' }}>Installed Unit</div>
                    <div style={{ fontWeight: 800, color: '#0c4a6e', fontSize: '1.05rem', marginTop: '2px' }}>{selectedProof.unitModel}</div>
                  </div>
                  {selectedProof.horsepower && (
                    <span style={{ background: '#072a6b', color: '#ffffff', padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {selectedProof.horsepower}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#072a6b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                  Quality Inspection & Commissioning Checklist:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {selectedProof.checklist.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', fontSize: '1rem' }}></i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProof.review && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#072a6b' }}>Customer Remarks / Sign-Off</span>
                    <div style={{ color: '#f59e0b', fontSize: '0.88rem' }}>{'★'.repeat(selectedProof.rating)}</div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.5 }}>
                    &ldquo;{selectedProof.review}&rdquo;
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                style={{ width: '100%', padding: '0.85rem', background: '#072a6b', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                Close Inspection Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
