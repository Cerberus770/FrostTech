import { AppState } from './types';

export const defaultState: AppState = {
  inventory: [
    { id: 'AC-INV-15', brand: 'Panasonic', model: 'Premium Inverter (1.5 HP)', category: 'Split Type AC', stock: 42, price: 38500 },
    { id: 'AC-WIN-10', brand: 'Carrier', model: 'Optima Window (1.0 HP)', category: 'Window Type AC', stock: 15, price: 16990 },
    { id: 'AC-FLR-30', brand: 'LG', model: 'Dual Inverter Floor Standing (3.0 HP)', category: 'Floor Standing AC', stock: 2, price: 85000 },
    { id: 'AC-REF-20', brand: 'Daikin', model: 'Refurbished Standard (2.0 HP)', category: 'Pre-Owned AC', stock: 8, price: 22000 },
    { id: 'PRT-R32-10', brand: 'Generic', model: 'Refrigerant R-32 (10kg Cylinder)', category: 'Parts & Accessories', stock: 10, price: 4500 },
    { id: 'PRT-CAP-45', brand: 'Generic', model: 'Starting Capacitor 45uF 450V', category: 'Parts & Accessories', stock: 35, price: 350 },
    { id: 'PRT-COP-14', brand: 'Generic', model: 'Copper Tube 1/4" x 1/2" (Roll)', category: 'Parts & Accessories', stock: 5, price: 3200 },
    { id: 'TOL-MAN-01', brand: 'Robinair', model: 'Manifold Gauge Set', category: 'Tools', stock: 3, price: 2800 },
  ],
  installments: [
    { app_id: 'APP-0992', cus_id: 'CUS-0992', name: 'Juan Dela Cruz', item: 'Samsung Inverter', date: 'Oct 25, 2026', status: 'pending', issue: '', term: 6, employer: 'Tech Corp Inc.', income: '35,000', id_type: 'Driver License' },
    { app_id: 'APP-0993', cus_id: 'CUS-0993', name: 'Alex Ramos', item: 'Chiq Inverter', date: 'Oct 26, 2026', status: 'pending', issue: '', term: 12, employer: 'Freelance', income: '45,000', id_type: 'Passport' },
    { app_id: 'APP-0985', cus_id: 'CUS-0985', name: 'Maria Santos', item: 'iFFALCON Inverter', date: 'Oct 20, 2026', status: 'repending', issue: 'Blurry ID Photo', term: 6, employer: 'Global Services', income: '28,000', id_type: 'UMID' },
    { app_id: 'APP-0970', cus_id: 'CUS-0970', name: 'Roberto Reyes', item: 'Chiq Inverter', date: 'Oct 15, 2026', status: 'completed', issue: '', term: 6, employer: 'City Hospital', income: '50,000', id_type: 'PRC ID' },
  ],
  orders: [
    { id: 'ORD-8821', cus_id: 'CUS-8821', name: 'James Reid', location: 'Alabang, Muntinlupa', item: 'Midea Full DC Inverter', payment: 'Cash', date: 'June 27, 2026' },
    { id: 'ORD-8822', cus_id: 'CUS-8822', name: 'Nadine Lustre', location: 'Makati City', item: 'Carrier Inverter', payment: 'Installment (6 Months)', date: 'June 27, 2026' },
  ],
  dispatchQueue: [
    { id: 'DIS-001', type: 'New Installation', cus_id: 'CUS-9910', name: 'Mark Bautista', location: 'Pasig City', item: 'Chiq Inverter', notes: 'Please call 30 mins before arrival.' },
    { id: 'DIS-002', type: 'Deep Cleaning', cus_id: 'CUS-9915', name: 'Sarah Geronimo', location: 'Quezon City', item: 'TCL Split type Inverter', notes: 'Routine cleaning and freon check.' },
    { id: 'DIS-003', type: 'Repair', cus_id: 'CUS-9920', name: 'Anne Curtis', location: 'Taguig City', item: 'Carrier Inverter', notes: 'Unit not cooling. Possible compressor issue.' },
  ],
  maintenanceSchedule: [
    { id: 'MNT-001', cus_id: 'CUS-1001', name: 'Elena Garcia', phone: '0917-123-4567', address: 'Brgy. Sta. Lucia, Pasig City', item: 'Carrier Inverter', serviceType: 'Routine Cleaning', scheduledDate: '2026-07-24', technician: '', status: 'scheduled', notes: 'Quarterly maintenance. Unit installed Jan 2026.' },
    { id: 'MNT-002', cus_id: 'CUS-1002', name: 'Ricardo Cruz', phone: '0928-456-7890', address: 'Brgy. Kapitolyo, Pasig City', item: 'Chiq Inverter', serviceType: 'Freon Recharge', scheduledDate: '2026-07-24', technician: '', status: 'scheduled', notes: 'Customer reports weak cooling after 6 months.' },
    { id: 'MNT-003', cus_id: 'CUS-1003', name: 'Angela Reyes', phone: '0935-789-0123', address: 'Brgy. Pinagkaisahan, Makati City', item: 'Midea Full DC Inverter', serviceType: 'Filter Replacement', scheduledDate: '2026-07-25', technician: '', status: 'scheduled', notes: 'Annual filter swap.' },
    { id: 'MNT-004', cus_id: 'CUS-1004', name: 'Carlos Mendoza', phone: '0956-012-3456', address: 'Brgy. Bagong Ilog, Pasig City', item: 'TCL Split type Inverter', serviceType: 'Routine Cleaning', scheduledDate: '2026-07-26', technician: '', status: 'scheduled', notes: 'Bi-annual maintenance plan.' },
    { id: 'MNT-005', cus_id: 'CUS-1005', name: 'Patricia Santos', phone: '0917-345-6789', address: 'Brgy. San Antonio, Makati City', item: 'Carrier Inverter', serviceType: 'Compressor Check', scheduledDate: '2026-07-28', technician: '', status: 'scheduled', notes: 'Unusual noise reported. May need compressor service.' },
    { id: 'MNT-006', cus_id: 'CUS-1006', name: 'Daniel Villanueva', phone: '0928-678-9012', address: 'Brgy. Ugong, Taguig City', item: 'Chiq Inverter', serviceType: 'Routine Cleaning', scheduledDate: '2026-07-22', technician: 'Carlos Rivera', status: 'overdue', notes: 'Missed schedule — customer was unavailable. Needs reschedule.' },
    { id: 'MNT-007', cus_id: 'CUS-1007', name: 'Sofia Lim', phone: '0935-901-2345', address: 'Brgy. Addition Hills, Mandaluyong', item: 'Midea Full DC Inverter', serviceType: 'Deep Cleaning', scheduledDate: '2026-07-30', technician: '', status: 'scheduled', notes: 'Premium deep cleaning package.' },
    { id: 'MNT-008', cus_id: 'CUS-1008', name: 'Miguel Torres', phone: '0956-234-5678', address: 'Brgy. Wack-Wack, Mandaluyong', item: 'TCL Split type Inverter', serviceType: 'Freon Recharge', scheduledDate: '2026-08-02', technician: '', status: 'scheduled', notes: 'Follow-up from previous repair job.' },
  ],
  events: [],
  activeDispatchFilter: 'all',
};
