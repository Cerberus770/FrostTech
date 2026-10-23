'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';
import { useConfirmModal } from '@/components/ConfirmModal';

interface InventoryItem {
  id: string;
  sku: string;
  brand: string;
  model: string;
  category: string;
  horsepower?: string | null;
  description?: string | null;
  stock: number;
  price: number;
  image?: string | null;
  images?: string[];
  status?: string;
  createdAt?: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  rating: number;
  sold: number;
  image: string;
  images?: string[];
  badge?: string;
  horsepower?: string | null;
  description?: string | null;
}

interface Order {
  id: string;
  orderNo: string;
  userId: string;
  name: string;
  location: string;
  item: string;
  payment: string;
  status: string;
  date: string;
  hp?: string | null;
  itemType?: string | null;
  price?: number | null;
  hasDownpayment?: boolean;
  downpaymentProof?: string | null;
  notice3Days?: boolean;
  notice3DaysAt?: string | null;
  assignedTech?: string | null;
  scheduledDate?: string | null;
}

interface Installment {
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
}

interface DispatchItem {
  id: string;
  dispatchNo: string;
  type: string;
  customerId: string;
  name: string;
  location: string;
  item: string;
  notes: string;
  status: string;
  horsepower?: string | null;
  assignedTechName?: string | null;
  scheduledDate?: string | null;
  technicians?: { id: string; firstName: string; lastName: string }[];
}

interface RegisteredACItem {
  id: string;
  location: string;
  brandModel: string;
  acType: string;
  horsepower: string;
  paymentType: string;
  totalPrice?: number | null;
  months?: number | null;
  pricePerMonth?: number | null;
  lat?: number | null;
  lng?: number | null;
  fullAddress?: string | null;
  purchasedFromStore?: boolean;
  isPaused?: boolean;
  isEnrolledMaintenance?: boolean;
  enrolledAt?: string | null;
  createdAt?: string;
}

interface MaintenanceItem {
  id: string;
  scheduleNo: string;
  customerId: string;
  name: string;
  phone: string;
  address: string;
  item: string;
  serviceType: string;
  scheduledDate: string;
  technicianName: string;
  status: string;
  notes: string;
  lastMaintenance?: string | null;
  technicianId?: string;
  technician?: { id: string; firstName: string; lastName: string; phone?: string; techRank?: string | null };
  customer?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    registeredACs?: RegisteredACItem[];
  };
  createdAt?: string;
}

interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'CUSTOMER' | 'TECHNICIAN' | 'CLERK' | 'ADMIN';
  techRank?: string | null;
  permissions?: string;
  createdAt: string;
}

const FEATURE_PERMISSIONS = [
  { key: 'inventory', label: 'Unified Inventory', icon: 'fa-boxes-stacked' },
  { key: 'pos', label: 'POS & Checkout', icon: 'fa-cash-register' },
  { key: 'orders', label: 'Orders & Services', icon: 'fa-clipboard-list' },
  { key: 'installments', label: 'Installment Approvals', icon: 'fa-file-invoice-dollar' },
  { key: 'dispatch', label: 'Dispatch & Schedule', icon: 'fa-truck-fast' },
  { key: 'maintenance', label: 'Maintenance Monitoring', icon: 'fa-screwdriver-wrench' },
  { key: 'users', label: 'User Directory', icon: 'fa-users-gear' },
  { key: 'invoices', label: 'Invoices & Billing', icon: 'fa-file-invoice' },
];

const TECH_RANKS = ['Junior Tech', 'Senior Tech', 'Master Tech', 'Lead HVAC Specialist'];

