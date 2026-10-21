'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';
import { useConfirmModal } from '@/components/ConfirmModal';

interface DispatchItem {
  id: string;
  dispatchNo: string;
  type: string;
  name: string;
  location: string;
  item: string;
  notes: string;
  status: string;
  horsepower?: string;
  assignedTechName?: string;
  technicians?: { firstName: string; lastName: string }[];
  scheduledDate?: string;
  source?: 'dispatch' | 'maintenance';
}

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
  technicianId?: string;
  status: string;
}

function GeocodedMap({ address }: { address: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    setLoading(true);

    if (address.includes('| COORDS:')) {
      const coordsPart = address.split('| COORDS:')[1];
      if (coordsPart) {
        const [lat, lng] = coordsPart.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCoords({ lat, lng });
          setLoading(false);
          return;
        }
      }
    }

    const cleanAddress = address.split('| COORDS:')[0].trim();
    fetch(`/api/geocode?address=${encodeURIComponent(cleanAddress)}`)
      .then(r => r.json())
      .then(data => {
        if (data.lat && data.lng) {
          setCoords({ lat: data.lat, lng: data.lng });
        } else {
          setCoords({ lat: 14.6091, lng: 121.0223 });
        }
      })
      .catch(() => {
        setCoords({ lat: 14.6091, lng: 121.0223 });
      })
      .finally(() => setLoading(false));
  }, [address]);

  if (loading || !coords) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: '#0284c7' }}></i>
          <p style={{ fontSize: '0.85rem' }}>Locating customer delivery coordinates...</p>
        </div>
      </div>
    );
  }

  return <GoogleMap key={`${coords.lat}-${coords.lng}`} height="300px" center={coords} markerPosition={coords} pinnable={false} />;
}

