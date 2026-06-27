import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Landmark, 
  Printer, 
  CheckCircle,
  Barcode,
  X,
  Keyboard,
  Coins,
  Camera
} from 'lucide-react';

export const getProductImage = (name) => {
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('martillo')) {
    return 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=150&auto=format&fit=crop&q=60';
  }
  if (lowerName.includes('alicate')) {
    return 'https://images.unsplash.com/photo-1540115808298-d0b1798c4b36?w=150&auto=format&fit=crop&q=60';
  }
  if (lowerName.includes('llave') || lowerName.includes('inglesa')) {
    return 'https://images.unsplash.com/photo-1618588507085-c79565432917?w=150&auto=format&fit=crop&q=60';
  }
  if (lowerName.includes('foco') || lowerName.includes('led') || lowerName.includes('luz')) {
    return 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=150&auto=format&fit=crop&q=60';
  }
  if (lowerName.includes('cable') || lowerName.includes('alambre')) {
    return 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=150&auto=format&fit=crop&q=60';
  }
  if (lowerName.includes('tubo') || lowerName.includes('pvc') || lowerName.includes('pavco')) {
    return 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=150&auto=format&fit=crop&q=60';
  }
  if (lowerName.includes('pegamento') || lowerName.includes('oatey') || lowerName.includes('cola')) {
    return 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=150&auto=format&fit=crop&q=60';
  }
  if (lowerName.includes('pintura') || lowerName.includes('látex') || lowerName.includes('esmalte')) {
    return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=150&auto=format&fit=crop&q=60';
  }
  return 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&auto=format&fit=crop&q=60';
};

