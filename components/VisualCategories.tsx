'use client';

interface VisualCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>;
}

export default function VisualCategories({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}: VisualCategoriesProps) {
  const categories = [
    {
      id: 'All',
      title: 'All Products',
      tag: 'Full Catalog',
      icon: 'fa-solid fa-layer-group',
      desc: 'Browse complete inventory & parts',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    },
    {
      id: 'Split',
      title: 'Split Type Inverter',
      tag: 'Top Energy Saver',
      icon: 'fa-solid fa-wind',
      desc: 'Whisper-quiet wall-mounted inverter units',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    },
    {
      id: 'Window',
      title: 'Window Type',
      tag: 'Easy Install',
      icon: 'fa-solid fa-border-all',
      desc: 'Compact, cost-effective cooling for rooms',
      gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    },
    {
      id: 'Floor',
      title: 'Floor Standing',
      tag: 'High Capacity',
      icon: 'fa-solid fa-building',
      desc: 'Commercial cooling for large living spaces',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    },
    {
      id: 'Second Hand Deals',
      title: 'Second Hand Deals',
      tag: 'Up to 50% Off',
      icon: 'fa-solid fa-tags',
      desc: 'Certified technician-tested pre-owned units',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    {
      id: 'Spare Parts',
      title: 'Genuine Spare Parts',
      tag: 'OEM & Repair',
      icon: 'fa-solid fa-gears',
      desc: 'Compressors, PCB boards, fan motors & remotes',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
  ];

  const handleCardClick = (id: string) => {
    onSelectCategory(id);
    const target = document.getElementById('products');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="visual-categories-container section-container" style={{ margin: '1rem auto 2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'var(--font-display)' }}>
            Explore by AC Category
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Select a cooling category to filter units matching your room and lifestyle.
          </p>
        </div>
        {selectedCategory !== 'All' && (
          <button
            type="button"
            onClick={() => handleCardClick('All')}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              padding: '5px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-xmark"></i> Show All Categories
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id];

          return (
            <div
              key={cat.id}
              onClick={() => handleCardClick(cat.id)}
              style={{
                background: isSelected ? '#f0f9ff' : '#ffffff',
                border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.25rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isSelected
                  ? '0 10px 25px -5px rgba(2, 132, 199, 0.25)'
                  : '0 2px 8px rgba(0, 0, 0, 0.04)',
                transform: isSelected ? 'translateY(-3px)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 132, 199, 0.12)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                }
              }}
            >
              {/* Active Indicator Checkmark */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#0284c7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                  }}
                >
                  <i className="fa-solid fa-check"></i>
                </div>
              )}

              {/* Icon & Tag */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: cat.gradient,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.15rem',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                    }}
                  >
                    <i className={cat.icon}></i>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: isSelected ? '#e0f2fe' : '#f1f5f9',
                      color: isSelected ? '#0369a1' : '#64748b',
                      border: '1px solid',
                      borderColor: isSelected ? '#bae6fd' : '#e2e8f0',
                    }}
                  >
                    {cat.tag}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: isSelected ? '#0284c7' : '#1e293b',
                    margin: '0 0 4px',
                    lineHeight: 1.3,
                  }}
                >
                  {cat.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.35 }}>
                  {cat.desc}
                </p>
              </div>

              {/* Bottom Count indicator */}
              {count !== undefined && count > 0 && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                  <i className="fa-solid fa-box" style={{ marginRight: '4px', opacity: 0.8 }}></i>
                  {count} product{count === 1 ? '' : 's'} available
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

