import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DollarSign, ShoppingCart, AlertTriangle, Package, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalSales: 0.0,
    salesCount: 0,
    lowStockCount: 0,
    totalProducts: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setDbError(false);
    try {
      // 1. Get products count and low stock
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, stock, min_stock, sale_price');

      if (pError) throw pError;

      const totalP = products ? products.length : 0;
      const lowStock = products ? products.filter(p => p.stock <= p.min_stock) : [];

      // 2. Get sales for stats
      const { data: sales, error: sError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (sError) throw sError;

      const totalSValue = sales ? sales.reduce((sum, sale) => sum + Number(sale.total), 0) : 0;
      const totalSCount = sales ? sales.length : 0;

      setStats({
        totalSales: totalSValue,
        salesCount: totalSCount,
        lowStockCount: lowStock.length,
        totalProducts: totalP,
      });
      setLowStockProducts(lowStock.slice(0, 5));
      setRecentSales(sales ? sales.slice(0, 5) : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDbError(true);
      
      // Fallback with visual mock data so the app stays functional
      setStats({
        totalSales: 2450.80,
        salesCount: 34,
        lowStockCount: 3,
        totalProducts: 124,
      });
      setLowStockProducts([
        { id: 101, name: 'Martillo de Uña 16oz', stock: 2, min_stock: 5, sale_price: 15.00 },
        { id: 102, name: 'Tubo PVC 1/2" Agua', stock: 4, min_stock: 10, sale_price: 6.50 },
        { id: 103, name: 'Cinta Aislante 3M', stock: 1, min_stock: 5, sale_price: 3.20 },
      ]);
      setRecentSales([
        { id: 201, customer_name: 'Carlos Mendoza', total: 45.00, payment_method: 'efectivo', created_at: new Date().toISOString() },
        { id: 202, customer_name: 'María Delgado', total: 112.50, payment_method: 'yape_plin', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 203, customer_name: 'General', total: 12.80, payment_method: 'tarjeta', created_at: new Date(Date.now() - 7200000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dashboard-container">
      {dbError && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--warning)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(245, 158, 11, 0.05)' }}>
          <ShieldAlert className="text-warning" size={28} />
          <div>
            <h4 style={{ color: 'var(--warning)', fontWeight: 700, marginBottom: '0.1rem' }}>Modo de Simulación Activo</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              No se pudo conectar a la base de datos de Supabase (las tablas aún no existen o las credenciales son incorrectas). 
              Por favor, ejecute el script SQL provisto en el plan para crear las tablas, o verifique su conexión. Mostrando datos demostrativos.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper success">
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Ventas Totales</span>
            <span className="stat-value">S/ {stats.totalSales.toFixed(2)}</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper primary">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Transacciones</span>
            <span className="stat-value">{stats.salesCount}</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className={`stat-icon-wrapper ${stats.lowStockCount > 0 ? 'danger' : 'success'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Stock Crítico</span>
            <span className="stat-value" style={{ color: stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {stats.lowStockCount} {stats.lowStockCount === 1 ? 'prod.' : 'prods.'}
            </span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper primary">
            <Package size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Productos Catálogo</span>
            <span className="stat-value">{stats.totalProducts}</span>
          </div>
        </div>
      </div>

      {/* Primary Dashboard Columns */}
      <div className="dashboard-layout">
        {/* Left Side: Recent Sales */}
        <div className="dashboard-left">
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 750 }}>Ventas Recientes</h2>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveTab('history')}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Ver todo <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Cargando datos...</p>
            ) : recentSales.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No hay ventas registradas.</p>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Método Pago</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td style={{ fontWeight: 600 }}>{sale.customer_name || 'General'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} />
                            {formatDate(sale.created_at)}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-success">
                            {sale.payment_method.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 750, color: 'var(--success)' }}>
                          S/ {Number(sale.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Alerts & Shortcuts */}
        <div className="dashboard-right">
          {/* Low Stock Alerts */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle className="text-warning" size={20} />
              Alertas de Stock
            </h2>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Cargando alertas...</p>
            ) : lowStockProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--success)' }}>
                <p style={{ fontWeight: 600 }}>¡Todo en orden!</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No hay productos por debajo del stock mínimo.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {lowStockProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem', 
                      background: 'rgba(239, 68, 68, 0.05)', 
                      border: '1px solid rgba(239, 68, 68, 0.15)', 
                      borderRadius: '8px' 
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{prod.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mín: {prod.min_stock} unidades</p>
                    </div>
                    <span 
                      style={{ 
                        background: 'var(--danger-glow)', 
                        color: 'var(--danger)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700 
                      }}
                    >
                      Stock: {prod.stock}
                    </span>
                  </div>
                ))}
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setActiveTab('inventory')}
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  Ir al Inventario
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 750 }}>Acciones Rápidas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setActiveTab('pos')}
                style={{ width: '100%' }}
              >
                Nueva Venta (POS)
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveTab('inventory')}
                style={{ width: '100%' }}
              >
                Registrar Producto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
