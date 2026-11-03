export interface ProductBadgeInfo {
  hp: string | null;
  isInverter: boolean;
  typeLabel: string | null;
  coolingCapacityBTU?: string | null;
}

export function getProductBadgeInfo(item: {
  name: string;
  brand?: string;
  category?: string;
  horsepower?: string | null;
  specs?: string[];
  description?: string | null;
}): ProductBadgeInfo {
  // 1. Detect Horsepower (HP)
  let hp = item.horsepower ? item.horsepower.trim() : '';

  if (!hp && Array.isArray(item.specs)) {
    const hpSpec = item.specs.find(s => /\b\d+(\.\d+)?\s*hp\b/i.test(s));
    if (hpSpec) {
      const match = hpSpec.match(/(\d+(\.\d+)?\s*hp)/i);
      if (match) hp = match[1].toUpperCase();
    }
  }

  if (!hp) {
    const combined = `${item.name} ${item.description || ''}`;
    const match = combined.match(/\b(\d+(\.\d+)?)\s*hp\b/i);
    if (match) {
      hp = `${match[1]} HP`;
    }
  }

  // Normalize HP string format (e.g., "1.0HP" -> "1.0 HP", "1HP" -> "1.0 HP")
  if (hp) {
    const numMatch = hp.match(/(\d+(\.\d+)?)/);
    if (numMatch) {
      const val = parseFloat(numMatch[1]);
      if (val === 1) hp = '1.0 HP';
      else if (val === 2) hp = '2.0 HP';
      else if (val === 3) hp = '3.0 HP';
      else if (val === 0.75 || val === 0.8) hp = '0.75 HP';
      else if (val === 1.5) hp = '1.5 HP';
      else if (val === 2.5) hp = '2.5 HP';
      else hp = `${numMatch[1]} HP`;
    }
  }

  // 2. Detect Inverter
  const textToScan = `${item.name} ${item.category || ''} ${(item.specs || []).join(' ')} ${item.description || ''}`.toLowerCase();
  const isExplicitNonInverter = textToScan.includes('non-inverter') || textToScan.includes('non inverter');
  const isInverter = textToScan.includes('inverter') && !isExplicitNonInverter;

  // 3. Detect AC Type
  const isSpare =
    (item.category && ['parts', 'spare parts', 'parts & accessories'].includes(item.category.toLowerCase())) ||
    textToScan.includes('compressor') ||
    textToScan.includes('capacitor') ||
    textToScan.includes('pcb') ||
    textToScan.includes('motor') ||
    textToScan.includes('remote');

  let typeLabel: string | null = null;
  if (isSpare) {
    typeLabel = 'Spare Part';
  } else if (textToScan.includes('split') || (item.category && item.category.toLowerCase().includes('split'))) {
    typeLabel = 'Split Type';
  } else if (textToScan.includes('window') || (item.category && item.category.toLowerCase().includes('window'))) {
    typeLabel = 'Window Type';
  } else if (textToScan.includes('floor') || (item.category && item.category.toLowerCase().includes('floor'))) {
    typeLabel = 'Floor Standing';
  }

  // 4. Estimate BTU/hr from HP
  let coolingCapacityBTU: string | null = null;
  if (hp) {
    const val = parseFloat(hp);
    if (val === 0.75) coolingCapacityBTU = '7,500 BTU/hr';
    else if (val === 1.0) coolingCapacityBTU = '9,500 BTU/hr';
    else if (val === 1.5) coolingCapacityBTU = '12,000 BTU/hr';
    else if (val === 2.0) coolingCapacityBTU = '18,000 BTU/hr';
    else if (val === 2.5) coolingCapacityBTU = '24,000 BTU/hr';
    else if (val >= 3.0) coolingCapacityBTU = `${Math.round(val * 9000).toLocaleString()} BTU/hr`;
  }

  return {
    hp: hp || null,
    isInverter,
    typeLabel,
    coolingCapacityBTU,
  };
}

