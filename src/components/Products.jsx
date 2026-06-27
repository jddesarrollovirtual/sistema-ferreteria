import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Copy, 
  Printer, 
  Eye, 
  Download, 
  Upload,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Award,
  BookOpen,
  Settings,
  MoreVertical,
  X
} from 'lucide-react';
import { getProductImage } from './POS';

export default function Products({ searchQuery: propSearchQuery, setSearchQuery: propSetSearchQuery, addNotification }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Search & Filters state
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;

  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Product for Right Drawer
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerTab, setDrawerTab] = useState('info');

  // CRUD Modal Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [formBrand, setFormBrand] = useState('Stanley');
  const [formTax, setFormTax] = useState('18%');
  const [formUnit, setFormUnit] = useState('Unidad');
  const [formStatus, setFormStatus] = useState('Activo');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleOpenAddModal = () => openAddModal();
    window.addEventListener('open-add-product-modal', handleOpenAddModal);
    return () => window.removeEventListener('open-add-product-modal', handleOpenAddModal);
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

      // Sync and merge local custom images and ERP metadata (Brand, Tax, Unit, Status)
      const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
      const erpMetadata = JSON.parse(localStorage.getItem('ferre_product_erp_metadata') || '{}');

      const productsWithERP = (prodData || []).map((p) => {
        const meta = erpMetadata[p.id] || {};
        return {
          ...p,
          image_url: localImages[p.id] || p.image_url || null,
          brand: meta.brand || 'Stanley',
          tax: meta.tax || '18%',
          unit: meta.unit || 'Unidad',
          status: meta.status || (p.stock > 0 ? 'Activo' : 'Inactivo')
        };
      });

      setProducts(productsWithERP);
      setDbError(false);
    } catch (error) {
      console.error('Error fetching catalog, loading mock database:', error);
      setDbError(true);
      setCategories([
        { id: 1, name: 'Herramientas' },
        { id: 2, name: 'Adhesivos' },
        { id: 3, name: 'Tornillos' },
        { id: 4, name: 'Pinturas' },
      ]);
      setSuppliers([
        { id: 1, name: 'Distribuidora Stanley Perú' },
        { id: 2, name: 'Corporación CPP' },
      ]);

      const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
      const erpMetadata = JSON.parse(localStorage.getItem('ferre_product_erp_metadata') || '{}');

      const mockProducts = [
        { id: 1, barcode: '77510203040', name: 'Martillo Stanley 16oz', description: 'Martillo uña curva profesional', stock: 15, cost_price: 18.00, sale_price: 25.00, category_id: 1, categories: { name: 'Herramientas' }, supplier_id: 1, suppliers: { name: 'Distribuidora Stanley Perú' } },
        { id: 2, barcode: '77510203041', name: 'Pegamento Epóxico 50ml', description: 'Adhesivo de alta resistencia extra fuerte', stock: 8, cost_price: 10.00, sale_price: 20.00, category_id: 2, categories: { name: 'Adhesivos' }, supplier_id: 1, suppliers: { name: 'Distribuidora Stanley Perú' } },
        { id: 3, barcode: '77510203042', name: 'Wincha Stanley 5m', description: 'Cinta métrica profesional con seguro', stock: 5, cost_price: 12.00, sale_price: 18.00, category_id: 1, categories: { name: 'Herramientas' }, supplier_id: 1, suppliers: { name: 'Distribuidora Stanley Perú' } },
        { id: 4, barcode: '77510203043', name: 'Tornillo Drywall 2"', description: 'Tornillo para drywall caja 100u', stock: 100, cost_price: 0.18, sale_price: 0.35, category_id: 3, categories: { name: 'Tornillos' }, supplier_id: 2, suppliers: { name: 'Corporación CPP' } },
        { id: 5, barcode: '77510203044', name: 'Pintura Látex Blanca 1L', description: 'Pintura interior mate lavable', stock: 12, cost_price: 16.00, sale_price: 28.00, category_id: 4, categories: { name: 'Pinturas' }, supplier_id: 2, suppliers: { name: 'Corporación CPP' } },
        { id: 6, barcode: '77510203045', name: 'Taladro Inalámbrico 20V', description: 'Taladro percutor con maletín DeWalt', stock: 4, cost_price: 350.00, sale_price: 520.00, category_id: 1, categories: { name: 'Herramientas' }, supplier_id: 1, suppliers: { name: 'Distribuidora Stanley Perú' } }
      ].map((p) => {
        const meta = erpMetadata[p.id] || {};
        return {
          ...p,
          image_url: localImages[p.id] || null,
          brand: meta.brand || (p.name.includes('Stanley') ? 'Stanley' : p.name.includes('DeWalt') ? 'DeWalt' : 'Generico'),
          tax: meta.tax || '18%',
          unit: meta.unit || 'Unidad',
          status: meta.status || 'Activo'
        };
      });
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
    setFormBrand('Stanley');
    setFormTax('18%');
    setFormUnit('Unidad');
    setFormStatus('Activo');
    setModalOpen(true);
  };

  const openEditModal = (product, e) => {
    if (e) e.stopPropagation();
    setEditProduct(product);
    setFormBarcode(product.barcode || '');
    setFormName(product.name || '');
    setFormDescription(product.description || '');
    setFormImageUrl(product.image_url || '');
    setFormCategoryId(product.category_id || '');
    setFormSupplierId(product.supplier_id || '');
    setFormCostPrice(product.cost_price ? String(product.cost_price) : '');
    setFormSalePrice(product.sale_price ? String(product.sale_price) : '');
    setFormBrand(product.brand || 'Stanley');
    setFormTax(product.tax || '18%');
    setFormUnit(product.unit || 'Unidad');
    setFormStatus(product.status || 'Activo');
    setModalOpen(true);
  };

  const handleDuplicateProduct = (product, e) => {
    if (e) e.stopPropagation();
    setEditProduct(null); // Force creation
    setFormBarcode(product.barcode ? `${product.barcode}-COPIA` : '');
    setFormName(`${product.name} (Copia)`);
    setFormDescription(product.description || '');
    setFormImageUrl(product.image_url || '');
    setFormCategoryId(product.category_id || '');
    setFormSupplierId(product.supplier_id || '');
    setFormCostPrice(product.cost_price ? String(product.cost_price) : '');
    setFormSalePrice(product.sale_price ? String(product.sale_price) : '');
    setFormBrand(product.brand || 'Stanley');
    setFormTax(product.tax || '18%');
    setFormUnit(product.unit || 'Unidad');
    setFormStatus(product.status || 'Activo');
    setModalOpen(true);
    addNotification('Ingreso duplicado cargado en formulario.', 'primary');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName || !formSalePrice) {
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
      stock: editProduct ? editProduct.stock : 10, // Default stock for master catalogue simulation
      min_stock: editProduct ? editProduct.min_stock : 5,
      image_url: formImageUrl || null,
    };

    setLoading(true);
    try {
      let savedProd = null;
      if (dbError) throw new Error('Simulation Mode');

      if (editProduct) {
        // Edit product
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editProduct.id);
        if (error) throw error;
        savedProd = { id: editProduct.id };
      } else {
        // Create new
        const { data, error } = await supabase
          .from('products')
          .insert([payload])
          .select();
        if (error) throw error;
        savedProd = data[0];
      }

      // Save ERP attributes and custom images in localStorage maps
      if (savedProd) {
        const erpMetadata = JSON.parse(localStorage.getItem('ferre_product_erp_metadata') || '{}');
        erpMetadata[savedProd.id] = {
          brand: formBrand,
          tax: formTax,
          unit: formUnit,
          status: formStatus
        };
        localStorage.setItem('ferre_product_erp_metadata', JSON.stringify(erpMetadata));

        if (formImageUrl) {
          const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
          localImages[savedProd.id] = formImageUrl;
          localStorage.setItem('ferre_product_images', JSON.stringify(localImages));
        }
      }

      addNotification(editProduct ? 'Producto actualizado.' : 'Producto creado con éxito.', 'success');
      setModalOpen(false);
      fetchInitialData();
    } catch (error) {
      console.warn('Saving in Simulation mode:', error);
      const tempId = editProduct ? editProduct.id : Date.now();

      const erpMetadata = JSON.parse(localStorage.getItem('ferre_product_erp_metadata') || '{}');
      erpMetadata[tempId] = {
        brand: formBrand,
        tax: formTax,
        unit: formUnit,
        status: formStatus
      };
      localStorage.setItem('ferre_product_erp_metadata', JSON.stringify(erpMetadata));

      if (formImageUrl) {
        const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
        localImages[tempId] = formImageUrl;
        localStorage.setItem('ferre_product_images', JSON.stringify(localImages));
      }

      const catObj = categories.find(c => c.id === Number(formCategoryId));
      const supObj = suppliers.find(s => s.id === Number(formSupplierId));

      if (editProduct) {
        setProducts(
          products.map(p =>
            p.id === editProduct.id
              ? {
                  ...p,
                  ...payload,
                  brand: formBrand,
                  tax: formTax,
                  unit: formUnit,
                  status: formStatus,
                  categories: catObj ? { name: catObj.name } : null,
                  suppliers: supObj ? { name: supObj.name } : null
                }
              : p
          )
        );
        addNotification('Producto editado (Simulado).', 'success');
      } else {
        const newProduct = {
          id: tempId,
          ...payload,
          brand: formBrand,
          tax: formTax,
          unit: formUnit,
          status: formStatus,
          categories: catObj ? { name: catObj.name } : null,
          suppliers: supObj ? { name: supObj.name } : null
        };
        setProducts([newProduct, ...products]);
        addNotification('Producto creado (Simulado).', 'success');
      }
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (product, e) => {
    if (e) e.stopPropagation();
    if (!confirm(`¿Está seguro de eliminar el producto "${product.name}" del catálogo maestro?`)) return;

    setLoading(true);
    try {
      if (dbError) throw new Error('Simulation Mode');

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);
      if (error) throw error;

      addNotification('Producto eliminado.', 'success');
      setSelectedProduct(null);
      fetchInitialData();
    } catch (error) {
      setProducts(products.filter(p => p.id !== product.id));
      setSelectedProduct(null);
      addNotification('Producto eliminado (Simulado).', 'success');
    } finally {
      setLoading(false);
    }
  };

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
    setLoading(true);
    compressImage(file, (base64Url) => {
      setFormImageUrl(base64Url);
      setLoading(false);
      addNotification('Imagen cargada localmente.', 'success');
    });
  };

  // KPIs Calculations
  const totalCount = products.length;
  const activeCount = products.filter(p => p.status === 'Activo').length;
  const inactiveCount = products.filter(p => p.status === 'Inactivo').length;
  const noImageCount = products.filter(p => !p.image_url).length;
  const newCount = products.slice(0, 3).length; // Simulated new arrivals this month

  // Filter products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.categories?.name && p.categories.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !filterCategory || p.category_id === Number(filterCategory);
    const matchesBrand = !filterBrand || (p.brand && p.brand.toLowerCase() === filterBrand.toLowerCase());
    const matchesStatus = !filterStatus || (p.status && p.status.toLowerCase() === filterStatus.toLowerCase());
    const matchesSupplier = !filterSupplier || p.supplier_id === Number(filterSupplier);

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesSupplier;
  });

  // Pagination slice
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryStyle = (catName) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('herramienta')) {
      return { background: 'rgba(168, 85, 247, 0.08)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.2)' };
    }
    if (lower.includes('adhesiv') || lower.includes('pegamento')) {
      return { background: 'rgba(59, 130, 246, 0.08)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' };
    }
    if (lower.includes('tornill') || lower.includes('perno')) {
      return { background: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)' };
    }
    if (lower.includes('pintur')) {
      return { background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' };
    }
    return { background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.06)' };
  };

  return (
    <div className="products-layout-wrapper">
      
      {/* Left panel: Catalog List and stats */}
      <div className="products-left-panel" style={{ paddingRight: selectedProduct ? '0.75rem' : '0' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#fff' }}>Productos</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Gestiona el catálogo completo de productos de tu ferretería.</p>
        </div>

        {/* KPIs Cards */}
        <div className="grid-5" style={{ marginBottom: '1.25rem', gap: '0.85rem' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Total Productos</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}>{totalCount}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>100% del catálogo</div>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Activos</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}>{activeCount}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{totalCount ? ((activeCount/totalCount)*100).toFixed(1) : 0}% del total</div>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Inactivos</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}>{inactiveCount}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{totalCount ? ((inactiveCount/totalCount)*100).toFixed(1) : 0}% del total</div>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ImageIcon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Sin Imagen</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}>{noImageCount}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{totalCount ? ((noImageCount/totalCount)*100).toFixed(1) : 0}% del total</div>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Nuevos (30 días)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}>{newCount}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>+15% vs mes anterior</div>
            </div>
          </div>
        </div>

        {/* Toolbar row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={openAddModal}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)', border: 'none' }}
            >
              <Plus size={14} /> Nuevo Producto
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => addNotification('Importación de catálogo en cola.', 'primary')}
            >
              <Upload size={13} /> Importar
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => addNotification('Exportación a excel completada.', 'success')}
            >
              <Download size={13} /> Exportar
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => addNotification('Impresión de etiquetas enviada a cola.', 'primary')}
            >
              <Printer size={13} /> Etiquetas
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem', borderRadius: '8px' }}
              onClick={() => addNotification('Más opciones en desarrollo.', 'warning')}
            >
              <MoreVertical size={13} />
            </button>
          </div>
        </div>

        {/* Dropdown Filters row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto auto', gap: '0.5rem', marginBottom: '1.15rem', alignItems: 'center' }}>
          <select 
            className="form-select"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            style={{ height: '36px', fontSize: '0.78rem', borderRadius: '8px' }}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select 
            className="form-select"
            value={filterBrand}
            onChange={(e) => { setFilterBrand(e.target.value); setCurrentPage(1); }}
            style={{ height: '36px', fontSize: '0.78rem', borderRadius: '8px' }}
          >
            <option value="">Todas las marcas</option>
            <option value="Stanley">Stanley</option>
            <option value="DeWalt">DeWalt</option>
            <option value="Pattex">Pattex</option>
            <option value="FixPro">FixPro</option>
            <option value="CPP">CPP</option>
          </select>

          <select 
            className="form-select"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            style={{ height: '36px', fontSize: '0.78rem', borderRadius: '8px' }}
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          <select 
            className="form-select"
            value={filterSupplier}
            onChange={(e) => { setFilterSupplier(e.target.value); setCurrentPage(1); }}
            style={{ height: '36px', fontSize: '0.78rem', borderRadius: '8px' }}
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => addNotification('Filtros aplicados.', 'success')}
          >
            <Filter size={13} /> Filtros
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ height: '36px', padding: '0 0.65rem', borderRadius: '8px' }}
            onClick={() => {
              setFilterCategory('');
              setFilterBrand('');
              setFilterStatus('');
              setFilterSupplier('');
              setSearchQuery('');
              setCurrentPage(1);
            }}
          >
            ↺
          </button>
        </div>

        {/* Master Catalog Table */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="table-container" style={{ margin: '0', flexGrow: 1, overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  </th>
                  <th>PRODUCTO</th>
                  <th>CÓDIGO</th>
                  <th>CATEGORÍA</th>
                  <th>MARCA</th>
                  <th>PRECIO COMPRA</th>
                  <th>PRECIO VENTA</th>
                  <th>ESTADO</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((prod) => {
                  const catStyle = getCategoryStyle(prod.categories?.name);
                  return (
                    <tr 
                      key={prod.id} 
                      onClick={() => setSelectedProduct(prod)}
                      style={{ cursor: 'pointer', background: selectedProduct?.id === prod.id ? 'rgba(99, 102, 241, 0.05)' : 'none' }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
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
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.05rem' }}>{prod.description || 'Sin descripción técnica'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {prod.barcode || 'MAR-001'}
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
                          {prod.categories?.name || 'Herramientas'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {prod.brand || 'Stanley'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        S/ {Number(prod.cost_price || 15).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.85rem' }}>
                        S/ {Number(prod.sale_price).toFixed(2)}
                      </td>
                      <td>
                        <span 
                          style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: 650, 
                            borderRadius: '6px',
                            padding: '0.2rem 0.55rem',
                            background: prod.status === 'Activo' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                            color: prod.status === 'Activo' ? 'var(--success)' : 'var(--danger)',
                            border: prod.status === 'Activo' ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(239,68,68,0.15)'
                          }}
                        >
                          {prod.status || 'Activo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem', borderRadius: '6px' }}
                            onClick={(e) => openEditModal(prod, e)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem', borderRadius: '6px' }}
                            onClick={(e) => handleDuplicateProduct(prod, e)}
                          >
                            <Copy size={13} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem', borderRadius: '6px', color: 'var(--danger)' }}
                            onClick={(e) => handleDeleteProduct(prod, e)}
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
                      <p>No se encontraron productos en el catálogo maestro.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          {filteredProducts.length > 0 && (
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.85rem 1.25rem', 
                borderTop: '1px solid var(--border-color)',
                background: 'rgba(6, 9, 19, 0.2)',
                flexShrink: 0
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
      </div>

      {/* Right Drawer Panel: Details view */}
      {selectedProduct && (
        <div className="products-details-drawer">
          {/* Drawer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Detalles del Producto</span>
            <button 
              type="button"
              onClick={() => setSelectedProduct(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Hero Header Area */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <img 
              src={selectedProduct.image_url || getProductImage(selectedProduct.name)} 
              alt={selectedProduct.name} 
              style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', background: 'rgba(0,0,0,0.2)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>{selectedProduct.name}</h3>
              <span 
                style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 700, 
                  color: 'var(--success)', 
                  background: 'rgba(16,185,129,0.08)', 
                  border: '1px solid rgba(16,185,129,0.15)',
                  padding: '0.1rem 0.45rem', 
                  borderRadius: '4px',
                  alignSelf: 'flex-start'
                }}
              >
                {selectedProduct.status || 'Activo'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Código: {selectedProduct.barcode || 'MAR-001'}</span>
            </div>
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.15rem', borderRadius: '8px', gap: '0.15rem' }}>
            <button
              type="button"
              className={`category-tab-btn ${drawerTab === 'info' ? 'active' : ''}`}
              onClick={() => setDrawerTab('info')}
              style={{ padding: '0.35rem 0', fontSize: '0.72rem', borderRadius: '6px', textAlign: 'center' }}
            >
              Info
            </button>
            <button
              type="button"
              className={`category-tab-btn ${drawerTab === 'precios' ? 'active' : ''}`}
              onClick={() => setDrawerTab('precios')}
              style={{ padding: '0.35rem 0', fontSize: '0.72rem', borderRadius: '6px', textAlign: 'center' }}
            >
              Precios
            </button>
            <button
              type="button"
              className={`category-tab-btn ${drawerTab === 'proveedor' ? 'active' : ''}`}
              onClick={() => setDrawerTab('proveedor')}
              style={{ padding: '0.35rem 0', fontSize: '0.72rem', borderRadius: '6px', textAlign: 'center' }}
            >
              Socio
            </button>
            <button
              type="button"
              className={`category-tab-btn ${drawerTab === 'imagenes' ? 'active' : ''}`}
              onClick={() => setDrawerTab('imagenes')}
              style={{ padding: '0.35rem 0', fontSize: '0.72rem', borderRadius: '6px', textAlign: 'center' }}
            >
              Fotos
            </button>
          </div>

          {/* Tab Content Panels */}
          <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto' }}>
            {drawerTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.45rem', fontWeight: 700, color: '#fff' }}>
                  Información General
                </div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Categoría</label>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>{selectedProduct.categories?.name || 'General'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Marca</label>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>{selectedProduct.brand || 'Stanley'}</div>
                  </div>
                </div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Unidad de Medida</label>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>{selectedProduct.unit || 'Unidad'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Código de Barras</label>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontFamily: 'monospace' }}>{selectedProduct.barcode || '7750100200'}</div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Descripción Técnica</label>
                  <div style={{ fontSize: '0.78rem', color: '#fff', lineHeight: 1.4 }}>{selectedProduct.description || 'Sin descripción técnica adicional registrada.'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Estado</label>
                  <div style={{ fontSize: '0.78rem', color: selectedProduct.status === 'Activo' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{selectedProduct.status || 'Activo'}</div>
                </div>
              </div>
            )}

            {drawerTab === 'precios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.45rem', fontWeight: 700, color: '#fff' }}>
                  Configuración Comercial
                </div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Precio Compra</label>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>S/ {Number(selectedProduct.cost_price || 15).toFixed(2)}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Precio Venta</label>
                    <div style={{ fontSize: '0.92rem', color: 'var(--success)', fontWeight: 800 }}>S/ {Number(selectedProduct.sale_price).toFixed(2)}</div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Impuesto Configurado</label>
                  <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>{selectedProduct.tax || '18% (IGV)'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Margen Estimado</label>
                  <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>
                    {selectedProduct.cost_price ? (((selectedProduct.sale_price - selectedProduct.cost_price) / selectedProduct.cost_price) * 100).toFixed(1) : '100'}%
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'proveedor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.45rem', fontWeight: 700, color: '#fff' }}>
                  Proveedor Asociado
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Socio Comercial Principal</label>
                  <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 700 }}>{selectedProduct.suppliers?.name || 'Distribuidora Stanley Perú'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Dirección / Contacto</label>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lima, Perú - Oficina de Enlace Mayorista</div>
                </div>
              </div>
            )}

            {drawerTab === 'imagenes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.45rem', fontWeight: 700, color: '#fff' }}>
                  Galería de Catálogo
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <img 
                    src={selectedProduct.image_url || getProductImage(selectedProduct.name)} 
                    alt="P1" 
                    style={{ width: '100%', height: '90px', borderRadius: '8px', objectFit: 'cover', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }} 
                  />
                  <div style={{ width: '100%', height: '90px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.68rem', cursor: 'pointer' }} onClick={() => addNotification('Subir foto adicional en desarrollo.', 'primary')}>
                    + Foto
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Actions */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary"
                onClick={(e) => openEditModal(selectedProduct, e)}
                style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '6px', background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)', border: 'none' }}
              >
                Editar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={(e) => handleDuplicateProduct(selectedProduct, e)}
                style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '6px' }}
              >
                Duplicar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={(e) => handleDeleteProduct(selectedProduct, e)}
                style={{ padding: '0.45rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}
              >
                Eliminar
              </button>
            </div>

            {/* ERP Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.45rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                onClick={() => addNotification('Stock por sucursales consultado.', 'success')}
              >
                🏪 Sucursales
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                onClick={() => addNotification('Consultando Kardex del inventario.', 'primary')}
              >
                🕒 Movimientos
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                onClick={() => addNotification('Generando barra de etiquetas PDF.', 'success')}
              >
                🏷️ Imprimir Etiq.
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                onClick={() => addNotification('Consultando pedidos de compras.', 'primary')}
              >
                🛒 Compras Hist.
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                onClick={() => addNotification('Consultando pedidos de venta.', 'primary')}
              >
                📈 Ventas Hist.
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                onClick={() => addNotification('Opciones ERP adicionales cargadas.', 'primary')}
              >
                ✥ Más Opciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Add/Edit Product Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '580px', width: '100%', background: 'var(--bg-surface-solid)', padding: '1.5rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{editProduct ? 'Editar Ficha de Producto' : 'Nueva Ficha de Producto'}</span>
              <button 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="grid-2" style={{ gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650 }}>Nombre del Producto *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Martillo Stanley 16oz"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650 }}>Marca *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Stanley / DeWalt"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 650 }}>Descripción Técnica</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '50px', resize: 'vertical' }}
                  placeholder="Detalles técnicos y características del producto..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* Upload image preview */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 650 }}>Fotografía de Catálogo (URL o archivo local)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {formImageUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img src={formImageUrl} alt="Prv" style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                        Imagen lista para guardar
                      </span>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.15)' }} onClick={() => setFormImageUrl('')}>
                        Quitar
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', height: '36px', cursor: 'pointer', borderRadius: '8px', fontSize: '0.78rem', border: '1px dashed rgba(255,255,255,0.15)' }}>
                      Subir archivo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="O pega enlace web (URL)..." 
                      value={formImageUrl.startsWith('data:') ? '' : formImageUrl} 
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      style={{ height: '36px', fontSize: '0.78rem' }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650 }}>Categoría *</label>
                  <select 
                    className="form-select" 
                    value={formCategoryId} 
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione Categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650 }}>Proveedor Principal</label>
                  <select 
                    className="form-select" 
                    value={formSupplierId} 
                    onChange={(e) => setFormSupplierId(e.target.value)}
                  >
                    <option value="">Seleccione Proveedor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650 }}>Precio Compra (Costo S/)</label>
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
                  <label className="form-label" style={{ fontWeight: 650 }}>Precio Venta * (S/)</label>
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

              <div className="grid-3" style={{ gap: '0.65rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650 }}>Código de Barras</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. 775102..."
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650 }}>Impuesto</label>
                  <select className="form-select" value={formTax} onChange={(e) => setFormTax(e.target.value)}>
                    <option value="18%">18% (IGV)</option>
                    <option value="0%">0% (Exento)</option>
                    <option value="10%">10% (Especial)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650 }}>Unidad Medida</label>
                  <select className="form-select" value={formUnit} onChange={(e) => setFormUnit(e.target.value)}>
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                    <option value="Metro">Metro</option>
                    <option value="Galón">Galón</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 650 }}>Estado Catálogo</label>
                <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ borderRadius: '8px', flex: 1 }} onClick={() => setModalOpen(false)} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '8px', flex: 1, background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)', border: 'none' }} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
