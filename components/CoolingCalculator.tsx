'use client';

import { useState, useMemo } from 'react';

interface CoolingCalculatorProps {
  onSelectHp?: (hp: string) => void;
  productCountForHp?: (hp: string) => number;
}

export default function CoolingCalculator({ onSelectHp, productCountForHp }: CoolingCalculatorProps) {
  const [area, setArea] = useState<number>(16);
  const [hasAfternoonSun, setHasAfternoonSun] = useState<boolean>(false);
  const [hasHighLoad, setHasHighLoad] = useState<boolean>(false);
  const [hasHighCeiling, setHasHighCeiling] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Quick preset sizes
  const presets = [
    { label: 'Small Bedroom', area: 10, range: '8–11 m²' },
    { label: 'Standard Room', area: 15, range: '12–17 m²' },
    { label: 'Master / Studio', area: 21, range: '18–24 m²' },
    { label: 'Living Room', area: 28, range: '25–34 m²' },
    { label: 'Open Concept', area: 40, range: '35–50+ m²' },
  ];

  // Calculate recommended HP based on area + thermal load
  const recommendation = useMemo(() => {
    let baseHp = 1.0;
    let btu = 9500;
    let coverage = '12–17 m²';
    let type = 'Split Type Inverter or Window Type';

    if (area <= 11) {
      baseHp = 0.75;
      btu = 7500;
      coverage = 'Up to 11 m²';
      type = 'Window Type or Compact Split Inverter';
    } else if (area <= 17) {
      baseHp = 1.0;
      btu = 9500;
      coverage = '12–17 m²';
      type = 'Split Type Inverter or Window Type';
    } else if (area <= 24) {
      baseHp = 1.5;
      btu = 12000;
      coverage = '18–24 m²';
      type = 'Split Type Inverter';
    } else if (area <= 34) {
      baseHp = 2.0;
      btu = 18000;
      coverage = '25–34 m²';
      type = 'Split Type Inverter';
    } else if (area <= 45) {
      baseHp = 2.5;
      btu = 24000;
      coverage = '35–45 m²';
      type = 'Split Type Inverter or Floor Standing';
    } else {
      baseHp = 3.0;
      btu = 28000;
      coverage = '46+ m²';
      type = 'Floor Standing or Multi-Split System';
    }

    // Thermal load adjustment
    let extraLoadSteps = 0;
    if (hasAfternoonSun) extraLoadSteps += 1;
    if (hasHighLoad) extraLoadSteps += 0.5;
    if (hasHighCeiling) extraLoadSteps += 0.5;

    let finalHp = baseHp;
    if (extraLoadSteps >= 1) {
      if (baseHp === 0.75) {
        finalHp = 1.0;
        btu = 9500;
      } else if (baseHp === 1.0) {
        finalHp = 1.5;
        btu = 12000;
      } else if (baseHp === 1.5) {
        finalHp = 2.0;
        btu = 18000;
      } else if (baseHp === 2.0) {
        finalHp = 2.5;
        btu = 24000;
      } else if (baseHp === 2.5) {
        finalHp = 3.0;
        btu = 28000;
      }
    }

    // Format nicely e.g. "1.0 HP", "1.5 HP", "0.75 HP", "2.0 HP", "2.5 HP", "3.0 HP"
    const formattedHp = finalHp === 0.75 ? '0.75 HP' : `${finalHp.toFixed(1)} HP`;

    return {
      hp: formattedHp,
      btu: `${btu.toLocaleString()} BTU/hr`,
      coverage,
      type,
      hasExtraLoad: extraLoadSteps >= 1,
    };
  }, [area, hasAfternoonSun, hasHighLoad, hasHighCeiling]);

  const matchingCount = productCountForHp ? productCountForHp(recommendation.hp) : null;

  return (
    <section className="cooling-calc-wrapper section-container" style={{ margin: '1.5rem auto 2.5rem' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)',
          borderRadius: '20px',
          border: '1.5px solid #bae6fd',
          boxShadow: '0 10px 30px -8px rgba(2, 132, 199, 0.12)',
          padding: '1.75rem 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Decorative Ice Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: isExpanded ? '1px solid #e0f2fe' : 'none',
            paddingBottom: isExpanded ? '1.25rem' : '0',
            marginBottom: isExpanded ? '1.5rem' : '0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.28)',
              }}
            >
              <i className="fa-solid fa-snowflake"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-display)' }}>
                  Room Size & Horsepower (HP) Calculator
                </h3>
                <span
                  style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '999px',
                    border: '1px solid #bbf7d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <i className="fa-solid fa-leaf"></i> Lower Electric Bill
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#475569' }}>
                Find the exact cooling capacity (HP) suitable for your room so your AC runs efficiently without high power consumption.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
            {isExpanded ? 'Minimize' : 'Open Calculator'}
          </button>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Interactive Inputs */}
            <div>
              {/* Floor Area Slider */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                    1. Room Floor Area:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-display)' }}>
                      {area}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>
                      sq.m (m²) &bull; ~{Math.round(area * 10.764)} sq.ft
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="6"
                  max="55"
                  step="1"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#0284c7',
                    height: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                />

                {/* Preset Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.75rem' }}>
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setArea(p.area)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: area === p.area ? 700 : 500,
                        borderRadius: '8px',
                        border: area === p.area ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                        background: area === p.area ? '#e0f2fe' : '#ffffff',
                        color: area === p.area ? '#0369a1' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p.label} <span style={{ opacity: 0.75, fontSize: '0.72rem' }}>({p.area} m²)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Heat Load Factors */}
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem' }}>
                <label style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b', display: 'block', marginBottom: '0.6rem' }}>
                  2. Room Thermal & Heat Factors:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setHasAfternoonSun(!hasAfternoonSun)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: hasAfternoonSun ? '1.5px solid #f97316' : '1px solid #cbd5e1',
                      background: hasAfternoonSun ? '#fff7ed' : '#ffffff',
                      color: hasAfternoonSun ? '#c2410c' : '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className="fa-solid fa-sun" style={{ color: hasAfternoonSun ? '#ea580c' : '#94a3b8' }}></i>
                    Direct Afternoon Sun / Top Floor
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasHighLoad(!hasHighLoad)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: hasHighLoad ? '1.5px solid #8b5cf6' : '1px solid #cbd5e1',
                      background: hasHighLoad ? '#f5f3ff' : '#ffffff',
                      color: hasHighLoad ? '#6d28d9' : '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className="fa-solid fa-users" style={{ color: hasHighLoad ? '#7c3aed' : '#94a3b8' }}></i>
                    3+ People or Electronics
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasHighCeiling(!hasHighCeiling)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: hasHighCeiling ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                      background: hasHighCeiling ? '#f0f9ff' : '#ffffff',
                      color: hasHighCeiling ? '#0369a1' : '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className="fa-solid fa-arrows-up-down" style={{ color: hasHighCeiling ? '#0284c7' : '#94a3b8' }}></i>
                    High Ceiling (&gt; 2.8m)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Calculated Recommendation Box */}
            <div>
              <div
                style={{
                  background: 'linear-gradient(145deg, #0284c7 0%, #0369a1 100%)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.35)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c3e4ff' }}>
                    Recommended AC Capacity
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {recommendation.btu}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    {recommendation.hp}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#bae6fd' }}>
                    Inverter Unit
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#e0f2fe', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                  <p style={{ margin: '0 0 6px' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: '#86efac', marginRight: '6px' }}></i>
                    <strong>Type:</strong> {recommendation.type}
                  </p>
                  <p style={{ margin: '0 0 6px' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: '#86efac', marginRight: '6px' }}></i>
                    <strong>Room Area:</strong> Covers {recommendation.coverage} efficiently.
                  </p>
                  {recommendation.hasExtraLoad && (
                    <p style={{ margin: 0, color: '#fef08a', fontSize: '0.82rem' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
                      Adjusted +0.5 HP buffer for sun exposure/occupancy heat load.
                    </p>
                  )}
                </div>

                {/* Filter CTA Button */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectHp) {
                        onSelectHp(recommendation.hp);
                        const target = document.getElementById('products');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      background: '#ffffff',
                      color: '#0284c7',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <i className="fa-solid fa-arrow-down-wide-short"></i>
                    View Matching {recommendation.hp} ACs
                    {matchingCount !== null && matchingCount > 0 && (
                      <span
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          marginLeft: '2px',
                        }}
                      >
                        {matchingCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setArea(16);
                      setHasAfternoonSun(false);
                      setHasHighLoad(false);
                      setHasHighCeiling(false);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                    title="Reset to Defaults"
                  >
                    <i className="fa-solid fa-arrow-rotate-left"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

