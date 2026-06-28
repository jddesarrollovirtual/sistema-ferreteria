import React, { useState, useEffect } from 'react';
import { 
  Package, Box, AlertTriangle, AlertCircle, History, ArrowRightLeft, Settings2, Plus, 
  Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle, TrendingUp, TrendingDown, ChevronDown 
} from 'lucide-react';
import { getProductImage } from './POS';

// Constantes globales de Sucursales simuladas
export const BRANCHES = ['Principal', 'Chiclayo', 'Piura', 'Trujillo'];

export default function Inventory({ inventorySubTab, setInventorySubTab, addNotification }) {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cargar catálogo base
    const baseProducts = JSON.parse(localStorage.getItem('ferrepro_products') || '[]');
    
    // 2. Inyectar / Asegurar existencia de estructura Multi-Sucursal
    let inventoryModified = false;
    const inventoryProducts = baseProducts.map(p => {
      if (!p.branch_stock) {
        inventoryModified = true;
        // Generar stock simulado aleatorio para cada sucursal
        p.branch_stock = {
          'Principal': Math.floor(Math.random() * 80),
          'Chiclayo': Math.floor(Math.random() * 60),
          'Piura': Math.floor(Math.random() * 40),
          'Trujillo': Math.floor(Math.random() * 50)
        };
      }
      return p;
    });

    if (inventoryModified) {
      localStorage.setItem('ferrepro_products', JSON.stringify(inventoryProducts));
    }
    
    setProducts(inventoryProducts);

    // 3. Cargar Bitácora de Movimientos
    const localLogs = JSON.parse(localStorage.getItem('ferrepro_inventory_logs') || '[]');
    setLogs(localLogs);
    
    setTimeout(() => setLoading(false), 400); // Fake network delay
  }, []);

  const renderActiveView = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ marginLeft: '1rem' }}>Cargando datos del inventario...</span>
        </div>
      );
    }

    switch (inventorySubTab) {
      case 'resumen':
        return <ResumenView products={products} logs={logs} setInventorySubTab={setInventorySubTab} />;
      case 'existencias':
        return <ExistenciasView products={products} branches={BRANCHES} />;
      case 'movimientos':
        return <MovimientosView logs={logs} />;
      case 'kardex':
        return <KardexView products={products} logs={logs} branches={BRANCHES} />;
      case 'transferencias':
        return <TransferenciasView products={products} setProducts={setProducts} logs={logs} setLogs={setLogs} branches={BRANCHES} addNotification={addNotification} setInventorySubTab={setInventorySubTab} />;
      case 'ajustes':
        return <AjustesView products={products} setProducts={setProducts} logs={logs} setLogs={setLogs} branches={BRANCHES} addNotification={addNotification} setInventorySubTab={setInventorySubTab} />;
      default:
        return <ResumenView products={products} logs={logs} setInventorySubTab={setInventorySubTab} />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto' }}>
      {/* Header General del Módulo */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Inventario</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Consulta y gestiona las existencias de productos por sucursal.</p>
      </div>
      
      {/* Dynamic View Renderer */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {renderActiveView()}
      </div>
    </div>
  );
}

// ==========================================
// 1. VISTA DE RESUMEN
// ==========================================
function ResumenView({ products, logs, setInventorySubTab }) {
  // Calcular métricas
  let valorTotal = 0;
  let productosConStock = 0;
  let stockBajo = 0; // Menor a 15 unidades totales
  let sinStock = 0;

  products.forEach(p => {
    let totalStock = 0;
    if (p.branch_stock) {
      Object.values(p.branch_stock).forEach(val => totalStock += val);
    }
    
    valorTotal += (totalStock * (Number(p.cost_price) || 0));
    
    if (totalStock === 0) {
      sinStock++;
    } else if (totalStock < 15) {
      stockBajo++;
      productosConStock++;
    } else {
      productosConStock++;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Tarjetas de Resumen Numérico */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'linear-gradient(145deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor total del inventario</p>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>S/ {valorTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '10px' }}>
              <Box style={{ color: '#3b82f6' }} size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
            <TrendingUp size={12} /> +12.5% <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs mes anterior</span>
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Productos con stock</p>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{productosConStock.toLocaleString()}</h2>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '10px' }}>
              <Package style={{ color: '#10b981' }} size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>{Math.round((productosConStock/Math.max(products.length, 1))*100)}% del total de catálogo</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock bajo</p>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{stockBajo}</h2>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.6rem', borderRadius: '10px' }}>
              <AlertTriangle style={{ color: '#f59e0b' }} size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
            <TrendingDown size={12} /> -8% <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs mes anterior</span>
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sin stock</p>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{sinStock}</h2>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', borderRadius: '10px' }}>
              <AlertCircle style={{ color: '#ef4444' }} size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
            <TrendingUp size={12} /> +5% <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs mes anterior</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
           <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
             Últimos Movimientos Registrados
             <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '6px' }} onClick={() => setInventorySubTab('movimientos')}>Ver Todos</button>
           </h3>
           
           {logs.length === 0 ? (
             <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
               <History size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
               <p>No se han registrado movimientos recientes de inventario.</p>
             </div>
           ) : (
             <div style={{ overflowX: 'auto' }}>
               {/* Aquí renderizaremos la tabla reducida de movimientos posteriormente */}
               <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lista de movimientos (Próximamente...)</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

// Placeholders for other views
function ExistenciasView({ products, branches }) {
  const [localSearch, setLocalSearch] = useState('');
  
  // Filtrado simple por texto
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(localSearch.toLowerCase()) || 
    (p.barcode && p.barcode.toLowerCase().includes(localSearch.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
      
      {/* Barra de Filtros */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ flexGrow: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Sucursal</label>
          <div style={{ position: 'relative' }}>
            <select className="form-input" style={{ width: '100%', height: '36px', padding: '0 1rem', fontSize: '0.8rem', appearance: 'none', background: 'rgba(0,0,0,0.2)' }}>
              <option value="todas">Todas las sucursales</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '11px', color: 'var(--text-muted)' }} />
          </div>
        </div>
        
        <div style={{ flexGrow: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Categoría</label>
          <div style={{ position: 'relative' }}>
            <select className="form-input" style={{ width: '100%', height: '36px', padding: '0 1rem', fontSize: '0.8rem', appearance: 'none', background: 'rgba(0,0,0,0.2)' }}>
              <option value="todas">Todas las categorías</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '11px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div style={{ flexGrow: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Estado de stock</label>
          <div style={{ position: 'relative' }}>
            <select className="form-input" style={{ width: '100%', height: '36px', padding: '0 1rem', fontSize: '0.8rem', appearance: 'none', background: 'rgba(0,0,0,0.2)' }}>
              <option value="todos">Todos</option>
              <option value="bajo">Stock Bajo</option>
              <option value="agotado">Sin Stock</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '11px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div style={{ flexGrow: 2, minWidth: '250px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar producto..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }} 
            />
          </div>
        </div>

        <button className="btn btn-secondary" style={{ height: '36px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={14} />
        </button>
        <button className="btn btn-secondary" style={{ height: '36px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Download size={14} /> Exportar
        </button>
      </div>

      {/* Tabla de Existencias */}
      <div className="glass-panel" style={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
        <div style={{ overflowX: 'auto', flexGrow: 1 }}>
          <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)' }}>Producto</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)' }}>Código</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)' }}>Categoría</th>
                
                {/* Cabeceras de Sucursales Dinámicas */}
                {branches.map(b => (
                  <th key={b} style={{ textAlign: 'center', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)' }}>{b}</th>
                ))}
                
                <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)' }}>Total</th>
                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)' }}>Valor Total</th>
                <th style={{ width: '40px', background: 'rgba(15,23,42,0.95)' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6 + branches.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron productos</td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  let totalStock = 0;
                  if (p.branch_stock) {
                    Object.values(p.branch_stock).forEach(v => totalStock += v);
                  }
                  
                  return (
                    <tr key={p.id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img 
                            src={p.image_url || getProductImage(p.name)} 
                            alt={p.name} 
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', background: 'rgba(0,0,0,0.2)' }} 
                          />
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', margin: 0 }}>{p.name}</p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description || p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.barcode || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                          {p.categories?.name || 'General'}
                        </span>
                      </td>
                      
                      {/* Celdas de Sucursales Dinámicas */}
                      {branches.map(b => {
                        const stock = p.branch_stock?.[b] || 0;
                        let color = '#10b981'; // Green
                        if (stock === 0) color = '#ef4444'; // Red
                        else if (stock < 15) color = '#f59e0b'; // Yellow
                        
                        return (
                          <td key={b} style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: color }}>
                            {stock}
                          </td>
                        );
                      })}
                      
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                        {totalStock}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        S/ {(totalStock * (Number(p.cost_price) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.2rem', background: 'transparent', border: 'none' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                          </div>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function MovimientosView({ logs }) {
  return (
    <div className="glass-panel" style={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>Historial de Movimientos</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '0.2rem' }}>Registro cronológico de todas las operaciones de inventario.</p>
        </div>
        <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Download size={14} /> Exportar Log
        </button>
      </div>

      <div style={{ overflowX: 'auto', flexGrow: 1 }}>
        <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)' }}>Fecha y Hora</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)' }}>Tipo / Motivo</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)' }}>Producto</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)' }}>Sucursal</th>
              <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)' }}>Cantidad</th>
              <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)' }}>Stock Final</th>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.95)' }}>Usuario / Obs</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay movimientos registrados.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(log.date).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ 
                      fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                      background: log.quantity > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: log.quantity > 0 ? '#10b981' : '#ef4444',
                      border: `1px solid ${log.quantity > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                    }}>
                      {log.type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{log.product_name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.branch}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: log.quantity > 0 ? '#10b981' : '#ef4444' }}>
                    {log.quantity > 0 ? '+' : ''}{log.quantity}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                    {log.stock_after}
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>{log.user}</p>
                    <p style={{ margin: 0, marginTop: '2px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.observations}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KardexView({ products, logs, branches }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Filtrar logs según selección
  const filteredLogs = logs.filter(log => {
    if (selectedProduct && log.product_id !== selectedProduct) return false;
    if (selectedBranch && log.branch !== selectedBranch) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
      
      {/* Filtros de Kardex */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ flexGrow: 2 }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Consultar Producto</label>
          <select className="form-input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 1rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}>
            <option value="">Todos los productos...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.barcode ? `(${p.barcode})` : ''}</option>
            ))}
          </select>
        </div>
        
        <div style={{ flexGrow: 1 }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Sucursal</label>
          <select className="form-input" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 1rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}>
            <option value="">Todas las sucursales</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <button className="btn btn-secondary" style={{ height: '36px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={14} /> Filtrar
        </button>
        <button className="btn btn-primary" style={{ height: '36px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Download size={14} /> Imprimir Kardex
        </button>
      </div>

      {/* Tabla Kardex usa el mismo diseño que movimientos pero está filtrada */}
      <MovimientosView logs={filteredLogs} />
    </div>
  );
}
function TransferenciasView({ products, setProducts, logs, setLogs, branches, addNotification, setInventorySubTab }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [originBranch, setOriginBranch] = useState('');
  const [destBranch, setDestBranch] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!selectedProduct || !originBranch || !destBranch || !quantity) {
      addNotification('Completa todos los campos.', 'warning');
      return;
    }
    if (originBranch === destBranch) {
      addNotification('La sucursal de origen y destino deben ser distintas.', 'warning');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      addNotification('Ingresa una cantidad válida.', 'warning');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const currentOriginStock = product.branch_stock?.[originBranch] || 0;
    if (currentOriginStock < qty) {
      addNotification(`Stock insuficiente en ${originBranch}. (Disponible: ${currentOriginStock})`, 'danger');
      return;
    }

    // Ejecutar Transferencia
    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct) {
        const newStock = { ...p.branch_stock };
        newStock[originBranch] = (newStock[originBranch] || 0) - qty;
        newStock[destBranch] = (newStock[destBranch] || 0) + qty;
        return { ...p, branch_stock: newStock };
      }
      return p;
    });

    // Registrar Bitácora (2 logs: Salida y Entrada)
    const logOut = {
      id: Date.now() + '-out',
      date: new Date().toISOString(),
      user: 'Admin General',
      product_id: product.id,
      product_name: product.name,
      branch: originBranch,
      type: 'Transferencia (Salida)',
      quantity: -qty,
      stock_before: currentOriginStock,
      stock_after: currentOriginStock - qty,
      observations: `Transferido a ${destBranch}`
    };

    const currentDestStock = product.branch_stock?.[destBranch] || 0;
    const logIn = {
      id: Date.now() + '-in',
      date: new Date().toISOString(),
      user: 'Admin General',
      product_id: product.id,
      product_name: product.name,
      branch: destBranch,
      type: 'Transferencia (Entrada)',
      quantity: qty,
      stock_before: currentDestStock,
      stock_after: currentDestStock + qty,
      observations: `Recibido desde ${originBranch}`
    };

    const newLogs = [logIn, logOut, ...logs];
    
    // Guardar
    setProducts(updatedProducts);
    setLogs(newLogs);
    localStorage.setItem('ferrepro_products', JSON.stringify(updatedProducts));
    localStorage.setItem('ferrepro_inventory_logs', JSON.stringify(newLogs));

    addNotification('Transferencia ejecutada con éxito.', 'success');
    
    // Limpiar formulario
    setSelectedProduct('');
    setOriginBranch('');
    setDestBranch('');
    setQuantity('');
    
    // Opcional: Redirigir a movimientos
    setTimeout(() => setInventorySubTab('movimientos'), 1000);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ArrowRightLeft size={22} style={{ color: 'var(--primary)' }} /> Registrar Transferencia
      </h2>
      
      <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label className="form-label">Producto a transferir</label>
          <select className="form-input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
            <option value="">Seleccione un producto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.barcode ? `(${p.barcode})` : ''}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Sucursal de Origen (Descuenta)</label>
            <select className="form-input" value={originBranch} onChange={e => setOriginBranch(e.target.value)} required>
              <option value="">Seleccione origen...</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Sucursal de Destino (Recibe)</label>
            <select className="form-input" value={destBranch} onChange={e => setDestBranch(e.target.value)} required>
              <option value="">Seleccione destino...</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Cantidad a mover</label>
          <input 
            type="number" 
            className="form-input" 
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="Ej. 10" 
            required 
          />
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setInventorySubTab('existencias')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>Confirmar Transferencia</button>
        </div>
      </form>
    </div>
  );
}

function AjustesView({ products, setProducts, logs, setLogs, branches, addNotification, setInventorySubTab }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [branch, setBranch] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('Dañado');
  const [quantity, setQuantity] = useState('');
  const [observations, setObservations] = useState('');

  const handleAdjust = (e) => {
    e.preventDefault();
    if (!selectedProduct || !branch || !quantity || !adjustmentType) {
      addNotification('Completa todos los campos requeridos.', 'warning');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty === 0) {
      addNotification('La cantidad de ajuste no puede ser 0.', 'warning');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const currentStock = product.branch_stock?.[branch] || 0;
    
    // Prevención de stock negativo severo
    if (currentStock + qty < 0) {
      addNotification(`El ajuste no puede dejar el stock de ${branch} en negativo.`, 'danger');
      return;
    }

    // Ejecutar Ajuste
    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct) {
        const newStock = { ...p.branch_stock };
        newStock[branch] = currentStock + qty;
        return { ...p, branch_stock: newStock };
      }
      return p;
    });

    // Registrar Bitácora
    const log = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      user: 'Admin General',
      product_id: product.id,
      product_name: product.name,
      branch: branch,
      type: `Ajuste (${qty > 0 ? 'Entrada' : 'Salida'})`,
      quantity: qty,
      stock_before: currentStock,
      stock_after: currentStock + qty,
      observations: `Motivo: ${adjustmentType}. ${observations}`
    };

    const newLogs = [log, ...logs];
    
    // Guardar
    setProducts(updatedProducts);
    setLogs(newLogs);
    localStorage.setItem('ferrepro_products', JSON.stringify(updatedProducts));
    localStorage.setItem('ferrepro_inventory_logs', JSON.stringify(newLogs));

    addNotification('Ajuste de inventario aplicado.', 'success');
    
    // Limpiar
    setSelectedProduct('');
    setQuantity('');
    setObservations('');
    
    setTimeout(() => setInventorySubTab('movimientos'), 1000);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Settings2 size={22} style={{ color: 'var(--accent)' }} /> Registrar Ajuste Físico
      </h2>
      
      <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Producto afectado</label>
            <select className="form-input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
              <option value="">Seleccione un producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.barcode ? `(${p.barcode})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Sucursal</label>
            <select className="form-input" value={branch} onChange={e => setBranch(e.target.value)} required>
              <option value="">Seleccione...</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Motivo / Tipo de Ajuste</label>
            <select className="form-input" value={adjustmentType} onChange={e => setAdjustmentType(e.target.value)} required>
              <option value="Dañado">Producto dañado (Resta)</option>
              <option value="Perdido">Producto perdido (Resta)</option>
              <option value="Vencimiento">Vencimiento (Resta)</option>
              <option value="Inventario Físico">Corrección de Inventario Físico</option>
              <option value="Devolución">Ingreso por devolución</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="form-label">Cantidad (Usar negativo para restar)</label>
            <input 
              type="number" 
              className="form-input"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="Ej. -3 o +5" 
              required 
            />
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Si faltan 3 martillos, ingresa -3.</p>
          </div>
        </div>

        <div>
          <label className="form-label">Observaciones (Opcional)</label>
          <textarea 
            className="form-input" 
            rows="2" 
            value={observations}
            onChange={e => setObservations(e.target.value)}
            placeholder="Detalles adicionales del ajuste..."
          ></textarea>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setInventorySubTab('existencias')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>Confirmar Ajuste</button>
        </div>
      </form>
    </div>
  );
}
