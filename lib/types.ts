// ===== Inventory =====
export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  category: string;
  stock: number;
  price: number;
  image?: string;
}

// ===== Installments =====
export interface Installment {
  app_id: string;
  cus_id: string;
  name: string;
  item: string;
  date: string;
  status: 'pending' | 'repending' | 'completed' | 'rejected';
  issue: string;
  term: number;
  employer: string;
  income: string;
  id_type: string;
  location?: string;
}

// ===== Orders =====
export interface Order {
  id: string;
  cus_id: string;
  name: string;
  location: string;
  item: string;
  payment: string;
  date: string;
}

// ===== Dispatch =====
export interface DispatchItem {
  id: string;
  type: string;
  cus_id: string;
  name: string;
  location: string;
  item: string;
  notes: string;
}

// ===== Maintenance =====
export interface MaintenanceSchedule {
  id: string;
  cus_id: string;
  name: string;
  phone: string;
  address: string;
  item: string;
  serviceType: string;
  scheduledDate: string;
  technician: string;
  status: 'scheduled' | 'overdue' | 'completed';
  notes: string;
}

// ===== Calendar Events =====
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  technician: string;
  type: string;
}

// ===== App State =====
export interface AppState {
  inventory: InventoryItem[];
  installments: Installment[];
  orders: Order[];
  dispatchQueue: DispatchItem[];
  maintenanceSchedule: MaintenanceSchedule[];
  events: CalendarEvent[];
  activeDispatchFilter: string;
}

// ===== Cart =====
export interface CartItem {
  id: string | number;
  productId?: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image?: string;
}

// ===== Service Cart (Profile) =====
export interface ServiceCartItem {
  id: number;
  unit: string;
  service: string;
  price: number;
  note: string;
}

// ===== Tech Request =====
export interface TechRequest {
  id: string;
  technician: string;
  item: string;
  qty: number;
  reason: string;
  dateTime: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

// ===== Product (for storefront) =====
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  sold: number;
  image: string;
  specs?: string[];
  description?: string;
  badge?: string;
}