export default function POS({ addNotification }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Cliente General');
  const [customerDoc, setCustomerDoc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountPaid, setAmountPaid] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  
  const barcodeInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const scanCooldownRef = useRef(null);

  // Play cashier beep sound using browser Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 1100; // 1100 Hz beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 80);
    } catch (e) {
      console.warn("Could not play scan sound:", e);
    }
  };

  // Camera Barcode Scanner side effect
  useEffect(() => {
    if (cameraScannerOpen) {
      const timer = setTimeout(() => {
        // Instantiate reader with explicit barcode formats to focus the engine and optimize decoding CPU
        const html5QrCode = new Html5Qrcode("scanner-video-region", {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        });
        html5QrCodeRef.current = html5QrCode;
        
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
          if (decodedText === lastScannedCodeRef.current) {
            return; // Cooldown is active for this barcode
          }
          
          lastScannedCodeRef.current = decodedText;
          
          if (scanCooldownRef.current) clearTimeout(scanCooldownRef.current);
          scanCooldownRef.current = setTimeout(() => {
            lastScannedCodeRef.current = '';
          }, 1800); // 1.8 seconds cooldown for same item

          // Search barcode match
          const matchedProduct = products.find(p => p.barcode === decodedText);
          if (matchedProduct) {
            playBeep();
            addToCart(matchedProduct);
            addNotification(`Escaneado: ${matchedProduct.name}`, 'success');
          } else {
            addNotification(`Código desconocido: ${decodedText}`, 'warning');
          }
        };

        // Configuration requesting HD video constraints for capturing thin barcode lines
        const config = { 
          fps: 20, 
          qrbox: (width, height) => ({ width: Math.min(width * 0.85, 290), height: Math.min(height * 0.5, 110) }),
          videoConstraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: "environment"
          }
        };

        html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          qrCodeSuccessCallback
        ).catch((err) => {
          console.error("Error starting camera scanner:", err);
          addNotification("No se pudo iniciar la cámara. Otorgue permisos de cámara.", "danger");
          setCameraScannerOpen(false);
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanCooldownRef.current) clearTimeout(scanCooldownRef.current);
        if (html5QrCodeRef.current) {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
              console.log("Scanner stopped.");
            }).catch(err => console.error("Error stopping scanner:", err));
          }
        }
      };
    }
  }, [cameraScannerOpen, products]);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
    focusSearch();
  }, []);

  // Keyboard Shortcuts & USB Scanner Auto-Redirect Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Auto-focus redirection: If active element is not another form input/textarea,
      // and user types alphanumeric key (like a scanner does), redirect focus to the barcode search input.
      const activeEl = document.activeElement;
      const isTypingElsewhere = activeEl && 
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && 
        activeEl !== barcodeInputRef.current;
      
      if (!isTypingElsewhere && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }

      // F2: Focus Search
      if (e.key === 'F2') {
        e.preventDefault();
        focusSearch();
        addNotification('Buscador enfocado.', 'primary');
      }
      // F8: Clear Cart
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setCart([]);
          addNotification('Carrito vaciado.', 'warning');
        }
      }
      // F12: Open Checkout
      if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0 && !checkoutModal && !ticketModal) {
          handleCheckout();
        } else if (cart.length === 0) {
          addNotification('Agregue productos antes de cobrar.', 'warning');
        }
      }
      // Esc: Close Modals
      if (e.key === 'Escape') {
        setCheckoutModal(false);
        setTicketModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, checkoutModal, ticketModal]);

  const focusSearch = () => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('name');
      if (error) throw error;
      setProducts(data || []);
      setDbError(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setDbError(true);
      
      // Fallback Mock products
      setProducts([
        { id: 1, barcode: '7750123456789', name: 'Martillo de Uña 16oz Bellota', stock: 15, sale_price: 25.00, description: 'Mango de fibra de vidrio', category_id: 1, categories: { name: 'Herramientas' } },
        { id: 2, barcode: '7750123456790', name: 'Alicate Universal 8" Tramontina', stock: 8, sale_price: 18.50, description: 'Acero forjado aislado', category_id: 1, categories: { name: 'Herramientas' } },
        { id: 3, barcode: '7750123456791', name: 'Llave Inglesa 10" Stanley', stock: 5, sale_price: 32.00, description: 'Cromada de alta resistencia', category_id: 1, categories: { name: 'Herramientas' } },
        { id: 4, barcode: '7750123456792', name: 'Foco LED 12W Luz Fría Philips', stock: 45, sale_price: 7.50, description: 'Ahorrador de energía', category_id: 2, categories: { name: 'Eléctricos' } },
        { id: 5, barcode: '7750123456793', name: 'Cable Eléctrico Nro 12 Indeco (m)', stock: 100, sale_price: 3.20, description: 'Cable de cobre unipolar', category_id: 2, categories: { name: 'Eléctricos' } },
        { id: 6, barcode: '7750123456794', name: 'Tubo de PVC 1/2" Pavco (3m)', stock: 2, sale_price: 8.90, description: 'Para agua fría roscable', category_id: 3, categories: { name: 'Plomería' } },
        { id: 7, barcode: '7750123456795', name: 'Pegamento PVC Oatey 1/4 Galón', stock: 12, sale_price: 45.00, description: 'Cerrado hermético secado rápido', category_id: 3, categories: { name: 'Plomería' } },
        { id: 8, barcode: '7750123456796', name: 'Pintura Látex Pato Blanco (Gal)', stock: 10, sale_price: 52.00, description: 'Pintura lavable interiores', category_id: 4, categories: { name: 'Pinturas' } },
      ]);
    }
  };

  // Add Product to Cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      addNotification('Este producto no tiene stock disponible.', 'danger');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        addNotification(`Solo hay ${product.stock} unidades en stock de este producto.`, 'warning');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    focusSearch();
  };

  // Update Cart Quantity
  const updateQty = (productId, delta) => {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      setCart(cart.filter((i) => i.id !== productId));
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && newQty > product.stock) {
      addNotification(`Stock máximo alcanzado (${product.stock} unidades).`, 'warning');
      return;
    }

    setCart(
      cart.map((i) => (i.id === productId ? { ...i, quantity: newQty } : i))
    );
  };

  // Remove Item from Cart
  const removeFromCart = (productId) => {
    setCart(cart.filter((i) => i.id !== productId));
    addNotification('Producto removido.', 'warning');
  };

  // Barcode quick add
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    const matchedProduct = products.find(
      (p) => p.barcode === query || p.name.toLowerCase() === query.toLowerCase()
    );

    if (matchedProduct) {
      addToCart(matchedProduct);
      setSearchQuery('');
      addNotification(`Agregado: ${matchedProduct.name}`, 'success');
    } else {
      addNotification('Búsqueda sin coincidencia exacta. Filtrando grilla.', 'warning');
    }
  };

  // Calculate distinct categories from catalog for tabs
  const categoriesList = ['Todos', ...new Set(products.map((p) => p.categories?.name).filter(Boolean))];

  // Filter products by search query AND category tabs
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    
    const matchesCategory = 
      selectedCategory === 'Todos' || 
      (p.categories?.name === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.sale_price * item.quantity, 0);
    const total = subtotal;
    const rawSubtotal = total / 1.18;
    const rawTax = total - rawSubtotal;

    return {
      subtotal: rawSubtotal,
      tax: rawTax,
      total: total,
    };
  };

  const totals = calculateTotals();

  // Checkout submission
  const handleCheckout = () => {
    if (cart.length === 0) {
      addNotification('El carrito está vacío.', 'warning');
      return;
    }
    setAmountPaid('');
    setPaymentMethod('efectivo');
    setCheckoutModal(true);
  };

  const handleFinishSale = async () => {
    setLoading(true);
    const totals = calculateTotals();
    const saleData = {
      seller_name: 'Cajero Principal',
      customer_name: customerName || 'Cliente General',
      customer_document: customerDoc || null,
      total: totals.total,
      payment_method: paymentMethod,
    };

    try {
      if (dbError) {
        throw new Error('Database Simulation Mode');
      }

      // 1. Insert Sales Record
      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select();

      if (saleError) throw saleError;
      const createdSale = saleResult[0];

      // 2. Insert Sale Items
      const saleItemsData = cart.map((item) => ({
        sale_id: createdSale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.sale_price,
        subtotal: item.sale_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsData);

      if (itemsError) throw itemsError;

      // 3. Update stock levels for each product
      for (const item of cart) {
        const newStock = item.stock - item.quantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.id);
        
        if (stockError) console.error(`Error updating stock for ${item.name}`, stockError);
      }

      const completed = {
        ...createdSale,
        items: cart,
      };

      setCompletedSale(completed);
      addNotification('Venta registrada con éxito en Supabase.', 'success');
      setCart([]);
      setCustomerName('Cliente General');
      setCustomerDoc('');
      setAmountPaid('');
      setCheckoutModal(false);
      setTicketModal(true);
      fetchProducts(); // Refresh stocks list
    } catch (error) {
      console.warn('Realizando venta en modo simulación local:', error.message);
      
      // Simulation success
      const completed = {
        id: Math.floor(Math.random() * 900000) + 100000,
        ...saleData,
        created_at: new Date().toISOString(),
        items: cart,
      };

      // Mock update local stock in state
      const updatedProducts = products.map(p => {
        const cartItem = cart.find(ci => ci.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      });
      setProducts(updatedProducts);

      setCompletedSale(completed);
      addNotification('Venta registrada con éxito (Simulación).', 'success');
      setCart([]);
      setCustomerName('Cliente General');
      setCustomerDoc('');
      setAmountPaid('');
      setCheckoutModal(false);
      setTicketModal(true);
    } finally {
      setLoading(false);
    }
  };

  const calculatedChange = () => {
    if (!amountPaid || isNaN(amountPaid)) return 0;
    const diff = Number(amountPaid) - totals.total;
    return diff > 0 ? diff : 0;
  };

  // Quick cash handlers
  const quickCashOptions = [10, 20, 50, 100, 200];

  return (
    <div className="pos-page">
      <div className="pos-container">
        
        {/* Left Side: Product catalog search and selection */}
        <div className="pos-catalog-section glass-panel" style={{ padding: '1.15rem' }}>
          
          {/* Supabase status and header title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 950, margin: 0, color: '#fff' }}>
                Punto de Venta
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                background: dbError ? 'var(--danger)' : 'var(--success)', 
                boxShadow: dbError ? '0 0 6px var(--danger)' : '0 0 6px var(--success)',
                display: 'inline-block'
              }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {dbError ? 'Modo Simulación (Local)' : 'Supabase Online'}
              </span>
            </div>
          </div>

          {/* Header Search with Barcode Scanner Indicator */}
          <form onSubmit={handleBarcodeSubmit} className="pos-search-bar" style={{ marginBottom: '0.85rem' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Barcode 
                size={20} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} 
              />
              <input
                ref={barcodeInputRef}
                type="text"
                className="form-input"
                placeholder="Escanee código o busque herramientas, plomería, pernos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.65rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              Agregar
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.75rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => setCameraScannerOpen(true)}
            >
              <Camera size={18} /> Escanear
            </button>
          </form>

          {/* Dynamic Category Tabs */}
          <div className="category-tab-scroll">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="pos-products-grid">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.id === product.id);
              const remainingStock = product.stock - (cartItem ? cartItem.quantity : 0);
              const isLow = remainingStock > 0 && remainingStock <= product.min_stock;
              const isOut = remainingStock <= 0;

              return (
                <div
                  key={product.id}
                  className={`pos-product-card ${isOut ? 'out-of-stock' : ''}`}
                  onClick={() => remainingStock > 0 && addToCart(product)}
                  style={{
                    border: isOut 
                      ? '1px solid var(--danger-glow)' 
                      : isLow 
                        ? '1px solid rgba(245, 158, 11, 0.25)' 
                        : '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <img 
                    src={product.image_url || getProductImage(product.name)} 
                    alt={product.name} 
                    style={{ 
                      width: '78px', 
                      height: '100%', 
                      objectFit: 'cover',
                      background: 'rgba(0,0,0,0.2)',
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                      flexShrink: 0
                    }} 
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%', justifyContent: 'space-between', padding: '0.5rem 0.65rem', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem', minWidth: 0 }}>
                      <span 
                        style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                      >
                        {product.categories?.name || 'Ferretería'}
                      </span>
                      <div className="pos-product-name">
                        {product.name}
                      </div>
                      <div className="pos-product-code" style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                        {product.barcode || 'Sin Código'}
                      </div>
                    </div>
                    
                    <div className="pos-product-price-row">
                      <span className="pos-product-price" style={{ fontSize: '0.98rem' }}>
                        S/ {Number(product.sale_price).toFixed(2)}
                      </span>
                      <span 
                        className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.62rem', whiteSpace: 'nowrap' }}
                      >
                        {isOut ? 'Agotado' : `Stock: ${remainingStock}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <Search size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', opacity: 0.3 }} />
                <p>No se encontraron productos coincidentes.</p>
              </div>
            )}
          </div>

          {/* Keyboard HUD Footer */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginTop: '1rem', 
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '0.75rem', 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Keyboard size={14} className="text-primary" />
              <span>Teclas:</span>
            </div>
            <div><strong style={{ color: '#fff', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>F2</strong> Buscar</div>
            <div><strong style={{ color: '#fff', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>F8</strong> Vaciar Carrito</div>
            <div><strong style={{ color: '#fff', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>F12</strong> Cobrar Venta</div>
          </div>
        </div>

        {/* Right Side: Shopping Cart / Sidebar Bill */}
        <div className="pos-cart-section glass-panel" style={{ padding: '1.15rem' }}>
          
          <div className="pos-cart-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>Boleta de Venta</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {cart.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => {
                    setCart([]);
                    addNotification('Carrito vaciado.', 'warning');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Trash2 size={12} /> Limpiar
                </button>
              )}
              <span className="badge badge-success" style={{ padding: '0.25rem 0.5rem' }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="pos-cart-items" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
            {cart.map((item) => (
              <div key={item.id} className="pos-cart-item" style={{ padding: '0.65rem 0.75rem', borderRadius: '10px' }}>
                <div className="pos-cart-item-info" style={{ gap: '0.1rem' }}>
                  <span className="pos-cart-item-name" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    {item.name}
                  </span>
                  <span className="pos-cart-item-price" style={{ fontSize: '0.75rem' }}>
                    S/ {Number(item.sale_price).toFixed(2)} c/u
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <div className="pos-cart-item-qty-controls">
                    <button className="qty-btn" style={{ width: '22px', height: '22px' }} onClick={() => updateQty(item.id, -1)}>
                      <Minus size={10} />
                    </button>
                    <span className="qty-value" style={{ fontSize: '0.8rem', minWidth: '12px' }}>{item.quantity}</span>
                    <button className="qty-btn" style={{ width: '22px', height: '22px' }} onClick={() => updateQty(item.id, 1)}>
                      <Plus size={10} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="pos-cart-item-total" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                      S/ {(item.sale_price * item.quantity).toFixed(2)}
                    </span>
                    <Trash2 
                      size={13} 
                      className="text-danger" 
                      style={{ cursor: 'pointer', opacity: 0.7 }} 
                      onClick={() => removeFromCart(item.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div style={{ textAlign: 'center', margin: 'auto 0', color: 'var(--text-muted)', padding: '2rem' }}>
                <ShoppingCart size={40} style={{ marginBottom: '0.75rem', opacity: 0.15, margin: '0 auto' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  Carrito Vacío
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Seleccione productos de la izquierda para facturar.
                </p>
              </div>
            )}
          </div>

          {/* Totals Box */}
          <div className="pos-cart-totals" style={{ paddingTop: '0.85rem', marginBottom: '1rem', gap: '0.4rem' }}>
            <div className="pos-total-row" style={{ fontSize: '0.8rem' }}>
              <span>Subtotal (sin IGV)</span>
              <span>S/ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="pos-total-row" style={{ fontSize: '0.8rem' }}>
              <span>IGV (18%)</span>
              <span>S/ {totals.tax.toFixed(2)}</span>
            </div>
            <div className="pos-total-row grand-total" style={{ fontSize: '1.35rem', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
              <span>Total a Cobrar</span>
              <span>S/ {totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="btn btn-success" 
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', borderRadius: '12px' }}
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Registrar Venta (F12)
          </button>
        </div>
      </div>

      {/* Checkout Selection Modal */}
      {checkoutModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ background: 'var(--bg-surface-solid)', padding: '1.75rem', maxWidth: '480px' }}>
            <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Coins className="text-success" size={20} /> Registrar Cobro de Venta
              </span>
              <button 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}
                onClick={() => setCheckoutModal(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexContainer: 'column', gap: '1rem', flexDirection: 'column' }}>
              <div className="form-group">
                <label className="form-label">Nombre del Cliente</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  placeholder="Ej. Juan Pérez / Cliente General"
                />
              </div>

              <div className="form-group">
                <label className="form-label">DNI / RUC (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. 10745284562" 
                  value={customerDoc} 
                  onChange={(e) => setCustomerDoc(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Método de Pago</label>
                <div className="payment-method-grid">
                  <div 
                    className={`payment-method-card ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('efectivo')}
                  >
                    <DollarSign size={20} className={paymentMethod === 'efectivo' ? 'text-success' : ''} />
                    <span>Efectivo</span>
                  </div>
                  <div 
                    className={`payment-method-card ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('tarjeta')}
                  >
                    <CreditCard size={20} className={paymentMethod === 'tarjeta' ? 'text-primary' : ''} />
                    <span>Tarjeta</span>
                  </div>
                  <div 
                    className={`payment-method-card ${paymentMethod === 'yape_plin' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('yape_plin')}
                  >
                    <Smartphone size={20} className={paymentMethod === 'yape_plin' ? 'text-warning' : ''} />
                    <span>Yape / Plin</span>
                  </div>
                  <div 
                    className={`payment-method-card ${paymentMethod === 'transferencia' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('transferencia')}
                  >
                    <Landmark size={20} className={paymentMethod === 'transferencia' ? 'text-info' : ''} />
                    <span>Transferencia</span>
                  </div>
                </div>
              </div>

              {paymentMethod === 'efectivo' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Quick cash options */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, marginRight: '0.2rem' }}>Efectivo Rápido:</span>
                    <button
                      type="button"
                      className={`quick-cash-option-btn ${amountPaid === totals.total.toString() ? 'active' : ''}`}
                      onClick={() => setAmountPaid(totals.total.toString())}
                    >
                      Paga Exacto
                    </button>
                    {quickCashOptions.map(val => (
                      <button
                        key={val}
                        type="button"
                        className={`quick-cash-option-btn ${amountPaid === val.toString() ? 'active' : ''}`}
                        disabled={val < totals.total}
                        onClick={() => setAmountPaid(val.toString())}
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>

                  <div className="grid-2" style={{ gap: '0.85rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Efectivo Recibido (S/)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="0.00" 
                        value={amountPaid} 
                        onChange={(e) => setAmountPaid(e.target.value)} 
                        style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', textAlign: 'right', background: '#020617' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Vuelto al Cliente</label>
                      <div className="lcd-register-screen" style={{ color: calculatedChange() > 0 ? '#fbbf24' : '#34d399' }}>
                        <span className="lcd-label">Vuelto</span>
                        <span className="lcd-value">
                          S/ {calculatedChange().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem' }}>
                  <strong>Importe Total:</strong>
                  <strong style={{ color: 'var(--success)' }}>S/ {totals.total.toFixed(2)}</strong>
                </div>

                <div className="modal-actions" style={{ marginTop: 0 }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setCheckoutModal(false)}
                    disabled={loading}
                    style={{ borderRadius: '10px' }}
                  >
                    Volver
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={handleFinishSale}
                    disabled={loading || (paymentMethod === 'efectivo' && amountPaid && Number(amountPaid) < totals.total)}
                    style={{ borderRadius: '10px' }}
                  >
                    {loading ? 'Procesando...' : 'Registrar Venta'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket/Receipt Print Modal */}
      {ticketModal && completedSale && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '360px', padding: '1.25rem', background: '#ffffff', color: '#000000', border: '1px solid #ddd', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px dashed #bbb', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
              <CheckCircle size={36} style={{ color: '#10b981', marginBottom: '0.4rem' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, fontFamily: 'monospace' }}>FERRETERÍA SANTIAGO</h2>
              <p style={{ fontSize: '0.7rem', color: '#555', margin: '0.1rem 0', fontFamily: 'monospace' }}>Av. Central 452 - Chiclayo</p>
              <p style={{ fontSize: '0.7rem', color: '#555', margin: '0.1rem 0', fontFamily: 'monospace' }}>RUC: 10458742589</p>
              <p style={{ fontSize: '0.75rem', color: '#111', fontWeight: 700, marginTop: '0.4rem', fontFamily: 'monospace' }}>BOLETA ELECTRÓNICA</p>
              <p style={{ fontSize: '0.75rem', color: '#222', fontFamily: 'monospace' }}>Ticket Nro: B001 - {completedSale.id}</p>
            </div>

            <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', borderBottom: '1px dashed #bbb', paddingBottom: '0.65rem', marginBottom: '0.65rem', fontFamily: 'monospace' }}>
              <div><strong>Fecha:</strong> {new Date(completedSale.created_at).toLocaleString('es-ES')}</div>
              <div><strong>Cliente:</strong> {completedSale.customer_name}</div>
              {completedSale.customer_document && <div><strong>DNI/RUC:</strong> {completedSale.customer_document}</div>}
              <div><strong>Vendedor:</strong> {completedSale.seller_name}</div>
            </div>

            <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse', marginBottom: '0.65rem', fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '0.25rem' }}>Cant.</th>
                  <th style={{ textAlign: 'left', paddingBottom: '0.25rem' }}>Descripción</th>
                  <th style={{ textAlign: 'right', paddingBottom: '0.25rem' }}>P.Unit</th>
                  <th style={{ textAlign: 'right', paddingBottom: '0.25rem' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {completedSale.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ paddingTop: '0.25rem', verticalAlign: 'top' }}>{item.quantity}</td>
                    <td style={{ paddingTop: '0.25rem', paddingRight: '0.25rem' }}>{item.name}</td>
                    <td style={{ textAlign: 'right', paddingTop: '0.25rem', verticalAlign: 'top' }}>S/ {item.sale_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', paddingTop: '0.25rem', verticalAlign: 'top' }}>S/ {(item.sale_price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: '0.7rem', borderTop: '1px dashed #bbb', paddingTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'flex-end', marginBottom: '0.85rem', fontFamily: 'monospace' }}>
              <div>Subtotal (18%): S/ {(completedSale.total / 1.18).toFixed(2)}</div>
              <div>IGV (18%): S/ {(completedSale.total - (completedSale.total / 1.18)).toFixed(2)}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>TOTAL A PAGAR: S/ {Number(completedSale.total).toFixed(2)}</div>
              <div style={{ textTransform: 'uppercase', color: '#555', marginTop: '0.2rem', fontSize: '0.65rem' }}>
                Pago: {completedSale.payment_method.replace('_', ' ')}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#555', borderTop: '1px dashed #bbb', paddingTop: '0.65rem', marginBottom: '0.85rem', fontFamily: 'monospace' }}>
              ¡Gracias por preferirnos!
              <br />
              Visítenos pronto
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
                onClick={() => {
                  setCompletedSale(null);
                  setTicketModal(false);
                }}
              >
                Cerrar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                onClick={() => {
                  window.print();
                  setCompletedSale(null);
                  setTicketModal(false);
                }}
              >
                <Printer size={13} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      {cameraScannerOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', padding: '1.25rem', background: 'var(--bg-surface-solid)' }}>
            <div className="modal-header" style={{ marginBottom: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Camera className="text-primary" size={20} /> Escáner de Código
              </span>
              <button 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}
                onClick={() => setCameraScannerOpen(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <div className="scanner-container-relative">
                {/* Laser Overlay animation */}
                <div className="scanner-laser" />
                <div id="scanner-video-region" />
              </div>

              {/* Tips for cashiers */}
              <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: '0.25rem' }}>💡 Consejos de lectura:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: '1.4' }}>
                  <li>Mantenga el código a unos <strong>15-20 cm</strong> de la cámara.</li>
                  <li>Evite reflejos de luz directa sobre el empaque del producto.</li>
                  <li>Las webcams fijas de laptops no tienen enfoque automático. Si se ve borroso, aleje el producto lentamente.</li>
                  <li>Para mayor velocidad y precisión, se recomienda usar un lector USB (pistola), ya soportado en el buscador.</li>
                </ul>
              </div>

              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', borderRadius: '10px', marginTop: '0.25rem' }}
                onClick={() => setCameraScannerOpen(false)}
              >
                Detener Cámara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
