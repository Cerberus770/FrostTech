'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useAppState } from '@/context/AppStateContext';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';
import { useConfirmModal } from '@/components/ConfirmModal';

interface MaintenanceItem {
  id: string;
  scheduleNo: string;
  name: string;
  phone: string;
  address: string;
  item: string;
  serviceType: string;
  scheduledDate: string;
  technicianName?: string;
}

export default function ProfilePage() {
  const { state } = useAppState();
  const router = useRouter();
  const { confirm, showAlert, ModalComponent } = useConfirmModal();
  
  const [activeTab, setActiveTab] = useState('tab-personal');
  const [sidebarActive, setSidebarActive] = useState(false); // Mobile sidebar toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse toggle
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingUnit, setBookingUnit] = useState('Master Bedroom — Carrier Inverter');
  const [bookingService, setBookingService] = useState('Deep Cleaning');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [bookingNotes, setBookingNotes] = useState('');

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [myAcsPage, setMyAcsPage] = useState(1);
  const [installments, setInstallments] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [dispatch, setDispatch] = useState<any[]>([]);
  const [userPhone, setUserPhone] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [serviceCart, setServiceCart] = useState<{unit: string, service: string, price: number, note: string, id: number}[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<any>(null);

  // Registered ACs state
  const [registeredACs, setRegisteredACs] = useState<any[]>([]);
  const [regAcsPage, setRegAcsPage] = useState(1);
  const [regLocation, setRegLocation] = useState('');
  const [regBrandModel, setRegBrandModel] = useState('');
  const [regAcType, setRegAcType] = useState('Window Type');
  const [regHorsepower, setRegHorsepower] = useState('1.0 HP');
  const [regPaymentType, setRegPaymentType] = useState('Cash');
  const [regTotalPrice, setRegTotalPrice] = useState('');
  const [regMonths, setRegMonths] = useState('6');
  const [regPricePerMonth, setRegPricePerMonth] = useState('');
  const [regLat, setRegLat] = useState<number | null>(null);
  const [regLng, setRegLng] = useState<number | null>(null);
  const [regFullAddress, setRegFullAddress] = useState('');

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrFull, setAddrFull] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Lat/Lng state for map pin
  const [addrLat, setAddrLat] = useState<number | null>(null);
  const [addrLng, setAddrLng] = useState<number | null>(null);

  useEffect(() => {
    // Basic auth check
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/login');
    } else {
      setUserName(sessionStorage.getItem('userName') || 'John Doe');
      setUserEmail(sessionStorage.getItem('userEmail') || 'test@frosttech.com');
      const storedName = sessionStorage.getItem('userName') || 'John Doe';
      setEditFirstName(storedName.split(' ')[0]);
      setEditLastName(storedName.split(' ').slice(1).join(' '));
    }

    // Fetch user data
    const userId = sessionStorage.getItem('userId');
    if (userId) {
      fetch(`/api/orders?userId=${userId}`).then(r => r.json()).then(data => {
        setOrders(data);
      }).catch(console.error);

      fetch(`/api/installments?userId=${userId}`).then(r => r.json()).then(data => {
        setInstallments(data);
      }).catch(console.error);

      fetch(`/api/maintenance?userId=${userId}`).then(r => r.json()).then(data => {
        setMaintenance(data);
      }).catch(console.error);
      
      fetch(`/api/dispatch?userId=${userId}`).then(r => r.json()).then(data => {
        setDispatch(data);
      }).catch(console.error);
      
      fetch(`/api/addresses?userId=${userId}`).then(r => r.json()).then(data => {
        setSavedAddresses(data);
      }).catch(console.error);

      fetch(`/api/registered-acs?userId=${userId}`).then(r => r.json()).then(data => {
        setRegisteredACs(data);
      }).catch(console.error);

      // Fetch user phone from database
      fetch(`/api/users/customers`).then(r => r.json()).then((customers: any[]) => {
        const me = customers.find((c: any) => c.id === userId);
        if (me && me.phone && me.phone !== 'N/A') {
          setUserPhone(me.phone);
          setEditPhone(me.phone);
        }
      }).catch(console.error);
    }
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

  const handleSaveAddress = async () => {
    if (!addrLabel || !addrFull || !addrPhone) {
      alert('Please fill out the label, phone, and full address fields.');
      return;
    }
    
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    const newAddress = {
      userId,
      label: addrLabel,
      isDefault: savedAddresses.length === 0,
      fullAddress: addrFull,
      phone: addrPhone,
      lat: addrLat,
      lng: addrLng
    };
    
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });
      
      if (res.ok) {
        const saved = await res.json();
        setSavedAddresses([saved, ...savedAddresses.map(a => saved.isDefault ? { ...a, isDefault: false } : a)]);
        setAddrLabel('');
        setAddrPhone('');
        setAddrFull('');
        setAddrLat(null);
        setAddrLng(null);
        setShowAddressForm(false);
        setToastMsg('Address saved successfully!');
        setTimeout(() => setToastMsg(''), 2500);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedAddresses(savedAddresses.filter(a => a.id !== id));
        setToastMsg('Address deleted');
        setTimeout(() => setToastMsg(''), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      showAlert({ title: 'Validation Error', message: 'Please fill out both password fields', type: 'warning' });
      return;
    }
    
    const isConfirmed = await confirm({
      title: 'Update Password',
      message: 'Are you sure you want to change your password?'
    });
    if (!isConfirmed) return;

    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    try {
      const res = await fetch('/api/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword })
      });
      
      if (res.ok) {
        setToastMsg('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setToastMsg(''), 2500);
      } else {
        const data = await res.json();
        showAlert({ title: 'Error', message: data.error || 'Failed to update password', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Error updating password', type: 'error' });
    }
  };

  const handleTogglePause = async (id: string, currentStatus: boolean) => {
    const isConfirmed = await confirm({
      title: `${currentStatus ? 'Resume' : 'Pause'} Maintenance`,
      message: `Are you sure you want to ${currentStatus ? 'resume' : 'pause'} the maintenance schedule for this AC unit?`,
      type: currentStatus ? 'confirm' : 'warning'
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/registered-acs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPaused: !currentStatus })
      });
      if (res.ok) {
        setRegisteredACs(prev => prev.map(ac => ac.id === id ? { ...ac, isPaused: !currentStatus } : ac));
        setToastMsg(`Maintenance schedule ${!currentStatus ? 'paused' : 'resumed'}`);
        setTimeout(() => setToastMsg(''), 2500);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating AC status');
    }
  };

  const addToCart = (unit: string, service: string, price: number, noteId: string) => {
    const noteEl = document.getElementById(noteId) as HTMLInputElement | null;
    const note = noteEl?.value || '';
    setServiceCart(prev => [...prev, { id: Date.now(), unit, service, price, note }]);
    setToastMsg(`${service} for ${unit} added to cart!`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const removeFromCart = (id: number) => {
    setServiceCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = serviceCart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (serviceCart.length === 0) {
      setToastMsg('Cart is empty — add a service first!');
      setTimeout(() => setToastMsg(''), 2500);
      return;
    }

    const isConfirmed = await confirm({
      title: 'Confirm Checkout',
      message: `Are you sure you want to checkout these ${serviceCart.length} service(s) for ₱${cartTotal.toLocaleString()}?`,
      confirmText: 'Checkout'
    });
    if (!isConfirmed) return;

    const userId = sessionStorage.getItem('userId');
    if (userId) {
      for (const item of serviceCart) {
        // Find the matching registered AC to get its coordinates
        const matchingAC = registeredACs.find(ac => item.unit.includes(ac.location) && item.unit.includes(ac.brandModel));
        let locationStr = matchingAC?.fullAddress || 'Default Address';
        if (matchingAC?.lat && matchingAC?.lng) {
          locationStr = `${locationStr} | COORDS:${matchingAC.lat},${matchingAC.lng}`;
        }
        
        await fetch('/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dispatchNo: 'DIS-' + Math.floor(1000 + Math.random() * 9000),
            type: item.service,
            customerId: userId,
            name: userName,
            location: locationStr,
            item: item.unit,
            notes: item.note || '',
            status: 'Queued'
          })
        });
      }
    }

    setToastMsg('Services booked successfully! A technician will contact you soon.');
    setTimeout(() => setToastMsg(''), 3000);
    setServiceCart([]);
  };

  // Calendar helpers
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();

  const getEventsForDay = (day: number) => {
    const maints = maintenance.map(m => ({ ...m, isDispatch: false }));
    const dispatches = dispatch.filter(d => d.scheduledDate).map(d => ({ ...d, serviceType: d.type, isDispatch: true }));
    const allEvents = [...maints, ...dispatches];

    return allEvents.filter(e => {
      if (!e.scheduledDate) return false;
      const dateOnly = e.scheduledDate.split(' ')[0]; // Extract YYYY-MM-DD
      const mDate = new Date(dateOnly);
      if (isNaN(mDate.getTime())) return false;
      
      return mDate.getDate() === day && mDate.getMonth() === calendarDate.getMonth() && mDate.getFullYear() === calendarDate.getFullYear();
    });
  };

  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

  // Get upcoming appointments from maintenance and dispatch data
  const upcomingAppointments = (() => {
    const maints = maintenance.map(m => ({ ...m, isDispatch: false }));
    const dispatches = dispatch.filter(d => d.scheduledDate).map(d => ({ ...d, serviceType: d.type, isDispatch: true }));
    const allEvents = [...maints, ...dispatches];
    
    return allEvents
      .filter(e => {
        if (!e.scheduledDate) return false;
        const dateOnly = e.scheduledDate.split(' ')[0];
        const d = new Date(dateOnly);
        if (isNaN(d.getTime())) return false;
        return d.setHours(0,0,0,0) >= new Date().setHours(0,0,0,0);
      })
      .sort((a, b) => {
        const aDate = new Date(a.scheduledDate.split(' ')[0]);
        const bDate = new Date(b.scheduledDate.split(' ')[0]);
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 5);
  })();

  return (
    <>
      <ModalComponent />
      <Header hideSearch />

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
          background: 'linear-gradient(135deg, var(--primary), #0077a3)',
          color: 'white', padding: '1rem 1.5rem', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,155,213,0.35)',
          fontWeight: 600, fontSize: '0.9rem',
          animation: 'slideInRight 0.3s ease-out',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <i className="fa-solid fa-circle-check"></i> {toastMsg}
        </div>
      )}

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
        {/* Mobile Sidebar Overlay */}
        <div className={`sidebar-backdrop ${sidebarActive ? 'show' : ''}`} onClick={() => setSidebarActive(false)}></div>

        {/* Mobile Sidebar Toggle Button */}
        <div className="mobile-only" style={{ position: 'fixed', top: '80px', left: '10px', zIndex: 40, width: '40px', height: '40px' }}>
          <button onClick={toggleSidebar} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', cursor: 'pointer', fontSize: '1.2rem' }}>
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        {/* Sidebar */}
        <aside className={`profile-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${sidebarActive ? 'mobile-active' : ''}`}>
          
          <div className="sidebar-header">
            <h3>My Account</h3>
            <button className="sidebar-toggle-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <i className={`fa-solid ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
            </button>
          </div>

          <div className="sidebar-user-card">
            <div className="user-avatar">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-meta">
              <h4>{userName}</h4>
              <p>{userEmail}</p>
            </div>
          </div>

          <ul className="profile-nav">
            <li><a href="#" data-tooltip="Personal Info" className={`tab-link ${activeTab === 'tab-personal' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-personal'); }}><i className="fa-solid fa-id-card"></i> <span className="nav-label">Personal Info</span></a></li>
            <li><a href="#" data-tooltip="My Orders" className={`tab-link ${activeTab === 'tab-orders' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-orders'); }}><i className="fa-solid fa-box-open"></i> <span className="nav-label">My Orders</span></a></li>
            <li><a href="#" data-tooltip="My ACs & Installments" className={`tab-link ${activeTab === 'tab-myacs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-myacs'); }}><i className="fa-solid fa-snowflake"></i> <span className="nav-label">My ACs & Installments</span></a></li>
            <li>
              <a href="#" data-tooltip="Registered ACs" className={`tab-link ${activeTab === 'tab-acs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-acs'); }}>
                <i className="fa-solid fa-fan"></i> 
                <span className="nav-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Registered ACs 
                  {serviceCart.length > 0 && <span style={{ background: 'var(--accent-red)', color: 'white', borderRadius: '50%', padding: '2px 7px', fontSize: '0.7rem' }}>{serviceCart.length}</span>}
                </span>
                {isSidebarCollapsed && serviceCart.length > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--accent-red)', color: 'white', borderRadius: '50%', width: '14px', height: '14px', fontSize: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{serviceCart.length}</span>
                )}
              </a>
            </li>
            <li><a href="#" data-tooltip="Tech Schedule" className={`tab-link ${activeTab === 'tab-schedule' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-schedule'); }}><i className="fa-regular fa-calendar-check"></i> <span className="nav-label">Tech Schedule</span></a></li>
            <li><a href="#" data-tooltip="Saved Addresses" className={`tab-link ${activeTab === 'tab-addresses' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-addresses'); }}><i className="fa-solid fa-location-dot"></i> <span className="nav-label">Saved Addresses</span></a></li>
            <li><a href="#" data-tooltip="Settings" className={`tab-link ${activeTab === 'tab-settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); changeTab('tab-settings'); }}><i className="fa-solid fa-gear"></i> <span className="nav-label">Settings</span></a></li>
          </ul>
        </aside>

        {/* Main Content */}
        <div className={`profile-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          
          <div id="tab-personal" className={`tab-content ${activeTab === 'tab-personal' ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ border: 'none', padding: 0, margin: 0 }}>Personal Information</h2>
              {!isEditingProfile && (
                <button className="btn btn-sm" onClick={() => {
                  setEditFirstName(userName.split(' ')[0]);
                  setEditLastName(userName.split(' ').slice(1).join(' '));
                  setEditPhone(userPhone);
                  setIsEditingProfile(true);
                }}>
                  <i className="fa-solid fa-pen-to-square" style={{ marginRight: '6px' }}></i>Edit Information
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <>
                <div className="profile-details-grid">
                  <div className="detail-group">
                    <label>First Name</label>
                    <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.95rem', background: 'var(--bg-input, white)', color: 'var(--text-dark)', fontFamily: 'inherit' }} />
                  </div>
                  <div className="detail-group">
                    <label>Last Name</label>
                    <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.95rem', background: 'var(--bg-input, white)', color: 'var(--text-dark)', fontFamily: 'inherit' }} />
                  </div>
                  <div className="detail-group">
                    <label>Email Address</label>
                    <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>{userEmail} <span style={{ fontSize: '0.75rem' }}>(cannot be changed)</span></p>
                  </div>
                  <div className="detail-group">
                    <label>Phone Number</label>
                    <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="e.g. 09171234567" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.95rem', background: 'var(--bg-input, white)', color: 'var(--text-dark)', fontFamily: 'inherit', boxShadow: '0 0 0 2px rgba(0,155,213,0.15)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn" onClick={async () => {
                    const userId = sessionStorage.getItem('userId');
                    if (!userId) return;
                    try {
                      const res = await fetch('/api/users/customers', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: userId, firstName: editFirstName, lastName: editLastName, phone: editPhone })
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        const newName = `${updated.firstName} ${updated.lastName}`;
                        setUserName(newName);
                        setUserPhone(updated.phone || '');
                        sessionStorage.setItem('userName', newName);
                        setIsEditingProfile(false);
                        setToastMsg('Profile updated successfully!');
                        setTimeout(() => setToastMsg(''), 3000);
                      } else {
                        alert('Failed to update profile.');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Error saving profile.');
                    }
                  }}>
                    <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>Save Changes
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
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
                    <p>{userPhone || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Not set — click Edit to add</span>}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Registered ACs Tab */}
          <div id="tab-acs" className={`tab-content ${activeTab === 'tab-acs' ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ border: 'none', padding: 0, margin: 0 }}>My Registered Air Conditioners</h2>
              <button className="btn btn-sm" id="btn-show-register" onClick={() => setShowRegisterForm(!showRegisterForm)}>
                <i className="fa-solid fa-plus"></i> Register AC
              </button>
            </div>

            {/* Info Note */}
            <div style={{ background: 'rgba(0,155,213,0.08)', border: '1px solid rgba(0,155,213,0.2)', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1.2rem', fontSize: '0.85rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-circle-info" style={{ color: 'var(--primary)' }}></i>
              <span>All ACs can request cleaning, deep cleaning, and repair services. <strong style={{ color: 'var(--primary)' }}>Free 3-month maintenance</strong> is exclusive to ACs purchased from FrostTech.</span>
            </div>

            {/* Registration Form */}
            <div className={`register-form ${showRegisterForm ? 'active' : ''}`} id="ac-register-form">
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Register a New Unit</h4>
              <div className="form-row">
                <input type="text" placeholder="Location (e.g. Living Room, Master Bedroom)" value={regLocation} onChange={e => setRegLocation(e.target.value)} />
                <input type="text" placeholder="Brand & Model (e.g. Carrier Inverter)" value={regBrandModel} onChange={e => setRegBrandModel(e.target.value)} />
              </div>
              <div className="form-row">
                <select value={regAcType} onChange={e => setRegAcType(e.target.value)}>
                  <option>Window Type</option>
                  <option>Split Type</option>
                  <option>Floor Standing</option>
                </select>
                <select value={regHorsepower} onChange={e => setRegHorsepower(e.target.value)}>
                  <option>1.0 HP</option>
                  <option>1.5 HP</option>
                  <option>2.0 HP</option>
                  <option>2.5+ HP</option>
                </select>
              </div>
              <button className="btn btn-sm" onClick={async () => {
                if (!regLocation || !regBrandModel) { showAlert({title: 'Required', message: 'Please fill in location and brand/model', type: 'warning'}); return; }
                const isConfirmed = await confirm({
                  title: 'Register AC Unit',
                  message: `Register ${regBrandModel} at ${regLocation}?`,
                  confirmText: 'Register'
                });
                if (!isConfirmed) return;

                const userId = sessionStorage.getItem('userId');
                if (!userId) return;
                const body: any = { userId, location: regLocation, brandModel: regBrandModel, acType: regAcType, horsepower: regHorsepower, paymentType: 'N/A', purchasedFromStore: false };
                try {
                  const res = await fetch('/api/registered-acs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                  if (res.ok) { const saved = await res.json(); setRegisteredACs([saved, ...registeredACs]); setRegLocation(''); setRegBrandModel(''); setShowRegisterForm(false); setToastMsg('AC Unit registered! Note: Maintenance services are only available for ACs purchased from FrostTech.'); setTimeout(() => setToastMsg(''), 3500); }
                } catch (err) { console.error(err); alert('Failed to register AC'); }
              }}>
                Submit Registration
              </button>
            </div>

            <div className="service-cart-container">
              {/* Left Side: AC List */}
              <div className="ac-list" style={{ marginTop: 0 }}>
                {registeredACs.length === 0 ? (
                  <p style={{ color: 'var(--text-light)', padding: '2rem', textAlign: 'center' }}>No registered AC units yet. Click "Register AC" to add one.</p>
                ) : (
                  <>
                    {registeredACs.slice((regAcsPage - 1) * 2, regAcsPage * 2).map((ac) => (
                      <div key={ac.id} className="ac-card" style={{ 
                        flexDirection: 'column', 
                        alignItems: 'stretch', 
                        gap: '1.2rem', 
                        borderLeft: ac.purchasedFromStore ? '5px solid var(--primary)' : '5px solid var(--border-color)',
                        background: ac.purchasedFromStore ? 'linear-gradient(to right, rgba(0,155,213,0.03), transparent)' : 'var(--bg-card)',
                        boxShadow: 'var(--shadow-sm)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                          <div className="ac-info" style={{ flex: '1 1 250px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}><i className="fa-solid fa-fan" style={{ color: ac.purchasedFromStore ? 'var(--primary)' : 'var(--text-light)', marginRight: '6px' }}></i> {ac.location}</h4>
                              {ac.purchasedFromStore ? (
                                <span style={{ fontSize: '0.7rem', background: 'rgba(0,155,213,0.15)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>FrostTech Unit</span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', background: 'var(--bg-input)', color: 'var(--text-light)', padding: '3px 10px', borderRadius: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manual Add</span>
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-dark)' }}>{ac.brandModel}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '6px', margin: 0 }}><i className="fa-regular fa-calendar" style={{marginRight: '4px'}}></i> Registered: {new Date(ac.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          
                          <div className="ac-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-secondary" style={{ background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-dark)' }} onClick={() => {
                              const isInverter = ac.brandModel.toLowerCase().includes('inverter');
                              addToCart(`${ac.location} — ${ac.brandModel}`, 'Cleaning', isInverter ? 650 : 500, `note-${ac.id}`);
                            }}>
                              <i className="fa-solid fa-broom" style={{color: 'var(--primary)'}}></i> Clean
                            </button>
                            <button className="btn btn-sm btn-secondary" style={{ background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-dark)' }} onClick={() => {
                              const isInverter = ac.brandModel.toLowerCase().includes('inverter');
                              addToCart(`${ac.location} — ${ac.brandModel}`, 'Deep Cleaning', isInverter ? 900 : 750, `note-${ac.id}`);
                            }}>
                              <i className="fa-solid fa-spray-can-sparkles" style={{color: 'var(--primary)'}}></i> Deep Clean
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => addToCart(`${ac.location} — ${ac.brandModel}`, 'Repair', 500, `note-${ac.id}`)} style={{ background: 'rgba(220,53,69,0.05)', color: 'var(--accent-red)', borderColor: 'rgba(220,53,69,0.2)' }}>
                              <i className="fa-solid fa-wrench"></i> Repair
                            </button>
                          </div>
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <input type="text" id={`note-${ac.id}`} placeholder="Optional: Add a note (e.g. leaking water, strange noise...)" style={{ width: '100%', padding: '0.7rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)', fontSize: '0.85rem', color: 'var(--text-dark)', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'} />
                        </div>
                      </div>
                    ))}
                    {/* Pagination Controls */}
                    {registeredACs.length > 2 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          disabled={regAcsPage === 1}
                          onClick={() => setRegAcsPage(p => Math.max(1, p - 1))}
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          <i className="fa-solid fa-chevron-left"></i> Prev
                        </button>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                          Page {regAcsPage} of {Math.ceil(registeredACs.length / 2)}
                        </span>
                        <button 
                          className="btn btn-secondary" 
                          disabled={regAcsPage >= Math.ceil(registeredACs.length / 2)}
                          onClick={() => setRegAcsPage(p => p + 1)}
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          Next <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Side: Service Cart */}
              <aside className="service-cart">
                <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                  <i className="fa-solid fa-cart-shopping" style={{ marginRight: '8px' }}></i>
                  Service Cart
                  {serviceCart.length > 0 && <span style={{ background: 'var(--accent-red)', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.75rem', marginLeft: '8px' }}>{serviceCart.length}</span>}
                </h3>
                
                <div className="cart-items" id="cart-items-container">
                  {serviceCart.length === 0 ? (
                    <p className="empty-cart-msg">Your service cart is empty.<br />Add a service from your registered ACs.</p>
                  ) : (
                    serviceCart.map((item) => (
                      <div key={item.id} style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.service} — {item.unit}</div>
                            {item.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '3px', fontStyle: 'italic' }}>Note: {item.note}</div>}
                          </div>
                          <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px' }} title="Remove">
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                        <div style={{ color: 'var(--accent-red)', fontWeight: 600, marginTop: '4px' }}>₱ {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
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
              <button className="btn btn-sm" onClick={() => setShowBookingModal(true)}>
                <i className="fa-solid fa-calendar-plus"></i> Book New Slot
              </button>
            </div>
            
            <div className="calendar-wrapper" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', overflow: 'hidden' }}>
              <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button className="btn btn-sm btn-secondary" onClick={prevMonth}><i className="fa-solid fa-chevron-left"></i></button>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>{monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}</h3>
                <button className="btn btn-sm btn-secondary" onClick={nextMonth}><i className="fa-solid fa-chevron-right"></i></button>
              </div>
              
              <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="day-label" style={{ fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '10px' }}>{d}</div>
                ))}
                
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-light)', opacity: 0.3 }}></div>
                ))}

                {/* Actual days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  const isToday = new Date().getDate() === day && new Date().getMonth() === calendarDate.getMonth() && new Date().getFullYear() === calendarDate.getFullYear();
                  const hasEvent = dayEvents.length > 0;

                  return (
                    <div key={day} style={{
                      padding: '10px',
                      border: hasEvent
                        ? `1px solid ${dayEvents[0].serviceType?.includes('Cleaning') ? 'var(--primary)' : 'var(--accent-red)'}`
                        : isToday ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      background: hasEvent
                        ? dayEvents[0].serviceType?.includes('Cleaning') ? '#E6F0FA' : '#FFEBEB'
                        : isToday ? 'rgba(0,155,213,0.05)' : 'transparent',
                      borderRadius: '4px',
                      fontWeight: hasEvent || isToday ? 'bold' : 'normal',
                      position: 'relative',
                      minHeight: '50px',
                      cursor: hasEvent ? 'pointer' : 'default'
                    }} onClick={() => { if (hasEvent) setSelectedCalendarEvent(dayEvents[0]); }}>
                      {day}
                      {dayEvents.map(evt => (
                        <div key={evt.id} style={{
                          fontSize: '0.6rem',
                          background: evt.serviceType?.includes('Cleaning') ? 'var(--primary)' : 'var(--accent-red)',
                          color: 'white',
                          padding: '2px 4px',
                          borderRadius: '2px',
                          marginTop: '4px',
                          lineHeight: 1.3
                        }}>
                          {evt.serviceType}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {selectedCalendarEvent && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedCalendarEvent(null)}>
                <div style={{ background: 'var(--bg-card, white)', borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', borderLeft: `4px solid ${selectedCalendarEvent.serviceType?.includes('Cleaning') ? 'var(--primary)' : 'var(--accent-red)'}` }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedCalendarEvent(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-light)' }}>&times;</button>
                  <h4 style={{ marginBottom: '5px', color: selectedCalendarEvent.serviceType?.includes('Cleaning') ? 'var(--primary)' : 'var(--accent-red)' }}>{selectedCalendarEvent.serviceType}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '5px' }}><strong>Unit:</strong> {selectedCalendarEvent.item}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '15px' }}>
                    <i className="fa-regular fa-clock"></i> {new Date(selectedCalendarEvent.scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  {selectedCalendarEvent.technicianName && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '3px', marginBottom: '15px' }}>
                      <i className="fa-solid fa-user-gear" style={{ marginRight: '4px' }}></i> {selectedCalendarEvent.technicianName}
                    </p>
                  )}
                  <button className="btn btn-sm btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => {
                    setSelectedCalendarEvent(null);
                  }}>Reschedule</button>
                </div>
              </div>
            )}
          </div>

          {/* Booking Modal */}
          {showBookingModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowBookingModal(false)}>
              <div style={{ background: 'var(--bg-card, white)', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowBookingModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-light)' }}>&times;</button>
                <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}><i className="fa-solid fa-calendar-plus" style={{ marginRight: '8px' }}></i>Book a Technician Visit</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>Select your AC unit, service, and preferred date.</p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>AC Unit</label>
                  <select value={bookingUnit} onChange={e => setBookingUnit(e.target.value)} style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit', background: 'var(--bg-input, white)', color: 'var(--text-dark)' }}>
                    <option>Master Bedroom — Carrier Inverter</option>
                    <option>Living Room — Samsung Inverter</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Service Type</label>
                  <select value={bookingService} onChange={e => setBookingService(e.target.value)} style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit', background: 'var(--bg-input, white)', color: 'var(--text-dark)' }}>
                    <option>Deep Cleaning</option>
                    <option>Repair</option>
                    <option>Preventive Maintenance</option>
                    <option>Gas Refill</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Preferred Date</label>
                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit', background: 'var(--bg-input, white)', color: 'var(--text-dark)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Preferred Time</label>
                    <select value={bookingTime} onChange={e => setBookingTime(e.target.value)} style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit', background: 'var(--bg-input, white)', color: 'var(--text-dark)' }}>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Notes (optional)</label>
                  <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Describe any issues or special instructions..." rows={3} style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', background: 'var(--bg-input, white)', color: 'var(--text-dark)' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBookingModal(false)}>Cancel</button>
                  <button className="btn" style={{ flex: 1 }} onClick={async () => {
                    if (!bookingDate) { setToastMsg('Please select a date.'); setTimeout(() => setToastMsg(''), 2500); return; }
                    
                    const isConfirmed = await confirm({
                      title: 'Confirm Booking',
                      message: `Book ${bookingService} for ${bookingUnit.split(' — ')[0]} on ${new Date(bookingDate).toLocaleDateString()} at ${bookingTime}?`
                    });
                    if (!isConfirmed) return;

                    setShowBookingModal(false);
                    
                    const userId = sessionStorage.getItem('userId');
                    if (userId) {
                      await fetch('/api/maintenance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          scheduleNo: 'MNT-' + Math.floor(1000 + Math.random() * 9000),
                          customerId: userId,
                          name: userName,
                          phone: userPhone || 'N/A', // Uses saved phone from profile
                          address: 'Default Address',
                          item: bookingUnit,
                          serviceType: bookingService,
                          scheduledDate: `${bookingDate} ${bookingTime}`,
                          status: 'SCHEDULED',
                          notes: bookingNotes
                        })
                      });
                    }

                    showAlert({ title: 'Booking Confirmed', message: `${bookingService} for ${bookingUnit.split(' — ')[0]} booked on ${new Date(bookingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${bookingTime}!` });
                    setBookingDate(''); setBookingNotes('');
                  }}><i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i>Confirm Booking</button>
                </div>
              </div>
            </div>
          )}

          {/* My Orders Tab */}
          <div id="tab-orders" className={`tab-content ${activeTab === 'tab-orders' ? 'active' : ''}`}>
            <h2>My Orders</h2>
            {orders.length === 0 ? (
                <p>You have no orders yet.</p>
            ) : (
                <>
                  {orders.slice((ordersPage - 1) * 2, ordersPage * 2).map(order => {
                    const dispatchItem = dispatch.find(d => d.item === order.item && d.type.includes('Installation'));
                    let statusText = 'Processing';
                    let statusColor = 'var(--primary)';
                    
                    if (order.status === 'ACCEPTED' || dispatchItem) {
                      if (dispatchItem && dispatchItem.status === 'COMPLETED') {
                        statusText = 'Delivered & Installed';
                        statusColor = '#17a2b8'; // teal color for completed
                      } else if (dispatchItem && dispatchItem.status === 'ASSIGNED') {
                        statusText = 'Scheduled for Delivery';
                        statusColor = '#28a745'; // green color
                      } else {
                        statusText = 'Order Accepted, Scheduling delivery';
                        statusColor = '#f59e0b'; // orange color
                      }
                    }

                    return (
                      <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 500 }}>Order {order.orderNo}</span>
                          <span style={{ color: statusColor, fontWeight: 'bold' }}>{statusText}</span>
                        </div>
                        <p style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>{order.item}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Ordered on: {order.date}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: dispatchItem && dispatchItem.scheduledDate ? '0.5rem' : 0 }}>Payment Method: {order.payment}</p>
                        
                        {dispatchItem && dispatchItem.scheduledDate && (
                          <div style={{ background: 'rgba(0,155,213,0.05)', padding: '0.8rem', borderRadius: '4px', borderLeft: '3px solid var(--primary)' }}>
                            <p style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-dark)' }}>
                              <i className="fa-regular fa-calendar-check" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                              <strong>Scheduled Date:</strong> {dispatchItem.scheduledDate ? new Date(dispatchItem.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending Assignment'}
                            </p>
                            {dispatchItem.technicians && dispatchItem.technicians.length > 0 && (
                              <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                                <i className="fa-solid fa-user-gear" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                                <strong>Assigned Technician:</strong> {dispatchItem.technicians.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {orders.length > 2 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        disabled={ordersPage === 1}
                        onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        <i className="fa-solid fa-chevron-left" style={{ marginRight: '8px' }}></i> Previous
                      </button>
                      <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        Page {ordersPage} of {Math.ceil(orders.length / 2)}
                      </span>
                      <button 
                        className="btn btn-secondary" 
                        disabled={ordersPage >= Math.ceil(orders.length / 2)}
                        onClick={() => setOrdersPage(p => p + 1)}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Next <i className="fa-solid fa-chevron-right" style={{ marginLeft: '8px' }}></i>
                      </button>
                    </div>
                  )}
                </>
            )}
          </div>

          {/* My ACs Tab */}
          <div id="tab-myacs" className={`tab-content ${activeTab === 'tab-myacs' ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ border: 'none', padding: 0, margin: 0 }}>My Air Conditioners</h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>View all your purchased AC units, their payment type, and installment details.</p>

            {registeredACs.length === 0 ? (
                <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>No registered ACs yet. Go to "Registered ACs" to add your units.</p>
            ) : (
              <>
                {registeredACs.slice((myAcsPage - 1) * 2, myAcsPage * 2).map(ac => (
                    <div key={ac.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)', borderLeft: ac.paymentType === 'Cash' ? '4px solid #28a745' : '4px solid #f59e0b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ background: ac.paymentType === 'Cash' ? 'rgba(40,167,69,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-fan" style={{ fontSize: '1.8rem', color: ac.paymentType === 'Cash' ? '#28a745' : '#f59e0b' }}></i>
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{ac.brandModel}</h3>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '2px 0' }}><i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i> {ac.location}</p>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{ac.acType} • {ac.horsepower}</p>
                          </div>
                        </div>
                        <span style={{ background: ac.paymentType === 'Cash' ? '#d4edda' : '#fff3cd', color: ac.paymentType === 'Cash' ? '#155724' : '#856404', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {ac.paymentType === 'Cash' ? <><i className="fa-solid fa-money-bill-wave" style={{ marginRight: '4px' }}></i> Cash</> : <><i className="fa-solid fa-credit-card" style={{ marginRight: '4px' }}></i> Installment</>}
                        </span>
                      </div>
                      
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'grid', gridTemplateColumns: ac.paymentType === 'Installment' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '2px' }}>Total Price</p>
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>{ac.totalPrice ? `₱${ac.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '2px' }}>Registered</p>
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>{new Date(ac.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        {ac.paymentType === 'Installment' && (
                          <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '2px' }}>Monthly Payment</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>
                              ₱{ac.pricePerMonth ? ac.pricePerMonth.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'} × {ac.months || '—'} mos
                            </p>
                          </div>
                        )}
                      </div>

                      {ac.purchasedFromStore && (
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {!ac.isPaused && (
                            <>
                              <button className="btn btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }} onClick={() => {
                                setBookingUnit(`${ac.location} — ${ac.brandModel}`);
                                setBookingService('Free Quarterly Maintenance');
                                setShowBookingModal(true);
                              }}>
                                <i className="fa-solid fa-bell-concierge"></i> Request Maintenance
                              </button>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500 }}>
                                Next Free Maintenance: {
                                  (() => {
                                    const d = new Date(ac.createdAt);
                                    d.setMonth(d.getMonth() + 3);
                                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                  })()
                                }
                              </span>
                            </>
                          )}
                          <button className="btn btn-sm btn-secondary" onClick={() => handleTogglePause(ac.id, ac.isPaused)} style={{ borderColor: 'var(--border-color)', color: 'var(--text-light)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} title={ac.isPaused ? "Resume Maintenance" : "Pause Maintenance"}>
                            <i className={`fa-solid ${ac.isPaused ? 'fa-play' : 'fa-pause'}`}></i> {ac.isPaused ? 'Resume' : 'Pause'}
                          </button>
                          {ac.isPaused && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-red)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                              <i className="fa-solid fa-circle-pause" style={{ marginRight: '5px' }}></i> Maintenance Paused
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                ))}

                {registeredACs.length > 2 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={myAcsPage === 1}
                      onClick={() => setMyAcsPage(p => Math.max(1, p - 1))}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <i className="fa-solid fa-chevron-left" style={{ marginRight: '8px' }}></i> Previous
                    </button>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Page {myAcsPage} of {Math.ceil(registeredACs.length / 2)}
                    </span>
                    <button 
                      className="btn btn-secondary" 
                      disabled={myAcsPage >= Math.ceil(registeredACs.length / 2)}
                      onClick={() => setMyAcsPage(p => p + 1)}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Next <i className="fa-solid fa-chevron-right" style={{ marginLeft: '8px' }}></i>
                    </button>
                  </div>
                )}
              </>
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
            {showAddressForm && (
            <div id="address-form-container" style={{ marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}><i className="fa-solid fa-map-location-dot" style={{ marginRight: '8px' }}></i> Pin Your Location</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Pinpoint exact location for technicians</p>
                <div style={{height: "350px", width: "100%", marginBottom: "1rem", zIndex: 1}}>
                    <GoogleMap 
                      height="350px" 
                      onLocationSelect={(coords) => {
                        setAddrLat(coords.lat);
                        setAddrLng(coords.lng);
                      }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Latitude</label>
                    <input type="text" id="addr-lat" readOnly value={addrLat !== null ? addrLat.toFixed(6) : ''} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', fontFamily: 'inherit', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Longitude</label>
                    <input type="text" id="addr-lng" readOnly value={addrLng !== null ? addrLng.toFixed(6) : ''} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', fontFamily: 'inherit', fontSize: '0.85rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Address Label</label>
                    <input type="text" id="addr-label" value={addrLabel} onChange={e => setAddrLabel(e.target.value)} placeholder="e.g. Home, Office" style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Contact Number</label>
                    <input type="text" id="addr-phone" value={addrPhone} onChange={e => setAddrPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.3rem' }}>Full Address / Landmark</label>
                  <AddressAutocomplete 
                    value={addrFull}
                    onChange={setAddrFull}
                    onPlaceSelected={(addr, lat, lng) => {
                      setAddrFull(addr);
                      if (lat) setAddrLat(lat);
                      if (lng) setAddrLng(lng);
                    }}
                    placeholder="House #, Street, Barangay, City..." 
                    style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddressForm(false)}>Cancel</button>
                  <button className="btn" style={{ flex: 1 }} onClick={handleSaveAddress}><i className="fa-solid fa-floppy-disk"></i> Save Address</button>
                </div>
              </div>
            </div>
            )}

            {/* Saved Address Cards */}
            <div id="saved-addresses-list">
              {savedAddresses.map((addr) => (
                <div key={addr.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1rem', transition: 'transform 0.3s, boxShadow 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ marginBottom: '0.5rem' }}>
                        <i className="fa-solid fa-house" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> 
                        {addr.label} 
                        {addr.isDefault && <span style={{ background: 'var(--primary-grad)', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', marginLeft: '10px' }}>Default</span>}
                      </h4>
                      <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {addr.name}<br />
                        {addr.fullAddress}<br />
                        {addr.phone}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}><i className="fa-solid fa-pen"></i> Edit</a>
                      <a href="#" style={{ color: 'var(--accent-red)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }} onClick={(e) => {
                        e.preventDefault();
                        handleDeleteAddress(addr.id);
                      }}><i className="fa-solid fa-trash"></i> Delete</a>
                    </div>
                  </div>
                </div>
              ))}
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
                <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div className="form-row" style={{ maxWidth: '400px' }}>
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <button className="btn btn-sm" onClick={handleUpdatePassword}>Update Password</button>
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