export default function AdminDashboard() {
  const router = useRouter();
  const { confirm, showAlert, prompt, ModalComponent } = useConfirmModal();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('tab-inventory');
  const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState(false);
  const [adminMobileOpen, setAdminMobileOpen] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [dispatch, setDispatch] = useState<DispatchItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; firstName: string; lastName: string; techRank?: string | null }[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Inventory Filters
  const [invFilterType, setInvFilterType] = useState<'All' | 'AC' | 'Parts'>('All');
  const [invModelFilter, setInvModelFilter] = useState('All');
  const [invCategoryFilter, setInvCategoryFilter] = useState('All');
  const [invStatusFilter, setInvStatusFilter] = useState('All');

  // Add Product Modal & Multi-image state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<'AC' | 'SparePart'>('AC');
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // View Item Description Modal
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  // POS State (Merged Storefront + Inventory + Discount)
  const [posCart, setPosCart] = useState<(InventoryItem & { cartQty: number })[]>([]);
  const [posFilter, setPosFilter] = useState<'All' | 'AC' | 'Parts'>('All');
  const [posSearch, setPosSearch] = useState('');
  const [posDiscountType, setPosDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [posDiscountValue, setPosDiscountValue] = useState<number>(0);
  const [showPosCustomerModal, setShowPosCustomerModal] = useState(false);
  const [showPosCashModal, setShowPosCashModal] = useState(false);

  // User Directory State
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'CUSTOMER' | 'TECHNICIAN' | 'ADMIN' | 'CLERK'>('CUSTOMER');
  const [newTechRank, setNewTechRank] = useState('Senior Tech');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [newCustomRoleTitle, setNewCustomRoleTitle] = useState('');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editRole, setEditRole] = useState<'CUSTOMER' | 'TECHNICIAN' | 'ADMIN' | 'CLERK'>('CUSTOMER');
  const [editTechRank, setEditTechRank] = useState('Senior Tech');
  const [isEditCustomRole, setIsEditCustomRole] = useState(false);
  const [editCustomRoleTitle, setEditCustomRoleTitle] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Order Details Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Installment Details Modal
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

  // Dispatch Filters & Pagination State (10 items per page)
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<'All' | 'Assigned' | 'Pending' | 'Completed'>('All');
  const [dispatchCategoryFilter, setDispatchCategoryFilter] = useState<'ALL' | 'INSTALLATION' | 'CLEANING' | 'REPAIR'>('INSTALLATION');
  const [dispatchInstallationSubFilter, setDispatchInstallationSubFilter] = useState<'ALL' | 'NEW' | 'REINSTALL'>('ALL');
  const [dispatchCleaningSubFilter, setDispatchCleaningSubFilter] = useState<'ALL' | 'STANDARD' | 'DEEP'>('ALL');
  const [dispatchCurrentPage, setDispatchCurrentPage] = useState(1);
  const DISPATCH_PER_PAGE = 10;

  // Dispatch Sidebar Submenu & Flyout State
  const [isDispatchSubmenuOpen, setIsDispatchSubmenuOpen] = useState(true);
  const [isDispatchFlyoutOpen, setIsDispatchFlyoutOpen] = useState(false);

  const handleSelectDispatchCategory = (categoryKey: 'ALL' | 'INSTALLATION' | 'CLEANING' | 'REPAIR', e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setActiveTab('tab-dispatch');
    setDispatchCategoryFilter(categoryKey);
    setDispatchCurrentPage(1);
    setIsDispatchFlyoutOpen(false);
  };

  // Order & Services Filter State (Separated: Customer Order vs Customer Services, No All button)
  const [orderServiceFilter, setOrderServiceFilter] = useState<'ORDERS' | 'SERVICES'>('ORDERS');
  const [adminCartItems, setAdminCartItems] = useState<any[]>([]);
  const [customerOrderSubTab, setCustomerOrderSubTab] = useState<'PICKUP_ORDERS' | 'CART_HOLDS'>('PICKUP_ORDERS');

  // Order Acceptance & Scheduling Modal State (Tab 3)
  const [selectedOrderToSchedule, setSelectedOrderToSchedule] = useState<Order | null>(null);
  const [orderScheduleTechId, setOrderScheduleTechId] = useState<string>('');
  const [orderScheduleDate, setOrderScheduleDate] = useState<string>('');
  const [orderScheduleTimeSlot, setOrderScheduleTimeSlot] = useState<string>('Morning (08:00 AM - 12:00 PM)');
  const [orderScheduleNotes, setOrderScheduleNotes] = useState<string>('');
  const [overrideDownpayment, setOverrideDownpayment] = useState<boolean>(false);
  const [isSubmittingOrderSchedule, setIsSubmittingOrderSchedule] = useState<boolean>(false);

  // Installment Acceptance & Scheduling Modal State (Tab 4)
  const [selectedInstallmentToSchedule, setSelectedInstallmentToSchedule] = useState<Installment | null>(null);
  const [installmentScheduleTechId, setInstallmentScheduleTechId] = useState<string>('');
  const [installmentScheduleDate, setInstallmentScheduleDate] = useState<string>('');
  const [installmentScheduleTimeSlot, setInstallmentScheduleTimeSlot] = useState<string>('Morning (08:00 AM - 12:00 PM)');
  const [installmentScheduleNotes, setInstallmentScheduleNotes] = useState<string>('');
  const [isSubmittingInstallmentSchedule, setIsSubmittingInstallmentSchedule] = useState<boolean>(false);

  // Service Assignment & Scheduling Modal State
  const [selectedServiceToSchedule, setSelectedServiceToSchedule] = useState<MaintenanceItem | null>(null);
  const [scheduleTechId, setScheduleTechId] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState<string>('Morning (08:00 AM - 12:00 PM)');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');

  // Maintenance Details & AC Assignment Modal State (Tab 6)
  const [selectedMaintenanceModal, setSelectedMaintenanceModal] = useState<MaintenanceItem | null>(null);
  const [maintScheduleTechId, setMaintScheduleTechId] = useState<string>('');
  const [maintScheduleDate, setMaintScheduleDate] = useState<string>('');
  const [maintLastDate, setMaintLastDate] = useState<string>('');
  const [maintScheduleTimeSlot, setMaintScheduleTimeSlot] = useState<string>('Morning (08:00 AM - 12:00 PM)');
  const [maintStatus, setMaintStatus] = useState<string>('SCHEDULED');
  const [maintNotes, setMaintNotes] = useState<string>('');
  const [isSavingMaintenance, setIsSavingMaintenance] = useState<boolean>(false);

  // Customer Services sub-filter (All, Cleaning, Repair, Re-installation)
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'ALL' | 'CLEANING' | 'REPAIR' | 'REINSTALLATION'>('ALL');

  useEffect(() => {
    setIsLoggedIn(sessionStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true');

    // Fetch initial datasets
    fetch('/api/inventory').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setInventory(data); }).catch(console.error);
    fetch('/api/orders').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setOrders(data); }).catch(console.error);
    fetch('/api/installments').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setInstallments(data); }).catch(console.error);
    fetch('/api/dispatch').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setDispatch(data); }).catch(console.error);
    fetch('/api/maintenance').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setMaintenance(data); }).catch(console.error);
    fetch('/api/users/technicians').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setTechnicians(data); }).catch(console.error);
    fetch('/api/users').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setAllUsers(data); }).catch(console.error);
    fetch('/api/invoices').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setInvoices(data); }).catch(console.error);
    fetch('/api/cart?admin=true').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setAdminCartItems(data); }).catch(console.error);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.clear();
    router.push('/login');
  };

  // ==========================================
  // INVENTORY ACTIONS
  // ==========================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const readers: Promise<string>[] = [];

    // Allow up to 4 images
    const filesToProcess = Array.from(files).slice(0, 4 - newProductImages.length);

    filesToProcess.forEach((file) => {
      const readerPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
        };
        reader.readAsDataURL(file);
      });
      readers.push(readerPromise);
    });

    Promise.all(readers).then((compressedBase64List) => {
      setNewProductImages((prev) => [...prev, ...compressedBase64List].slice(0, 4));
      setIsUploadingImages(false);
    });
  };

  const handleRemoveImage = (index: number) => {
    setNewProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sku = formData.get('sku') as string;
    const brand = formData.get('brand') as string;
    const model = formData.get('model') as string;
    const category = formData.get('category') as string;
    const horsepower = formData.get('horsepower') as string;
    const description = formData.get('description') as string;
    const stock = parseInt(formData.get('stock') as string, 10);
    const price = parseFloat(formData.get('price') as string);

    if (!sku || !brand || !model || !category || isNaN(price)) {
      showAlert({ title: 'Validation', message: 'Please fill out all required product fields.', type: 'warning' });
      return;
    }

    const isConfirmed = await confirm({
      title: 'Add Product',
      message: `Add ${brand} ${model} to inventory? It will automatically be marked Brand New and published to the storefront.`,
      confirmText: 'Add Product',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          brand,
          model,
          category,
          horsepower: horsepower || 'N/A',
          description: description || 'High quality cooling solution unit.',
          stock: stock || 0,
          price,
          images: newProductImages.length > 0 ? newProductImages : ['https://via.placeholder.com/300'],
        }),
      });

      if (res.ok) {
        setIsAddProductModalOpen(false);
        setNewProductImages([]);
        fetch('/api/inventory').then((r) => r.json()).then(setInventory).catch(console.error);
        showAlert({ title: 'Success', message: 'Product added to inventory & storefront successfully!' });
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add product');
      }
    } catch (err: any) {
      console.error(err);
      showAlert({ title: 'Error', message: err.message || 'Failed to add product', type: 'error' });
    }
  };

  const handleRestock = async (item: InventoryItem) => {
    const qtyStr = await prompt({
      title: 'Restock Inventory',
      message: `Enter quantity to add to stock for ${item.brand} ${item.model}:`,
      placeholder: 'Quantity',
    });
    if (!qtyStr) return;
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) return alert('Invalid quantity.');

    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, stock: item.stock + qty }),
      });
      if (res.ok) {
        setInventory(inventory.map((i) => (i.id === item.id ? { ...i, stock: i.stock + qty } : i)));
        showAlert({ title: 'Restocked', message: `Added ${qty} units to ${item.brand} ${item.model}.` });
      }
    } catch (err) {
      console.error(err);
      alert('Error updating stock');
    }
  };

  const handlePrintInventoryReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = inventory.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${item.sku}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.brand} ${item.model}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.category}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.horsepower || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.stock}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.stock > 5 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FrostTech Inventory Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2rem; color: #333; }
            h1 { color: #0284c7; margin-bottom: 4px; }
            .header-info { margin-bottom: 2rem; color: #666; font-size: 0.9rem; }
            table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 1rem; }
            th { background-color: #0284c7; color: white; padding: 10px; border: 1px solid #0284c7; text-align: left; }
            .summary { margin-top: 2rem; font-weight: bold; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 1rem;">
            <div>
              <h1>FrostTech Cooling Solutions Co.</h1>
              <div class="header-info">Official Inventory & Equipment Report</div>
            </div>
            <div style="text-align: right; font-size: 0.85rem; color: #666;">
              <div>Date Generated: ${new Date().toLocaleString()}</div>
              <div>Total Unique Items: ${inventory.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>SKU</th>
                <th>Item / Model</th>
                <th>Category</th>
                <th style="text-align: center;">HP</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: center;">Stock</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: center;">Date Added</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="summary">
            Total Inventory Units On Hand: ${inventory.reduce((sum, i) => sum + i.stock, 0)} units
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filtered inventory items
  const filteredInventory = inventory.filter((item) => {
    const isSpare = item.category.toLowerCase().includes('part') || item.category.toLowerCase().includes('accessories');
    if (invFilterType === 'AC' && isSpare) return false;
    if (invFilterType === 'Parts' && !isSpare) return false;
    if (invModelFilter !== 'All' && !item.model.toLowerCase().includes(invModelFilter.toLowerCase())) return false;
    if (invCategoryFilter !== 'All' && item.category !== invCategoryFilter) return false;
    if (invStatusFilter !== 'All') {
      const status = item.stock > 5 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock';
      if (status !== invStatusFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.brand.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Unique models for dropdown filter
  const uniqueModels = Array.from(new Set(inventory.map((i) => i.model))).slice(0, 20);

  // ==========================================
  // POS ACTIONS (COMBINED PRODUCTS + DISCOUNT)
  // ==========================================
  const handleAddToPos = (item: InventoryItem) => {
    setPosCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) => (p.id === item.id ? { ...p, cartQty: p.cartQty + 1 } : p));
      }
      return [...prev, { ...item, cartQty: 1 }];
    });
  };

  const handleRemoveFromPos = (id: string) => {
    setPosCart((prev) => prev.filter((p) => p.id !== id));
  };

  const posSubtotal = posCart.reduce((sum, item) => sum + item.price * item.cartQty, 0);
  const posDiscountAmount =
    posDiscountType === 'percent'
      ? (posSubtotal * posDiscountValue) / 100
      : posDiscountType === 'fixed'
      ? posDiscountValue
      : 0;
  const posFinalTotal = Math.max(0, posSubtotal - posDiscountAmount);

  const handleApplyDiscountPrompt = async () => {
    const discTypeStr = await prompt({
      title: 'Apply Discount',
      message: 'Choose discount mode: Enter "P" for percentage (e.g. 10%) or "F" for fixed amount (e.g. ₱500):',
      placeholder: 'P or F',
    });
    if (!discTypeStr) return;

    if (discTypeStr.toUpperCase() === 'P') {
      const valStr = await prompt({
        title: 'Percentage Discount',
        message: 'Enter percentage discount (e.g. 10 for 10%):',
        placeholder: '10',
      });
      const val = parseFloat(valStr || '0');
      if (val > 0) {
        setPosDiscountType('percent');
        setPosDiscountValue(val);
        showAlert({ title: 'Discount Applied', message: `${val}% discount applied!` });
      }
    } else {
      const valStr = await prompt({
        title: 'Fixed Discount',
        message: 'Enter fixed discount in ₱ (e.g. 500):',
        placeholder: '500',
      });
      const val = parseFloat(valStr || '0');
      if (val > 0) {
        setPosDiscountType('fixed');
        setPosDiscountValue(val);
        showAlert({ title: 'Discount Applied', message: `₱${val} discount applied!` });
      }
    }
  };

  // ==========================================
  // CUSTOMER ORDERS (CASH BASE / STORE PICK UP) ACTIONS
  // ==========================================
  const handleMarkOrderReadyForPickup = async (order: Order) => {
    const isConfirmed = await confirm({
      title: 'Ready for Pick Up',
      message: `Mark Order #${order.orderNo} for "${order.item}" as Ready for Pick Up? The customer will receive an SMS notification to pick up their unit at the store.`,
      confirmText: 'Mark Ready',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'Ready for Pick Up' }),
      });
      if (res.ok) {
        setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: 'Ready for Pick Up' } : o)));
        showAlert({ title: 'Order Ready', message: `Order #${order.orderNo} is now Ready for Pick Up.` });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to update order status', type: 'error' });
    }
  };

  const handleMarkOrderPickedUp = async (order: Order) => {
    const isConfirmed = await confirm({
      title: 'Confirm Store Pick Up',
      message: `Confirm that customer "${order.name}" has picked up Order #${order.orderNo} (${order.item})?`,
      confirmText: 'Confirm Picked Up',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'Picked Up' }),
      });
      if (res.ok) {
        if (order.userId && order.userId !== 'guest') {
          await fetch('/api/registered-acs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: order.userId,
              location: 'Store Pick Up',
              brandModel: order.item,
              acType: order.itemType || 'Split Type Inverter',
              horsepower: order.hp || order.item.match(/\b(\d+(?:\.\d+)?\s*HP)\b/i)?.[1] || '1.5 HP',
              paymentType: 'Cash',
              fullAddress: 'Picked up in store',
              purchasedFromStore: true,
            }),
          }).catch(console.error);
        }

        setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: 'Picked Up' } : o)));
        showAlert({ title: 'Order Picked Up', message: `Order #${order.orderNo} marked as Picked Up and AC registered for customer!` });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to update order status', type: 'error' });
    }
  };

  // ==========================================
  // ACTIVE CART HOLDS & 3-DAY NOTICE ACTIONS
  // ==========================================
  const handleSendCart3DayNotice = async (cartItem: any) => {
    const custName = cartItem.user ? `${cartItem.user.firstName} ${cartItem.user.lastName}` : 'Customer';
    const isConfirmed = await confirm({
      title: 'Send 3-Day Cart Notice',
      message: `Send a 3-day notice to ${custName} (${cartItem.user?.phone || 'No phone'}) for "${cartItem.name}"?\nIf they do not complete the purchase within 3 days, this item will be returned to store stock and removed from their cart.`,
      confirmText: 'Send 3-Day Notice',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cartItem.id, action: 'send3DayNotice' }),
      });
      if (res.ok) {
        setAdminCartItems((prev) =>
          prev.map((i) => (i.id === cartItem.id ? { ...i, notice3Days: true, notice3DaysAt: new Date().toISOString() } : i))
        );
        showAlert({
          title: '3-Day Notice Sent',
          message: `3-Day notice sent via SMS to ${custName}! They have 3 days to proceed with checkout.`,
        });
      } else {
        showAlert({ title: 'Error', message: 'Failed to send 3-day notice.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      showAlert({ title: 'Error', message: 'Failed to send 3-day notice.', type: 'error' });
    }
  };

  const handleReleaseCartToStock = async (cartItem: any) => {
    const custName = cartItem.user ? `${cartItem.user.firstName} ${cartItem.user.lastName}` : 'Customer';
    const isConfirmed = await confirm({
      title: 'Return Item to Stock',
      message: `Release "${cartItem.name}" (Qty: ${cartItem.quantity}) back to store inventory stock?\nThis will immediately restore stock count and remove the item from ${custName}'s shopping cart.`,
      confirmText: 'Release & Return to Stack',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cartItem.id, action: 'releaseToStock' }),
      });
      if (res.ok) {
        setAdminCartItems((prev) => prev.filter((i) => i.id !== cartItem.id));
        // Refresh inventory dataset
        fetch('/api/inventory').then((r) => r.json()).then((data) => { if (Array.isArray(data)) setInventory(data); });
        showAlert({
          title: 'Item Returned to Stock',
          message: `"${cartItem.name}" has been returned to the inventory stock and removed from ${custName}'s cart.`,
        });
      } else {
        showAlert({ title: 'Error', message: 'Failed to release item to stock.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      showAlert({ title: 'Error', message: 'Failed to release item to stock.', type: 'error' });
    }
  };

  const handleOpenAcceptOrderModal = (order: Order) => {
    setSelectedOrderToSchedule(order);
    setOrderScheduleTechId(technicians.length > 0 ? technicians[0].id : '');
    const tomorrow = new Date(Date.now() + 86400000);
    setOrderScheduleDate(tomorrow.toISOString().split('T')[0]);
    setOrderScheduleTimeSlot('Morning (08:00 AM - 12:00 PM)');
    setOrderScheduleNotes('');
    setOverrideDownpayment(false);
  };

  const handleConfirmScheduleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderToSchedule) return;

    if (!selectedOrderToSchedule.hasDownpayment && !overrideDownpayment) {
      showAlert({
        title: 'Downpayment Required',
        message: 'This order does not have a verified downpayment yet. First-time AC buyers require a 15% downpayment before scheduling delivery. Check "Admin Override" if payment was completed in-store.',
        type: 'error',
      });
      return;
    }

    if (!orderScheduleTechId) {
      showAlert({ title: 'Technician Required', message: 'Please select a certified technician to assign.', type: 'error' });
      return;
    }

    if (!orderScheduleDate) {
      showAlert({ title: 'Date Required', message: 'Please select a delivery & installation schedule date.', type: 'error' });
      return;
    }

    setIsSubmittingOrderSchedule(true);
    const assignedTech = technicians.find((t) => t.id === orderScheduleTechId) || {
      id: orderScheduleTechId,
      firstName: 'Certified',
      lastName: 'Technician',
    };
    const scheduledDateStr = `${orderScheduleDate} ${orderScheduleTimeSlot}`;

    try {
      // 1. Create Dispatch item
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatchNo: 'DIS-' + Math.floor(1000 + Math.random() * 9000),
          type: 'New Installation',
          customerId: selectedOrderToSchedule.userId,
          name: selectedOrderToSchedule.name,
          location: selectedOrderToSchedule.location,
          item: selectedOrderToSchedule.item,
          status: 'Assigned',
          scheduledDate: scheduledDateStr,
          assignedTechName: `${assignedTech.firstName} ${assignedTech.lastName}`,
          horsepower: selectedOrderToSchedule.hp || selectedOrderToSchedule.item.match(/\b(\d+(?:\.\d+)?\s*HP)\b/i)?.[1] || null,
          technicianIds: [assignedTech.id],
          notes: orderScheduleNotes || `Delivery & Installation for Order #${selectedOrderToSchedule.orderNo}`,
        }),
      });

      // 2. Update Order status in DB
      const updatePayload: any = {
        id: selectedOrderToSchedule.id,
        status: 'Approved',
        assignedTech: `${assignedTech.firstName} ${assignedTech.lastName}`,
        scheduledDate: scheduledDateStr,
      };
      if (overrideDownpayment) {
        updatePayload.hasDownpayment = true;
      }

      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      // 3. Auto-register AC for customer dashboard
      if (selectedOrderToSchedule.userId && selectedOrderToSchedule.userId !== 'guest') {
        const addrOnly = selectedOrderToSchedule.location ? selectedOrderToSchedule.location.split('| COORDS:')[0].trim() : 'Customer Address';
        await fetch('/api/registered-acs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedOrderToSchedule.userId,
            location: 'Default Address',
            brandModel: selectedOrderToSchedule.item,
            acType: selectedOrderToSchedule.itemType || 'Split Type Inverter',
            horsepower: selectedOrderToSchedule.hp || selectedOrderToSchedule.item.match(/\b(\d+(?:\.\d+)?\s*HP)\b/i)?.[1] || '1.5 HP',
            paymentType: selectedOrderToSchedule.payment === 'Installment' ? 'Installment' : 'Cash',
            fullAddress: addrOnly,
            purchasedFromStore: true,
          }),
        }).catch(console.error);
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderToSchedule.id
            ? {
                ...o,
                status: 'Approved',
                assignedTech: `${assignedTech.firstName} ${assignedTech.lastName}`,
                scheduledDate: scheduledDateStr,
                hasDownpayment: overrideDownpayment ? true : o.hasDownpayment,
              }
            : o
        )
      );

      fetch('/api/dispatch').then((r) => r.json()).then(setDispatch).catch(console.error);

      showAlert({
        title: 'Order Accepted & Scheduled',
        message: `Order #${selectedOrderToSchedule.orderNo} has been assigned to ${assignedTech.firstName} ${assignedTech.lastName} for ${scheduledDateStr} and sent to Dispatch!`,
        type: 'success',
      });

      setSelectedOrderToSchedule(null);
    } catch (err) {
      console.error('Error scheduling order:', err);
      showAlert({ title: 'Error', message: 'Failed to accept and schedule order. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingOrderSchedule(false);
    }
  };

  const handleSend3DayNotice = async (order: Order) => {
    const isConfirmed = await confirm({
      title: 'Send 3-Day Notice',
      message: `Put a 3-Day Downpayment Notice on order ${order.orderNo}? The customer will have 72 hours to settle payment or the order will be forced cancelled.`,
      confirmText: 'Send Notice',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          notice3Days: true,
          notice3DaysAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setOrders(orders.map((o) => (o.id === order.id ? { ...o, notice3Days: true, notice3DaysAt: new Date().toISOString() } : o)));
        showAlert({ title: 'Notice Sent', message: '3-Day countdown timer has started for this order.' });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to send notice', type: 'error' });
    }
  };

  // Open Schedule Service Modal so Admin can assign tech & date
  const openScheduleServiceModal = (service: MaintenanceItem) => {
    setSelectedServiceToSchedule(service);
    if (service.technicianId) {
      setScheduleTechId(service.technicianId);
    } else if (technicians.length > 0) {
      setScheduleTechId(technicians[0].id);
    } else {
      setScheduleTechId('');
    }
    const tomorrow = new Date(Date.now() + 86400000);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTimeSlot('Morning (08:00 AM - 12:00 PM)');
    setScheduleNotes(service.notes || '');
  };

  // Submit technician assignment and scheduling for customer service
  const handleConfirmScheduleService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceToSchedule) return;

    if (!scheduleTechId) {
      showAlert({ title: 'Technician Required', message: 'Please select a technician to assign.', type: 'warning' });
      return;
    }
    if (!scheduleDate) {
      showAlert({ title: 'Date Required', message: 'Please select a service date.', type: 'warning' });
      return;
    }

    const assignedTech = technicians.find((t) => t.id === scheduleTechId) || {
      id: scheduleTechId,
      firstName: 'Certified',
      lastName: 'Technician',
    };
    const scheduledDateStr = `${scheduleDate} ${scheduleTimeSlot}`;

    try {
      // 1. Create Dispatch Item
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatchNo: 'DIS-' + Math.floor(1000 + Math.random() * 9000),
          type: selectedServiceToSchedule.serviceType,
          customerId: selectedServiceToSchedule.customerId,
          name: selectedServiceToSchedule.name,
          location: selectedServiceToSchedule.address,
          item: selectedServiceToSchedule.item,
          horsepower: selectedServiceToSchedule.item?.match(/\b(\d+(?:\.\d+)?\s*HP)\b/i)?.[1] || null,
          status: 'Assigned',
          scheduledDate: scheduledDateStr,
          assignedTechName: `${assignedTech.firstName} ${assignedTech.lastName}`,
          technicianIds: [assignedTech.id],
          notes: scheduleNotes || selectedServiceToSchedule.notes || '',
        }),
      });

      // 2. Update Maintenance status
      await fetch('/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedServiceToSchedule.id,
          status: 'IN_PROGRESS',
          technicianId: assignedTech.id,
          technicianName: `${assignedTech.firstName} ${assignedTech.lastName}`,
          scheduledDate: scheduledDateStr,
          notes: scheduleNotes || selectedServiceToSchedule.notes || '',
        }),
      });

      setMaintenance(
        maintenance.map((m) =>
          m.id === selectedServiceToSchedule.id
            ? {
                ...m,
                status: 'IN_PROGRESS',
                technicianId: assignedTech.id,
                technicianName: `${assignedTech.firstName} ${assignedTech.lastName}`,
                scheduledDate: scheduledDateStr,
              }
            : m
        )
      );
      fetch('/api/dispatch').then((r) => r.json()).then(setDispatch).catch(console.error);

      setSelectedServiceToSchedule(null);
      showAlert({
        title: 'Service Accepted & Dispatched',
        message: `Assigned Technician ${assignedTech.firstName} ${assignedTech.lastName} for ${scheduledDateStr}. Dispatched successfully!`,
      });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to assign technician and schedule service.', type: 'error' });
    }
  };

  // ==========================================
  // INSTALLMENT APPROVAL ACTIONS
  // ==========================================
  const handleAcceptCI = async (inst: Installment) => {
    const isConfirmed = await confirm({
      title: 'Accept for CI',
      message: `Accept application ${inst.appId} for Credit Investigation (CI)? Once accepted for CI, you can then assign a technician and schedule the installation.`,
      confirmText: 'Accept for CI',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inst.id, status: 'CI_ACCEPTED' }),
      });

      if (res.ok) {
        setInstallments(installments.map((i) => (i.id === inst.id ? { ...i, status: 'CI_ACCEPTED' } : i)));
        showAlert({ title: 'CI Accepted', message: `Application ${inst.appId} is now accepted for CI! You can now proceed to Assign & Schedule.` });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to update installment status', type: 'error' });
    }
  };

  const handleRejectInstallment = async (inst: Installment) => {
    const isConfirmed = await confirm({
      title: 'Reject Application',
      message: `Are you sure you want to reject installment application ${inst.appId}?`,
      confirmText: 'Reject Application',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inst.id, status: 'REJECTED' }),
      });

      if (res.ok) {
        setInstallments(installments.map((i) => (i.id === inst.id ? { ...i, status: 'REJECTED' } : i)));
        showAlert({ title: 'Application Rejected', message: `Application ${inst.appId} has been marked as Rejected.` });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to reject installment application', type: 'error' });
    }
  };

  const handleOpenScheduleInstallmentModal = (inst: Installment) => {
    if (inst.status !== 'CI_ACCEPTED') {
      showAlert({
        title: 'CI Acceptance Required',
        message: 'This installment application must first be accepted for Credit Investigation (CI) before you can assign a technician and schedule the installation.',
        type: 'warning',
      });
      return;
    }
    setSelectedInstallmentToSchedule(inst);
    setInstallmentScheduleTechId(technicians.length > 0 ? technicians[0].id : '');
    const tomorrow = new Date(Date.now() + 86400000);
    setInstallmentScheduleDate(tomorrow.toISOString().split('T')[0]);
    setInstallmentScheduleTimeSlot('Morning (08:00 AM - 12:00 PM)');
    setInstallmentScheduleNotes(`New Installation for Installment #${inst.appId}`);
  };

  const handleConfirmScheduleInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallmentToSchedule) return;

    if (!installmentScheduleTechId) {
      showAlert({ title: 'Technician Required', message: 'Please select a technician to assign.', type: 'error' });
      return;
    }

    if (!installmentScheduleDate) {
      showAlert({ title: 'Date Required', message: 'Please select an installation schedule date.', type: 'error' });
      return;
    }

    setIsSubmittingInstallmentSchedule(true);
    const assignedTech = technicians.find((t) => t.id === installmentScheduleTechId) || {
      id: installmentScheduleTechId,
      firstName: 'Certified',
      lastName: 'Technician',
    };
    const scheduledDateStr = `${installmentScheduleDate} ${installmentScheduleTimeSlot}`;

    try {
      // 1. Send to Dispatch Queue
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatchNo: 'DIS-' + Math.floor(1000 + Math.random() * 9000),
          type: 'New Installation',
          customerId: selectedInstallmentToSchedule.userId || 'guest',
          name: selectedInstallmentToSchedule.name,
          location: selectedInstallmentToSchedule.location || 'Customer Address',
          item: selectedInstallmentToSchedule.item,
          horsepower: selectedInstallmentToSchedule.item?.match(/\b(\d+(?:\.\d+)?\s*HP)\b/i)?.[1] || null,
          status: 'Assigned',
          scheduledDate: scheduledDateStr,
          assignedTechName: `${assignedTech.firstName} ${assignedTech.lastName}`,
          technicianIds: [assignedTech.id],
          notes: installmentScheduleNotes || `Delivery & Installation for Installment #${selectedInstallmentToSchedule.appId}`,
        }),
      });

      // 2. Update Installment application status to COMPLETED with assignedTech and scheduledDate
      await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInstallmentToSchedule.id,
          status: 'COMPLETED',
          assignedTech: `${assignedTech.firstName} ${assignedTech.lastName}`,
          scheduledDate: scheduledDateStr,
        }),
      });

      // 3. Auto register AC for customer
      if (selectedInstallmentToSchedule.userId && selectedInstallmentToSchedule.userId !== 'guest') {
        await fetch('/api/registered-acs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedInstallmentToSchedule.userId,
            location: selectedInstallmentToSchedule.location || 'Customer Address',
            brandModel: selectedInstallmentToSchedule.item,
            acType: 'Split Type Inverter',
            horsepower: selectedInstallmentToSchedule.item?.match(/\b(\d+(?:\.\d+)?\s*HP)\b/i)?.[1] || '1.5 HP',
            paymentType: 'Installment',
            months: selectedInstallmentToSchedule.term,
            purchasedFromStore: true,
          }),
        }).catch(console.error);
      }

      setInstallments((prev) =>
        prev.map((i) =>
          i.id === selectedInstallmentToSchedule.id
            ? {
                ...i,
                status: 'COMPLETED',
                assignedTech: `${assignedTech.firstName} ${assignedTech.lastName}`,
                scheduledDate: scheduledDateStr,
              }
            : i
        )
      );

      // Refresh dispatch list
      const dispatchRes = await fetch('/api/dispatch').then((r) => r.json());
      if (Array.isArray(dispatchRes)) {
        setDispatch(dispatchRes);
      }

      setSelectedInstallmentToSchedule(null);
      showAlert({
        title: 'Installment Scheduled & Dispatched',
        message: `Application #${selectedInstallmentToSchedule.appId} approved! Assigned to ${assignedTech.firstName} ${assignedTech.lastName} for ${scheduledDateStr}. It is now in Dispatch & Schedule under New Installation.`,
      });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to schedule installment application.', type: 'error' });
    } finally {
      setIsSubmittingInstallmentSchedule(false);
    }
  };

  const handleApproveInstallment = (inst: Installment) => {
    handleOpenScheduleInstallmentModal(inst);
  };

  // ==========================================
  // USER DIRECTORY ACTIONS
  // ==========================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName || !newEmail || !newPassword) {
      showAlert({ title: 'Required', message: 'Please fill out all user fields.', type: 'warning' });
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail,
          phone: newPhone,
          password: newPassword,
          role: newRole,
          techRank: isCustomRole
            ? (newCustomRoleTitle.trim() || 'Custom Staff')
            : (newRole === 'TECHNICIAN' ? newTechRank : null),
          permissions: newPermissions,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setAllUsers([created, ...allUsers]);
        setShowAddUserModal(false);
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewPhone('');
        setNewPassword('');
        setNewRole('CUSTOMER');
        setNewTechRank('Senior Tech');
        setIsCustomRole(false);
        setNewCustomRoleTitle('');
        setNewPermissions([]);
        showAlert({ title: 'User Created', message: `${created.techRank || created.role} account created successfully!` });
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create user');
      }
    } catch (err: any) {
      console.error(err);
      showAlert({ title: 'Error', message: err.message || 'Error creating user', type: 'error' });
    }
  };

  // Open Edit User Modal
  const openEditUser = (user: AppUser) => {
    setEditingUser(user);
    setEditRole((user.role as any) || 'CUSTOMER');
    const isCustom = Boolean(user.techRank && !TECH_RANKS.includes(user.techRank));
    setIsEditCustomRole(isCustom);
    setEditCustomRoleTitle(isCustom ? (user.techRank || '') : '');
    setEditTechRank(!isCustom && user.techRank ? user.techRank : 'Senior Tech');
    try {
      const parsed = JSON.parse(user.permissions || '[]');
      setEditPermissions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setEditPermissions([]);
    }
  };

  // Save Edit User
  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    setIsSavingEdit(true);
    try {
      const assignedTechRank = isEditCustomRole
        ? (editCustomRoleTitle.trim() || 'Custom Staff')
        : (editRole === 'TECHNICIAN' ? editTechRank : null);

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          role: editRole,
          techRank: assignedTechRank,
          permissions: editPermissions,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAllUsers(allUsers.map((u) => (u.id === updated.id ? updated : u)));
        setEditingUser(null);
        showAlert({ title: 'User Updated', message: `${updated.firstName} ${updated.lastName}'s profile updated successfully!` });
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user');
      }
    } catch (err: any) {
      console.error(err);
      showAlert({ title: 'Error', message: err.message || 'Error updating user', type: 'error' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Toggle permission helper
  const togglePermission = (perms: string[], key: string): string[] =>
    perms.includes(key) ? perms.filter((p) => p !== key) : [...perms, key];

  // ==========================================
  // MAINTENANCE SCHEDULE NOTIFICATIONS (6-MONTH)
  // ==========================================
  const handleSend6MonthReminder = async (m: MaintenanceItem) => {
    const isConfirmed = await confirm({
      title: 'Send 6-Month Reminder',
      message: `Send 6-month routine maintenance notification to ${m.name} for "${m.item}"?`,
      confirmText: 'Send Notification',
    });
    if (!isConfirmed) return;

    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EMAIL_CUSTOMER',
          to: m.customer?.email || 'customer@frosttech.com',
          subject: 'FrostTech 6-Month Maintenance Notice',
          message: `Dear ${m.name},\nYour AC unit "${m.item}" is due for its 6-month routine maintenance inspection. Routine checks ensure maximum cooling performance and energy efficiency.\nContact FrostTech to schedule your visit!`,
        }),
      });
      showAlert({ title: 'Reminder Sent', message: `6-month maintenance notice sent to ${m.name}!` });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Failed to send notification', type: 'error' });
    }
  };

  // Open Maintenance Details & AC Modal
  const handleOpenMaintenanceDetails = (m: MaintenanceItem) => {
    setSelectedMaintenanceModal(m);

    // Parse date
    let datePart = '';
    if (m.scheduledDate && m.scheduledDate.match(/^\d{4}-\d{2}-\d{2}/)) {
      datePart = m.scheduledDate.slice(0, 10);
    } else {
      datePart = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }
    setMaintScheduleDate(datePart);
    setMaintLastDate(
      m.lastMaintenance && m.lastMaintenance !== 'First Service (New Unit)'
        ? m.lastMaintenance
        : ''
    );

    // Match technician
    if (m.technicianId) {
      setMaintScheduleTechId(m.technicianId);
    } else if (technicians.length > 0) {
      const found = technicians.find(
        (t) => `${t.firstName} ${t.lastName}`.toLowerCase() === (m.technicianName || '').toLowerCase()
      );
      setMaintScheduleTechId(found ? found.id : technicians[0].id);
    } else {
      setMaintScheduleTechId('');
    }

    setMaintStatus(m.status === 'COMPLETED' ? 'COMPLETED' : m.status === 'OVERDUE' ? 'OVERDUE' : 'SCHEDULED');
    setMaintNotes(m.notes || '');

    // Set time slot if present
    if (m.scheduledDate && m.scheduledDate.includes('09:00')) {
      setMaintScheduleTimeSlot('09:00 AM Sharp');
    } else if (m.scheduledDate && (m.scheduledDate.includes('01:00') || m.scheduledDate.includes('13:00'))) {
      setMaintScheduleTimeSlot('Afternoon (01:00 PM - 05:00 PM)');
    } else {
      setMaintScheduleTimeSlot('Morning (08:00 AM - 12:00 PM)');
    }
  };

  // Save Maintenance Schedule and Technician Assignment
  const handleSaveMaintenanceSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedMaintenanceModal) return;
    setIsSavingMaintenance(true);

    try {
      const assignedTech = technicians.find((t) => t.id === maintScheduleTechId) || (
        maintScheduleTechId
          ? { id: maintScheduleTechId, firstName: 'Assigned', lastName: 'Technician', techRank: 'Tech' }
          : null
      );
      const techName = assignedTech ? `${assignedTech.firstName} ${assignedTech.lastName}` : (selectedMaintenanceModal.technicianName || 'Certified Tech');
      const scheduledDateStr = `${maintScheduleDate} ${maintScheduleTimeSlot}`;

      // 1. Update Maintenance schedule record via PATCH
      const res = await fetch('/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMaintenanceModal.id,
          technicianId: assignedTech ? assignedTech.id : null,
          technicianName: techName,
          scheduledDate: scheduledDateStr,
          lastMaintenance: maintLastDate || null,
          status: maintStatus,
          notes: maintNotes,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update maintenance schedule');
      }

      // 2. Also ensure a dispatch item is created / synchronized so technician sees it
      if (assignedTech) {
        try {
          await fetch('/api/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dispatchNo: 'DIS-' + Math.floor(1000 + Math.random() * 9000),
              type: selectedMaintenanceModal.serviceType,
              customerId: selectedMaintenanceModal.customerId,
              name: selectedMaintenanceModal.name,
              location: selectedMaintenanceModal.address,
              item: selectedMaintenanceModal.item,
              horsepower: selectedMaintenanceModal.item?.match(/\b(\d+(?:\.\d+)?\s*HP)\b/i)?.[1] || null,
              status: 'Assigned',
              scheduledDate: scheduledDateStr,
              assignedTechName: techName,
              technicianIds: [assignedTech.id],
              notes: maintNotes || `Scheduled maintenance for ${selectedMaintenanceModal.scheduleNo}`,
            }),
          });
          fetch('/api/dispatch').then((r) => r.json()).then(setDispatch).catch(console.error);
        } catch (dispatchErr) {
          console.error('Dispatch sync error:', dispatchErr);
        }
      }

      // 3. Update local maintenance state
      setMaintenance((prev) =>
        prev.map((m) =>
          m.id === selectedMaintenanceModal.id
            ? {
                ...m,
                technicianId: assignedTech ? assignedTech.id : undefined,
                technicianName: techName,
                scheduledDate: scheduledDateStr,
                lastMaintenance: maintLastDate || 'First Service (New Unit)',
                status: maintStatus,
                notes: maintNotes,
              }
            : m
        )
      );

      showAlert({
        title: 'Maintenance Updated',
        message: `Maintenance schedule #${selectedMaintenanceModal.scheduleNo} has been assigned to ${techName} for ${scheduledDateStr}.`,
        type: 'success',
      });

      setSelectedMaintenanceModal(null);
    } catch (err) {
      console.error('Error saving maintenance schedule:', err);
      showAlert({
        title: 'Error',
        message: 'Failed to update maintenance schedule. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  // Helper functions for Dispatch service type classification
  const isReinstallType = (t: string) => {
    const s = (t || '').toLowerCase();
    return s.includes('re-install') || s.includes('reinstall') || s.includes('relocat');
  };
  const isNewInstallType = (t: string) => {
    const s = (t || '').toLowerCase();
    return s.includes('install') && !isReinstallType(t);
  };
  const isInstallationType = (t: string) => {
    const s = (t || '').toLowerCase();
    return s.includes('install');
  };
  const isDeepCleanType = (t: string) => {
    const s = (t || '').toLowerCase();
    return s.includes('clean') && (s.includes('deep') || s.includes('chem'));
  };
  const isStandardCleanType = (t: string) => {
    const s = (t || '').toLowerCase();
    return s.includes('clean') && !isDeepCleanType(t);
  };
  const isCleaningType = (t: string) => {
    const s = (t || '').toLowerCase();
    return s.includes('clean');
  };
  const isRepairType = (t: string) => {
    const s = (t || '').toLowerCase();
    return s.includes('repair') || s.includes('diagnostic');
  };

  // Category counts
  const countDispatchCategoryAll = dispatch.length;
  const countDispatchCategoryInstall = dispatch.filter((d) => isInstallationType(d.type)).length;
  const countDispatchCategoryCleaning = dispatch.filter((d) => isCleaningType(d.type)).length;
  const countDispatchCategoryRepair = dispatch.filter((d) => isRepairType(d.type)).length;

  // Sub-filter counts for Installation
  const countInstallAll = countDispatchCategoryInstall;
  const countInstallNew = dispatch.filter((d) => isNewInstallType(d.type)).length;
  const countInstallReinstall = dispatch.filter((d) => isReinstallType(d.type)).length;

  // Sub-filter counts for Cleaning
  const countCleaningAll = countDispatchCategoryCleaning;
  const countCleaningStandard = dispatch.filter((d) => isStandardCleanType(d.type)).length;
  const countCleaningDeep = dispatch.filter((d) => isDeepCleanType(d.type)).length;

  // Category & Sub-filter scoped dispatch list (before status filtering)
  const categoryScopedDispatch = dispatch.filter((d) => {
    const type = d.type || '';
    if (dispatchCategoryFilter === 'INSTALLATION') {
      if (!isInstallationType(type)) return false;
      if (dispatchInstallationSubFilter === 'NEW' && !isNewInstallType(type)) return false;
      if (dispatchInstallationSubFilter === 'REINSTALL' && !isReinstallType(type)) return false;
    } else if (dispatchCategoryFilter === 'CLEANING') {
      if (!isCleaningType(type)) return false;
      if (dispatchCleaningSubFilter === 'STANDARD' && !isStandardCleanType(type)) return false;
      if (dispatchCleaningSubFilter === 'DEEP' && !isDeepCleanType(type)) return false;
    } else if (dispatchCategoryFilter === 'REPAIR') {
      if (!isRepairType(type)) return false;
    }
    return true;
  });

  // Calculate status counts based on the active category & sub-filter selection
  const countDispatchAll = categoryScopedDispatch.length;
  const countDispatchAssigned = categoryScopedDispatch.filter((d) => (d.status || '').toLowerCase() === 'assigned').length;
  const countDispatchPending = categoryScopedDispatch.filter((d) => {
    const s = (d.status || '').toLowerCase();
    return s === 'pending' || s === 'queued';
  }).length;
  const countDispatchCompleted = categoryScopedDispatch.filter((d) => (d.status || '').toLowerCase() === 'completed').length;

  // Final filtered list including status filter
  const filteredDispatch = categoryScopedDispatch.filter((d) => {
    const s = (d.status || '').toLowerCase();
    if (dispatchStatusFilter === 'Assigned' && s !== 'assigned') return false;
    if (dispatchStatusFilter === 'Pending' && s !== 'pending' && s !== 'queued') return false;
    if (dispatchStatusFilter === 'Completed' && s !== 'completed') return false;
    return true;
  });

  const dispatchTotalPages = Math.max(1, Math.ceil(filteredDispatch.length / DISPATCH_PER_PAGE));
  const currentDispatchPage = Math.min(dispatchCurrentPage, dispatchTotalPages);
  const paginatedDispatch = filteredDispatch.slice(
    (currentDispatchPage - 1) * DISPATCH_PER_PAGE,
    currentDispatchPage * DISPATCH_PER_PAGE
  );

  return (
    <>
      <ModalComponent />

      {/* Standardized FrostTech Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          padding: '0.8rem 4%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 18px rgba(2, 100, 160, 0.25)',
        }}
      >
        <Link href="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/LOGO.jpg"
            alt="FrostTech Logo"
            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid rgba(255, 255, 255, 0.35)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.35rem', color: '#ffffff', letterSpacing: '-0.5px' }}>
              Frost<span style={{ color: '#bae6fd' }}>Tech</span>
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '0.68rem' }}></i> ADMIN
            </span>
          </div>
        </Link>

        <div style={{ display: 'flex', flex: 1, maxWidth: '480px', margin: '0 2rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search SKU, customer, model, orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                background: 'rgba(255, 255, 255, 0.16)',
                fontSize: '0.9rem',
                color: '#ffffff',
                outline: 'none',
              }}
            />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#bae6fd' }}></i>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: '#f0fdf4',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '0.35rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontWeight: 600,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
            <span>System Online</span>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setKebabOpen(!kebabOpen)}
              style={{
                background: kebabOpen ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.16)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                borderRadius: '999px',
                padding: '4px 10px 4px 5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: '#ffffff',
                transition: 'all 0.2s ease',
              }}
              title="Admin Menu"
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                }}
              >
                AD
              </div>
              <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>Admin</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.72rem', opacity: 0.85 }}></i>
            </button>

            {kebabOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
                  border: '1px solid #e2e8f0',
                  minWidth: '220px',
                  padding: '0.6rem 0',
                  zIndex: 200,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '0.75rem 1.1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Administrator</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>admin@frosttech.com</div>
                </div>

                <Link
                  href="/"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.7rem 1.2rem',
                    color: '#0f172a',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  <i className="fa-solid fa-store" style={{ color: '#0284c7', width: '16px' }}></i> View Storefront
                </Link>
                <Link
                  href="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.7rem 1.2rem',
                    color: '#0f172a',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  <i className="fa-solid fa-user" style={{ color: '#0284c7', width: '16px' }}></i> Customer View
                </Link>
                <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                <a
                  href="#"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.7rem 1.2rem',
                    color: '#ef4444',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                  }}
                >
                  <i className="fa-solid fa-right-from-bracket" style={{ width: '16px' }}></i> Log Out
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Layout */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)', background: '#f5f5f5' }}>
        {/* Mobile toggle */}
        <div className="mobile-only" style={{ position: 'fixed', top: '75px', left: '10px', zIndex: 40, width: '40px', height: '40px' }}>
          <button
            onClick={() => setAdminMobileOpen(!adminMobileOpen)}
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
            }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        {/* Admin Sidebar Navigation */}
        <aside
          style={{
            width: isAdminSidebarCollapsed ? '70px' : '260px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: '1.5rem 0.8rem',
            transition: 'all 0.3s ease',
            flexShrink: 0,
            overflowY: isAdminSidebarCollapsed ? 'visible' : 'auto',
            overflowX: 'visible',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.4rem' }}>
            {!isAdminSidebarCollapsed && (
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Management
              </h3>
            )}
            <button
              onClick={() => setIsAdminSidebarCollapsed(!isAdminSidebarCollapsed)}
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
              <i className={`fa-solid ${isAdminSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('tab-inventory'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-inventory' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-inventory' ? '#e0f2fe' : 'transparent',
                }}
              >
                <i className="fa-solid fa-boxes-stacked" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isAdminSidebarCollapsed && <span>Inventory</span>}
              </a>
            </li>

            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('tab-pos'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-pos' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-pos' ? '#e0f2fe' : 'transparent',
                }}
              >
                <i className="fa-solid fa-cash-register" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isAdminSidebarCollapsed && <span>Point of Sale</span>}
              </a>
            </li>

            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('tab-installations'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-installations' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-installations' ? '#e0f2fe' : 'transparent',
                }}
              >
                <i className="fa-solid fa-clipboard-check" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isAdminSidebarCollapsed && <span>Order & Services</span>}
                {!isAdminSidebarCollapsed && (orders.filter((o) => o.status === 'Processing' || o.status === 'Pending').length + maintenance.filter((m) => m.status === 'SCHEDULED' || m.status === 'Pending').length) > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', padding: '2px 7px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {orders.filter((o) => o.status === 'Processing' || o.status === 'Pending').length + maintenance.filter((m) => m.status === 'SCHEDULED' || m.status === 'Pending').length}
                  </span>
                )}
              </a>
            </li>

            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('tab-installments'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-installments' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-installments' ? '#e0f2fe' : 'transparent',
                }}
              >
                <i className="fa-solid fa-file-invoice-dollar" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isAdminSidebarCollapsed && <span>Installment Approvals</span>}
                {!isAdminSidebarCollapsed && installments.filter((i) => i.status === 'PENDING' || i.status === 'CI_ACCEPTED').length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#f59e0b', color: 'white', padding: '2px 7px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {installments.filter((i) => i.status === 'PENDING' || i.status === 'CI_ACCEPTED').length}
                  </span>
                )}
              </a>
            </li>

            {/* DISPATCH & SCHEDULE WITH ACCORDION DROPDOWN & FLYOUT */}
            <li
              style={{ position: 'relative' }}
              onMouseEnter={() => {
                if (isAdminSidebarCollapsed) setIsDispatchFlyoutOpen(true);
              }}
              onMouseLeave={() => {
                if (isAdminSidebarCollapsed) setIsDispatchFlyoutOpen(false);
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isAdminSidebarCollapsed ? '0.75rem 0.5rem' : '0.75rem 1rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: activeTab === 'tab-dispatch' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-dispatch' ? '#e0f2fe' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('tab-dispatch');
                  if (dispatchCategoryFilter === 'ALL') {
                    setDispatchCategoryFilter('INSTALLATION');
                  }
                  if (!isAdminSidebarCollapsed) {
                    setIsDispatchSubmenuOpen(!isDispatchSubmenuOpen);
                  } else {
                    setIsDispatchFlyoutOpen(!isDispatchFlyoutOpen);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isAdminSidebarCollapsed ? '100%' : 'auto', justifyContent: isAdminSidebarCollapsed ? 'center' : 'flex-start' }}>
                  <i
                    className="fa-solid fa-truck-fast"
                    style={{
                      width: '20px',
                      textAlign: 'center',
                      color: '#0284c7',
                      fontSize: '1rem',
                    }}
                  ></i>
                  {!isAdminSidebarCollapsed && (
                    <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>Dispatch & Schedule</span>
                  )}
                </div>

                {!isAdminSidebarCollapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDispatchSubmenuOpen(!isDispatchSubmenuOpen);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeTab === 'tab-dispatch' ? '#0284c7' : '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <i
                      className="fa-solid fa-chevron-down"
                      style={{
                        fontSize: '0.72rem',
                        transition: 'transform 0.2s ease',
                        transform: isDispatchSubmenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    ></i>
                  </button>
                )}
              </div>

              {/* Submenu: EXPANDED SIDEBAR ACCORDION DROPDOWN */}
              {!isAdminSidebarCollapsed && isDispatchSubmenuOpen && (
                <ul
                  style={{
                    listStyle: 'none',
                    margin: '4px 0 6px 1.5rem',
                    padding: '0 0 0 0.65rem',
                    borderLeft: '2px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  {[
                    { key: 'INSTALLATION', label: 'Installation', icon: 'fa-screwdriver-wrench', count: countDispatchCategoryInstall },
                    { key: 'CLEANING', label: 'Cleaning', icon: 'fa-spray-can-sparkles', count: countDispatchCategoryCleaning },
                    { key: 'REPAIR', label: 'Repair', icon: 'fa-wrench', count: countDispatchCategoryRepair },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'tab-dispatch' && dispatchCategoryFilter === sub.key;
                    return (
                      <li key={sub.key}>
                        <a
                          href="#"
                          onClick={(e) => handleSelectDispatchCategory(sub.key as any, e)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.83rem',
                            fontWeight: isSubActive ? 700 : 500,
                            color: isSubActive ? '#0284c7' : '#64748b',
                            background: isSubActive ? '#e0f2fe' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className={`fa-solid ${sub.icon}`} style={{ fontSize: '0.78rem', color: isSubActive ? '#0284c7' : '#94a3b8', width: '14px', textAlign: 'center' }}></i>
                            <span>{sub.label}</span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: isSubActive ? '#0284c7' : '#f1f5f9',
                              color: isSubActive ? '#ffffff' : '#64748b',
                            }}
                          >
                            {sub.count}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Submenu: COLLAPSED SIDEBAR FLYOUT POPOVER (MATCHING REFERENCE IMAGE) */}
              {isAdminSidebarCollapsed && isDispatchFlyoutOpen && (
                <div
                  style={{
                    position: 'absolute',
                    left: 'calc(100% + 10px)',
                    top: '-4px',
                    background: '#0b1437',
                    borderRadius: '14px',
                    padding: '0.8rem 0.6rem',
                    width: '215px',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                  onMouseEnter={() => setIsDispatchFlyoutOpen(true)}
                  onMouseLeave={() => setIsDispatchFlyoutOpen(false)}
                >
                  {/* Flyout Header */}
                  <div
                    style={{
                      padding: '0.35rem 0.65rem 0.6rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-truck-fast" style={{ color: '#38bdf8' }}></i>
                    <span>Dispatch & Schedule</span>
                  </div>

                  {/* Submenu items */}
                  {[
                    { key: 'INSTALLATION', label: 'Installation', icon: 'fa-screwdriver-wrench', count: countDispatchCategoryInstall },
                    { key: 'CLEANING', label: 'Cleaning', icon: 'fa-spray-can-sparkles', count: countDispatchCategoryCleaning },
                    { key: 'REPAIR', label: 'Repair', icon: 'fa-wrench', count: countDispatchCategoryRepair },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'tab-dispatch' && dispatchCategoryFilter === sub.key;
                    return (
                      <a
                        key={sub.key}
                        href="#"
                        onClick={(e) => handleSelectDispatchCategory(sub.key as any, e)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.7rem',
                          borderRadius: '8px',
                          fontSize: '0.83rem',
                          fontWeight: isSubActive ? 700 : 500,
                          color: isSubActive ? '#38bdf8' : '#e2e8f0',
                          background: isSubActive ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#e2e8f0';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className={`fa-solid ${sub.icon}`} style={{ fontSize: '0.8rem', color: isSubActive ? '#38bdf8' : '#94a3b8', width: '14px', textAlign: 'center' }}></i>
                          <span>{sub.label}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: isSubActive ? '#0284c7' : 'rgba(255, 255, 255, 0.14)',
                            color: '#ffffff',
                          }}
                        >
                          {sub.count}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </li>

            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('tab-maintenance'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-maintenance' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-maintenance' ? '#e0f2fe' : 'transparent',
                }}
              >
                <i className="fa-solid fa-calendar-check" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isAdminSidebarCollapsed && <span>Maintenance Schedule</span>}
              </a>
            </li>

            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('tab-users'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-users' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-users' ? '#e0f2fe' : 'transparent',
                }}
              >
                <i className="fa-solid fa-users-gear" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isAdminSidebarCollapsed && <span>User Directory</span>}
              </a>
            </li>

            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('tab-invoices'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: activeTab === 'tab-invoices' ? '#0284c7' : '#475569',
                  background: activeTab === 'tab-invoices' ? '#e0f2fe' : 'transparent',
                }}
              >
                <i className="fa-solid fa-file-invoice" style={{ width: '20px', textAlign: 'center', color: '#0284c7' }}></i>
                {!isAdminSidebarCollapsed && <span>Invoices</span>}
              </a>
            </li>
          </ul>
        </aside>

        {/* Main Workspace */}
        <main style={{ flex: 1, padding: '2rem 3%', overflowY: 'auto' }}>
          {/* TAB 1: UNIFIED INVENTORY */}
          {activeTab === 'tab-inventory' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>
                    Unified Inventory
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Manage both Air Conditioners and Spare Parts in one unified inventory with horsepower specs and auto-storefront publishing.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handlePrintInventoryReport}
                    style={{
                      padding: '0.65rem 1.2rem',
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-print" style={{ color: '#0284c7' }}></i> Print / Generate Report
                  </button>

                  <button
                    onClick={() => {
                      setNewProductImages([]);
                      setIsAddProductModalOpen(true);
                    }}
                    style={{
                      padding: '0.65rem 1.25rem',
                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                    }}
                  >
                    <i className="fa-solid fa-plus"></i> Add Product
                  </button>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                {/* Filter buttons: All, AC, Spare parts */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['All', 'AC', 'Parts'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setInvFilterType(type)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: invFilterType === type ? '#0284c7' : '#cbd5e1',
                        background: invFilterType === type ? '#0284c7' : '#ffffff',
                        color: invFilterType === type ? 'white' : '#475569',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      {type === 'All' ? 'All Items' : type === 'AC' ? 'Air Conditioners' : 'Spare Parts'}
                    </button>
                  ))}
                </div>

                {/* Dropdown Filters: Model, Category, Status */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={invModelFilter}
                    onChange={(e) => setInvModelFilter(e.target.value)}
                    style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}
                  >
                    <option value="All">All Models</option>
                    {uniqueModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={invCategoryFilter}
                    onChange={(e) => setInvCategoryFilter(e.target.value)}
                    style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}
                  >
                    <option value="All">All Categories</option>
                    <option value="Window Type">Window Type</option>
                    <option value="Split Type Inverter">Split Type</option>
                    <option value="Floor Standing">Floor Standing</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>

                  <select
                    value={invStatusFilter}
                    onChange={(e) => setInvStatusFilter(e.target.value)}
                    style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}
                  >
                    <option value="All">All Status</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Unified Inventory Table */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image</th>
                      <th style={{ padding: '0.9rem 1rem' }}>SKU</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Brand & Model</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.9rem 1rem' }}>HP</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Price</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Stock & Status</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Date Added</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                          No inventory items found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <img
                              src={item.image || (item.images && item.images[0]) || '/hero-bg.png'}
                              alt={item.model}
                              style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain', background: '#f1f5f9', border: '1px solid #e2e8f0' }}
                            />
                          </td>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>{item.sku}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <strong style={{ color: '#0f172a' }}>{item.brand}</strong> {item.model}
                          </td>
                          <td style={{ padding: '0.8rem 1rem', color: '#64748b' }}>{item.category}</td>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 600, color: '#0284c7' }}>
                            {item.horsepower || 'N/A'}
                          </td>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            ₱{item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: item.stock > 5 ? '#dcfce7' : item.stock > 0 ? '#fef3c7' : '#fee2e2',
                                color: item.stock > 5 ? '#16a34a' : item.stock > 0 ? '#b45309' : '#dc2626',
                              }}
                            >
                              {item.stock} in stock
                            </span>
                          </td>
                          <td style={{ padding: '0.8rem 1rem', color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {/* Eye icon to view description */}
                              <button
                                title="View Description & Details"
                                onClick={() => setViewingItem(item)}
                                style={{
                                  background: '#e0f2fe',
                                  color: '#0284c7',
                                  border: 'none',
                                  borderRadius: '6px',
                                  width: '32px',
                                  height: '32px',
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>

                              {/* Restock button */}
                              <button
                                title="Add Stock"
                                onClick={() => handleRestock(item)}
                                style={{
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  width: '32px',
                                  height: '32px',
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="fa-solid fa-plus"></i>
                              </button>

                              {/* Delete button */}
                              <button
                                title="Delete Item"
                                onClick={async () => {
                                  const proceed = await confirm({ title: 'Delete Item', message: `Delete ${item.brand} ${item.model}?` });
                                  if (proceed) {
                                    await fetch(`/api/inventory?id=${item.id}`, { method: 'DELETE' });
                                    setInventory(inventory.filter((i) => i.id !== item.id));
                                  }
                                }}
                                style={{
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  borderRadius: '6px',
                                  width: '32px',
                                  height: '32px',
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: POINT OF SALE (POS) */}
          {activeTab === 'tab-pos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>Point of Sale (POS)</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Process direct retail walk-in sales for storefront air conditioners and spare parts.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['All', 'AC', 'Parts'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPosFilter(filter)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: posFilter === filter ? '#0284c7' : '#cbd5e1',
                        background: posFilter === filter ? '#0284c7' : '#ffffff',
                        color: posFilter === filter ? 'white' : '#475569',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      {filter === 'All' ? 'All Products' : filter === 'AC' ? 'Air Conditioners' : 'Spare Parts'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Left: Product Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {inventory
                    .filter((item) => {
                      const isSpare = item.category.toLowerCase().includes('part');
                      if (posFilter === 'AC' && isSpare) return false;
                      if (posFilter === 'Parts' && !isSpare) return false;
                      if (posSearch.trim()) {
                        return (
                          item.brand.toLowerCase().includes(posSearch.toLowerCase()) ||
                          item.model.toLowerCase().includes(posSearch.toLowerCase())
                        );
                      }
                      return true;
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleAddToPos(item)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#0284c7';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <img
                          src={item.image || '/hero-bg.png'}
                          alt={item.model}
                          style={{ width: '100%', height: '110px', objectFit: 'contain', background: '#f8fafc', borderRadius: '8px', marginBottom: '0.5rem' }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>{item.brand}</span>
                        <h4 style={{ margin: '2px 0 4px', fontSize: '0.92rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.model}
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                            ₱{item.price.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: item.stock > 0 ? '#16a34a' : '#dc2626' }}>
                            {item.stock} left
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Right: POS Order & Discount Cart */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                    <i className="fa-solid fa-cart-shopping" style={{ color: '#0284c7', marginRight: '6px' }}></i> Current Order
                  </h3>

                  <div style={{ minHeight: '180px', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                    {posCart.length === 0 ? (
                      <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '3rem' }}>Select products on the left to add to cart</p>
                    ) : (
                      posCart.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{item.brand} {item.model}</div>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>₱{item.price.toLocaleString()} × {item.cartQty}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>₱{(item.price * item.cartQty).toLocaleString()}</span>
                            <button onClick={() => handleRemoveFromPos(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Discount button & Calculation */}
                  <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#64748b' }}>
                      <span>Subtotal:</span>
                      <span>₱{posSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                      <button
                        type="button"
                        onClick={handleApplyDiscountPrompt}
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          color: '#b45309',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <i className="fa-solid fa-tag"></i> {posDiscountType === 'none' ? '+ Add Discount' : 'Change Discount'}
                      </button>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        {posDiscountAmount > 0 ? `- ₱${posDiscountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                      <span>Total:</span>
                      <span style={{ color: '#0284c7' }}>₱{posFinalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (posCart.length === 0) return showAlert({ title: 'Empty', message: 'Cart is empty', type: 'warning' });
                      showAlert({ title: 'Receipt Generated', message: `Order of ₱${posFinalTotal.toLocaleString()} checked out successfully!` });
                      setPosCart([]);
                      setPosDiscountType('none');
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      color: 'white',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                    }}
                  >
                    Proceed Checkout & Receipt &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER & SERVICES (WITH CUSTOMER ORDER & CUSTOMER SERVICES FILTERS) */}
          {activeTab === 'tab-installations' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>Order & Services</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Manage cash-based store pick up orders and customer service dispatch schedules.
                  </p>
                </div>

                {/* Section Switcher: Customer Orders vs Customer Services (No 'All' button) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '5px', marginRight: '4px' }}>
                    <i className="fa-solid fa-layer-group" style={{ color: '#0284c7' }}></i>
                    Section:
                  </span>
                  {[
                    { key: 'ORDERS', label: 'Customer Orders', icon: 'fa-cart-shopping', count: orders.length, color: '#0284c7' },
                    { key: 'SERVICES', label: 'Customer Services', icon: 'fa-screwdriver-wrench', count: maintenance.length, color: '#d97706' },
                  ].map((btn) => {
                    const isActive = orderServiceFilter === btn.key;
                    return (
                      <button
                        key={btn.key}
                        type="button"
                        onClick={() => setOrderServiceFilter(btn.key as any)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          border: isActive ? `1.5px solid ${btn.color}` : '1px solid #cbd5e1',
                          background: isActive ? btn.color : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? `0 2px 8px ${btn.color}40` : 'none',
                        }}
                      >
                        {btn.icon && <i className={`fa-solid ${btn.icon}`} style={{ fontSize: '0.8rem' }}></i>}
                        <span>{btn.label}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                            color: isActive ? '#ffffff' : btn.color || '#475569',
                            fontWeight: 800,
                          }}
                        >
                          {btn.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Orders Section (Separated) */}
              {orderServiceFilter === 'ORDERS' && (
                <div>
                  {/* Sub-tabs: Store Pick Up Orders vs Active Cart Holds */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setCustomerOrderSubTab('PICKUP_ORDERS')}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        background: customerOrderSubTab === 'PICKUP_ORDERS' ? '#0284c7' : '#f8fafc',
                        color: customerOrderSubTab === 'PICKUP_ORDERS' ? '#ffffff' : '#475569',
                        border: customerOrderSubTab === 'PICKUP_ORDERS' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <i className="fa-solid fa-store" style={{ fontSize: '0.85rem' }}></i>
                      <span>Store Pick Up Orders</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          background: customerOrderSubTab === 'PICKUP_ORDERS' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                          color: customerOrderSubTab === 'PICKUP_ORDERS' ? '#ffffff' : '#475569',
                          fontWeight: 800,
                        }}
                      >
                        {orders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerOrderSubTab('CART_HOLDS')}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        background: customerOrderSubTab === 'CART_HOLDS' ? '#d97706' : '#f8fafc',
                        color: customerOrderSubTab === 'CART_HOLDS' ? '#ffffff' : '#475569',
                        border: customerOrderSubTab === 'CART_HOLDS' ? '1px solid #d97706' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <i className="fa-solid fa-clock" style={{ fontSize: '0.85rem' }}></i>
                      <span>Active Cart Holds (Stock Reduced)</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          background: customerOrderSubTab === 'CART_HOLDS' ? 'rgba(255,255,255,0.25)' : '#fee2e2',
                          color: customerOrderSubTab === 'CART_HOLDS' ? '#ffffff' : '#dc2626',
                          fontWeight: 800,
                        }}
                      >
                        {adminCartItems.length}
                      </span>
                    </button>
                  </div>

                  {/* Sub-tab 1: Store Pick Up Orders Table */}
                  {customerOrderSubTab === 'PICKUP_ORDERS' && (
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                              <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order #</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Customer</th>
                              <th style={{ padding: '0.9rem 1rem' }}>AC Item & Type</th>
                              <th style={{ padding: '0.9rem 1rem' }}>HP</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Price & Payment</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Fulfillment</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                              <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.length === 0 ? (
                              <tr>
                                <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                                  No customer pick-up orders found.
                                </td>
                              </tr>
                            ) : (
                              orders.map((o) => (
                                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>{o.orderNo}</td>
                                  <td style={{ padding: '0.8rem 1rem' }}>
                                    <strong style={{ color: '#0f172a' }}>{o.name}</strong>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.location?.split('| COORDS:')[0].trim()}</div>
                                  </td>
                                  <td style={{ padding: '0.8rem 1rem', color: '#0f172a' }}>{o.item}</td>
                                  <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0284c7' }}>{o.hp || '1.5 HP'}</td>
                                  <td style={{ padding: '0.8rem 1rem' }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>₱{(o.price || 30000).toLocaleString()}</div>
                                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <i className="fa-solid fa-money-bill-wave"></i> Cash
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.8rem 1rem' }}>
                                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                      <i className="fa-solid fa-store" style={{ color: '#0284c7' }}></i> Store Pick Up
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.8rem 1rem' }}>
                                    <span
                                      style={{
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        background:
                                          o.status === 'Picked Up' || o.status === 'Completed'
                                            ? '#dcfce7'
                                            : o.status === 'Ready for Pick Up'
                                            ? '#e0f2fe'
                                            : o.status === 'Cancelled'
                                            ? '#fee2e2'
                                            : '#fef3c7',
                                        color:
                                          o.status === 'Picked Up' || o.status === 'Completed'
                                            ? '#16a34a'
                                            : o.status === 'Ready for Pick Up'
                                            ? '#0284c7'
                                            : o.status === 'Cancelled'
                                            ? '#dc2626'
                                            : '#b45309',
                                      }}
                                    >
                                      {o.status || 'Pending'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                      {/* Eye icon to view description */}
                                      <button
                                        title="View Order Details"
                                        onClick={() => setSelectedOrderDetails(o)}
                                        style={{
                                          background: '#e0f2fe',
                                          color: '#0284c7',
                                          border: 'none',
                                          borderRadius: '6px',
                                          width: '32px',
                                          height: '32px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <i className="fa-solid fa-eye"></i>
                                      </button>

                                      {/* Mark Ready for Pick Up */}
                                      {o.status !== 'Ready for Pick Up' && o.status !== 'Picked Up' && o.status !== 'Completed' && o.status !== 'Cancelled' && (
                                        <button
                                          onClick={() => handleMarkOrderReadyForPickup(o)}
                                          style={{
                                            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '5px 12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                          }}
                                        >
                                          <i className="fa-solid fa-box-archive" style={{ fontSize: '0.75rem' }}></i>
                                          Ready for Pick Up
                                        </button>
                                      )}

                                      {/* Mark as Picked Up */}
                                      {o.status === 'Ready for Pick Up' && (
                                        <button
                                          onClick={() => handleMarkOrderPickedUp(o)}
                                          style={{
                                            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '5px 12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                          }}
                                        >
                                          <i className="fa-solid fa-circle-check" style={{ fontSize: '0.75rem' }}></i>
                                          Mark as Picked Up
                                        </button>
                                      )}

                                      {(o.status === 'Picked Up' || o.status === 'Completed') && (
                                        <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <i className="fa-solid fa-circle-check"></i> Picked Up
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: Active Cart Holds & 3-Day Notice Table */}
                  {customerOrderSubTab === 'CART_HOLDS' && (
                    <div>
                      {/* Explanatory Banner */}
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.2rem', fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <i className="fa-solid fa-boxes-stacked" style={{ fontSize: '1.2rem', color: '#d97706', marginTop: '2px', flexShrink: 0 }}></i>
                        <div>
                          <strong>Live Cart Stock Holds:</strong> When customers add an AC unit to their shopping cart, the inventory stock is immediately reduced to reserve it.
                          You can send a <strong>3-Day Notice</strong> SMS urging them to checkout, or click <strong>Release to Stock</strong> to return the items back to the inventory stack and remove them from the customer's cart.
                        </div>
                      </div>

                      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                                <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Info</th>
                                <th style={{ padding: '0.9rem 1rem' }}>AC Item Name</th>
                                <th style={{ padding: '0.9rem 1rem' }}>Unit Price</th>
                                <th style={{ padding: '0.9rem 1rem' }}>Qty (Stock Held)</th>
                                <th style={{ padding: '0.9rem 1rem' }}>Added to Cart</th>
                                <th style={{ padding: '0.9rem 1rem' }}>Notice Status</th>
                                <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminCartItems.length === 0 ? (
                                <tr>
                                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                                    No active cart holds recorded. All store stock is currently in the general inventory.
                                  </td>
                                </tr>
                              ) : (
                                adminCartItems.map((c) => {
                                  const customerName = c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Guest Customer';
                                  const customerContact = c.user?.phone || c.user?.email || 'No contact provided';
                                  return (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '0.8rem 1rem' }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{customerName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{customerContact}</div>
                                      </td>
                                      <td style={{ padding: '0.8rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {c.image && (
                                            <img
                                              src={c.image}
                                              alt={c.name}
                                              style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                            />
                                          )}
                                          <strong style={{ color: '#0284c7' }}>{c.name}</strong>
                                        </div>
                                      </td>
                                      <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                                        ₱{(c.price || 0).toLocaleString()}
                                      </td>
                                      <td style={{ padding: '0.8rem 1rem' }}>
                                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 9px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                                          -{c.quantity} from stack
                                        </span>
                                      </td>
                                      <td style={{ padding: '0.8rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'}
                                      </td>
                                      <td style={{ padding: '0.8rem 1rem' }}>
                                        {c.notice3Days ? (
                                          <div>
                                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                              <i className="fa-solid fa-clock"></i> 3-Day Notice Sent
                                            </span>
                                            {c.notice3DaysAt && (
                                              <div style={{ fontSize: '0.72rem', color: '#92400e', marginTop: '2px' }}>
                                                {new Date(c.notice3DaysAt).toLocaleDateString()}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                            In Cart (Holding)
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                          {/* Send 3-Day Notice Button */}
                                          {!c.notice3Days && (
                                            <button
                                              onClick={() => handleSendCart3DayNotice(c)}
                                              title="Send SMS 3-Day Notice to Customer"
                                              style={{
                                                background: '#fffbeb',
                                                border: '1px solid #fde68a',
                                                color: '#b45309',
                                                borderRadius: '6px',
                                                padding: '5px 10px',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                              }}
                                            >
                                              <i className="fa-solid fa-paper-plane"></i>
                                              3-Day Notice
                                            </button>
                                          )}

                                          {/* Release to Stock Button */}
                                          <button
                                            onClick={() => handleReleaseCartToStock(c)}
                                            title="Return item to inventory stock and remove from customer cart"
                                            style={{
                                              background: '#f1f5f9',
                                              border: '1px solid #cbd5e1',
                                              color: '#0f172a',
                                              borderRadius: '6px',
                                              padding: '5px 10px',
                                              fontSize: '0.78rem',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '5px',
                                            }}
                                          >
                                            <i className="fa-solid fa-arrow-rotate-left" style={{ color: '#16a34a' }}></i>
                                            Release to Stock
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Services Section (Separated) */}
              {orderServiceFilter === 'SERVICES' && (() => {
                const cleaningCount = maintenance.filter((m) => (m.serviceType || '').toLowerCase().includes('cleaning')).length;
                const repairCount = maintenance.filter((m) => (m.serviceType || '').toLowerCase().includes('repair') || (m.serviceType || '').toLowerCase().includes('diagnostic')).length;
                const reinstallCount = maintenance.filter((m) => (m.serviceType || '').toLowerCase().includes('install') || (m.serviceType || '').toLowerCase().includes('relocation')).length;

                const filteredServices = maintenance.filter((m) => {
                  if (serviceTypeFilter === 'ALL') return true;
                  const st = (m.serviceType || '').toLowerCase();
                  if (serviceTypeFilter === 'CLEANING') return st.includes('cleaning');
                  if (serviceTypeFilter === 'REPAIR') return st.includes('repair') || st.includes('diagnostic');
                  if (serviceTypeFilter === 'REINSTALLATION') return st.includes('install') || st.includes('relocation');
                  return true;
                });

                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#fef3c7', color: '#d97706', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                          <i className="fa-solid fa-screwdriver-wrench"></i>
                        </span>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                          Customer Services ({maintenance.length})
                        </h3>
                      </div>

                      {/* Service Type Sub-filters: Cleaning, Repair, Re-installation */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { key: 'ALL', label: 'All Services', count: maintenance.length },
                          { key: 'CLEANING', label: 'Cleaning', count: cleaningCount, color: '#0284c7' },
                          { key: 'REPAIR', label: 'Repair', count: repairCount, color: '#dc2626' },
                          { key: 'REINSTALLATION', label: 'Re-installation', count: reinstallCount, color: '#7c3aed' },
                        ].map((sf) => {
                          const isActive = serviceTypeFilter === sf.key;
                          return (
                            <button
                              key={sf.key}
                              type="button"
                              onClick={() => setServiceTypeFilter(sf.key as any)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '16px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                border: isActive ? '1px solid #d97706' : '1px solid #e2e8f0',
                                background: isActive ? '#fef3c7' : '#ffffff',
                                color: isActive ? '#b45309' : '#64748b',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <span>{sf.label}</span>
                              <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '8px', background: isActive ? '#fde68a' : '#f1f5f9', color: isActive ? '#92400e' : '#475569', fontWeight: 800 }}>
                                {sf.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                              <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service #</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Customer</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Service Type</th>
                              <th style={{ padding: '0.9rem 1rem' }}>AC Unit</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Scheduled Date</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Assigned Tech</th>
                              <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                              <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredServices.length === 0 ? (
                              <tr>
                                <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                                  No customer service requests found matching filter.
                                </td>
                              </tr>
                            ) : (
                              filteredServices.map((m) => {
                                const stLower = (m.serviceType || '').toLowerCase();
                                const isCleaning = stLower.includes('cleaning');
                                const isRepair = stLower.includes('repair') || stLower.includes('diagnostic');
                                const isReinstall = stLower.includes('install') || stLower.includes('relocation');
                                const badgeBg = isCleaning ? '#e0f2fe' : isRepair ? '#fee2e2' : isReinstall ? '#f3e8ff' : '#fef3c7';
                                const badgeColor = isCleaning ? '#0284c7' : isRepair ? '#dc2626' : isReinstall ? '#7c3aed' : '#b45309';

                                return (
                                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>{m.scheduleNo}</td>
                                    <td style={{ padding: '0.8rem 1rem' }}>
                                      <strong style={{ color: '#0f172a' }}>{m.name}</strong>
                                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.phone} • {m.address}</div>
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem' }}>
                                      <span style={{ background: badgeBg, color: badgeColor, padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {m.serviceType}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', color: '#0284c7', fontWeight: 600 }}>{m.item}</td>
                                    <td style={{ padding: '0.8rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                                      {m.scheduledDate || 'Flexible'}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', color: '#475569' }}>
                                      {m.technicianName ? (
                                        <span style={{ color: '#0284c7', fontWeight: 700 }}>
                                          <i className="fa-solid fa-user-gear" style={{ marginRight: '5px' }}></i>
                                          {m.technicianName}
                                        </span>
                                      ) : (
                                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending Assignment</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem' }}>
                                      <span
                                        style={{
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          background: m.status === 'COMPLETED' ? '#dcfce7' : m.status === 'IN_PROGRESS' ? '#e0f2fe' : '#fef3c7',
                                          color: m.status === 'COMPLETED' ? '#16a34a' : m.status === 'IN_PROGRESS' ? '#0284c7' : '#b45309',
                                        }}
                                      >
                                        {m.status}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                        {!(m.technicianName || m.technicianId) ? (
                                          <button
                                            onClick={() => openScheduleServiceModal(m)}
                                            style={{
                                              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '6px',
                                              padding: '5px 12px',
                                              fontSize: '0.8rem',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '5px',
                                            }}
                                          >
                                            <i className="fa-solid fa-calendar-check"></i>
                                            Assign & Schedule
                                          </button>
                                        ) : (
                                          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <i className="fa-solid fa-check"></i> Dispatched
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: INSTALLMENT APPROVAL (TABLE + ACCEPT FOR CI -> APPROVE) */}
          {activeTab === 'tab-installments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>Installment Approvals</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    <strong>Two-Step Approval:</strong> 1. Accept for Credit Investigation (CI) &rarr; 2. Assign Certified Technician &amp; Schedule Installation.
                  </p>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>App ID</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Customer Name</th>
                      <th style={{ padding: '0.9rem 1rem' }}>AC Item & Term</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Employer & Monthly Income</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Valid ID</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                          No installment applications recorded.
                        </td>
                      </tr>
                    ) : (
                      installments.map((inst) => (
                        <tr key={inst.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>{inst.appId}</td>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 600, color: '#0f172a' }}>{inst.name}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <strong style={{ color: '#0284c7' }}>{inst.item}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{inst.term} Months Installment</div>
                          </td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <div>{inst.employer}</div>
                            <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>₱{inst.income}/mo</span>
                          </td>
                          <td style={{ padding: '0.8rem 1rem', color: '#475569' }}>{inst.idType}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background:
                                  inst.status === 'COMPLETED' ? '#dcfce7' : inst.status === 'CI_ACCEPTED' ? '#e0f2fe' : inst.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                color:
                                  inst.status === 'COMPLETED' ? '#16a34a' : inst.status === 'CI_ACCEPTED' ? '#0284c7' : inst.status === 'REJECTED' ? '#dc2626' : '#b45309',
                              }}
                            >
                              {inst.status === 'CI_ACCEPTED' ? 'CI Accepted' : inst.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              {/* Step 1: PENDING applications can ONLY be Accepted for CI (or Rejected) */}
                              {inst.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleAcceptCI(inst)}
                                    style={{
                                      padding: '6px 14px',
                                      borderRadius: '6px',
                                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                                      color: 'white',
                                      border: 'none',
                                      fontWeight: 700,
                                      fontSize: '0.82rem',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                                    }}
                                    title="Accept application for Credit Investigation"
                                  >
                                    <i className="fa-solid fa-user-check" style={{ fontSize: '0.75rem' }}></i>
                                    Accept for CI
                                  </button>
                                  <button
                                    onClick={() => handleRejectInstallment(inst)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      border: '1px solid #fca5a5',
                                      fontWeight: 700,
                                      fontSize: '0.82rem',
                                      cursor: 'pointer',
                                    }}
                                    title="Reject application"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Step 2: CI_ACCEPTED - Now they can Assign & Schedule */}
                              {inst.status === 'CI_ACCEPTED' && (
                                <>
                                  <button
                                    onClick={() => handleOpenScheduleInstallmentModal(inst)}
                                    style={{
                                      padding: '6px 14px',
                                      borderRadius: '6px',
                                      background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                                      color: 'white',
                                      border: 'none',
                                      fontWeight: 700,
                                      fontSize: '0.82rem',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: '0 2px 5px rgba(22, 163, 74, 0.25)',
                                    }}
                                    title="Assign technician and schedule installation"
                                  >
                                    <i className="fa-solid fa-calendar-check" style={{ fontSize: '0.75rem' }}></i>
                                    Assign & Schedule
                                  </button>
                                  <button
                                    onClick={() => handleRejectInstallment(inst)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      border: '1px solid #fca5a5',
                                      fontWeight: 700,
                                      fontSize: '0.82rem',
                                      cursor: 'pointer',
                                    }}
                                    title="Reject application"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {inst.status === 'COMPLETED' && (
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="fa-solid fa-circle-check"></i> Dispatched to Schedule
                                  </span>
                                  {inst.assignedTech && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      {inst.assignedTech} • {inst.scheduledDate}
                                    </div>
                                  )}
                                </div>
                              )}

                              {inst.status === 'REJECTED' && (
                                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fa-solid fa-circle-xmark"></i> Rejected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: DISPATCH & SCHEDULE (WITH CATEGORY & STATUS FILTERS & 10 PER PAGE PAGINATION) */}
          {activeTab === 'tab-dispatch' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>Dispatch & Schedule Queue</h2>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background:
                          dispatchCategoryFilter === 'INSTALLATION'
                            ? '#e0f2fe'
                            : dispatchCategoryFilter === 'CLEANING'
                            ? '#ccfbf1'
                            : '#ffedd5',
                        color:
                          dispatchCategoryFilter === 'INSTALLATION'
                            ? '#0284c7'
                            : dispatchCategoryFilter === 'CLEANING'
                            ? '#0d9488'
                            : '#ea580c',
                        border:
                          dispatchCategoryFilter === 'INSTALLATION'
                            ? '1px solid #bae6fd'
                            : dispatchCategoryFilter === 'CLEANING'
                            ? '1px solid #99f6e4'
                            : '1px solid #fed7aa',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i
                        className={`fa-solid ${
                          dispatchCategoryFilter === 'INSTALLATION'
                            ? 'fa-screwdriver-wrench'
                            : dispatchCategoryFilter === 'CLEANING'
                            ? 'fa-spray-can-sparkles'
                            : 'fa-wrench'
                        }`}
                        style={{ fontSize: '0.75rem' }}
                      ></i>
                      {dispatchCategoryFilter === 'INSTALLATION'
                        ? 'Installation Queue'
                        : dispatchCategoryFilter === 'CLEANING'
                        ? 'Cleaning Queue'
                        : 'Repair Queue'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    {dispatchCategoryFilter === 'INSTALLATION' && 'Central table of all AC delivery and installation assignments.'}
                    {dispatchCategoryFilter === 'CLEANING' && 'Central table of all aircon cleaning and periodic maintenance schedules.'}
                    {dispatchCategoryFilter === 'REPAIR' && 'Central table of all technical diagnostic and repair dispatches.'}
                  </p>
                </div>
              </div>

              {/* Installation Sub-Filter Bar (New Installation vs Re-installation) */}
              {dispatchCategoryFilter === 'INSTALLATION' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: '#f0f9ff',
                    borderRadius: '12px',
                    border: '1px solid #bae6fd',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-filter"></i> Installation Filter:
                    </span>
                    {[
                      { key: 'ALL', label: 'All Installation', count: countInstallAll },
                      { key: 'NEW', label: 'New Installation', count: countInstallNew, icon: 'fa-plus-circle' },
                      { key: 'REINSTALL', label: 'Re-installation', count: countInstallReinstall, icon: 'fa-arrows-rotate' },
                    ].map((sub) => {
                      const isActive = dispatchInstallationSubFilter === sub.key;
                      return (
                        <button
                          key={sub.key}
                          type="button"
                          onClick={() => {
                            setDispatchInstallationSubFilter(sub.key as any);
                            setDispatchCurrentPage(1);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            border: isActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                            background: isActive ? '#0284c7' : '#ffffff',
                            color: isActive ? '#ffffff' : '#0369a1',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                            boxShadow: isActive ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                          }}
                        >
                          {sub.icon && <i className={`fa-solid ${sub.icon}`} style={{ fontSize: '0.75rem' }}></i>}
                          <span>{sub.label}</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '1px 7px',
                              borderRadius: '10px',
                              background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#e0f2fe',
                              color: isActive ? '#ffffff' : '#0284c7',
                              fontWeight: 800,
                            }}
                          >
                            {sub.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600 }}>
                    {countDispatchCategoryInstall} Total Installation{countDispatchCategoryInstall === 1 ? '' : 's'}
                  </div>
                </div>
              )}

              {/* Cleaning Sub-Filter Bar (Standard Cleaning vs Deep Cleaning) */}
              {dispatchCategoryFilter === 'CLEANING' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: '#f0fdfa',
                    borderRadius: '12px',
                    border: '1px solid #99f6e4',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-filter"></i> Cleaning Filter:
                    </span>
                    {[
                      { key: 'ALL', label: 'All Cleaning', count: countCleaningAll },
                      { key: 'STANDARD', label: 'Standard Cleaning', count: countCleaningStandard, icon: 'fa-broom' },
                      { key: 'DEEP', label: 'Deep Cleaning', count: countCleaningDeep, icon: 'fa-wand-magic-sparkles' },
                    ].map((sub) => {
                      const isActive = dispatchCleaningSubFilter === sub.key;
                      return (
                        <button
                          key={sub.key}
                          type="button"
                          onClick={() => {
                            setDispatchCleaningSubFilter(sub.key as any);
                            setDispatchCurrentPage(1);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            border: isActive ? '1px solid #0d9488' : '1px solid #cbd5e1',
                            background: isActive ? '#0d9488' : '#ffffff',
                            color: isActive ? '#ffffff' : '#0f766e',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                            boxShadow: isActive ? '0 2px 6px rgba(13, 148, 136, 0.25)' : 'none',
                          }}
                        >
                          {sub.icon && <i className={`fa-solid ${sub.icon}`} style={{ fontSize: '0.75rem' }}></i>}
                          <span>{sub.label}</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '1px 7px',
                              borderRadius: '10px',
                              background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#ccfbf1',
                              color: isActive ? '#ffffff' : '#0d9488',
                              fontWeight: 800,
                            }}
                          >
                            {sub.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 600 }}>
                    {countDispatchCategoryCleaning} Total Cleaning{countDispatchCategoryCleaning === 1 ? '' : 's'}
                  </div>
                </div>
              )}

              {/* Repair Sub-Filter Bar */}
              {dispatchCategoryFilter === 'REPAIR' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: '#fff7ed',
                    borderRadius: '12px',
                    border: '1px solid #fed7aa',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-filter"></i> Repair Filter:
                    </span>
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid #ea580c',
                        background: '#ea580c',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                      }}
                    >
                      <i className="fa-solid fa-wrench" style={{ fontSize: '0.75rem' }}></i>
                      <span>All Repair & Maintenance</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.25)',
                          color: '#ffffff',
                          fontWeight: 800,
                        }}
                      >
                        {countDispatchCategoryRepair}
                      </span>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: 600 }}>
                    {countDispatchCategoryRepair} Total Repair{countDispatchCategoryRepair === 1 ? '' : 's'}
                  </div>
                </div>
              )}

              {/* Status Filter Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-filter" style={{ color: '#0284c7' }}></i> Status:
                  </span>
                  {[
                    { key: 'All', label: 'All Status', count: countDispatchAll },
                    { key: 'Assigned', label: 'Assigned', count: countDispatchAssigned, color: '#0284c7' },
                    { key: 'Pending', label: 'Pending', count: countDispatchPending, color: '#b45309' },
                    { key: 'Completed', label: 'Completed', count: countDispatchCompleted, color: '#16a34a' },
                  ].map((filterTab) => {
                    const isActive = dispatchStatusFilter === filterTab.key;
                    return (
                      <button
                        key={filterTab.key}
                        type="button"
                        onClick={() => {
                          setDispatchStatusFilter(filterTab.key as any);
                          setDispatchCurrentPage(1);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: isActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                          background: isActive ? '#0284c7' : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                        }}
                      >
                        <span>{filterTab.label}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                            color: isActive ? '#ffffff' : filterTab.color || '#475569',
                            fontWeight: 800,
                          }}
                        >
                          {filterTab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Showing <strong>{filteredDispatch.length}</strong> matching assignments
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                        <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatch #</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Customer Name</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Location</th>
                        <th style={{ padding: '0.9rem 1rem' }}>AC Item</th>
                        <th style={{ padding: '0.9rem 1rem' }}>HP</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Category / Type</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Scheduled Date</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Assigned Tech</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDispatch.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                            <i className="fa-solid fa-box-open" style={{ fontSize: '2rem', color: '#cbd5e1', display: 'block', marginBottom: '0.75rem' }}></i>
                            No dispatch assignments found for the selected category and status.
                          </td>
                        </tr>
                      ) : (
                        paginatedDispatch.map((d) => {
                          const statusLower = (d.status || '').toLowerCase();
                          const isCompleted = statusLower === 'completed';
                          const isAssigned = statusLower === 'assigned';
                          const badgeBg = isCompleted ? '#dcfce7' : isAssigned ? '#e0f2fe' : '#fef3c7';
                          const badgeColor = isCompleted ? '#16a34a' : isAssigned ? '#0284c7' : '#b45309';

                          const type = d.type || '';
                          const isReinstall = isReinstallType(type);
                          const isInstall = isInstallationType(type);
                          const isDeepClean = isDeepCleanType(type);
                          const isClean = isCleaningType(type);
                          const isRep = isRepairType(type);

                          // Separate AC Item and HP cleanly
                          const extractedHp = d.horsepower || (d.item ? d.item.match(/\b(\d+(?:\.\d+)?\s*HP)\b/i)?.[1] : null) || '';
                          const cleanItemName = d.item
                            ? (extractedHp ? d.item.replace(new RegExp(`\\b${extractedHp}\\b`, 'i'), '').replace(/\s*-\s*$/, '').trim() : d.item) || d.item
                            : 'AC Unit';

                          return (
                            <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>{d.dispatchNo}</td>
                              <td style={{ padding: '0.8rem 1rem', fontWeight: 600, color: '#0f172a' }}>{d.name}</td>
                              <td style={{ padding: '0.8rem 1rem', color: '#475569' }}>{d.location?.split('| COORDS:')[0].trim()}</td>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                <strong style={{ color: '#0f172a', fontWeight: 700, display: 'block' }}>{cleanItemName}</strong>
                                {d.notes && <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>{d.notes.slice(0, 45)}{d.notes.length > 45 ? '...' : ''}</span>}
                              </td>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                {extractedHp ? (
                                  <span
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      background: '#ecfdf5',
                                      color: '#059669',
                                      border: '1px solid #a7f3d0',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <i className="fa-solid fa-bolt" style={{ fontSize: '0.68rem' }}></i>
                                    {extractedHp}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                <span
                                  style={{
                                    padding: '4px 9px',
                                    borderRadius: '6px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: isReinstall
                                      ? '#f5f3ff'
                                      : isInstall
                                      ? '#e0f2fe'
                                      : isDeepClean
                                      ? '#ccfbf1'
                                      : isClean
                                      ? '#ecfdf5'
                                      : isRep
                                      ? '#ffedd5'
                                      : '#f3e8ff',
                                    color: isReinstall
                                      ? '#7c3aed'
                                      : isInstall
                                      ? '#0369a1'
                                      : isDeepClean
                                      ? '#0f766e'
                                      : isClean
                                      ? '#047857'
                                      : isRep
                                      ? '#c2410c'
                                      : '#7e22ce',
                                  }}
                                >
                                  <i
                                    className={`fa-solid ${
                                      isReinstall
                                        ? 'fa-arrows-rotate'
                                        : isInstall
                                        ? 'fa-screwdriver-wrench'
                                        : isDeepClean
                                        ? 'fa-wand-magic-sparkles'
                                        : isClean
                                        ? 'fa-spray-can-sparkles'
                                        : isRep
                                        ? 'fa-wrench'
                                        : 'fa-shield-halved'
                                    }`}
                                  ></i>
                                  {d.type}
                                </span>
                              </td>
                              <td style={{ padding: '0.8rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                                {d.scheduledDate || 'Tomorrow 09:00 AM'}
                              </td>
                              <td style={{ padding: '0.8rem 1rem', color: '#0284c7', fontWeight: 700 }}>
                                <i className="fa-solid fa-user-gear" style={{ marginRight: '5px' }}></i>
                                {d.assignedTechName || (d.technicians && d.technicians[0] ? `${d.technicians[0].firstName} ${d.technicians[0].lastName}` : 'Senior Tech')}
                              </td>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: badgeBg,
                                    color: badgeColor,
                                  }}
                                >
                                  {d.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 10 per page Pagination Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1.25rem',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Showing{' '}
                    <strong style={{ color: '#0f172a' }}>
                      {filteredDispatch.length === 0 ? 0 : (currentDispatchPage - 1) * DISPATCH_PER_PAGE + 1}
                    </strong>{' '}
                    to{' '}
                    <strong style={{ color: '#0f172a' }}>
                      {Math.min(currentDispatchPage * DISPATCH_PER_PAGE, filteredDispatch.length)}
                    </strong>{' '}
                    of <strong style={{ color: '#0f172a' }}>{filteredDispatch.length}</strong> entries
                    {dispatchStatusFilter !== 'All' && (
                      <span style={{ marginLeft: '6px', color: '#0284c7', fontWeight: 600 }}>
                        (Filtered: {dispatchStatusFilter})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => setDispatchCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentDispatchPage <= 1}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: currentDispatchPage <= 1 ? '#f1f5f9' : '#ffffff',
                        color: currentDispatchPage <= 1 ? '#94a3b8' : '#1e293b',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: currentDispatchPage <= 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.72rem' }}></i>
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {Array.from({ length: dispatchTotalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (
                          dispatchTotalPages > 7 &&
                          Math.abs(pageNum - currentDispatchPage) > 2 &&
                          pageNum !== 1 &&
                          pageNum !== dispatchTotalPages
                        ) {
                          if (pageNum === 2 || pageNum === dispatchTotalPages - 1) {
                            return (
                              <span key={pageNum} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.8rem' }}>
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        const isCurrent = pageNum === currentDispatchPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setDispatchCurrentPage(pageNum)}
                            style={{
                              minWidth: '32px',
                              height: '32px',
                              padding: '0 6px',
                              borderRadius: '6px',
                              border: isCurrent ? '1px solid #0284c7' : '1px solid #e2e8f0',
                              background: isCurrent ? '#0284c7' : '#ffffff',
                              color: isCurrent ? '#ffffff' : '#334155',
                              fontSize: '0.82rem',
                              fontWeight: isCurrent ? 800 : 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => setDispatchCurrentPage((prev) => Math.min(dispatchTotalPages, prev + 1))}
                      disabled={currentDispatchPage >= dispatchTotalPages}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: currentDispatchPage >= dispatchTotalPages ? '#f1f5f9' : '#ffffff',
                        color: currentDispatchPage >= dispatchTotalPages ? '#94a3b8' : '#1e293b',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: currentDispatchPage >= dispatchTotalPages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Next
                      <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.72rem' }}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MAINTENANCE SCHEDULE (6-MONTH NOTIFICATION MONITORING) */}
          {activeTab === 'tab-maintenance' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>Maintenance Schedule & 6-Month Monitoring</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Monitor successful AC installations and send automated routine maintenance reminders every 6 months.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1.1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', marginBottom: '1.25rem', color: '#0369a1', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-circle-info" style={{ color: '#0284c7', fontSize: '1.1rem' }}></i>
                <div>
                  <strong>Interactive Maintenance Management:</strong> Click on any row or click <strong>Manage & Schedule</strong> to view AC unit specifications, assign a certified technician, and schedule the maintenance visit.
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule #</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Customer Name</th>
                      <th style={{ padding: '0.9rem 1rem' }}>AC Unit</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Service Type</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Last Maintenance</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Next Scheduled Date</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Assigned Tech</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                          No maintenance schedules found.
                        </td>
                      </tr>
                    ) : (
                      maintenance.map((m) => (
                        <tr
                          key={m.id}
                          onClick={() => handleOpenMaintenanceDetails(m)}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Click to view AC details & schedule technician"
                        >
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-calendar-check" style={{ color: '#0284c7', fontSize: '0.8rem' }}></i>
                              {m.scheduleNo}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                            <div>{m.name}</div>
                            {m.phone && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.phone}</div>}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ color: '#0284c7', fontWeight: 700 }}>{m.item}</div>
                            {m.customer?.registeredACs && m.customer.registeredACs.length > 0 && (
                              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                                <i className="fa-solid fa-circle-check" style={{ marginRight: '3px' }}></i> Enrolled AC Registered
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem' }}>
                              {m.serviceType}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <i className="fa-solid fa-clock-rotate-left" style={{ color: '#0284c7', fontSize: '0.75rem' }}></i>
                              <span>{m.lastMaintenance || 'First Service (New Unit)'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            {m.scheduledDate || '6-Month Routine'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {m.technicianName ? (
                              <span style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <i className="fa-solid fa-user-check" style={{ color: '#10b981', fontSize: '0.75rem' }}></i>
                                {m.technicianName}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem' }}>
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background:
                                  m.status === 'COMPLETED'
                                    ? '#dcfce7'
                                    : m.status === 'OVERDUE'
                                    ? '#fee2e2'
                                    : '#e0f2fe',
                                color:
                                  m.status === 'COMPLETED'
                                    ? '#15803d'
                                    : m.status === 'OVERDUE'
                                    ? '#b91c1c'
                                    : '#0369a1',
                              }}
                            >
                              {m.status || 'SCHEDULED'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenMaintenanceDetails(m);
                                }}
                                style={{
                                  padding: '5px 11px',
                                  borderRadius: '7px',
                                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                                  border: 'none',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
                                }}
                                title="View AC Details & Schedule"
                              >
                                <i className="fa-solid fa-calendar-check"></i> Manage & Schedule
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSend6MonthReminder(m);
                                }}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '7px',
                                  background: '#fffbeb',
                                  border: '1.5px solid #d97706',
                                  color: '#b45309',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Send 6-Month Routine Notification"
                              >
                                <i className="fa-solid fa-paper-plane"></i> 6-Mo Notif
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: USER DIRECTORY (CUSTOMERS, TECHNICIANS, ADMINS) */}
          {activeTab === 'tab-users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>User Directory</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    View and manage system users including Customers, Technicians, and Administrators.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <i className="fa-solid fa-user-plus"></i> Add New User
                </button>
              </div>

              {/* Role filter dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <label htmlFor="user-role-filter" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-filter" style={{ color: '#0284c7' }}></i> Filter by Role:
                </label>
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <select
                    id="user-role-filter"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 2.2rem 0.55rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <option value="ALL">All Roles ({allUsers.length})</option>
                    <option value="CUSTOMER">Customer ({allUsers.filter((u) => u.role === 'CUSTOMER').length})</option>
                    <option value="TECHNICIAN">Technician ({allUsers.filter((u) => u.role === 'TECHNICIAN').length})</option>
                    <option value="ADMIN">Admin ({allUsers.filter((u) => u.role === 'ADMIN').length})</option>
                  </select>
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      pointerEvents: 'none',
                    }}
                  ></i>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Email Address</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Phone</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Tech Rank / Title</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Permissions</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Created</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.filter((u) => (userRoleFilter === 'ALL' ? true : u.role === userRoleFilter)).length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                          No users found matching the selected filter.
                        </td>
                      </tr>
                    ) : (
                      allUsers
                        .filter((u) => (userRoleFilter === 'ALL' ? true : u.role === userRoleFilter))
                        .map((u) => {
                        let permCount = 0;
                        try { permCount = JSON.parse(u.permissions || '[]').length; } catch { permCount = 0; }
                        return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            {u.firstName} {u.lastName}
                          </td>
                          <td style={{ padding: '0.8rem 1rem', color: '#475569' }}>{u.email}</td>
                          <td style={{ padding: '0.8rem 1rem', color: '#64748b' }}>{u.phone || 'N/A'}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background:
                                  u.role === 'ADMIN'
                                    ? '#fee2e2'
                                    : u.role === 'TECHNICIAN'
                                    ? '#e0f2fe'
                                    : u.role === 'CLERK'
                                    ? '#fef3c7'
                                    : '#dcfce7',
                                color:
                                  u.role === 'ADMIN'
                                    ? '#dc2626'
                                    : u.role === 'TECHNICIAN'
                                    ? '#0284c7'
                                    : u.role === 'CLERK'
                                    ? '#b45309'
                                    : '#16a34a',
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '0.8rem 1rem', color: '#64748b' }}>
                            {u.role === 'TECHNICIAN' ? (
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{u.techRank || 'Junior Tech'}</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            {permCount > 0 ? (
                              <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8' }}>
                                {permCount} feature{permCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
                            )}
                          </td>
                          <td style={{ padding: '0.8rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.8rem 1rem', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => openEditUser(u)}
                              title="Edit User"
                              style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              onClick={async () => {
                                const proceed = await confirm({ title: 'Delete User', message: `Remove ${u.firstName} ${u.lastName}?` });
                                if (proceed) {
                                  await fetch(`/api/users?id=${u.id}`, { method: 'DELETE' });
                                  setAllUsers(allUsers.filter((user) => user.id !== u.id));
                                }
                              }}
                              title="Delete User"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: INVOICES */}
          {activeTab === 'tab-invoices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>Service Invoices</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Completed job invoices, customer payment receipts, and technician service records.
                  </p>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <th style={{ padding: '0.9rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice #</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Service Type</th>
                      <th style={{ padding: '0.9rem 1rem' }}>AC Unit</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Technician</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Amount</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                          No invoices generated yet.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>{inv.invoiceNo}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>{inv.customerName}</td>
                          <td style={{ padding: '0.8rem 1rem', color: '#0284c7', fontWeight: 600 }}>{inv.serviceType}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>{inv.acUnit}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>{inv.technicianName}</td>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#0f172a' }}>₱{inv.amount.toLocaleString()}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD PRODUCT (WITH 3-4 IMAGES, HP, SEPARATED MODEL & DESCRIPTION, AUTO BRAND NEW) */}
      {isAddProductModalOpen && (
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
          onClick={() => setIsAddProductModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                <i className="fa-solid fa-plus-circle" style={{ color: '#0284c7', marginRight: '8px' }}></i> Add New Inventory Item
              </h3>
              <button onClick={() => setIsAddProductModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            {/* CATEGORIZE BUTTONS: AIR CONDITIONERS VS SPARE PARTS */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Item Classification *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setAddItemType('AC')}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '9px',
                    border: addItemType === 'AC' ? '2px solid #0284c7' : '1px solid transparent',
                    background: addItemType === 'AC' ? '#ffffff' : 'transparent',
                    color: addItemType === 'AC' ? '#0284c7' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: addItemType === 'AC' ? '0 2px 8px rgba(2, 132, 199, 0.18)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <i className="fa-solid fa-snowflake" style={{ fontSize: '1.05rem', color: addItemType === 'AC' ? '#0284c7' : '#94a3b8' }}></i>
                  Air Conditioners (AC)
                </button>
                <button
                  type="button"
                  onClick={() => setAddItemType('SparePart')}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '9px',
                    border: addItemType === 'SparePart' ? '2px solid #0284c7' : '1px solid transparent',
                    background: addItemType === 'SparePart' ? '#ffffff' : 'transparent',
                    color: addItemType === 'SparePart' ? '#0284c7' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: addItemType === 'SparePart' ? '0 2px 8px rgba(2, 132, 199, 0.18)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <i className="fa-solid fa-screwdriver-wrench" style={{ fontSize: '1.05rem', color: addItemType === 'SparePart' ? '#0284c7' : '#94a3b8' }}></i>
                  Spare Parts & Materials
                </button>
              </div>
            </div>

            <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>SKU Code *</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    placeholder={addItemType === 'AC' ? "e.g. AC-CAR-15" : "e.g. PART-CAP-45UF"}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    required
                    placeholder={addItemType === 'AC' ? "e.g. Carrier, Panasonic, Daikin" : "e.g. Carrier Genuine, Copeland"}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  {addItemType === 'AC' ? 'Model Name (AC Unit) *' : 'Part Name / Model *'}
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  placeholder={addItemType === 'AC' ? "e.g. Aura Inverter 1.5 HP Split Type" : "e.g. Dual Run Capacitor 45+5uF 450V"}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    {addItemType === 'AC' ? 'AC Category *' : 'Spare Part Category *'}
                  </label>
                  <select
                    name="category"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    {addItemType === 'AC' ? (
                      <>
                        <option value="Split Type Inverter" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Split Type Inverter</option>
                        <option value="Window Type" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Window Type</option>
                        <option value="Floor Standing" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Floor Standing</option>
                        <option value="Cassette / Ceiling" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Cassette / Ceiling</option>
                        <option value="Portable AC" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Portable AC</option>
                      </>
                    ) : (
                      <>
                        <option value="Spare Parts" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>General Spare Parts</option>
                        <option value="Compressor" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Compressor</option>
                        <option value="Capacitor" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Capacitor</option>
                        <option value="Fan Motor & Blade" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Fan Motor & Blade</option>
                        <option value="Copper Tube & Insulation" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Copper Tube & Insulation</option>
                        <option value="Refrigerant & Freon" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Refrigerant & Freon</option>
                        <option value="Filter & Accessories" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Filter & Accessories</option>
                        <option value="Parts & Accessories" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Other Parts & Accessories</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    {addItemType === 'AC' ? 'Cooling Capacity (HP) *' : 'Capacity / HP'}
                  </label>
                  {addItemType === 'AC' ? (
                    <select
                      name="horsepower"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    >
                      <option value="0.75 HP" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>0.75 HP</option>
                      <option value="1.0 HP" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>1.0 HP</option>
                      <option value="1.5 HP" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>1.5 HP</option>
                      <option value="2.0 HP" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>2.0 HP</option>
                      <option value="2.5 HP" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>2.5 HP</option>
                      <option value="3.0 HP" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>3.0 HP</option>
                      <option value="4.0 HP" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>4.0 HP</option>
                      <option value="5.0 HP" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>5.0 HP</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="horsepower"
                      readOnly
                      value="N/A - Spare Part"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        border: '1.5px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'not-allowed',
                        outline: 'none',
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Item Description *</label>
                <textarea
                  name="description"
                  required
                  placeholder={addItemType === 'AC' ? "Detailed specifications, energy rating, inverter technology, and features..." : "Part compatibility, voltage, specs, and materials..."}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue={10}
                    min={0}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Price (₱) *</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    required
                    placeholder={addItemType === 'AC' ? "25000" : "1500"}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* 3 to 4 Images Upload Section */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    <i className="fa-solid fa-images" style={{ color: '#0284c7', marginRight: '6px' }}></i> Product Images (3 - 4 photos)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{newProductImages.length} of 4 selected</span>
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={newProductImages.length >= 4 || isUploadingImages}
                  style={{ marginBottom: '10px' }}
                />

                {isUploadingImages && <p style={{ fontSize: '0.8rem', color: '#0284c7' }}>Processing image compression...</p>}

                {/* Thumbnails preview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {newProductImages.map((imgSrc, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      <img src={imgSrc} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '3px',
                          right: '3px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddProductModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ flex: 1, padding: '0.75rem', fontWeight: 800 }}>
                  {addItemType === 'AC' ? 'Save & Publish Brand New AC' : 'Save & Add Spare Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ITEM DESCRIPTION (EYE ICON) */}
      {viewingItem && (
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
          onClick={() => setViewingItem(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '550px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                {viewingItem.brand} {viewingItem.model}
              </h3>
              <button onClick={() => setViewingItem(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <img
                src={viewingItem.image || (viewingItem.images && viewingItem.images[0]) || '/hero-bg.png'}
                alt={viewingItem.model}
                style={{ width: '100%', height: '180px', objectFit: 'contain', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              <div><strong>SKU:</strong> {viewingItem.sku}</div>
              <div><strong>Category:</strong> {viewingItem.category}</div>
              <div><strong>Horsepower:</strong> {viewingItem.horsepower || 'N/A'}</div>
              <div><strong>Price:</strong> ₱{viewingItem.price.toLocaleString()}</div>
              <div><strong>Stock On Hand:</strong> {viewingItem.stock}</div>
              <div><strong>Condition:</strong> Brand New</div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Description</label>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, background: '#ffffff', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {viewingItem.description || 'Brand new genuine cooling unit equipped with inverter technology for quiet, energy-saving performance.'}
              </p>
            </div>

            <button onClick={() => setViewingItem(null)} className="btn btn-secondary" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ORDER DETAILS (EYE ICON) */}
      {selectedOrderDetails && (
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
          onClick={() => setSelectedOrderDetails(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                Order #{selectedOrderDetails.orderNo} Details
              </h3>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
              <div><strong>Customer Name:</strong> {selectedOrderDetails.name}</div>
              <div><strong>Item & Unit:</strong> {selectedOrderDetails.item}</div>
              <div><strong>Horsepower:</strong> {selectedOrderDetails.hp || '1.5 HP'}</div>
              <div><strong>Price:</strong> ₱{(selectedOrderDetails.price || 30000).toLocaleString()}</div>
              <div><strong>Payment Type:</strong> {selectedOrderDetails.payment}</div>
              <div><strong>Downpayment Verified:</strong> {selectedOrderDetails.hasDownpayment ? 'Yes' : 'No Payment Yet'}</div>
              <div><strong>Full Location:</strong> {selectedOrderDetails.location}</div>
            </div>

            <button onClick={() => setSelectedOrderDetails(null)} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER (TECHNICIAN, CUSTOMER, ADMIN) */}
      {showAddUserModal && (
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
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                <i className="fa-solid fa-user-plus" style={{ color: '#0284c7', marginRight: '8px' }}></i> Add New User
              </h3>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>First Name *</label>
                  <input type="text" required value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Last Name *</label>
                  <input type="text" required value={newLastName} onChange={(e) => setNewLastName(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: (newRole === 'TECHNICIAN' || isCustomRole) ? '1fr 1fr' : '1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Role *</label>
                  <select value={newRole} onChange={(e) => { setNewRole(e.target.value as any); setIsCustomRole(false); }} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="CLERK">Clerk / Staff</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                {newRole === 'TECHNICIAN' && !isCustomRole && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Tech Rank</label>
                    <select value={newTechRank} onChange={(e) => setNewTechRank(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      {TECH_RANKS.map((rank) => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </div>
                )}
                {isCustomRole && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Custom Role Title *</label>
                    <input
                      type="text"
                      value={newCustomRoleTitle}
                      onChange={(e) => setNewCustomRoleTitle(e.target.value)}
                      placeholder="e.g. Warehouse Manager"
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}
              </div>
              {/* Custom Role Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#475569' }}>
                <input type="checkbox" checked={isCustomRole} onChange={(e) => setIsCustomRole(e.target.checked)} />
                <span>Assign a custom role title (overrides tech rank)</span>
              </label>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Email Address *</label>
                <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@frosttech.com" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone Number</label>
                <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Password *</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              {/* Feature Permissions */}
              {(newRole === 'TECHNICIAN' || newRole === 'ADMIN') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    <i className="fa-solid fa-key" style={{ color: '#0284c7', marginRight: '6px' }}></i>Feature Permissions
                  </label>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {FEATURE_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: newPermissions.includes(perm.key) ? '#0f172a' : '#64748b',
                          background: newPermissions.includes(perm.key) ? '#e0f2fe' : 'transparent',
                          fontWeight: newPermissions.includes(perm.key) ? 600 : 400,
                          transition: 'all 0.15s',
                          border: newPermissions.includes(perm.key) ? '1px solid #7dd3fc' : '1px solid transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newPermissions.includes(perm.key)}
                          onChange={() => setNewPermissions(togglePermission(newPermissions, perm.key))}
                          style={{ accentColor: '#0284c7' }}
                        />
                        <i className={`fa-solid ${perm.icon}`} style={{ fontSize: '0.75rem', color: '#0284c7', width: '14px', textAlign: 'center' }}></i>
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER (Role, Tech Rank, Permissions) */}
      {editingUser && (
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
          onClick={() => setEditingUser(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                  <i className="fa-solid fa-user-pen" style={{ color: '#0284c7', marginRight: '8px' }}></i> Edit User
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  {editingUser.firstName} {editingUser.lastName} &bull; {editingUser.email}
                </p>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            {/* User Info Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                {editingUser.firstName[0]}{editingUser.lastName[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{editingUser.firstName} {editingUser.lastName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Joined {new Date(editingUser.createdAt).toLocaleDateString()}
                  {editingUser.phone ? ` • ${editingUser.phone}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Role */}
              <div style={{ display: 'grid', gridTemplateColumns: (editRole === 'TECHNICIAN' || isEditCustomRole) ? '1fr 1fr' : '1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    <i className="fa-solid fa-shield-halved" style={{ color: '#0284c7', marginRight: '6px' }}></i>Role
                  </label>
                  <select value={editRole} onChange={(e) => { setEditRole(e.target.value as any); setIsEditCustomRole(false); }} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="CLERK">Clerk / Staff</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                {/* Tech Rank (only for technician) */}
                {editRole === 'TECHNICIAN' && !isEditCustomRole && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      <i className="fa-solid fa-ranking-star" style={{ color: '#0284c7', marginRight: '6px' }}></i>Tech Rank
                    </label>
                    <select value={editTechRank} onChange={(e) => setEditTechRank(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                      {TECH_RANKS.map((rank) => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Custom Role Title */}
                {isEditCustomRole && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      <i className="fa-solid fa-user-tag" style={{ color: '#0284c7', marginRight: '6px' }}></i>Custom Role Title *
                    </label>
                    <input
                      type="text"
                      value={editCustomRoleTitle}
                      onChange={(e) => setEditCustomRoleTitle(e.target.value)}
                      placeholder="e.g. Warehouse Manager"
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                    />
                  </div>
                )}
              </div>

              {/* Custom Role Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#475569' }}>
                <input type="checkbox" checked={isEditCustomRole} onChange={(e) => setIsEditCustomRole(e.target.checked)} />
                <span>Assign a custom role title (overrides tech rank)</span>
              </label>

              {/* Feature Permissions */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  <i className="fa-solid fa-key" style={{ color: '#0284c7', marginRight: '6px' }}></i>Feature Permissions
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '8px', fontSize: '0.75rem' }}>
                    ({editPermissions.length} of {FEATURE_PERMISSIONS.length} enabled)
                  </span>
                </label>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem' }}>
                  {/* Select All / Deselect All */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setEditPermissions(FEATURE_PERMISSIONS.map((p) => p.key))}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions([])}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Deselect All
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {FEATURE_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: editPermissions.includes(perm.key) ? '#0f172a' : '#64748b',
                          background: editPermissions.includes(perm.key) ? '#e0f2fe' : 'transparent',
                          fontWeight: editPermissions.includes(perm.key) ? 600 : 400,
                          transition: 'all 0.15s',
                          border: editPermissions.includes(perm.key) ? '1px solid #7dd3fc' : '1px solid transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(perm.key)}
                          onChange={() => setEditPermissions(togglePermission(editPermissions, perm.key))}
                          style={{ accentColor: '#0284c7' }}
                        />
                        <i className={`fa-solid ${perm.icon}`} style={{ fontSize: '0.75rem', color: editPermissions.includes(perm.key) ? '#0284c7' : '#94a3b8', width: '14px', textAlign: 'center' }}></i>
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditUser}
                disabled={isSavingEdit}
                style={{
                  flex: 2,
                  padding: '0.7rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSavingEdit ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <i className={`fa-solid ${isSavingEdit ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN TECHNICIAN & SCHEDULE ORDER DELIVERY */}
      {selectedOrderToSchedule && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedOrderToSchedule(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-truck-ramp-box" style={{ color: '#0284c7' }}></i>
                  Accept & Schedule Order
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Verify downpayment, assign a technician, and set delivery date for Order #{selectedOrderToSchedule.orderNo}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderToSchedule(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Order Summary Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.2rem', fontSize: '0.84rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                  Order #{selectedOrderToSchedule.orderNo}
                </span>
                <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
                  {selectedOrderToSchedule.payment}
                </span>
              </div>
              <div><strong>Customer:</strong> {selectedOrderToSchedule.name}</div>
              <div><strong>Item:</strong> {selectedOrderToSchedule.item} {selectedOrderToSchedule.hp ? `(${selectedOrderToSchedule.hp})` : ''}</div>
              <div><strong>Delivery Location:</strong> {selectedOrderToSchedule.location?.split('| COORDS:')[0].trim()}</div>
            </div>

            {/* Downpayment Status Banner */}
            <div
              style={{
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.2rem',
                border: selectedOrderToSchedule.hasDownpayment ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                background: selectedOrderToSchedule.hasDownpayment ? '#f0fdf4' : '#fffbeb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i
                    className={`fa-solid ${selectedOrderToSchedule.hasDownpayment ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}
                    style={{ color: selectedOrderToSchedule.hasDownpayment ? '#16a34a' : '#d97706', fontSize: '1.1rem' }}
                  ></i>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: selectedOrderToSchedule.hasDownpayment ? '#15803d' : '#b45309', display: 'block' }}>
                      {selectedOrderToSchedule.hasDownpayment ? 'Downpayment Verified' : 'Downpayment Not Recorded'}
                    </strong>
                    <span style={{ fontSize: '0.76rem', color: selectedOrderToSchedule.hasDownpayment ? '#166534' : '#92400e' }}>
                      {selectedOrderToSchedule.hasDownpayment
                        ? '15% downpayment verified. Unit is eligible for delivery dispatch.'
                        : 'First-time AC buyer policy requires a 15% downpayment before scheduling delivery.'}
                    </span>
                  </div>
                </div>

                {selectedOrderToSchedule.downpaymentProof && (
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.write(`<img src="${selectedOrderToSchedule.downpaymentProof}" style="max-width:100%;height:auto;display:block;margin:auto;" />`);
                      }
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 9px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#0369a1',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-receipt" style={{ marginRight: '4px' }}></i>
                    View Receipt
                  </button>
                )}
              </div>

              {!selectedOrderToSchedule.hasDownpayment && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px dashed #fde68a' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#78350f', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={overrideDownpayment}
                      onChange={(e) => setOverrideDownpayment(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0284c7' }}
                    />
                    <span>
                      <strong>Admin Override:</strong> Downpayment paid in-store or approved without downpayment
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmScheduleOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Select Technician */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  <i className="fa-solid fa-user-gear" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                  Assign Technician *
                </label>
                <select
                  value={orderScheduleTechId}
                  onChange={(e) => setOrderScheduleTechId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    fontWeight: 600,
                    background: '#ffffff',
                  }}
                >
                  {technicians.length === 0 ? (
                    <option value="">No technicians registered yet</option>
                  ) : (
                    technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} {t.techRank ? `(${t.techRank})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Scheduled Date & Time Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    <i className="fa-solid fa-calendar-day" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                    Delivery / Install Date *
                  </label>
                  <input
                    type="date"
                    value={orderScheduleDate}
                    onChange={(e) => setOrderScheduleDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      fontWeight: 600,
                      background: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    <i className="fa-solid fa-clock" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                    Preferred Time Slot *
                  </label>
                  <select
                    value={orderScheduleTimeSlot}
                    onChange={(e) => setOrderScheduleTimeSlot(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      fontWeight: 600,
                      background: '#ffffff',
                    }}
                  >
                    <option value="Morning (08:00 AM - 12:00 PM)">Morning (08:00 AM - 12:00 PM)</option>
                    <option value="Afternoon (01:00 PM - 05:00 PM)">Afternoon (01:00 PM - 05:00 PM)</option>
                    <option value="Evening (05:00 PM - 08:00 PM)">Evening (05:00 PM - 08:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Work Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  <i className="fa-solid fa-clipboard-list" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                  Dispatch Instructions / Checklist Notes (Optional)
                </label>
                <textarea
                  value={orderScheduleNotes}
                  onChange={(e) => setOrderScheduleNotes(e.target.value)}
                  placeholder="e.g. Call customer 30 mins before arrival. Inspect 2nd-floor breaker box for 220V."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrderToSchedule(null)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingOrderSchedule || (!selectedOrderToSchedule.hasDownpayment && !overrideDownpayment)}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: (!selectedOrderToSchedule.hasDownpayment && !overrideDownpayment)
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: (!selectedOrderToSchedule.hasDownpayment && !overrideDownpayment) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: (!selectedOrderToSchedule.hasDownpayment && !overrideDownpayment)
                      ? 'none'
                      : '0 4px 12px rgba(2, 132, 199, 0.3)',
                    opacity: isSubmittingOrderSchedule ? 0.7 : 1,
                  }}
                >
                  <i className={`fa-solid ${isSubmittingOrderSchedule ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                  {isSubmittingOrderSchedule ? 'Dispatching...' : 'Accept & Dispatch Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN TECHNICIAN & SCHEDULE INSTALLMENT (TAB 4) */}
      {selectedInstallmentToSchedule && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedInstallmentToSchedule(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-calendar-check" style={{ color: '#0284c7' }}></i>
                  Assign & Schedule Installment
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Assign technician, set installation schedule, and dispatch Application #{selectedInstallmentToSchedule.appId}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInstallmentToSchedule(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Installment Summary Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.2rem', fontSize: '0.84rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                  {selectedInstallmentToSchedule.appId}
                </span>
                <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
                  {selectedInstallmentToSchedule.term} Months Installment
                </span>
              </div>
              <div><strong>Customer:</strong> {selectedInstallmentToSchedule.name}</div>
              <div><strong>AC Item:</strong> <span style={{ color: '#0284c7', fontWeight: 700 }}>{selectedInstallmentToSchedule.item}</span></div>
              <div><strong>Delivery / Installation Address:</strong> {selectedInstallmentToSchedule.location || 'Customer Address'}</div>
              <div><strong>Employer / Income:</strong> {selectedInstallmentToSchedule.employer} • <span style={{ color: '#16a34a', fontWeight: 700 }}>₱{selectedInstallmentToSchedule.income}/mo</span></div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmScheduleInstallment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Select Technician */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  <i className="fa-solid fa-user-gear" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                  Assign Certified Technician *
                </label>
                <select
                  value={installmentScheduleTechId}
                  onChange={(e) => setInstallmentScheduleTechId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    fontWeight: 600,
                    background: '#ffffff',
                  }}
                >
                  {technicians.length === 0 ? (
                    <option value="">No technicians registered yet</option>
                  ) : (
                    technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} {t.techRank ? `(${t.techRank})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Scheduled Date & Time Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    <i className="fa-solid fa-calendar-day" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                    Installation Date *
                  </label>
                  <input
                    type="date"
                    value={installmentScheduleDate}
                    onChange={(e) => setInstallmentScheduleDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      fontWeight: 600,
                      background: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    <i className="fa-solid fa-clock" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                    Preferred Time Slot *
                  </label>
                  <select
                    value={installmentScheduleTimeSlot}
                    onChange={(e) => setInstallmentScheduleTimeSlot(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      fontWeight: 600,
                      background: '#ffffff',
                    }}
                  >
                    <option value="Morning (08:00 AM - 12:00 PM)">Morning (08:00 AM - 12:00 PM)</option>
                    <option value="Afternoon (01:00 PM - 05:00 PM)">Afternoon (01:00 PM - 05:00 PM)</option>
                    <option value="Evening (05:00 PM - 08:00 PM)">Evening (05:00 PM - 08:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Work Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  <i className="fa-solid fa-clipboard-list" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                  Dispatch Instructions / Checklist Notes (Optional)
                </label>
                <textarea
                  value={installmentScheduleNotes}
                  onChange={(e) => setInstallmentScheduleNotes(e.target.value)}
                  placeholder="e.g. Deliver unit and complete split-type bracket installation. Bring 220V testing equipment."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Route info callout */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 0.9rem', fontSize: '0.78rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-info" style={{ fontSize: '1rem', flexShrink: 0 }}></i>
                <span>Confirming will approve the installment application and automatically route the job to <strong>Dispatch & Schedule</strong> under <strong>New Installation</strong>.</span>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setSelectedInstallmentToSchedule(null)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingInstallmentSchedule}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                    opacity: isSubmittingInstallmentSchedule ? 0.7 : 1,
                  }}
                >
                  <i className={`fa-solid ${isSubmittingInstallmentSchedule ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                  {isSubmittingInstallmentSchedule ? 'Dispatching...' : 'Confirm & Dispatch to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN TECHNICIAN & SCHEDULE SERVICE */}
      {selectedServiceToSchedule && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedServiceToSchedule(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-calendar-check" style={{ color: '#0284c7' }}></i>
                  Assign & Schedule Service
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Select certified technician and service date before accepting request.
                </p>
              </div>
              <button
                onClick={() => setSelectedServiceToSchedule(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Service Summary Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.2rem', fontSize: '0.83rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Request #{selectedServiceToSchedule.scheduleNo}</span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
                  {selectedServiceToSchedule.serviceType}
                </span>
              </div>
              <div><strong>Customer:</strong> {selectedServiceToSchedule.name} ({selectedServiceToSchedule.phone})</div>
              <div><strong>AC Unit:</strong> {selectedServiceToSchedule.item}</div>
              <div><strong>Service Address:</strong> {selectedServiceToSchedule.address}</div>
            </div>

            <form onSubmit={handleConfirmScheduleService} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Select Technician */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  <i className="fa-solid fa-user-gear" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                  Assign Technician *
                </label>
                <select
                  value={scheduleTechId}
                  onChange={(e) => setScheduleTechId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    fontWeight: 600,
                    background: '#ffffff',
                  }}
                >
                  {technicians.length === 0 ? (
                    <option value="">No technicians registered yet</option>
                  ) : (
                    technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  <i className="fa-solid fa-calendar-days" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                  Service Date *
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Time Slot */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  <i className="fa-solid fa-clock" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                  Time Slot / Window *
                </label>
                <select
                  value={scheduleTimeSlot}
                  onChange={(e) => setScheduleTimeSlot(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    fontWeight: 600,
                    background: '#ffffff',
                  }}
                >
                  <option value="Morning (08:00 AM - 12:00 PM)">Morning (08:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (01:00 PM - 05:00 PM)">Afternoon (01:00 PM - 05:00 PM)</option>
                  <option value="Whole Day (08:00 AM - 05:00 PM)">Whole Day (08:00 AM - 05:00 PM)</option>
                  <option value="09:00 AM Sharp">09:00 AM Sharp</option>
                  <option value="10:30 AM Sharp">10:30 AM Sharp</option>
                  <option value="02:00 PM Sharp">02:00 PM Sharp</option>
                  <option value="03:30 PM Sharp">03:30 PM Sharp</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Dispatch Notes & Equipment Instructions
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Bring pressure washer, freon R32 gauge, replacement bracket..."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.83rem',
                    color: '#0f172a',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedServiceToSchedule(null)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="fa-solid fa-truck-fast"></i>
                  Accept & Dispatch Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MAINTENANCE DETAILS, AC SPECIFICATIONS & TECHNICIAN SCHEDULING */}
      {selectedMaintenanceModal && (() => {
        const customerACs = selectedMaintenanceModal.customer?.registeredACs || [];
        // Match AC by brandModel or location or horsepower
        const matchedAC =
          customerACs.find(
            (ac) =>
              (ac.brandModel && selectedMaintenanceModal.item.toLowerCase().includes(ac.brandModel.toLowerCase())) ||
              (ac.location && selectedMaintenanceModal.item.toLowerCase().includes(ac.location.toLowerCase())) ||
              (ac.horsepower && selectedMaintenanceModal.item.toLowerCase().includes(ac.horsepower.toLowerCase()))
          ) || (customerACs.length === 1 ? customerACs[0] : null);

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
            onClick={() => setSelectedMaintenanceModal(null)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '1.75rem',
                maxWidth: '640px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                border: '1px solid #e2e8f0',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '0.8rem',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.3rem',
                      color: '#0f172a',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-fan" style={{ color: '#0284c7' }}></i>
                    AC Maintenance & Schedule Details
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Schedule #{selectedMaintenanceModal.scheduleNo} • {selectedMaintenanceModal.serviceType}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMaintenanceModal(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              {/* AC DETAILS CARD */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1px solid #bae6fd',
                  borderRadius: '14px',
                  padding: '1.1rem',
                  marginBottom: '1.2rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid #bae6fd',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-snowflake"></i> Air Conditioner Specifications
                  </span>
                  {matchedAC ? (
                    <span
                      style={{
                        background: matchedAC.purchasedFromStore ? '#dcfce7' : '#ffffff',
                        color: matchedAC.purchasedFromStore ? '#15803d' : '#0369a1',
                        border: '1px solid #bae6fd',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      {matchedAC.purchasedFromStore ? 'FrostTech Store Unit' : 'Customer Enrolled Unit'}
                    </span>
                  ) : (
                    <span style={{ background: '#ffffff', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.72rem' }}>
                      Unit On Record
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.83rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Brand & Model
                    </div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {matchedAC?.brandModel || selectedMaintenanceModal.item}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      AC Type
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {matchedAC?.acType || 'Split Type Inverter'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Horsepower / Capacity
                    </div>
                    <div style={{ fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                      {matchedAC?.horsepower || '1.5 HP (Standard)'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Installation Area
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {matchedAC?.location || 'Main Residence / Unit'}
                    </div>
                  </div>

                  {matchedAC?.paymentType && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Payment & Price
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        {matchedAC.paymentType} {matchedAC.totalPrice ? `(₱${matchedAC.totalPrice.toLocaleString()})` : ''}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Routine Care Plan
                    </div>
                    <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>
                      6-Month Active Monitoring
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Last Maintenance
                    </div>
                    <div style={{ fontWeight: 700, color: '#0369a1', marginTop: '2px' }}>
                      <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '4px', fontSize: '0.75rem' }}></i>
                      {selectedMaintenanceModal.lastMaintenance || 'First Service (New Unit)'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid #bae6fd', fontSize: '0.8rem', color: '#334155' }}>
                  <strong>AC Service Location:</strong> {matchedAC?.fullAddress || selectedMaintenanceModal.address}
                </div>
              </div>

              {/* CUSTOMER INFO CARD */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.2rem',
                  fontSize: '0.83rem',
                  color: '#334155',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-user" style={{ color: '#0284c7' }}></i> Customer Contact Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px' }}>
                  <div><strong>Customer:</strong> {selectedMaintenanceModal.name}</div>
                  <div><strong>Phone:</strong> {selectedMaintenanceModal.phone || selectedMaintenanceModal.customer?.phone || 'N/A'}</div>
                  <div><strong>Email:</strong> {selectedMaintenanceModal.customer?.email || 'N/A'}</div>
                  <div><strong>Service Address:</strong> {selectedMaintenanceModal.address}</div>
                </div>
              </div>

              {/* ASSIGN TECHNICIAN & SCHEDULE FORM */}
              <form onSubmit={handleSaveMaintenanceSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.9rem' }}>
                  <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.98rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-calendar-check" style={{ color: '#0284c7' }}></i>
                    Assign Technician & Configure Schedule
                  </h4>
                </div>

                {/* Select Technician */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    <i className="fa-solid fa-user-gear" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                    Assign Certified Technician *
                  </label>
                  <select
                    value={maintScheduleTechId}
                    onChange={(e) => setMaintScheduleTechId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      fontWeight: 600,
                      background: '#ffffff',
                    }}
                  >
                    <option value="">-- Select Technician (or Certified Tech) --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} {t.techRank ? `(${t.techRank})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  {/* Scheduled Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <i className="fa-solid fa-calendar-days" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      value={maintScheduleDate}
                      onChange={(e) => setMaintScheduleDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  {/* Time Slot */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <i className="fa-solid fa-clock" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                      Time Slot Window *
                    </label>
                    <select
                      value={maintScheduleTimeSlot}
                      onChange={(e) => setMaintScheduleTimeSlot(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        fontWeight: 600,
                        background: '#ffffff',
                      }}
                    >
                      <option value="Morning (08:00 AM - 12:00 PM)">Morning (08:00 AM - 12:00 PM)</option>
                      <option value="Afternoon (01:00 PM - 05:00 PM)">Afternoon (01:00 PM - 05:00 PM)</option>
                      <option value="Whole Day (08:00 AM - 05:00 PM)">Whole Day (08:00 AM - 05:00 PM)</option>
                      <option value="09:00 AM Sharp">09:00 AM Sharp</option>
                      <option value="10:30 AM Sharp">10:30 AM Sharp</option>
                      <option value="02:00 PM Sharp">02:00 PM Sharp</option>
                      <option value="03:30 PM Sharp">03:30 PM Sharp</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  {/* Last Maintenance Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <i className="fa-solid fa-clock-rotate-left" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                      Last Maintenance Date
                    </label>
                    <input
                      type="date"
                      value={maintLastDate}
                      onChange={(e) => setMaintLastDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        fontWeight: 600,
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                      Leave blank if first service for new unit
                    </span>
                  </div>

                  {/* Maintenance Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <i className="fa-solid fa-chart-line" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                      Maintenance Status *
                    </label>
                    <select
                      value={maintStatus}
                      onChange={(e) => setMaintStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        fontWeight: 600,
                        background: '#ffffff',
                      }}
                    >
                      <option value="SCHEDULED">SCHEDULED (Upcoming / Assigned)</option>
                      <option value="OVERDUE">OVERDUE (Needs Immediate Inspection)</option>
                      <option value="COMPLETED">COMPLETED (Maintenance Finished)</option>
                    </select>
                  </div>
                </div>

                {/* Special Notes & Dispatch Instructions */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Technician Notes & Equipment Checklist
                  </label>
                  <textarea
                    value={maintNotes}
                    onChange={(e) => setMaintNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Check evaporator coils, clean indoor filters, test R32 refrigerant operating pressure..."
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.83rem',
                      color: '#0f172a',
                    }}
                  />
                </div>

                {/* Modal Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedMaintenanceModal(null)}
                    style={{
                      flex: 1,
                      minWidth: '100px',
                      padding: '0.7rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend6MonthReminder(selectedMaintenanceModal)}
                    style={{
                      padding: '0.7rem 1.1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #d97706',
                      background: '#fffbeb',
                      color: '#b45309',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className="fa-solid fa-paper-plane"></i> Send 6-Mo Notif
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingMaintenance}
                    style={{
                      flex: 2,
                      minWidth: '180px',
                      padding: '0.7rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: isSavingMaintenance ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: isSavingMaintenance ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className={`fa-solid ${isSavingMaintenance ? 'fa-spinner fa-spin' : 'fa-calendar-check'}`}></i>
                    {isSavingMaintenance ? 'Saving...' : 'Save & Schedule Technician'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </>
  );
}