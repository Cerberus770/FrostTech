import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const spareKeywords = [
  'refrigerant',
  'r-32',
  'r-410a',
  'r32',
  'r410a',
  'capacitor',
  'copper',
  'bracket',
  'filter',
  'freon',
  'fan motor',
  'pcb',
  'pump',
  'tubing',
  'drain pump',
  'valve',
  'insulation',
  'part',
];

const isSparePart = (text: string) => {
  const lower = (text || '').toLowerCase();
  return spareKeywords.some((k) => lower.includes(k));
};

const isCleaningService = (text: string) => {
  const lower = (text || '').toLowerCase();
  return (
    lower.includes('clean') ||
    lower.includes('wash') ||
    lower.includes('flushing') ||
    lower.includes('routine maintenance') ||
    lower.includes('preventive maintenance') ||
    lower.includes('coil clean') ||
    lower.includes('filter clean') ||
    lower.includes('chemical wash') ||
    lower.includes('chemical overhaul')
  );
};

const isRepairService = (text: string) => {
  const lower = (text || '').toLowerCase();
  // If it's pure cleaning, don't categorize as repair
  if (
    isCleaningService(lower) &&
    !lower.includes('leak') &&
    !lower.includes('freon') &&
    !lower.includes('compressor') &&
    !lower.includes('board') &&
    !lower.includes('motor') &&
    !lower.includes('capacitor')
  ) {
    return false;
  }
  return (
    lower.includes('repair') ||
    lower.includes('leak') ||
    lower.includes('freon') ||
    lower.includes('recharge') ||
    lower.includes('gas') ||
    lower.includes('capacitor') ||
    lower.includes('pcb') ||
    lower.includes('board') ||
    lower.includes('motor') ||
    lower.includes('fan') ||
    lower.includes('compressor') ||
    lower.includes('troubleshoot') ||
    lower.includes('noise') ||
    lower.includes('drain') ||
    lower.includes('sensor') ||
    lower.includes('thermostat')
  );
};

