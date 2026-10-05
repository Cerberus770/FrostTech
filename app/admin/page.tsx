'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';
import { useConfirmModal } from '@/components/ConfirmModal';

interface InventoryItem {
  id: string; sku: string; brand: string; model: string; category: string; stock: number; price: number; image?: string | null;
}
interface Product {
  id: string; slug: string; name: string; brand: string; category: string; price: number; originalPrice?: number | null; rating: number; sold: number; image: string; badge?: string;
}
interface Order {
  id: string; orderNo: string; userId: string; name: string; location: string; item: string; payment: string; status: string; date: string;
}
interface Installment {
  id: string; appId: string; userId?: string; name: string; item: string; date: string; status: string; issue: string; term: number; employer: string; income: string; idType: string; location?: string;
}
interface DispatchItem {
  id: string; dispatchNo: string; type: string; customerId: string; name: string; location: string; item: string; notes: string; status: string;
  technicians?: { id: string; firstName: string; lastName: string }[];
  scheduledDate?: string;
}
interface MaintenanceItem {
  id: string; scheduleNo: string; customerId: string; name: string; phone: string; address: string; item: string; serviceType: string; scheduledDate: string; technicianName: string; status: string; notes: string;
  technicianId?: string;
  customer?: { firstName: string; lastName: string; email: string };
}