export default function TechnicianDashboard() {
  const { confirm, showAlert, prompt, ModalComponent } = useConfirmModal();
  const router = useRouter();

  // Navigation tab: 'dashboard' | 'assigned' | 'services'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assigned' | 'services'>('dashboard');

  // Technician Data
  const [tasks, setTasks] = useState<DispatchItem[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceItem[]>([]);
  const [techName, setTechName] = useState('Carlos Rivera');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);

  // Filters
  const [serviceFilter, setServiceFilter] = useState<'All' | 'Maintenance' | 'Cleaning' | 'Repair'>('All');
  const [deliveryFilter, setDeliveryFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');

  // Modals
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Invoice Modal State with Editable Service Type
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceJob, setInvoiceJob] = useState<any>(null);
  const [invoiceServiceType, setInvoiceServiceType] = useState('Regular Cleaning');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(900);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceSending, setInvoiceSending] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  // Standard service catalogue pricing for auto-populating
  const standardServices: Record<string, number> = {
    'Regular Cleaning': 900,
    'Deep Cleaning': 1500,
    'Preventive Maintenance': 850,
    'Repair & Troubleshooting': 1200,
    'Chemical Coil Wash': 1800,
    'Freon R32 Recharge': 1500,
    'Parts Replacement': 2500,
    'New Installation': 3500,
    'Custom Service': 1000
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('isLoggedIn');
    router.push('/login');
  };

  const loadData = () => {
    const sessionName = sessionStorage.getItem('userName') || 'Carlos Rivera';
    setTechName(sessionName);
    setIsLoggedIn(sessionStorage.getItem('userName') !== null);

    fetch('/api/dispatch')
      .then(r => r.json())
      .then((data: DispatchItem[]) => {
        if (Array.isArray(data)) {
          // If assigned to tech, or show all if in demo mode
          const myTasks = data.filter(d => 
            !sessionName || 
            d.assignedTechName?.toLowerCase().includes(sessionName.toLowerCase()) ||
            d.technicians?.some(t => `${t.firstName} ${t.lastName}`.toLowerCase().includes(sessionName.toLowerCase())) ||
            true // default show all assigned dispatch in demo
          );
          setTasks(myTasks);
        }
      })
      .catch(console.error);

    fetch('/api/maintenance')
      .then(r => r.json())
      .then((data: MaintenanceItem[]) => {
        if (Array.isArray(data)) {
          setMaintenanceTasks(data);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update Status helper
  const handleUpdateStatus = async (jobId: string, newStatus: string, isMaint = false) => {
    if (isMaint) {
      setMaintenanceTasks(prev => prev.map(m => m.id === jobId ? { ...m, status: newStatus } : m));
      try {
        await fetch('/api/maintenance', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: jobId, status: newStatus })
        });
      } catch (e) {
        console.error('Failed to update maintenance status', e);
      }
    } else {
      setTasks(prev => prev.map(t => t.id === jobId ? { ...t, status: newStatus } : t));
      try {
        await fetch('/api/dispatch', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: jobId, status: newStatus })
        });
      } catch (e) {
        console.error('Failed to update dispatch status', e);
      }
    }
  };

  // Flag AC Unit
  const handleFlagAC = async (job: any) => {
    const reason = await prompt({
      title: 'Flag AC Unit',
      message: 'Warning: Flagging this AC alerts Admin and warranty checks. Enter details of unauthorized repair or tampering:',
      placeholder: 'Describe observed tampering or damage'
    });
    if (!reason) return;

    const proceed = await confirm({
      title: 'Confirm Unit Flagging',
      message: `Flag ${job.item} for unauthorized tampering? This voids standard warranty coverage.`,
      type: 'warning'
    });

    if (proceed) {
      await fetch('/api/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: job.id,
          notes: `[FLAGGED BY TECH ${techName}]: ${reason}`
        })
      });
      await showAlert({ title: 'Unit Flagged', message: 'AC Unit has been flagged successfully. Dispatch notes have been updated.' });
      setShowClientModal(false);
      loadData();
    }
  };

  // Open Invoice Modal - Only for Services (not for Delivery & Installation)
  const openInvoiceModal = (job: any) => {
    if (isDelivery(job)) {
      showAlert({
        title: 'No Invoice Required',
        message: 'Invoices are only generated for on-site services (Cleaning, Repair, Maintenance). Delivery & Installation tasks do not require service invoices.',
        type: 'info'
      });
      return;
    }
    setInvoiceJob(job);
    const initialType = job.type || job.serviceType || 'Regular Cleaning';
    setInvoiceServiceType(initialType);
    setInvoiceAmount(standardServices[initialType] || 1200);
    setInvoiceNotes(`Service conducted on ${job.item || 'AC Unit'} at ${job.location || job.address || ''}.`);
    setShowInvoiceModal(true);
  };

  // Handle service type dropdown change in invoice
  const handleServiceTypeChange = (newType: string) => {
    setInvoiceServiceType(newType);
    if (standardServices[newType]) {
      setInvoiceAmount(standardServices[newType]);
    }
  };

  // Send Invoice / Receipt with edited service type and amount
  const handleSendInvoice = async (invoiceType: 'ADMIN' | 'CUSTOMER') => {
    if (!invoiceJob) return;
    setInvoiceSending(true);

    try {
      // 1. Post to Invoices
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: invoiceType,
          dispatchId: invoiceJob.id,
          dispatchNo: invoiceJob.dispatchNo || invoiceJob.scheduleNo || 'DSP-0001',
          customerName: invoiceJob.name,
          serviceType: invoiceServiceType, // TECH MODIFIED SERVICE TYPE
          acUnit: invoiceJob.item || 'Air Conditioner',
          location: (invoiceJob.location || invoiceJob.address || '').split('| COORDS:')[0].trim(),
          technicianName: techName,
          amount: Number(invoiceAmount) || 0,
          notes: invoiceNotes || `Service updated to ${invoiceServiceType} by technician.`
        })
      });

      // 2. Also update the dispatch job type & status if from dispatch
      if (invoiceJob.id) {
        await fetch('/api/dispatch', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: invoiceJob.id,
            type: invoiceServiceType,
            status: 'COMPLETED',
            notes: `[SERVICE UPDATED TO ${invoiceServiceType}]: ${invoiceNotes}`
          })
        }).catch(() => {});
      }

      setInvoiceSending(false);
      setShowInvoiceModal(false);

      if (res.ok) {
        const inv = await res.json();
        showAlert({
          title: 'Invoice Sent Successfully',
          message: `${invoiceType === 'ADMIN' ? 'Admin Invoice' : 'Customer Receipt'} generated!\n\nInvoice: ${inv.invoiceNo}\nService: ${invoiceServiceType}\nAmount: ₱${Number(invoiceAmount).toLocaleString()}`
        });
        loadData();
      } else {
        throw new Error('Invoice creation failed');
      }
    } catch (err) {
      setInvoiceSending(false);
      showAlert({ title: 'Error', message: 'Failed to generate invoice. Please try again.', type: 'error' });
    }
  };

  // Helper to distinguish Delivery Tasks vs Service Jobs
  const isDelivery = (job: any) => {
    const t = (job.type || '').toLowerCase();
    return (
      t.includes('delivery') ||
      t.includes('deliver') ||
      t.includes('installation') ||
      t.includes('install') ||
      t.includes('new installation') ||
      t === 'order delivery'
    );
  };

  // Assigned Tasks = Deliveries of ACs
  const deliveryTasks = tasks.filter(t => isDelivery(t));
  const filteredDeliveries = deliveryTasks.filter(t => {
    if (deliveryFilter === 'All') return true;
    if (deliveryFilter === 'Pending') return t.status === 'PENDING' || t.status === 'Assigned';
    if (deliveryFilter === 'In Progress') return t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'Out for Delivery';
    if (deliveryFilter === 'Completed') return t.status === 'COMPLETED' || t.status === 'Delivered';
    return true;
  });

  // Services = Maintenance, Cleaning, Repair
  const serviceDispatch = tasks.filter(t => !isDelivery(t));
  const normalizedMaintenance: DispatchItem[] = maintenanceTasks.map(m => ({
    id: m.id,
    dispatchNo: m.scheduleNo,
    type: m.serviceType,
    name: m.name,
    location: m.address,
    item: m.item,
    notes: `Maintenance Schedule: ${m.serviceType}`,
    status: m.status,
    scheduledDate: m.scheduledDate,
    source: 'maintenance'
  }));

  const allServiceJobs: DispatchItem[] = [...serviceDispatch, ...normalizedMaintenance];

  const filteredServices = allServiceJobs.filter(s => {
    if (serviceFilter === 'All') return true;
    const typeLower = (s.type || '').toLowerCase();
    if (serviceFilter === 'Maintenance') {
      return typeLower.includes('maintenance') || s.source === 'maintenance';
    }
    if (serviceFilter === 'Cleaning') {
      return typeLower.includes('clean') || typeLower.includes('wash');
    }
    if (serviceFilter === 'Repair') {
      return typeLower.includes('repair') || typeLower.includes('recharge') || typeLower.includes('freon') || typeLower.includes('troubleshoot');
    }
    return true;
  });

  // Stats calculation
  const totalJobsCount = tasks.length + maintenanceTasks.length;
  const pendingJobsCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'Assigned').length + maintenanceTasks.filter(m => m.status === 'Pending').length;
  const inProgressJobsCount = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length + maintenanceTasks.filter(m => m.status === 'Scheduled').length;
  const completedJobsCount = tasks.filter(t => t.status === 'COMPLETED').length + maintenanceTasks.filter(m => m.status === 'Completed').length;

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const extractDatePart = (sd?: string) => {
    if (!sd) return '';
    return sd.split(' ')[0];
  };

  const getJobsForDay = (day: number) => {
    return [...tasks, ...normalizedMaintenance].filter(job => {
      if (!job.scheduledDate) return false;
      const dp = extractDatePart(job.scheduledDate);
      const d = new Date(dp + 'T00:00:00');
      return !isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const selectedDayJobsList = selectedDay ? getJobsForDay(selectedDay) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
      <ModalComponent />

      {/* TOP HEADER */}
      <header style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        padding: '0.85rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 15px rgba(2, 132, 199, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/LOGO.jpg" alt="FrostTech" style={{ height: '36px', borderRadius: '6px', background: '#ffffff', padding: '2px' }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.5px' }}>FrostTech</span>
              <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Field Technician Portal</span>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.9rem', borderRadius: '999px', backdropFilter: 'blur(8px)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{techName} (On Duty)</span>
          </div>

          {/* KEBAB MENU */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setKebabOpen(!kebabOpen)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            {kebabOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                border: '1px solid #e2e8f0',
                width: '210px',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => { setActiveTab('dashboard'); setKebabOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-gauge" style={{ color: '#0284c7' }}></i> Dashboard
                </button>
                <button
                  onClick={() => { setActiveTab('assigned'); setKebabOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-truck" style={{ color: '#0284c7' }}></i> Assigned Tasks
                </button>
                <button
                  onClick={() => { setActiveTab('services'); setKebabOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-screwdriver-wrench" style={{ color: '#0284c7' }}></i> Services
                </button>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '0.3rem 0' }}></div>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
                >
                  <i className="fa-solid fa-right-from-bracket"></i> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: SIDEBAR + CONTENT */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside style={{
          width: '260px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flexShrink: 0
        }}>
          {/* Tech Profile Summary */}
          <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
              {techName.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{techName}</strong>
              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>Field Specialist</span>
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '0.5rem' }}>
            Menu Navigation
          </div>

          {/* TAB 1: DASHBOARD */}
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'dashboard' ? '#e0f2fe' : 'transparent',
              color: activeTab === 'dashboard' ? '#0284c7' : '#475569',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderLeft: activeTab === 'dashboard' ? '4px solid #0284c7' : '4px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-chart-line" style={{ width: '18px', color: activeTab === 'dashboard' ? '#0284c7' : '#94a3b8' }}></i>
              <span>Dashboard</span>
            </div>
            <span style={{ fontSize: '0.75rem', background: activeTab === 'dashboard' ? '#0284c7' : '#e2e8f0', color: activeTab === 'dashboard' ? '#ffffff' : '#64748b', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
              {totalJobsCount}
            </span>
          </button>

          {/* TAB 2: ASSIGNED TASK (AC Deliveries) */}
          <button
            onClick={() => setActiveTab('assigned')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'assigned' ? '#e0f2fe' : 'transparent',
              color: activeTab === 'assigned' ? '#0284c7' : '#475569',
              fontWeight: activeTab === 'assigned' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderLeft: activeTab === 'assigned' ? '4px solid #0284c7' : '4px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-truck" style={{ width: '18px', color: activeTab === 'assigned' ? '#0284c7' : '#94a3b8' }}></i>
              <span>Assigned Task</span>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#38bdf8', color: '#ffffff', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
              {deliveryTasks.length}
            </span>
          </button>

          {/* TAB 3: SERVICES */}
          <button
            onClick={() => setActiveTab('services')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'services' ? '#e0f2fe' : 'transparent',
              color: activeTab === 'services' ? '#0284c7' : '#475569',
              fontWeight: activeTab === 'services' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderLeft: activeTab === 'services' ? '4px solid #0284c7' : '4px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-screwdriver-wrench" style={{ width: '18px', color: activeTab === 'services' ? '#0284c7' : '#94a3b8' }}></i>
              <span>Services</span>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#0284c7', color: '#ffffff', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
              {allServiceJobs.length}
            </span>
          </button>

          {/* Bottom Shift Info Card */}
          <div style={{ marginTop: 'auto', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontWeight: 700, marginBottom: '0.4rem' }}>
              <i className="fa-regular fa-clock"></i> Today's Shift
            </div>
            <p style={{ margin: 0, color: '#64748b' }}>08:00 AM - 05:00 PM</p>
            <p style={{ margin: '0.2rem 0 0', color: '#16a34a', fontWeight: 600 }}>Active Dispatch Sync</p>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

          {/* ======================================================== */}
          {/* TAB 1: DASHBOARD (Tech Stats + Monthly Calendar) */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Banner */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Technician Overview & Schedule
                  </h2>
                  <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
                    Welcome back, <strong>{techName}</strong>. Check your month schedule and assigned workloads.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setActiveTab('assigned')} style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <i className="fa-solid fa-truck" style={{ marginRight: '6px' }}></i> View Deliveries
                  </button>
                  <button onClick={() => setActiveTab('services')} style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <i className="fa-solid fa-wrench" style={{ marginRight: '6px' }}></i> View Services
                  </button>
                </div>
              </div>

              {/* 4 STAT CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Jobs</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-clipboard-list"></i>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>{totalJobsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Deliveries & Services</span>
                </div>

                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pending</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-hourglass-half"></i>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '0.5rem' }}>{pendingJobsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Awaiting departure</span>
                </div>

                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>In Progress</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-person-running"></i>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '0.5rem' }}>{inProgressJobsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active in field</span>
                </div>

                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Completed</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>{completedJobsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Finished tasks</span>
                </div>
              </div>

              {/* MONTHLY CALENDAR GRID + SELECTED DAY DETAILS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
                
                {/* CALENDAR FOR THE SCHEDULE MONTH */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-regular fa-calendar-days" style={{ color: '#0284c7' }}></i>
                      {monthNames[month]} {year} Schedule
                    </h3>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={prevMonth} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', color: '#475569' }}>
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                      <button onClick={nextMonth} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', color: '#475569' }}>
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>

                  {/* Day of week headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} style={{ padding: '0.4rem 0' }}>{d}</div>
                    ))}
                  </div>

                  {/* Calendar cells */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                    {/* Blank offset days */}
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <div key={`blank-${i}`} style={{ height: '70px', background: '#f8fafc', borderRadius: '8px', opacity: 0.5 }}></div>
                    ))}

                    {/* Actual days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dNum = i + 1;
                      const dayJobs = getJobsForDay(dNum);
                      const isSelected = selectedDay === dNum;
                      const isToday = new Date().getDate() === dNum && new Date().getMonth() === month && new Date().getFullYear() === year;

                      return (
                        <div
                          key={`day-${dNum}`}
                          onClick={() => setSelectedDay(dNum)}
                          style={{
                            height: '70px',
                            background: isSelected ? '#e0f2fe' : isToday ? '#f0f9ff' : '#ffffff',
                            border: isSelected ? '2px solid #0284c7' : isToday ? '1px solid #38bdf8' : '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '0.4rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: isToday ? 800 : 600, color: isToday ? '#0284c7' : '#0f172a' }}>
                              {dNum}
                            </span>
                            {isToday && (
                              <span style={{ fontSize: '0.6rem', background: '#0284c7', color: '#ffffff', padding: '1px 4px', borderRadius: '4px' }}>TODAY</span>
                            )}
                          </div>

                          {dayJobs.length > 0 && (
                            <div style={{ marginTop: 'auto' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                background: '#0284c7',
                                color: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                fontWeight: 700,
                                display: 'inline-block'
                              }}>
                                {dayJobs.length} {dayJobs.length === 1 ? 'task' : 'tasks'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SELECTED DAY TASKS LIST */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                    <i className="fa-solid fa-list-check" style={{ color: '#0284c7', marginRight: '6px' }}></i>
                    {selectedDay ? `${monthNames[month]} ${selectedDay}, ${year} Tasks` : 'Select a Day'}
                  </h3>

                  {selectedDayJobsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '2.5rem', marginBottom: '0.8rem', display: 'block', opacity: 0.5 }}></i>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>No tasks scheduled for this day.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '420px' }}>
                      {selectedDayJobsList.map((job: any) => {
                        const isDeliv = isDelivery(job);
                        return (
                          <div key={job.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: isDeliv ? '#dbeafe' : '#fef3c7',
                                color: isDeliv ? '#1d4ed8' : '#b45309'
                              }}>
                                {isDeliv ? 'AC Delivery' : job.type}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{job.status}</span>
                            </div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.2rem' }}>{job.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.3rem' }}>
                              <i className="fa-solid fa-location-dot" style={{ color: '#ef4444', marginRight: '4px' }}></i>
                              {(job.location || job.address || '').split('| COORDS:')[0].trim()}
                            </p>
                            <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                              <i className="fa-solid fa-fan" style={{ marginRight: '4px' }}></i>
                              {job.item}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                              <button
                                onClick={() => { setSelectedJob(job); setShowClientModal(true); }}
                                style={{ flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', padding: '0.35rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                View Details & Map
                              </button>
                              {!isDelivery(job) && (
                                <button
                                  onClick={() => openInvoiceModal(job)}
                                  style={{ background: '#0284c7', border: 'none', color: '#ffffff', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                  Invoice
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ASSIGNED TASK (AC Deliveries to Customers) */}
          {/* ======================================================== */}
          {activeTab === 'assigned' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    <i className="fa-solid fa-truck" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                    Assigned Tasks — AC Delivery & Installation
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                    Air conditioner units scheduled for delivery and on-site setup to customers.
                  </p>
                </div>

                {/* Filter buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', background: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  {(['All', 'Pending', 'In Progress', 'Completed'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setDeliveryFilter(f)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: deliveryFilter === f ? '#0284c7' : 'transparent',
                        color: deliveryFilter === f ? '#ffffff' : '#64748b',
                        fontWeight: deliveryFilter === f ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDeliveries.length === 0 ? (
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
                  <h4 style={{ color: '#334155', margin: 0 }}>No delivery tasks found</h4>
                  <p style={{ fontSize: '0.85rem' }}>No assigned AC deliveries match the current filter.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                  {filteredDeliveries.map(job => {
                    const isCompleted = job.status === 'COMPLETED' || job.status === 'Delivered';
                    const isInProgress = job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS' || job.status === 'Out for Delivery';

                    return (
                      <div
                        key={job.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          padding: '1.25rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '3px 8px', borderRadius: '6px' }}>
                              {job.dispatchNo || 'DSP-DELIVERY'}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '999px',
                              background: isCompleted ? '#dcfce7' : isInProgress ? '#e0f2fe' : '#fef3c7',
                              color: isCompleted ? '#166534' : isInProgress ? '#0369a1' : '#92400e'
                            }}>
                              {job.status}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.4rem' }}>
                            {job.name}
                          </h3>

                          <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
                            <i className="fa-solid fa-location-dot" style={{ color: '#ef4444' }}></i>
                            <span>{(job.location || '').split('| COORDS:')[0].trim()}</span>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '0.75rem 0' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>
                              <i className="fa-solid fa-fan" style={{ marginRight: '6px' }}></i>
                              {job.item}
                            </div>
                            {job.horsepower && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                Horsepower: <strong>{job.horsepower}</strong>
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              <i className="fa-regular fa-calendar-check" style={{ marginRight: '4px' }}></i>
                              Schedule: <strong>{job.scheduledDate || 'Immediate Dispatch'}</strong>
                            </div>
                          </div>

                          {job.notes && (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', margin: '0 0 1rem' }}>
                              Note: {job.notes}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                          <button
                            onClick={() => { setSelectedJob(job); setShowClientModal(true); }}
                            style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-map-pin" style={{ marginRight: '4px' }}></i> Client & Map
                          </button>

                          {isCompleted ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#dcfce7', color: '#166534', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                              <i className="fa-solid fa-circle-check"></i> Delivered & Installed
                            </div>
                          ) : isInProgress ? (
                            <button
                              onClick={() => handleUpdateStatus(job.id, 'COMPLETED')}
                              style={{ flex: 1, background: '#16a34a', color: '#ffffff', border: 'none', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i> Mark Delivered & Installed
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(job.id, 'IN_PROGRESS')}
                              style={{ flex: 1, background: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-play" style={{ marginRight: '4px' }}></i> Start Delivery & Setup
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SERVICES (Maintenance, Cleaning, Repair) */}
          {/* ======================================================== */}
          {activeTab === 'services' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    <i className="fa-solid fa-screwdriver-wrench" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                    Field Service Jobs
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                    Assigned on-site service orders. Change service types during invoice if condition requires deeper servicing.
                  </p>
                </div>

                {/* Filter buttons: Maintenance, Cleaning, Repair */}
                <div style={{ display: 'flex', gap: '0.4rem', background: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  {(['All', 'Maintenance', 'Cleaning', 'Repair'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setServiceFilter(f)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: serviceFilter === f ? '#0284c7' : 'transparent',
                        color: serviceFilter === f ? '#ffffff' : '#64748b',
                        fontWeight: serviceFilter === f ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredServices.length === 0 ? (
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fa-solid fa-screwdriver-wrench" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
                  <h4 style={{ color: '#334155', margin: 0 }}>No service jobs found</h4>
                  <p style={{ fontSize: '0.85rem' }}>No assigned jobs found under category: <strong>{serviceFilter}</strong></p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                  {filteredServices.map(job => {
                    const isCompleted = job.status === 'COMPLETED' || job.status === 'Completed';
                    const isInProgress = job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS' || job.status === 'Scheduled';

                    return (
                      <div
                        key={job.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          padding: '1.25rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: job.type.includes('Clean') ? '#dbeafe' : job.type.includes('Repair') ? '#fee2e2' : '#fef3c7',
                              color: job.type.includes('Clean') ? '#1d4ed8' : job.type.includes('Repair') ? '#b91c1c' : '#b45309'
                            }}>
                              <i className="fa-solid fa-wrench" style={{ marginRight: '4px' }}></i>
                              {job.type}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '999px',
                              background: isCompleted ? '#dcfce7' : isInProgress ? '#e0f2fe' : '#fef3c7',
                              color: isCompleted ? '#166534' : isInProgress ? '#0369a1' : '#92400e'
                            }}>
                              {job.status}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.4rem' }}>
                            {job.name}
                          </h3>

                          <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
                            <i className="fa-solid fa-location-dot" style={{ color: '#ef4444' }}></i>
                            <span>{(job.location || '').split('| COORDS:')[0].trim()}</span>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '0.75rem 0' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>
                              <i className="fa-solid fa-fan" style={{ marginRight: '6px' }}></i>
                              {job.item}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              <i className="fa-regular fa-calendar-check" style={{ marginRight: '4px' }}></i>
                              Scheduled: <strong>{job.scheduledDate || 'Pending Schedule'}</strong>
                            </div>
                          </div>

                          {job.notes && (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', margin: '0 0 1rem' }}>
                              Note: {job.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                          <button
                            onClick={() => { setSelectedJob(job); setShowClientModal(true); }}
                            style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-circle-info" style={{ marginRight: '4px' }}></i> Client Info
                          </button>

                          {/* INVOICE BUTTON: ALLOWS CHANGING SERVICE TYPE */}
                          <button
                            onClick={() => openInvoiceModal(job)}
                            style={{ flex: 1, background: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-file-invoice" style={{ marginRight: '4px' }}></i> Invoice / Complete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* INVOICE MODAL WITH SERVICE TYPE MODIFICATION */}
      {/* ======================================================== */}
      {showInvoiceModal && invoiceJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '18px', borderTopRightRadius: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#0284c7' }}></i>
                  Service Invoice & Completion
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Modify service type (e.g. Regular &rarr; Deep Cleaning) and generate invoice.
                </p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Job summary banner */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Customer: <strong>{invoiceJob.name}</strong></span>
                  <span style={{ color: '#0369a1', fontWeight: 700 }}>{invoiceJob.dispatchNo || invoiceJob.scheduleNo || 'JOB-01'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                  Unit: <strong>{invoiceJob.item}</strong> | Location: {(invoiceJob.location || invoiceJob.address || '').split('| COORDS:')[0].trim()}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
                  Customer Originally Requested: <u>{invoiceJob.type || invoiceJob.serviceType}</u>
                </div>
              </div>

              {/* SERVICE TYPE SELECTOR (CAN BE CHANGED BY TECH) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Actual Service Performed (Change if Upgraded/Modified)
                </label>
                <select
                  value={invoiceServiceType}
                  onChange={(e) => handleServiceTypeChange(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#0f172a', fontWeight: 600 }}
                >
                  <option value="Regular Cleaning">Regular Cleaning — ₱900</option>
                  <option value="Deep Cleaning">Deep Cleaning (Chemical Wash & Disassembly) — ₱1,500</option>
                  <option value="Preventive Maintenance">Preventive Maintenance — ₱850</option>
                  <option value="Repair & Troubleshooting">Repair & Electrical Troubleshooting — ₱1,200</option>
                  <option value="Chemical Coil Wash">Chemical Coil Wash — ₱1,800</option>
                  <option value="Freon R32 Recharge">Freon R32 Recharge — ₱1,500</option>
                  <option value="Parts Replacement">Parts Replacement — ₱2,500</option>
                  <option value="New Installation">New AC Installation — ₱3,500</option>
                  <option value="Custom Service">Custom / Other Service</option>
                </select>
                <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                  * Example: If customer requested regular cleaning but unit required deep chemical cleaning, select Deep Cleaning.
                </small>
              </div>

              {/* AMOUNT / PRICE INPUT */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Service Fee / Final Bill (₱)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>₱</span>
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}
                  />
                </div>
              </div>

              {/* TECHNICIAN NOTES / JUSTIFICATION */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Technician Assessment & Reason for Service Adjustment
                </label>
                <textarea
                  rows={3}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="e.g. Customer booked regular cleaning, but upon inspection the evaporator coils had excessive mold buildup requiring complete chemical wash."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', fontFamily: 'inherit' }}
                />
              </div>

              {/* SUBMIT BUTTONS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  disabled={invoiceSending}
                  onClick={() => handleSendInvoice('CUSTOMER')}
                  style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-receipt"></i>
                  Send Customer Receipt
                </button>
                <button
                  disabled={invoiceSending}
                  onClick={() => handleSendInvoice('ADMIN')}
                  style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-file-invoice"></i>
                  Send Admin Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CLIENT INFO & LOCATION MODAL */}
      {/* ======================================================== */}
      {showClientModal && selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }}>
            
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-user-circle" style={{ color: '#0284c7' }}></i>
                Client & Location Information
              </h3>
              <button onClick={() => setShowClientModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Customer</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedJob.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#0284c7', marginTop: '4px' }}>
                    <i className="fa-solid fa-phone" style={{ marginRight: '6px' }}></i> +63 9XX XXX XXXX
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Task / AC Unit</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>{selectedJob.item}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                    Type: <strong>{selectedJob.type}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-location-dot" style={{ color: '#ef4444' }}></i> Delivery / Service Address
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#475569' }}>
                  {(selectedJob.location || selectedJob.address || '').split('| COORDS:')[0].trim()}
                </p>
              </div>

              {/* MAP COMPONENT */}
              <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <GeocodedMap address={selectedJob.location || selectedJob.address || ''} />
              </div>

              {/* ACTIONS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleFlagAC(selectedJob)}
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-flag" style={{ marginRight: '6px' }}></i> Flag Unit (Tampered)
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!isDelivery(selectedJob) && (
                    <button
                      onClick={() => { setShowClientModal(false); openInvoiceModal(selectedJob); }}
                      style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-file-invoice" style={{ marginRight: '6px' }}></i> Create Service Invoice
                    </button>
                  )}
                  <button
                    onClick={() => setShowClientModal(false)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '1.5rem 2rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
        &copy; 2026 FrostTech Cooling Solutions Co. Field Technician Operations
      </footer>
    </div>
  );
}