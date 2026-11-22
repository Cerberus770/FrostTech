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

interface InstallmentItem {
  id: string;
  appId: string;
  userId?: string;
  name: string;
  item: string;
  date: string;
  status: string;
  issue: string;
  term: number;
  employer: string;
  income: string;
  idType: string;
  location?: string;
  assignedTech?: string | null;
  scheduledDate?: string | null;
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
  };
}

function parseCiMeta(issueStr: string = '') {
  try {
    if (issueStr && issueStr.startsWith('{')) {
      const parsed = JSON.parse(issueStr);
      if (parsed.ciNotes && typeof parsed.ciNotes === 'string' && parsed.ciNotes.startsWith('{')) {
        parsed.ciNotes = '';
      }
      return parsed;
    }
  } catch {}
  return {
    ciNotes: issueStr && !issueStr.startsWith('{') ? issueStr : '',
    fieldNotes: '',
    checklist: { address: false, id: false, electrical: false, reference: false },
    ciVerified: false,
    assignedCiTechName: '',
  };
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
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: '#052e80' }}></i>
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

  // Navigation tab: 'dashboard' | 'assigned' | 'services' | 'ci'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assigned' | 'services' | 'ci'>('dashboard');

  // Technician Data
  const [tasks, setTasks] = useState<DispatchItem[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceItem[]>([]);
  const [ciInstallments, setCiInstallments] = useState<InstallmentItem[]>([]);
  const [techName, setTechName] = useState('Carlos Rivera');
  const [techRank, setTechRank] = useState('Senior Tech');
  const [isCiOfficerTech, setIsCiOfficerTech] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);

  // CI Filter & Inspection States
  const [ciSearchQuery, setCiSearchQuery] = useState('');
  const [ciFilter, setCiFilter] = useState<'ALL' | 'MY_CI' | 'PENDING' | 'VERIFIED'>('ALL');
  const [savingCiId, setSavingCiId] = useState<string | null>(null);
  const [selectedCiDetails, setSelectedCiDetails] = useState<InstallmentItem | null>(null);
  const [fieldNotesInputs, setFieldNotesInputs] = useState<Record<string, string>>({});

  // Filters
  const [serviceFilter, setServiceFilter] = useState<'All' | 'Maintenance' | 'Cleaning' | 'Repair'>('All');
  const [deliveryFilter, setDeliveryFilter] = useState<'All' | 'Pick Up' | 'Delivery' | 'Pending' | 'In Progress' | 'Completed'>('All');

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

  // Service Modification Proof State
  const [modificationProof, setModificationProof] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

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

    fetch('/api/users/technicians')
      .then(r => r.json())
      .then((techs: any[]) => {
        if (Array.isArray(techs)) {
          const matched = techs.find(t => `${t.firstName} ${t.lastName}`.toLowerCase() === sessionName.toLowerCase());
          if (matched) {
            setTechRank(matched.techRank || 'Senior Tech');
            const hasCi = (matched.techRank && (matched.techRank.toLowerCase().includes('ci') || matched.techRank.toLowerCase().includes('investigat'))) ||
              (matched.permissions && matched.permissions.toLowerCase().includes('ci'));
            setIsCiOfficerTech(Boolean(hasCi));
          }
        }
      })
      .catch(() => {});

    // Fetch Installments for Credit Investigation (CI)
    fetch('/api/installments')
      .then(r => r.json())
      .then((data: InstallmentItem[]) => {
        if (Array.isArray(data)) {
          setCiInstallments(data);
          // Pre-populate field notes input map from parsed issues
          const initialNotes: Record<string, string> = {};
          data.forEach(item => {
            const meta = parseCiMeta(item.issue);
            initialNotes[item.id] = meta.fieldNotes || '';
          });
          setFieldNotesInputs(initialNotes);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Credit Investigation Handlers
  const handleSaveCiFieldNotes = async (inst: InstallmentItem, notesText: string) => {
    setSavingCiId(inst.id);
    try {
      const meta = parseCiMeta(inst.issue);
      meta.fieldNotes = notesText;
      meta.lastUpdatedByTech = techName;
      meta.lastUpdatedAt = new Date().toISOString();
      const issueString = JSON.stringify(meta);

      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inst.id,
          issue: issueString,
        }),
      });

      if (res.ok) {
        setCiInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, issue: issueString } : i));
        showAlert({
          title: 'CI Notes Saved',
          message: 'Your field inspection notes have been recorded successfully.',
          type: 'success',
        });
      } else {
        throw new Error('Failed to save field notes');
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message || 'Failed to save field notes', type: 'error' });
    } finally {
      setSavingCiId(null);
    }
  };

  const handleToggleCiChecklist = async (inst: InstallmentItem, key: string) => {
    try {
      const meta = parseCiMeta(inst.issue);
      meta.checklist = meta.checklist || {};
      meta.checklist[key] = !meta.checklist[key];
      const issueString = JSON.stringify(meta);

      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inst.id,
          issue: issueString,
        }),
      });

      if (res.ok) {
        setCiInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, issue: issueString } : i));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkCiVerified = async (inst: InstallmentItem) => {
    const isConfirmed = await confirm({
      title: 'Verify & Clear for Delivery',
      message: `Confirm that you have completed the Credit Investigation and electrical/residence inspection for "${inst.name}" (#${inst.appId})?`,
      confirmText: 'Confirm CI Clearance',
    });
    if (!isConfirmed) return;

    try {
      const meta = parseCiMeta(inst.issue);
      meta.ciVerified = true;
      meta.ciVerifiedBy = techName;
      meta.ciVerifiedAt = new Date().toISOString();
      meta.checklist = {
        address: true,
        id: true,
        electrical: true,
        reference: true,
        ...(meta.checklist || {}),
      };
      const issueString = JSON.stringify(meta);

      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inst.id,
          issue: issueString,
        }),
      });

      if (res.ok) {
        setCiInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, issue: issueString } : i));
        showAlert({
          title: 'CI Clearance Complete',
          message: `Customer ${inst.name} is now verified! The admin and dispatch team have been updated that the AC is cleared for delivery.`,
          type: 'success',
        });
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message || 'Failed to update clearance', type: 'error' });
    }
  };

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

  // Handle proof image upload with canvas compression
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let w = img.width, h = img.height;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE; }
          else { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        let quality = 0.7;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 150000 && quality > 0.2) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        setModificationProof(dataUrl);
        setIsUploadingProof(false);
      };
      img.onerror = () => setIsUploadingProof(false);
      img.src = evt.target?.result as string;
    };
    reader.onerror = () => setIsUploadingProof(false);
    reader.readAsDataURL(file);
  };

  // Open Invoice Modal - Only for Services (not for Pick Up items or Delivery & Installation)
  const openInvoiceModal = (job: any) => {
    if (isAssignedTask(job)) {
      showAlert({
        title: 'No Invoice Required',
        message: 'Invoices are only generated for technical services (Cleaning, Repair, Maintenance). Assigned tasks (Store Pick Up and Delivery) do not require service invoices.',
        type: 'info'
      });
      return;
    }
    setInvoiceJob(job);
    const initialType = job.type || job.serviceType || 'Regular Cleaning';
    setInvoiceServiceType(initialType);
    setInvoiceAmount(standardServices[initialType] || 1200);
    setInvoiceNotes(`Service conducted on ${job.item || 'AC Unit'} at ${job.location || job.address || ''}.`);
    setModificationProof(null);
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

  // Submit Service Modification for Admin Approval (requires photo proof)
  const handleSubmitModification = async () => {
    if (!invoiceJob) return;
    if (!modificationProof) {
      showAlert({ title: 'Photo Proof Required', message: 'Please upload a photo showing why the service was modified (e.g. mold on evaporator, damaged parts).', type: 'error' });
      return;
    }
    if (!invoiceNotes.trim() || invoiceNotes.trim().length < 10) {
      showAlert({ title: 'Assessment Required', message: 'Please provide a detailed technician assessment explaining why the service was changed (at least 10 characters).', type: 'error' });
      return;
    }
    setInvoiceSending(true);
    try {
      const originalService = invoiceJob.type || invoiceJob.serviceType || 'Regular Cleaning';
      const modNotes = `[SERVICE MODIFICATION PENDING]: Original: ${originalService} -> Modified: ${invoiceServiceType} (₱${invoiceAmount}). Remarks: ${invoiceNotes} | PROOF:${modificationProof}`;

      // Update dispatch status to MODIFICATION_PENDING
      await fetch('/api/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoiceJob.id,
          status: 'MODIFICATION_PENDING',
          notes: modNotes
        })
      });

      setInvoiceSending(false);
      setShowInvoiceModal(false);
      showAlert({
        title: 'Modification Submitted',
        message: `Service modification request has been submitted to Admin for approval.\n\nOriginal: ${originalService}\nModified: ${invoiceServiceType} — ₱${Number(invoiceAmount).toLocaleString()}\n\nPlease wait for Admin to review and approve before the invoice is generated.`
      });
      loadData();
    } catch (err) {
      setInvoiceSending(false);
      showAlert({ title: 'Error', message: 'Failed to submit modification. Please try again.', type: 'error' });
    }
  };

  // Helper to identify Store Pick Up items
  const isPickupTask = (job: any) => {
    const t = (job.type || '').toLowerCase();
    const notes = (job.notes || '').toLowerCase();
    const loc = (job.location || job.address || '').toLowerCase();
    return (
      t.includes('pick up') ||
      t.includes('pickup') ||
      t.includes('pick-up') ||
      notes.includes('store pick up') ||
      notes.includes('store pickup') ||
      notes.includes('ready for pick up') ||
      loc.includes('store pick up') ||
      loc.includes('store pickup')
    );
  };

  // Helper to distinguish Assigned Tasks (Pick Up items & Deliveries) vs Technical Services (Cleaning, Repair, Maintenance)
  const isAssignedTask = (job: any) => {
    if (isPickupTask(job)) return true;
    const t = (job.type || '').toLowerCase();
    const notes = (job.notes || '').toLowerCase();
    return (
      t.includes('delivery') ||
      t.includes('deliver') ||
      t.includes('installation') ||
      t.includes('install') ||
      t.includes('new installation') ||
      t === 'order delivery' ||
      notes.includes('delivery & installation for order') ||
      notes.includes('order delivery')
    );
  };

  const isDelivery = isAssignedTask;

  // Assigned Tasks = Store Pick Up Items + AC Deliveries & Installations
  const deliveryTasks = tasks.filter(t => isAssignedTask(t));
  const filteredDeliveries = deliveryTasks.filter(t => {
    if (deliveryFilter === 'All') return true;
    if (deliveryFilter === 'Pick Up') return isPickupTask(t);
    if (deliveryFilter === 'Delivery') return !isPickupTask(t);
    if (deliveryFilter === 'Pending') return t.status === 'PENDING' || t.status === 'Assigned' || t.status === 'Ready for Pick Up';
    if (deliveryFilter === 'In Progress') return t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'Out for Delivery';
    if (deliveryFilter === 'Completed') return t.status === 'COMPLETED' || t.status === 'Delivered';
    return true;
  });

  // Services = Technical Services (Cleaning, Repair, Maintenance)
  const serviceDispatch = tasks.filter(t => !isAssignedTask(t));
  const normalizedMaintenance: DispatchItem[] = maintenanceTasks
    .filter(m => !isAssignedTask(m))
    .map(m => ({
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

  // Credit Investigation (CI) Calculations
  const activeCiItems = ciInstallments.filter((i) => i.status === 'CI_ACCEPTED');
  const pendingCiCount = activeCiItems.filter((i) => {
    const meta = parseCiMeta(i.issue);
    return !meta.ciVerified;
  }).length;

  const filteredCiItems = activeCiItems.filter((i) => {
    const meta = parseCiMeta(i.issue);
    if (ciFilter === 'MY_CI') {
      const isMyTech =
        !i.assignedTech ||
        i.assignedTech.toLowerCase().includes(techName.toLowerCase()) ||
        i.assignedTech.toLowerCase().includes('authorized ci') ||
        i.assignedTech.toLowerCase().includes('assigned ci') ||
        i.assignedTech.toLowerCase().includes('all ci');
      if (!isMyTech) return false;
    } else if (ciFilter === 'PENDING') {
      if (meta.ciVerified) return false;
    } else if (ciFilter === 'VERIFIED') {
      if (!meta.ciVerified) return false;
    }

    if (ciSearchQuery.trim()) {
      const q = ciSearchQuery.toLowerCase().trim();
      const name = (i.name || '').toLowerCase();
      const appId = (i.appId || '').toLowerCase();
      const item = (i.item || '').toLowerCase();
      const loc = (i.location || '').toLowerCase();
      const phone = (i.user?.phone || '').toLowerCase();
      return name.includes(q) || appId.includes(q) || item.includes(q) || loc.includes(q) || phone.includes(q);
    }
    return true;
  });

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

      {/* RESPONSIVE TECHNICIAN PORTAL STYLES */}
      <style>{`
        @media (max-width: 768px) {
          .tech-header {
            padding: 0.65rem 1rem !important;
          }
          .tech-portal-title {
            display: none !important;
          }
          .tech-duty-pill {
            padding: 0.3rem 0.65rem !important;
          }
          .tech-name-full {
            display: none !important;
          }
          .tech-name-short {
            display: inline !important;
          }
          .tech-layout-container {
            flex-direction: column !important;
            min-height: calc(100vh - 56px) !important;
          }
          .tech-sidebar {
            display: none !important;
          }
          .tech-main-content {
            padding: 0.9rem 0.8rem 5.5rem 0.8rem !important;
          }
          .tech-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.85rem !important;
            padding: 1.1rem !important;
          }
          .tech-banner-buttons {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
          }
          .tech-banner-buttons button {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            padding: 0.55rem 0.5rem !important;
            font-size: 0.78rem !important;
          }
          .tech-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.65rem !important;
            margin-bottom: 1.25rem !important;
          }
          .tech-stat-card {
            padding: 0.9rem !important;
          }
          .tech-stat-card .stat-num {
            font-size: 1.45rem !important;
          }
          .tech-calendar-container {
            grid-template-columns: 1fr !important;
            gap: 1.2rem !important;
          }
          .tech-calendar-card {
            padding: 1rem 0.8rem !important;
          }
          .tech-calendar-grid {
            gap: 3px !important;
          }
          .tech-calendar-cell {
            height: 52px !important;
            padding: 0.25rem !important;
            border-radius: 6px !important;
          }
          .tech-calendar-cell .day-num {
            font-size: 0.75rem !important;
          }
          .tech-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 0.85rem !important;
          }
          .tech-filters-bar {
            overflow-x: auto !important;
            width: 100% !important;
            flex-wrap: nowrap !important;
            -webkit-overflow-scrolling: touch;
            padding: 3px !important;
          }
          .tech-filters-bar button {
            white-space: nowrap !important;
            font-size: 0.78rem !important;
            padding: 0.4rem 0.75rem !important;
          }
          .tech-modal-content {
            max-height: 94vh !important;
            border-radius: 14px !important;
          }
          .tech-modal-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .tech-bottom-nav {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .tech-name-short {
            display: none !important;
          }
          .tech-bottom-nav {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP HEADER */}
      <header
        className="tech-header"
        style={{
          background: 'linear-gradient(135deg, #072a6b 0%, #0b3080 100%)',
          color: '#ffffff',
          padding: '0.85rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(2, 132, 199, 0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/LOGO.jpg" alt="FrostTech" style={{ height: '34px', borderRadius: '6px', background: '#ffffff', padding: '2px' }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.5px' }}>FrostTech</span>
              <span className="tech-portal-title" style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Field Technician Portal</span>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="tech-duty-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.18)', padding: '0.4rem 0.85rem', borderRadius: '999px', backdropFilter: 'blur(8px)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0 }}></span>
            <span className="tech-name-full" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{techName} (On Duty)</span>
            <span className="tech-name-short" style={{ fontSize: '0.8rem', fontWeight: 600 }}>On Duty</span>
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
                  <i className="fa-solid fa-gauge" style={{ color: '#052e80' }}></i> Dashboard
                </button>
                <button
                  onClick={() => { setActiveTab('assigned'); setKebabOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-truck" style={{ color: '#052e80' }}></i> Assigned Tasks
                </button>
                <button
                  onClick={() => { setActiveTab('services'); setKebabOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-screwdriver-wrench" style={{ color: '#052e80' }}></i> Services
                </button>
                <button
                  onClick={() => { setActiveTab('ci'); setKebabOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-id-card-clip" style={{ color: '#0284c7' }}></i> Credit Investigation (CI)
                  {pendingCiCount > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#d97706', color: '#ffffff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 700 }}>
                      {pendingCiCount}
                    </span>
                  )}
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
      <div className="tech-layout-container" style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside
          className="tech-sidebar"
          style={{
            width: '260px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flexShrink: 0
          }}
        >
          {/* Tech Profile Summary */}
          <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#052e80', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
              {techName.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{techName}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '0.74rem', color: '#052e80', fontWeight: 600 }}>{techRank}</span>
                {isCiOfficerTech && (
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                    title="Authorized Credit Investigator"
                  >
                    <i className="fa-solid fa-id-card-clip" style={{ fontSize: '0.6rem' }}></i> CI Officer
                  </span>
                )}
              </div>
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
              background: activeTab === 'dashboard' ? '#d8e9fd' : 'transparent',
              color: activeTab === 'dashboard' ? '#052e80' : '#475569',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderLeft: activeTab === 'dashboard' ? '4px solid #052e80' : '4px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-chart-line" style={{ width: '18px', color: activeTab === 'dashboard' ? '#052e80' : '#94a3b8' }}></i>
              <span>Dashboard</span>
            </div>
            <span style={{ fontSize: '0.75rem', background: activeTab === 'dashboard' ? '#052e80' : '#e2e8f0', color: activeTab === 'dashboard' ? '#ffffff' : '#64748b', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
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
              background: activeTab === 'assigned' ? '#d8e9fd' : 'transparent',
              color: activeTab === 'assigned' ? '#052e80' : '#475569',
              fontWeight: activeTab === 'assigned' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderLeft: activeTab === 'assigned' ? '4px solid #052e80' : '4px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-truck" style={{ width: '18px', color: activeTab === 'assigned' ? '#052e80' : '#94a3b8' }}></i>
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
              background: activeTab === 'services' ? '#d8e9fd' : 'transparent',
              color: activeTab === 'services' ? '#052e80' : '#475569',
              fontWeight: activeTab === 'services' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderLeft: activeTab === 'services' ? '4px solid #052e80' : '4px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-screwdriver-wrench" style={{ width: '18px', color: activeTab === 'services' ? '#052e80' : '#94a3b8' }}></i>
              <span>Services</span>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#052e80', color: '#ffffff', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
              {allServiceJobs.length}
            </span>
          </button>

          {/* TAB 4: CREDIT INVESTIGATION (CI) */}
          <button
            onClick={() => setActiveTab('ci')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'ci' ? '#d8e9fd' : 'transparent',
              color: activeTab === 'ci' ? '#052e80' : '#475569',
              fontWeight: activeTab === 'ci' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderLeft: activeTab === 'ci' ? '4px solid #052e80' : '4px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-id-card-clip" style={{ width: '18px', color: activeTab === 'ci' ? '#052e80' : '#94a3b8' }}></i>
              <span>Credit Investigation (CI)</span>
            </div>
            {pendingCiCount > 0 ? (
              <span style={{ fontSize: '0.75rem', background: '#d97706', color: '#ffffff', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
                {pendingCiCount}
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#64748b', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
                {activeCiItems.length}
              </span>
            )}
          </button>

          {/* Bottom Shift Info Card */}
          <div style={{ marginTop: 'auto', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#052e80', fontWeight: 700, marginBottom: '0.4rem' }}>
              <i className="fa-regular fa-clock"></i> Today's Shift
            </div>
            <p style={{ margin: 0, color: '#64748b' }}>08:00 AM - 05:00 PM</p>
            <p style={{ margin: '0.2rem 0 0', color: '#16a34a', fontWeight: 600 }}>Active Dispatch Sync</p>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="tech-main-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

          {/* ======================================================== */}
          {/* TAB 1: DASHBOARD (Tech Stats + Monthly Calendar) */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Banner */}
              <div className="tech-banner" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Technician Overview & Schedule
                  </h2>
                  <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
                    Welcome back, <strong>{techName}</strong>. Check your month schedule and assigned workloads.
                  </p>
                </div>
                <div className="tech-banner-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveTab('assigned')} style={{ background: '#d8e9fd', color: '#052e80', border: '1px solid #bae6fd', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <i className="fa-solid fa-truck" style={{ marginRight: '6px' }}></i> View Deliveries
                  </button>
                  <button onClick={() => setActiveTab('services')} style={{ background: '#052e80', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <i className="fa-solid fa-wrench" style={{ marginRight: '6px' }}></i> View Services
                  </button>
                  <button onClick={() => setActiveTab('ci')} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-id-card-clip"></i> CI Inspections ({pendingCiCount})
                  </button>
                </div>
              </div>

              {/* CI Action Callout */}
              {pendingCiCount > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-bell" style={{ color: '#d97706', fontSize: '1.2rem' }}></i>
                    <div>
                      <strong style={{ color: '#92400e', fontSize: '0.92rem', display: 'block' }}>
                        Credit Investigation Action Required: {pendingCiCount} Customer(s) Pending CI
                      </strong>
                      <span style={{ color: '#78350f', fontSize: '0.82rem' }}>
                        Customer installment applications accepted for CI. Check inspection notes and verify residence/electrical breaker before AC delivery.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('ci')}
                    style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Open CI Queue &rarr;
                  </button>
                </div>
              )}

              {/* 4 STAT CARDS */}
              <div className="tech-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="tech-stat-card" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Jobs</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#d8e9fd', color: '#052e80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-clipboard-list"></i>
                    </div>
                  </div>
                  <div className="stat-num" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>{totalJobsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Deliveries & Services</span>
                </div>

                <div className="tech-stat-card" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pending</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-hourglass-half"></i>
                    </div>
                  </div>
                  <div className="stat-num" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '0.5rem' }}>{pendingJobsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Awaiting departure</span>
                </div>

                <div className="tech-stat-card" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>In Progress</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#d8e9fd', color: '#052e80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-person-running"></i>
                    </div>
                  </div>
                  <div className="stat-num" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#052e80', marginTop: '0.5rem' }}>{inProgressJobsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active in field</span>
                </div>

                <div className="tech-stat-card" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Completed</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  </div>
                  <div className="stat-num" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>{completedJobsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Finished tasks</span>
                </div>
              </div>

              {/* MONTHLY CALENDAR GRID + SELECTED DAY DETAILS */}
              <div className="tech-calendar-container" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
                
                {/* CALENDAR FOR THE SCHEDULE MONTH */}
                <div className="tech-calendar-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-regular fa-calendar-days" style={{ color: '#052e80' }}></i>
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
                  <div className="tech-calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
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
                          className="tech-calendar-cell"
                          style={{
                            height: '70px',
                            background: isSelected ? '#d8e9fd' : isToday ? '#f0f9ff' : '#ffffff',
                            border: isSelected ? '2px solid #052e80' : isToday ? '1px solid #38bdf8' : '1px solid #e2e8f0',
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
                            <span className="day-num" style={{ fontSize: '0.85rem', fontWeight: isToday ? 800 : 600, color: isToday ? '#052e80' : '#0f172a' }}>
                              {dNum}
                            </span>
                            {isToday && (
                              <span style={{ fontSize: '0.6rem', background: '#052e80', color: '#ffffff', padding: '1px 4px', borderRadius: '4px' }}>TODAY</span>
                            )}
                          </div>

                          {dayJobs.length > 0 && (
                            <div style={{ marginTop: 'auto' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                background: '#052e80',
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
                    <i className="fa-solid fa-list-check" style={{ color: '#052e80', marginRight: '6px' }}></i>
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
                        const isDeliv = isAssignedTask(job);
                        const isPick = isPickupTask(job);
                        return (
                          <div key={job.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: isPick ? '#fef3c7' : isDeliv ? '#dbeafe' : '#e0e7ff',
                                color: isPick ? '#92400e' : isDeliv ? '#1d4ed8' : '#3730a3'
                              }}>
                                {isPick ? 'Store Pick Up' : isDeliv ? 'AC Delivery' : job.type}
                              </span>
                              <span style={{
                                fontSize: '0.75rem',
                                color: job.status === 'MODIFICATION_PENDING' ? '#b45309' : '#64748b',
                                background: job.status === 'MODIFICATION_PENDING' ? '#fef3c7' : 'transparent',
                                padding: job.status === 'MODIFICATION_PENDING' ? '2px 7px' : '0',
                                borderRadius: '4px',
                                fontWeight: job.status === 'MODIFICATION_PENDING' ? 700 : 600,
                                border: job.status === 'MODIFICATION_PENDING' ? '1px solid #fde68a' : 'none'
                              }}>
                                {job.status === 'MODIFICATION_PENDING' ? 'Mod Pending Approval' : job.status}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.2rem' }}>{job.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.3rem' }}>
                              <i className="fa-solid fa-location-dot" style={{ color: '#ef4444', marginRight: '4px' }}></i>
                              {(job.location || job.address || '').split('| COORDS:')[0].trim()}
                            </p>
                            <div style={{ fontSize: '0.8rem', color: '#052e80', fontWeight: 600 }}>
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
                                job.status === 'MODIFICATION_PENDING' ? (
                                  <span
                                    style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    Mod Pending
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => openInvoiceModal(job)}
                                    style={{ background: '#052e80', border: 'none', color: '#ffffff', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    Invoice
                                  </button>
                                )
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
                    <i className="fa-solid fa-truck" style={{ color: '#052e80', marginRight: '8px' }}></i>
                    Assigned Tasks — Pick Up Items & Deliveries
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                    Store pick up orders, unit releases, and scheduled AC deliveries.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="tech-filters-bar" style={{ display: 'flex', gap: '0.4rem', background: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                  {(['All', 'Pick Up', 'Delivery', 'Pending', 'In Progress', 'Completed'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setDeliveryFilter(f)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: deliveryFilter === f ? '#052e80' : 'transparent',
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
                  <h4 style={{ color: '#334155', margin: 0 }}>No assigned tasks found</h4>
                  <p style={{ fontSize: '0.85rem' }}>No pick up orders or AC deliveries match the current filter: <strong>{deliveryFilter}</strong></p>
                </div>
              ) : (
                <div className="tech-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                  {filteredDeliveries.map(job => {
                    const isPickup = isPickupTask(job);
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#052e80', background: '#d8e9fd', padding: '3px 8px', borderRadius: '6px' }}>
                                {job.dispatchNo || (isPickup ? 'DSP-PICKUP' : 'DSP-DELIVERY')}
                              </span>
                              {isPickup ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fa-solid fa-store" style={{ fontSize: '0.7rem' }}></i> Store Pick Up
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fa-solid fa-truck" style={{ fontSize: '0.7rem' }}></i> Delivery & Install
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '999px',
                              background: isCompleted ? '#dcfce7' : isInProgress ? '#d8e9fd' : '#fef3c7',
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
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#052e80' }}>
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
                              {isPickup ? 'Picked up schedule:' : 'Schedule:'} <strong>{job.scheduledDate || 'Immediate Dispatch'}</strong>
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
                              <i className="fa-solid fa-circle-check"></i> {isPickup ? 'Successfully Picked Up' : 'Delivered & Installed'}
                            </div>
                          ) : isInProgress ? (
                            <button
                              onClick={() => handleUpdateStatus(job.id, 'COMPLETED')}
                              style={{ flex: 1, background: '#16a34a', color: '#ffffff', border: 'none', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i> {isPickup ? 'Confirm Unit Picked Up' : 'Mark Delivered & Installed'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(job.id, 'IN_PROGRESS')}
                              style={{ flex: 1, background: '#052e80', color: '#ffffff', border: 'none', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <i className={`fa-solid ${isPickup ? 'fa-box-open' : 'fa-play'}`} style={{ marginRight: '4px' }}></i> {isPickup ? 'Prepare Unit for Pick Up' : 'Start Delivery & Setup'}
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
                    <i className="fa-solid fa-screwdriver-wrench" style={{ color: '#052e80', marginRight: '8px' }}></i>
                    Field Service Jobs
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                    Assigned technical services (Cleaning, Repair, and Maintenance). Invoices are generated for on-site service orders.
                  </p>
                </div>

                {/* Filter buttons: Maintenance, Cleaning, Repair */}
                <div className="tech-filters-bar" style={{ display: 'flex', gap: '0.4rem', background: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  {(['All', 'Maintenance', 'Cleaning', 'Repair'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setServiceFilter(f)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: serviceFilter === f ? '#052e80' : 'transparent',
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
                <div className="tech-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
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
                              background: isCompleted ? '#dcfce7' : isInProgress ? '#d8e9fd' : '#fef3c7',
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
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#052e80' }}>
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
                          {job.status === 'MODIFICATION_PENDING' ? (
                            <span
                              style={{ flex: 1, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              <i className="fa-solid fa-clock-rotate-left"></i> Mod Pending Admin
                            </span>
                          ) : (
                            <button
                              onClick={() => openInvoiceModal(job)}
                              style={{ flex: 1, background: '#052e80', color: '#ffffff', border: 'none', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-file-invoice" style={{ marginRight: '4px' }}></i> Invoice / Complete
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
          {/* TAB 4: CREDIT INVESTIGATION (CI) & FIELD VERIFICATION */}
          {/* ======================================================== */}
          {activeTab === 'ci' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-id-card-clip" style={{ color: '#052e80' }}></i>
                    Credit Investigation (CI) &amp; Field Verification Queue
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                    Customer installment applications accepted for CI. Follow Admin instructions and verify customer details upon delivering the AC unit.
                  </p>
                </div>

                {/* Filter Buttons */}
                <div className="tech-filters-bar" style={{ display: 'flex', gap: '0.4rem', background: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                  {(['ALL', 'MY_CI', 'PENDING', 'VERIFIED'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setCiFilter(f)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: ciFilter === f ? '#052e80' : 'transparent',
                        color: ciFilter === f ? '#ffffff' : '#64748b',
                        fontWeight: ciFilter === f ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {f === 'ALL' ? 'All CI Customers' : f === 'MY_CI' ? 'Assigned to Me' : f === 'PENDING' ? `Pending (${pendingCiCount})` : 'Verified & Cleared'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  value={ciSearchQuery}
                  onChange={(e) => setCiSearchQuery(e.target.value)}
                  placeholder="Search CI customer name, App ID (#APP-...), AC model, address, or phone..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                />
              </div>

              {filteredCiItems.length === 0 ? (
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fa-solid fa-user-shield" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}></i>
                  <h4 style={{ color: '#334155', margin: 0 }}>No Credit Investigation customers found</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    {ciSearchQuery.trim()
                      ? `No customers match your search query "${ciSearchQuery}".`
                      : 'When the Admin clicks "Accept for CI" on installment applications, they will appear here with inspection notes.'}
                  </p>
                </div>
              ) : (
                <div className="tech-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
                  {filteredCiItems.map((inst) => {
                    const meta = parseCiMeta(inst.issue);
                    const isVerified = Boolean(meta.ciVerified);
                    const phone = inst.user?.phone || '0917-123-4567';
                    const cleanAddress = (inst.location || 'Customer Address').split('| COORDS:')[0].trim();
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`;
                    const checklist = meta.checklist || {};

                    return (
                      <div
                        key={inst.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '18px',
                          border: isVerified ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                          padding: '1.4rem',
                          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        {/* Top: Customer & Status Header */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                                  {inst.name}
                                </h3>
                                <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                                  #{inst.appId}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                                Applied: {inst.date} • Assigned to: <strong>{inst.assignedTech || meta.assignedCiTechName || 'CI Officer'}</strong>
                              </span>
                            </div>

                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: isVerified ? '#dcfce7' : '#fef3c7',
                                color: isVerified ? '#15803d' : '#b45309',
                                border: isVerified ? '1px solid #86efac' : '1px solid #fde68a',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <i className={`fa-solid ${isVerified ? 'fa-circle-check' : 'fa-hourglass-half'}`}></i>
                              {isVerified ? 'CI Verified & Cleared' : 'Pending CI Inspection'}
                            </span>
                          </div>

                          {/* Financed AC Unit Banner */}
                          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.75rem 0.9rem', marginBottom: '0.85rem' }}>
                            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Financed AC Unit to Deliver
                            </div>
                            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0c4a6e', marginTop: '2px' }}>
                              {inst.item}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                              Installment Term: {inst.term} Months • Employer: {inst.employer || 'Self-Employed'} • Monthly Income: {inst.income || '₱35,000'}
                            </div>
                          </div>

                          {/* Customer Address & Contact Info */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.84rem', color: '#334155', background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div>
                                <i className="fa-solid fa-location-dot" style={{ color: '#ef4444', marginRight: '6px' }}></i>
                                <strong>Delivery Address:</strong> {cleanAddress}
                              </div>
                              <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: '#e0f2fe',
                                  color: '#0284c7',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <i className="fa-solid fa-diamond-turn-right"></i> Maps
                              </a>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                              <div>
                                <i className="fa-solid fa-phone" style={{ color: '#0284c7', marginRight: '6px' }}></i>
                                <strong>Contact:</strong> {phone}
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <a
                                  href={`tel:${phone}`}
                                  style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600, textDecoration: 'none' }}
                                >
                                  <i className="fa-solid fa-phone"></i> Call
                                </a>
                                <a
                                  href={`sms:${phone}`}
                                  style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600, textDecoration: 'none' }}
                                >
                                  <i className="fa-solid fa-comment-sms"></i> SMS
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* ⭐ ADMIN NOTE FOR CI INSPECTION (WHAT TO DO WHEN DELIVERING AC) */}
                          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontSize: '0.8rem', fontWeight: 800 }}>
                              <i className="fa-solid fa-clipboard-check" style={{ color: '#d97706' }}></i>
                              Admin CI Inspection Note (What to Check when Delivering AC):
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#78350f', lineHeight: '1.45', fontWeight: 500 }}>
                              {meta.ciNotes || 'Verify customer valid government ID & proof of billing. Inspect electrical line and circuit breaker (20A minimum) for AC load before delivery. Confirm physical residence.'}
                            </p>
                          </div>

                          {/* Interactive CI Field Checklist */}
                          <div style={{ marginBottom: '0.85rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <i className="fa-solid fa-list-check" style={{ color: '#0284c7' }}></i>
                              Field Verification Checklist:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              {[
                                { key: 'address', label: 'Residence & Delivery Address verified' },
                                { key: 'id', label: 'Government ID & Billing inspected' },
                                { key: 'electrical', label: 'Breaker (20A+) ready for AC' },
                                { key: 'reference', label: 'Co-maker / Reference confirmed' },
                              ].map((item) => {
                                const checked = !!checklist[item.key];
                                return (
                                  <label
                                    key={item.key}
                                    onClick={() => handleToggleCiChecklist(inst, item.key)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '7px',
                                      padding: '6px 8px',
                                      borderRadius: '8px',
                                      background: checked ? '#f0fdf4' : '#f8fafc',
                                      border: checked ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                      fontSize: '0.74rem',
                                      fontWeight: checked ? 700 : 500,
                                      color: checked ? '#166534' : '#64748b',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <i className={`fa-solid ${checked ? 'fa-square-check' : 'fa-square'}`} style={{ color: checked ? '#16a34a' : '#cbd5e1', fontSize: '0.9rem' }}></i>
                                    {item.label}
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Field Findings & Technician Notes Input */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Technician Field Inspection Findings:
                            </label>
                            <textarea
                              rows={2}
                              value={fieldNotesInputs[inst.id] !== undefined ? fieldNotesInputs[inst.id] : (meta.fieldNotes || '')}
                              onChange={(e) => setFieldNotesInputs({ ...fieldNotesInputs, [inst.id]: e.target.value })}
                              placeholder="Type field observations (e.g. Breaker 25A inspected, ID matched payslip, clear delivery route)..."
                              style={{
                                width: '100%',
                                padding: '0.55rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.82rem',
                                outline: 'none',
                                resize: 'vertical',
                                color: '#0f172a',
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <button
                                onClick={() => handleSaveCiFieldNotes(inst, fieldNotesInputs[inst.id] || '')}
                                disabled={savingCiId === inst.id}
                                style={{
                                  background: '#052e80',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: savingCiId === inst.id ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className={`fa-solid ${savingCiId === inst.id ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
                                {savingCiId === inst.id ? 'Saving...' : 'Save Field Notes'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.6rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setSelectedCiDetails(inst)}
                            style={{
                              flex: 1,
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '0.6rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <i className="fa-solid fa-address-book"></i> Dossier Details
                          </button>

                          {!isVerified ? (
                            <button
                              onClick={() => handleMarkCiVerified(inst)}
                              style={{
                                flex: 1.5,
                                background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.6rem 0.85rem',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                              }}
                            >
                              <i className="fa-solid fa-circle-check"></i> Mark CI Verified &amp; Cleared
                            </button>
                          ) : (
                            <button
                              disabled
                              style={{
                                flex: 1.5,
                                background: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac',
                                padding: '0.6rem 0.85rem',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                cursor: 'default',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <i className="fa-solid fa-shield-check"></i> CI Cleared by {meta.ciVerifiedBy || 'Tech'}
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

        </main>
      </div>

      {/* ======================================================== */}
      {/* INVOICE MODAL WITH SERVICE TYPE MODIFICATION */}
      {/* ======================================================== */}
      {showInvoiceModal && invoiceJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div className="tech-modal-content" style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '18px', borderTopRightRadius: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#052e80' }}></i>
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
                <div style={{ fontSize: '0.8rem', color: '#052e80', marginTop: '4px', fontWeight: 600 }}>
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

              {/* TECHNICIAN NOTES / JUSTIFICATION — with modification detection */}
              {(() => {
                const originalService = invoiceJob.type || invoiceJob.serviceType || 'Regular Cleaning';
                const isModified = invoiceServiceType !== originalService;
                return (
                  <>
                    {/* MODIFICATION WARNING BANNER */}
                    {isModified && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ color: '#d97706', fontSize: '1.1rem', marginTop: '2px' }}></i>
                        <div>
                          <strong style={{ color: '#92400e', fontSize: '0.85rem', display: 'block', marginBottom: '2px' }}>Service Modification Detected</strong>
                          <span style={{ color: '#78350f', fontSize: '0.78rem' }}>
                            Changed from <strong>{originalService}</strong> &rarr; <strong>{invoiceServiceType}</strong>. This requires <u>photo proof</u> and <u>Admin approval</u> before the invoice is finalized.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* PHOTO PROOF UPLOAD (only when modified) */}
                    {isModified && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                          <i className="fa-solid fa-camera" style={{ marginRight: '6px', color: '#d97706' }}></i>
                          Photo Proof of Service Adjustment <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px' }}>
                          Upload a photo showing why the unit needed a different service (e.g. heavy mold, damaged parts, electrical issue).
                        </p>
                        {!modificationProof ? (
                          <label style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '2px dashed #fbbf24', borderRadius: '10px', background: '#fffbeb', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <input type="file" accept="image/*" onChange={handleProofUpload} style={{ display: 'none' }} />
                            {isUploadingProof ? (
                              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#d97706' }}></i>
                            ) : (
                              <>
                                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.8rem', color: '#d97706', marginBottom: '6px' }}></i>
                                <span style={{ fontWeight: 600, color: '#92400e', fontSize: '0.85rem' }}>Tap to upload photo proof</span>
                                <span style={{ fontSize: '0.72rem', color: '#a16207' }}>JPEG, PNG — compressed for upload</span>
                              </>
                            )}
                          </label>
                        ) : (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={modificationProof} alt="Proof" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', border: '2px solid #fbbf24', objectFit: 'cover' as const }} />
                            <button
                              type="button"
                              onClick={() => setModificationProof(null)}
                              style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                        {isModified ? (
                          <>
                            <i className="fa-solid fa-clipboard-check" style={{ marginRight: '6px', color: '#d97706' }}></i>
                            Technician Assessment & Reason for Service Adjustment <span style={{ color: '#dc2626' }}>*</span>
                          </>
                        ) : (
                          'Technician Assessment & Reason for Service Adjustment'
                        )}
                      </label>
                      <textarea
                        rows={3}
                        value={invoiceNotes}
                        onChange={(e) => setInvoiceNotes(e.target.value)}
                        placeholder={isModified
                          ? 'REQUIRED: Explain why the service was changed (e.g. "Upon inspection, evaporator coils had severe mold requiring full chemical wash instead of regular cleaning.")'
                          : 'e.g. Customer booked regular cleaning, but upon inspection the evaporator coils had excessive mold buildup requiring complete chemical wash.'
                        }
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${isModified && (!invoiceNotes.trim() || invoiceNotes.trim().length < 10) ? '#fbbf24' : '#cbd5e1'}`, fontSize: '0.85rem', color: '#0f172a', fontFamily: 'inherit' }}
                      />
                    </div>

                    {/* SUBMIT BUTTONS — conditional on modification */}
                    {isModified ? (
                      <button
                        disabled={invoiceSending || !modificationProof || !invoiceNotes.trim() || invoiceNotes.trim().length < 10}
                        onClick={handleSubmitModification}
                        style={{
                          width: '100%',
                          background: (!modificationProof || !invoiceNotes.trim() || invoiceNotes.trim().length < 10) ? '#94a3b8' : 'linear-gradient(135deg, #d97706, #b45309)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.95rem',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: (!modificationProof || !invoiceNotes.trim() || invoiceNotes.trim().length < 10) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          boxShadow: '0 4px 12px rgba(217,119,6,0.3)'
                        }}
                      >
                        <i className="fa-solid fa-paper-plane"></i>
                        {invoiceSending ? 'Submitting...' : 'Submit Modification for Admin Approval'}
                      </button>
                    ) : (
                      <div className="tech-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button
                          disabled={invoiceSending}
                          onClick={() => handleSendInvoice('CUSTOMER')}
                          style={{ background: '#052e80', color: '#ffffff', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CLIENT INFO & LOCATION MODAL */}
      {/* ======================================================== */}
      {showClientModal && selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div className="tech-modal-content" style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }}>
            
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-user-circle" style={{ color: '#052e80' }}></i>
                Client & Location Information
              </h3>
              <button onClick={() => setShowClientModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div className="tech-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Customer</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedJob.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#052e80', marginTop: '4px' }}>
                    <i className="fa-solid fa-phone" style={{ marginRight: '6px' }}></i> +63 9XX XXX XXXX
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Task / AC Unit</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#052e80', marginTop: '2px' }}>{selectedJob.item}</div>
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
                      style={{ background: '#052e80', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
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

      {/* ======================================================== */}
      {/* CI CUSTOMER DOSSIER & DETAILS MODAL */}
      {/* ======================================================== */}
      {selectedCiDetails && (() => {
        const meta = parseCiMeta(selectedCiDetails.issue);
        const cleanAddress = (selectedCiDetails.location || 'Customer Address').split('| COORDS:')[0].trim();
        const phone = selectedCiDetails.user?.phone || '0917-123-4567';

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '1rem' }} onClick={() => setSelectedCiDetails(null)}>
            <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#052e80', color: '#ffffff', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                    {selectedCiDetails.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{selectedCiDetails.name}</h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Application #{selectedCiDetails.appId} • Credit Investigation</span>
                  </div>
                </div>
                <button onClick={() => setSelectedCiDetails(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* AC Delivery Info Banner */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>AC Unit &amp; Delivery Target</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0c4a6e', marginTop: '3px' }}>{selectedCiDetails.item}</div>
                  <div style={{ fontSize: '0.82rem', color: '#0284c7', marginTop: '2px' }}>
                    Term: {selectedCiDetails.term} Months • Application Date: {selectedCiDetails.date}
                  </div>
                </div>

                {/* Profile Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Employer &amp; Workplace</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{selectedCiDetails.employer || 'Self-Employed'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Monthly Declared Income</span>
                    <strong style={{ fontSize: '0.9rem', color: '#16a34a' }}>{selectedCiDetails.income || '₱35,000'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>ID Type Presented</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{selectedCiDetails.idType || 'Government ID'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Phone Contact</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{phone}</strong>
                  </div>
                </div>

                {/* Address with Map Directions */}
                <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Delivery &amp; Residence Address</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, textDecoration: 'none' }}
                    >
                      <i className="fa-solid fa-diamond-turn-right" style={{ marginRight: '4px' }}></i> Open in Maps
                    </a>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#0f172a', fontWeight: 600 }}>{cleanAddress}</p>
                </div>

                {/* Admin Note Box */}
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '10px', padding: '0.9rem' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-clipboard-check"></i> Admin CI Inspection Notes &amp; Delivery Instructions:
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#78350f', lineHeight: '1.45' }}>
                    {meta.ciNotes || 'Verify customer valid government ID & proof of billing. Inspect electrical line and circuit breaker (20A minimum) for AC load before delivery.'}
                  </p>
                </div>

                {/* Tech Field Findings */}
                {meta.fieldNotes && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.9rem' }}>
                    <strong style={{ fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-user-pen"></i> Technician Field Findings:
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#14532d', lineHeight: '1.45' }}>
                      {meta.fieldNotes}
                    </p>
                    <small style={{ color: '#15803d', fontSize: '0.72rem', display: 'block', marginTop: '4px' }}>
                      Recorded by: {meta.lastUpdatedByTech || 'Field Technician'} {meta.lastUpdatedAt ? `on ${new Date(meta.lastUpdatedAt).toLocaleDateString()}` : ''}
                    </small>
                  </div>
                )}

                {/* Close Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <button
                    onClick={() => setSelectedCiDetails(null)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.65rem 1.4rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className="tech-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          zIndex: 80,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 0.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: activeTab === 'dashboard' ? '#052e80' : '#64748b',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <i className="fa-solid fa-chart-line" style={{ fontSize: '1.15rem' }}></i>
          <span style={{ fontSize: '0.72rem', fontWeight: activeTab === 'dashboard' ? 700 : 500 }}>Dashboard</span>
          {totalJobsCount > 0 && (
            <span style={{ position: 'absolute', top: '6px', right: '28%', background: '#052e80', color: '#ffffff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '999px', fontWeight: 700 }}>
              {totalJobsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('assigned')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: activeTab === 'assigned' ? '#052e80' : '#64748b',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <i className="fa-solid fa-truck" style={{ fontSize: '1.15rem' }}></i>
          <span style={{ fontSize: '0.72rem', fontWeight: activeTab === 'assigned' ? 700 : 500 }}>Deliveries</span>
          {deliveryTasks.length > 0 && (
            <span style={{ position: 'absolute', top: '6px', right: '28%', background: '#38bdf8', color: '#ffffff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '999px', fontWeight: 700 }}>
              {deliveryTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('services')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: activeTab === 'services' ? '#052e80' : '#64748b',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <i className="fa-solid fa-screwdriver-wrench" style={{ fontSize: '1.15rem' }}></i>
          <span style={{ fontSize: '0.72rem', fontWeight: activeTab === 'services' ? 700 : 500 }}>Services</span>
          {allServiceJobs.length > 0 && (
            <span style={{ position: 'absolute', top: '6px', right: '28%', background: '#052e80', color: '#ffffff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '999px', fontWeight: 700 }}>
              {allServiceJobs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ci')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: activeTab === 'ci' ? '#052e80' : '#64748b',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <i className="fa-solid fa-id-card-clip" style={{ fontSize: '1.15rem' }}></i>
          <span style={{ fontSize: '0.72rem', fontWeight: activeTab === 'ci' ? 700 : 500 }}>CI Officer</span>
          {pendingCiCount > 0 && (
            <span style={{ position: 'absolute', top: '6px', right: '28%', background: '#d97706', color: '#ffffff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '999px', fontWeight: 700 }}>
              {pendingCiCount}
            </span>
          )}
        </button>
      </nav>

      {/* FOOTER */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '1.5rem 2rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
        &copy; 2026 FrostTech Cooling Solutions Co. Field Technician Operations
      </footer>
    </div>
  );
}