export default function AdminDashboard() {
  const { confirm, showAlert, prompt, ModalComponent } = useConfirmModal();
  const [activeTab, setActiveTab] = useState('tab-inventory');
  const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState(false);
  const [adminMobileOpen, setAdminMobileOpen] = useState(false);
  const [activeInstTab, setActiveInstTab] = useState('inst-pending');
  const [activeDispatchTab, setActiveDispatchTab] = useState('all');
  const [dispatchViewMode, setDispatchViewMode] = useState('grid');
  const [dispatchPage, setDispatchPage] = useState(1);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [dispatch, setDispatch] = useState<DispatchItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [technicians, setTechnicians] = useState<{id: string, firstName: string, lastName: string}[]>([]);
  const [assignSelections, setAssignSelections] = useState<{[key: string]: string[]}>({});
  const [dateSelections, setDateSelections] = useState<{[key: string]: string}>({});
  const [timeBlockSelections, setTimeBlockSelections] = useState<{[key: string]: string}>({});
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductImage, setNewProductImage] = useState<string>('');
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [dispatchedInstallments, setDispatchedInstallments] = useState<Set<string>>(new Set());
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [techRequests, setTechRequests] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storefrontProducts, setStorefrontProducts] = useState<Product[]>([]);
  const [selectedStorefrontProduct, setSelectedStorefrontProduct] = useState<Product | null>(null);
  const [adminProductReviews, setAdminProductReviews] = useState<any[]>([]);
  const [storefrontFilter, setStorefrontFilter] = useState('All');
  
  // POS State
  const [posCart, setPosCart] = useState<(InventoryItem & { cartQty: number })[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [showPosCustomerModal, setShowPosCustomerModal] = useState(false);
  const [showPosCashModal, setShowPosCashModal] = useState(false);
  
  const handleAddToPos = (item: InventoryItem) => {
    setPosCart(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        return prev.map(p => p.id === item.id ? { ...p, cartQty: p.cartQty + 1 } : p);
      }
      return [...prev, { ...item, cartQty: 1 }];
    });
  };

  const handleRemoveFromPos = (id: string) => {
    setPosCart(prev => prev.filter(p => p.id !== id));
  };

  const handlePosCheckout = async () => {
    if (posCart.length === 0) return showAlert({ title: 'Empty Cart', message: 'Cart is empty!', type: 'warning' });
    const paymentMethod = (document.getElementById('pos-payment-method') as HTMLSelectElement).value;

    if (paymentMethod === 'cash') {
      setShowPosCashModal(true);
    } else {
      setShowPosCustomerModal(true);
    }
  };

  const handlePosCashSubmit = async () => {
    const customerName = (document.getElementById('pos-cash-name') as HTMLInputElement)?.value;
    if (!customerName) return alert('Please enter the customer name.');

    const isConfirmed = await confirm({
      title: 'Confirm POS Order',
      message: `Process cash transaction for ${customerName}?`
    });
    if (!isConfirmed) return;

    try {
      const itemNames = posCart.map(item => `${item.brand} ${item.model}`).join(', ');
      
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'guest',
          name: customerName,
          location: 'Walk-in / POS',
          item: itemNames,
          payment: 'Cash',
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          status: 'PENDING',
          orderNo: 'ORD-' + Math.floor(1000 + Math.random() * 9000)
        })
      });
      
      showAlert({ title: 'Success', message: 'POS Transaction Completed! Added to Pending Orders.' });
      setPosCart([]);
      setShowPosCashModal(false);
      fetch('/api/orders').then(r => r.json()).then(setOrders).catch(() => {});
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to process POS cash transaction.', type: 'error' });
    }
  };

  const handlePosInstallmentSubmit = async () => {
    const nameEl = document.getElementById('pos-cust-name') as HTMLInputElement;
    const incomeEl = document.getElementById('pos-cust-income') as HTMLInputElement;
    const employerEl = document.getElementById('pos-cust-employer') as HTMLInputElement;
    const idTypeEl = document.getElementById('pos-cust-idtype') as HTMLSelectElement;
    const termEl = document.getElementById('pos-cust-term') as HTMLSelectElement;

    if (!nameEl?.value || !incomeEl?.value || !employerEl?.value) {
      return alert('Please fill in all customer fields for the installment application.');
    }

    try {
      const itemNames = posCart.map(item => `${item.brand} ${item.model}`).join(', ');

      await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'guest',
          appId: 'APP-' + Math.floor(1000 + Math.random() * 9000),
          name: nameEl.value,
          item: itemNames,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          term: parseInt(termEl?.value || '6', 10),
          employer: employerEl.value,
          income: incomeEl.value,
          idType: idTypeEl?.value || 'UMID',
          location: 'Walk-in / POS',
          status: 'PENDING',
          issue: ''
        })
      });

      alert('Installment application submitted successfully to Installment Approvals!');
      setShowPosCustomerModal(false);
      setPosCart([]);
      fetch('/api/installments').then(r => r.json()).then(setInstallments).catch(() => {});
    } catch (err) {
      console.error(err);
      alert('Failed to submit installment application.');
    }
  };

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [kebabOpen, setKebabOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(sessionStorage.getItem('userName') !== null);
  }, []);

  useEffect(() => {
    if (selectedStorefrontProduct) {
      const fetchId = selectedStorefrontProduct.slug || selectedStorefrontProduct.id;
      fetch(`/api/reviews?productId=${fetchId}`)
        .then(r => r.json())
        .then(setAdminProductReviews)
        .catch(() => setAdminProductReviews([]));
    } else {
      setAdminProductReviews([]);
    }
  }, [selectedStorefrontProduct]);

  const getShortNum = (str: string) => {
    if (!str) return '001';
    let hash = 0;
    for(let i=0; i<str.length; i++) hash += str.charCodeAt(i);
    return String((hash % 999) + 1).padStart(3, '0');
  };

  const formatAcId = (name: string, isInstallment: boolean, idStr: string) => {
     const prefix = name ? name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() : 'AC';
     const base = `${prefix}-${getShortNum(idStr)}`;
     return isInstallment ? `INST-${base}` : base;
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    router.push('/login');
  };

  useEffect(() => {
    fetch('/api/inventory').then(r => r.json()).then(setInventory).catch(() => {});
    fetch('/api/orders').then(r => r.json()).then(setOrders).catch(() => {});
    fetch('/api/installments').then(r => r.json()).then(setInstallments).catch(() => {});
    fetch('/api/dispatch').then(r => r.json()).then(setDispatch).catch(() => {});
    fetch('/api/maintenance').then(r => r.json()).then(setMaintenance).catch(() => {});
    fetch('/api/maintenance').then(r => r.json()).then(setMaintenance).catch(() => {});
    fetch('/api/users/technicians').then(r => r.json()).then(setTechnicians).catch(() => {});
    fetch('/api/users/customers').then(r => r.json()).then(setCustomers).catch(() => {});
    fetch('/api/tech-requests').then(r => r.json()).then(setTechRequests).catch(() => {});
    fetch('/api/invoices').then(r => r.json()).then(setInvoices).catch(() => {});
    fetch('/api/products').then(r => r.json()).then(setStorefrontProducts).catch(() => {});
  }, []);

  const handleSendMaintReminder = async (m: MaintenanceItem) => {
    let phoneToUse = m.phone;

    // If phone is missing or invalid, prompt the admin to enter one
    if (!phoneToUse || phoneToUse === 'N/A' || phoneToUse.replace(/[^0-9]/g, '').length < 10) {
      const entered = await prompt({
        title: 'Phone Number Required',
        message: `No valid phone number on file for ${m.name}.\nPlease enter their PH mobile number (e.g. 09171234567):`,
        placeholder: '09171234567'
      });
      if (!entered) return; // cancelled
      phoneToUse = entered.trim();
    }

    const isConfirmed = await confirm({
      title: 'Send SMS Reminder',
      message: `Send SMS reminder to ${m.name} (${phoneToUse})?`
    });
    if (!isConfirmed) return;
    
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SMS_CUSTOMER',
          to: phoneToUse,
          subject: 'Maintenance Reminder',
          message: `Hi ${m.name}, this is FrostTech reminding you of your scheduled ${m.serviceType} on ${m.scheduledDate}. Tech: ${m.technicianName || 'TBA'}. Thank you!`
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'SMS sent successfully!');
      } else {
        alert(data.error || 'Failed to send SMS');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending SMS reminder.');
    }
  };

  const q = searchQuery.toLowerCase();
  
  const filteredInventory = inventory.filter(i => 
    !q || i.sku?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q) || i.model?.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q)
  );
  const acInventory = filteredInventory.filter(i => i.category.includes('AC'));
  const partsInventory = filteredInventory.filter(i => !i.category.includes('AC'));

  const filteredOrders = orders.filter(o => 
    !q || o.name?.toLowerCase().includes(q) || o.orderNo?.toLowerCase().includes(q) || o.item?.toLowerCase().includes(q) || o.location?.toLowerCase().includes(q)
  );

  const filteredInstallments = installments.filter(i => 
    !q || i.name?.toLowerCase().includes(q) || i.appId?.toLowerCase().includes(q) || i.item?.toLowerCase().includes(q) || i.employer?.toLowerCase().includes(q)
  );

  const filteredDispatch = dispatch.filter(d => 
    !q || d.name?.toLowerCase().includes(q) || d.dispatchNo?.toLowerCase().includes(q) || d.item?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q)
  );

  const filteredMaintenance = maintenance.filter(m => 
    !q || m.name?.toLowerCase().includes(q) || m.scheduleNo?.toLowerCase().includes(q) || m.item?.toLowerCase().includes(q) || m.address?.toLowerCase().includes(q) || m.phone?.toLowerCase().includes(q)
  );

  const filteredCustomers = customers.filter(c => 
    !q || c.name?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q)
  );

  const filteredTechRequests = techRequests.filter(tr => 
    !q || tr.reqId?.toLowerCase().includes(q) || tr.technicianName?.toLowerCase().includes(q) || tr.itemNeeded?.toLowerCase().includes(q) || tr.reason?.toLowerCase().includes(q)
  );

  const filteredTechnicians = technicians.filter(t => 
    !q || t.firstName?.toLowerCase().includes(q) || t.lastName?.toLowerCase().includes(q) || (t as any).techRank?.toLowerCase().includes(q)
  );

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', className: 'status-critical' };
    if (stock <= 5) return { label: 'Low Stock', className: 'status-low' };
    return { label: 'In Stock', className: 'status-good' };
  };

  const handleAcceptOrder = async (order: Order) => {
    const isConfirmed = await confirm({
      title: 'Accept Order',
      message: `Are you sure you want to accept order ${order.orderNo}?`
    });
    if (!isConfirmed) return;
    
    try {
      // 1. Update order status
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'ACCEPTED' })
      });
      // 2. Create dispatch item
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatchNo: 'DIS-' + Math.floor(1000 + Math.random() * 9000),
          type: 'New Installation',
          customerId: order.userId,
          name: order.name,
          location: order.location,
          item: order.item,
          status: 'PENDING'
        })
      });

      // 3. Auto-register the AC for the customer's dashboard
      if (order.userId && order.userId !== 'guest') {
        const coordsMatch = order.location?.match(/\| COORDS:([\d.-]+),([\d.-]+)/);
        const lat = coordsMatch ? parseFloat(coordsMatch[1]) : null;
        const lng = coordsMatch ? parseFloat(coordsMatch[2]) : null;
        const addrOnly = order.location ? order.location.split('| COORDS:')[0].trim() : 'Default Address';

        await fetch('/api/registered-acs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: order.userId,
            location: 'Default Address',
            brandModel: order.item,
            acType: 'Unknown Type',
            horsepower: 'Unknown HP',
            paymentType: order.payment === 'Installment' ? 'Installment' : 'Cash',
            months: null,
            lat,
            lng,
            fullAddress: addrOnly,
            purchasedFromStore: true
          })
        });
      }

      // 4. Update local state
      setOrders(orders.filter(o => o.id !== order.id));
      fetch('/api/dispatch').then(r => r.json()).then(setDispatch).catch(() => {});
      if (selectedOrder?.id === order.id) setSelectedOrder(null);
      showAlert({ title: 'Order Accepted', message: 'Order accepted, sent to dispatch, and AC registered!' });
    } catch (err) {
      console.error('Failed to accept order', err);
      showAlert({ title: 'Error', message: 'Failed to accept order.', type: 'error' });
    }
  };

  const handleRestock = async (item: InventoryItem) => {
    const qtyStr = await prompt({
      title: 'Add Stock',
      message: `How many ${item.brand} ${item.model} are you adding to stock?`,
      placeholder: 'Enter quantity'
    });
    if (!qtyStr) return;
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) return alert('Invalid quantity.');

    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, stock: item.stock + qty })
      });
      if (res.ok) {
        setInventory(inventory.map(i => i.id === item.id ? { ...i, stock: i.stock + qty } : i));
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update inventory.');
    }
  };

  const handleAssignTech = async (item: DispatchItem) => {
    const techIds = assignSelections[item.id] || [];
    const date = dateSelections[item.id];
    const timeBlock = timeBlockSelections[item.id] || 'Morning (8AM - 12PM)';
    if (techIds.length === 0) return showAlert({ title: 'Validation Error', message: 'Please select at least one technician.', type: 'warning' });
    if (!date) return showAlert({ title: 'Validation Error', message: 'Please select a date.', type: 'warning' });

    const finalDate = `${date} ${timeBlock}`;

    // Conflict Check
    const hasConflict = dispatch.some(d => 
      d.scheduledDate === finalDate && 
      d.technicians?.some(t => techIds.includes(t.id))
    ) || maintenance.some(m => 
      m.scheduledDate === finalDate && 
      m.technicianId && techIds.includes(m.technicianId)
    );

    if (hasConflict) {
      const proceed = await confirm({
        title: 'Schedule Conflict',
        message: 'Warning: One or more selected technicians are already scheduled for this specific date and time block.\n\nDo you want to proceed with this assignment anyway?',
        type: 'warning',
        confirmText: 'Proceed'
      });
      if (!proceed) return;
    } else {
      const isConfirmed = await confirm({
        title: 'Assign Technician',
        message: `Assign selected technicians to ${item.dispatchNo} on ${finalDate}?`
      });
      if (!isConfirmed) return;
    }
    
    try {
      const res = await fetch('/api/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, technicianIds: techIds, scheduledDate: finalDate, status: 'ASSIGNED' })
      });
      if (res.ok) {
        // Look up customer email for notification
        let customerEmail = item.name.replace(/\s+/g, '').toLowerCase() + '@gmail.com';
        try {
          const custRes = await fetch(`/api/users/customers?id=${item.customerId}`);
          if (custRes.ok) { const custs = await custRes.json(); if (custs.length > 0 && custs[0].email) customerEmail = custs[0].email; }
        } catch (_) {}
        // Trigger customer email notification
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'EMAIL_CUSTOMER',
            to: customerEmail,
            subject: 'Your FrostTech Service is Scheduled',
            message: `Hello ${item.name},\nYour service for ${item.type} has been assigned to our technician(s). They will arrive on ${finalDate}.\nThank you for choosing FrostTech!`
          })
        }).catch(console.error);

        // Trigger technician work assignment notification
        techIds.forEach(id => {
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'NOTIFY_TECH',
              to: id,
              subject: 'New Job Assigned',
              message: `You have been assigned a new job: ${item.type} at ${item.location} on ${finalDate}.`
            })
          }).catch(console.error);
        });

        // Refetch to get updated relations (technician name)
        fetch('/api/dispatch').then(r => r.json()).then(setDispatch).catch(() => {});
        showAlert({ title: 'Assigned', message: 'Technicians assigned successfully!' });
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to assign technician.', type: 'error' });
    }
  };

  const handleAssignMaintenanceTech = async (m: MaintenanceItem) => {
    const techIds = assignSelections[m.id] || [];
    const newDate = dateSelections[m.id];
    const timeBlock = timeBlockSelections[m.id] || 'Morning (8AM - 12PM)';
    
    if (techIds.length === 0) return alert('Please select a technician.');
    if (!newDate && !m.scheduledDate) return alert('Please select a date.');
    
    const finalDate = newDate ? `${newDate} ${timeBlock}` : m.scheduledDate;
    const techId = techIds[0];

    if (newDate) {
      // Conflict Check
      const hasConflict = dispatch.some(d => 
        d.scheduledDate === finalDate && 
        d.technicians?.some(t => t.id === techId)
      ) || maintenance.some(existingM => 
        existingM.id !== m.id &&
        existingM.scheduledDate === finalDate && 
        existingM.technicianId === techId
      );

      if (hasConflict) {
        const proceed = await confirm({
          title: 'Scheduling Conflict',
          message: 'Warning: The selected technician is already scheduled for this specific date and time block.\n\nDo you want to proceed with this assignment anyway?',
          type: 'warning'
        });
        if (!proceed) return;
      }
    }
    
    
    const tech = technicians.find(t => t.id === techId);
    
    try {
      const res = await fetch('/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: m.id, 
          technicianId: techId, 
          technicianName: tech ? `${tech.firstName} ${tech.lastName}` : '',
          ...(newDate ? { scheduledDate: finalDate } : {})
        })
      });
      if (res.ok) {
        // Look up customer email for maintenance notification
        let maintEmail = m.name.replace(/\s+/g, '').toLowerCase() + '@gmail.com';
        if (m.customer?.email) { maintEmail = m.customer.email; }
        else {
          try {
            const custRes = await fetch(`/api/users/customers?id=${m.customerId}`);
            if (custRes.ok) { const custs = await custRes.json(); if (custs.length > 0 && custs[0].email) maintEmail = custs[0].email; }
          } catch (_) {}
        }
        // Trigger customer email notification
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'EMAIL_CUSTOMER',
            to: maintEmail,
            subject: 'Your FrostTech Maintenance is Scheduled',
            message: `Hello ${m.name},\nYour scheduled maintenance for ${m.serviceType} has been assigned to our technician. They will arrive on ${finalDate}.\nThank you for choosing FrostTech!`
          })
        }).catch(console.error);

        // Trigger technician work assignment notification
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NOTIFY_TECH',
            to: techId,
            subject: 'New Maintenance Job Assigned',
            message: `You have been assigned a new maintenance job: ${m.serviceType} at ${m.address || 'Customer Location'} on ${finalDate}.`
          })
        }).catch(console.error);

        fetch('/api/maintenance').then(r => r.json()).then(setMaintenance).catch(() => {});
        alert('Technician assigned successfully!');
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to assign technician.');
    }
  };

  const handleUpdateTechRequestStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/tech-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setTechRequests(techRequests.map(req => req.id === id ? { ...req, status: newStatus } : req));
      } else {
        alert('Failed to update request');
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleDispatchInstallment = async (inst: Installment) => {
    const isConfirmed = await confirm({
      title: 'Dispatch Installment',
      message: `Send ${inst.appId} to dispatch and register the AC unit?`
    });
    if (!isConfirmed) return;

    try {
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatchNo: 'DIS-' + Math.floor(1000 + Math.random() * 9000),
          type: 'New Installation (Installment)',
          customerId: inst.userId,
          name: inst.name,
          location: inst.location || 'Pending Address',
          item: inst.item,
          status: 'PENDING'
        })
      });

      // Auto-register the AC for the customer's dashboard
      if (inst.userId && inst.userId !== 'guest') {
        const coordsMatch = inst.location?.match(/\| COORDS:([\d.-]+),([\d.-]+)/);
        const lat = coordsMatch ? parseFloat(coordsMatch[1]) : null;
        const lng = coordsMatch ? parseFloat(coordsMatch[2]) : null;
        const addrOnly = inst.location ? inst.location.split('| COORDS:')[0].trim() : 'Default Address';

        await fetch('/api/registered-acs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: inst.userId,
            location: 'Default Address',
            brandModel: inst.item,
            acType: 'Unknown Type',
            horsepower: 'Unknown HP',
            paymentType: 'Installment',
            months: inst.term,
            lat,
            lng,
            fullAddress: addrOnly,
            purchasedFromStore: true
          })
        });
      }

      fetch('/api/dispatch').then(r => r.json()).then(setDispatch).catch(() => {});
      setDispatchedInstallments(prev => new Set(prev).add(inst.id));
      showAlert({ title: 'Success', message: `Installment for ${inst.name} has been sent to Dispatch and AC registered to their profile!` });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to send to dispatch.', type: 'error' });
    }
  };

  const handleSetDiscount = async (product: Product) => {
    const newPriceStr = await prompt({
      title: 'Set Discount Price',
      message: `Enter new discounted price for ${product.name} (Current: ₱${product.price}):`,
      placeholder: 'Enter new price'
    });
    if (!newPriceStr) return;
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0 || newPrice >= product.price) {
      return alert('Invalid discount price. Must be a number less than the current price.');
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: newPrice,
          originalPrice: product.originalPrice ? product.originalPrice : product.price // Preserve highest original price
        })
      });
      if (res.ok) {
        fetch('/api/products').then(r => r.json()).then(setStorefrontProducts).catch(() => {});
        alert('Discount applied successfully!');
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      alert('Failed to apply discount.');
    }
  };

  const handleRemoveDiscount = async (product: Product) => {
    if (!product.originalPrice) return;
    const isConfirmed = await confirm({
      title: 'Remove Discount',
      message: `Remove discount for ${product.name}? Price will revert to ₱${product.originalPrice}.`,
      type: 'warning'
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: product.originalPrice,
          originalPrice: null
        })
      });
      if (res.ok) {
        fetch('/api/products').then(r => r.json()).then(setStorefrontProducts).catch(() => {});
        alert('Discount removed successfully!');
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      alert('Failed to remove discount.');
    }
  };

  const handleInstallmentAction = async (inst: Installment, newStatus: string, issue: string = '') => {
    try {
      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inst.id, status: newStatus, issue })
      });
      if (res.ok) {
        setSelectedInstallment(null);
        fetch('/api/installments').then(r => r.json()).then(setInstallments).catch(() => {});
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update installment status.');
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const baseSku = formData.get('sku') as string;
    const condition = formData.get('condition') as string || 'Brand New';
    
    const isConfirmed = await confirm({
      title: 'Add Product',
      message: `Are you sure you want to add ${formData.get('brand')} ${formData.get('model')} to inventory?`
    });
    if (!isConfirmed) return;

    // Auto-append condition suffix to SKU to avoid duplicates
    const condSuffix = condition === 'Brand New' ? '-NEW' : condition === 'Second Hand' ? '-2ND' : '-OH';
    const sku = baseSku.includes(condSuffix) ? baseSku : baseSku + condSuffix;
    
    const newItem = {
      sku,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      category: formData.get('category') as string,
      stock: parseInt(formData.get('stock') as string, 10),
      price: parseFloat(formData.get('price') as string),
      image: newProductImage || 'https://via.placeholder.com/150',
      condition,
      publishToStorefront: formData.get('publishToStorefront') === 'on'
    };

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        setIsAddProductModalOpen(false);
        setNewProductImage('');
        fetch('/api/inventory').then(r => r.json()).then(setInventory).catch(() => {});
        if (newItem.publishToStorefront) {
          fetch('/api/products').then(r => r.json()).then(setStorefrontProducts).catch(() => {});
        }
        showAlert({ title: 'Success', message: 'Product added successfully!' });
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to add product');
      }
    } catch (err: any) {
      console.error(err);
      showAlert({ title: 'Error', message: err.message || 'Failed to add product.', type: 'error' });
    }
  };

  return (
    <>


    {/*  Header  */}
    <header className="admin-header">
        <a href="landingpage.html" className="logo">
            <img src="LOGO.jpg" alt="FrostTech Logo" style={{"height":"35px","verticalAlign":"middle","borderRadius":"4px","marginRight":"8px"}} /> <span style={{"fontWeight":"700","fontSize":"1.2rem","verticalAlign":"middle","color":"white","letterSpacing":"-0.5px"}}>FrostTech</span>
        </a>

        <div className="search-bar">
            <input 
                type="text" 
                id="admin-search" 
                placeholder="Search by name, customer ID, or item..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>

        <div className="header-icons">
            <div className="kebab-menu">
                <button className="kebab-btn" onClick={() => setKebabOpen(!kebabOpen)}><i className="fa-solid fa-bars"></i></button>
                <div className={`kebab-dropdown ${kebabOpen ? 'active' : ''}`} id="kebab-dropdown">
                    <a href="/admin"><i className="fa-solid fa-shield-halved"></i> Admin Console</a>
                    <div className="divider"></div>
                    {isLoggedIn ? (
                      <a href="#" id="logout-link" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Log Out</a>
                    ) : (
                      <a href="/login"><i className="fa-solid fa-right-to-bracket"></i> Log In</a>
                    )}
                </div>
            </div>
        </div>
    </header>

    <div className="admin-layout">
        <ModalComponent />

        {/* Mobile Backdrop */}
        <div className={`admin-backdrop ${adminMobileOpen ? 'show' : ''}`} onClick={() => setAdminMobileOpen(false)}></div>

        {/* Mobile Toggle */}
        <div className="mobile-only" style={{ position: 'fixed', top: '80px', left: '10px', zIndex: 40, width: '40px', height: '40px' }}>
          <button onClick={() => setAdminMobileOpen(!adminMobileOpen)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', cursor: 'pointer', fontSize: '1.2rem' }}>
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        {/*  Sidebar  */}
        <aside className={`admin-sidebar ${isAdminSidebarCollapsed ? 'collapsed' : ''} ${adminMobileOpen ? 'mobile-active' : ''}`}>
            <div className="sidebar-header">
              <h3>Admin Panel</h3>
              <button className="sidebar-toggle-btn" onClick={() => setIsAdminSidebarCollapsed(!isAdminSidebarCollapsed)}>
                <i className={`fa-solid ${isAdminSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
              </button>
            </div>

            <div className="admin-profile">
              <div className="admin-avatar">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div className="admin-meta">
                <h3>Admin Portal</h3>
                <p>Owner Access</p>
              </div>
            </div>

            <ul className="admin-nav">
                <li><a href="#" data-tooltip="Inventory" className={`tab-btn ${activeTab === 'tab-inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-inventory'); setAdminMobileOpen(false); }}><i className="fa-solid fa-boxes-stacked"></i> <span className="nav-label">Inventory</span></a></li>
                <li><a href="#" data-tooltip="Point of Sale" className={`tab-btn ${activeTab === 'tab-pos' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-pos'); setAdminMobileOpen(false); }}><i className="fa-solid fa-cash-register"></i> <span className="nav-label">Point of Sale</span></a></li>
                <li><a href="#" data-tooltip="Pending Orders" className={`tab-btn ${activeTab === 'tab-installations' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-installations'); setAdminMobileOpen(false); }}><i className="fa-solid fa-clipboard-check"></i> <span className="nav-label">Pending Orders</span></a></li>
                <li><a href="#" data-tooltip="Installment Approvals" className={`tab-btn ${activeTab === 'tab-installments' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-installments'); setAdminMobileOpen(false); }}><i className="fa-solid fa-file-invoice-dollar"></i> <span className="nav-label">Installment Approvals</span></a></li>
                <li><a href="#" data-tooltip="Dispatch & Schedule" className={`tab-btn ${activeTab === 'tab-dispatch' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-dispatch'); setAdminMobileOpen(false); }}><i className="fa-solid fa-truck-fast"></i> <span className="nav-label">Dispatch & Schedule</span></a></li>
                <li><a href="#" data-tooltip="Tech Requests" className={`tab-btn ${activeTab === 'tab-tech-requests' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-tech-requests'); setAdminMobileOpen(false); }}><i className="fa-solid fa-toolbox"></i> <span className="nav-label">Tech Requests</span></a></li>
                <li><a href="#" data-tooltip="Invoices" className={`tab-btn ${activeTab === 'tab-invoices' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-invoices'); setAdminMobileOpen(false); }}><i className="fa-solid fa-file-invoice"></i> <span className="nav-label">Invoices</span></a></li>
                <li><a href="#" data-tooltip="Maintenance" className={`tab-btn ${activeTab === 'tab-maintenance' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-maintenance'); setAdminMobileOpen(false); }}><i className="fa-solid fa-calendar-check"></i> <span className="nav-label">Maintenance Schedule</span></a></li>
                <li><a href="#" data-tooltip="Master Calendar" className={`tab-btn ${activeTab === 'tab-calendar' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-calendar'); setAdminMobileOpen(false); }}><i className="fa-regular fa-calendar-days"></i> <span className="nav-label">Master Calendar</span></a></li>
                <li><a href="#" data-tooltip="Customers" className={`tab-btn ${activeTab === 'tab-customers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-customers'); setAdminMobileOpen(false); }}><i className="fa-solid fa-users"></i> <span className="nav-label">Customer Directory</span></a></li>
                <li><a href="#" data-tooltip="Storefront" className={`tab-btn ${activeTab === 'tab-storefront' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-storefront'); setAdminMobileOpen(false); }}><i className="fa-solid fa-store"></i> <span className="nav-label">Storefront Products</span></a></li>
                <li><a href="#" data-tooltip="Technicians" className={`tab-btn ${activeTab === 'tab-technicians' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-technicians'); setAdminMobileOpen(false); }}><i className="fa-solid fa-user-gear"></i> <span className="nav-label">Technicians</span></a></li>
            </ul>
        </aside>

        {/*  Main Content  */}
        <main className={`admin-content ${isAdminSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/*  Storefront Products  */}
            <div id="tab-storefront" className={`tab-panel ${activeTab === 'tab-storefront' ? 'active' : ''}`}>
                <div className="panel-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                    <div>
                        <h2>Storefront Products</h2>
                        <p>Manage customer-facing products, pricing, discounts, and spare parts.</p>
                    </div>
                </div>

                {/* Category Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {['All', 'AC Units', 'Spare Parts'].map(filter => (
                        <button
                            key={filter}
                            className={`btn ${storefrontFilter === filter ? '' : 'btn-secondary'}`}
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', ...(storefrontFilter === filter ? { background: 'var(--primary)' } : {}) }}
                            onClick={() => setStorefrontFilter(filter)}
                        >
                            <i className={`fa-solid ${filter === 'All' ? 'fa-border-all' : filter === 'AC Units' ? 'fa-snowflake' : 'fa-wrench'}`} style={{ marginRight: '4px' }}></i>
                            {filter} ({
                                filter === 'All' ? storefrontProducts.length :
                                filter === 'AC Units' ? storefrontProducts.filter(p => p.category.includes('AC') || p.category.includes('Floor')).length :
                                storefrontProducts.filter(p => p.category === 'Spare Parts' || p.category === 'Parts' || p.category === 'Parts & Accessories' || p.category === 'Tools').length
                            })
                        </button>
                    ))}
                </div>

                <div className="admin-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Product Name</th>
                                <th>Brand</th>
                                <th>Category</th>
                                <th>Current Price</th>
                                <th>Original Price</th>
                                <th>Discount</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {storefrontProducts
                              .filter(p => {
                                if (storefrontFilter === 'All') return true;
                                if (storefrontFilter === 'AC Units') return p.category.includes('AC') || p.category.includes('Floor');
                                return p.category === 'Spare Parts' || p.category === 'Parts' || p.category === 'Parts & Accessories' || p.category === 'Tools';
                              })
                              .map(product => {
                                const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                                const discountPct = hasDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;
                                return (
                                    <tr 
                                      key={product.id} 
                                      onClick={() => setSelectedStorefrontProduct(product)}
                                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td><img src={product.image} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '4px' }} /></td>
                                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                                        <td>{product.brand}</td>
                                        <td>{product.category}</td>
                                        <td style={{ color: hasDiscount ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 'bold' }}>
                                            ₱{product.price.toLocaleString()}
                                        </td>
                                        <td style={{ color: 'var(--text-light)', textDecoration: hasDiscount ? 'line-through' : 'none' }}>
                                            {product.originalPrice ? `₱${product.originalPrice.toLocaleString()}` : '—'}
                                        </td>
                                        <td>
                                            {hasDiscount ? (
                                                <span className="status-badge status-low" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                                    -{discountPct}%
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-light)' }}>None</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-light)' }}></i>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {storefrontProducts.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No storefront products found.</p>}
                </div>
            </div>

            {/* Storefront Product Modal */}
            {selectedStorefrontProduct && (
                <div className="modal-overlay show" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedStorefrontProduct(null)}>
                    <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.3rem' }}>Product Details</h2>
                            <button onClick={() => setSelectedStorefrontProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1.2rem' }}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <img src={selectedStorefrontProduct.image} alt={selectedStorefrontProduct.name} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px', background: 'var(--bg-main)', padding: '0.5rem' }} />
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{selectedStorefrontProduct.name}</h3>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{selectedStorefrontProduct.brand} • {selectedStorefrontProduct.category}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#f59e0b', letterSpacing: '1px' }}>
                                      {'★'.repeat(Math.floor(selectedStorefrontProduct.rating))}{'☆'.repeat(5 - Math.floor(selectedStorefrontProduct.rating))}
                                    </span>
                                    <span>{selectedStorefrontProduct.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Current Price:</span>
                                <span style={{ fontWeight: 'bold', color: (selectedStorefrontProduct.originalPrice && selectedStorefrontProduct.originalPrice > selectedStorefrontProduct.price) ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                    ₱{selectedStorefrontProduct.price.toLocaleString()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Original Price:</span>
                                <span style={{ color: 'var(--text-light)', textDecoration: (selectedStorefrontProduct.originalPrice && selectedStorefrontProduct.originalPrice > selectedStorefrontProduct.price) ? 'line-through' : 'none' }}>
                                    {selectedStorefrontProduct.originalPrice ? `₱${selectedStorefrontProduct.originalPrice.toLocaleString()}` : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Customer Feedback List */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-light)' }}>
                                <i className="fa-solid fa-comments" style={{ marginRight: '6px' }}></i>
                                Customer Feedback
                            </h4>
                            {adminProductReviews.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No reviews yet for this product.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {adminProductReviews.map((review: any) => (
                                        <div key={review.id} style={{
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                                            borderRadius: '6px', padding: '0.8rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{review.userName}</span>
                                                <span style={{ color: '#f59e0b', fontSize: '0.8rem', letterSpacing: '1px' }}>
                                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', margin: 0, lineHeight: 1.4 }}>
                                                {review.comment}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            {selectedStorefrontProduct.originalPrice && selectedStorefrontProduct.originalPrice > selectedStorefrontProduct.price && (
                                <button className="btn btn-secondary" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => {
                                    handleRemoveDiscount(selectedStorefrontProduct);
                                    setSelectedStorefrontProduct(null);
                                }}>
                                    <i className="fa-solid fa-xmark"></i> Remove Discount
                                </button>
                            )}
                            <button className="btn" style={{ background: 'var(--primary)' }} onClick={() => {
                                handleSetDiscount(selectedStorefrontProduct);
                                setSelectedStorefrontProduct(null);
                            }}>
                                <i className="fa-solid fa-tag"></i> Set Discount
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*  Point of Sale (POS)  */}
            <div id="tab-pos" className={`tab-panel ${activeTab === 'tab-pos' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Point of Sale</h2>
                    <p>Process walk-in orders and manual transactions.</p>
                </div>
                
                <div className="pos-layout">
                    {/*  Product Catalog  */}
                    <div className="pos-catalog">
                        <div className="search-bar" style={{"width":"100%","marginBottom":"1.5rem","maxWidth":"none"}}>
                            <input type="text" value={posSearch} onChange={(e) => setPosSearch(e.target.value)} id="pos-search" placeholder="Search products for POS..." style={{"width":"100%","padding":"0.8rem","borderRadius":"8px","border":"1px solid var(--border-color)"}} />
                        </div>
                        
                        <div style={{"marginTop":"1rem"}}>
                            <h3 style={{"marginBottom":"1rem","color":"var(--text-dark)","fontSize":"1.1rem"}}>Air Conditioning Units</h3>
                            <div className="pos-product-grid" id="pos-grid-ac">
                                {acInventory.filter(i => i.model.toLowerCase().includes(posSearch.toLowerCase()) || i.brand.toLowerCase().includes(posSearch.toLowerCase())).map(item => (
                                    <div key={item.id} className="pos-item-card" onClick={() => handleAddToPos(item)}>
                                        {item.model.toLowerCase().includes('window') ? (
                                            <div style={{ marginBottom: '0.5rem', width: '100%', height: '80px', display: 'flex', justifyContent: 'center' }}>
                                                <img src="/Window.jpg" alt="Window AC" style={{ height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        ) : item.model.toLowerCase().includes('inverter') || item.model.toLowerCase().includes('split') ? (
                                            <div style={{ marginBottom: '0.5rem', width: '100%', height: '80px', display: 'flex', justifyContent: 'center' }}>
                                                <img src="/Inverter.jpg" alt="Inverter AC" style={{ height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        ) : (
                                            <div style={{"fontSize":"2rem","marginBottom":"0.5rem","color":"var(--primary)"}}><i className="fa-solid fa-fan"></i></div>
                                        )}
                                        <h5 style={{"fontSize":"0.9rem","marginBottom":"0.2rem"}}>{item.brand} {item.model}</h5>
                                        <p style={{"color":"var(--accent-green)","fontWeight":"bold"}}>₱{item.price.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <h3 style={{"margin":"2rem 0 1rem","color":"var(--text-dark)","fontSize":"1.1rem"}}>Parts, Accessories & Tools</h3>
                            <div className="pos-product-grid" id="pos-grid-parts">
                                {partsInventory.filter(i => i.model.toLowerCase().includes(posSearch.toLowerCase()) || i.brand.toLowerCase().includes(posSearch.toLowerCase())).map(item => (
                                    <div key={item.id} className="pos-item-card" onClick={() => handleAddToPos(item)}>
                                        <div style={{"fontSize":"2rem","marginBottom":"0.5rem","color":"#e67e22"}}><i className="fa-solid fa-toolbox"></i></div>
                                        <h5 style={{"fontSize":"0.9rem","marginBottom":"0.2rem"}}>{item.model}</h5>
                                        <p style={{"color":"var(--accent-green)","fontWeight":"bold"}}>₱{item.price.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/*  Cart / Receipt Panel  */}
                    <div className="pos-cart-panel admin-card" style={{"marginBottom":"0"}}>
                        <h3 style={{"marginBottom":"1rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"1rem"}}>Current Order</h3>
                        
                        <div className="pos-cart-items" id="pos-cart-items">
                            {posCart.length === 0 ? (
                                <div className="empty-cart-msg" style={{"textAlign":"center","color":"var(--text-light)","padding":"2rem 0"}}>
                                    <i className="fa-solid fa-cart-shopping" style={{"fontSize":"2rem","marginBottom":"1rem","opacity":"0.5"}}></i><br />
                                    No items in order.
                                </div>
                            ) : (
                                posCart.map(item => (
                                    <div key={item.id} style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"0.8rem","marginBottom":"0.8rem","borderBottom":"1px solid #f1f5f9"}}>
                                        <div>
                                            <h5 style={{"fontSize":"0.9rem","margin":"0 0 0.2rem 0"}}>{item.brand} {item.model}</h5>
                                            <span style={{"fontSize":"0.8rem","color":"var(--text-light)"}}>₱{item.price.toLocaleString()} x {item.cartQty}</span>
                                        </div>
                                        <div style={{"display":"flex","alignItems":"center","gap":"1rem"}}>
                                            <span style={{"fontWeight":"bold","fontSize":"0.95rem"}}>₱{(item.price * item.cartQty).toLocaleString()}</span>
                                            <button onClick={() => handleRemoveFromPos(item.id)} style={{"background":"none","border":"none","color":"var(--accent-red)","cursor":"pointer"}}><i className="fa-solid fa-trash"></i></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="pos-totals" style={{"marginTop":"1.5rem","borderTop":"1px solid var(--border-color)","paddingTop":"1.5rem"}}>
                            <div style={{"display":"flex","justifyContent":"space-between","marginBottom":"0.5rem","color":"var(--text-light)"}}>
                                <span>Subtotal</span>
                                <span id="pos-subtotal">₱{posCart.reduce((sum, item) => sum + (item.price * item.cartQty), 0).toLocaleString()}</span>
                            </div>
                            <div style={{"display":"flex","justifyContent":"space-between","marginBottom":"1rem","color":"var(--text-light)"}}>
                                <span>VAT (12%)</span>
                                <span id="pos-tax">₱{(posCart.reduce((sum, item) => sum + (item.price * item.cartQty), 0) * 0.12).toLocaleString()}</span>
                            </div>
                            <div style={{"display":"flex","justifyContent":"space-between","marginBottom":"1.5rem","fontSize":"1.2rem","fontWeight":"700","color":"var(--text-dark)"}}>
                                <span>Total</span>
                                <span id="pos-total" style={{"color":"var(--primary)"}}>₱{(posCart.reduce((sum, item) => sum + (item.price * item.cartQty), 0) * 1.12).toLocaleString()}</span>
                            </div>
                            
                            <div style={{"marginBottom":"1.5rem"}}>
                                <label style={{"display":"block","marginBottom":"0.5rem","fontSize":"0.9rem","fontWeight":"600"}}>Payment Method</label>
                                <select id="pos-payment-method" style={{"width":"100%","padding":"0.8rem","border":"1px solid var(--border-color)","borderRadius":"6px"}}>
                                    <option value="cash">Cash (Full Payment)</option>
                                    <option value="installment">Installment (Requires Approval)</option>
                                </select>
                            </div>
                            
                            <button className="btn" style={{"width":"100%","padding":"1rem","background":"var(--primary)","fontSize":"1.1rem"}} onClick={handlePosCheckout}>
                                <i className="fa-solid fa-check-to-slot"></i> Process Payment &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/*  Installment Approvals  */}
            <div id="tab-installments" className={`tab-panel ${activeTab === 'tab-installments' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Installment Applications</h2>
                    <p>Manage customer requirements and approvals for installment plans.</p>
                </div>
                
                {/*  Sub-tabs for organization  */}
                <div className="installment-tabs" style={{"marginBottom":"1.5rem","display":"flex","gap":"1rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"1rem"}}>
                    <button className={`btn inst-tab-btn ${activeInstTab === 'inst-pending' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveInstTab('inst-pending'); }} style={activeInstTab === 'inst-pending' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-regular fa-clock"></i> Pending Approvals</button>
                    <button className={`btn btn-secondary inst-tab-btn ${activeInstTab === 'inst-repending' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveInstTab('inst-repending'); }} style={activeInstTab === 'inst-repending' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-xmark" style={{"color": activeInstTab === 'inst-repending' ? 'white' : 'var(--accent-red)'}}></i> Declined</button>
                    <button className={`btn btn-secondary inst-tab-btn ${activeInstTab === 'inst-completed' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveInstTab('inst-completed'); }} style={activeInstTab === 'inst-completed' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-regular fa-circle-check" style={{"color": activeInstTab === 'inst-completed' ? 'white' : '#28a745'}}></i> Approved</button>
                </div>

                <div className="installment-views">
                    
                    {/*  Pending View  */}
                    <div id="inst-pending" className="inst-view" style={{"display": activeInstTab === 'inst-pending' ? "block" : "none","background":"var(--bg-main)","padding":"1.5rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h3 style={{"marginBottom":"1.5rem","color":"var(--text-dark)"}}>Waiting for Requirements</h3>
                        <div id="inst-pending-container" className="sub-container" style={{"overflowY":"auto","maxHeight":"500px","paddingRight":"10px","display":"grid","gridTemplateColumns":"repeat(auto-fill, minmax(300px, 1fr))","gap":"1.5rem"}}>
                            {filteredInstallments.filter(i => i.status === 'PENDING').map(inst => (
                                <div key={inst.id} className="admin-card">
                                    <h4 style={{marginBottom: '10px'}}>{inst.appId} - {inst.name}</h4>
                                    <p><strong>Item:</strong> {inst.item}</p>
                                    <p><strong>Term:</strong> {inst.term} Months</p>
                                    <button className="btn" style={{marginTop: '10px'}} onClick={() => setSelectedInstallment(inst)}>Review</button>
                                </div>
                            ))}
                            {filteredInstallments.filter(i => i.status === 'PENDING').length === 0 && <p>No pending applications.</p>}
                        </div>
                    </div>

                    {/*  Declined View  */}
                    <div id="inst-repending" className="inst-view" style={{"display": activeInstTab === 'inst-repending' ? "block" : "none","background":"var(--bg-main)","padding":"1.5rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h3 style={{"marginBottom":"1.5rem","color":"var(--text-dark)"}}>Declined Applications</h3>
                        <div id="inst-repending-container" className="sub-container" style={{"overflowY":"auto","maxHeight":"500px","paddingRight":"10px","display":"grid","gridTemplateColumns":"repeat(auto-fill, minmax(300px, 1fr))","gap":"1.5rem"}}>
                            {filteredInstallments.filter(i => i.status === 'REJECTED').map(inst => (
                                <div key={inst.id} className="admin-card">
                                    <h4 style={{marginBottom: '10px'}}>{inst.appId} - {inst.name}</h4>
                                    <p><strong>Reason:</strong> {inst.issue}</p>
                                    <button className="btn" style={{marginTop: '10px'}} onClick={() => setSelectedInstallment(inst)}>Review</button>
                                </div>
                            ))}
                            {filteredInstallments.filter(i => i.status === 'REJECTED').length === 0 && <p>No declined applications.</p>}
                        </div>
                    </div>

                    {/*  Completed View  */}
                    <div id="inst-completed" className="inst-view" style={{"display": activeInstTab === 'inst-completed' ? "block" : "none","background":"var(--bg-main)","padding":"1.5rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h3 style={{"marginBottom":"1.5rem","color":"var(--text-dark)"}}>Requirements Fully Verified</h3>
                        <div id="inst-completed-container" className="sub-container" style={{"overflowY":"auto","maxHeight":"500px","paddingRight":"10px","display":"grid","gridTemplateColumns":"repeat(auto-fill, minmax(300px, 1fr))","gap":"1.5rem"}}>
                            {filteredInstallments.filter(i => i.status === 'COMPLETED').map(inst => (
                                <div key={inst.id} className="admin-card">
                                    <h4 style={{marginBottom: '10px', color: 'var(--primary)'}}>{inst.appId} - {inst.name}</h4>
                                    <p style={{marginBottom: '5px'}}><strong>Item:</strong> {inst.item}</p>
                                    <p style={{marginBottom: '15px'}}><strong>Status:</strong> <span className="status-badge status-good">Approved</span></p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {!dispatchedInstallments.has(inst.id) && (
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{padding: '0.6rem 1rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px'}} 
                                          onClick={() => handleDispatchInstallment(inst)}
                                        >
                                          <i className="fa-solid fa-truck-fast"></i> Send to Dispatch
                                        </button>
                                      )}
                                    </div>
                                </div>
                            ))}
                            {filteredInstallments.filter(i => i.status === 'COMPLETED').length === 0 && <p>No completed applications.</p>}
                        </div>
                    </div>

                </div>
            </div>

            {/*  1. Inventory Management  */}
            <div id="tab-inventory" className={`tab-panel ${activeTab === 'tab-inventory' ? 'active' : ''}`}>
                <div className="panel-header" style={{"display":"flex","justifyContent":"space-between","alignItems":"flex-end"}}>
                    <div>
                        <h2>Inventory Management</h2>
                        <p>Monitor current stock levels for all Air Conditioning units.</p>
                    </div>
                    <button className="btn" style={{"background":"var(--primary)"}} onClick={() => setIsAddProductModalOpen(true)}><i className="fa-solid fa-plus"></i> Add Product</button>
                </div>

                <div className="admin-card">
                    <h3 style={{"marginBottom":"1rem","color":"var(--primary)"}}>Air Conditioning Units</h3>
                    <table style={{"marginBottom":"2rem"}}>
                        <thead>
                            <tr>
                                <th>Item Code</th>
                                <th>Brand & Model</th>
                                <th>Category</th>
                                <th>Remaining Stock</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body-ac">
                            {acInventory.map(item => {
                              const status = getStockStatus(item.stock);
                              return (
                                <tr key={item.id}>
                                  <td>{item.sku}</td>
                                  <td>{item.brand} {item.model}</td>
                                  <td>{item.category}</td>
                                  <td>{item.stock}</td>
                                  <td><span className={`status-badge ${status.className}`}>{status.label}</span></td>
                                  <td><button className="btn" style={{background: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} onClick={() => handleRestock(item)}>Restock</button></td>
                                </tr>
                              );
                            })}
                            {acInventory.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', color: 'var(--text-light)', padding: '2rem'}}>No AC inventory items found.</td></tr>}
                        </tbody>
                    </table>

                    <h3 style={{"marginBottom":"1rem","color":"var(--primary)"}}>Parts, Accessories & Tools</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Code</th>
                                <th>Brand & Model</th>
                                <th>Category</th>
                                <th>Remaining Stock</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body-parts">
                            {partsInventory.map(item => {
                              const status = getStockStatus(item.stock);
                              return (
                                <tr key={item.id}>
                                  <td>{item.sku}</td>
                                  <td>{item.brand} {item.model}</td>
                                  <td>{item.category}</td>
                                  <td>{item.stock}</td>
                                  <td><span className={`status-badge ${status.className}`}>{status.label}</span></td>
                                  <td><button className="btn" style={{background: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} onClick={() => handleRestock(item)}>Restock</button></td>
                                </tr>
                              );
                            })}
                            {partsInventory.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', color: 'var(--text-light)', padding: '2rem'}}>No parts inventory items found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  2. Orders & Installations  */}
            <div id="tab-installations" className={`tab-panel ${activeTab === 'tab-installations' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Pending Orders & Installations</h2>
                    <p>Review new purchases from customers. Accept orders to push them to the dispatch queue for
                        installation.</p>
                </div>

                <div className="admin-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer Name</th>
                                <th>Item Purchased</th>
                                <th>Payment Method</th>
                                <th>Date Ordered</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="orders-table-body">
                            {filteredOrders.slice((ordersPage - 1) * 10, ordersPage * 10).map(order => (
                              <tr key={order.id}>
                                <td>{order.orderNo}</td>
                                <td style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} onClick={() => setSelectedOrder(order)} title="View Customer Details">
                                  {order.name}
                                </td>
                                <td>{order.item}</td>
                                <td>{order.payment}</td>
                                <td>{order.date}</td>
                                <td><button className="btn" style={{background: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} onClick={() => handleAcceptOrder(order)}>Accept</button></td>
                              </tr>
                            ))}
                            {orders.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', color: 'var(--text-light)', padding: '2rem'}}>No pending orders.</td></tr>}
                        </tbody>
                    </table>
                    
                    {filteredOrders.length > 10 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                            <button 
                                className="btn btn-secondary" 
                                disabled={ordersPage === 1} 
                                onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))}
                                style={{ opacity: ordersPage === 1 ? 0.5 : 1, pointerEvents: ordersPage === 1 ? 'none' : 'auto' }}
                            >
                                <i className="fa-solid fa-chevron-left"></i> Prev
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                Page {ordersPage} of {Math.ceil(filteredOrders.length / 10)}
                            </span>
                            <button 
                                className="btn btn-secondary" 
                                disabled={ordersPage >= Math.ceil(filteredOrders.length / 10)} 
                                onClick={() => setOrdersPage(prev => prev + 1)}
                                style={{ opacity: ordersPage >= Math.ceil(filteredOrders.length / 10) ? 0.5 : 1, pointerEvents: ordersPage >= Math.ceil(filteredOrders.length / 10) ? 'none' : 'auto' }}
                            >
                                Next <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/*  3. Dispatch & Schedule  */}
            <div id="tab-dispatch" className={`tab-panel ${activeTab === 'tab-dispatch' ? 'active' : ''}`}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2>Dispatch & Schedule</h2>
                        <p>Assign approved installations and service requests to available technicians.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem', background: dispatchViewMode === 'grid' ? 'var(--primary)' : 'transparent', color: dispatchViewMode === 'grid' ? 'white' : 'var(--text-light)', borderColor: dispatchViewMode === 'grid' ? 'var(--primary)' : 'var(--border-color)' }} onClick={() => setDispatchViewMode('grid')}><i className="fa-solid fa-table-cells"></i></button>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem', background: dispatchViewMode === 'list' ? 'var(--primary)' : 'transparent', color: dispatchViewMode === 'list' ? 'white' : 'var(--text-light)', borderColor: dispatchViewMode === 'list' ? 'var(--primary)' : 'var(--border-color)' }} onClick={() => setDispatchViewMode('list')}><i className="fa-solid fa-list"></i></button>
                    </div>
                </div>

                {/*  Dispatch Sub-tabs  */}
                <div className="dispatch-tabs" style={{"marginBottom":"1.5rem","display":"flex","gap":"1rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"1rem"}}>
                    <button className={`btn dispatch-tab-btn ${activeDispatchTab === 'all' ? 'active' : ''}`} onClick={() => { setActiveDispatchTab('all'); setDispatchPage(1); }} style={activeDispatchTab === 'all' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-list"></i> All</button>
                    <button className={`btn btn-secondary dispatch-tab-btn ${activeDispatchTab === 'New Installation' ? 'active' : ''}`} onClick={() => { setActiveDispatchTab('New Installation'); setDispatchPage(1); }} style={activeDispatchTab === 'New Installation' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-screwdriver-wrench" style={{"color": activeDispatchTab === 'New Installation' ? 'white' : 'var(--primary)'}}></i> New Installation</button>
                    <button className={`btn btn-secondary dispatch-tab-btn ${activeDispatchTab === 'Deep Cleaning' ? 'active' : ''}`} onClick={() => { setActiveDispatchTab('Deep Cleaning'); setDispatchPage(1); }} style={activeDispatchTab === 'Deep Cleaning' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-broom" style={{"color": activeDispatchTab === 'Deep Cleaning' ? 'white' : 'var(--accent-red)'}}></i> Deep Cleaning</button>
                    <button className={`btn btn-secondary dispatch-tab-btn ${activeDispatchTab === 'Repair' ? 'active' : ''}`} onClick={() => { setActiveDispatchTab('Repair'); setDispatchPage(1); }} style={activeDispatchTab === 'Repair' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-wrench" style={{"color": activeDispatchTab === 'Repair' ? 'white' : '#e67e22'}}></i> Repair</button>
                </div>

                <div className={`dispatch-list ${dispatchViewMode === 'list' ? 'list-view' : 'grid-view'}`} id="dispatch-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: dispatchViewMode === 'list' ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                    gap: '1.5rem'
                }}>
                    {(() => {
                        const items = filteredDispatch.filter(item => activeDispatchTab === 'all' || item.type === activeDispatchTab);
                        const sortedItems = [...items].sort((a, b) => {
                            const getRank = (s: string) => {
                                const lower = s.toLowerCase();
                                if (lower === 'queued') return 1;
                                if (lower === 'pending') return 2;
                                if (lower === 'completed') return 4;
                                return 3;
                            };
                            return getRank(a.status) - getRank(b.status);
                        });
                        const paginatedItems = sortedItems.slice((dispatchPage - 1) * 6, dispatchPage * 6);
                        return paginatedItems.map(item => (
                        <div key={item.id} className="dispatch-card admin-card" style={{"position":"relative","paddingLeft":"4.5rem"}}>
                            <div className="dispatch-icon" style={{"position":"absolute","left":"1.2rem","top":"1.5rem","width":"40px","height":"40px","borderRadius":"8px","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"1.2rem","color":"white", "background": item.type === 'New Installation' ? 'var(--primary)' : item.type === 'Deep Cleaning' ? 'var(--accent-red)' : '#e67e22'}}>
                                <i className={`fa-solid ${item.type === 'New Installation' ? 'fa-screwdriver-wrench' : item.type === 'Deep Cleaning' ? 'fa-broom' : 'fa-wrench'}`}></i>
                            </div>
                            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"flex-start","marginBottom":"0.8rem"}}>
                                <div>
                                    <h4 style={{"color":"var(--primary)","marginBottom":"0.2rem"}}>{item.type}</h4>
                                    <p style={{"fontSize":"0.85rem","color":"var(--text-light)","fontWeight":"600"}}>{item.dispatchNo}</p>
                                </div>
                                <span className={`status-badge ${item.status === 'PENDING' || item.status === 'Queued' ? 'status-low' : 'status-good'}`}>{item.status}</span>
                            </div>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Customer:</strong> {item.name}</p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Location:</strong> {item.location?.split('| COORDS:')[0].trim()}</p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"1rem"}}><strong>Unit:</strong> {item.item}</p>
                            
                            <div style={{"display":"flex","flexWrap":"wrap","gap":"0.8rem","alignItems":"center","borderTop":"1px solid var(--border-color)","paddingTop":"1rem","marginTop":"auto"}}>
                                {item.status === 'PENDING' || item.status === 'Queued' ? (
                                    <>
                                        <input 
                                          type="date" 
                                          style={{"flex":"1","padding":"0.6rem","border":"1px solid var(--border-color)","borderRadius":"6px","fontSize":"0.9rem", "background": "var(--bg-main)", "color": "var(--text-dark)"}}
                                          value={dateSelections[item.id] || ''}
                                          onChange={(e) => setDateSelections({...dateSelections, [item.id]: e.target.value})}
                                        />
                                        <select 
                                          value={timeBlockSelections[item.id] || 'Morning (8AM - 12PM)'}
                                          onChange={(e) => setTimeBlockSelections({...timeBlockSelections, [item.id]: e.target.value})}
                                          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-dark)', marginTop: '0.5rem', width: '100%' }}
                                        >
                                          <option value="Morning (8AM - 12PM)">Morning (8AM - 12PM)</option>
                                          <option value="Afternoon (1PM - 5PM)">Afternoon (1PM - 5PM)</option>
                                        </select>
                                        <select 
                                          className="assign-select" 
                                          style={{"flex":"1","padding":"0.6rem","border":"1px solid var(--border-color)","borderRadius":"6px","fontSize":"0.9rem"}}
                                          value={assignSelections[item.id]?.[0] || ''}
                                          onChange={(e) => {
                                            setAssignSelections({...assignSelections, [item.id]: [e.target.value]});
                                          }}
                                        >
                                            <option value="">Assign Technician...</option>
                                            {technicians.filter((t: any) => t.techRank !== 'Pending').map(tech => (
                                              <option key={tech.id} value={tech.id}>{tech.firstName} {tech.lastName}</option>
                                            ))}
                                        </select>
                                        <button className="btn" style={{"padding":"0.6rem 1rem","background":"var(--primary)"}} onClick={() => handleAssignTech(item)}>Assign</button>
                                    </>
                                ) : (
                                    <p style={{"fontSize":"0.9rem","color":"var(--text-dark)","fontWeight":"600"}}><i className="fa-solid fa-user-gear"></i> Assigned to: {item.technicians?.map(t => `${t.firstName} ${t.lastName}`).join(', ')} <br/><span style={{"fontSize":"0.85rem","color":"var(--text-light)","fontWeight":"normal","marginTop":"0.4rem","display":"inline-block"}}>Scheduled Date: {item.scheduledDate}</span></p>
                                )}
                            </div>
                        </div>
                      ));
                    })()}
                </div>

                {(() => {
                    const totalItems = dispatch.filter(item => activeDispatchTab === 'all' || item.type === activeDispatchTab).length;
                    const totalPages = Math.ceil(totalItems / 6);

                    if (totalItems === 0) {
                        return (
                            <div id="empty-dispatch" style={{"textAlign":"center","padding":"4rem 0","color":"var(--text-light)"}}>
                                <i className="fa-solid fa-clipboard-check" style={{"fontSize":"4rem","marginBottom":"1rem"}}></i>
                                <p style={{"fontSize":"1.1rem"}}>All caught up! No pending items to dispatch in this category.</p>
                            </div>
                        );
                    }

                    if (totalPages > 1) {
                        return (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                                <button 
                                    className="btn btn-secondary" 
                                    disabled={dispatchPage === 1} 
                                    onClick={() => setDispatchPage(prev => Math.max(prev - 1, 1))}
                                    style={{ opacity: dispatchPage === 1 ? 0.5 : 1, pointerEvents: dispatchPage === 1 ? 'none' : 'auto' }}
                                >
                                    <i className="fa-solid fa-chevron-left"></i> Prev
                                </button>
                                <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                    Page {dispatchPage} of {totalPages}
                                </span>
                                <button 
                                    className="btn btn-secondary" 
                                    disabled={dispatchPage === totalPages} 
                                    onClick={() => setDispatchPage(prev => Math.min(prev + 1, totalPages))}
                                    style={{ opacity: dispatchPage === totalPages ? 0.5 : 1, pointerEvents: dispatchPage === totalPages ? 'none' : 'auto' }}
                                >
                                    Next <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        );
                    }
                    return null;
                })()}
            </div>

            {/*  4. Master Calendar  */}
            <div id="tab-calendar" className={`tab-panel ${activeTab === 'tab-calendar' ? 'active' : ''}`}>
                <div className="calendar-header-top">
                    <div>
                        <h2 style={{"color":"var(--primary)","fontSize":"1.8rem","marginBottom":"0.5rem"}}>Master Calendar
                        </h2>
                        <p style={{"color":"var(--text-light)"}}>View the schedule of all technicians.</p>
                    </div>
                    <div className="calendar-controls">
                        <div className="month-selector">
                            <button id="cal-prev-month" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><i className="fa-solid fa-chevron-left"></i></button>
                            <span id="cal-month-title">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button id="cal-next-month" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><i className="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                </div>

                {/*  Legend  */}
                <div style={{"display":"flex","gap":"1.5rem","marginBottom":"1.5rem","flexWrap":"wrap"}}>
                    {technicians.map((t, index) => {
                        const techColors = [
                            { bg: '#E6F0FA', border: 'var(--primary)' },
                            { bg: '#FFEBEB', border: 'var(--accent-red)' },
                            { bg: '#d4edda', border: '#28a745' },
                            { bg: '#fff3cd', border: '#ffc107' },
                            { bg: '#f3e8ff', border: '#9333ea' },
                        ];
                        const color = techColors[index % techColors.length];
                        return (
                            <span key={t.id} style={{"fontSize":"0.85rem"}}>
                                <span style={{"display":"inline-block","width":"12px","height":"12px","background":color.bg,"borderLeft":`3px solid ${color.border}`,"marginRight":"5px"}}></span>
                                {t.firstName} {t.lastName}
                            </span>
                        );
                    })}
                </div>

                <div className="full-calendar-grid">
                    <div className="calendar-days">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>
                    <div className="calendar-dates" id="dynamic-calendar-dates">
                        {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} className="calendar-cell empty"></div>
                        ))}
                        {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const dateNum = i + 1;
                            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateNum);
                            // Adjust for local timezone to ensure YYYY-MM-DD matches correctly
                            const dateString = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
                            
                            const techColors = [
                                { bg: '#E6F0FA', border: 'var(--primary)' },
                                { bg: '#FFEBEB', border: 'var(--accent-red)' },
                                { bg: '#d4edda', border: '#28a745' },
                                { bg: '#fff3cd', border: '#ffc107' },
                                { bg: '#f3e8ff', border: '#9333ea' },
                            ];

                            const maintEvents = filteredMaintenance.filter(m => m.scheduledDate && m.scheduledDate.split(' ')[0] === dateString).map(m => {
                                const techIndex = technicians.findIndex(t => t.id === m.technicianId);
                                const color = techColors[techIndex >= 0 ? techIndex % techColors.length : 0];
                                return {
                                    id: 'm-' + m.id,
                                    title: m.serviceType,
                                    techName: m.technicianName?.split(' ')[0] || 'Tech',
                                    techId: m.technicianId || '',
                                    color,
                                    time: m.scheduledDate.substring(m.scheduledDate.indexOf(' ') + 1),
                                    location: (m as any).location || m.address || 'N/A',
                                    item: (m as any).brandModel || m.item || 'AC Unit',
                                    userId: (m as any).userId || 'N/A',
                                    isInstallment: false
                                };
                            });

                            const dispatchEvents = dispatch.filter(d => d.scheduledDate && d.scheduledDate.split(' ')[0] === dateString).map(d => {
                                const techId = d.technicians?.[0]?.id;
                                const techIndex = technicians.findIndex(t => t.id === techId);
                                const color = techColors[techIndex >= 0 ? techIndex % techColors.length : 0];
                                return {
                                    id: 'd-' + d.id,
                                    title: d.type,
                                    techName: d.technicians?.map((t: any) => t.firstName).join(', ') || 'Tech',
                                    techId: techId || '',
                                    color,
                                    time: d.scheduledDate!.substring(d.scheduledDate!.indexOf(' ') + 1),
                                    location: d.location || 'N/A',
                                    item: d.item || 'AC Unit',
                                    userId: (d as any).userId || 'N/A',
                                    isInstallment: (d as any).payment === 'Installment'
                                };
                            });
                            
                            const events = [...maintEvents, ...dispatchEvents];

                            return (
                                <div key={dateNum} className="calendar-cell">
                                    <div className="date-number">{dateNum}</div>
                                    {events.map(event => (
                                        <div key={event.id} className="event-chip" 
                                            onClick={() => setSelectedEvent(event)}
                                            style={{"background":event.color.bg,"borderLeft":`3px solid ${event.color.border}`, "color": "#111827", "padding": "2px 4px", "fontSize": "0.75rem", "marginBottom": "2px", "borderRadius": "2px", "cursor": "pointer"}} title={event.time}>
                                            <strong>{event.techName}</strong>: {event.title}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/*  Calendar Event Details Modal  */}
            {selectedEvent && (
                <div className="modal-overlay show" id="event-details-modal" onClick={(e) => { if (e.target === e.currentTarget) setSelectedEvent(null); }}>
                    <div className="modal-content" style={{"maxWidth":"450px"}}>
                        <div className="modal-header">
                            <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}}>Task Details</h2>
                            <button className="close-modal" onClick={() => setSelectedEvent(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","border":"1px solid var(--border-color)","borderRadius":"8px","padding":"1.5rem","marginBottom":"1rem"}}>
                                <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Technician ID:</strong> <span>TECH-{getShortNum(selectedEvent.techId)}</span></p>
                                <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Technician:</strong> <span>{selectedEvent.techName}</span></p>
                                <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Task Type:</strong> <span>{selectedEvent.title}</span></p>
                                <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Schedule:</strong> <span>{selectedEvent.time}</span></p>
                                <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Location:</strong> <span>{selectedEvent.location}</span></p>
                                <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>AC Unit:</strong> <span>{selectedEvent.item} (ID: {formatAcId(selectedEvent.item, selectedEvent.isInstallment, selectedEvent.id)})</span></p>
                                <p style={{"fontSize":"0.9rem","marginBottom":"0"}}><strong>Customer ID:</strong> <span>CUS-{getShortNum(selectedEvent.userId)}</span></p>
                            </div>
                            <button className="btn" style={{"width":"100%","background":"var(--primary)"}} onClick={() => setSelectedEvent(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/*  5. Maintenance Schedule  */}
            <div id="tab-maintenance" className={`tab-panel ${activeTab === 'tab-maintenance' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Maintenance Schedule</h2>
                    <p>Track upcoming AC maintenance appointments for the next days and weeks.</p>
                </div>

                {/*  Maintenance Filter  */}
                <div style={{"display":"flex","gap":"1rem","marginBottom":"1.5rem","flexWrap":"wrap"}}>
                    <button className="btn maint-filter-btn active" data-mfilter="all" style={{"padding":"0.6rem 1.2rem","fontSize":"0.85rem"}}><i className="fa-solid fa-list"></i> All Upcoming</button>
                    <button className="btn btn-secondary maint-filter-btn" data-mfilter="today" style={{"padding":"0.6rem 1.2rem","fontSize":"0.85rem","borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-calendar-day"></i> Today</button>
                    <button className="btn btn-secondary maint-filter-btn" data-mfilter="week" style={{"padding":"0.6rem 1.2rem","fontSize":"0.85rem","borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-calendar-week"></i> This Week</button>
                    <button className="btn btn-secondary maint-filter-btn" data-mfilter="month" style={{"padding":"0.6rem 1.2rem","fontSize":"0.85rem","borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-calendar"></i> This Month</button>
                </div>

                {/*  Stats Cards  */}
                <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(180px, 1fr))","gap":"1.2rem","marginBottom":"2rem"}}>
                    <div className="admin-card" style={{"textAlign":"center","marginBottom":"0","padding":"1.2rem","borderLeft":"4px solid var(--primary)"}}>
                        <p style={{"fontSize":"2rem","fontWeight":"800","color":"var(--primary)"}} id="maint-total-count">8</p>
                        <p style={{"fontSize":"0.82rem","color":"var(--text-light)","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.5px"}}>Total Upcoming</p>
                    </div>
                    <div className="admin-card" style={{"textAlign":"center","marginBottom":"0","padding":"1.2rem","borderLeft":"4px solid #f59e0b"}}>
                        <p style={{"fontSize":"2rem","fontWeight":"800","color":"#f59e0b"}} id="maint-today-count">2</p>
                        <p style={{"fontSize":"0.82rem","color":"var(--text-light)","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.5px"}}>Today</p>
                    </div>
                    <div className="admin-card" style={{"textAlign":"center","marginBottom":"0","padding":"1.2rem","borderLeft":"4px solid #10b981"}}>
                        <p style={{"fontSize":"2rem","fontWeight":"800","color":"#10b981"}} id="maint-week-count">5</p>
                        <p style={{"fontSize":"0.82rem","color":"var(--text-light)","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.5px"}}>This Week</p>
                    </div>
                    <div className="admin-card" style={{"textAlign":"center","marginBottom":"0","padding":"1.2rem","borderLeft":"4px solid var(--accent-red)"}}>
                        <p style={{"fontSize":"2rem","fontWeight":"800","color":"var(--accent-red)"}} id="maint-overdue-count">1</p>
                        <p style={{"fontSize":"0.82rem","color":"var(--text-light)","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.5px"}}>Overdue</p>
                    </div>
                </div>

                {/*  Maintenance List  */}
                <div className="admin-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Schedule</th>
                                <th>Customer</th>
                                <th>AC Unit</th>
                                <th>Service Type</th>
                                <th>Technician</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="maint-table-body">
                            {(() => {
                                const sortedMaint = [...filteredMaintenance].sort((a, b) => {
                                    if (a.technicianName && !b.technicianName) return 1;
                                    if (!a.technicianName && b.technicianName) return -1;
                                    return 0;
                                });
                                const paginatedMaint = sortedMaint.slice((maintenancePage - 1) * 5, maintenancePage * 5);
                                return paginatedMaint.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <div style={{"fontWeight":"600","color":"var(--text-dark)"}}>{new Date(m.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        <div style={{"fontSize":"0.85rem","color":"var(--text-light)"}}>{m.scheduleNo}</div>
                                    </td>
                                    <td>
                                        <div style={{"fontWeight":"500"}}>{m.name}</div>
                                        <div style={{"fontSize":"0.85rem","color":"var(--text-light)"}}>{m.address}</div>
                                    </td>
                                    <td>{m.item}</td>
                                    <td>
                                        <span className={`status-badge ${m.serviceType === 'Deep Cleaning' ? 'status-low' : 'status-good'}`} style={{"background": m.serviceType === 'Deep Cleaning' ? '#FFEBEB' : '#FFF3CD', "color": m.serviceType === 'Deep Cleaning' ? 'var(--accent-red)' : '#856404'}}>{m.serviceType}</span>
                                    </td>
                                    <td>{m.technicianName}</td>
                                    <td>
                                        {m.status === 'SCHEDULED' ? <span className="status-badge status-good">Upcoming</span> : <span className="status-badge status-critical">Overdue</span>}
                                    </td>
                                    <td>
                                        {!m.technicianName ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input 
                                                    type="date" 
                                                    style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem', background: 'var(--bg-main)', color: 'var(--text-dark)' }}
                                                    value={dateSelections[m.id] || (m.scheduledDate ? m.scheduledDate.split(' ')[0] : '')}
                                                    onChange={(e) => setDateSelections({...dateSelections, [m.id]: e.target.value})}
                                                />
                                                <select 
                                                    value={timeBlockSelections[m.id] || (m.scheduledDate && m.scheduledDate.includes('Afternoon') ? 'Afternoon (1PM - 5PM)' : 'Morning (8AM - 12PM)')}
                                                    onChange={(e) => setTimeBlockSelections({...timeBlockSelections, [m.id]: e.target.value})}
                                                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-dark)', marginTop: '0.5rem', width: '100%' }}
                                                >
                                                    <option value="Morning (8AM - 12PM)">Morning (8AM - 12PM)</option>
                                                    <option value="Afternoon (1PM - 5PM)">Afternoon (1PM - 5PM)</option>
                                                </select>
                                                <select 
                                                    className="assign-select" 
                                                    style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                    value={assignSelections[m.id]?.[0] || ''}
                                                    onChange={(e) => setAssignSelections({...assignSelections, [m.id]: [e.target.value]})}
                                                >
                                                    <option value="">Select Tech...</option>
                                                    {technicians.filter((t: any) => t.techRank !== 'Pending').map(tech => (
                                                        <option key={tech.id} value={tech.id}>{tech.firstName} {tech.lastName}</option>
                                                    ))}
                                                </select>
                                                <button className="btn" style={{ background: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleAssignMaintenanceTech(m)}>Assign</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}><i className="fa-solid fa-check" style={{ color: '#28a745' }}></i> Assigned</span>
                                                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }} onClick={() => handleSendMaintReminder(m)} title="Send SMS Reminder">
                                                    <i className="fa-solid fa-comment-sms"></i> Remind
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                ));
                            })()}
                            {maintenance.length === 0 && <tr><td colSpan={7} style={{textAlign: 'center', color: 'var(--text-light)', padding: '2rem'}}>No upcoming maintenance.</td></tr>}
                        </tbody>
                    </table>
                    {filteredMaintenance.length > 5 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                            <button 
                                className="btn btn-secondary" 
                                disabled={maintenancePage === 1} 
                                onClick={() => setMaintenancePage(prev => Math.max(prev - 1, 1))}
                                style={{ opacity: maintenancePage === 1 ? 0.5 : 1, pointerEvents: maintenancePage === 1 ? 'none' : 'auto' }}
                            >
                                <i className="fa-solid fa-chevron-left"></i> Prev
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                Page {maintenancePage} of {Math.ceil(filteredMaintenance.length / 5)}
                            </span>
                            <button 
                                className="btn btn-secondary" 
                                disabled={maintenancePage >= Math.ceil(filteredMaintenance.length / 5)} 
                                onClick={() => setMaintenancePage(prev => prev + 1)}
                                style={{ opacity: maintenancePage >= Math.ceil(filteredMaintenance.length / 5) ? 0.5 : 1, pointerEvents: maintenancePage >= Math.ceil(filteredMaintenance.length / 5) ? 'none' : 'auto' }}
                            >
                                Next <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/*  Maintenance Details Modal  */}
            <div className="modal-overlay" id="maint-details-modal">
                <div className="modal-content" style={{"maxWidth":"600px"}}>
                    <div className="modal-header">
                        <div>
                            <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}} id="maint-modal-title">Customer Details</h2>
                            <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}} id="maint-modal-subtitle">MNT-000 • CUS-000</p>
                        </div>
                        <button className="close-modal" onClick={() => {}}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"1.5rem","marginBottom":"1.5rem"}}>
                            <div>
                                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-user" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Customer Info</h4>
                                <p style={{"fontSize":"0.9rem"}}><strong>Name:</strong> <span id="maint-modal-name"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Phone:</strong> <span id="maint-modal-phone"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Address:</strong> <span id="maint-modal-address"></span></p>
                            </div>
                            <div>
                                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-screwdriver-wrench" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Service Info</h4>
                                <p style={{"fontSize":"0.9rem"}}><strong>AC Unit:</strong> <span id="maint-modal-item"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Service:</strong> <span id="maint-modal-service"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Scheduled:</strong> <span id="maint-modal-date"></span></p>
                            </div>
                        </div>

                        <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","border":"1px solid var(--border-color)","borderRadius":"8px","padding":"1rem","marginBottom":"1.5rem"}}>
                            <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-clipboard" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Notes</h4>
                            <p style={{"fontSize":"0.9rem","color":"var(--text-light)"}} id="maint-modal-notes"></p>
                        </div>

                        <div id="maint-deploy-section" style={{"background":"var(--bg-card, #0f1f38)","padding":"1.5rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                            {/*  Dynamically rendered by JS  */}
                        </div>
                    </div>
                </div>
            </div>

            {/*  Installment Details Modal  */}
            <div className="modal-overlay" id="details-modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <div>
                            <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}} id="modal-title">Application Details</h2>
                            <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}} id="modal-subtitle">APP-0000</p>
                        </div>
                        <button className="close-modal" onClick={() => {}}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"1.5rem","marginBottom":"2rem"}}>
                            <div>
                                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}>Applicant Info</h4>
                                <p style={{"fontSize":"0.9rem"}}><strong>Name:</strong> <span id="modal-name"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Item:</strong> <span id="modal-item"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Term:</strong> <span id="modal-term"></span> Months</p>
                            </div>
                            <div>
                                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}>Employment & Income</h4>
                                <p style={{"fontSize":"0.9rem"}}><strong>Employer:</strong> <span id="modal-employer"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Monthly Income:</strong> ₱<span id="modal-income"></span></p>
                            </div>
                        </div>
                        
                        <h4 style={{"color":"var(--text-dark)","marginBottom":"1rem"}}>Submitted Documents</h4>
                        <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"1rem"}}>
                            <div>
                                <p style={{"fontSize":"0.85rem","fontWeight":"600","marginBottom":"0.5rem"}}>Valid ID (<span id="modal-idtype"></span>)</p>
                                <div className="doc-preview">
                                    <i className="fa-regular fa-id-card" style={{"fontSize":"2rem","marginBottom":"0.5rem"}}></i><br />
                                    Preview
                                </div>
                            </div>
                            <div>
                                <p style={{"fontSize":"0.85rem","fontWeight":"600","marginBottom":"0.5rem"}}>Proof of Income</p>
                                <div className="doc-preview">
                                    <i className="fa-solid fa-file-invoice-dollar" style={{"fontSize":"2rem","marginBottom":"0.5rem"}}></i><br />
                                    Preview
                                </div>
                            </div>
                        </div>
                        
                        <h4 style={{"color":"var(--text-dark)","marginTop":"1.5rem","marginBottom":"0.5rem"}}>Installation Location Pinpoint</h4>
                        <div style={{height: "150px", marginBottom: "0.5rem", zIndex: 10}}>
                            <GoogleMap height="150px" />
                        </div>
                        <span id="details-coords-text" style={{"fontSize":"0.85rem","color":"var(--text-light)","fontWeight":"500"}}>Coordinates: Not Available</span>
                    </div>
                </div>
            </div>

            {/*  POS Installment Customer Info Modal  */}
            <div className={`modal-overlay ${showPosCustomerModal ? 'show' : ''}`} style={{ display: showPosCustomerModal ? 'flex' : 'none', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
                <div className="modal-content" style={{"maxWidth":"650px", "padding": "0", "overflow": "hidden", "borderRadius": "16px", "boxShadow": "0 20px 40px rgba(0,0,0,0.2)", display: 'flex', flexDirection: 'column', maxHeight: '90vh'}}>
                    
                    <div style={{ background: 'var(--primary-grad)', padding: '1.5rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <div>
                            <h2 style={{"fontSize":"1.5rem","margin": "0", "fontWeight": "700", "display": "flex", "alignItems": "center", "gap": "10px"}}>
                                <i className="fa-solid fa-file-signature"></i> Installment Application
                            </h2>
                            <p style={{ margin: '0.2rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Please complete the customer details to process the installment request.</p>
                        </div>
                        <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onClick={() => setShowPosCustomerModal(false)}>&times;</button>
                    </div>

                    <div className="modal-body" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                        <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"1.5rem"}}>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-light)","display":"block","marginBottom":"0.4rem"}}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <i className="fa-solid fa-user" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}></i>
                                    <input type="text" id="pos-cust-name" placeholder="e.g. John Doe" style={{"width":"100%","padding":"0.9rem 1rem 0.9rem 2.8rem","borderRadius":"8px","border":"1px solid var(--border-color)","fontFamily":"inherit","fontSize":"0.95rem","background":"var(--bg-input, #fff)","boxShadow":"inset 0 1px 3px rgba(0,0,0,0.02)"}} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-light)","display":"block","marginBottom":"0.4rem"}}>Monthly Income (PHP)</label>
                                <div style={{ position: 'relative' }}>
                                    <i className="fa-solid fa-money-bill-wave" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#28a745' }}></i>
                                    <input type="number" id="pos-cust-income" placeholder="e.g. 35000" style={{"width":"100%","padding":"0.9rem 1rem 0.9rem 2.8rem","borderRadius":"8px","border":"1px solid var(--border-color)","fontFamily":"inherit","fontSize":"0.95rem","background":"var(--bg-input, #fff)","boxShadow":"inset 0 1px 3px rgba(0,0,0,0.02)"}} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-light)","display":"block","marginBottom":"0.4rem"}}>Employer / Source of Income</label>
                                <div style={{ position: 'relative' }}>
                                    <i className="fa-solid fa-building" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}></i>
                                    <input type="text" id="pos-cust-employer" placeholder="e.g. Acme Corp" style={{"width":"100%","padding":"0.9rem 1rem 0.9rem 2.8rem","borderRadius":"8px","border":"1px solid var(--border-color)","fontFamily":"inherit","fontSize":"0.95rem","background":"var(--bg-input, #fff)","boxShadow":"inset 0 1px 3px rgba(0,0,0,0.02)"}} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-light)","display":"block","marginBottom":"0.4rem"}}>Valid ID Type</label>
                                <select id="pos-cust-idtype" style={{"width":"100%","padding":"0.9rem","borderRadius":"8px","border":"1px solid var(--border-color)","fontFamily":"inherit","fontSize":"0.95rem","background":"var(--bg-input, #fff)","cursor":"pointer"}}>
                                    <option value="UMID">UMID</option>
                                    <option value="Driver License">Driver's License</option>
                                    <option value="Passport">Passport</option>
                                    <option value="SSS ID">SSS ID</option>
                                    <option value="PRC ID">PRC ID</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-light)","display":"block","marginBottom":"0.4rem"}}>Installment Term</label>
                                <select id="pos-cust-term" style={{"width":"100%","padding":"0.9rem","borderRadius":"8px","border":"1px solid var(--border-color)","fontFamily":"inherit","fontSize":"0.95rem","background":"var(--bg-input, #fff)","cursor":"pointer"}}>
                                    <option value="6">6 Months</option>
                                    <option value="12">12 Months</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem", paddingTop: "1.5rem", borderTop: "1px dashed var(--border-color)" }}>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-light)","display":"flex","alignItems":"center","gap":"6px","marginBottom":"0.8rem"}}>
                                    <i className="fa-solid fa-map-location-dot" style={{color: 'var(--primary)'}}></i> Installation Location Pinpoint
                                </label>
                                <div style={{"display":"flex","gap":"8px","marginBottom":"0.8rem"}}>
                                    <input type="text" id="pos-map-search" placeholder="Search address or city..." style={{"flex":"1","padding":"0.9rem","borderRadius":"8px","border":"1px solid var(--border-color)","fontFamily":"inherit","fontSize":"0.95rem"}} />
                                    <button className="btn" id="pos-map-search-btn" style={{"padding":"0.9rem 1.2rem","background":"var(--primary)","borderRadius":"8px"}}><i className="fa-solid fa-magnifying-glass"></i></button>
                                </div>
                                <div style={{height: "220px", marginBottom: "0.5rem", zIndex: 10, borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)"}}>
                                    <GoogleMap height="220px" />
                                </div>
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <i className="fa-solid fa-circle-info" style={{color: 'var(--primary)', fontSize: '0.8rem'}}></i>
                                    <span id="pos-selected-coords" style={{"fontSize":"0.8rem","color":"var(--text-light)","fontWeight":"500"}}>Click on the map to pinpoint. Selected: TBD</span>
                                </div>
                                <input type="hidden" id="pos-cust-coords" value="" />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem' }} onClick={() => setShowPosCustomerModal(false)}>Cancel</button>
                        <button className="btn" id="confirm-pos-installment-btn" style={{"padding":"0.8rem 2rem","background":"var(--primary)","fontSize":"1rem","boxShadow":"0 4px 12px rgba(0, 155, 213, 0.3)"}} onClick={handlePosInstallmentSubmit}>
                            Submit Application <i className="fa-solid fa-arrow-right" style={{marginLeft: '6px'}}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/*  POS Cash Payment Modal  */}
            <div className={`modal-overlay ${showPosCashModal ? 'show' : ''}`} style={{ display: showPosCashModal ? 'flex' : 'none', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
                <div className="modal-content" style={{"maxWidth":"500px", "padding": "0", "overflow": "hidden", "borderRadius": "16px", "boxShadow": "0 20px 40px rgba(0,0,0,0.2)", display: 'flex', flexDirection: 'column', maxHeight: '90vh'}}>
                    
                    <div style={{ background: 'var(--primary-grad)', padding: '1.5rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <div>
                            <h2 style={{"fontSize":"1.5rem","margin": "0", "fontWeight": "700", "display": "flex", "alignItems": "center", "gap": "10px"}}>
                                <i className="fa-solid fa-money-bill-1-wave"></i> Cash Payment
                            </h2>
                            <p style={{ margin: '0.2rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Please enter the customer's name for the receipt.</p>
                        </div>
                        <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onClick={() => setShowPosCashModal(false)}>&times;</button>
                    </div>

                    <div className="modal-body" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                        <div>
                            <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-light)","display":"block","marginBottom":"0.4rem"}}>Customer Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fa-solid fa-user" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}></i>
                                <input type="text" id="pos-cash-name" placeholder="e.g. John Doe" style={{"width":"100%","padding":"0.9rem 1rem 0.9rem 2.8rem","borderRadius":"8px","border":"1px solid var(--border-color)","fontFamily":"inherit","fontSize":"0.95rem","background":"var(--bg-input, #fff)","boxShadow":"inset 0 1px 3px rgba(0,0,0,0.02)"}} />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(40, 167, 69, 0.1)', border: '1px solid rgba(40, 167, 69, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#28a745', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                <i className="fa-solid fa-cash-register"></i>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '0.95rem' }}>Total Amount Due</h4>
                                <p style={{ margin: 0, color: '#28a745', fontWeight: 700, fontSize: '1.3rem' }}>
                                    ₱{(posCart.reduce((sum, item) => sum + (item.price * item.cartQty), 0) * 1.12).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem' }} onClick={() => setShowPosCashModal(false)}>Cancel</button>
                        <button className="btn" style={{"padding":"0.8rem 2rem","background":"#28a745","fontSize":"1rem","boxShadow":"0 4px 12px rgba(40, 167, 69, 0.3)"}} onClick={handlePosCashSubmit}>
                            Confirm Payment <i className="fa-solid fa-check" style={{marginLeft: '6px'}}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/*  Add Product Modal  */}
            <div className="modal-overlay" id="add-product-modal">
                <div className="modal-content" style={{"maxWidth":"500px"}}>
                    <div className="modal-header">
                        <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}}>Add New Product</h2>
                        <button className="close-modal" onClick={() => {}}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{"display":"flex","flexDirection":"column","gap":"1rem"}}>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Item Code</label>
                                <input type="text" id="new-prod-code" placeholder="e.g. AC-SPL-15" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Brand</label>
                                <input type="text" id="new-prod-brand" placeholder="e.g. Carrier" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Model</label>
                                <input type="text" id="new-prod-model" placeholder="e.g. Premium Inverter (1.5 HP)" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Category</label>
                                <select id="new-prod-category" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}}>
                                    <option value="Split Type">Split Type AC</option>
                                    <option value="Window Type">Window Type AC</option>
                                    <option value="Floor Standing">Floor Standing AC</option>
                                    <option value="Pre-Owned">Pre-Owned AC</option>
                                    <option value="Parts & Accessories">Parts & Accessories</option>
                                    <option value="Tools">Tools</option>
                                </select>
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Initial Stock</label>
                                <input type="number" id="new-prod-stock" placeholder="0" min="0" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <button className="btn" id="save-product-btn" style={{"width":"100%","marginTop":"1rem","background":"var(--primary)"}}>Save Product &rarr;</button>
                        </div>
                    </div>
                </div>
            </div>

            {/*  Tech Requests  */}
            <div id="tab-tech-requests" className={`tab-panel ${activeTab === 'tab-tech-requests' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Tech Requests</h2>
                    <p>Manage and fulfill supplies or tools requested by technicians.</p>
                </div>
                
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Req ID</th>
                                <th>Technician</th>
                                <th>Item Needed</th>
                                <th>Qty</th>
                                <th>Reason</th>
                                <th>Date/Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tech-requests-table">
                            {filteredTechRequests.map((req, i) => (
                                <tr key={req.id || i}>
                                    <td>{req.reqId}</td>
                                    <td>{req.technicianName}</td>
                                    <td style={{fontWeight: 600}}>{req.itemNeeded}</td>
                                    <td>{req.quantity}</td>
                                    <td>{req.reason}</td>
                                    <td style={{fontSize: '0.85rem'}}>{new Date(req.createdAt).toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${req.status === 'Approved' ? 'status-good' : req.status === 'Declined' ? 'status-critical' : 'status-low'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>
                                        {req.status === 'Pending' && (
                                            <div style={{display: 'flex', gap: '5px'}}>
                                                <button className="btn" style={{background: 'var(--accent-green)', padding: '0.4rem 0.8rem'}} onClick={() => handleUpdateTechRequestStatus(req.id, 'Approved')} title="Approve">
                                                    <i className="fa-solid fa-check"></i>
                                                </button>
                                                <button className="btn" style={{background: 'var(--accent-red)', padding: '0.4rem 0.8rem'}} onClick={() => handleUpdateTechRequestStatus(req.id, 'Declined')} title="Decline">
                                                    <i className="fa-solid fa-times"></i>
                                                </button>
                                            </div>
                                        )}
                                        {req.status !== 'Pending' && <span style={{color: 'var(--text-light)', fontSize: '0.85rem'}}>Processed</span>}
                                    </td>
                                </tr>
                            ))}
                            {techRequests.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{textAlign: 'center', padding: '2rem'}}>No tech requests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  Customer Directory  */}
            <div id="tab-customers" className={`tab-panel ${activeTab === 'tab-customers' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Customer Directory</h2>
                    <p>View all customers, their purchased ACs, and installment applications.</p>
                </div>
                
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name / ID</th>
                                <th>Contact / Location</th>
                                <th>Total ACs</th>
                                <th>Active Installment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="customers-table">
                            {filteredCustomers.map((c, i) => (
                                <tr key={c.id || i}>
                                    <td>
                                        <div style={{fontWeight: 600, color: 'var(--text-dark)'}}>{c.name}</div>
                                        <div style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>CUS-{getShortNum(c.id)}</div>
                                    </td>
                                    <td>
                                        <div>{c.phone}</div>
                                        <div style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>{c.location}</div>
                                    </td>
                                    <td>{c.totalAcs}</td>
                                    <td>
                                        <span className={`status-badge ${c.activeInstallment === 'Yes' ? 'status-good' : 'status-low'}`}>
                                            {c.activeInstallment}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn" style={{background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.4rem 0.8rem'}} onClick={() => setSelectedCustomer(c)}>
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>No customers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  Technicians Directory  */}
            <div id="tab-technicians" className={`tab-panel ${activeTab === 'tab-technicians' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Technicians Directory</h2>
                    <p>Manage your technicians and their ranks.</p>
                </div>

                {/* Rank Stats */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem', marginBottom: '2rem'}}>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid var(--primary)'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: 'var(--primary)'}}>{technicians.length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Technicians</p>
                    </div>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid #f59e0b'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: '#f59e0b'}}>{technicians.filter((t: any) => t.techRank === 'Senior Tech').length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Senior Techs</p>
                    </div>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid var(--accent-green)'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)'}}>{technicians.filter((t: any) => t.techRank === 'Tech').length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Technicians</p>
                    </div>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid #8b5cf6'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: '#8b5cf6'}}>{technicians.filter((t: any) => t.techRank === 'Junior Tech').length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Junior Techs</p>
                    </div>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid #dc3545'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: '#dc3545'}}>{technicians.filter((t: any) => t.techRank === 'Pending').length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Pending Approval</p>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>ID</th>
                                <th>Current Rank</th>
                                <th>Change Rank</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTechnicians.map((tech: any) => (
                                <tr key={tech.id}>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                            <div style={{width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem'}}>
                                                {tech.firstName?.[0]}{tech.lastName?.[0]}
                                            </div>
                                            <span style={{fontWeight: 600}}>{tech.firstName} {tech.lastName}</span>
                                        </div>
                                    </td>
                                    <td style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>TECH-{getShortNum(tech.id)}</td>
                                    <td>
                                        <span className={`status-badge ${
                                            tech.techRank === 'Senior Tech' ? 'status-critical' :
                                            tech.techRank === 'Junior Tech' ? 'status-low' : 
                                            tech.techRank === 'Pending' ? 'status-low' : 'status-good'
                                        }`} style={{
                                            background: tech.techRank === 'Senior Tech' ? 'rgba(245, 158, 11, 0.15)' :
                                                         tech.techRank === 'Junior Tech' ? 'rgba(139, 92, 246, 0.15)' : 
                                                         tech.techRank === 'Pending' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(53, 214, 160, 0.15)',
                                            color: tech.techRank === 'Senior Tech' ? '#f59e0b' :
                                                   tech.techRank === 'Junior Tech' ? '#8b5cf6' : 
                                                   tech.techRank === 'Pending' ? '#dc3545' : 'var(--accent-green)',
                                            border: `1px solid ${tech.techRank === 'Senior Tech' ? '#f59e0b' :
                                                   tech.techRank === 'Junior Tech' ? '#8b5cf6' : 
                                                   tech.techRank === 'Pending' ? '#dc3545' : 'var(--accent-green)'}`,
                                            padding: '0.35rem 0.8rem', fontWeight: 700
                                        }}>
                                            {tech.techRank === 'Senior Tech' && <><i className="fa-solid fa-star" style={{marginRight: '4px'}}></i></>}
                                            {tech.techRank === 'Junior Tech' && <><i className="fa-solid fa-seedling" style={{marginRight: '4px'}}></i></>}
                                            {tech.techRank === 'Pending' && <><i className="fa-solid fa-clock" style={{marginRight: '4px'}}></i></>}
                                            {tech.techRank === 'Tech' && <><i className="fa-solid fa-wrench" style={{marginRight: '4px'}}></i></>}
                                            {tech.techRank === 'Pending' ? 'Pending Approval' : (tech.techRank || 'Tech')}
                                        </span>
                                    </td>
                                    <td>
                                        {tech.techRank === 'Pending' ? (
                                            <button 
                                                className="btn" 
                                                style={{ background: 'var(--accent-green)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`/api/users/technicians?id=${tech.id}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ techRank: 'Junior Tech' })
                                                        });
                                                        if (res.ok) {
                                                            setTechnicians(prev => prev.map((t: any) => t.id === tech.id ? { ...t, techRank: 'Junior Tech' } : t));
                                                            alert('Technician account approved!');
                                                        } else {
                                                            alert('Failed to approve account.');
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Failed to approve account.');
                                                    }
                                                }}
                                            >
                                                <i className="fa-solid fa-check" style={{marginRight: '5px'}}></i> Approve Account
                                            </button>
                                        ) : (
                                            <select
                                                value={tech.techRank || 'Tech'}
                                                onChange={async (e) => {
                                                    const newRank = e.target.value;
                                                    try {
                                                        const res = await fetch(`/api/users/technicians?id=${tech.id}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ techRank: newRank })
                                                        });
                                                        if (res.ok) {
                                                            setTechnicians(prev => prev.map((t: any) => t.id === tech.id ? { ...t, techRank: newRank } : t));
                                                        } else {
                                                            alert('Failed to update rank.');
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Failed to update rank.');
                                                    }
                                                }}
                                                style={{
                                                    background: 'var(--bg-input)',
                                                    color: 'var(--text-dark)',
                                                    border: '1px solid var(--border-color)',
                                                    padding: '0.5rem 0.8rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <option value="Senior Tech">⭐ Senior Tech</option>
                                                <option value="Tech">🔧 Tech</option>
                                                <option value="Junior Tech">🌱 Junior Tech</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {technicians.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>No technicians found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

                  <div id="tab-invoices" className={`tab-panel ${activeTab === 'tab-invoices' ? 'active' : ''}`}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2>Invoices</h2>
                        <p>View all admin invoices sent by technicians for completed jobs.</p>
                    </div>
                </div>

                {/* Invoice Stats */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem', marginBottom: '2rem'}}>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid var(--primary)'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: 'var(--primary)'}}>{invoices.filter(i => i.type === 'ADMIN').length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Invoices</p>
                    </div>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid #28a745'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: '#28a745'}}>{invoices.filter(i => i.type === 'ADMIN' && i.status === 'Paid').length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Paid</p>
                    </div>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid #6366f1'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: '#6366f1'}}>{invoices.filter(i => i.type === 'ADMIN' && i.status === 'Sent').length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Pending Review</p>
                    </div>
                    <div className="admin-card" style={{textAlign: 'center', marginBottom: 0, padding: '1.2rem', borderLeft: '4px solid #f59e0b'}}>
                        <p style={{fontSize: '2rem', fontWeight: 800, color: '#f59e0b'}}>{invoices.filter(i => i.type === 'ADMIN' && i.status === 'Viewed').length}</p>
                        <p style={{fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Viewed</p>
                    </div>
                </div>

                {/* Invoice Table */}
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Customer</th>
                                <th>Service</th>
                                <th>AC Unit</th>
                                <th>Technician</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.filter(i => i.type === 'ADMIN').map((inv: any) => (
                                <tr key={inv.id}>
                                    <td style={{fontWeight: 'bold', color: 'var(--primary)'}}>{inv.invoiceNo}</td>
                                    <td style={{fontWeight: 600}}>{inv.customerName}</td>
                                    <td>{inv.serviceType}</td>
                                    <td style={{fontSize: '0.85rem'}}>{inv.acUnit}</td>
                                    <td>{inv.technicianName}</td>
                                    <td style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${inv.status === 'Paid' ? 'status-good' : inv.status === 'Viewed' ? 'status-medium' : 'status-low'}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                            {inv.status === 'Sent' && (
                                                <button className="btn btn-sm" style={{padding: '0.3rem 0.6rem'}} onClick={async () => {
                                                    try {
                                                        await fetch('/api/invoices', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: inv.id, status: 'Viewed' }) });
                                                        setInvoices(prev => prev.map(i => i.id === inv.id ? {...i, status: 'Viewed'} : i));
                                                    } catch { alert('Failed to update'); }
                                                }}><i className="fa-solid fa-eye"></i> Viewed</button>
                                            )}
                                            {(inv.status === 'Sent' || inv.status === 'Viewed') && (
                                                <button className="btn btn-sm" style={{padding: '0.3rem 0.6rem', background: '#28a745'}} onClick={async () => {
                                                    try {
                                                        await fetch('/api/invoices', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: inv.id, status: 'Paid' }) });
                                                        setInvoices(prev => prev.map(i => i.id === inv.id ? {...i, status: 'Paid'} : i));
                                                    } catch { alert('Failed to update'); }
                                                }}><i className="fa-solid fa-check"></i> Paid</button>
                                            )}
                                            {inv.status === 'Paid' && (
                                                <span style={{color: '#28a745', fontWeight: 600, fontSize: '0.85rem'}}><i className="fa-solid fa-check-double"></i> Completed</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {invoices.filter(i => i.type === 'ADMIN').length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{textAlign: 'center', padding: '3rem', color: 'var(--text-light)'}}>
                                        <i className="fa-solid fa-file-invoice" style={{fontSize: '2.5rem', marginBottom: '1rem', display: 'block'}}></i>
                                        No admin invoices yet. Invoices will appear here when technicians submit them from completed jobs.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </main>
    </div>

    {/*  Customer Info Modal  */}
    {selectedCustomer && (
      <div className="modal-overlay show" id="customer-info-modal" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCustomer(null); }}>
          <div className="modal-content" style={{"maxWidth":"650px", "transform": "none"}}>
              <div className="modal-header">
                  <div>
                      <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}}>{selectedCustomer.name}</h2>
                      <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}}>{selectedCustomer.id}</p>
                  </div>
                  <button className="close-modal" onClick={() => setSelectedCustomer(null)}>&times;</button>
              </div>
              <div className="modal-body">
                  <div style={{"display":"grid","gridTemplateColumns":"1fr","gap":"1.5rem","marginBottom":"2rem"}}>
                      <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                          <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-address-card" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Profile</h4>
                          <p style={{"fontSize":"0.9rem"}}><strong>Email:</strong> <span>{selectedCustomer.email}</span></p>
                          <p style={{"fontSize":"0.9rem"}}><strong>Phone:</strong> <span>{selectedCustomer.phone}</span></p>
                          <p style={{"fontSize":"0.9rem"}}><strong>Location:</strong> <span>{selectedCustomer.location}</span></p>
                      </div>
                      
                      <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                          <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-fan" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Owned / Registered AC Units</h4>
                          <ul style={{"fontSize":"0.9rem","color":"var(--text-light)","paddingLeft":"1.2rem","marginTop":"10px"}}>
                              {selectedCustomer.registeredACs?.map((ac: any) => (
                                  <li key={ac.id} style={{marginBottom: '5px'}}>
                                      <strong>{ac.brandModel}</strong> 
                                      {!ac.purchasedFromStore ? 
                                        <span style={{color: 'var(--text-light)', marginLeft: '8px', fontSize: '0.8rem'}}>(Manually Added)</span> :
                                        ac.paymentType === 'Installment' ? 
                                        <span style={{color: 'var(--primary)', marginLeft: '8px', fontSize: '0.8rem'}}>(Installment)</span> : 
                                        <span style={{color: 'var(--accent-green)', marginLeft: '8px', fontSize: '0.8rem'}}>(Purchased Outright)</span>
                                      }
                                  </li>
                              ))}
                              {selectedCustomer.registeredACs?.length === 0 && <li>No registered AC units yet.</li>}
                          </ul>
                      </div>

                      <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                          <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-file-invoice-dollar" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Installment Applications</h4>
                          <div style={{"fontSize":"0.9rem","color":"var(--text-light)","marginTop":"10px"}}>
                              {selectedCustomer.installments?.map((inst: any) => (
                                  <div key={inst.id} style={{borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                      <div>
                                          <div style={{fontWeight: 600, color: 'var(--text-dark)'}}>{inst.item}</div>
                                          <div>Status: <span style={{fontWeight: 500, color: inst.status === 'COMPLETED' ? 'var(--accent-green)' : (inst.status === 'REPENDING' ? 'var(--accent-red)' : 'var(--primary)')}}>{inst.status}</span></div>
                                          <div>Term: {inst.term} Months</div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <label 
                                          className="btn" 
                                          style={{ background: 'var(--bg-main)', color: 'var(--primary)', border: '1px dashed var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        >
                                          <i className="fa-solid fa-cloud-arrow-up"></i> Upload Document
                                          <input 
                                            type="file" 
                                            accept="image/*,.pdf" 
                                            style={{ display: 'none' }} 
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files.length > 0) {
                                                alert(`Application document "${e.target.files[0].name}" uploaded successfully!`);
                                              }
                                            }}
                                          />
                                        </label>
                                        {inst.status === 'COMPLETED' && (
                                          <button 
                                            className="btn" 
                                            style={{background: 'var(--accent-green)', padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}
                                            onClick={() => {
                                              setSelectedCustomer(null);
                                              setSelectedInstallment({...inst, isPayment: true} as any);
                                            }}
                                          >
                                            <i className="fa-solid fa-file-invoice-dollar"></i> Post Payment
                                          </button>
                                        )}
                                      </div>
                                  </div>
                              ))}
                              {selectedCustomer.installments?.length === 0 && <p>No installment applications yet.</p>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    )}

    {/*  Order Details Modal  */}
    <div className="modal-overlay" id="order-details-modal">
        <div className="modal-content" style={{"maxWidth":"600px"}}>
            <div className="modal-header">
                <div>
                    <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}} id="order-modal-title">Order Details</h2>
                    <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}} id="order-modal-id">ORD-0000</p>
                </div>
                <button className="close-modal" onClick={() => {}}>&times;</button>
            </div>
            <div className="modal-body">
                <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)","marginBottom":"1.5rem"}}>
                    <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-user" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Customer Info</h4>
                    <p style={{"fontSize":"0.9rem"}}><strong>Name:</strong> <span id="order-modal-name">-</span></p>
                    <p style={{"fontSize":"0.9rem"}}><strong>Customer ID:</strong> <span id="order-modal-cusid">-</span></p>
                    <p style={{"fontSize":"0.9rem"}}><strong>Location:</strong> <span id="order-modal-location">-</span></p>
                </div>
                
                <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)","marginBottom":"1.5rem"}}>
                    <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-cart-shopping" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Purchase Details</h4>
                    <p style={{"fontSize":"0.9rem"}}><strong>Date:</strong> <span id="order-modal-date">-</span></p>
                    <p style={{"fontSize":"0.9rem"}}><strong>Payment Method:</strong> <span id="order-modal-payment">-</span></p>
                    <p style={{"fontSize":"0.9rem"}}><strong>Items:</strong></p>
                    <div id="order-modal-items" style={{"fontSize":"0.9rem","color":"var(--text-dark)","padding":"10px","background":"rgba(0,0,0,0.02)","borderRadius":"4px","marginTop":"5px"}}>
                        -
                    </div>
                </div>
                
                <div style={{"textAlign":"right"}}>
                    <button className="btn" style={{"background":"var(--primary)"}} id="order-modal-accept-btn">Accept & Queue &rarr;</button>
                </div>
            </div>
        </div>
    </div>

    {/*  UI Navigation Script  */}
    

    {/*  State Management & Rendering  */}
    

    {/* Customer Details Modal */}
    {selectedOrder && (
      <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}>
        <div className="modal-content" style={{ maxWidth: '500px', transform: 'none' }}>
          <div className="modal-header">
            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-address-card"></i> Customer Details
            </h3>
            <button className="close-modal" onClick={() => setSelectedOrder(null)}><i className="fa-solid fa-times"></i></button>
          </div>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginBottom: '0.8rem', fontSize: '0.95rem' }}>
              <strong style={{ color: 'var(--text-light)' }}>Order ID:</strong>
              <span>{selectedOrder.orderNo}</span>
              
              <strong style={{ color: 'var(--text-light)' }}>Name:</strong>
              <span style={{ fontWeight: 600 }}>{selectedOrder.name}</span>
              
              <strong style={{ color: 'var(--text-light)' }}>Location:</strong>
              <span>{selectedOrder.location}</span>
              
              <strong style={{ color: 'var(--text-light)' }}>AC Item:</strong>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedOrder.item}</span>
              
              <strong style={{ color: 'var(--text-light)' }}>Payment:</strong>
              <span>{selectedOrder.payment}</span>
              
              <strong style={{ color: 'var(--text-light)' }}>Date:</strong>
              <span>{selectedOrder.date}</span>
              
              <strong style={{ color: 'var(--text-light)' }}>Status:</strong>
              <span className={`status-badge ${selectedOrder.status === 'PENDING' ? 'status-low' : 'status-good'}`}>{selectedOrder.status}</span>
            </div>
            
            {/* Downpayment Proof */}
            {(selectedOrder as any).downpaymentProof && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-image"></i> Proof of Downpayment
                </h4>
                <div style={{ width: '100%', maxHeight: '250px', overflow: 'hidden', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <img src={(selectedOrder as any).downpaymentProof} alt="Downpayment Proof" style={{ width: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)} style={{ padding: '0.6rem 1.2rem' }}>Close</button>
              {selectedOrder.status !== 'ACCEPTED' && (
                <button className="btn" onClick={() => handleAcceptOrder(selectedOrder)} style={{ background: 'var(--primary)', padding: '0.6rem 1.2rem' }}>Accept & Queue</button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Add Product Modal */}
    {isAddProductModalOpen && (
      <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setIsAddProductModalOpen(false); }}>
        <div className="modal-content" style={{ maxWidth: '500px', transform: 'none' }}>
          <div className="modal-header">
            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-plus"></i> Add Product to Inventory
            </h3>
            <button className="close-modal" onClick={() => setIsAddProductModalOpen(false)}><i className="fa-solid fa-times"></i></button>
          </div>
          <div className="modal-body">
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Quick fill:</span>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => {
                  const form = document.getElementById('add-product-form') as HTMLFormElement;
                  if (form) {
                    (form.elements.namedItem('category') as HTMLSelectElement).value = 'Spare Parts';
                    (form.elements.namedItem('sku') as HTMLInputElement).value = 'PART-';
                    (form.elements.namedItem('sku') as HTMLInputElement).focus();
                  }
                }}
              >
                <i className="fa-solid fa-wrench" style={{ marginRight: '4px' }}></i> Spare Part
              </button>
            </div>
            <form id="add-product-form" onSubmit={handleAddProductSubmit}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Image</label>
                  <div style={{ 
                    width: '100%', height: '120px', border: '1px dashed var(--border-color)', borderRadius: '6px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)',
                    overflow: 'hidden', position: 'relative', cursor: 'pointer'
                  }}>
                    {newProductImage ? (
                      <img src={newProductImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                        <i className="fa-solid fa-image" style={{ fontSize: '1.5rem', marginBottom: '4px' }}></i><br/>Upload
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setNewProductImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ flex: 1, display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Item Code (SKU)</label>
                    <input 
                      type="text" 
                      name="sku" 
                      list="inventory-skus"
                      required 
                      style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }} 
                      placeholder="e.g. AC-INV-99" 
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        e.target.value = val;
                        // Auto-fill form if SKU exists
                        const existing = inventory.find(i => i.sku.toUpperCase() === val || i.sku.toUpperCase().startsWith(val + '-'));
                        if (existing) {
                          const form = e.target.closest('form') as HTMLFormElement;
                          if (form) {
                            const brandInput = form.elements.namedItem('brand') as HTMLInputElement;
                            const modelInput = form.elements.namedItem('model') as HTMLInputElement;
                            const categorySelect = form.elements.namedItem('category') as HTMLSelectElement;
                            const priceInput = form.elements.namedItem('price') as HTMLInputElement;
                            if (brandInput && !brandInput.value) brandInput.value = existing.brand;
                            if (modelInput && !modelInput.value) modelInput.value = existing.model;
                            if (categorySelect && existing.category) categorySelect.value = existing.category;
                            if (priceInput && !priceInput.value) priceInput.value = existing.price.toString();
                            if (existing.image) setNewProductImage(existing.image);
                          }
                        }
                      }}
                    />
                    <datalist id="inventory-skus">
                      {inventory.map(item => (
                        <option key={item.id} value={item.sku.split('-NEW')[0].split('-2ND')[0].split('-OH')[0]}>
                          {item.brand} {item.model}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Brand</label>
                    <input type="text" name="brand" required style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }} placeholder="e.g. Carrier" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Model / Description</label>
                  <input type="text" name="model" required style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }} placeholder="e.g. Premium Inverter (1.5 HP)" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
                  <select name="category" required style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <option value="Split Type AC">Split Type AC</option>
                    <option value="Window Type AC">Window Type AC</option>
                    <option value="Floor Standing AC">Floor Standing AC</option>
                    <option value="Pre-Owned AC">Pre-Owned AC</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Parts & Accessories">Parts & Accessories</option>
                    <option value="Tools">Tools</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Condition</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['Brand New', 'Second Hand', 'On-Hand'].map(cond => (
                      <label key={cond} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '6px',
                        cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s',
                      }}>
                        <input type="radio" name="condition" value={cond} defaultChecked={cond === 'Brand New'} style={{ accentColor: 'var(--primary)' }} />
                        {cond}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Initial Stock</label>
                    <input type="number" name="stock" required min="0" style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Price (₱)</label>
                    <input type="number" name="price" required min="0" step="0.01" style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }} placeholder="0.00" />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0, 155, 213, 0.05)', border: '1px solid rgba(0, 155, 213, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <input type="checkbox" name="publishToStorefront" id="publishToStorefront" style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                <label htmlFor="publishToStorefront" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                  <strong>Publish to Landing Page</strong><br/>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Make this product visible and purchasable on the public storefront.</span>
                </label>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddProductModalOpen(false)} style={{ padding: '0.6rem 1.2rem' }}>Cancel</button>
                <button type="submit" className="btn" style={{ background: 'var(--primary)', padding: '0.6rem 1.2rem' }}>Add Product</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* Installment Review / Payment Modal */}
    {selectedInstallment && (
      <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setSelectedInstallment(null); }}>
        <div className="modal-content" style={{ maxWidth: '600px', transform: 'none' }}>
          
          {/* Payment Modal View */}
          {(selectedInstallment as any).isPayment ? (
            <>
              <div className="modal-header">
                <h3 style={{ margin: 0, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-file-invoice-dollar"></i> Process Payment Receipt
                </h3>
                <button className="close-modal" onClick={() => setSelectedInstallment(null)}><i className="fa-solid fa-times"></i></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--text-light)' }}>Application:</strong>
                  <span>{selectedInstallment.appId} - {selectedInstallment.name}</span>
                  <strong style={{ color: 'var(--text-light)' }}>Item:</strong>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedInstallment.item}</span>
                  <strong style={{ color: 'var(--text-light)' }}>Term:</strong>
                  <span>{selectedInstallment.term} Months</span>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  alert(`Payment of ₱${(e.target as any).amount.value} posted successfully for ${selectedInstallment.name}!\nReceipt Reference: ${(e.target as any).reference.value}`);
                  setSelectedInstallment(null);
                }}>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Payment Amount (₱)</label>
                        <input type="number" name="amount" required min="1" step="0.01" style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }} placeholder="e.g. 2500" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Payment Method</label>
                        <select name="method" required style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <option value="Cash">Cash (In-store)</option>
                          <option value="GCash">GCash / Maya</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Post-Dated Cheque</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Reference / Receipt No.</label>
                      <input type="text" name="reference" required style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }} placeholder="e.g. OR-991823" defaultValue={`OR-${Math.floor(100000 + Math.random() * 900000)}`} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Remarks (Optional)</label>
                      <input type="text" name="remarks" style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }} placeholder="E.g. Advance payment for 2 months" />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedInstallment(null)} style={{ padding: '0.6rem 1.2rem' }}>Cancel</button>
                    <button type="submit" className="btn" style={{ background: 'var(--accent-green)', padding: '0.6rem 1.2rem' }}>
                      <i className="fa-solid fa-print"></i> Post & Generate Receipt
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* Standard Review Modal View */
            <>
              <div className="modal-header">
                <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-file-signature"></i> Review Installment Application
                </h3>
                <button className="close-modal" onClick={() => setSelectedInstallment(null)}><i className="fa-solid fa-times"></i></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', marginBottom: '0.8rem', fontSize: '0.95rem' }}>
                  <strong style={{ color: 'var(--text-light)' }}>Application ID:</strong>
                  <span>{selectedInstallment.appId}</span>
                  
                  <strong style={{ color: 'var(--text-light)' }}>Customer Name:</strong>
                  <span style={{ fontWeight: 600 }}>{selectedInstallment.name}</span>
                  
                  <strong style={{ color: 'var(--text-light)' }}>AC Item:</strong>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedInstallment.item}</span>
                  
                  <strong style={{ color: 'var(--text-light)' }}>Plan Term:</strong>
                  <span>{selectedInstallment.term} Months</span>

                  <strong style={{ color: 'var(--text-light)' }}>Employer:</strong>
                  <span>{selectedInstallment.employer}</span>
                  
                  <strong style={{ color: 'var(--text-light)' }}>Monthly Income:</strong>
                  <span>₱{selectedInstallment.income}</span>
                  
                  <strong style={{ color: 'var(--text-light)' }}>Valid ID:</strong>
                  <span>{selectedInstallment.idType}</span>

                  {selectedInstallment.location && (
                    <>
                      <strong style={{ color: 'var(--text-light)' }}>Location:</strong>
                      <span>{selectedInstallment.location}</span>
                    </>
                  )}


                  {selectedInstallment.status === 'REPENDING' && (
                     <>
                      <strong style={{ color: 'var(--accent-red)' }}>Current Issue:</strong>
                      <span style={{ color: 'var(--accent-red)' }}>{selectedInstallment.issue}</span>
                    </>
                  )}
                </div>
                
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={async () => {
                      const reason = await prompt({
                        title: 'Decline Application',
                        message: 'Enter the reason for declining this application:',
                        placeholder: 'Reason for declining'
                      });
                      if (reason) handleInstallmentAction(selectedInstallment, 'REJECTED', reason);
                    }} 
                    style={{ padding: '0.6rem 1.2rem', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
                  >
                    <i className="fa-solid fa-xmark"></i> Decline
                  </button>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => setSelectedInstallment(null)} style={{ padding: '0.6rem 1.2rem' }}>Cancel</button>
                    <button className="btn" onClick={() => handleInstallmentAction(selectedInstallment, 'COMPLETED')} style={{ background: '#28a745', padding: '0.6rem 1.2rem' }}>
                      <i className="fa-solid fa-check"></i> Approve
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )}

</>
  );
}