import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, DollarSign, Smartphone, Landmark, Printer, CheckCircle } from 'lucide-react';

export default function POS({ addNotification }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

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
        { id: 1, barcode: '7750123456789', name: 'Martillo de Uña 16oz Bellota', stock: 15, sale_price: 25.00, description: 'Mango de fibra de vidrio', category_id: 1, categories: { name: 'Herramientas Manuales' } },
        { id: 2, barcode: '7750123456790', name: 'Alicate Universal 8" Tramontina', stock: 8, sale_price: 18.50, description: 'Acero forjado aislado', category_id: 1, categories: { name: 'Herramientas Manuales' } },
        { id: 3, barcode: '7750123456791', name: 'Llave Inglesa 10" Stanley', stock: 5, sale_price: 32.00, description: 'Cromada de alta resistencia', category_id: 1, categories: { name: 'Herramientas Manuales' } },
        { id: 4, barcode: '7750123456792', name: 'Foco LED 12W Luz Fría Philips', stock: 45, sale_price: 7.50, description: 'Ahorrador de energía', category_id: 2, categories: { name: 'Materiales Eléctricos' } },
        { id: 5, barcode: '7750123456793', name: 'Cable Eléctrico Nro 12 Indeco (m)', stock: 100, sale_price: 3.20, description: 'Cable de cobre unipolar', category_id: 2, categories: { name: 'Materiales Eléctricos' } },
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
  };

  // Barcode quick add
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matchedProduct = products.find(
      (p) => p.barcode === searchQuery.trim() || p.name.toLowerCase() === searchQuery.toLowerCase()
    );

    if (matchedProduct) {
      addToCart(matchedProduct);
      setSearchQuery('');
      addNotification(`Agregado: ${matchedProduct.name}`, 'success');
    } else {
      // If no exact match by barcode, keep search open to filter in grid
      addNotification('Búsqueda sin coincidencia exacta.', 'warning');
    }
  };

  // Filter products by name or barcode
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery))
  );

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.sale_price * item.quantity, 0);
    const tax = subtotal * 0.18; // 18% IGV (Peru)
    const total = subtotal; // Total includes IGV, so we divide for breakdown
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
  const handleCheckout = async () => {
    if (cart.length === 0) {
      addNotification('El carrito está vacío.', 'warning');
      return;
    }
    setCheckoutModal(true);
  };

  const handleFinishSale = async () => {
    setLoading(true);
    const totals = calculateTotals();
    const saleData = {
      seller_name: 'Cajero Principal',
      customer_name: customerName,
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
      addNotification('Venta Simulada con éxito.', 'success');
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

  return (
    <div className="pos-page">
      <div className="pos-container">
        {/* Left Side: Product catalog search and selection */}
        <div className="pos-catalog-section glass-panel">
          <form onSubmit={handleBarcodeSubmit} className="pos-search-bar">
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input
                ref={barcodeInputRef}
                type="text"
                className="form-input"
                placeholder="Escanee código de barra o busque por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary">Buscar</button>
          </form>

          <div className="pos-products-grid">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const cartItem = cart.find((item) => item.id === product.id);
              const remainingStock = product.stock - (cartItem ? cartItem.quantity : 0);

              return (
                <div
                  key={product.id}
                  className={`pos-product-card ${remainingStock <= 0 ? 'out-of-stock' : ''}`}
                  onClick={() => remainingStock > 0 && addToCart(product)}
                >
                  <div>
                    <span 
                      style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}
                    >
                      {product.categories?.name || 'Ferretería'}
                    </span>
                    <div className="pos-product-name">{product.name}</div>
                    <div className="pos-product-code">{product.barcode || 'Sin Código'}</div>
                  </div>
                  <div className="pos-product-price-row">
                    <span className="pos-product-price">S/ {Number(product.sale_price).toFixed(2)}</span>
                    <span className="pos-product-stock">Stock: {remainingStock}</span>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                No se encontraron productos en el catálogo.
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Shopping Cart / Sidebar Bill */}
        <div className="pos-cart-section glass-panel">
          <div className="pos-cart-header">
            <span>Boleta de Venta</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
              <ShoppingCart size={18} />
              <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
          </div>

          <div className="pos-cart-items">
            {cart.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <span className="pos-cart-item-name">{item.name}</span>
                  <span className="pos-cart-item-price">S/ {Number(item.sale_price).toFixed(2)} x {item.quantity}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <div className="pos-cart-item-qty-controls">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>
                      <Minus size={12} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="pos-cart-item-total">S/ {(item.sale_price * item.quantity).toFixed(2)}</span>
                    <Trash2 
                      size={14} 
                      className="text-danger" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => removeFromCart(item.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div style={{ textAlign: 'center', margin: 'auto 0', color: 'var(--text-muted)' }}>
                <ShoppingCart size={36} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                <p>Carrito de compras vacío</p>
                <p style={{ fontSize: '0.75rem' }}>Haga clic en un producto para agregarlo</p>
              </div>
            )}
          </div>

          <div className="pos-cart-totals">
            <div className="pos-total-row">
              <span>Subtotal (sin IGV)</span>
              <span>S/ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="pos-total-row">
              <span>IGV (18%)</span>
              <span>S/ {totals.tax.toFixed(2)}</span>
            </div>
            <div className="pos-total-row grand-total">
              <span>Total a Pagar</span>
              <span>S/ {totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="btn btn-success" 
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
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
          <div className="modal-content glass-panel" style={{ background: 'var(--bg-surface-solid)' }}>
            <div className="modal-header">
              <span>Confirmar Transacción</span>
              <button 
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
                onClick={() => setCheckoutModal(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre del Cliente</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">DNI / RUC (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. 10458745874" 
                  value={customerDoc} 
                  onChange={(e) => setCustomerDoc(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Método de Pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <button 
                    type="button"
                    className={`btn ${paymentMethod === 'efectivo' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('efectivo')}
                    style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}
                  >
                    <DollarSign size={16} /> Efectivo
                  </button>
                  <button 
                    type="button"
                    className={`btn ${paymentMethod === 'tarjeta' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('tarjeta')}
                    style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}
                  >
                    <CreditCard size={16} /> Tarjeta
                  </button>
                  <button 
                    type="button"
                    className={`btn ${paymentMethod === 'yape_plin' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('yape_plin')}
                    style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}
                  >
                    <Smartphone size={16} /> Yape / Plin
                  </button>
                  <button 
                    type="button"
                    className={`btn ${paymentMethod === 'transferencia' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('transferencia')}
                    style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}
                  >
                    <Landmark size={16} /> Transferencia
                  </button>
                </div>
              </div>

              {paymentMethod === 'efectivo' && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Paga con (S/)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="0.00" 
                      value={amountPaid} 
                      onChange={(e) => setAmountPaid(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vuelto (S/)</label>
                    <div 
                      style={{ 
                        fontSize: '1.4rem', 
                        fontWeight: 800, 
                        color: 'var(--success)', 
                        padding: '0.5rem 0', 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}
                    >
                      S/ {calculatedChange().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  <strong>Total a cobrar:</strong>
                  <strong style={{ color: 'var(--success)' }}>S/ {totals.total.toFixed(2)}</strong>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setCheckoutModal(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={handleFinishSale}
                    disabled={loading || (paymentMethod === 'efectivo' && amountPaid && Number(amountPaid) < totals.total)}
                  >
                    {loading ? 'Procesando...' : 'Confirmar Cobro'}
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
          <div className="modal-content glass-panel" style={{ maxWidth: '380px', padding: '1.5rem', background: '#fff', color: '#000' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <CheckCircle className="text-success" size={40} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>FERRETERÍA SANTIAGO</h2>
              <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.1rem 0' }}>Av. Central 452 - Chiclayo</p>
              <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.1rem 0' }}>RUC: 10458742589</p>
              <p style={{ fontSize: '0.75rem', color: '#333', fontWeight: 600, marginTop: '0.5rem' }}>BOLETA DE VENTA ELECTRÓNICA</p>
              <p style={{ fontSize: '0.75rem', color: '#333' }}>B001 - {completedSale.id}</p>
            </div>

            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', borderBottom: '1px dashed #ccc', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <div><strong>Fecha:</strong> {new Date(completedSale.created_at).toLocaleString()}</div>
              <div><strong>Cliente:</strong> {completedSale.customer_name}</div>
              {completedSale.customer_document && <div><strong>DNI/RUC:</strong> {completedSale.customer_document}</div>}
              <div><strong>Vendedor:</strong> {completedSale.seller_name}</div>
            </div>

            <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', marginBottom: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '0.3rem' }}>Cant.</th>
                  <th style={{ textAlign: 'left', paddingBottom: '0.3rem' }}>Descripción</th>
                  <th style={{ textAlign: 'right', paddingBottom: '0.3rem' }}>P.Unit</th>
                  <th style={{ textAlign: 'right', paddingBottom: '0.3rem' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {completedSale.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ paddingTop: '0.3rem' }}>{item.quantity}</td>
                    <td style={{ paddingTop: '0.3rem' }}>{item.name}</td>
                    <td style={{ textAlign: 'right', paddingTop: '0.3rem' }}>S/ {item.sale_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', paddingTop: '0.3rem' }}>S/ {(item.sale_price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: '0.75rem', borderTop: '1px dashed #ccc', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <div>Subtotal (18%): S/ {(completedSale.total / 1.18).toFixed(2)}</div>
              <div>IGV (18%): S/ {(completedSale.total - (completedSale.total / 1.18)).toFixed(2)}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>TOTAL: S/ {Number(completedSale.total).toFixed(2)}</div>
              <div style={{ textTransform: 'capitalize', color: '#666', marginTop: '0.2rem', fontSize: '0.7rem' }}>
                Pago: {completedSale.payment_method.replace('_', ' ')}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#666', borderTop: '1px dashed #ccc', paddingTop: '0.75rem', marginBottom: '1rem' }}>
              ¡Gracias por su compra!
              <br />
              No se aceptan devoluciones pasados los 7 días.
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: '#eee', color: '#000', border: '1px solid #ccc' }}
                onClick={() => {
                  setCompletedSale(null);
                  setTicketModal(false);
                }}
              >
                Cerrar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                onClick={() => {
                  window.print();
                  setCompletedSale(null);
                  setTicketModal(false);
                }}
              >
                <Printer size={14} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
