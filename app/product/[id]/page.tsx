'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import Header from '@/components/Header';
import { products } from '@/lib/products';
import { Product, CartItem } from '@/lib/types';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cod');
  const [saveInfo, setSaveInfo] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutForm, setCheckoutForm] = useState({
    contact: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    barangay: '',
    postalCode: '',
    city: '',
    region: '',
    lat: 14.5995,
    lng: 120.9842,
  });
  const [showMap, setShowMap] = useState(false);

  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewTab, setReviewTab] = useState<'read' | 'write'>('read');
  const [selectedCondition, setSelectedCondition] = useState<string>('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const resolvedParams = use(params);
  const { id } = resolvedParams;

  useEffect(() => {
    const p = products.find((p) => p.id === id);
    if (p) {
      setProduct(p);
    }
    // Load saved info if exists
    const saved = localStorage.getItem('frostTechCheckoutInfo');
    if (saved) {
      try {
        setCheckoutForm(JSON.parse(saved));
      } catch {}
    }
    // Fetch reviews for this product
    fetch(`/api/reviews?productId=${id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setReviews(data); })
      .catch(() => {});

    // Fetch product from DB
    fetch('/api/products')
      .then(r => r.json())
      .then((dbProducts: any[]) => {
        const dbProd = dbProducts.find((dp: any) => dp.slug === id || dp.id === id);
        if (dbProd) {
          setProduct((prev: any) => {
            // Merge static data with DB data, or just use DB data if new
            const merged = prev ? { ...prev, ...dbProd } : dbProd;
            return merged;
          });
          if (dbProd.variants && dbProd.variants.length > 0) {
            setSelectedCondition(dbProd.variants[0].condition);
          }
        }
      })
      .catch(() => {});
  }, [id]);

  const handleSubmitReview = async () => {
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');
    if (!userId || !userName) {
      alert('Please log in to submit a review.');
      return;
    }
    if (!reviewComment.trim()) {
      alert('Please write a comment.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          userId,
          userName,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews(prev => [newReview, ...prev]);
        setReviewComment('');
        setReviewRating(5);
        setReviewTab('read');
        alert('Review submitted successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit review.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) : 0;

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
    setCheckoutStep(1);
    setShowBuyModal(true);
  };

  const updateForm = (field: string, value: string) => {
    setCheckoutForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (checkoutStep === 1) {
      if (!checkoutForm.contact) { alert('Please enter your email or phone number.'); return; }
      setCheckoutStep(2);
    } else if (checkoutStep === 2) {
      if (!checkoutForm.firstName || !checkoutForm.lastName || !checkoutForm.address || !checkoutForm.barangay || !checkoutForm.city || !checkoutForm.region) {
        alert('Please fill in all required address fields.'); return;
      }
      if (saveInfo) {
        localStorage.setItem('frostTechCheckoutInfo', JSON.stringify(checkoutForm));
      }
      setCheckoutStep(3);
    }
  };

  const confirmPurchase = async () => {
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName') || `${checkoutForm.firstName} ${checkoutForm.lastName}`;
    const paymentLabels: Record<string, string> = { gcash: 'GCash', bank: 'Bank Transfer', cod: 'Cash on Arrival', installment: 'Installment' };
    const fullAddress = `${checkoutForm.address}, ${checkoutForm.barangay}, ${checkoutForm.city}, ${checkoutForm.region} | COORDS:${checkoutForm.lat},${checkoutForm.lng}`;

    try {
      let res;
      if (paymentMode === 'installment') {
        res = await fetch('/api/installments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: 'APP-' + Math.floor(1000 + Math.random() * 9000),
            userId: userId || 'guest',
            name: userName,
            location: fullAddress,
            item: `${product!.brand} ${product!.name} (x${quantity})`,
            term: 6, // default or placeholder since it's applied in-store
            employer: 'To be provided in-store',
            income: 'To be provided in-store',
            idType: 'To be provided in-store',
            status: 'PENDING',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          }),
        });
      } else {
        res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNo: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            userId: userId || 'guest',
            name: userName,
            location: fullAddress,
            item: `${product!.brand} ${product!.name} (x${quantity})`,
            payment: paymentLabels[paymentMode] || paymentMode,
            status: 'Processing',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          }),
        });
      }

      if (!res.ok) throw new Error('Failed to submit');

      setShowBuyModal(false);
      alert(paymentMode === 'installment' 
        ? `Thank you! Your installment application has been submitted.\nPlease visit our store to complete the requirements.`
        : `Thank you! Your order has been placed.\nPayment: ${paymentLabels[paymentMode]}\nTotal: ₱${((product?.price || 0) * quantity).toLocaleString()}`);
      router.push('/');
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Something went wrong. Please try again.');
    }
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
        <div className="product-details-wrapper" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
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
              <img src={product.image} alt={product.name} style={{ width: '400px', height: '400px', objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} />
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

            {/* Condition Variant Tabs */}
            {(product as any).variants && (product as any).variants.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '0.8rem', fontSize: '0.95rem' }}>Condition</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(product as any).variants.map((variant: any) => {
                    const isSelected = selectedCondition === variant.condition;
                    const condIcon = variant.condition === 'Brand New' ? 'fa-sparkles' : variant.condition === 'Second Hand' ? 'fa-recycle' : 'fa-warehouse';
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedCondition(variant.condition)}
                        style={{
                          flex: 1, minWidth: '120px', padding: '0.8rem 1rem',
                          background: isSelected ? 'rgba(0,155,213,0.08)' : 'transparent',
                          border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                          textAlign: 'center', color: 'var(--text-dark)',
                        }}
                      >
                        <i className={`fa-solid ${condIcon}`} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-light)', marginBottom: '4px', fontSize: '1rem', display: 'block' }}></i>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{variant.condition}</div>
                        <div style={{ fontWeight: 800, color: 'var(--accent-red)', fontSize: '1rem', marginTop: '2px' }}>
                          ₱{variant.price.toLocaleString()}
                        </div>
                        {variant.stock > 0 ? (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', marginTop: '2px' }}>{variant.stock} in stock</div>
                        ) : (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', marginTop: '2px' }}>Out of stock</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* Customer Reviews */}
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>
                    <i className="fa-solid fa-comments" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                    Customer Reviews
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700 }}>{reviews.length > 0 ? avgRating.toFixed(1) : '—'}</span>
                    <span style={{ color: '#f59e0b', letterSpacing: '1px' }}>
                      {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                    </span>
                    <span style={{ color: 'var(--text-light)' }}>({reviews.length})</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className={`btn ${reviewTab === 'read' ? '' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
                    onClick={() => setReviewTab('read')}
                  >
                    <i className="fa-solid fa-book-open" style={{ marginRight: '4px' }}></i>Read
                  </button>
                  <button
                    className={`btn ${reviewTab === 'write' ? '' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
                    onClick={() => setReviewTab('write')}
                  >
                    <i className="fa-solid fa-pen" style={{ marginRight: '4px' }}></i>Write
                  </button>
                </div>
              </div>

              {/* Write Review */}
              {reviewTab === 'write' && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem',
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-light)' }}>Your Rating</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHover(star)}
                          onMouseLeave={() => setReviewHover(0)}
                          onClick={() => setReviewRating(star)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '1.4rem', transition: 'transform 0.15s',
                            color: (reviewHover || reviewRating) >= star ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                            transform: (reviewHover || reviewRating) >= star ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          ★
                        </button>
                      ))}
                      <span style={{ marginLeft: '6px', fontSize: '0.8rem', color: 'var(--text-light)', alignSelf: 'center' }}>
                        {reviewRating === 5 ? 'Excellent!' : reviewRating === 4 ? 'Great!' : reviewRating === 3 ? 'Good' : reviewRating === 2 ? 'Fair' : 'Poor'}
                      </span>
                    </div>
                  </div>
                  <textarea
                    placeholder="Tell other customers about your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)',
                      fontSize: '0.88rem', fontFamily: 'inherit', color: 'var(--text-dark)',
                      outline: 'none', resize: 'vertical', marginBottom: '0.75rem',
                    }}
                  />
                  <button
                    className="btn"
                    style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    <i className="fa-solid fa-paper-plane" style={{ marginRight: '5px' }}></i>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}

              {/* Reviews List */}
              {reviewTab === 'read' && (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                      <i className="fa-regular fa-comment-dots" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', display: 'block', opacity: 0.5 }}></i>
                      No reviews yet. Be the first!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {reviews.map((review: any) => (
                        <div key={review.id} style={{
                          padding: '0.8rem', borderRadius: 'var(--radius-md)',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: 'var(--primary-grad)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                              }}>
                                {review.userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{review.userName}</div>
                                <div style={{ color: '#f59e0b', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                              {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-dark)', margin: 0 }}>
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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


      {/* Buy Modal - Multi-Step Checkout */}
      {showBuyModal && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setShowBuyModal(false); }}>
          <div className="responsive-modal" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '560px',
            width: '94%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: 'var(--shadow-lg)',
          }}>
            {/* Close Button */}
            <button onClick={() => setShowBuyModal(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'transparent', border: 'none', color: 'var(--text-light)',
              cursor: 'pointer', fontSize: '1.3rem',
            }}>
              <i className="fa-solid fa-times"></i>
            </button>

            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700,
                    background: checkoutStep >= step ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: checkoutStep >= step ? 'white' : 'var(--text-light)',
                    border: `2px solid ${checkoutStep >= step ? 'var(--primary)' : 'var(--border-color)'}`,
                    transition: 'all 0.3s',
                  }}>
                    {checkoutStep > step ? <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }}></i> : step}
                  </div>
                  {step < 3 && <div style={{ width: '40px', height: '2px', background: checkoutStep > step ? 'var(--primary)' : 'var(--border-color)', transition: 'all 0.3s' }}></div>}
                </div>
              ))}
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                {checkoutStep === 1 && 'Contact'}{checkoutStep === 2 && 'Delivery'}{checkoutStep === 3 && 'Payment'}
              </span>
            </div>

            {/* Order Summary Bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(0,155,213,0.06)', border: '1px solid rgba(0,155,213,0.15)',
              marginBottom: '1.5rem', fontSize: '0.9rem',
            }}>
              <span style={{ color: 'var(--text-light)' }}>{product.name} × {quantity}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-red)' }}>₱{(product.price * quantity).toLocaleString()}</span>
            </div>

            {/* Step 1: Contact */}
            {checkoutStep === 1 && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem', fontFamily: 'var(--font-display)' }}>
                  <i className="fa-solid fa-address-book" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>Contact Information
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '1.2rem' }}>We&apos;ll use this to send you order updates.</p>
                <input
                  type="text"
                  placeholder="Email or mobile phone number"
                  value={checkoutForm.contact}
                  onChange={(e) => updateForm('contact', e.target.value)}
                  style={{
                    width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)',
                    fontSize: '0.95rem', fontFamily: 'inherit', color: 'var(--text-dark)',
                    outline: 'none', transition: 'border 0.2s',
                  }}
                />
                <button className="btn" style={{ width: '100%', padding: '0.85rem', marginTop: '1.5rem' }} onClick={handleNextStep}>
                  Continue to Delivery <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
                </button>
              </div>
            )}

            {/* Step 2: Delivery Address */}
            {checkoutStep === 2 && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem', fontFamily: 'var(--font-display)' }}>
                  <i className="fa-solid fa-truck" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>Delivery Address
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '1.2rem' }}>Where should we deliver your order?</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input type="text" placeholder="First name *" value={checkoutForm.firstName} onChange={(e) => updateForm('firstName', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)' }} />
                  <input type="text" placeholder="Last name *" value={checkoutForm.lastName} onChange={(e) => updateForm('lastName', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)' }} />
                </div>

                <input type="text" placeholder="Address *" value={checkoutForm.address} onChange={(e) => updateForm('address', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)', marginTop: '0.75rem' }} />

                <input type="text" placeholder="Apartment, suite, etc. (optional)" value={checkoutForm.apartment} onChange={(e) => updateForm('apartment', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)', marginTop: '0.75rem' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <input type="text" placeholder="Barangay *" value={checkoutForm.barangay} onChange={(e) => updateForm('barangay', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)' }} />
                  <input type="text" placeholder="Postal code" value={checkoutForm.postalCode} onChange={(e) => updateForm('postalCode', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <input type="text" placeholder="City *" value={checkoutForm.city} onChange={(e) => updateForm('city', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)' }} />
                  <input type="text" placeholder="Region *" value={checkoutForm.region} onChange={(e) => updateForm('region', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-dark)' }} />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <button onClick={() => setShowMap(!showMap)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-map-location-dot"></i>
                    {showMap ? 'Hide Map' : 'Pinpoint on Google Maps'}
                  </button>
                  {showMap && isLoaded && (
                    <div style={{ width: '100%', height: '250px', marginTop: '1rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{ lat: Number(checkoutForm.lat) || 14.5995, lng: Number(checkoutForm.lng) || 120.9842 }}
                        zoom={14}
                        onClick={(e) => {
                          if (e.latLng) {
                            updateForm('lat', e.latLng.lat().toString());
                            updateForm('lng', e.latLng.lng().toString());
                          }
                        }}
                      >
                        <Marker position={{ lat: Number(checkoutForm.lat), lng: Number(checkoutForm.lng) }} draggable={true} onDragEnd={(e) => {
                          if (e.latLng) {
                            updateForm('lat', e.latLng.lat().toString());
                            updateForm('lng', e.latLng.lng().toString());
                          }
                        }} />
                      </GoogleMap>
                    </div>
                  )}
                </div>

                {/* Save Info Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-light)' }}>
                  <input type="checkbox" checked={saveInfo} onChange={() => setSaveInfo(!saveInfo)}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                  <i className="fa-solid fa-bookmark" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}></i>
                  Save this information for next time
                </label>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '0.8rem' }} onClick={() => setCheckoutStep(1)}>
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i> Back
                  </button>
                  <button className="btn" style={{ flex: 2, padding: '0.8rem' }} onClick={handleNextStep}>
                    Continue to Payment <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {checkoutStep === 3 && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem', fontFamily: 'var(--font-display)' }}>
                  <i className="fa-solid fa-credit-card" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>Payment Method
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '1.2rem' }}>Choose how you&apos;d like to pay.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.5rem' }}>
                  {[
                    { id: 'gcash', label: 'GCash', icon: 'fa-solid fa-mobile-screen-button', desc: 'Pay via GCash e-wallet' },
                    { id: 'bank', label: 'Bank Transfer', icon: 'fa-solid fa-building-columns', desc: 'Direct bank deposit or transfer' },
                    { id: 'cod', label: 'Cash on Arrival', icon: 'fa-solid fa-money-bill-wave', desc: 'Pay when your order arrives' },
                    { id: 'installment', label: 'Installment', icon: 'fa-solid fa-file-invoice-dollar', desc: 'Apply for monthly installment plan' },
                  ].map(method => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMode(method.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1rem 1.2rem',
                        border: `2px solid ${paymentMode === method.id ? 'var(--primary)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        background: paymentMode === method.id ? 'rgba(0,155,213,0.08)' : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: `2px solid ${paymentMode === method.id ? 'var(--primary)' : 'var(--border-color)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {paymentMode === method.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                      </div>
                      <i className={method.icon} style={{ color: paymentMode === method.id ? 'var(--primary)' : 'var(--text-light)', fontSize: '1.2rem', width: '24px', textAlign: 'center' }}></i>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{method.label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>{method.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div style={{
                  padding: '1rem 1.2rem', borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                  marginBottom: '1.5rem', fontSize: '0.88rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-light)' }}>Ship to</span>
                    <span>{checkoutForm.address}, {checkoutForm.barangay}, {checkoutForm.city}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-light)' }}>Contact</span>
                    <span>{checkoutForm.contact}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-red)', fontSize: '1.1rem' }}>₱{(product.price * quantity).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '0.8rem' }} onClick={() => setCheckoutStep(2)}>
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i> Back
                  </button>
                  <button className="btn" style={{ flex: 2, padding: '0.85rem', background: 'var(--accent-red)' }} onClick={confirmPurchase}>
                    <i className="fa-solid fa-lock" style={{ marginRight: '6px' }}></i> Place Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
