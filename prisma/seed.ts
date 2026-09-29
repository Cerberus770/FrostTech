import { PrismaClient, Role, InstallmentStatus, MaintenanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Users (Roles: Admin, Technician, Customer)
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedTechPassword = await bcrypt.hash('tech123', 10);
  const hashedCustomerPassword = await bcrypt.hash('customer123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@frostech.com' },
    update: {},
    create: {
      email: 'admin@frostech.com',
      password: hashedAdminPassword,
      firstName: 'Frost',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });

  const techUser = await prisma.user.upsert({
    where: { email: 'tech@frostech.com' },
    update: {},
    create: {
      email: 'tech@frostech.com',
      password: hashedTechPassword,
      firstName: 'Carlos',
      lastName: 'Rivera',
      role: Role.TECHNICIAN,
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: {
      email: 'juan@example.com',
      password: hashedCustomerPassword,
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      phone: '0917-123-4567',
      role: Role.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: {
      email: 'maria@example.com',
      password: hashedCustomerPassword,
      firstName: 'Maria',
      lastName: 'Santos',
      phone: '0928-123-4567',
      role: Role.CUSTOMER,
    },
  });

  // 2. Seed Storefront Products
  const products = [
    {
      slug: 'carrier-inverter-10',
      name: 'Carrier Inverter',
      brand: 'Carrier',
      category: 'Split Type AC',
      price: 32000,
      originalPrice: 35000,
      rating: 4.8,
      sold: 120,
      image: '/hero-bg.png',
      badge: 'BEST SELLER',
      specs: ['1.0 HP', 'Inverter Technology', 'R-32 Eco Refrigerant', 'Fast Cooling'],
      description: 'Reliable cooling with eco-friendly R-32 refrigerant. Perfect for small to medium rooms with fast cooling technology.',
    },
    {
      slug: 'chiq-inverter-10',
      name: 'Chiq Inverter',
      brand: 'Chiq',
      category: 'Split Type AC',
      price: 18500,
      originalPrice: 20000,
      rating: 4.5,
      sold: 80,
      image: '/hero-bg.png',
      badge: 'VALUE PICK',
      specs: ['1.0 HP', 'Inverter Technology', 'Energy Saving', 'Quiet Operation'],
      description: 'Affordable and energy-efficient Chiq Inverter AC. Great value for your cooling needs without breaking the bank.',
    },
    {
      slug: 'iffalcon-inverter-10',
      name: 'iFFALCON Inverter',
      brand: 'iFFALCON',
      category: 'Split Type AC',
      price: 19900,
      originalPrice: 22000,
      rating: 4.6,
      sold: 60,
      image: '/hero-bg.png',
      specs: ['1.0 HP', 'Inverter Compressor', 'Smart AI', 'Fast Cooling'],
      description: 'Smart and efficient iFFALCON Inverter AC. Experience modern cooling with advanced AI comfort features.',
    },
    {
      slug: 'midea-full-dc-15',
      name: 'Midea Full DC Inverter',
      brand: 'Midea',
      category: 'Split Type AC',
      price: 26500,
      originalPrice: 29000,
      rating: 4.7,
      sold: 150,
      image: '/hero-bg.png',
      badge: 'ENERGY SAVER',
      specs: ['1.5 HP', 'Full DC Inverter', 'iECO Mode', 'Follow Me Function'],
      description: 'Midea\'s advanced Full DC Inverter with iECO energy-saving mode. Maximizes energy efficiency while delivering powerful cooling.',
    },
    {
      slug: 'samsung-inverter-15',
      name: 'Samsung Inverter',
      brand: 'Samsung',
      category: 'Split Type AC',
      price: 35000,
      originalPrice: 38000,
      rating: 4.9,
      sold: 210,
      image: '/hero-bg.png',
      badge: 'PREMIUM',
      specs: ['1.5 HP', 'Digital Inverter', 'Fast Cooling', 'Anti-bacterial Filter'],
      description: 'Premium Samsung Inverter AC. Enjoy ultra-fast cooling and cleaner air with advanced digital inverter technology.',
    },
    {
      slug: 'tcl-split-inverter-10',
      name: 'TCL Split type Inverter',
      brand: 'TCL',
      category: 'Split Type AC',
      price: 16990,
      originalPrice: 18990,
      rating: 4.4,
      sold: 300,
      image: '/hero-bg.png',
      badge: 'MOST POPULAR',
      specs: ['1.0 HP', 'Inverter', 'TitanGold Technology', 'Low Noise'],
      description: 'Highly popular TCL Split type Inverter. Reliable, affordable, and features TitanGold fins for better durability and air quality.',
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // 3. Seed Admin Inventory
  const inventoryItems = [
    { sku: 'AC-CAR-01', brand: 'Carrier', model: 'Inverter', category: 'Split Type AC', stock: 10, price: 32000 },
    { sku: 'AC-CHQ-01', brand: 'Chiq', model: 'Inverter', category: 'Split Type AC', stock: 8, price: 18500 },
    { sku: 'AC-IFF-01', brand: 'iFFALCON', model: 'Inverter', category: 'Split Type AC', stock: 12, price: 19900 },
    { sku: 'AC-MID-01', brand: 'Midea', model: 'Full DC Inverter', category: 'Split Type AC', stock: 15, price: 26500 },
    { sku: 'AC-SAM-01', brand: 'Samsung', model: 'Inverter', category: 'Split Type AC', stock: 6, price: 35000 },
    { sku: 'AC-TCL-01', brand: 'TCL', model: 'Split type Inverter', category: 'Split Type AC', stock: 20, price: 16990 },
    { sku: 'PRT-R32-10', brand: 'Generic', model: 'Refrigerant R-32 (10kg Cylinder)', category: 'Parts & Accessories', stock: 10, price: 4500 },
    { sku: 'PRT-CAP-45', brand: 'Generic', model: 'Starting Capacitor 45uF 450V', category: 'Parts & Accessories', stock: 35, price: 350 },
    { sku: 'PRT-COP-14', brand: 'Generic', model: 'Copper Tube 1/4" x 1/2" (Roll)', category: 'Parts & Accessories', stock: 5, price: 3200 },
    { sku: 'TOL-MAN-01', brand: 'Robinair', model: 'Manifold Gauge Set', category: 'Tools', stock: 3, price: 2800 },
  ];

  for (const inv of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { sku: inv.sku },
      update: {},
      create: inv,
    });
  }

  // 4. Seed Orders
  const moreOrders = [
    { orderNo: 'ORD-8821', userId: customer1.id, name: 'James Reid', location: 'Alabang, Muntinlupa', item: 'Samsung Inverter', payment: 'Cash', date: 'June 27, 2026' },
    { orderNo: 'ORD-8822', userId: customer2.id, name: 'Nadine Lustre', location: 'Makati City', item: 'Carrier Inverter', payment: 'Installment (6 Months)', date: 'June 27, 2026' },
    { orderNo: 'ORD-8823', userId: customer1.id, name: 'Joshua Garcia', location: 'Quezon City', item: 'Chiq Inverter', payment: 'Cash', date: 'June 28, 2026' },
    { orderNo: 'ORD-8824', userId: customer2.id, name: 'Julia Barretto', location: 'BGC, Taguig', item: 'Samsung Inverter', payment: 'Credit Card', date: 'June 28, 2026' },
    { orderNo: 'ORD-8825', userId: customer1.id, name: 'Liza Soberano', location: 'Pasay City', item: 'Carrier Inverter', payment: 'Installment (12 Months)', date: 'June 29, 2026' },
  ];
  for (const ord of moreOrders) {
    await prisma.order.upsert({ where: { orderNo: ord.orderNo }, update: {}, create: ord });
  }

  // 5. Seed Installments
  const moreInstallments = [
    { appId: 'APP-0992', userId: customer1.id, name: 'Juan Dela Cruz', item: 'Samsung Inverter', date: 'Oct 25, 2026', status: InstallmentStatus.PENDING, term: 6, employer: 'Tech Corp Inc.', income: '35,000', idType: 'Driver License', issue: '' },
    { appId: 'APP-0993', userId: customer2.id, name: 'Enrique Gil', item: 'Carrier Optima Window (1.0 HP)', date: 'Oct 26, 2026', status: InstallmentStatus.REPENDING, term: 12, employer: 'Bank of PI', income: '45,000', idType: 'Passport', issue: 'Proof of billing blurred' },
    { appId: 'APP-0994', userId: customer1.id, name: 'Kathryn Bernardo', item: 'Carrier Inverter', date: 'Oct 26, 2026', status: InstallmentStatus.COMPLETED, term: 6, employer: 'GMA Network', income: '55,000', idType: 'UMID', issue: '' },
    { appId: 'APP-0995', userId: customer2.id, name: 'Daniel Padilla', item: 'Samsung Inverter', date: 'Oct 27, 2026', status: InstallmentStatus.PENDING, term: 24, employer: 'ABS-CBN', income: '85,000', idType: 'Driver License', issue: '' },
  ];
  for (const inst of moreInstallments) {
    await prisma.installment.upsert({ where: { appId: inst.appId }, update: {}, create: inst });
  }

  // 6. Seed Dispatch Queue
  const dispatchItems = [
    { dispatchNo: 'DIS-001', type: 'New Installation', customerId: customer1.id, name: 'Mark Bautista', location: 'Pasig City', item: 'Carrier Inverter', notes: 'Please call 30 mins before arrival.', status: 'PENDING' },
    { dispatchNo: 'DIS-002', type: 'Repair', customerId: customer2.id, name: 'Sarah Geronimo', location: 'Quezon City', item: 'Samsung Inverter', notes: 'Not cooling.', status: 'PENDING' },
    { dispatchNo: 'DIS-003', type: 'Deep Cleaning', customerId: customer1.id, name: 'Bamboo', location: 'Makati City', item: 'Midea Full DC Inverter', notes: 'Annual cleaning.', status: 'ASSIGNED' },
    { dispatchNo: 'DIS-004', type: 'New Installation', customerId: customer2.id, name: 'Lea Salonga', location: 'Alabang', item: 'TCL Split type Inverter', notes: 'Condo unit 5th floor.', status: 'PENDING' },
    { dispatchNo: 'DIS-005', type: 'Repair', customerId: customer1.id, name: 'Gary Valenciano', location: 'Antipolo', item: 'Chiq Inverter', notes: 'Leaking water.', status: 'ASSIGNED' },
  ];
  for (const disp of dispatchItems) {
    const { dispatchNo, ...data } = disp;
    const needsTech = data.status === 'ASSIGNED';
    await prisma.dispatchItem.upsert({
      where: { dispatchNo },
      update: {},
      create: {
        dispatchNo,
        ...data,
        ...(needsTech ? { technicians: { connect: [{ id: techUser.id }] } } : {}),
      },
    });
  }

  // 7. Seed Maintenance Schedule
  const moreMaintenance = [
    { scheduleNo: 'MNT-001', customerId: customer1.id, name: 'Elena Garcia', phone: '0917-123-4567', address: 'Brgy. Sta. Lucia, Pasig City', item: 'Carrier Inverter', serviceType: 'Routine Cleaning', scheduledDate: '2026-07-24', status: MaintenanceStatus.SCHEDULED, notes: 'Quarterly maintenance. Unit installed Jan 2026.' },
    { scheduleNo: 'MNT-006', customerId: customer2.id, name: 'Daniel Villanueva', phone: '0928-678-9012', address: 'Brgy. Ugong, Taguig City', item: 'Carrier Optima Window (1.0 HP)', serviceType: 'Routine Cleaning', scheduledDate: '2026-07-22', technicianId: techUser.id, technicianName: 'Carlos Rivera', status: MaintenanceStatus.OVERDUE, notes: 'Missed schedule — customer was unavailable. Needs reschedule.' },
    { scheduleNo: 'MNT-007', customerId: customer1.id, name: 'Vice Ganda', phone: '0999-123-4567', address: 'Tomas Morato, QC', item: 'Samsung Inverter', serviceType: 'Deep Cleaning', scheduledDate: '2026-07-28', status: MaintenanceStatus.SCHEDULED, notes: 'VIP Customer' },
    { scheduleNo: 'MNT-008', customerId: customer2.id, name: 'Anne Curtis', phone: '0918-987-6543', address: 'Forbes Park, Makati', item: 'Carrier Inverter', serviceType: 'Routine Cleaning', scheduledDate: '2026-07-29', technicianId: techUser.id, technicianName: 'Carlos Rivera', status: MaintenanceStatus.SCHEDULED, notes: 'Morning schedule only.' },
    { scheduleNo: 'MNT-009', customerId: customer1.id, name: 'Vhong Navarro', phone: '0917-555-1234', address: 'San Juan City', item: 'Carrier Optima Window (1.0 HP)', serviceType: 'Deep Cleaning', scheduledDate: '2026-07-15', status: MaintenanceStatus.OVERDUE, notes: 'Rescheduled twice already.' },
  ];
  for (const maint of moreMaintenance) {
    await prisma.maintenanceSchedule.upsert({ where: { scheduleNo: maint.scheduleNo }, update: {}, create: maint });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
