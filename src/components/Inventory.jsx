import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Trash2, Search, Filter, AlertTriangle, AlertCircle, PackageCheck } from 'lucide-react';
import { getProductImage } from './POS';

export default function Inventory({ addNotification }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [dbError, setDbError] = useState(false);

  // Form Fields
  const [formBarcode, setFormBarcode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('5');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (catError) throw catError;
      setCategories(catData || []);

      // 2. Fetch Suppliers
      const { data: supData, error: supError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (supError) throw supError;
      setSuppliers(supData || []);

      // 3. Fetch Products
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*, categories(name), suppliers(name)')
        .order('name');

      if (prodError) throw prodError;
      
      const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
      const productsWithImages = (prodData || []).map((p) => ({
        ...p,
        image_url: localImages[p.id] || p.image_url || null
      }));

      setProducts(productsWithImages);
      setDbError(false);
    } catch (error) {
      console.error('Error fetching inventory data, fallback active:', error);
      setDbError(true);

      const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
      // Mock Setup
      setCategories([
        { id: 1, name: 'Herramientas Manuales' },
        { id: 2, name: 'Materiales Eléctricos' },
        { id: 3, name: 'Plomería' },
        { id: 4, name: 'Pinturas' },
      ]);
      setSuppliers([
        { id: 1, name: 'Ferretería Central S.A.' },
        { id: 2, name: 'Distribuidora Eléctrica SAC' },
      ]);
      const mockProducts = [
        { id: 1, barcode: '7750123456789', name: 'Martillo de Uña 16oz Bellota', stock: 15, min_stock: 5, cost_price: 18.00, sale_price: 25.00, description: 'Mango de fibra de vidrio', category_id: 1, categories: { name: 'Herramientas Manuales' }, suppliers: { name: 'Ferretería Central S.A.' } },
        { id: 2, barcode: '7750123456790', name: 'Alicate Universal 8" Tramontina', stock: 8, min_stock: 5, cost_price: 12.50, sale_price: 18.50, description: 'Acero forjado aislado', category_id: 1, categories: { name: 'Herramientas Manuales' }, suppliers: { name: 'Distribuidora Eléctrica SAC' } },
        { id: 3, barcode: '7750123456791', name: 'Llave Inglesa 10" Stanley', stock: 5, min_stock: 5, cost_price: 24.00, sale_price: 32.00, description: 'Cromada de alta resistencia', category_id: 1, categories: { name: 'Herramientas Manuales' }, suppliers: { name: 'Ferretería Central S.A.' } },
        { id: 4, barcode: '7750123456792', name: 'Foco LED 12W Luz Fría Philips', stock: 45, min_stock: 10, cost_price: 4.80, sale_price: 7.50, description: 'Ahorrador de energía', category_id: 2, categories: { name: 'Materiales Eléctricos' }, suppliers: { name: 'Distribuidora Eléctrica SAC' } },
        { id: 6, barcode: '7750123456794', name: 'Tubo de PVC 1/2" Pavco (3m)', stock: 2, min_stock: 10, cost_price: 6.00, sale_price: 8.90, description: 'Para agua fría roscable', category_id: 3, categories: { name: 'Plomería' }, suppliers: { name: 'Ferretería Central S.A.' } },
      ].map(p => ({
        ...p,
        image_url: localImages[p.id] || null
      }));
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditProduct(null);
    setFormBarcode('');
    setFormName('');
    setFormDescription('');
    setFormImageUrl('');
    setFormCategoryId(categories[0]?.id || '');
    setFormSupplierId(suppliers[0]?.id || '');
    setFormCostPrice('');
    setFormSalePrice('');
    setFormStock('');
    setFormMinStock('5');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditProduct(product);
    setFormBarcode(product.barcode || '');
    setFormName(product.name || '');
    setFormDescription(product.description || '');
    setFormImageUrl(product.image_url || '');
    setFormCategoryId(product.category_id || '');
    setFormSupplierId(product.supplier_id || '');
    setFormCostPrice(product.cost_price ? String(product.cost_price) : '');
    setFormSalePrice(product.sale_price ? String(product.sale_price) : '');
    setFormStock(product.stock ? String(product.stock) : '0');
    setFormMinStock(product.min_stock ? String(product.min_stock) : '5');
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName || !formSalePrice || formStock === '') {
      addNotification('Complete los campos requeridos.', 'warning');
      return;
    }

    const payload = {
      barcode: formBarcode || null,
      name: formName,
      description: formDescription || null,
      category_id: formCategoryId ? Number(formCategoryId) : null,
      supplier_id: formSupplierId ? Number(formSupplierId) : null,
      cost_price: Number(formCostPrice) || 0.0,
      sale_price: Number(formSalePrice),
      stock: Number(formStock),
      min_stock: Number(formMinStock),
      image_url: formImageUrl || null,
    };

    setLoading(true);
    try {
      if (dbError) throw new Error('Simulation Mode');

      if (editProduct) {
        // Try saving to Supabase (with image_url)
        try {
          const { error } = await supabase
            .from('products')
            .update(payload)
            .eq('id', editProduct.id);
          if (error) throw error;

          // Sync locally as well
          const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
          if (formImageUrl) {
            localImages[editProduct.id] = formImageUrl;
          } else {
            delete localImages[editProduct.id];
          }
          localStorage.setItem('ferre_product_images', JSON.stringify(localImages));
          addNotification('Producto actualizado con éxito.', 'success');
        } catch (dbErr) {
          console.warn("Fallo al guardar image_url en DB. Guardando localmente y el resto en DB:", dbErr);
          
          // Remove image_url to prevent DB column errors
          const { image_url, ...restPayload } = payload;
          const { error } = await supabase
            .from('products')
            .update(restPayload)
            .eq('id', editProduct.id);
          if (error) throw error;

          // Save image locally
          const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
          if (formImageUrl) {
            localImages[editProduct.id] = formImageUrl;
          } else {
            delete localImages[editProduct.id];
          }
          localStorage.setItem('ferre_product_images', JSON.stringify(localImages));
          addNotification('Producto actualizado (Imagen guardada localmente).', 'success');
        }
      } else {
        // CREATE NEW PRODUCT
        try {
          const { data, error } = await supabase
            .from('products')
            .insert([payload])
            .select();
          if (error) throw error;

          const newProd = data[0];
          if (formImageUrl && newProd) {
            const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
            localImages[newProd.id] = formImageUrl;
            localStorage.setItem('ferre_product_images', JSON.stringify(localImages));
          }
          addNotification('Producto creado con éxito.', 'success');
        } catch (dbErr) {
          console.warn("Fallo al crear con image_url. Guardando sin columna de imagen y guardando imagen local:", dbErr);
          
          const { image_url, ...restPayload } = payload;
          const { data, error } = await supabase
            .from('products')
            .insert([restPayload])
            .select();
          if (error) throw error;

          const newProd = data[0];
          if (formImageUrl && newProd) {
            const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
            localImages[newProd.id] = formImageUrl;
            localStorage.setItem('ferre_product_images', JSON.stringify(localImages));
          }
          addNotification('Producto creado (Imagen guardada localmente).', 'success');
        }
      }
      setModalOpen(false);
      fetchInitialData();
    } catch (error) {
      console.warn('Ejecutando acción de guardado en modo simulación:', error.message);
      
      const categoryObj = categories.find(c => c.id === Number(formCategoryId));
      const supplierObj = suppliers.find(s => s.id === Number(formSupplierId));
      const tempId = editProduct ? editProduct.id : Date.now();

      // Sync image locally in simulation
      const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
      if (formImageUrl) {
        localImages[tempId] = formImageUrl;
      } else {
        delete localImages[tempId];
      }
      localStorage.setItem('ferre_product_images', JSON.stringify(localImages));

      if (editProduct) {
        setProducts(
          products.map((p) =>
            p.id === editProduct.id
              ? { 
                  ...p, 
                  ...payload, 
                  categories: categoryObj ? { name: categoryObj.name } : null,
                  suppliers: supplierObj ? { name: supplierObj.name } : null
                }
              : p
          )
        );
        addNotification('Producto actualizado (Simulado).', 'success');
      } else {
        const newProduct = {
          id: tempId,
          ...payload,
          categories: categoryObj ? { name: categoryObj.name } : null,
          suppliers: supplierObj ? { name: supplierObj.name } : null
        };
        setProducts([newProduct, ...products]);
        addNotification('Producto creado (Simulado).', 'success');
      }
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`¿Está seguro de eliminar el producto "${name}"?`)) return;

    setLoading(true);
    try {
      if (dbError) throw new Error('Simulation Mode');

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      addNotification('Producto eliminado.', 'success');
      fetchInitialData();
    } catch (error) {
      console.warn('Acción de borrado simulada:', error.message);
      setProducts(products.filter((p) => p.id !== id));
      addNotification('Producto eliminado (Simulado).', 'success');
    } finally {
      setLoading(false);
    }
  };

  // Filters
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchQuery));
    
    const matchesCategory = 
      !selectedCategory || p.category_id === Number(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) return { label: 'Sin Stock', class: 'badge-danger', icon: <AlertCircle size={12} /> };
    if (stock <= minStock) return { label: 'Stock Bajo', class: 'badge-warning', icon: <AlertTriangle size={12} /> };
    return { label: 'Disponible', class: 'badge-success', icon: <PackageCheck size={12} /> };
  };

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Inventario de Productos</h1>
          <p>Gestione el stock, precios y datos del catálogo ferretero.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Agregar Producto
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'row', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
          <Search 
            size={18} 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
          />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por código de barra o nombre..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
          <Filter size={16} className="text-secondary" />
          <select 
            className="form-select" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel">
        {loading && products.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando inventario...</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción del Producto</th>
                  <th>Categoría</th>
                  <th>Costo</th>
                  <th>P. Venta</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => {
                  const status = getStockStatus(prod.stock, prod.min_stock);
                  return (
                    <tr key={prod.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {prod.barcode || 'Sin Código'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <img 
                            src={prod.image_url || getProductImage(prod.name)} 
                            alt={prod.name} 
                            style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '6px', 
                              objectFit: 'cover', 
                              background: 'rgba(0,0,0,0.15)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              flexShrink: 0 
                            }} 
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{prod.name}</div>
                            {prod.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prod.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{prod.categories?.name || 'General'}</td>
                      <td>S/ {Number(prod.cost_price).toFixed(2)}</td>
                      <td style={{ fontWeight: 750, color: 'var(--success)' }}>S/ {Number(prod.sale_price).toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>{prod.stock}</td>
                      <td>
                        <span className={`badge ${status.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem' }}
                            onClick={() => openEditModal(prod)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem' }}
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      No se encontraron resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Product Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <span>{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</span>
              <button 
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Código de Barras</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Escanee o digite..."
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre del Producto *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Martillo Tramontina"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
              </div>

               <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  placeholder="Detalles del producto (opcional)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL de la Imagen (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. https://imagenes.com/mi-martillo.jpg" 
                  value={formImageUrl} 
                  onChange={(e) => setFormImageUrl(e.target.value)} 
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select 
                    className="form-select" 
                    value={formCategoryId} 
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione Categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <select 
                    className="form-select" 
                    value={formSupplierId} 
                    onChange={(e) => setFormSupplierId(e.target.value)}
                  >
                    <option value="">Seleccione Proveedor</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Precio de Costo (S/)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="0.00"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio de Venta * (S/)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="0.00"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Stock Inicial *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Mínimo Alerta</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
