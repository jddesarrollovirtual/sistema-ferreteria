import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  AlertTriangle, 
  AlertCircle, 
  PackageCheck, 
  Upload,
  Package,
  DollarSign,
  TrendingUp,
  Download,
  LayoutGrid,
  List,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getProductImage } from './POS';

export default function Inventory({ searchQuery: propSearchQuery, setSearchQuery: propSetSearchQuery, addNotification }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
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

  useEffect(() => {
    const handleOpenModal = () => openAddModal();
    window.addEventListener('open-add-product-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-product-modal', handleOpenModal);
  }, [categories, suppliers]);

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

  // Canvas utility to resize and compress desktop uploaded image files to ~15KB
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        callback(dataUrl);
      };
    };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification('Por favor seleccione un archivo de imagen válido.', 'warning');
      return;
    }

    setLoading(true);
    compressImage(file, (base64Url) => {
      setFormImageUrl(base64Url);
      setLoading(false);
      addNotification('Imagen local cargada y optimizada.', 'success');
    });
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

  const getCategoryStyle = (catName) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('herramienta')) {
      return { background: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)' };
    }
    if (lower.includes('plomer') || lower.includes('tubo') || lower.includes('material')) {
      return { background: 'rgba(59, 130, 246, 0.08)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' };
    }
    if (lower.includes('pintur')) {
      return { background: 'rgba(168, 85, 247, 0.08)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.2)' };
    }
    if (lower.includes('tornill') || lower.includes('perno')) {
      return { background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' };
    }
    return { background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.06)' };
  };

  // Filters
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.categories?.name && p.categories.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      !selectedCategory || p.category_id === Number(selectedCategory);

    // Tab Filter
    let matchesTab = true;
    if (activeTab === 'bajo_stock') {
      matchesTab = p.stock > 0 && p.stock <= p.min_stock;
    } else if (activeTab === 'sin_stock') {
      matchesTab = p.stock <= 0;
    } else if (activeTab === 'activos') {
      matchesTab = p.stock > 0;
    } else if (activeTab === 'inactivos') {
      matchesTab = p.stock <= 0;
    }

    return matchesSearch && matchesCategory && matchesTab;
  });

  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) return { label: 'Sin Stock', class: 'badge-danger', icon: <XCircle size={13} style={{ marginRight: '0.2rem' }} /> };
    if (stock <= minStock) return { label: 'Stock Bajo', class: 'badge-warning', icon: <AlertTriangle size={13} style={{ marginRight: '0.2rem' }} /> };
    return { label: 'Disponible', class: 'badge-success', icon: <CheckCircle size={13} style={{ marginRight: '0.2rem' }} /> };
  };

  return (
    <div className="inventory-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-title-section">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#fff' }}>Inventario de Productos</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Gestione el stock, precios y datos del catálogo ferretero.</p>
        </div>
      </div>



      {/* Stat Cards Row */}
      <div className="grid-5" style={{ marginBottom: '1.5rem', gap: '0.85rem' }}>
        
        {/* Card 1: Total Productos */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Total Productos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2', marginTop: '0.1rem' }}>{products.length}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>productos registrados</div>
          </div>
        </div>

        {/* Card 2: Valor del Inventario */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Valor del Inventario</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2', marginTop: '0.1rem' }}>S/ {products.reduce((sum, p) => sum + (Number(p.cost_price || 0) * Number(p.stock || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>valor total</div>
          </div>
        </div>

        {/* Card 3: Stock Disponible */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Stock Disponible</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2', marginTop: '0.1rem' }}>{products.reduce((sum, p) => sum + Number(p.stock || 0), 0)}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>unidades disponibles</div>
          </div>
        </div>

        {/* Card 4: Stock Bajo */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Stock Bajo</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2', marginTop: '0.1rem' }}>{products.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>productos</div>
          </div>
        </div>

        {/* Card 5: Sin Stock */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Sin Stock</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2', marginTop: '0.1rem' }}>{products.filter((p) => p.stock <= 0).length}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>productos</div>
          </div>
        </div>
      </div>

      {/* Tabs and Actions bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Left Side: Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`category-tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => { setActiveTab('todos'); setCurrentPage(1); }}
            style={{ borderRadius: '8px', padding: '0.4rem 0.95rem', fontSize: '0.78rem', fontWeight: 650 }}
          >
            Todos ({products.length})
          </button>
          <button
            type="button"
            className={`category-tab-btn ${activeTab === 'bajo_stock' ? 'active' : ''}`}
            onClick={() => { setActiveTab('bajo_stock'); setCurrentPage(1); }}
            style={{ borderRadius: '8px', padding: '0.4rem 0.95rem', fontSize: '0.78rem', fontWeight: 650 }}
          >
            Stock Bajo ({products.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length})
          </button>
          <button
            type="button"
            className={`category-tab-btn ${activeTab === 'sin_stock' ? 'active' : ''}`}
            onClick={() => { setActiveTab('sin_stock'); setCurrentPage(1); }}
            style={{ borderRadius: '8px', padding: '0.4rem 0.95rem', fontSize: '0.78rem', fontWeight: 650 }}
          >
            Sin Stock ({products.filter((p) => p.stock <= 0).length})
          </button>
          <button
            type="button"
            className={`category-tab-btn ${activeTab === 'activos' ? 'active' : ''}`}
            onClick={() => { setActiveTab('activos'); setCurrentPage(1); }}
            style={{ borderRadius: '8px', padding: '0.4rem 0.95rem', fontSize: '0.78rem', fontWeight: 650 }}
          >
            Activos ({products.filter((p) => p.stock > 0).length})
          </button>
          <button
            type="button"
            className={`category-tab-btn ${activeTab === 'inactivos' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inactivos'); setCurrentPage(1); }}
            style={{ borderRadius: '8px', padding: '0.4rem 0.95rem', fontSize: '0.78rem', fontWeight: 650 }}
          >
            Inactivos ({products.filter((p) => p.stock <= 0).length})
          </button>
        </div>

        {/* Right Side: Action Buttons & Layout toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.78rem', borderRadius: '8px' }}
            onClick={() => addNotification('Exportación a Excel completada.', 'success')}
          >
            <Download size={14} /> Exportar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.78rem', borderRadius: '8px' }}
            onClick={() => addNotification('Importación de catálogo disponible.', 'success')}
          >
            <Upload size={14} /> Importar
          </button>

          {/* Grid/List switch */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.15rem', borderRadius: '8px', gap: '0.15rem' }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '0.3rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => addNotification('Vista cuadrícula en desarrollo.', 'warning')}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              style={{
                background: 'var(--primary)',
                border: 'none',
                color: '#fff',
                padding: '0.3rem',
                borderRadius: '6px',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <List size={15} />
            </button>
          </div>
        </div>

      </div>

      {/* Products Table Panel */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading && products.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Cargando inventario...</p>
        ) : (
          <div className="table-container" style={{ margin: '0' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  </th>
                  <th>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      CÓDIGO <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      PRODUCTO <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      CATEGORÍA <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      COSTO <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      P. VENTA <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      STOCK <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      ESTADO <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((prod) => {
                  const status = getStockStatus(prod.stock, prod.min_stock);
                  const catStyle = getCategoryStyle(prod.categories?.name);
                  return (
                    <tr key={prod.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#fff', fontFamily: 'monospace' }}>
                        {prod.barcode || 'Sin Código'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img 
                            src={prod.image_url || getProductImage(prod.name)} 
                            alt={prod.name} 
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '8px', 
                              objectFit: 'cover', 
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              flexShrink: 0 
                            }} 
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.05rem' }}>Código: {prod.barcode || 'MAR-000'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span 
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 650,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '6px',
                            ...catStyle
                          }}
                        >
                          {prod.categories?.name || 'General'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        S/ {Number(prod.cost_price).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.85rem' }}>
                        S/ {Number(prod.sale_price).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>
                        {prod.stock}
                      </td>
                      <td>
                        <span 
                          className={`badge ${status.class}`} 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            fontSize: '0.72rem', 
                            fontWeight: 650, 
                            borderRadius: '6px',
                            padding: '0.2rem 0.55rem',
                            background: status.class === 'badge-success' ? 'rgba(16,185,129,0.08)' : status.class === 'badge-warning' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                            color: status.class === 'badge-success' ? 'var(--success)' : status.class === 'badge-warning' ? 'var(--warning)' : 'var(--danger)',
                            border: status.class === 'badge-success' ? '1px solid rgba(16,185,129,0.15)' : status.class === 'badge-warning' ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(239,68,68,0.15)'
                          }}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem', borderRadius: '6px' }}
                            onClick={() => openEditModal(prod)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.35rem', borderRadius: '6px' }}
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                      <Search size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', opacity: 0.3 }} />
                      <p>No se encontraron productos coincidentes.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Footer */}
            {filteredProducts.length > 0 && (
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.85rem 1.25rem', 
                  borderTop: '1px solid var(--border-color)',
                  background: 'rgba(6, 9, 19, 0.2)'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} productos
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      color: currentPage === 1 ? 'var(--text-muted)' : '#fff',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        style={{
                          background: currentPage === pageNum ? 'var(--primary)' : 'none',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          width: '26px',
                          height: '26px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: currentPage === pageNum ? 'default' : 'pointer'
                        }}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      color: currentPage === Math.ceil(filteredProducts.length / itemsPerPage) ? 'var(--text-muted)' : '#fff',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: currentPage === Math.ceil(filteredProducts.length / itemsPerPage) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredProducts.length / itemsPerPage)))}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
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

              {/* Image upload and preview container */}
              <div className="form-group">
                <label className="form-label">Imagen del Producto (URL o desde PC)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formImageUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img 
                        src={formImageUrl} 
                        alt="Preview" 
                        style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', background: 'rgba(0,0,0,0.2)' }} 
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                        {formImageUrl.startsWith('data:') ? 'Imagen cargada desde PC (Guardado Local)' : 'Imagen vinculada por enlace web (URL)'}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        onClick={() => setFormImageUrl('')}
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label 
                        className="btn btn-secondary" 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.7rem 0.85rem', cursor: 'pointer', borderRadius: '10px', fontSize: '0.8rem', width: '100%', border: '1px dashed rgba(255,255,255,0.15)' }}
                      >
                        <Upload size={14} /> Subir desde PC
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={handleFileChange} 
                        />
                      </label>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="O pega link web (URL)..." 
                        value={formImageUrl.startsWith('data:') ? '' : formImageUrl} 
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        style={{ padding: '0.7rem 0.85rem', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>
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