function computeReportMetrics({
  period = 'all',
  orders = [],
  dispatches = [],
  maintenanceSchedules = [],
  invoices = [],
}: {
  period?: string;
  orders?: any[];
  dispatches?: any[];
  maintenanceSchedules?: any[];
  invoices?: any[];
}) {
  const now = new Date();

  const isWithinPeriod = (dateObj: Date | string | null | undefined) => {
    if (period === 'all') return true;
    if (!dateObj) return true;
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return true;

    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (period === 'today') {
      return (
        d.toDateString() === now.toDateString() ||
        (diffDays >= -0.5 && diffDays <= 1.0)
      );
    }
    if (period === 'week') {
      return diffDays >= -1 && diffDays <= 7;
    }
    if (period === 'month') {
      return (
        (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) ||
        (diffDays >= -1 && diffDays <= 30)
      );
    }
    return true;
  };

  const filteredOrders = orders.filter((o) =>
    isWithinPeriod(o.createdAt || o.date)
  );
  const filteredDispatches = dispatches.filter((d) =>
    isWithinPeriod(d.createdAt || d.scheduledDate)
  );
  const filteredMaintenance = maintenanceSchedules.filter((m) =>
    isWithinPeriod(m.createdAt || m.scheduledDate || m.date)
  );

  // 1. UNITS SOLD (Air Conditioners Sold)
  let acUnitsSoldCount = 0;
  let acUnitsSoldRevenue = 0;
  const acBrandMap: Record<
    string,
    { count: number; revenue: number; models: string[] }
  > = {};
  const acTypeMap: Record<string, number> = {
    'Split Type': 0,
    'Window Type': 0,
    'Floor Standing': 0,
  };

  filteredOrders.forEach((ord) => {
    if (ord.status === 'Cancelled') return;
    const itemName = ord.item || 'AC Unit';

    if (!isSparePart(itemName)) {
      const qty = Number(ord.quantity || 1);
      acUnitsSoldCount += qty;
      const price = Number(ord.price || (ord.hasDownpayment ? 32000 : 26500));
      acUnitsSoldRevenue += price;

      // Brand detection
      let brand = 'Other Brands';
      if (/carrier/i.test(itemName)) brand = 'Carrier';
      else if (/daikin/i.test(itemName)) brand = 'Daikin';
      else if (/panasonic/i.test(itemName)) brand = 'Panasonic';
      else if (/condura/i.test(itemName)) brand = 'Condura';
      else if (/tcl/i.test(itemName)) brand = 'TCL';
      else if (/midea/i.test(itemName)) brand = 'Midea';
      else if (/samsung/i.test(itemName)) brand = 'Samsung';
      else if (/chiq/i.test(itemName)) brand = 'Chiq';
      else if (/iffalcon/i.test(itemName)) brand = 'iFFALCON';
      else if (/kolin/i.test(itemName)) brand = 'Kolin';

      if (!acBrandMap[brand])
        acBrandMap[brand] = { count: 0, revenue: 0, models: [] };
      acBrandMap[brand].count += qty;
      acBrandMap[brand].revenue += price;
      if (!acBrandMap[brand].models.includes(itemName))
        acBrandMap[brand].models.push(itemName);

      // Type detection
      if (/window/i.test(itemName)) acTypeMap['Window Type'] += qty;
      else if (/floor/i.test(itemName)) acTypeMap['Floor Standing'] += qty;
      else acTypeMap['Split Type'] += qty;
    }
  });

  // 2. UNITS CLEANED (Cleaning & Preventive Maintenance Services)
  let unitsCleanedCount = 0;
  let unitsCleanedRevenue = 0;
  const cleaningBreakdownMap: Record<
    string,
    { count: number; revenue: number }
  > = {
    'Standard General Cleaning & Flushing': { count: 0, revenue: 0 },
    'Deep Chemical Cleaning & Wash': { count: 0, revenue: 0 },
    'Routine Preventive Maintenance Cleaning': { count: 0, revenue: 0 },
    'Evaporator & Condenser Coil Deep Clean': { count: 0, revenue: 0 },
    'Commercial / Multi-Split Preventive Wash': { count: 0, revenue: 0 },
  };

  // From Dispatches (Cleaning jobs)
  filteredDispatches.forEach((disp) => {
    const sType = disp.serviceType || disp.type || '';
    const notes = disp.notes || '';
    const combined = `${sType} ${notes} ${disp.item || ''}`;

    if (isCleaningService(combined)) {
      unitsCleanedCount += 1;
      const fee = Number(disp.cost || disp.price || (/deep|chemical/i.test(combined) ? 1850 : 950));
      unitsCleanedRevenue += fee;

      if (/deep|chemical|overhaul/i.test(combined)) {
        cleaningBreakdownMap['Deep Chemical Cleaning & Wash'].count += 1;
        cleaningBreakdownMap['Deep Chemical Cleaning & Wash'].revenue += fee;
      } else if (/routine|quarterly|annual|preventive/i.test(combined)) {
        cleaningBreakdownMap['Routine Preventive Maintenance Cleaning'].count += 1;
        cleaningBreakdownMap['Routine Preventive Maintenance Cleaning'].revenue += fee;
      } else if (/coil|fin/i.test(combined)) {
        cleaningBreakdownMap['Evaporator & Condenser Coil Deep Clean'].count += 1;
        cleaningBreakdownMap['Evaporator & Condenser Coil Deep Clean'].revenue += fee;
      } else if (/commercial|ceiling|cassette|multi/i.test(combined)) {
        cleaningBreakdownMap['Commercial / Multi-Split Preventive Wash'].count += 1;
        cleaningBreakdownMap['Commercial / Multi-Split Preventive Wash'].revenue += fee;
      } else {
        cleaningBreakdownMap['Standard General Cleaning & Flushing'].count += 1;
        cleaningBreakdownMap['Standard General Cleaning & Flushing'].revenue += fee;
      }
    }
  });

  // From Maintenance schedules (Cleaning jobs)
  filteredMaintenance.forEach((m) => {
    const sType = m.serviceType || m.type || '';
    const notes = m.notes || '';
    const combined = `${sType} ${notes} ${m.item || ''}`;

    if (isCleaningService(combined)) {
      unitsCleanedCount += 1;
      const fee = Number(m.cost || (/deep|chemical/i.test(combined) ? 1850 : 950));
      unitsCleanedRevenue += fee;

      if (/deep|chemical/i.test(combined)) {
        cleaningBreakdownMap['Deep Chemical Cleaning & Wash'].count += 1;
        cleaningBreakdownMap['Deep Chemical Cleaning & Wash'].revenue += fee;
      } else if (/routine|quarterly|annual|preventive/i.test(combined)) {
        cleaningBreakdownMap['Routine Preventive Maintenance Cleaning'].count += 1;
        cleaningBreakdownMap['Routine Preventive Maintenance Cleaning'].revenue += fee;
      } else {
        cleaningBreakdownMap['Standard General Cleaning & Flushing'].count += 1;
        cleaningBreakdownMap['Standard General Cleaning & Flushing'].revenue += fee;
      }
    }
  });

  // 3. UNITS REPAIRED (Technical Repairs, Freon Leak, Electronics & Parts Replacement)
  let unitsRepairedCount = 0;
  let unitsRepairedRevenue = 0;
  const repairBreakdownMap: Record<
    string,
    { count: number; revenue: number }
  > = {
    'Freon Leak Detection & R-32/R-410A Recharge': { count: 0, revenue: 0 },
    'Capacitor & Inverter PCB Board Replacement': { count: 0, revenue: 0 },
    'Blower Motor & Fan Assembly Repair': { count: 0, revenue: 0 },
    'Compressor Replacement & Circuit Repair': { count: 0, revenue: 0 },
    'Thermostat & Sensor Calibration': { count: 0, revenue: 0 },
  };

  // From Dispatches (Repair jobs)
  filteredDispatches.forEach((disp) => {
    const sType = disp.serviceType || disp.type || '';
    const notes = disp.notes || '';
    const combined = `${sType} ${notes} ${disp.item || ''}`;

    if (isRepairService(combined)) {
      unitsRepairedCount += 1;
      const fee = Number(disp.cost || disp.price || 1850);
      unitsRepairedRevenue += fee;

      if (/freon|gas|recharge|leak/i.test(combined)) {
        repairBreakdownMap['Freon Leak Detection & R-32/R-410A Recharge'].count += 1;
        repairBreakdownMap['Freon Leak Detection & R-32/R-410A Recharge'].revenue += fee;
      } else if (/board|pcb|capacitor/i.test(combined)) {
        repairBreakdownMap['Capacitor & Inverter PCB Board Replacement'].count += 1;
        repairBreakdownMap['Capacitor & Inverter PCB Board Replacement'].revenue += fee;
      } else if (/motor|fan/i.test(combined)) {
        repairBreakdownMap['Blower Motor & Fan Assembly Repair'].count += 1;
        repairBreakdownMap['Blower Motor & Fan Assembly Repair'].revenue += fee;
      } else if (/compressor|circuit/i.test(combined)) {
        repairBreakdownMap['Compressor Replacement & Circuit Repair'].count += 1;
        repairBreakdownMap['Compressor Replacement & Circuit Repair'].revenue += fee;
      } else {
        repairBreakdownMap['Thermostat & Sensor Calibration'].count += 1;
        repairBreakdownMap['Thermostat & Sensor Calibration'].revenue += fee;
      }
    }
  });

  // From Maintenance schedules (Repair jobs)
  filteredMaintenance.forEach((m) => {
    const sType = m.serviceType || m.type || '';
    const notes = m.notes || '';
    const combined = `${sType} ${notes} ${m.item || ''}`;

    if (isRepairService(combined)) {
      unitsRepairedCount += 1;
      const fee = Number(m.cost || 1850);
      unitsRepairedRevenue += fee;

      if (/freon|gas|leak/i.test(combined)) {
        repairBreakdownMap['Freon Leak Detection & R-32/R-410A Recharge'].count += 1;
        repairBreakdownMap['Freon Leak Detection & R-32/R-410A Recharge'].revenue += fee;
      } else {
        repairBreakdownMap['Thermostat & Sensor Calibration'].count += 1;
        repairBreakdownMap['Thermostat & Sensor Calibration'].revenue += fee;
      }
    }
  });

  // 4. SPARE PARTS PURCHASED (Genuine Components, Refrigerants, Tubing)
  let sparePartsCount = 0;
  let sparePartsRevenue = 0;
  const partsBreakdownMap: Record<
    string,
    { qty: number; revenue: number; unitPrice: number }
  > = {
    'R-32 Refrigerant Cylinder (10kg)': { qty: 0, revenue: 0, unitPrice: 4500 },
    'R-410A Eco Refrigerant Tank': { qty: 0, revenue: 0, unitPrice: 4800 },
    'Dual Running Capacitor 45uF 450V': { qty: 0, revenue: 0, unitPrice: 350 },
    'Heavy-Duty Copper Tubing 1/4" x 1/2" Roll': {
      qty: 0,
      revenue: 0,
      unitPrice: 3200,
    },
    'Universal Condenser Outdoor Wall Bracket': {
      qty: 0,
      revenue: 0,
      unitPrice: 1200,
    },
    'Inverter PCB Board Assembly': { qty: 0, revenue: 0, unitPrice: 5500 },
    'High-Density Antibacterial AC Filter Set': {
      qty: 0,
      revenue: 0,
      unitPrice: 850,
    },
    'Condensate Drain Pump Automatic 220V': {
      qty: 0,
      revenue: 0,
      unitPrice: 2200,
    },
  };

  filteredOrders.forEach((ord) => {
    if (ord.status === 'Cancelled') return;
    const itemName = ord.item || '';

    if (isSparePart(itemName)) {
      const qty = Number(ord.quantity || 1);
      sparePartsCount += qty;
      const price = Number(ord.price || 2500);
      sparePartsRevenue += price;

      let matched = false;
      for (const partKey of Object.keys(partsBreakdownMap)) {
        const firstWord = partKey.split(' ')[0].toLowerCase();
        if (itemName.toLowerCase().includes(firstWord)) {
          partsBreakdownMap[partKey].qty += qty;
          partsBreakdownMap[partKey].revenue += price;
          matched = true;
          break;
        }
      }
      if (!matched) {
        if (!partsBreakdownMap[itemName]) {
          partsBreakdownMap[itemName] = { qty: 0, revenue: 0, unitPrice: price };
        }
        partsBreakdownMap[itemName].qty += qty;
        partsBreakdownMap[itemName].revenue += price;
      }
    }
  });

  const totalGrossRevenue =
    acUnitsSoldRevenue +
    unitsCleanedRevenue +
    unitsRepairedRevenue +
    sparePartsRevenue;

  // Build Recent Transactions List
  const recentTransactions = [
    ...filteredOrders.map((o) => {
      const isPart = isSparePart(o.item);
      const cat = isPart ? 'Spare Part' : 'AC Unit';
      const price = Number(o.price || (isPart ? 2500 : 32000));
      return {
        id: o.id || o.orderNo,
        referenceNo: o.orderNo,
        date:
          o.date ||
          (o.createdAt
            ? new Date(o.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Nov 2026'),
        customerName: o.name || 'Store Customer',
        customerPhone: o.user?.phone || '0917-000-0000',
        customerLocation: o.location || 'Metro Manila',
        item: o.item,
        category: cat,
        quantity: o.quantity || 1,
        amount: price,
        paymentMethod: o.payment || 'Cash on Delivery',
        status: o.status || 'Processing',
        typeBadge: isPart ? 'Spare Part' : 'AC Sold',
      };
    }),
    ...filteredDispatches
      .filter((d) => {
        const combined = `${d.serviceType || ''} ${d.type || ''} ${d.notes || ''} ${d.item || ''}`;
        return isCleaningService(combined) || isRepairService(combined);
      })
      .map((d) => {
        const combined = `${d.serviceType || ''} ${d.type || ''} ${d.notes || ''} ${d.item || ''}`;
        const isClean = isCleaningService(combined);
        const sType = d.serviceType || d.type || (isClean ? 'Cleaning' : 'Repair');
        const defaultFee = isClean ? 950 : 1850;
        return {
          id: d.id || d.dispatchNo,
          referenceNo: d.dispatchNo || `DIS-${(d.id || '').slice(-4)}`,
          date: d.scheduledDate || 'Nov 2026',
          customerName: d.name || 'Service Client',
          customerPhone: d.phone || '0918-000-0000',
          customerLocation: d.location || 'Metro Manila',
          item: `${sType} — ${d.item || 'AC Unit'}`,
          category: isClean ? 'Cleaning Service' : 'Repair Service',
          quantity: 1,
          amount: Number(d.cost || d.price || defaultFee),
          paymentMethod: 'Cash on Service / GCash',
          status: d.status || 'Completed',
          typeBadge: isClean ? 'Unit Cleaned' : 'Unit Repaired',
          technician: d.assignedTech || 'Carlos Rivera',
        };
      }),
    ...filteredMaintenance
      .filter((m) => {
        const combined = `${m.serviceType || ''} ${m.type || ''} ${m.notes || ''} ${m.item || ''}`;
        return isCleaningService(combined) || isRepairService(combined);
      })
      .map((m) => {
        const combined = `${m.serviceType || ''} ${m.type || ''} ${m.notes || ''} ${m.item || ''}`;
        const isClean = isCleaningService(combined);
        const sType = m.serviceType || m.type || (isClean ? 'Routine Cleaning' : 'Repair');
        const defaultFee = isClean ? 950 : 1850;
        return {
          id: m.id || m.scheduleNo,
          referenceNo: m.scheduleNo || `MNT-${(m.id || '').slice(-4)}`,
          date: m.scheduledDate || 'Nov 2026',
          customerName: m.name || m.customer?.firstName ? `${m.customer?.firstName} ${m.customer?.lastName || ''}`.trim() : 'Maintenance Customer',
          customerPhone: m.phone || m.customer?.phone || '0917-000-0000',
          customerLocation: m.address || 'Metro Manila',
          item: `${sType} — ${m.item || 'AC Unit'}`,
          category: isClean ? 'Cleaning Service' : 'Repair Service',
          quantity: 1,
          amount: Number(m.cost || defaultFee),
          paymentMethod: 'Cash on Service / Schedule',
          status: m.status || 'Completed',
          typeBadge: isClean ? 'Unit Cleaned' : 'Unit Repaired',
          technician: m.technicianName || 'Carlos Rivera',
        };
      }),
  ];

  return {
    period,
    metrics: {
      unitsSold: {
        count: acUnitsSoldCount,
        revenue: acUnitsSoldRevenue,
        brandBreakdown: Object.entries(acBrandMap).map(([brand, data]) => ({
          brand,
          count: data.count,
          revenue: data.revenue,
          models: data.models,
        })),
        typeBreakdown: acTypeMap,
      },
      unitsCleaned: {
        count: unitsCleanedCount,
        revenue: unitsCleanedRevenue,
        serviceBreakdown: Object.entries(cleaningBreakdownMap)
          .filter(([_, data]) => data.count > 0 || unitsCleanedCount === 0)
          .map(([service, data]) => ({
            service,
            count: data.count,
            revenue: data.revenue,
          })),
      },
      unitsRepaired: {
        count: unitsRepairedCount,
        revenue: unitsRepairedRevenue,
        serviceBreakdown: Object.entries(repairBreakdownMap)
          .filter(([_, data]) => data.count > 0 || unitsRepairedCount === 0)
          .map(([service, data]) => ({
            service,
            count: data.count,
            revenue: data.revenue,
          })),
      },
      sparePartsPurchased: {
        count: sparePartsCount,
        revenue: sparePartsRevenue,
        partsBreakdown: Object.entries(partsBreakdownMap)
          .filter(([_, data]) => data.qty > 0 || sparePartsCount === 0)
          .map(([part, data]) => ({
            part,
            quantity: data.qty,
            revenue: data.revenue,
            unitPrice: data.unitPrice,
          })),
      },
      totalRevenue: totalGrossRevenue,
    },
    recentTransactions: recentTransactions.slice(0, 60),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    let orders: any[] = [];
    let dispatches: any[] = [];
    let maintenanceSchedules: any[] = [];
    let invoices: any[] = [];

    try {
      orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('Orders query error:', e);
    }

    try {
      dispatches = await (prisma as any).dispatchItem.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('Dispatch query error:', e);
    }

    try {
      maintenanceSchedules = await (prisma as any).maintenanceSchedule.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('Maintenance query error:', e);
    }

    try {
      invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('Invoices query error:', e);
    }

    const report = computeReportMetrics({
      period,
      orders,
      dispatches,
      maintenanceSchedules,
      invoices,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Reports API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sales report' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const period = body.period || 'all';

    let orders = Array.isArray(body.orders) ? body.orders : [];
    let dispatches = Array.isArray(body.dispatch) ? body.dispatch : [];
    let maintenanceSchedules = Array.isArray(body.maintenance)
      ? body.maintenance
      : [];
    const invoices = Array.isArray(body.invoices) ? body.invoices : [];

    // Fall back to database if client passed empty arrays
    if (orders.length === 0) {
      try {
        orders = await prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        // silent
      }
    }
    if (dispatches.length === 0) {
      try {
        dispatches = await (prisma as any).dispatchItem.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        // silent
      }
    }
    if (maintenanceSchedules.length === 0) {
      try {
        maintenanceSchedules = await (prisma as any).maintenanceSchedule.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        // silent
      }
    }

    const report = computeReportMetrics({
      period,
      orders,
      dispatches,
      maintenanceSchedules,
      invoices,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Reports API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sales report' },
      { status: 500 }
    );
  }
}
