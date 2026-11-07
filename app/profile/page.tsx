'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useConfirmModal } from '@/components/ConfirmModal';
import { products as fallbackProducts } from '@/lib/products';
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal';

interface DBProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  sold: number;
  image: string;
  badge: string | null;
  specs: string[];
  description: string | null;
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
}

export default function ProfilePage() {
  const router = useRouter();
  const { confirm, showAlert, ModalComponent } = useConfirmModal();

  // Landing page becomes dashboard
  const [activeTab, setActiveTab] = useState('tab-dashboard');
  const [sidebarActive, setSidebarActive] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // User state
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Data lists
  const [orders, setOrders] = useState<any[]>([]);
  const [registeredACs, setRegisteredACs] = useState<any[]>([]);
  const [dispatch, setDispatch] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [selectedInstallmentDetails, setSelectedInstallmentDetails] = useState<{ ac?: any; inst?: any; fin: any } | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Store products state inside dashboard
  const [storeInventory, setStoreInventory] = useState<DBProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Featured');
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Downpayment state for store products
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [showDownpaymentModal, setShowDownpaymentModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<{
    name: string;
    price: number;
    brand?: string;
    image?: string;
    productId?: string;
  } | null>(null);

  // My AC selection & service
  const [selectedAcIds, setSelectedAcIds] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState('Regular Cleaning (₱900)');
  const [serviceNotes, setServiceNotes] = useState('');

  // Edit AC Modal State
  const [editingAc, setEditingAc] = useState<any | null>(null);
  const [editLocation, setEditLocation] = useState('');
  const [editBrandModel, setEditBrandModel] = useState('');
  const [editAcType, setEditAcType] = useState('Window Type');
  const [editHp, setEditHp] = useState('1.0 HP');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);

  // Register New AC in Settings
  const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [regYearAcquired, setRegYearAcquired] = useState('2025');
  const [regLat, setRegLat] = useState<number | null>(14.6091);
  const [regLng, setRegLng] = useState<number | null>(121.0223);
  const [regBrandModel, setRegBrandModel] = useState('');
  const [regAcType, setRegAcType] = useState('Window Type');
  const [regHorsepower, setRegHorsepower] = useState('1.0 HP');
  const [regAddress, setRegAddress] = useState('');

  // Enroll in Maintenance Monitoring Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollAcIds, setEnrollAcIds] = useState<string[]>([]);

  // Saved Address Book
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrFull, setNewAddrFull] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  // Customer E-Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const openOrderReceipt = (order: any) => {
    const itemName = order.item || 'Air Conditioner';
    const isSpare = /refrigerant|capacitor|copper|bracket|part|filter|freon/i.test(itemName);
    const price = order.price || (isSpare ? 2500 : 32000);
    const rData: ReceiptData = {
      receiptNo: `FT-REC-${(order.orderNo || '').replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
      orderNo: order.orderNo,
      date: order.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      customerName: userName || order.name || 'Valued Customer',
      customerEmail: userEmail || undefined,
      location: order.location,
      paymentMethod: order.payment || 'Cash on Delivery',
      status: order.status === 'Completed' ? 'Paid' : order.status,
      items: [
        {
          name: itemName,
          category: isSpare ? 'Spare Part' : 'AC Unit',
          quantity: 1,
          price: price,
          horsepower: order.hp || undefined,
        },
      ],
      subtotal: price,
      deliveryFee: 0,
      installationFee: 0,
      downpayment: order.hasDownpayment ? Math.round(price * 0.15) : undefined,
      totalAmount: price,
      notes: 'FrostTech Official Sales Order & Installation Voucher.',
      technicianName: order.assignedTech || undefined,
    };
    setSelectedReceipt(rData);
    setIsReceiptOpen(true);
  };
  const [newPassword, setNewPassword] = useState('');

  // Helper: parse installment JSON metadata for payments & paid months
  const parseInstallmentMeta = (issueStr?: string) => {
    try {
      if (!issueStr) return { paidMonths: [] as number[], payments: [] as any[] };
      const parsed = JSON.parse(issueStr);
      return {
        paidMonths: Array.isArray(parsed.paidMonths) ? parsed.paidMonths : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      };
    } catch {
      return { paidMonths: [] as number[], payments: [] as any[] };
    }
  };

  // Helper: compute financial breakdown & remaining balance for customer installment
  const getInstallmentFinancials = (inst?: any, ac?: any) => {
    let price = ac?.totalPrice || 32000;
    const lowerItem = (inst?.item || ac?.brandModel || '').toLowerCase();
    if (!ac?.totalPrice) {
      if (lowerItem.includes('chiq')) price = 18500;
      else if (lowerItem.includes('iffalcon')) price = 19900;
      else if (lowerItem.includes('tcl')) price = 16990;
      else if (lowerItem.includes('midea')) price = 26500;
      else if (lowerItem.includes('samsung')) price = 35000;
      else if (lowerItem.includes('carrier')) price = 32000;
      else if (lowerItem.includes('window')) price = 18000;
    }

    const term = inst?.term || ac?.months || 12;
    const downpayment = Math.round(price * 0.15);
    const financedAmount = price - downpayment;
    const monthlyInterestRate = 0.015;
    const totalFinancedWithInterest = Math.round(financedAmount * (1 + monthlyInterestRate * term));
    const monthlyAmortization = ac?.pricePerMonth || Math.round(totalFinancedWithInterest / term);

    const meta = parseInstallmentMeta(inst?.issue);
    const paidMonthsCount = Array.isArray(meta.paidMonths) ? meta.paidMonths.length : 0;
    const totalPaidAmortization = paidMonthsCount * monthlyAmortization;
    const remainingBalance = Math.max(0, totalFinancedWithInterest - totalPaidAmortization);
    const isFullyPaid = paidMonthsCount >= term || remainingBalance === 0;
    const progressPercent = Math.min(100, Math.round((paidMonthsCount / term) * 100));

    return {
      price,
      totalPrice: price,
      downpayment,
      financedAmount,
      term,
      monthlyAmortization,
      paidMonthsCount,
      remainingMonthsCount: Math.max(0, term - paidMonthsCount),
      totalFinancedWithInterest,
      totalPaidAmortization,
      remainingBalance,
      isFullyPaid,
      progressPercent,
      paidMonths: meta.paidMonths,
      payments: meta.payments,
    };
  };

  useEffect(() => {
    // Check hash for settings tab
    if (typeof window !== 'undefined' && window.location.hash) {
      if (window.location.hash.includes('settings')) {
        setActiveTab('tab-settings');
      } else if (window.location.hash.includes('orders')) {
        setActiveTab('tab-orders');
      } else if (window.location.hash.includes('myacs')) {
        setActiveTab('tab-myacs');
      }
    }

    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/login');
      return;
    }

    const currentUid = sessionStorage.getItem('userId') || '';
    setUserId(currentUid);
    const storedName = sessionStorage.getItem('userName') || 'Valued Customer';
    setUserName(storedName);
    setUserEmail(sessionStorage.getItem('userEmail') || 'customer@frosttech.com');
    setEditFirstName(storedName.split(' ')[0] || '');
    setEditLastName(storedName.split(' ').slice(1).join(' ') || '');

    if (currentUid) {
      fetch(`/api/orders?userId=${currentUid}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setOrders(data); })
        .catch(console.error);

      fetch(`/api/registered-acs?userId=${currentUid}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setRegisteredACs(data); })
        .catch(console.error);

      fetch(`/api/dispatch?userId=${currentUid}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setDispatch(data); })
        .catch(console.error);

      fetch(`/api/maintenance?userId=${currentUid}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setMaintenance(data); })
        .catch(console.error);

      fetch(`/api/installments?userId=${currentUid}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setInstallments(data); })
        .catch(console.error);

      fetch(`/api/addresses?userId=${currentUid}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setSavedAddresses(data); })
        .catch(console.error);

      fetch(`/api/users/customers`)
        .then((r) => r.json())
        .then((customers: any[]) => {
          const me = customers.find((c: any) => c.id === currentUid);
          if (me && me.phone && me.phone !== 'N/A') {
            setUserPhone(me.phone);
            setEditPhone(me.phone);
          }
        })
        .catch(console.error);

      fetch(`/api/user/status?userId=${currentUid}`)
        .then((r) => r.json())
        .then((data) => setIsNewCustomer(data.isNewCustomer))
        .catch(console.error);
    }

    const handleUrlSearch = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        setSearchQuery(q || '');
        if (q) {
          setTimeout(() => {
            document.getElementById('dashboard-products')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }
      }
    };

    handleUrlSearch();
    window.addEventListener('popstate', handleUrlSearch);

    // Fetch store products for dashboard
    fetch('/api/products')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: DBProduct[]) => {
        if (Array.isArray(data)) setStoreInventory(data);
      })
      .catch(() =>
        setStoreInventory(
          fallbackProducts.map((p) => ({
            ...p,
            slug: p.id,
            originalPrice: p.originalPrice ?? null,
            badge: p.badge ?? null,
            description: p.description ?? null,
            specs: p.specs ?? [],
          }))
        )
      );
  }, [router]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handlePriceChange = (priceRange: string) => {
    setSelectedPrices((prev) => (prev.includes(priceRange) ? prev.filter((p) => p !== priceRange) : [...prev, priceRange]));
  };

  const addToCart = async (name: string, price: number, brand?: string, image?: string, productId?: string, skipModal?: boolean) => {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
      window.location.href = '/login';
      return;
    }

    // Check if it's an AC (price > 10000 heuristic)
    if (price > 10000 && !skipModal) {
      let isNew = isNewCustomer;
      if (userId) {
        try {
          const res = await fetch(`/api/user/status?userId=${userId}`);
          const data = await res.json();
          isNew = data.isNewCustomer;
          setIsNewCustomer(isNew);
        } catch (e) {}
      } else {
        isNew = true;
      }

      if (isNew) {
        setPendingCartItem({ name, price, brand, image, productId });
        setShowDownpaymentModal(true);
        return;
      }
    }

    const actualProductId = productId || 'PROD-' + Date.now();
    const itemImage = image || '/hero-bg.png';
    const itemBrand = brand || '';

    // 1. Always update local storage for immediate UI responsiveness & Header count
    try {
      const cart = JSON.parse(localStorage.getItem('frostTechCart') || '[]');
      const existing = cart.find((i: any) => i.productId === actualProductId || i.name === name);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id: Date.now(), productId: actualProductId, name, brand: itemBrand, price, quantity: 1, image: itemImage, addedAt: Date.now() });
      }
      localStorage.setItem('frostTechCart', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.error('Local cart error:', e);
    }

    // 2. If logged in, sync to database & reduce inventory stock
    if (userId) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            productId: actualProductId,
            name,
            brand: itemBrand,
            price,
            image: itemImage,
            quantity: 1,
          }),
        });
      } catch (err) {
        console.error('Failed to add to cart API', err);
      }
    }

    showToast(`${name} added to cart!`);
  };

  const defaultBrands = ['Carrier', 'Chiq', 'iFFALCON', 'Midea', 'Samsung', 'TCL'];
  const availableBrands = Array.from(
    new Set([
      ...defaultBrands,
      ...storeInventory.map((p) => p.brand).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const filteredProducts = storeInventory.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const specsString = (item.specs || []).join(' ').toLowerCase();
    const descString = (item.description || '').toLowerCase();
    const brandLower = (item.brand || '').toLowerCase();
    const nameLower = (item.name || '').toLowerCase();
    const catLower = (item.category || '').toLowerCase();

    const matchesSearch =
      !q ||
      brandLower.includes(q) ||
      nameLower.includes(q) ||
      catLower.includes(q) ||
      specsString.includes(q) ||
      descString.includes(q);

    const matchesBrand = selectedBrands.length === 0 || selectedBrands.some(b => b.toLowerCase() === (item.brand || '').toLowerCase());
    const isSpareCategory = item.category === 'Parts' || item.category === 'Spare Parts' || item.category === 'Parts & Accessories';

    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                    (selectedCategory === 'Spare Parts' && isSpareCategory);

    const matchesPrice =
      selectedPrices.length === 0 ||
      selectedPrices.some((range) => {
        if (range === 'under-20k') return item.price < 20000;
        if (range === '20k-40k') return item.price >= 20000 && item.price <= 40000;
        if (range === '40k-60k') return item.price > 40000 && item.price <= 60000;
        if (range === 'over-60k') return item.price > 60000;
        return false;
      });

    const matchesType =
      selectedTypes.length === 0 ||
      selectedTypes.some((type) => {
        if (type === 'Spare Parts') return isSpareCategory;
        if (type === 'Air Conditioners') return !isSpareCategory;
        return false;
      });

    return matchesSearch && matchesBrand && matchesCategory && matchesPrice && matchesType;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'Price, low to high':
        return a.price - b.price;
      case 'Price, high to low':
        return b.price - a.price;
      case 'Best Selling':
        return b.sold - a.sold;
      case 'Date, new to old':
        return b.rating - a.rating;
      case 'Featured':
      default:
        return 0;
    }
  });


  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth <= 768) {
      setSidebarActive(false);
    }
  };

  // Toggle AC selection for multi-service booking
  const toggleAcSelect = (id: string) => {
    setSelectedAcIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllAcs = () => {
    if (selectedAcIds.length === registeredACs.length) {
      setSelectedAcIds([]);
    } else {
      setSelectedAcIds(registeredACs.map((ac) => ac.id));
    }
  };

  // Multi-AC Service request
  const handleRequestServiceForSelected = async () => {
    if (selectedAcIds.length === 0) {
      showAlert({ title: 'Select AC', message: 'Please check at least one AC container to request service.', type: 'warning' });
      return;
    }

    const selectedUnits = registeredACs.filter((ac) => selectedAcIds.includes(ac.id));
    const unitNames = selectedUnits.map((u) => `${u.location} (${u.brandModel})`).join(', ');

    const isConfirmed = await confirm({
      title: 'Confirm Service Request',
      message: `Request "${selectedService}" for ${selectedUnits.length} AC unit(s):\n${unitNames}?`,
      confirmText: 'Request Service',
    });
    if (!isConfirmed) return;

    try {
      for (const unit of selectedUnits) {
        await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleNo: 'SRV-' + Math.floor(1000 + Math.random() * 9000),
            customerId: userId,
            name: userName,
            phone: userPhone || '09XXXXXXXXX',
            address: unit.fullAddress || unit.location || 'Customer Address',
            item: `${unit.brandModel} (${unit.horsepower})`,
            serviceType: selectedService.split(' (')[0],
            scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] + ' 09:00',
            status: 'SCHEDULED',
            notes: serviceNotes || `Multi-AC request for ${unit.location}`,
          }),
        });
      }

      showToast(`Service requested for ${selectedUnits.length} AC unit(s)!`);
      setSelectedAcIds([]);
      setServiceNotes('');
      // Refresh maintenance list
      fetch(`/api/maintenance?userId=${userId}`).then(r => r.json()).then(setMaintenance).catch(console.error);
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to submit service request.', type: 'error' });
    }
  };

  // Edit AC details
  const openEditAcModal = (ac: any) => {
    setEditingAc(ac);
    setEditLocation(ac.location || '');
    setEditBrandModel(ac.brandModel || '');
    setEditAcType(ac.acType || 'Window Type');
    setEditHp(ac.horsepower || '1.0 HP');
    setEditAddress(ac.fullAddress || '');
    setEditLat(ac.lat || null);
    setEditLng(ac.lng || null);
  };

  const handleSaveAcEdit = async () => {
    if (!editingAc) return;
    try {
      const res = await fetch('/api/registered-acs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAc.id,
          location: editLocation,
          brandModel: editBrandModel,
          acType: editAcType,
          horsepower: editHp,
          fullAddress: editAddress,
          lat: editLat,
          lng: editLng,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRegisteredACs((prev) => prev.map((ac) => (ac.id === editingAc.id ? updated : ac)));
        setEditingAc(null);
        showToast('AC details updated successfully!');
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to update AC information.', type: 'error' });
    }
  };

  // Open Enroll Modal (pre-selects ACs checked on dashboard cards)
  const openEnrollModal = (singleAcId?: string) => {
    if (singleAcId) {
      setEnrollAcIds([singleAcId]);
    } else if (selectedAcIds.length > 0) {
      const eligibleSelected = selectedAcIds.filter((id) => {
        const u = registeredACs.find((a) => a.id === id);
        return u && !u.isEnrolledMaintenance;
      });
      setEnrollAcIds(eligibleSelected.length > 0 ? eligibleSelected : selectedAcIds);
    } else {
      const eligible = registeredACs.filter((ac) => !ac.isEnrolledMaintenance).map((ac) => ac.id);
      setEnrollAcIds(eligible);
    }
    setShowEnrollModal(true);
  };

  const toggleEnrollAcId = (id: string) => {
    setEnrollAcIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAllEnrollAcs = () => {
    const eligible = registeredACs.filter((ac) => !ac.isEnrolledMaintenance).map((ac) => ac.id);
    if (enrollAcIds.length === eligible.length) {
      setEnrollAcIds([]);
    } else {
      setEnrollAcIds(eligible);
    }
  };

  // Enroll in Maintenance Monitoring (supports enrolling multiple selected AC units at once)
  const handleEnrollAc = async (specificIds?: string[]) => {
    const targetIds = specificIds || enrollAcIds;
    const eligibleUnits = registeredACs.filter((a) => targetIds.includes(a.id) && !a.isEnrolledMaintenance);

    if (eligibleUnits.length === 0) {
      showAlert({ title: 'Select AC Units', message: 'Please select at least one eligible AC unit to enroll.', type: 'warning' });
      return;
    }

    try {
      const sixMonthsDate = new Date();
      sixMonthsDate.setMonth(sixMonthsDate.getMonth() + 6);
      const scheduledDateStr = sixMonthsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      for (const targetAc of eligibleUnits) {
        // 1. Update RegisteredAC record
        await fetch('/api/registered-acs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetAc.id,
            isEnrolledMaintenance: true,
            enrolledAt: new Date().toISOString(),
          }),
        });

        // 2. Connect and create MaintenanceSchedule record so Admin & System track it
        await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleNo: 'MNT-' + Math.floor(1000 + Math.random() * 9000),
            customerId: userId,
            name: userName,
            phone: userPhone || '09XXXXXXXXX',
            address: targetAc.fullAddress || targetAc.location || 'Customer Address',
            item: `${targetAc.brandModel} (${targetAc.horsepower}) - ${targetAc.location}`,
            serviceType: 'Routine 6-Month Maintenance Inspection',
            scheduledDate: scheduledDateStr,
            status: 'SCHEDULED',
            notes: 'Automated 6-month maintenance monitoring for enrolled unit.',
          }),
        });
      }

      // 3. Update local states
      const enrolledIds = eligibleUnits.map((u) => u.id);
      setRegisteredACs((prev) =>
        prev.map((ac) => (enrolledIds.includes(ac.id) ? { ...ac, isEnrolledMaintenance: true, enrolledAt: new Date().toISOString() } : ac))
      );

      // Deselect enrolled units from selectedAcIds
      setSelectedAcIds((prev) => prev.filter((id) => !enrolledIds.includes(id)));

      if (userId) {
        const mRes = await fetch(`/api/maintenance?userId=${userId}`);
        const mData = await mRes.json();
        if (Array.isArray(mData)) setMaintenance(mData);
      }

      setShowEnrollModal(false);
      setEnrollAcIds([]);
      showToast(`${eligibleUnits.length} AC unit(s) enrolled for 6-month maintenance monitoring! Next routine check: ${scheduledDateStr}`);
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to enroll ACs for maintenance monitoring.', type: 'error' });
    }
  };

  // Unenroll from Maintenance Monitoring
  const handleUnenrollAc = async (ac: any) => {
    const isConfirmed = await confirm({
      title: 'Cancel Maintenance Monitoring',
      message: `Stop automated 6-month maintenance monitoring for "${ac.brandModel} (${ac.location})"?`,
      confirmText: 'Unenroll Unit',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/registered-acs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ac.id,
          isEnrolledMaintenance: false,
          enrolledAt: null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRegisteredACs((prev) => prev.map((a) => (a.id === ac.id ? updated : a)));
        showToast('AC unit unenrolled from maintenance monitoring.');
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to unenroll AC.', type: 'error' });
    }
  };

  // Register New AC in Settings
  const handleRegisterNewAc = async () => {
    if (!regBrandModel) {
      showAlert({ title: 'Validation Error', message: 'Please provide the Brand & Model of your AC unit.', type: 'warning' });
      return;
    }

    const currentUid = userId || (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null) || 'guest-customer';

    try {
      const res = await fetch('/api/registered-acs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUid,
          brandModel: regBrandModel,
          acType: regAcType,
          horsepower: regHorsepower,
          yearAcquired: regYearAcquired,
          lat: regLat,
          lng: regLng,
          fullAddress: regAddress || 'Customer Registered Location',
          paymentType: 'Manual Add',
          purchasedFromStore: false,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setRegisteredACs((prev) => [saved, ...prev]);
        setRegBrandModel('');
        setRegAddress('');
        setRegYearAcquired('2025');
        setShowRegisterForm(false);
        showToast('New AC successfully registered!');

        if (currentUid && currentUid !== 'guest-customer') {
          fetch('/api/registered-acs?userId=' + currentUid)
            .then((r) => r.json())
            .then((data) => {
              if (Array.isArray(data)) setRegisteredACs(data);
            })
            .catch(console.error);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert({ title: 'Registration Failed', message: errData.error || 'Could not register AC unit.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to register AC. Please check network connection.', type: 'error' });
    }
  };

  // Update Password
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      showAlert({ title: 'Required', message: 'Please fill out both password fields.', type: 'warning' });
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });

      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        showToast('Password updated successfully!');
      } else {
        const data = await res.json();
        showAlert({ title: 'Error', message: data.error || 'Failed to update password', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Error updating password', type: 'error' });
    }
  };

  return (
    <>
      <Header />
      <ModalComponent />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #052e80 0%, #0b3080 100%)',
            color: 'white',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '0.92rem',
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      <section className="profile-container" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
        {/* Mobile Backdrop */}
        <div className={`sidebar-backdrop ${sidebarActive ? 'show' : ''}`} onClick={() => setSidebarActive(false)}></div>

        {/* Mobile Toggle */}
        <div className="mobile-only" style={{ position: 'fixed', top: '75px', left: '10px', zIndex: 40, width: '40px', height: '40px' }}>
          <button
            onClick={toggleSidebar}
            style={{
              background: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.2rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
            }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        {/* Profile Sidebar */}
        <aside
          className={`profile-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${sidebarActive ? 'mobile-active' : ''}`}
          style={{
            width: isSidebarCollapsed ? '70px' : '260px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: '1.5rem 0.8rem',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.4rem' }}>
            {!isSidebarCollapsed && (
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Customer Space
              </h3>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className={`fa-solid ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
            </button>
          </div>

          {/* User mini badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0.8rem',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #052e80 0%, #0b3080 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {userName}
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {userEmail}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); changeTab('tab-dashboard'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-dashboard' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-dashboard' ? '#e0f2fe' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <i className="fa-solid fa-gauge" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isSidebarCollapsed && <span>Dashboard</span>}
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); changeTab('tab-orders'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-orders' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-orders' ? '#e0f2fe' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <i className="fa-solid fa-box-open" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isSidebarCollapsed && <span>My Orders</span>}
                {!isSidebarCollapsed && orders.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#e2e8f0', color: '#0f172a', padding: '2px 7px', borderRadius: '999px', fontSize: '0.75rem' }}>
                    {orders.length}
                  </span>
                )}
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); changeTab('tab-myacs'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-myacs' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-myacs' ? '#e0f2fe' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <i className="fa-solid fa-snowflake" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isSidebarCollapsed && <span>My AC Units</span>}
                {!isSidebarCollapsed && registeredACs.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#0284c7', color: 'white', padding: '2px 7px', borderRadius: '999px', fontSize: '0.75rem' }}>
                    {registeredACs.length}
                  </span>
                )}
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); changeTab('tab-settings'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-settings' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-settings' ? '#e0f2fe' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <i className="fa-solid fa-gear" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isSidebarCollapsed && <span>Settings</span>}
              </a>
            </li>
          </ul>
        </aside>

        {/* Main Content Area */}
        <main className={`profile-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ overflowY: 'auto' }}>
          {/* TAB 1: DASHBOARD -> STOREFRONT LANDING PAGE */}
          {activeTab === 'tab-dashboard' && (
            <div>
              {/* Category Navigation Bar */}
              <nav className="category-nav" style={{ borderRadius: '12px', marginBottom: '1.5rem', background: '#c8e0fc', border: '1px solid #b9d4f6', padding: '0.85rem 1.5rem' }}>
                <ul className="nav-links" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.8rem', listStyle: 'none', margin: 0, padding: 0 }}>
                  <li className={selectedCategory === 'All' ? 'active' : ''}>
                    <a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('All'); document.getElementById('dashboard-products')?.scrollIntoView({ behavior: 'smooth' }); }}>
                      All Air Conditioners
                    </a>
                  </li>
                  <li className={selectedCategory === 'Window' ? 'active' : ''}>
                    <a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Window'); document.getElementById('dashboard-products')?.scrollIntoView({ behavior: 'smooth' }); }}>
                      Window Type
                    </a>
                  </li>
                  <li className={selectedCategory === 'Split' ? 'active' : ''}>
                    <a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Split'); document.getElementById('dashboard-products')?.scrollIntoView({ behavior: 'smooth' }); }}>
                      Split Type Inverter
                    </a>
                  </li>
                  <li className={selectedCategory === 'Floor' ? 'active' : ''}>
                    <a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Floor'); document.getElementById('dashboard-products')?.scrollIntoView({ behavior: 'smooth' }); }}>
                      Floor Standing
                    </a>
                  </li>
                  
                  <li className={selectedCategory === 'Spare Parts' ? 'active' : ''}>
                    <a href="#products" onClick={(e) => { e.preventDefault(); setSelectedCategory('Spare Parts'); document.getElementById('dashboard-products')?.scrollIntoView({ behavior: 'smooth' }); }}>
                      Spare Parts
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/feedback"
                      style={{
                        color: '#052e80',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#e0effe',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #bae0fd',
                      }}
                    >
                      <i className="fa-solid fa-comments" style={{ color: '#0284c7' }}></i> Customer Feedback
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* Promotional Shopee-Style Banner */}
              <section className="shopee-banner-section" style={{ padding: 0, marginBottom: '2rem', maxWidth: '100%' }}>
                <div className="shopee-main-banner">
                  <div className="main-banner-content">
                    <span className="badge">FREE SHIPPING ARAW-ARAW</span>
                    <h2>LESS GASTOS WHEN YOU<br />SHOP FROM HOME!</h2>
                    <p>UNLI ₱249 MIN. SPEND • Free Standard Installation</p>
                    <a href="#dashboard-products" className="btn" onClick={(e) => { e.preventDefault(); document.getElementById('dashboard-products')?.scrollIntoView({ behavior: 'smooth' }); }}>
                      Shop Now &rarr;
                    </a>
                  </div>
                  <img src="/hero-bg.png" alt="Main AC Promo" className="main-banner-img" />

                  {/* Carousel Dots */}
                  <div className="carousel-dots">
                    <span className="dot active"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>

                <div className="shopee-side-banners">
                  <div className="side-banner side-banner-top">
                    <div className="side-banner-content">
                      <h4><i className="fa-solid fa-shield-heart"></i> FrostCare Protect</h4>
                      <p>EXTENDED WARRANTY FOR<br />CRITICAL BREAKDOWNS</p>
                      <span className="small-text">Up to ₱50,000 coverage</span>
                    </div>
                    <img src="/service-bg.png" alt="FrostCare" className="side-banner-img" />
                  </div>
                  <div className="side-banner side-banner-bottom">
                    <div className="side-banner-content">
                      <h4><i className="fa-solid fa-building-columns"></i> Metrobank</h4>
                      <p>EXTRA ₱1,500 OFF<br /><span className="highlight">EVERY FRIDAY</span></p>
                      <div className="tags">
                        <span><i className="fa-solid fa-truck"></i> Free Ship</span>
                        <span><i className="fa-solid fa-tags"></i> Vouchers</span>
                      </div>
                    </div>
                    <img src="/hero-bg.png" alt="Bank Promo" className="side-banner-img" />
                  </div>
                </div>
              </section>

              {/* Main Products Section */}
              <section id="dashboard-products" className="store-layout" style={{ padding: 0 }}>
                {/* Sidebar Filters */}
                <aside className={`sidebar-filters ${mobileFiltersOpen ? 'active' : ''}`} style={{ top: '80px' }}>
                  <h3>
                    <i className="fa-solid fa-filter"></i> Filters
                  </h3>

                  {/* Product Type Filter */}
                  <div className="filter-section">
                    <div className="filter-title">
                      <span>Product Type</span>
                      <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    {['Air Conditioners', 'Spare Parts'].map((type) => (
                      <label key={type} className="filter-option">
                        <input
                          type="checkbox"
                          value={type}
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeChange(type)}
                        /> {type}
                      </label>
                    ))}
                  </div>

                  {/* Brand Filter */}
                  <div className="filter-section">
                    <div className="filter-title">
                      <span>Brand</span>
                      <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    {availableBrands.map((brand) => (
                      <label key={brand} className="filter-option">
                        <input
                          type="checkbox"
                          className="brand-filter"
                          value={brand}
                          checked={selectedBrands.some((b) => b.toLowerCase() === brand.toLowerCase())}
                          onChange={() => handleBrandChange(brand)}
                        /> {brand}
                      </label>
                    ))}
                  </div>

                  {/* Price Filter */}
                  <div className="filter-section">
                    <div className="filter-title">
                      <span>Price Range</span>
                      <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    <label className="filter-option">
                      <input type="checkbox" checked={selectedPrices.includes('under-20k')} onChange={() => handlePriceChange('under-20k')} /> Under ₱20,000
                    </label>
                    <label className="filter-option">
                      <input type="checkbox" checked={selectedPrices.includes('20k-40k')} onChange={() => handlePriceChange('20k-40k')} /> ₱20,000 - ₱40,000
                    </label>
                    <label className="filter-option">
                      <input type="checkbox" checked={selectedPrices.includes('40k-60k')} onChange={() => handlePriceChange('40k-60k')} /> ₱40,000 - ₱60,000
                    </label>
                    <label className="filter-option">
                      <input type="checkbox" checked={selectedPrices.includes('over-60k')} onChange={() => handlePriceChange('over-60k')} /> Over ₱60,000
                    </label>
                  </div>
                </aside>

                {/* Main Product Area */}
                <div className="product-display">
                  {/* Top Toolbar */}
                  <div className="product-toolbar" style={{ background: '#0284c7', color: 'white', padding: '0.9rem 1.4rem', borderRadius: '12px' }}>
                    <div className="toolbar-count" style={{ color: 'white', fontWeight: 600 }}>
                      Showing {sortedProducts.length} products
                    </div>
                    <div className="toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        id="mobile-filter-btn"
                        className="btn btn-secondary mobile-only"
                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                      >
                        <i className="fa-solid fa-filter"></i> Filters
                      </button>
                      <div className="sort-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ color: 'white', fontWeight: 600 }}>Sort By:</label>
                        <select
                          className="sort-select"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          style={{ borderRadius: '8px', padding: '0.35rem 0.75rem', border: 'none', background: 'white', color: '#0f172a', fontWeight: 600 }}
                        >
                          <option>Featured</option>
                          <option>Best Selling</option>
                          <option>Price, low to high</option>
                          <option>Price, high to low</option>
                          <option>Date, new to old</option>
                        </select>
                      </div>
                      <div className="view-toggles" style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                          onClick={() => setViewMode('grid')}
                          style={{ background: viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.2)', color: viewMode === 'grid' ? '#0284c7' : 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-table-cells"></i>
                        </button>
                        <button
                          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setViewMode('list')}
                          style={{ background: viewMode === 'list' ? 'white' : 'rgba(255,255,255,0.2)', color: viewMode === 'list' ? '#0284c7' : 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-list"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {searchQuery.trim() && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1.25rem',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '12px',
                        marginBottom: '1.25rem',
                        fontSize: '0.9rem',
                        color: '#0369a1',
                        boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <span>
                          Search results for: <strong>"{searchQuery}"</strong> ({sortedProducts.length} product{sortedProducts.length === 1 ? '' : 's'} found)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          router.push('/profile');
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <i className="fa-solid fa-xmark"></i> Clear Search
                      </button>
                    </div>
                  )}

                  {/* Product Grid */}
                  <div className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`} id="dynamic-products">
                    {sortedProducts.length === 0 ? (
                      <div className="empty-cart-msg" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
                        <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.5rem', color: '#cbd5e1', display: 'block', marginBottom: '1rem' }}></i>
                        <h3 style={{ margin: '0 0 0.5rem', color: '#334155', fontSize: '1.2rem' }}>No products found</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                          {searchQuery.trim()
                            ? `We couldn't find any products matching "${searchQuery}". Try different keywords or clear your search.`
                            : 'No products match your selected filters.'}
                        </p>
                        {searchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              router.push('/profile');
                            }}
                            className="btn btn-secondary"
                            style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <i className="fa-solid fa-arrow-rotate-left"></i> Clear Search
                          </button>
                        )}
                      </div>
                    ) : (
                      sortedProducts.map((item) => {
                        const price = item.price;
                        const imgPlaceholder = item.image;

                        return (
                          <div
                            key={item.id}
                            className="product-card"
                            onClick={() => router.push(`/product/${item.slug || item.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="product-image-wrapper">
                              {item.badge && <span className="product-badge">{item.badge}</span>}
                              <img src={imgPlaceholder} alt={item.name} className="product-image" />
                              <div className="product-tag-row">
                                {(item as any).horsepower && (
                                  <span className="product-hp-tag">
                                    <i className="fa-solid fa-bolt"></i> {(item as any).horsepower}
                                  </span>
                                )}
                                {item.category && !['Parts', 'Spare Parts', 'Parts & Accessories'].includes(item.category) && (
                                  <span className={`product-type-tag ${item.category.toLowerCase().includes('inverter') ? 'inverter' : ''}`}>
                                    {item.category.toLowerCase().includes('inverter') ? '⚡ Inverter' : item.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="product-card-body">
                              <div className="product-brand">{item.brand}</div>
                              <h3 className="product-title">{item.name}</h3>
                              <div className="product-price">
                                {(item as any).variants && (item as any).variants.length > 1 && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginRight: '4px' }}>From</span>
                                )}
                                ₱ {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                {item.originalPrice && item.originalPrice > price && (
                                  <span className="original-price">
                                    ₱ {item.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                              <div className="product-rating">
                                <span className="stars">
                                  {'★'.repeat(Math.floor(item.rating))}{'☆'.repeat(5 - Math.floor(item.rating))}
                                </span>
                                <span>{item.rating}</span>
                                <span className="sold-count">&bull; {item.sold} sold</span>
                              </div>
                              {(() => {
                                const totalStock = (item as any).variants ? (item as any).variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) : 0;
                                if (totalStock > 5) return <div className="product-stock-status in-stock"><i className="fa-solid fa-circle-check"></i> In Stock</div>;
                                if (totalStock > 0) return <div className="product-stock-status low-stock"><i className="fa-solid fa-triangle-exclamation"></i> Only {totalStock} left</div>;
                                return <div className="product-stock-status out-of-stock"><i className="fa-solid fa-circle-xmark"></i> Out of Stock</div>;
                              })()}
                              <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                                <Link href={`/product/${item.slug || item.id}`} className="btn btn-secondary">
                                  <i className="fa-solid fa-eye"></i> Details
                                </Link>
                                <button className="btn btn-buy" onClick={(e) => { e.stopPropagation(); addToCart(`${item.brand} ${item.name}`, price, item.brand, imgPlaceholder, item.id); }}>
                                  <i className="fa-solid fa-cart-plus"></i> Add to Cart
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* TAB 2: MY ORDERS (WITH 3-DAY TIMER) */}
          {activeTab === 'tab-orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>My Orders</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Track your successful store orders and delivery dispatch scheduling.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}></i>
                  <h3 style={{ color: '#0f172a', margin: '0 0 0.5rem' }}>No orders placed yet</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Browse air conditioners or spare parts to place your first order.</p>
                  <Link href="/" className="btn" style={{ display: 'inline-block', marginTop: '1rem' }}>
                    Shop Now
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {orders.map((order) => {
                    const dispatchItem = dispatch.find((d) => (d.notes && d.notes.includes(order.orderNo)) || d.item === order.item);
                    const isDispatchCompleted = dispatchItem?.status?.toUpperCase() === 'COMPLETED';
                    const isOrderCompleted = order.status?.toLowerCase() === 'completed' || isDispatchCompleted;
                    const isCashOnArrival = order.payment?.toLowerCase().includes('cash');
                    const isPaid = order.hasDownpayment || isOrderCompleted;

                    return (
                      <div
                        key={order.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>
                                Order {order.orderNo}
                              </h3>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  fontWeight: 700,
                                  background: order.status === 'Cancelled' ? '#fee2e2' : isOrderCompleted ? '#dcfce7' : '#e0f2fe',
                                  color: order.status === 'Cancelled' ? '#dc2626' : isOrderCompleted ? '#16a34a' : '#0284c7',
                                }}
                              >
                                {isOrderCompleted ? 'COMPLETED' : order.status}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Date Placed: {order.date}</span>
                          </div>

                          {/* Payment status badge */}
                          <div>
                            {isPaid ? (
                              <span style={{ background: '#dcfce7', color: '#16a34a', padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
                                <i className="fa-solid fa-check-circle" style={{ marginRight: '6px' }}></i>
                                {isCashOnArrival && isOrderCompleted ? 'Paid on Delivery' : isOrderCompleted ? 'Payment Settled' : 'Downpayment Verified'}
                              </span>
                            ) : isCashOnArrival ? (
                              <span style={{ background: '#fef3c7', color: '#b45309', padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
                                <i className="fa-solid fa-money-bill-wave" style={{ marginRight: '6px' }}></i> Pay on Delivery (Cash on Arrival)
                              </span>
                            ) : (
                              <span style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i> Pending Payment
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>AC Item</span>
                            <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#0f172a' }}>{order.item}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Delivery Location</span>
                            <p style={{ margin: '4px 0 0', color: '#334155', fontSize: '0.9rem' }}>{order.location?.split('| COORDS:')[0].trim()}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Payment Mode</span>
                            <p style={{ margin: '4px 0 0', color: '#334155', fontSize: '0.9rem' }}>{order.payment}</p>
                          </div>
                        </div>

                        {/* Order Total & Official Receipt Button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                          <div>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Total Amount</span>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#052e80' }}>
                              ₱{(order.price || (order.hasDownpayment ? 32000 : 26500)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openOrderReceipt(order)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              borderRadius: '8px',
                              padding: '0.45rem 0.95rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
                            }}
                          >
                            <i className="fa-solid fa-receipt" style={{ color: '#0284c7' }}></i>
                            View / Print Official Receipt
                          </button>
                        </div>

                        {/* Cancelled notice */}
                        {order.status === 'Cancelled' && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.85rem 1rem', color: '#b91c1c', fontSize: '0.88rem' }}>
                            <i className="fa-solid fa-circle-xmark" style={{ marginRight: '6px' }}></i>
                            This order was cancelled.
                          </div>
                        )}

                        {/* Dispatch / Delivery status info */}
                        {dispatchItem && (
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem 1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-truck-ramp-box" style={{ color: '#16a34a', fontSize: '1.2rem' }}></i>
                            <div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d' }}>
                                Dispatch Status: {dispatchItem.status}
                              </span>
                              {dispatchItem.scheduledDate && (
                                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#166534' }}>
                                  Scheduled Delivery Date: <strong>{dispatchItem.scheduledDate}</strong>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY AC (3 BOX CONTAINERS SIDE BY SIDE + CHECKBOXES + DROPDOWN SERVICE) */}
          {activeTab === 'tab-myacs' && (
            <div>
              {/* Header & Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>My Air Conditioners</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Select multiple AC units for service, update location details, and enroll for maintenance monitoring.
                  </p>
                </div>

                {/* Button: Enroll your AC for maintenance monitoring */}
                <button
                  onClick={() => openEnrollModal()}
                  style={{
                    background: '#fffbeb',
                    border: '1.5px solid #d97706',
                    color: '#b45309',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.1)',
                  }}
                >
                  <i className="fa-solid fa-shield-heart" style={{ color: '#d97706' }}></i>
                  Enroll {selectedAcIds.length > 0 ? `(${selectedAcIds.length}) ` : ''}for Maintenance Monitoring
                </button>
              </div>

              {/* Service Selection Toolbar for Multiple ACs */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllAcs}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.5rem 0.9rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedAcIds.length === registeredACs.length && registeredACs.length > 0
                      ? 'Deselect All'
                      : 'Select All Units'}
                  </button>

                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0284c7' }}>
                    {selectedAcIds.length} AC unit(s) selected
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 450px', justifyContent: 'flex-end' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                    Choose Service:
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  >
                    <option>Regular Cleaning (₱900)</option>
                    <option>Deep Chemical Cleaning (₱1,500)</option>
                    <option>AC Diagnostic & Repair (₱1,200)</option>
                    <option>AC Relocation & Re-installation (₱2,500)</option>
                    <option>Routine Maintenance Inspection (₱800)</option>
                    <option>Freon Recharge / Gas Top-up (₱1,800)</option>
                  </select>

                  <button
                    onClick={handleRequestServiceForSelected}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #052e80 0%, #0b3080 100%)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <i className="fa-solid fa-calendar-check" style={{ marginRight: '6px' }}></i> Request Service
                  </button>
                </div>
              </div>

              {/* 3 Box Containers Side by Side (Grid) */}
              {registeredACs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <i className="fa-solid fa-fan" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}></i>
                  <h3 style={{ color: '#0f172a', margin: '0 0 0.5rem' }}>No AC Units Found</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Go to Settings to register or add your air conditioners.</p>
                  <button onClick={() => changeTab('tab-settings')} className="btn" style={{ marginTop: '1rem' }}>
                    Register AC in Settings &rarr;
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '1.25rem',
                    }}
                  >
                    {registeredACs.map((ac) => {
                      const isSelected = selectedAcIds.includes(ac.id);
                      const matchedInst = installments.find((inst) => {
                        const instItem = (inst.item || '').toLowerCase();
                        const acModel = (ac.brandModel || '').toLowerCase();
                        return (
                          instItem.includes(acModel) ||
                          acModel.includes(instItem) ||
                          (ac.installmentId && inst.id === ac.installmentId)
                        );
                      });
                      const isInstallmentUnit = ac.paymentType === 'Installment' || !!matchedInst;
                      const fin = isInstallmentUnit ? getInstallmentFinancials(matchedInst, ac) : null;

                      return (
                        <div
                          key={ac.id}
                          style={{
                            background: '#ffffff',
                            border: isSelected ? '2px solid #0284c7' : isInstallmentUnit ? '1.5px solid #bae6fd' : '1px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '1.4rem',
                            boxShadow: isSelected ? '0 8px 24px -4px rgba(2, 132, 199, 0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {/* Header: Checkbox + Badges */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '6px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAcSelect(ac.id)}
                                  style={{ width: '19px', height: '19px', accentColor: '#0284c7', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#0284c7' : '#64748b' }}>
                                  {isSelected ? 'Selected' : 'Select'}
                                </span>
                              </label>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                {isInstallmentUnit && fin && (
                                  <span
                                    onClick={() => setSelectedInstallmentDetails({ ac, inst: matchedInst, fin })}
                                    style={{
                                      fontSize: '0.72rem',
                                      background: '#eff6ff',
                                      color: '#1d4ed8',
                                      border: '1px solid #bfdbfe',
                                      padding: '3px 8px',
                                      borderRadius: '999px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                    title="Click to view installment schedule and remaining balance"
                                  >
                                    <i className="fa-solid fa-coins" style={{ marginRight: '3px' }}></i> Installment
                                  </span>
                                )}

                                {ac.purchasedFromStore ? (
                                  <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: '999px', fontWeight: 700 }}>
                                    FrostTech Unit
                                  </span>
                                ) : ac.isEnrolledMaintenance ? (
                                  <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '999px', fontWeight: 700 }}>
                                    <i className="fa-solid fa-shield-check"></i> Enrolled (6-Mo)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '999px', fontWeight: 600 }}>
                                    External Unit
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* AC icon & details */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '1rem',
                                cursor: isInstallmentUnit ? 'pointer' : 'default',
                              }}
                              onClick={() => {
                                if (isInstallmentUnit && fin) {
                                  setSelectedInstallmentDetails({ ac, inst: matchedInst, fin });
                                }
                              }}
                            >
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '12px',
                                  background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#0284c7',
                                  fontSize: '1.5rem',
                                }}
                              >
                                <i className="fa-solid fa-snowflake"></i>
                              </div>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                                  {ac.brandModel}
                                </h3>
                                <span style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>
                                  <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i> {ac.location}
                                </span>
                              </div>
                            </div>

                            {/* Prominent Installment Remaining Balance Card */}
                            {isInstallmentUnit && fin && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInstallmentDetails({ ac, inst: matchedInst, fin });
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                  border: '1.5px solid #bae6fd',
                                  borderRadius: '12px',
                                  padding: '0.85rem 1rem',
                                  marginBottom: '1rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
                                  transition: 'transform 0.15s ease',
                                }}
                                title="Click to view full payment schedule and months to pay"
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Remaining Balance
                                  </span>
                                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>
                                    ₱{fin.remainingBalance.toLocaleString()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569', marginBottom: '6px' }}>
                                  <span>Amortization ({fin.term} Mos):</span>
                                  <strong style={{ color: fin.remainingMonthsCount > 0 ? '#b45309' : '#16a34a' }}>
                                    {fin.paidMonthsCount} of {fin.term} Mos Paid ({fin.remainingMonthsCount} left)
                                  </strong>
                                </div>
                                {/* Progress Bar */}
                                <div style={{ width: '100%', height: '6px', background: '#cbd5e1', borderRadius: '999px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${fin.progressPercent}%`,
                                      height: '100%',
                                      background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                                      borderRadius: '999px',
                                    }}
                                  />
                                </div>
                                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.73rem', color: '#0369a1', fontWeight: 700 }}>
                                    ₱{fin.monthlyAmortization.toLocaleString()}/mo
                                  </span>
                                  <span style={{ fontSize: '0.73rem', color: '#0284c7', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="fa-solid fa-calendar-days"></i> Months to Pay &rarr;
                                  </span>
                                </div>
                              </div>
                            )}

                            <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '10px', fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
                              <div><strong>Type:</strong> {ac.acType}</div>
                              <div><strong>Capacity:</strong> {ac.horsepower}</div>
                              <div><strong>Location Address:</strong> {ac.fullAddress || 'Main Profile Address'}</div>
                              <div><strong>Date Added:</strong> {ac.createdAt ? new Date(ac.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently Added'}</div>
                            </div>
                          </div>

                          {/* Footer action: Clickable to edit info/location & Months to pay */}
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.9rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {isInstallmentUnit && fin && (
                              <button
                                onClick={() => setSelectedInstallmentDetails({ ac, inst: matchedInst, fin })}
                                title="View Installment Schedule & Months to Pay"
                                style={{
                                  flex: 1,
                                  padding: '0.6rem 0.85rem',
                                  background: '#e0f2fe',
                                  border: '1px solid #7dd3fc',
                                  borderRadius: '8px',
                                  color: '#0369a1',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                }}
                              >
                                <i className="fa-solid fa-calendar-check" style={{ color: '#0284c7' }}></i>
                                Months to Pay ({fin.remainingMonthsCount} Left)
                              </button>
                            )}
                            <button
                              onClick={() => openEditAcModal(ac)}
                              style={{
                                flex: isInstallmentUnit ? '0 0 auto' : 1,
                                padding: '0.6rem',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                color: '#0f172a',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square" style={{ color: '#0284c7' }}></i> Edit Info
                            </button>
                            {ac.isEnrolledMaintenance ? (
                              <button
                                onClick={() => handleUnenrollAc(ac)}
                                title="Cancel Maintenance Monitoring"
                                style={{
                                  padding: '0.6rem 0.85rem',
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  borderRadius: '8px',
                                  color: '#dc2626',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="fa-solid fa-shield-halved"></i> Unenroll
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  openEnrollModal(ac.id);
                                }}
                                title="Enroll in 6-Month Maintenance Monitoring"
                                style={{
                                  padding: '0.6rem 0.85rem',
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  borderRadius: '8px',
                                  color: '#b45309',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="fa-solid fa-shield-heart" style={{ color: '#d97706' }}></i> Enroll
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Unlinked Accepted Installment Accounts (CI Accepted / Completed from Store) */}
                  {installments.filter(
                    (inst) =>
                      (inst.status === 'CI_ACCEPTED' || inst.status === 'COMPLETED') &&
                      !registeredACs.some((ac) => {
                        const acModel = (ac.brandModel || '').toLowerCase();
                        const instItem = (inst.item || '').toLowerCase();
                        return instItem.includes(acModel) || acModel.includes(instItem);
                      })
                  ).length > 0 && (
                    <div style={{ marginTop: '2.5rem' }}>
                      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#0284c7', fontSize: '1.2rem' }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                          Approved Installment Air Conditioners
                        </h3>
                        <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Active Ledger
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '1.25rem',
                        }}
                      >
                        {installments
                          .filter(
                            (inst) =>
                              (inst.status === 'CI_ACCEPTED' || inst.status === 'COMPLETED') &&
                              !registeredACs.some((ac) => {
                                const acModel = (ac.brandModel || '').toLowerCase();
                                const instItem = (inst.item || '').toLowerCase();
                                return instItem.includes(acModel) || acModel.includes(instItem);
                              })
                          )
                          .map((inst) => {
                            const fin = getInstallmentFinancials(inst);
                            return (
                              <div
                                key={inst.id}
                                onClick={() => setSelectedInstallmentDetails({ inst, fin })}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #bae6fd',
                                  borderRadius: '16px',
                                  padding: '1.4rem',
                                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '999px', fontWeight: 800 }}>
                                      <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i> CI Approved
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                                      #{inst.appId}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <div
                                      style={{
                                        width: '46px',
                                        height: '46px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        fontSize: '1.4rem',
                                      }}
                                    >
                                      <i className="fa-solid fa-snowflake"></i>
                                    </div>
                                    <div>
                                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                                        {inst.item}
                                      </h3>
                                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        {inst.term} Months Plan
                                      </span>
                                    </div>
                                  </div>

                                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.8rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                                        Remaining Balance
                                      </span>
                                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>
                                        ₱{fin.remainingBalance.toLocaleString()}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569', marginBottom: '6px' }}>
                                      <span>Months to Pay:</span>
                                      <strong style={{ color: fin.remainingMonthsCount > 0 ? '#b45309' : '#16a34a' }}>
                                        {fin.paidMonthsCount} of {fin.term} Mos Paid ({fin.remainingMonthsCount} left)
                                      </strong>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#cbd5e1', borderRadius: '999px', overflow: 'hidden' }}>
                                      <div style={{ width: `${fin.progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: '999px' }} />
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInstallmentDetails({ inst, fin });
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.65rem',
                                    background: '#0284c7',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <i className="fa-solid fa-calendar-check"></i> View Months to Pay & Balance
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Active Maintenance Monitoring Schedules Section */}
              {maintenance.length > 0 && (
                <div style={{ marginTop: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-calendar-check" style={{ color: '#0284c7' }}></i>
                        Active Maintenance Monitoring Schedules
                      </h3>
                      <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                        Upcoming routine inspections and health check reminders for your enrolled air conditioning units.
                      </p>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '999px' }}>
                      {maintenance.length} active {maintenance.length === 1 ? 'schedule' : 'schedules'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {maintenance.map((m) => (
                      <div key={m.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '6px' }}>
                              {m.scheduleNo}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '999px' }}>
                              <i className="fa-solid fa-clock" style={{ marginRight: '4px' }}></i> Scheduled
                            </span>
                          </div>
                          <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                            {m.item}
                          </h4>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
                            <i className="fa-solid fa-wrench" style={{ marginRight: '5px', color: '#94a3b8' }}></i> {m.serviceType}
                          </p>
                          <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-calendar-day" style={{ color: '#0284c7' }}></i>
                            <strong>Target Date:</strong> {m.scheduledDate}
                          </div>
                          {m.technicianName && (
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                              <i className="fa-solid fa-user-gear" style={{ marginRight: '5px', color: '#94a3b8' }}></i> Assigned Tech: {m.technicianName}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit AC Modal */}
              {editingAc && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                  }}
                  onClick={() => setEditingAc(null)}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      width: '100%',
                      maxWidth: '560px',
                      maxHeight: '92vh',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1.75rem',
                      boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                      overflowY: 'auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                        <i className="fa-solid fa-pen-to-square" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                        Edit AC Information & Location
                      </h3>
                      <button onClick={() => setEditingAc(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Location within Home/Office */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Location inside Home / Office
                        </label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="e.g. Master Bedroom, Living Room, 2nd Floor Office"
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.9rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.92rem',
                            color: '#0f172a',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Brand & Model */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Brand & Model
                        </label>
                        <input
                          type="text"
                          value={editBrandModel}
                          onChange={(e) => setEditBrandModel(e.target.value)}
                          placeholder="e.g. Carrier Aura Inverter"
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.9rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.92rem',
                            color: '#0f172a',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* AC Type & Horsepower */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            AC Type
                          </label>
                          <select
                            value={editAcType}
                            onChange={(e) => setEditAcType(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem 0.9rem',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.92rem',
                              color: '#0f172a',
                              backgroundColor: '#ffffff',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option>Window Type</option>
                            <option>Split Type</option>
                            <option>Floor Standing</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Horsepower
                          </label>
                          <select
                            value={editHp}
                            onChange={(e) => setEditHp(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem 0.9rem',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.92rem',
                              color: '#0f172a',
                              backgroundColor: '#ffffff',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option>0.75 HP</option>
                            <option>1.0 HP</option>
                            <option>1.5 HP</option>
                            <option>2.0 HP</option>
                            <option>2.5 HP</option>
                            <option>3.0 HP</option>
                          </select>
                        </div>
                      </div>

                      {/* Address Autocomplete Search */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Exact Installation Address / Location
                        </label>
                        <AddressAutocomplete
                          placeholder="Search street, barangay, or city..."
                          value={editAddress}
                          onChange={(val) => setEditAddress(val)}
                          onPlaceSelected={(addr, lat, lng) => {
                            setEditAddress(addr);
                            if (lat !== null && lng !== null) {
                              setEditLat(lat);
                              setEditLng(lng);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.9rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.92rem',
                            color: '#0f172a',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Google Map Pinpoint */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-map-location-dot" style={{ color: '#0284c7' }}></i>
                            Pinpoint Exact Location on Map:
                          </label>
                          {editLat && editLng ? (
                            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: '999px' }}>
                              <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i> Pin Set ({editLat.toFixed(4)}, {editLng.toFixed(4)})
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Click map to drop pin
                            </span>
                          )}
                        </div>

                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                          <GoogleMap
                            height="200px"
                            center={editLat && editLng ? { lat: editLat, lng: editLng } : undefined}
                            markerPosition={editLat && editLng ? { lat: editLat, lng: editLng } : undefined}
                            pinnable={true}
                            onLocationSelect={(coords) => {
                              setEditLat(coords.lat);
                              setEditLng(coords.lng);
                            }}
                          />
                        </div>
                        <p style={{ margin: '5px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                          <i className="fa-solid fa-info-circle" style={{ marginRight: '4px' }}></i> Click anywhere on the map to place or adjust your exact installation pin.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                        <button onClick={() => setEditingAc(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                          Cancel
                        </button>
                        <button onClick={handleSaveAcEdit} className="btn" style={{ flex: 1 }}>
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enroll AC for Maintenance Monitoring Modal (Multi-Unit Selection) */}
              {showEnrollModal && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                  }}
                  onClick={() => setShowEnrollModal(false)}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      width: '100%',
                      maxWidth: '540px',
                      maxHeight: '90vh',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '2rem',
                      boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                      overflow: 'hidden',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                        <i className="fa-solid fa-shield-heart" style={{ color: '#d97706', marginRight: '8px' }}></i>
                        Enroll AC in Maintenance Monitoring
                      </h3>
                      <button onClick={() => setShowEnrollModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                    </div>

                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e', lineHeight: 1.45 }}>
                      <strong>Automated 6-Month Routine Checks:</strong> Enrolling your units connects them to automated 6-month health inspection reminders and priority dispatch.
                    </div>

                    {/* Unit Multi-Selection Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                        Select Units to Enroll ({enrollAcIds.length} of {registeredACs.filter((a) => !a.isEnrolledMaintenance).length} selected):
                      </label>
                      {registeredACs.filter((a) => !a.isEnrolledMaintenance).length > 1 && (
                        <button
                          type="button"
                          onClick={handleSelectAllEnrollAcs}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {enrollAcIds.length === registeredACs.filter((a) => !a.isEnrolledMaintenance).length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Checkbox List of Eligible ACs */}
                    <div
                      style={{
                        maxHeight: '260px',
                        overflowY: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: '1.5rem',
                      }}
                    >
                      {registeredACs.filter((a) => !a.isEnrolledMaintenance).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.88rem' }}>
                          <i className="fa-solid fa-check-circle" style={{ color: '#10b981', fontSize: '1.8rem', display: 'block', marginBottom: '0.5rem' }}></i>
                          All your AC units are already enrolled in maintenance monitoring!
                        </div>
                      ) : (
                        registeredACs
                          .filter((a) => !a.isEnrolledMaintenance)
                          .map((ac) => {
                            const isChecked = enrollAcIds.includes(ac.id);
                            const fullTitle = `${ac.location} — ${ac.brandModel} (${ac.horsepower}) ${ac.purchasedFromStore ? '[FrostTech Unit]' : '[External Unit]'}`;

                            return (
                              <label
                                key={ac.id}
                                title={fullTitle}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '0.75rem 0.9rem',
                                  borderRadius: '10px',
                                  background: isChecked ? '#f0f9ff' : '#ffffff',
                                  border: `1.5px solid ${isChecked ? '#0284c7' : '#e2e8f0'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleEnrollAcId(ac.id)}
                                  style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer', flexShrink: 0 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {ac.brandModel}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, background: ac.purchasedFromStore ? '#e0f2fe' : '#f1f5f9', color: ac.purchasedFromStore ? '#0284c7' : '#64748b', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                                      {ac.purchasedFromStore ? 'FrostTech' : 'External'}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                    <i className="fa-solid fa-location-dot" style={{ color: '#0284c7', marginRight: '4px' }}></i>
                                    {ac.location} &bull; {ac.horsepower} &bull; {ac.acType}
                                  </div>
                                </div>
                              </label>
                            );
                          })
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: 'auto' }}>
                      <button onClick={() => setShowEnrollModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEnrollAc()}
                        disabled={enrollAcIds.length === 0}
                        className="btn"
                        style={{
                          flex: 1.5,
                          background: enrollAcIds.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                          cursor: enrollAcIds.length === 0 ? 'not-allowed' : 'pointer',
                          color: '#ffffff',
                          fontWeight: 700,
                        }}
                      >
                        Confirm Enrollment {enrollAcIds.length > 0 ? `(${enrollAcIds.length})` : ''}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS (PERSONAL INFO + REGISTERED ACs + SECURITY) */}
          {activeTab === 'tab-settings' && (
            <div>
              <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>Account & System Settings</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                  Manage your personal contact info, registered air conditioners, and account security.
                </p>
              </div>

              {/* Section 1: Personal Info */}
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                    <i className="fa-solid fa-id-card" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                    Personal Information
                  </h3>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0284c7',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      <i className="fa-solid fa-pen-to-square" style={{ marginRight: '6px' }}></i> Edit Info
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>First Name</label>
                        <input
                          type="text"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Last Name</label>
                        <input
                          type="text"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone Number</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                      <button onClick={() => setIsEditingProfile(false)} className="btn btn-secondary">Cancel</button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/users/customers', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: userId, firstName: editFirstName, lastName: editLastName, phone: editPhone }),
                            });
                            if (res.ok) {
                              const updated = await res.json();
                              const newFullName = `${updated.firstName} ${updated.lastName}`;
                              setUserName(newFullName);
                              setUserPhone(updated.phone || '');
                              sessionStorage.setItem('userName', newFullName);
                              setIsEditingProfile(false);
                              showToast('Personal info updated successfully!');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="btn"
                      >
                        Save Personal Info
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>FULL NAME</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#0f172a' }}>{userName}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>EMAIL ADDRESS</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#0f172a' }}>{userEmail}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>CONTACT PHONE</span>
                      <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#0f172a' }}>{userPhone || 'Not set'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Saved Address Book */}
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                      <i className="fa-solid fa-map-location-dot" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                      Saved Address Book
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Manage delivery and on-site service locations</span>
                  </div>

                  <button
                    onClick={() => setShowAddAddressModal(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: '#0284c7',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fa-solid fa-plus"></i> Add Address
                  </button>
                </div>

                {/* Add Address Form Modal / Inline */}
                {showAddAddressModal && (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newAddrFull.trim()) return;
                      try {
                        const res = await fetch('/api/addresses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId,
                            label: newAddrLabel,
                            fullAddress: newAddrFull,
                            phone: newAddrPhone || userPhone || '09XXXXXXXXX',
                            isDefault: newAddrIsDefault
                          })
                        });
                        if (res.ok) {
                          setShowAddAddressModal(false);
                          setNewAddrFull('');
                          setNewAddrPhone('');
                          setNewAddrIsDefault(false);
                          fetch(`/api/addresses?userId=${userId}`).then(r => r.json()).then(data => { if (Array.isArray(data)) setSavedAddresses(data); });
                          showToast('Address added to Address Book!');
                        }
                      } catch (err) {
                        console.error('Failed to save address:', err);
                      }
                    }}
                    style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}
                  >
                    <h4 style={{ margin: '0 0 1rem', color: '#0284c7', fontSize: '0.95rem', fontWeight: 700 }}>Add New Address</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Address Label</label>
                        <select 
                          value={newAddrLabel} 
                          onChange={e => setNewAddrLabel(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="Home">Home</option>
                          <option value="Office / Workplace">Office / Workplace</option>
                          <option value="Branch">Branch / Store</option>
                          <option value="Warehouse">Warehouse</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Contact Phone</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 09171234567" 
                          value={newAddrPhone} 
                          onChange={e => setNewAddrPhone(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '0.8rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Complete Address</label>
                      <input 
                        type="text" 
                        required
                        placeholder="House / Unit No., Street, Barangay, City, Province" 
                        value={newAddrFull} 
                        onChange={e => setNewAddrFull(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <input 
                        type="checkbox" 
                        id="newAddrDefault"
                        checked={newAddrIsDefault}
                        onChange={e => setNewAddrIsDefault(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="newAddrDefault" style={{ fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>Set as default address</label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowAddAddressModal(false)} className="btn btn-secondary">Cancel</button>
                      <button type="submit" className="btn btn-primary" style={{ background: '#0284c7' }}>Save Address</button>
                    </div>
                  </form>
                )}

                {/* Address Cards Grid */}
                {savedAddresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <i className="fa-solid fa-map-pin" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem' }}></i>
                    <p style={{ margin: 0, fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>No saved addresses yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Add your home, office, or branch locations for faster checkout and scheduled maintenance.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {savedAddresses.map(addr => (
                      <div 
                        key={addr.id}
                        style={{ 
                          border: addr.isDefault ? '2px solid #0284c7' : '1px solid #e2e8f0', 
                          borderRadius: '12px', 
                          padding: '1.25rem', 
                          background: addr.isDefault ? '#f0f9ff' : '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              textTransform: 'uppercase', 
                              color: addr.isDefault ? '#0284c7' : '#64748b',
                              background: addr.isDefault ? '#e0f2fe' : '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369a1' }}>
                                <i className="fa-solid fa-star" style={{ color: '#0284c7', marginRight: '4px' }}></i> Default
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', lineHeight: 1.4 }}>
                            {addr.fullAddress}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                            <i className="fa-solid fa-phone" style={{ marginRight: '6px', fontSize: '0.75rem' }}></i> {addr.phone}
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                          <button
                            onClick={async () => {
                              const isConfirmed = await confirm({
                                title: 'Delete Address',
                                message: `Delete "${addr.label}" from your address book?`,
                                confirmText: 'Delete',
                                type: 'warning'
                              });
                              if (!isConfirmed) return;
                              try {
                                const res = await fetch(`/api/addresses?id=${addr.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  setSavedAddresses(prev => prev.filter(a => a.id !== addr.id));
                                  showToast('Address deleted');
                                }
                              } catch (err) {
                                console.error('Failed to delete address:', err);
                              }
                            }}
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              color: '#ef4444', 
                              fontSize: '0.8rem', 
                              fontWeight: 600, 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <i className="fa-solid fa-trash-can"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Registered ACs */}
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                      <i className="fa-solid fa-fan" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                      Registered AC Units Directory
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Manage your cooling devices profile</span>
                  </div>

                  <button
                    onClick={() => setShowRegisterForm(!showRegisterForm)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: '#0284c7',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Register New AC
                  </button>
                </div>

                {/* Form to Register New AC */}
                {showRegisterForm && (
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #d4e5fa', marginBottom: '1.75rem', boxShadow: '0 4px 16px rgba(6,37,91,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#052e80', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fa-solid fa-plus-circle" style={{ color: '#0284c7' }}></i> Register AC Unit
                        </h4>
                        <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                          Add your AC specifications and pinpoint installation location on the interactive map.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowRegisterForm(false)}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
                        title="Close"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    {/* Row 1: Brand & Model and Year Acquired (No Location text input) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>
                          Brand & Model <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Carrier Aura Inverter 1.5 HP, Panasonic Deluxe"
                          value={regBrandModel}
                          onChange={(e) => setRegBrandModel(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#06255b', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>
                          <i className="fa-solid fa-calendar-days" style={{ marginRight: '5px', color: '#0284c7' }}></i> Year Acquired
                        </label>
                        <select
                          value={regYearAcquired}
                          onChange={(e) => setRegYearAcquired(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#06255b', fontWeight: 600, outline: 'none' }}
                        >
                          {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017 or earlier'].map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: AC Type and Horsepower */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>
                          AC Type
                        </label>
                        <select
                          value={regAcType}
                          onChange={(e) => setRegAcType(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#06255b', fontWeight: 600, outline: 'none' }}
                        >
                          <option>Window Type</option>
                          <option>Split Type</option>
                          <option>Floor Standing</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>
                          Horsepower (HP)
                        </label>
                        <select
                          value={regHorsepower}
                          onChange={(e) => setRegHorsepower(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#06255b', fontWeight: 600, outline: 'none' }}
                        >
                          <option>0.75 HP</option>
                          <option>1.0 HP</option>
                          <option>1.5 HP</option>
                          <option>2.0 HP</option>
                          <option>2.5 HP</option>
                          <option>3.0 HP</option>
                        </select>
                      </div>
                    </div>

                    {/* Interactive Pin Point Map */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#06255b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-location-dot" style={{ color: '#0284c7' }}></i> Pin Point AC Location on Map
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Coordinates: {regLat ? regLat.toFixed(5) : '14.6091'}, {regLng ? regLng.toFixed(5) : '121.0223'}
                        </span>
                      </div>
                      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <GoogleMap
                          height="220px"
                          center={regLat && regLng ? { lat: regLat, lng: regLng } : { lat: 14.6091, lng: 121.0223 }}
                          markerPosition={regLat && regLng ? { lat: regLat, lng: regLng } : { lat: 14.6091, lng: 121.0223 }}
                          pinnable={true}
                          onLocationSelect={(coords) => {
                            setRegLat(coords.lat);
                            setRegLng(coords.lng);
                          }}
                        />
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                        <i className="fa-solid fa-circle-info" style={{ marginRight: '4px', color: '#0284c7' }}></i> Click anywhere on the map above to accurately pin your AC unit location.
                      </p>
                    </div>

                    {/* Installation Landmark Address */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#06255b', marginBottom: '6px' }}>
                        Address / Building Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Unit 402 Tower B, Emerald Condos, San Juan"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', color: '#06255b', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                      <button
                        onClick={() => setShowRegisterForm(false)}
                        className="btn btn-secondary"
                        style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRegisterNewAc}
                        className="btn"
                        style={{ padding: '0.65rem 1.6rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <i className="fa-solid fa-check"></i> Save & Register Unit
                      </button>
                    </div>
                  </div>
                )}
                {/* Registered AC List table/rows */}
                {registeredACs.length === 0 ? (
                  <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>No registered AC units yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {registeredACs.map((ac) => (
                      <div
                        key={ac.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.9rem 1.1rem',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{ac.brandModel}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '10px' }}>
                            ({ac.horsepower} • {ac.acType})
                            {ac.createdAt && (
                              <span style={{ marginLeft: '8px', color: '#0284c7', fontWeight: 600 }}>
                                • Added: {new Date(ac.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditAcModal(ac)}
                            style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                          >
                            <i className="fa-solid fa-pen"></i> Edit
                          </button>
                          <button
                            onClick={async () => {
                              const proceed = await confirm({ title: 'Delete AC', message: `Remove ${ac.brandModel}?` });
                              if (proceed) {
                                await fetch(`/api/registered-acs?id=${ac.id}`, { method: 'DELETE' });
                                setRegisteredACs(registeredACs.filter((a) => a.id !== ac.id));
                                showToast('AC removed.');
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Password / Account Security */}
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                  <i className="fa-solid fa-lock" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                  Security & Password
                </h3>
                <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <input
                    type="password"
                    placeholder="New Password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <button onClick={handleUpdatePassword} className="btn" style={{ marginTop: '0.4rem' }}>
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </section>

      {/* Downpayment Modal */}
      {showDownpaymentModal && pendingCartItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: '#0284c7', marginBottom: '1rem' }}></i>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 800 }}>Downpayment Required</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>As a first-time buyer of Air Conditioning units, a 15% downpayment is required.</p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>{pendingCartItem.name}</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>₱ {pendingCartItem.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', marginTop: '0.5rem', color: '#0284c7', fontWeight: 'bold' }}>
                <span>15% Downpayment</span>
                <span>₱ {(pendingCartItem.price * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowDownpaymentModal(false);
                  setPendingCartItem(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-buy"
                style={{ flex: 1 }}
                onClick={() => {
                  const item = pendingCartItem;
                  setShowDownpaymentModal(false);
                  setPendingCartItem(null);
                  addToCart(item.name, item.price, item.brand, item.image, item.productId, true);
                }}
              >
                Proceed to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Installment Remaining Balance & Months to Pay Schedule Modal */}
      {selectedInstallmentDetails && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
          onClick={() => setSelectedInstallmentDetails(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                background: 'linear-gradient(135deg, #052e80 0%, #0369a1 100%)',
                color: '#ffffff',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                  }}
                >
                  <i className="fa-solid fa-snowflake"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    {selectedInstallmentDetails.ac?.brandModel || selectedInstallmentDetails.inst?.item || 'AC Unit Installment'}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#bae6fd', display: 'flex', gap: '10px', marginTop: '2px' }}>
                    <span>
                      <strong>App Ref:</strong> #{selectedInstallmentDetails.inst?.appId || 'AC-INST'}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Term:</strong> {selectedInstallmentDetails.fin.term} Months Plan
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInstallmentDetails(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ padding: '1.5rem 1.75rem' }}>
              {/* KPI Financial Overview Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.85rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Contract Price
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    ₱{selectedInstallmentDetails.fin.price.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SRP / Base Price</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Downpayment
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                    ₱{selectedInstallmentDetails.fin.downpayment.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>15% Paid</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Monthly Due
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    ₱{selectedInstallmentDetails.fin.monthlyAmortization.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Per Month</span>
                </div>

                <div style={{ background: '#eff6ff', padding: '0.9rem', borderRadius: '12px', border: '1.5px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Remaining Balance
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
                    ₱{selectedInstallmentDetails.fin.remainingBalance.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: 600 }}>
                    {selectedInstallmentDetails.fin.remainingMonthsCount} Mos Left
                  </span>
                </div>
              </div>

              {/* Progress Countdown Bar */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    <i className="fa-solid fa-chart-line" style={{ color: '#0284c7', marginRight: '6px' }}></i>
                    Payment Progress
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7' }}>
                    {selectedInstallmentDetails.fin.paidMonthsCount} of {selectedInstallmentDetails.fin.term} Months Paid ({selectedInstallmentDetails.fin.progressPercent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${selectedInstallmentDetails.fin.progressPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0284c7 0%, #10b981 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Month-by-Month Amortization Schedule (Months to Pay) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                    <i className="fa-solid fa-calendar-days" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                    Months to Pay Schedule
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Total Term: {selectedInstallmentDetails.fin.term} Months
                  </span>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Month #</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Monthly Due</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: selectedInstallmentDetails.fin.term }, (_, idx) => {
                        const monthNum = idx + 1;
                        const isPaid = selectedInstallmentDetails.fin.paidMonths.includes(monthNum) || monthNum <= selectedInstallmentDetails.fin.paidMonthsCount;
                        const isNextDue = !isPaid && monthNum === selectedInstallmentDetails.fin.paidMonthsCount + 1;
                        
                        const startDate = selectedInstallmentDetails.inst?.createdAt
                          ? new Date(selectedInstallmentDetails.inst.createdAt)
                          : selectedInstallmentDetails.ac?.createdAt
                          ? new Date(selectedInstallmentDetails.ac.createdAt)
                          : new Date();
                        const dueDate = new Date(startDate);
                        dueDate.setMonth(dueDate.getMonth() + monthNum);
                        const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const runningRemaining = Math.max(0, selectedInstallmentDetails.fin.totalFinancedWithInterest - monthNum * selectedInstallmentDetails.fin.monthlyAmortization);

                        return (
                          <tr
                            key={monthNum}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isNextDue ? '#fffbeb' : isPaid ? '#ffffff' : '#fafafa',
                            }}
                          >
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                              Month {monthNum}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                              {dueDateStr}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                              ₱{selectedInstallmentDetails.fin.monthlyAmortization.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              {isPaid ? (
                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fa-solid fa-circle-check"></i> Paid
                                </span>
                              ) : isNextDue ? (
                                <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 9px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fa-solid fa-clock"></i> Current Due
                                </span>
                              ) : (
                                <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 9px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  Upcoming
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: isPaid ? '#94a3b8' : '#0284c7' }}>
                              ₱{runningRemaining.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Channels Guide */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <i className="fa-solid fa-circle-info" style={{ color: '#16a34a', fontSize: '1.25rem', marginTop: '2px' }}></i>
                <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                  <strong style={{ display: 'block', marginBottom: '2px', fontSize: '0.88rem' }}>How to Pay Your Installment Amortization:</strong>
                  Payments can be settled via <strong>GCash</strong>, <strong>BDO / BPI Bank Transfer</strong>, or in-person at any FrostTech Hub. Please indicate your Application Reference <strong>#{selectedInstallmentDetails.inst?.appId || 'AC-INST'}</strong> in the transfer remarks. Your ledger will update automatically once verified.
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setSelectedInstallmentDetails(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} receipt={selectedReceipt} />
      {ModalComponent && <ModalComponent />}
    </>
  );
}