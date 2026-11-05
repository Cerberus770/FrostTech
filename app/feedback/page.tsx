'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

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
      'Refrigerant Operating Pressure Normal',
      'Customer Remote Operation Demo Given',
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
      'Wall Sealant & Weatherproofing Applied',
      'Electrical Load Balance Verified',
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
    review: 'As an architect, aesthetics matter a lot to me. The FrostTech technicians routed the copper tubings and drainage seamlessly along the molding with clean white trunking. Unit looks sleek and operates whisper quiet!',
    photoUrl: '/Inverter.jpg',
    checklist: [
      'Precision Tube Bending Without Kinks',
      'Aesthetic Wall Trunking Installed',
      'Electrical Grounding & Amperage Normal',
      'Full Remote Handover & Function Briefing',
      'Pre-commissioning Leak Bubble Check OK',
      'Drainage Tested with 2 Liters Water',
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
      'Window Sash Locks & Reinforcement Checked',
      'Power Cord Protected with Strain Relief',
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
      'Drainage Flow Rate Recorded',
      'Surge Protector Verified On Line',
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
      'Amperage Within 6.5A Rated Limit',
      'Indoor Fan Balance & Noise Verified',
    ],
  },
];

export default function CustomerFeedbackPage() {
  const [filterType, setFilterType] = useState<'All' | 'Split' | 'Window'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProof, setSelectedProof] = useState<InstallationProof | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formReview, setFormReview] = useState('');
  const [formRating, setFormRating] = useState(5);

  const filteredProofs = installationProofs.filter(proof => {
    const matchesType = filterType === 'All' || proof.unitType === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      proof.customerName.toLowerCase().includes(q) ||
      proof.customerLocation.toLowerCase().includes(q) ||
      proof.unitModel.toLowerCase().includes(q) ||
      proof.technicianName.toLowerCase().includes(q) ||
      proof.jobOrderNo.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(true);
    setTimeout(() => {
      setShowSubmitModal(false);
      setSubmitSuccess(false);
      setFormName('');
      setFormLocation('');
      setFormModel('');
      setFormReview('');
    }, 2000);
  };

  return (
    <>
      <Header />

      {/* Breadcrumb Navigation */}
      <div style={{ background: '#c8e0fc', borderBottom: '1px solid #b9d4f6', padding: '0.75rem 5%' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <Link href="/" style={{ color: '#06255b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span style={{ color: '#6486b3' }}>/</span>
          <span style={{ color: '#052e80', fontWeight: 800 }}>Customer Feedback & Installation Proofs</span>
        </div>
      </div>

      {/* Hero Banner Header */}
      <section style={{ background: 'linear-gradient(135deg, #d8e9fd 0%, #c5defb 50%, #b0d4fa 100%)', padding: '3rem 5%', borderBottom: '1px solid #c2dbf8' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0b3080', color: '#ffffff', padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
            <i className="fa-solid fa-comments"></i> Verified Customer Feedback • Certified Technician Proofs
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: '#06255b', margin: '0 0 0.8rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Real Installation Proofs & Customer Reviews
          </h1>
          <p style={{ color: '#193660', fontSize: '1.05rem', margin: 0, maxWidth: '750px', lineHeight: 1.6, fontWeight: 500 }}>
            Every air conditioner installed by FrostTech is completed by certified technicians who follow strict manufacturer vacuum pump testing, leak detection, and electrical safety standards. Inspect genuine customer experiences below.
          </p>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #d4e5fa', boxShadow: '0 2px 8px rgba(6,37,91,0.06)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#052e80' }}>500+</div>
              <div style={{ fontSize: '0.82rem', color: '#47668f', fontWeight: 600 }}>AC Units Installed</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #d4e5fa', boxShadow: '0 2px 8px rgba(6,37,91,0.06)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#052e80' }}>4.9 ★</div>
              <div style={{ fontSize: '0.82rem', color: '#47668f', fontWeight: 600 }}>Average Customer Rating</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #d4e5fa', boxShadow: '0 2px 8px rgba(6,37,91,0.06)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#052e80' }}>100%</div>
              <div style={{ fontSize: '0.82rem', color: '#47668f', fontWeight: 600 }}>Certified Field Techs</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #d4e5fa', boxShadow: '0 2px 8px rgba(6,37,91,0.06)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#052e80' }}>1-Year</div>
              <div style={{ fontSize: '0.82rem', color: '#47668f', fontWeight: 600 }}>Installation Warranty</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 5% 4rem' }}>
        {/* Controls Toolbar: Search & Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '450px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6486b3' }}></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, city, technician, model..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.8rem',
                borderRadius: '999px',
                border: '1px solid #bfd6f6',
                background: '#ffffff',
                color: '#06255b',
                fontSize: '0.9rem',
                outline: 'none',
                boxShadow: '0 2px 6px rgba(6,37,91,0.04)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6486b3', cursor: 'pointer' }}
              >
                &times;
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: '#dae9fc', padding: '4px', borderRadius: '12px', border: '1px solid #bfd6f6' }}>
              {(['All', 'Split', 'Window'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  style={{
                    background: filterType === tab ? '#052e80' : 'transparent',
                    color: filterType === tab ? '#ffffff' : '#06255b',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab === 'All' ? 'All (6)' : tab === 'Split' ? 'Split Inverter (4)' : 'Window Type (2)'}
                </button>
              ))}
            </div>

            {/* Share Feedback CTA */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              style={{
                background: '#052e80',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.4rem',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(5,46,128,0.25)',
              }}
            >
              <i className="fa-solid fa-pen-to-square"></i> Submit Your Review
            </button>
          </div>
        </div>

        {/* Proof Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem' }}>
          {filteredProofs.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
              <h3 style={{ color: '#06255b', fontSize: '1.2rem', fontWeight: 700 }}>No matching proofs found</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try clearing your search query or switching category filters.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setFilterType('All'); }}
                style={{ background: '#052e80', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, marginTop: '1rem', cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredProofs.map(proof => (
              <div
                key={proof.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d4e5fa',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(6, 37, 91, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.28s ease',
                }}
                className="proof-card"
              >
                {/* On-Site Photo */}
                <div style={{ position: 'relative', height: '220px', background: '#0a1d37', overflow: 'hidden' }}>
                  <img
                    src={proof.photoUrl}
                    alt={proof.unitModel}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.9,
                      transition: 'transform 0.4s ease',
                    }}
                  />
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(16, 185, 129, 0.95)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(4px)' }}>
                    <i className="fa-solid fa-circle-check"></i> Verified Install
                  </div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(5, 46, 128, 0.9)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                    {proof.jobOrderNo}
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', background: 'rgba(5, 20, 45, 0.85)', backdropFilter: 'blur(8px)', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}><i className="fa-solid fa-calendar-day" style={{ marginRight: '6px', color: '#38bdf8' }}></i>{proof.installDate}</span>
                    <span style={{ color: '#bae6fd', fontSize: '0.75rem' }}>{proof.installType}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Customer & Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #052e80, #38bdf8)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                        {proof.customerAvatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#06255b', fontSize: '0.95rem' }}>{proof.customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{proof.customerLocation}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', fontSize: '0.95rem' }}>
                      {'★'.repeat(proof.rating)}
                    </div>
                  </div>

                  {/* Installed Unit */}
                  <div style={{ background: '#f0f7ff', border: '1px solid #cfe2fb', borderRadius: '10px', padding: '8px 12px', marginBottom: '0.9rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#052e80', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Installed</div>
                    <div style={{ fontWeight: 700, color: '#06255b', fontSize: '0.92rem', marginTop: '2px' }}>{proof.unitModel}</div>
                  </div>

                  {/* Review Text */}
                  <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.55, fontStyle: 'italic', marginBottom: '1rem', flex: 1 }}>
                    &ldquo;{proof.review}&rdquo;
                  </p>

                  {/* Technician Attribution */}
                  <div style={{ background: '#f8fafc', borderLeft: '3px solid #052e80', padding: '8px 12px', borderRadius: '0 8px 8px 0', marginBottom: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Lead Field Installer</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#06255b' }}>
                        <i className="fa-solid fa-user-check" style={{ color: '#052e80', marginRight: '6px' }}></i>{proof.technicianName}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#052e80', background: '#d8e9fd', padding: '3px 8px', borderRadius: '999px', fontWeight: 700 }}>Certified Tech</span>
                  </div>

                  {/* Checklist Summary */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.2rem' }}>
                    {proof.checklist.slice(0, 3).map((item, idx) => (
                      <span key={idx} style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '5px', fontWeight: 600 }}>
                        ✓ {item.split('(')[0].trim()}
                      </span>
                    ))}
                  </div>

                  {/* View Full Proof Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedProof(proof)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#052e80',
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
                      boxShadow: '0 4px 12px rgba(5,46,128,0.2)',
                    }}
                    className="view-proof-btn"
                  >
                    <i className="fa-solid fa-magnifying-glass-plus"></i> View Full Certificate & Sign-Off
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Full Proof Inspection Modal */}
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
              position: 'relative',
              border: '1px solid #d4e5fa',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #072a6b 0%, #0b3080 100%)', color: '#ffffff', padding: '1.4rem 1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '19px 19px 0 0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Official Installation Certificate & Quality Sign-Off</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0' }}>Job Order {selectedProof.jobOrderNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '1.8rem' }}>
              <div style={{ position: 'relative', height: '240px', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.4rem', border: '1px solid #cbd5e1' }}>
                <img src={selectedProof.photoUrl} alt="Installation proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(5, 46, 128, 0.9)', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-camera" style={{ marginRight: '6px' }}></i> Certified Field Photography
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.4rem' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Customer</div>
                  <div style={{ fontWeight: 800, color: '#06255b', fontSize: '0.95rem' }}>{selectedProof.customerName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>{selectedProof.customerLocation}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Lead Field Specialist</div>
                  <div style={{ fontWeight: 800, color: '#06255b', fontSize: '0.95rem' }}>{selectedProof.technicianName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#052e80', fontWeight: 700 }}>{selectedProof.technicianRole}</div>
                </div>
              </div>

              <div style={{ background: '#f0f7ff', border: '1px solid #cfe2fb', borderRadius: '12px', padding: '12px 16px', marginBottom: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#052e80', fontWeight: 800, textTransform: 'uppercase' }}>Installed Unit</div>
                    <div style={{ fontWeight: 800, color: '#06255b', fontSize: '1.05rem', marginTop: '2px' }}>{selectedProof.unitModel}</div>
                  </div>
                  <span style={{ background: '#052e80', color: '#ffffff', padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {selectedProof.horsepower}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#06255b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                  Quality Inspection & Safety Checklist:
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

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#06255b' }}>Verified Customer Testimonial</span>
                  <div style={{ color: '#f59e0b', fontSize: '0.88rem' }}>{'★'.repeat(selectedProof.rating)}</div>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.5 }}>
                  &ldquo;{selectedProof.review}&rdquo;
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                style={{ width: '100%', padding: '0.85rem', background: '#052e80', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                Close Inspection Proof
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Feedback Modal */}
      {showSubmitModal && (
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
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              border: '1px solid #d4e5fa',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#06255b', margin: 0 }}>
                Share Your FrostTech Installation Experience
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                &times;
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '3rem', color: '#16a34a', marginBottom: '1rem' }}></i>
                <h4 style={{ color: '#06255b', fontSize: '1.2rem', fontWeight: 800 }}>Thank You for Your Feedback!</h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your installation review and photo have been received and will be verified by our QA team.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>City / Location</label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Quezon City"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>AC Model</label>
                    <input
                      type="text"
                      required
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="e.g. Carrier Aura Inverter"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>Installation Rating</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        style={{
                          background: star <= formRating ? '#fef3c7' : '#f1f5f9',
                          border: star <= formRating ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          color: star <= formRating ? '#d97706' : '#94a3b8',
                          fontSize: '1rem',
                        }}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.4rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>Your Review / Experience with the Technician</label>
                  <textarea
                    required
                    rows={4}
                    value={formReview}
                    onChange={(e) => setFormReview(e.target.value)}
                    placeholder="Tell us about the installation, punctuality, piping neatness, cleanliness..."
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: '#052e80',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  Submit Verified Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer>
        <div className="footer-grid">
          <div className="footer-col">
            <h3>Customer Service</h3>
            <ul>
              <li><Link href="/">Shop All ACs</Link></li>
              <li><Link href="/feedback">Installation Proofs & Reviews</Link></li>
              <li><Link href="/cart">My Cart</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Certified Installation</h3>
            <ul>
              <li><Link href="/feedback">Vacuum Testing Standards</Link></li>
              <li><Link href="/feedback">Condo Permits & Safety</Link></li>
              <li><Link href="/feedback">HVAC Certified Technicians</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>FrostTech Co.</h3>
            <ul>
              <li><Link href="/">About FrostTech</Link></li>
              <li><Link href="/login">Customer Login</Link></li>
              <li><Link href="/signup">Create Account</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2026 FrostTech Cooling Solutions Co. All rights reserved.
        </div>
      </footer>
    </>
  );
}

