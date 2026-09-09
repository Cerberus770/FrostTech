'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { products } from '@/lib/products';
import { Product, CartItem } from '@/lib/types';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');

  const resolvedParams = use(params);
  const { id } = resolvedParams;

  useEffect(() => {
    const p = products.find((p) => p.id === id);
    if (p) {
      setProduct(p);
    }
  }, [id]);

  if (!product) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: 'var(--text-light)' }}></i>
          <h2 style={{ color: 'var(--text-dark)' }}>Product not found</h2>
          <Link href="/" className="btn">Back to Shop</Link>
        </div>
      </>
    );
  }

  const handleAddToCart = () => {
    try {
      const cart: CartItem[] = JSON.parse(localStorage.getItem('frostTechCart') || '[]');
      cart.push({
        id: Date.now(),
        name: product.name,
        brand: product.brand,
        price: product.price,
        quantity: quantity,
        image: product.image,
      });
      localStorage.setItem('frostTechCart', JSON.stringify(cart));
      alert('Added to Cart!');
    } catch {
      alert('Failed to add to cart.');
    }
  };

  const handleBuyNow = () => {
    setShowBuyModal(true);
  };

  const confirmPurchase = () => {
    setShowBuyModal(false);
    if (paymentMode === 'cash') {
      alert('Thank you! Your order has been placed.');
    } else {
      alert('Installment application submitted. Please wait for approval.');
    }
    router.push('/');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fa-solid fa-star" style={{ color: 'var(--secondary)' }}></i>);
    }
    if (hasHalf) {
      stars.push(<i key="half" className="fa-solid fa-star-half-stroke" style={{ color: 'var(--secondary)' }}></i>);
    }
    return stars;
  };

  return (
    <>
      <Header />

      {/* Back navigation */}
      <div style={{ padding: '1.5rem 5% 0' }}>
        <Link href="/" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.3s' }}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px' }}></i> Back to Shop
        </Link>
      </div>

      {/* Product Details Card */}
      <section className="section-container">
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          boxShadow: 'var(--shadow-md)',
        }}>

          {/* Left: Product Image */}
          <div>
            <div style={{
              background: 'var(--media-bg, rgba(255,255,255,0.03))',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              aspectRatio: '1',
            }}>
              <Image src={product.image} alt={product.name} width={400} height={400} style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} />
              {product.badge && (
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'var(--accent-red)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: '6px',
                  boxShadow: '0 4px 10px rgba(255,107,87,0.35)',
                }}>
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              {product.brand}
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.3, fontFamily: 'var(--font-display)' }}>
              {product.name}
            </h1>

            {/* Ratings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                {renderStars(product.rating)}
                <span style={{ fontWeight: 700, marginLeft: '6px' }}>{product.rating}</span>
              </div>
              <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                {product.sold} Ratings
              </span>
              <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                120 Answered Questions
              </span>
            </div>

            {/* Price Box */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-display)' }}>
                  ₱{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span style={{ color: 'var(--text-light)', textDecoration: 'line-through', fontSize: '1.1rem', marginBottom: '4px' }}>
                    ₱{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <span style={{
                  background: 'var(--secondary)',
                  color: 'var(--bg-main)',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}>
                  SAVE ₱{(product.originalPrice - product.price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Trust badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary)', marginTop: '2px' }}></i>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>10 Year Warranty</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>On compressor</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <i className="fa-solid fa-truck" style={{ color: 'var(--primary)', marginTop: '2px' }}></i>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Free Delivery</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Within Metro Manila</p>
                </div>
              </div>
            </div>

            {/* Specs */}
            <div style={{ marginBottom: '1.5rem', flex: 1 }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Key Specifications</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {product.specs?.map((spec, index) => (
                  <li key={index} style={{ fontSize: '0.9rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                    <i className="fa-solid fa-check" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i>
                    {spec}
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '1rem', lineHeight: 1.6 }}>
                {product.description}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
              {/* Quantity */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}>
                <button
                  style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1.1rem' }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontWeight: 600, fontSize: '1rem' }}>{quantity}</span>
                <button
                  style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1.1rem' }}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>

              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={handleAddToCart}>
                <i className="fa-solid fa-cart-plus" style={{ marginRight: '6px' }}></i> Add to Cart
              </button>
              <button className="btn" style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-red)' }} onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '480px',
            width: '90%',
            position: 'relative',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <button onClick={() => setShowBuyModal(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'transparent', border: 'none', color: 'var(--text-light)',
              cursor: 'pointer', fontSize: '1.3rem',
            }}>
              <i className="fa-solid fa-times"></i>
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
              Complete Purchase
            </h3>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{product.name}</p>
              <p>Quantity: {quantity}</p>
              <p style={{ color: 'var(--accent-red)', fontWeight: 700, marginTop: '0.5rem', fontSize: '1.2rem' }}>
                Total: ₱{(product.price * quantity).toLocaleString()}
              </p>
            </div>

            <h4 style={{ fontWeight: 600, marginBottom: '0.8rem' }}>Select Payment Method</h4>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => setPaymentMode('cash')}
                style={{
                  flex: 1, padding: '1rem', border: `2px solid ${paymentMode === 'cash' ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                  background: paymentMode === 'cash' ? 'rgba(0,155,213,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Cash on Delivery</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '4px' }}>Pay upon receiving</div>
              </div>
              <div
                onClick={() => setPaymentMode('installment')}
                style={{
                  flex: 1, padding: '1rem', border: `2px solid ${paymentMode === 'installment' ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                  background: paymentMode === 'installment' ? 'rgba(0,155,213,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Installment</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '4px' }}>0% Interest</div>
              </div>
            </div>

            {paymentMode === 'installment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Employer Name" style={{
                  width: '100%', padding: '0.7rem 1rem', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)',
                }} />
                <input type="text" placeholder="Monthly Income (₱)" style={{
                  width: '100%', padding: '0.7rem 1rem', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)',
                }} />
                <select style={{
                  width: '100%', padding: '0.7rem 1rem', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)',
                }}>
                  <option>Select Valid ID</option>
                  <option>Passport</option>
                  <option>Driver&apos;s License</option>
                  <option>UMID</option>
                </select>
              </div>
            )}

            <button className="btn" style={{ width: '100%', padding: '0.85rem' }} onClick={confirmPurchase}>
              {paymentMode === 'cash' ? 'Confirm Order' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
