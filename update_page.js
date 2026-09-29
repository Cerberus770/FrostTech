const fs = require('fs');
const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const newFunc = `  const addToCart = async (name: string, price: number, brand?: string, image?: string, productId?: string) => {
    const userId = sessionStorage.getItem('userId');
    const actualProductId = productId || 'PROD-' + Date.now();
    const itemImage = image || '/hero-bg.png';
    const itemBrand = brand || '';

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
            quantity: 1
          })
        });
      } catch (err) {
        console.error('Failed to add to cart API', err);
      }
    } else {
      const cart = JSON.parse(localStorage.getItem('frostTechCart') || '[]');
      const existing = cart.find((i: any) => i.productId === actualProductId || i.name === name);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id: Date.now(), productId: actualProductId, name, brand: itemBrand, price, quantity: 1, image: itemImage });
      }
      localStorage.setItem('frostTechCart', JSON.stringify(cart));
    }
    
    // Toast notification
    showToast('<i class="fa-solid fa-check-circle"></i> ' + name + ' added to cart!');
  };`;

content = content.replace(/const addToCart = \(name: string, price: number, brand\?: string, image\?: string\) => \{[\s\S]*?showToast[\s\S]*?\n  \};/, newFunc);
fs.writeFileSync(file, content);
console.log('Replaced addToCart');
