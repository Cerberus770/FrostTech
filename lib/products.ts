import { Product } from './types';

export const products: Product[] = [
  {
    id: 'mid-fan-2613',
    slug: 'mid-fan-2613',
    name: 'Midea Blower Fan',
    brand: 'Midea',
    category: 'Fan Motor & Blade',
    price: 1000,
    rating: 0,
    sold: 0,
    image: '/products/mid-fan-2613.jpg',
    images: ['/products/mid-fan-2613-1.jpg', '/products/mid-fan-2613-2.jpg'],
    badge: 'Brand New',
    specs: ['N/A - Spare Part', 'Brand New', 'Fan Motor & Blade'],
    description: 'Brand new fan and high quality',
    variants: [
      { id: 'var-mid-fan-2613', condition: 'Brand New', price: 1000, stock: 10 }
    ]
  },
  {
    id: 'mid-4847',
    slug: 'mid-4847',
    name: 'Midea Compressor',
    brand: 'Midea',
    category: 'Compressor',
    price: 1200,
    rating: 0,
    sold: 0,
    image: '/products/mid-4847.jpg',
    images: ['/products/mid-4847-1.jpg', '/products/mid-4847-2.jpg'],
    badge: 'Brand New',
    specs: ['N/A - Spare Part', 'Brand New', 'Compressor'],
    description: 'Brand new midea compressor',
    variants: [
      { id: 'var-mid-4847', condition: 'Brand New', price: 1200, stock: 10 }
    ]
  },
  {
    id: 'car-5453',
    slug: 'car-5453',
    name: 'Carrier split type inverter',
    brand: 'Carrier',
    category: 'Split Type Inverter',
    price: 40000,
    rating: 0,
    sold: 0,
    image: '/products/car-5453.jpg',
    images: ['/products/car-5453-1.jpg', '/products/car-5453-2.jpg', '/products/car-5453-3.jpg'],
    badge: 'Brand New',
    specs: ['1.5 HP', 'Brand New', 'Split Type Inverter'],
    description: 'Summer best Colling for ac and winter heating',
    variants: [
      { id: 'var-car-5453', condition: 'Brand New', price: 40000, stock: 9 }
    ]
  },
  {
    id: 'part-blower-fan-2nd',
    slug: 'part-blower-fan-2nd',
    name: 'Midea blower fan',
    brand: 'Midea',
    category: 'Spare Parts',
    price: 1300,
    rating: 0,
    sold: 0,
    image: 'https://via.placeholder.com/150',
    badge: 'Used',
    specs: ['Used Condition', 'Midea Genuine Part', 'Tested & Working'],
    description: 'Used Midea blower fan in good working condition.',
    variants: [
      { id: 'var-part-blower-fan-2nd', condition: 'Second Hand', price: 1300, stock: 3 }
    ]
  },
  {
    id: 'part-cooler-2nd',
    slug: 'part-cooler-2nd',
    name: 'Midea Cooler',
    brand: 'Midea',
    category: 'Spare Parts',
    price: 900,
    rating: 0,
    sold: 0,
    image: 'https://via.placeholder.com/150',
    badge: 'Used',
    specs: ['Used Condition', 'Midea Genuine Part'],
    description: 'Second hand Midea cooler part.',
    variants: [
      { id: 'var-part-cooler-2nd', condition: 'Second Hand', price: 900, stock: 2 }
    ]
  },
  {
    id: 'part-compressor-2nd',
    slug: 'part-compressor-2nd',
    name: 'Midea Compressor',
    brand: 'Midea',
    category: 'Spare Parts',
    price: 1000,
    rating: 0,
    sold: 0,
    image: 'https://via.placeholder.com/150',
    images: ['/products/part-compressor-2nd-1.jpg', '/products/part-compressor-2nd-2.jpg', '/products/part-compressor-2nd-3.jpg'],
    badge: 'Used',
    specs: ['Used Condition', 'Inverter Compressor'],
    description: 'Second hand Midea compressor unit.',
    variants: [
      { id: 'var-part-compressor-2nd', condition: 'Second Hand', price: 1000, stock: 2 },
      { id: 'var-part-compressor-2nd-new', condition: 'Brand New', price: 1000, stock: 1 }
    ]
  },
  {
    id: 'tcl-split-inverter-10',
    slug: 'tcl-split-inverter-10',
    name: 'TCL Split type Inverter',
    brand: 'TCL',
    category: 'Split Type AC',
    price: 16990,
    originalPrice: 18990,
    rating: 4.4,
    sold: 300,
    image: '/products/TCL1.webp',
    images: ['/products/TCL1.webp', '/products/TCL2.webp'],
    badge: 'MOST POPULAR',
    specs: ['1.0 HP', 'Inverter', 'TitanGold Technology', 'Low Noise'],
    description: 'Highly popular TCL Split type Inverter. Reliable, affordable, and features TitanGold fins for better durability and air quality.',
    variants: [
      { id: 'var-tcl-split-inverter-10', condition: 'Brand New', price: 16990, stock: 23 }
    ]
  },
  {
    id: 'iffalcon-inverter-10',
    slug: 'iffalcon-inverter-10',
    name: 'iFFALCON Inverter',
    brand: 'iFFALCON',
    category: 'Split Type AC',
    price: 19900,
    originalPrice: 22000,
    rating: 4.6,
    sold: 60,
    image: '/Window.jpg',
    images: ['/Window.jpg'],
    specs: ['1.0 HP', 'Inverter Compressor', 'Smart AI', 'Fast Cooling'],
    description: 'Smart and efficient iFFALCON Inverter AC. Experience modern cooling with advanced AI comfort features.',
    variants: [
      { id: 'var-iffalcon-inverter-10', condition: 'Brand New', price: 19900, stock: 12 }
    ]
  },
  {
    id: 'chiq-inverter-10',
    slug: 'chiq-inverter-10',
    name: 'Chiq Inverter',
    brand: 'Chiq',
    category: 'Split Type AC',
    price: 18500,
    originalPrice: 20000,
    rating: 4.5,
    sold: 80,
    image: '/Inverter.jpg',
    images: ['/Inverter.jpg'],
    badge: 'VALUE PICK',
    specs: ['1.0 HP', 'Inverter Technology', 'Energy Saving', 'Quiet Operation'],
    description: 'Affordable and energy-efficient Chiq Inverter AC. Great value for your cooling needs without breaking the bank.',
    variants: [
      { id: 'var-chiq-inverter-10', condition: 'Brand New', price: 18500, stock: 8 }
    ]
  },
  {
    id: 'carrier-inverter-10',
    slug: 'carrier-inverter-10',
    name: 'Carrier Inverter',
    brand: 'Carrier',
    category: 'Split Type AC',
    price: 32000,
    originalPrice: 35000,
    rating: 4.8,
    sold: 120,
    image: '/products/carrier.jpg',
    images: ['/products/carrier.jpg', '/products/carrier1.jpg', '/products/carrier2.jpg'],
    badge: 'BEST SELLER',
    specs: ['1.0 HP', 'Inverter Technology', 'R-32 Eco Refrigerant', 'Fast Cooling'],
    description: 'Reliable cooling with eco-friendly R-32 refrigerant. Perfect for small to medium rooms with fast cooling technology.',
    variants: [
      { id: 'var-carrier-inverter-10', condition: 'Brand New', price: 32000, stock: 10 }
    ]
  },
  {
    id: 'midea-full-dc-15',
    slug: 'midea-full-dc-15',
    name: 'Midea Full DC Inverter',
    brand: 'Midea',
    category: 'Split Type AC',
    price: 26500,
    originalPrice: 29000,
    rating: 4.7,
    sold: 150,
    image: '/midea.jpg',
    images: ['/midea.jpg', '/installed-ac/midea1.jpg', '/installed-ac/midea2.jpg'],
    badge: 'ENERGY SAVER',
    specs: ['1.5 HP', 'Full DC Inverter', 'iECO Mode', 'Follow Me Function'],
    description: 'Midea\'s advanced Full DC Inverter with iECO energy-saving mode. Maximizes energy efficiency while delivering powerful cooling.',
    variants: [
      { id: 'var-midea-full-dc-15', condition: 'Brand New', price: 26500, stock: 15 }
    ]
  },
  {
    id: 'samsung-inverter-15',
    slug: 'samsung-inverter-15',
    name: 'Samsung Inverter',
    brand: 'Samsung',
    category: 'Split Type AC',
    price: 35000,
    originalPrice: 38000,
    rating: 4.9,
    sold: 210,
    image: '/Samsung.jpg',
    images: ['/Samsung.jpg'],
    badge: 'PREMIUM',
    specs: ['1.5 HP', 'Digital Inverter', 'Fast Cooling', 'Anti-bacterial Filter'],
    description: 'Premium Samsung Inverter AC. Enjoy ultra-fast cooling and cleaner air with advanced digital inverter technology.',
    variants: [
      { id: 'var-samsung-inverter-15', condition: 'Brand New', price: 35000, stock: 6 }
    ]
  }
];
