'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';

export default function ProfilePage() {
  const { state } = useAppState();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('tab-personal');
  const [sidebarActive, setSidebarActive] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [userName, setUserName] = useState('John Doe');
  const [userEmail, setUserEmail] = useState('test@frosttech.com');

  // Simple cart state for AC services
  const [serviceCart, setServiceCart] = useState<{unit: string, service: string, price: number, noteId: string, id: number}[]>([]);
  
  useEffect(() => {
    // Basic auth check
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/login');
    } else {
      setUserName(sessionStorage.getItem('userName') || 'John Doe');
      setUserEmail(sessionStorage.getItem('userEmail') || 'test@frosttech.com');
    }

    // Fetch user data
    fetch('/api/orders').then(r => r.json()).then(data => {
      // Filter for demo if needed, or just show all
      setOrders(data);
    }).catch(console.error);

    fetch('/api/installments').then(r => r.json()).then(data => {
      setInstallments(data);
    }).catch(console.error);
  }, [router]);

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth <= 768) {
      setSidebarActive(false);
    }
  };

  const addToCart = (unit: string, service: string, price: number, noteId: string) => {
    setServiceCart([...serviceCart, { id: Date.now(), unit, service, price, noteId }]);
    alert(`${service} for ${unit} added to cart!`);
  };

  const cartTotal = serviceCart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    if (serviceCart.length === 0) {
      alert('Cart is empty.');
      return;
    }
    alert('Services booked successfully! A technician will contact you soon.');
    setServiceCart([]);
  };

  return (
    <>
      <Header />

      {/* Profile Area */}
      <div style={{ padding: '1.5rem 5% 0' }}>
        <Link 
          href="/" 
          style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.3s' }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px' }}></i> Back to Home
        </Link>
      </div>

      <section className="profile-container">
        {/* Sidebar */}
        <aside className={`profile-sidebar ${sidebarActive ? 'active' : ''}`}>
          <h3><i className="fa-solid fa-circle-user" style={{ fontSize: '3rem', marginBottom: '10px', display: 'block' }}></i> My Account</h3>
          <ul className="profile-nav">
            <li><a href="#" className={`tab-link ${activeTab === 'tab-personal' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-personal'); }}><i className="fa-solid fa-id-card"></i> Personal Info</a></li>
            <li><a href="#" className={`tab-link ${activeTab === 'tab-acs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-acs'); }}><i className="fa-solid fa-fan"></i> Registered ACs</a></li>
            <li><a href="#" className={`tab-link ${activeTab === 'tab-schedule' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-schedule'); }}><i className="fa-regular fa-calendar-check"></i> Tech Schedule</a></li>
            <li><a href="#" className={`tab-link ${activeTab === 'tab-orders' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-orders'); }}><i className="fa-solid fa-box-open"></i> My Orders</a></li>
            <li><a href="#" className={`tab-link ${activeTab === 'tab-myacs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-myacs'); }}><i className="fa-solid fa-snowflake"></i> My ACs</a></li>
            <li><a href="#" className={`tab-link ${activeTab === 'tab-addresses' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-addresses'); }}><i className="fa-solid fa-location-dot"></i> Saved Addresses</a></li>
            <li><a href="#" className={`tab-link ${activeTab === 'tab-settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-settings'); }}><i className="fa-solid fa-gear"></i> Settings</a></li>
          </ul>
        </aside>

        {/* Main Content */}
        <div className="profile-content">
          <button className="btn mobile-only" onClick={toggleSidebar} style={{ marginBottom: '1rem', background: 'var(--secondary)', color: 'var(--text-dark)', border: 'none' }}>
            <i className="fa-solid fa-bars"></i> Profile Menu
          </button>
          
          {/* Personal Info Tab */}
          <div id="tab-personal" className={`tab-content ${activeTab === 'tab-personal' ? 'active' : ''}`}>
            <h2>Personal Information</h2>
            <div className="profile-details-grid">
              <div className="detail-group">
                <label>First Name</label>
                <p>{userName.split(' ')[0]}</p>
              </div>
              <div className="detail-group">
                <label>Last Name</label>
                <p>{userName.split(' ').slice(1).join(' ')}</p>
              </div>
              <div className="detail-group">
                <label>Email Address</label>
                <p>{userEmail}</p>
              </div>
              <div className="detail-group">
                <label>Phone Number</label>
                <p>+63 912 345 6789</p>
              </div>
            </div>
            <button className="btn" style={{ marginTop: '2rem' }}>Edit Information</button>
          </div>

          {/* Registered ACs Tab */}
          <div id="tab-acs" className={`tab-content ${activeTab === 'tab-acs' ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ border: 'none', padding: 0, margin: 0 }}>My Registered Air Conditioners</h2>
              <button className="btn btn-sm" id="btn-show-register" onClick={() => setShowRegisterForm(!showRegisterForm)}>
                <i className="fa-solid fa-plus"></i> Register AC
              </button>
            </div>

            {/* Registration Form */}
            <div className={`register-form ${showRegisterForm ? 'active' : ''}`} id="ac-register-form">
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Register a New Unit</h4>
              <div className="form-row">
                <input type="text" placeholder="Location (e.g. Living Room, Master Bedroom)" />
                <input type="text" placeholder="Brand & Model (e.g. Panasonic Inverter)" />
              </div>
              <div className="form-row">
                <select>
                  <option>Window Type</option>
                  <option>Split Type</option>
                  <option>Floor Standing</option>
                </select>
                <select>
                  <option>1.0 HP</option>
                  <option>1.5 HP</option>
                  <option>2.0 HP</option>
                  <option>2.5+ HP</option>
                </select>
              </div>
              <button className="btn btn-sm" onClick={() => { alert('AC Unit successfully registered!'); setShowRegisterForm(false); }}>
                Submit Registration
              </button>
            </div>

            <div className="service-cart-container">
              {/* Left Side: AC List */}
              <div className="ac-list" style={{ marginTop: 0 }}>
                {/* AC 1 */}
                <div className="ac-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div className="ac-info">
                      <h4><i className="fa-solid fa-fan" style={{ color: 'var(--text-light)', marginRight: '8px' }}></i> Master Bedroom</h4>
                      <p>Panasonic Premium Inverter Split Type (1.5 HP)</p>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Registered: Jan 15, 2026</p>
                    </div>
                    <div className="ac-actions" style={{ flexDirection: 'row' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => addToCart('Master Bedroom', 'Cleaning', 1500, 'note-1')}>
                        <i className="fa-solid fa-broom"></i> Add Cleaning
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => addToCart('Master Bedroom', 'Repair', 500, 'note-1')} style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>
                        <i className="fa-solid fa-wrench"></i> Add Repair
                      </button>
                    </div>
                  </div>
                  <input type="text" id="note-1" placeholder="Optional: Add a note (e.g. leaking water, strange noise...)" style={{ width: '100%', padding: '0.6rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input, rgba(255,255,255,0.05))', fontSize: '0.85rem', color: 'var(--text-dark)' }} />
                </div>

                {/* AC 2 */}
                <div className="ac-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div className="ac-info">
                      <h4><i className="fa-solid fa-fan" style={{ color: 'var(--text-light)', marginRight: '8px' }}></i> Living Room</h4>
                      <p>LG Dual Inverter Floor Standing (3.0 HP)</p>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Registered: Mar 02, 2026</p>
                    </div>
                    <div className="ac-actions" style={{ flexDirection: 'row' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => addToCart('Living Room', 'Cleaning', 2000, 'note-2')}>
                        <i className="fa-solid fa-broom"></i> Add Cleaning
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => addToCart('Living Room', 'Repair', 500, 'note-2')} style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>
                        <i className="fa-solid fa-wrench"></i> Add Repair
                      </button>
                    </div>
                  </div>
                  <input type="text" id="note-2" placeholder="Optional: Add a note (e.g. not cooling properly...)" style={{ width: '100%', padding: '0.6rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input, rgba(255,255,255,0.05))', fontSize: '0.85rem', color: 'var(--text-dark)' }} />
                </div>
              </div>

              {/* Right Side: Service Cart */}
              <aside className="service-cart">
                <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>Service Cart</h3>
                
                <div className="cart-items" id="cart-items-container">
                  {serviceCart.length === 0 ? (
                    <p className="empty-cart-msg">Your service cart is empty.<br />Add a service from your registered ACs.</p>
                  ) : (
                    serviceCart.map((item) => (
                      <div key={item.id} style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{item.service} - {item.unit}</div>
                        <div style={{ color: 'var(--accent-red)' }}>₱ {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </div>
                    ))
                  )}
                </div>
                
                <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>Total Est.</span>
                  <span id="cart-total" style={{ color: 'var(--accent-red)' }}>₱ {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <button className="btn" style={{ width: '100%' }} onClick={handleCheckout}>Checkout Services &rarr;</button>
              </aside>
            </div>
          </div>

          {/* Schedule Tab */}
          <div id="tab-schedule" className={`tab-content ${activeTab === 'tab-schedule' ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ border: 'none', padding: 0, margin: 0 }}>Technician Schedule</h2>
              <button className="btn btn-sm" onClick={() => { changeTab('tab-acs'); alert('Please add a service to your cart from your registered ACs to book a new slot!'); }}>
                <i className="fa-solid fa-calendar-plus"></i> Book New Slot
              </button>
            </div>
            
            <div className="calendar-wrapper" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', overflow: 'hidden' }}>
              <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button className="btn btn-sm btn-secondary"><i className="fa-solid fa-chevron-left"></i></button>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>July 2026</h3>
                <button className="btn btn-sm btn-secondary"><i className="fa-solid fa-chevron-right"></i></button>
              </div>
              
              <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                <div className="day-label" style={{ fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '10px' }}>Sun</div>
                <div className="day-label" style={{ fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '10px' }}>Mon</div>
                <div className="day-label" style={{ fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '10px' }}>Tue</div>
                <div className="day-label" style={{ fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '10px' }}>Wed</div>
                <div className="day-label" style={{ fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '10px' }}>Thu</div>
                <div className="day-label" style={{ fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '10px' }}>Fri</div>
                <div className="day-label" style={{ fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '10px' }}>Sat</div>
                
                {/* Dummy days */}
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', color: '#ccc' }}>28</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', color: '#ccc' }}>29</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', color: '#ccc' }}>30</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>1</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>2</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>3</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>4</div>
                
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>5</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>6</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>7</div>
                <div style={{ padding: '10px', border: '1px solid var(--primary)', background: '#E6F0FA', borderRadius: '4px', fontWeight: 'bold', position: 'relative' }}>
                  8
                  <div style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '2px', borderRadius: '2px', marginTop: '5px' }}>Cleaning</div>
                </div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>9</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>10</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>11</div>
                
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>12</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>13</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>14</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>15</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>16</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>17</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>18</div>
                
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>19</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>20</div>
                <div style={{ padding: '10px', border: '1px solid var(--accent-red)', background: '#FFEBEB', borderRadius: '4px', fontWeight: 'bold' }}>
                  21
                  <div style={{ fontSize: '0.65rem', background: 'var(--accent-red)', color: 'white', padding: '2px', borderRadius: '2px', marginTop: '5px' }}>Repair</div>
                </div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>22</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>23</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>24</div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>25</div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Upcoming Appointments</h3>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ marginBottom: '5px', color: 'var(--primary)' }}>Routine Cleaning</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '5px' }}><strong>Unit:</strong> Master Bedroom (Panasonic 1.5HP)</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}><i className="fa-regular fa-clock"></i> July 8, 2026 at 10:00 AM</p>
                  </div>
                  <button className="btn btn-sm btn-secondary">Reschedule</button>
                </div>
              </div>
              
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', borderLeft: '4px solid var(--accent-red)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ marginBottom: '5px', color: 'var(--accent-red)' }}>Repair Service</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '5px' }}><strong>Unit:</strong> Living Room (LG 3.0HP)</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}><i className="fa-regular fa-clock"></i> July 21, 2026 at 2:00 PM</p>
                  </div>
                  <button className="btn btn-sm btn-secondary">Reschedule</button>
                </div>
              </div>
            </div>
          </div>

          {/* My Orders Tab */}
          <div id="tab-orders" className={`tab-content ${activeTab === 'tab-orders' ? 'active' : ''}`}>
            <h2>My Orders</h2>
            {orders.length === 0 ? (
                <p>You have no orders yet.</p>
            ) : (
                orders.map(order => (
                    <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>Order {order.orderNo}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Processing</span>
                      </div>
                      <p style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>{order.item}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Ordered on: {order.date}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Payment Method: {order.payment}</p>
                    </div>
                ))
            )}
          </div>

          {/* My ACs Tab */}
          <div id="tab-myacs" className={`tab-content ${activeTab === 'tab-myacs' ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ border: 'none', padding: 0, margin: 0 }}>My Air Conditioners</h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>View all your purchased AC units, their payment status, and installment schedules.</p>

            {installments.length === 0 ? (
                <p>You have no registered ACs or installments.</p>
            ) : (
                installments.map(inst => (
                    <div key={inst.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)', borderLeft: inst.status === 'COMPLETED' ? '4px solid #28a745' : '4px solid #f59e0b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ background: inst.status === 'COMPLETED' ? 'rgba(40,167,69,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-fan" style={{ fontSize: '1.8rem', color: inst.status === 'COMPLETED' ? '#28a745' : '#f59e0b' }}></i>
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{inst.item}</h3>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '2px 0' }}>App ID: {inst.appId}</p>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Date: {inst.date}</p>
                          </div>
                        </div>
                        <span style={{ background: inst.status === 'COMPLETED' ? '#d4edda' : '#fff3cd', color: inst.status === 'COMPLETED' ? '#155724' : '#856404', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {inst.status === 'COMPLETED' ? <><i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i> Completed</> : <><i className="fa-solid fa-clock" style={{ marginRight: '4px' }}></i> {inst.status}</>}
                        </span>
                      </div>
                      
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '2px' }}>Term</p>
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>{inst.term} Months</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '2px' }}>Employer</p>
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>{inst.employer}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '2px' }}>Reported Income</p>
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>₱{inst.income}</p>
                        </div>
                      </div>

                      {inst.issue && (
                        <div style={{ background: 'rgba(220,53,69,0.05)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '8px', padding: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.5rem', color: 'var(--accent-red)' }}></i>
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--accent-red)', marginBottom: '2px' }}>Issue with Application</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{inst.issue}</p>
                          </div>
                        </div>
                      )}
                    </div>
                ))
            )}
          </div>

          {/* Saved Addresses Tab */}
          <div id="tab-addresses" className={`tab-content ${activeTab === 'tab-addresses' ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ border: 'none', padding: 0, margin: 0 }}>Saved Addresses</h2>
              <button className="btn btn-sm" onClick={() => setShowAddressForm(!showAddressForm)}>
                <i className="fa-solid fa-plus"></i> Add Address
              </button>
            </div>

            {/* Add Address Form */}
            <div id="address-form-container" style={{ display: showAddressForm ? 'block' : 'none', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}><i className="fa-solid fa-map-location-dot" style={{ marginRight: '8px' }}></i> Pin Your Location</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Pinpoint exact location for technicians</p>
                <div style={{height: "350px", width: "100%", marginBottom: "1rem", zIndex: 1}}>
                    <GoogleMap height="350px" />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Latitude</label>
                    <input type="text" id="addr-lat" readOnly style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', fontFamily: 'inherit', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Longitude</label>
                    <input type="text" id="addr-lng" readOnly style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', fontFamily: 'inherit', fontSize: '0.85rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Address Label</label>
                    <input type="text" id="addr-label" placeholder="e.g. Home, Office" style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Contact Number</label>
                    <input type="text" id="addr-phone" placeholder="+63 9XX XXX XXXX" style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Full Address / Landmark</label>
                  <input type="text" id="addr-full" placeholder="House #, Street, Barangay, City..." style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddressForm(false)}>Cancel</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => { alert('Address saved!'); setShowAddressForm(false); }}><i className="fa-solid fa-floppy-disk"></i> Save Address</button>
                </div>
              </div>
            </div>

            {/* Saved Address Cards */}
            <div id="saved-addresses-list">
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1rem', transition: 'transform 0.3s, boxShadow 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ marginBottom: '0.5rem' }}><i className="fa-solid fa-house" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> Home Address <span style={{ background: 'var(--primary-grad)', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', marginLeft: '10px' }}>Default</span></h4>
                    <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', lineHeight: 1.6 }}>John Doe<br />123 Cool Breeze Avenue<br />Barangay San Lorenzo<br />Makati City, Metro Manila 1223<br />+63 912 345 6789</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}><i className="fa-solid fa-pen"></i> Edit</a>
                    <a href="#" style={{ color: 'var(--accent-red)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}><i className="fa-solid fa-trash"></i> Delete</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Tab */}
          <div id="tab-settings" className={`tab-content ${activeTab === 'tab-settings' ? 'active' : ''}`}>
            <h2>Account Settings</h2>
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Email Notifications</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                <input type="checkbox" defaultChecked /> Receive order updates via email
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                <input type="checkbox" defaultChecked /> Receive promotional offers and discounts
              </label>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Change Password</h4>
              <div className="form-row" style={{ maxWidth: '400px' }}>
                <input type="password" placeholder="Current Password" />
              </div>
              <div className="form-row" style={{ maxWidth: '400px' }}>
                <input type="password" placeholder="New Password" />
              </div>
              <button className="btn btn-sm" onClick={() => alert('Password updated!')}>Update Password</button>
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
              <li><a href="https://www.facebook.com/FrostTechCoolingSolutionsCo" target="_blank" rel="noreferrer"><i className="fa-brands fa-facebook"></i> Facebook</a></li>
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
