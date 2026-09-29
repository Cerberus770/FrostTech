'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAppState } from '@/context/AppStateContext';
import { CartItem } from '@/lib/types';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import GoogleMap from '@/components/GoogleMap';

function GeocodedMap({ address, onLocationSelect }: { address: string; onLocationSelect?: (coords: { lat: number; lng: number }) => void }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!address || address.length < 5) return;
    const timeout = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Philippines')}&limit=1`)
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            const newCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            setCoords(newCoords);
            if (onLocationSelect) onLocationSelect(newCoords);
          }
        })
        .catch(console.error);
    }, 800);
    return () => clearTimeout(timeout);
  }, [address]);

  return <GoogleMap height="220px" center={coords || undefined} markerPosition={coords || undefined} pinnable={true} onLocationSelect={onLocationSelect} />;
}

export default function CartPage() {
  const router = useRouter();
  const { state, setState, saveState } = useAppState();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutPayment, setCheckoutPayment] = useState('Cash on Delivery');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [downpaymentProof, setDownpaymentProof] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (userId) {
      // Fetch from API if logged in
      fetch(`/api/cart?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          setCartItems(data);
          calculateTotal(data);
        })
        .catch(console.error);

      // Check if new customer
      fetch(`/api/user/status?userId=${userId}`)
        .then(r => r.json())
        .then(data => setIsNewCustomer(data.isNewCustomer))
        .catch(console.error);
    } else {
      // Fallback to localStorage for guests
      try {
        const saved = JSON.parse(localStorage.getItem('frostTechCart') || '[]');
        setCartItems(saved);
        calculateTotal(saved);
      } catch {
        setCartItems([]);
      }
    }
  }, []);

  const calculateTotal = (items: CartItem[]) => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotal(sum);
  };

  const removeItem = async (id: string | number) => {
    const userId = sessionStorage.getItem('userId');
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    calculateTotal(updated);
    
    if (userId) {
      try {
        await fetch(`/api/cart?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Error deleting cart item', e);
      }
    } else {
      localStorage.setItem('frostTechCart', JSON.stringify(updated));
    }
  };

  const updateQuantity = async (id: string | number, delta: number) => {
    let newQuantity = 1;
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCartItems(updated);
    calculateTotal(updated);

    const userId = sessionStorage.getItem('userId');
    if (userId) {
      try {
        await fetch('/api/cart', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, quantity: newQuantity })
        });
      } catch (e) {
        console.error('Error updating cart item quantity', e);
      }
    } else {
      localStorage.setItem('frostTechCart', JSON.stringify(updated));
    }
  };

  const openCheckoutModal = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      alert('Please log in or sign up to continue to checkout.');
      router.push('/login');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    const isAcInCart = cartItems.some(item => item.price > 10000);
    if (isNewCustomer && isAcInCart && !downpaymentProof) {
      alert('Please upload proof of downpayment before placing your order.');
      return;
    }

    setIsSubmitting(true);

    const userId = sessionStorage.getItem('userId') || 'CUS-NEW';
    // Use Date.now() and a random suffix to ensure uniqueness and prevent Prisma P2002 error
    const orderNo = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    
    // Append coordinates if pinpoint was used
    const coordsString = deliveryCoords ? ` | COORDS:${deliveryCoords.lat},${deliveryCoords.lng}` : '';
    const finalLocation = `${checkoutAddress}${checkoutCity ? ', ' + checkoutCity : ''}${coordsString}`;
    
    const isInstallment = checkoutPayment === 'Installment';

    try {
      let res;
      if (isInstallment) {
        res = await fetch('/api/installments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: 'APP-' + Math.floor(1000 + Math.random() * 9000),
            userId: userId || 'guest',
            name: checkoutName,
            location: finalLocation,
            item: cartItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
            term: 6, // Default for now
            employer: 'To be provided in-store',
            income: 'To be provided in-store',
            idType: 'To be provided in-store',
            status: 'PENDING',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          }),
        });
      } else {
        const newOrder = {
          orderNo: orderNo,
          userId: userId,
          name: checkoutName,
          location: finalLocation,
          item: cartItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
          payment: checkoutPayment,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'Processing',
          downpaymentProof: downpaymentProof
        };

        res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder),
        });
      }

      if (!res.ok) {
        throw new Error('Failed to create purchase');
      }
      
      const savedOrder = await res.json();
      
      const newState = {
        ...state,
        orders: [savedOrder, ...state.orders]
      };

      setState(newState);
      saveState(newState);

      // Clear cart
      if (userId && userId !== 'CUS-NEW') {
        fetch(`/api/cart?userId=${userId}&clearAll=true`, { method: 'DELETE' }).catch(console.error);
      }
      localStorage.removeItem('frostTechCart');
      setCartItems([]);
      setTotal(0);

      setIsSubmitting(false);
      setShowCheckoutModal(false);
      alert('Order placed successfully! Thank you for your purchase.');
      router.push('/profile');
    } catch (err) {
      console.error(err);
      alert('There was an error processing your order. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDownloadInstallmentForm = () => {
    const formContent = `
=============================================================
         FROSTECH — INSTALLMENT APPLICATION FORM
=============================================================

Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

-------------------------------------------------------------
                     APPLICANT INFORMATION
-------------------------------------------------------------
Full Name:      ________________________________________
Date of Birth:  ________________________________________
Address:        ________________________________________
City:           ________________________________________
Contact No:     ________________________________________
Email:          ________________________________________

-------------------------------------------------------------
                    EMPLOYMENT DETAILS
-------------------------------------------------------------
Employer:       ________________________________________
Position:       ________________________________________
Monthly Income: ________________________________________
Length of Stay:  ________________________________________

-------------------------------------------------------------
                   VALID ID INFORMATION
-------------------------------------------------------------
ID Type:        ________________________________________
ID Number:      ________________________________________
Date Issued:    ________________________________________

-------------------------------------------------------------
                       ORDER DETAILS
-------------------------------------------------------------
${cartItems.map(i => `${i.quantity}x ${i.name}  —  ₱${(i.price * i.quantity).toLocaleString()}`).join('\n')}

Total Amount:   ₱${total.toLocaleString()}
Payment Plan:   Installment

-------------------------------------------------------------
                    TERMS & CONDITIONS
-------------------------------------------------------------
1. The applicant agrees to pay the monthly installment on
   or before the due date.
2. Late payments may incur a penalty of 3% per month.
3. FrostTech reserves the right to repossess the unit in
   case of non-payment exceeding 3 months.
4. A valid government-issued ID is required.

-------------------------------------------------------------
                        SIGNATURES
-------------------------------------------------------------

Applicant Signature: ___________________  Date: ___________

FrostTech Representative: ______________  Date: ___________

=============================================================
    Please submit this form to any FrostTech branch or
         email it to support@frostech.com
=============================================================
`;
    const blob = new Blob([formContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FrostTech_Installment_Application.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />

      <main style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2rem 5%',
        minHeight: 'calc(100vh - 70px)',
      }}>
        {/* Page Title */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem',
          fontWeight: 700,
          color: 'var(--text-dark)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <i className="fa-solid fa-cart-shopping" style={{ color: 'var(--primary)' }}></i>
          Shopping Cart
          {cartItems.length > 0 && (
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-light)',
              marginLeft: '0.25rem',
            }}>
              ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </span>
          )}
        </h1>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-lg)',
            padding: '5rem 2rem',
            textAlign: 'center',
          }}>
            <i className="fa-solid fa-cart-shopping" style={{
              fontSize: '4rem',
              color: 'rgba(255,255,255,0.08)',
              marginBottom: '1.5rem',
              display: 'block',
            }}></i>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
              Your cart is empty
            </h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Looks like you haven&apos;t added any air conditioners yet.
            </p>
            <Link href="/" className="btn" style={{
              background: 'var(--primary)',
              padding: '0.8rem 2rem',
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <i className="fa-solid fa-store"></i> Start Shopping
            </Link>
          </div>
        ) : (
          /* Cart Content */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '2rem',
            alignItems: 'flex-start',
          }}>
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'center',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                  {/* Product Image */}
                  <div style={{
                    width: '100px',
                    height: '100px',
                    background: 'var(--media-bg)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    flexShrink: 0,
                  }}>
                    <Image
                      src={item.image || '/hero-bg.png'}
                      alt={item.name}
                      width={80}
                      height={80}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>

                  {/* Product Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {item.brand}
                    </span>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text-dark)',
                      marginBottom: '0.4rem',
                      lineHeight: 1.3,
                    }}>
                      {item.name}
                    </h3>
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--accent-red)',
                    }}>
                      ₱{(item.price * item.quantity).toLocaleString()}
                      {item.quantity > 1 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 500, marginLeft: '0.5rem' }}>
                          (₱{item.price.toLocaleString()} each)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Quantity + Delete */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      title="Remove Item"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-light)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: '4px',
                        transition: 'color 0.2s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-red)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-light)')}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          background: 'var(--bg-card-alt)',
                          border: 'none',
                          color: 'var(--text-light)',
                          padding: '0.4rem 0.75rem',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 700,
                        }}
                      >−</button>
                      <span style={{
                        padding: '0.4rem 0.9rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-dark)',
                        minWidth: '2rem',
                        textAlign: 'center',
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          background: 'var(--bg-card-alt)',
                          border: 'none',
                          color: 'var(--text-light)',
                          padding: '0.4rem 0.75rem',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 700,
                        }}
                      >+</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue Shopping */}
              <Link href="/" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginTop: '0.5rem',
                textDecoration: 'none',
              }}>
                <i className="fa-solid fa-arrow-left"></i> Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div style={{
              position: 'sticky',
              top: '90px',
            }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-md)',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-dark)',
                  marginBottom: '1.25rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                    <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>₱{total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                    <span>Shipping Fee</span>
                    <span style={{ color: '#28a745', fontWeight: 600 }}>FREE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                    <span>Installation Fee</span>
                    <span style={{ color: '#28a745', fontWeight: 600 }}>FREE</span>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.25rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>Total</span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      color: 'var(--accent-red)',
                    }}>
                      ₱{total.toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'right', marginTop: '0.3rem' }}>
                    VAT included, where applicable
                  </p>
                </div>

                <button
                  onClick={openCheckoutModal}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: 'var(--accent-red-grad)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 24px -6px rgba(255, 107, 87, 0.4)',
                  }}
                >
                  Proceed to Checkout <i className="fa-solid fa-arrow-right"></i>
                </button>

                <div style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-light)',
                }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary)' }}></i>
                  Secure Checkout & Encryption
                </div>
              </div>

              {/* Trust Badges */}
              <div style={{
                marginTop: '1rem',
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-light)' }}>
                    <i className="fa-solid fa-truck-fast" style={{ color: 'var(--primary)', fontSize: '1rem', width: '20px', textAlign: 'center' }}></i>
                    <span>Free Standard Delivery Nationwide</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-light)' }}>
                    <i className="fa-solid fa-screwdriver-wrench" style={{ color: 'var(--primary)', fontSize: '1rem', width: '20px', textAlign: 'center' }}></i>
                    <span>Free Professional Installation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-light)' }}>
                    <i className="fa-solid fa-rotate-left" style={{ color: 'var(--primary)', fontSize: '1rem', width: '20px', textAlign: 'center' }}></i>
                    <span>7-Day Easy Returns</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-light)' }}>
                    <i className="fa-solid fa-award" style={{ color: 'var(--primary)', fontSize: '1rem', width: '20px', textAlign: 'center' }}></i>
                    <span>100% Authentic Products</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>\n      {/* ========== CHECKOUT MODAL ========== */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem',
        }} onClick={() => setShowCheckoutModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '560px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 1.75rem 1rem', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-credit-card" style={{ color: 'var(--primary)' }}></i> Checkout
              </h2>
              <button onClick={() => setShowCheckoutModal(false)} style={{
                background: 'none', border: 'none', color: 'var(--text-light)',
                fontSize: '1.3rem', cursor: 'pointer', padding: '0.25rem',
              }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem 1.75rem' }}>
              {/* Customer Information */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-user" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}></i> Customer Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.3rem' }}>Full Name <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                  <input type="text" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} placeholder="Juan Dela Cruz" style={{
                    width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: '8px',
                    fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dark)',
                  }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.3rem' }}>Phone <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                  <input type="tel" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} placeholder="0917-123-4567" style={{
                    width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: '8px',
                    fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dark)',
                  }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.3rem' }}>Email</label>
                  <input type="email" value={checkoutEmail} onChange={e => setCheckoutEmail(e.target.value)} placeholder="juan@email.com" style={{
                    width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: '8px',
                    fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dark)',
                  }} />
                </div>
              </div>

              {/* Delivery Address */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}></i> Delivery Address
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.3rem' }}>Street Address <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                  <AddressAutocomplete 
                    value={checkoutAddress}
                    onChange={setCheckoutAddress}
                    onPlaceSelected={(addr) => setCheckoutAddress(addr)}
                    placeholder="123 Main St, Brgy. San Antonio" 
                    style={{
                      width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: '8px',
                      fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dark)',
                    }} 
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.3rem' }}>City / Municipality</label>
                  <input type="text" value={checkoutCity} onChange={e => setCheckoutCity(e.target.value)} placeholder="Makati City" style={{
                    width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: '8px',
                    fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dark)',
                  }} />
                </div>

                {/* Pinpoint on Map */}
                <div style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
                  <button 
                    type="button"
                    onClick={() => setShowDeliveryMap(!showDeliveryMap)} 
                    style={{ 
                      background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', 
                      padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit', fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="fa-solid fa-map-location-dot"></i>
                    {showDeliveryMap ? 'Hide Map' : 'Pinpoint Delivery Location on Map'}
                  </button>
                  {showDeliveryMap && (
                    <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <GeocodedMap 
                        address={`${checkoutAddress} ${checkoutCity}`} 
                        onLocationSelect={(coords) => setDeliveryCoords(coords)} 
                      />
                      {deliveryCoords && (
                        <div style={{ 
                          padding: '0.5rem 0.75rem', background: 'rgba(0,155,213,0.08)', 
                          fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                          <i className="fa-solid fa-check-circle"></i>
                          Location pinned: {deliveryCoords.lat.toFixed(6)}, {deliveryCoords.lng.toFixed(6)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-wallet" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}></i> Payment Method
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {['Cash on Delivery', 'Credit Card', 'GCash / E-Wallet', 'Installment'].map(method => (
                  <label key={method} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                    border: `1.5px solid ${checkoutPayment === method ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                    background: checkoutPayment === method ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                  }}>
                    <input type="radio" name="payment" value={method} checked={checkoutPayment === method} onChange={() => setCheckoutPayment(method)} style={{ accentColor: 'var(--primary)' }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>{method}</span>
                      {method === 'Cash on Delivery' && <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '0.15rem 0 0' }}>Pay when your unit arrives</p>}
                      {method === 'Credit Card' && <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '0.15rem 0 0' }}>Visa, Mastercard, JCB</p>}
                      {method === 'GCash / E-Wallet' && <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '0.15rem 0 0' }}>GCash, Maya, GrabPay</p>}
                      {method === 'Installment' && <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '0.15rem 0 0' }}>6, 12, or 24 months — approval required</p>}
                    </div>
                    <i className={`fa-solid ${
                      method === 'Cash on Delivery' ? 'fa-money-bill-wave' :
                      method === 'Credit Card' ? 'fa-credit-card' :
                      method === 'GCash / E-Wallet' ? 'fa-mobile-screen-button' :
                      'fa-calendar-check'
                    }`} style={{ color: checkoutPayment === method ? 'var(--primary)' : 'var(--text-light)', fontSize: '1.1rem' }}></i>
                  </label>
                ))}
              </div>

              {/* Installment Download Section */}
              {checkoutPayment === 'Installment' && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <i className="fa-solid fa-circle-info" style={{ color: 'var(--primary)', marginTop: '0.15rem' }}></i>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.4rem' }}>
                        Installment Application Required
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                        Please download and fill out the installment application form. Submit it along with a valid government-issued ID to our branch or via email for approval.
                      </p>
                      <button onClick={handleDownloadInstallmentForm} className="btn" style={{
                        padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
                        background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        <i className="fa-solid fa-download"></i> Download Installment Form
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.3rem' }}>Order Notes (optional)</label>
                <textarea value={checkoutNotes} onChange={e => setCheckoutNotes(e.target.value)} rows={2} placeholder="Any special instructions for delivery..." style={{
                  width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: '8px',
                  fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dark)', resize: 'vertical',
                }} />
              </div>

              {/* Downpayment Proof Upload */}
              {isNewCustomer && cartItems.some(item => item.price > 10000) && (
                <div style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px dashed var(--accent-blue)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                    <i className="fa-solid fa-file-invoice-dollar"></i> Upload Proof of Downpayment (Required)
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>Please upload a screenshot or photo of your 15% downpayment receipt.</p>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setDownpaymentProof(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setDownpaymentProof(null);
                    }
                  }} style={{ width: '100%', fontSize: '0.85rem' }} />
                  {downpaymentProof && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#28a745', fontSize: '0.8rem', fontWeight: 600 }}>
                      <i className="fa-solid fa-check-circle"></i> Image uploaded successfully
                    </div>
                  )}
                </div>
              )}

              {/* Order Total */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '1rem 1.25rem',
                border: '1px solid var(--border-color)', marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  <span>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
                  <span>₱{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  <span>Delivery</span>
                  <span style={{ color: '#28a745', fontWeight: 600 }}>FREE</span>
                </div>
                
                {(() => {
                  const acTotal = cartItems.filter(item => item.price > 10000).reduce((acc, item) => acc + item.price * item.quantity, 0);
                  if (isNewCustomer && acTotal > 0) {
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                        <span>15% Downpayment (First-time AC Buyer)</span>
                        <span>₱{(acTotal * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-red)' }}>₱{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button onClick={handleConfirmCheckout} disabled={isSubmitting} className="btn" style={{
                width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700,
                background: isSubmitting ? '#888' : 'var(--accent-red-grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 8px 24px -6px rgba(255, 107, 87, 0.4)', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}>
                {isSubmitting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-solid fa-lock"></i> Confirm &amp; Place Order</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
