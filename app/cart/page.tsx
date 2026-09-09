'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faArrowRight, faShoppingCart, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { useAppState } from '@/context/AppStateContext';
import { CartItem } from '@/lib/types';

export default function CartPage() {
  const router = useRouter();
  const { state, setState, saveState } = useAppState();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('frostTechCart') || '[]');
      setCartItems(saved);
      calculateTotal(saved);
    } catch {
      setCartItems([]);
    }
  }, []);

  const calculateTotal = (items: CartItem[]) => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotal(sum);
  };

  const removeItem = (id: number) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    calculateTotal(updated);
    localStorage.setItem('frostTechCart', JSON.stringify(updated));
  };

  const updateQuantity = (id: number, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updated);
    calculateTotal(updated);
    localStorage.setItem('frostTechCart', JSON.stringify(updated));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Simulate checking if user is logged in
    const isCustomer = sessionStorage.getItem('isCustomer');
    if (!isCustomer) {
      alert('Please log in or sign up to continue to checkout.');
      router.push('/login');
      return;
    }

    // Push an order to global state
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 9000 + 1000)}`,
      cus_id: 'CUS-NEW', // In real app, get from auth
      name: 'Current User', // In real app, get from auth
      location: 'Metro Manila',
      item: cartItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
      payment: 'Cash on Delivery',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    const newState = {
      ...state,
      orders: [newOrder, ...state.orders]
    };
    
    setState(newState);
    saveState(newState);

    // Clear cart
    localStorage.removeItem('frostTechCart');
    setCartItems([]);
    setTotal(0);

    alert('Checkout successful! Your order has been placed.');
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <Header />

      <main className="max-w-6xl mx-auto p-4 md:p-8 mt-6">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-8 flex items-center gap-3">
          <FontAwesomeIcon icon={faShoppingCart} className="text-primary" />
          Shopping Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="bg-bg-card border border-border-subtle rounded-xl p-12 text-center">
            <FontAwesomeIcon icon={faShoppingCart} className="text-4xl text-border-subtle mb-4" />
            <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-text-muted mb-6">Looks like you haven't added any air conditioners yet.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items List */}
            <div className="flex-1 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-bg-card border border-border-subtle rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-24 h-24 bg-media-bg rounded-lg flex items-center justify-center p-2 shrink-0">
                    <Image src={item.image || '/hero-bg.png'} alt={item.name} width={80} height={80} className="object-contain" />
                  </div>
                  
                  <div className="flex-1">
                    <span className="text-xs text-text-muted uppercase">{item.brand}</span>
                    <h3 className="font-semibold text-text-primary text-sm md:text-base line-clamp-2">{item.name}</h3>
                    <p className="text-accent-red font-bold mt-1">₱{item.price.toLocaleString()}</p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-text-muted hover:text-accent-red transition-colors"
                      title="Remove Item"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <div className="flex items-center border border-border-subtle rounded bg-bg-input">
                      <button
                        className="px-3 py-1 text-text-muted hover:text-text-primary transition-colors"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        className="px-3 py-1 text-text-muted hover:text-text-primary transition-colors"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-80">
              <div className="bg-bg-card border border-border-subtle rounded-xl p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-4 border-b border-border-subtle pb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>₱{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Shipping Fee</span>
                    <span className="text-accent-green font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Installation Fee</span>
                    <span className="text-accent-green font-semibold">FREE</span>
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-bold text-accent-red">₱{total.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-text-muted text-right mt-1">VAT included, where applicable</p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 gradient-red text-white font-bold rounded-lg shadow-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </button>

                <div className="mt-4 flex items-center gap-2 justify-center text-xs text-text-muted">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-primary" />
                  <span>Secure Checkout & Encryption</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
