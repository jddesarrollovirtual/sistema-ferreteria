import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Package, 
  Calendar, 
  ArrowRight, 
  ShieldAlert,
  TrendingUp,
  Target,
  Award,
  Clock
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalSales: 0.0,
    salesCount: 0,
    lowStockCount: 0,
    totalProducts: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentDistribution, setPaymentDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

      // 3. Group payments dynamically from actual sales list
      const payMethods = {
        efectivo: 0,
        tarjeta: 0,
        yape_plin: 0,
        transferencia: 0
      };

      if (sales) {
        sales.forEach(sale => {
          const method = sale.payment_method;
          if (payMethods[method] !== undefined) {
            payMethods[method] += Number(sale.total);
          }
        });
      }

      const paymentData = [
        { method: 'Efectivo', pct: totalSValue > 0 ? Math.round((payMethods.efectivo / totalSValue) * 100) : 0, color: '#10b981', amount: `S/ ${payMethods.efectivo.toFixed(2)}` },
        { method: 'Tarjeta', pct: totalSValue > 0 ? Math.round((payMethods.tarjeta / totalSValue) * 100) : 0, color: '#6366f1', amount: `S/ ${payMethods.tarjeta.toFixed(2)}` },
        { method: 'Yape / Plin', pct: totalSValue > 0 ? Math.round((payMethods.yape_plin / totalSValue) * 100) : 0, color: '#a855f7', amount: `S/ ${payMethods.yape_plin.toFixed(2)}` },
        { method: 'Transferencia', pct: totalSValue > 0 ? Math.round((payMethods.transferencia / totalSValue) * 100) : 0, color: '#f59e0b', amount: `S/ ${payMethods.transferencia.toFixed(2)}` }
      ];

      // 4. Get sale items to calculate real Top Selling Products
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('quantity, subtotal, products(name, stock)');

      if (itemsError) throw itemsError;

      const productMap = {};
      if (saleItems) {
        saleItems.forEach(item => {
          const name = item.products?.name || 'Producto Eliminado';
          const stock = item.products?.stock ?? 0;
          if (!productMap[name]) {
            productMap[name] = { name, sales: 0, stock, revenue: 0 };
          }
          productMap[name].sales += item.quantity;
          productMap[name].revenue += Number(item.subtotal);
        });
      }

      const topProductsData = Object.values(productMap)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 3)
        .map(p => ({
          name: p.name,
          sales: p.sales,
          stock: p.stock,
          profit: `S/ ${p.revenue.toFixed(2)}`
        }));

      setStats({
        totalSales: totalSValue,
        salesCount: totalSCount,
        lowStockCount: lowStock.length,
        totalProducts: totalP,
      });
      setLowStockProducts(lowStock.slice(0, 5));
      setRecentSales(sales ? sales.slice(0, 5) : []);
      setPaymentDistribution(paymentData);
      setTopProducts(topProductsData);
    } catch (error) {
      console.error('Error fetching dashboard data, activating fallback simulation:', error);
      setDbError(true);
      
      // Fallback with rich visual mock data (only in offline/error mode)
      setStats({
        totalSales: 1850.50,
        salesCount: 28,
        lowStockCount: 3,
        totalProducts: 124,
      });
      setLowStockProducts([
        { id: 101, name: 'Martillo de Uña 16oz Bellota', stock: 2, min_stock: 5, sale_price: 25.00 },
        { id: 102, name: 'Tubo PVC 1/2" Pavco (3m)', stock: 0, min_stock: 10, sale_price: 8.90 },
        { id: 103, name: 'Pegamento PVC Oatey 1/4 Galón', stock: 3, min_stock: 5, sale_price: 45.00 },
      ]);
      setRecentSales([
        { id: 201, customer_name: 'Carlos Mendoza', total: 45.00, payment_method: 'efectivo', created_at: new Date().toISOString() },
        { id: 202, customer_name: 'María Delgado', total: 112.50, payment_method: 'yape_plin', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 203, customer_name: 'Ferrete SAC', total: 320.00, payment_method: 'transferencia', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 204, customer_name: 'Cliente General', total: 12.80, payment_method: 'tarjeta', created_at: new Date(Date.now() - 14400000).toISOString() },
      ]);
      setPaymentDistribution([
        { method: 'Efectivo', pct: 45, color: '#10b981', amount: 'S/ 832.72' },
        { method: 'Tarjeta', pct: 25, color: '#6366f1', amount: 'S/ 462.62' },
        { method: 'Yape / Plin', pct: 20, color: '#a855f7', amount: 'S/ 370.10' },
        { method: 'Transferencia', pct: 10, color: '#f59e0b', amount: 'S/ 185.06' },
      ]);
      setTopProducts([
        { name: 'Foco LED 12W Philips', sales: 48, stock: 45, profit: 'S/ 360.00' },
        { name: 'Cable Eléctrico Indeco Nro 12', sales: 35, stock: 100, profit: 'S/ 112.00' },
        { name: 'Alicate Universal 8" Tramontina', sales: 18, stock: 8, profit: 'S/ 333.00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatClock = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatFullDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const salesGoal = 3000.00;
  const goalPercentage = Math.min(100, (stats.totalSales / salesGoal) * 100);

  // Maximum sales for top sellers progress bar scaling
  const maxTopSales = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.sales)) : 1;

  return (
    <div className="dashboard-container">
      {/* DB Connection Alert */}
      {dbError && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--warning)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', background: 'rgba(245, 158, 11, 0.05)', padding: '1rem' }}>
          <ShieldAlert className="text-warning" size={28} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'var(--warning)', fontWeight: 700, marginBottom: '0.1rem', fontSize: '0.9rem' }}>Modo de Simulación Activo</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No se pudo conectar a Supabase. Se muestran datos demostrativos en tiempo real. 
              Por favor deshabilita RLS en Supabase o verifica tu conexión para trabajar en modo real.
            </p>
          </div>
        </div>
      )}

      {/* Greeting Header & Goal Tracker Banner */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.15rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          {/* Welcome & Clock */}
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Gestión Comercial
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.2rem 0', color: '#fff' }}>
              ¡Hola, Administrador!
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              <Calendar size={14} />
              <span style={{ textTransform: 'capitalize' }}>{formatFullDate(currentTime)}</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <Clock size={14} />
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatClock(currentTime)}</span>
            </div>
          </div>

          {/* Goal Tracker */}
          <div style={{ minWidth: '280px', flexGrow: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Target size={15} className="text-primary" /> Meta de Ventas del Día
              </span>
              <span style={{ fontWeight: 800, color: 'var(--success)' }}>{goalPercentage.toFixed(0)}%</span>
            </div>
            {/* Goal progress track */}
            <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '99px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.02)' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${goalPercentage}%`, 
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)', 
                  borderRadius: '99px',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              <span>Actual: S/ {stats.totalSales.toFixed(2)}</span>
              <span style={{ fontWeight: 600 }}>Objetivo: S/ {salesGoal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper success">
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Ventas Totales</span>
            <span className="stat-value">S/ {stats.totalSales.toFixed(2)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper primary">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Transacciones</span>
            <span className="stat-value">{stats.salesCount}</span>
          </div>
        </div>

        <div className="stat-card">
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

        <div className="stat-card">
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
        {/* Left Side: Recent Sales & Payment distribution */}
        <div className="dashboard-left">
          {/* Recent Sales Table */}
          <div className="glass-panel" style={{ flexGrow: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={20} className="text-primary" /> Ventas Recientes
              </h2>
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
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto 0', padding: '2rem' }}>No hay ventas registradas hoy.</p>
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
                        <td style={{ fontWeight: 700 }}>{sale.customer_name || 'General'}</td>
                        <td>{formatDate(sale.created_at)}</td>
                        <td>
                          <span className="badge badge-success">
                            {sale.payment_method.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--success)' }}>
                          S/ {Number(sale.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Method Distribution Chart (Progress bars) */}
          <div className="glass-panel" style={{ flexShrink: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Distribución de Cobros por Método
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {paymentDistribution.map((pay) => (
                <div key={pay.method} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{pay.method}</span>
                    <span style={{ fontWeight: 750 }}>{pay.amount} ({pay.pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${pay.pct}%`, 
                        backgroundColor: pay.color, 
                        borderRadius: '99px' 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Stock Alerts, Top Sellers, and Quick Actions (Unified Widget Board) */}
        <div className="dashboard-right">
          <div className="glass-panel dashboard-right-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
            
            {/* Section 1: Stock Alerts (Only visible if there are low stock products) */}
            {lowStockProducts.length > 0 && (
              <div className="dashboard-right-section" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexShrink: 0 }}>
                  <AlertTriangle className="text-warning" size={18} />
                  Alertas de Stock
                </h2>
                <div className="dashboard-right-scrollable">
                  {lowStockProducts.map((prod) => {
                    const ratio = Math.min(100, (prod.stock / prod.min_stock) * 100);
                    const isZero = prod.stock === 0;

                    return (
                      <div 
                        key={prod.id} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.3rem', 
                          padding: '0.75rem 0.85rem', 
                          background: 'rgba(255, 255, 255, 0.015)', 
                          border: '1px solid rgba(255, 255, 255, 0.03)', 
                          borderRadius: '12px' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Pulse Warning Indicator */}
                          <div className={`pulse-dot ${isZero ? 'pulse-red' : 'pulse-orange'}`} />
                          
                          <span style={{ fontWeight: 750, color: '#fff', fontSize: '0.85rem', flexGrow: 1, minWidth: 0 }}>
                            {prod.name}
                          </span>
                          
                          <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '0.8rem', color: isZero ? 'var(--danger)' : 'var(--warning)' }}>
                            {prod.stock} / {prod.min_stock}
                          </span>
                        </div>
                        
                        {/* Stock safety bar */}
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${Math.max(5, ratio)}%`, 
                              backgroundColor: isZero ? 'var(--danger)' : 'var(--warning)', 
                              borderRadius: '99px' 
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Top Selling Products (Premium Rank Badges, expands dynamically) */}
            <div className="dashboard-right-section">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', flexShrink: 0 }}>
                <Award size={18} className="text-primary" /> Productos Más Vendidos
              </h3>
              
              {topProducts.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem', margin: 'auto' }}>
                  Sin ventas registradas.
                </p>
              ) : (
                <div className="dashboard-right-scrollable">
                  {topProducts.map((p, idx) => {
                    const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : 'rank-3';
                    const scalePct = maxTopSales > 0 ? (p.sales / maxTopSales) * 100 : 0;

                    return (
                      <div 
                        key={p.name} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          padding: '0.75rem', 
                          background: 'rgba(255, 255, 255, 0.015)', 
                          border: '1px solid rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          flexShrink: 0
                        }}
                      >
                        {/* 3D Circular Rank Badge */}
                        <div className={`rank-badge ${rankClass}`}>{idx + 1}</div>
                        
                        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <p style={{ fontWeight: 750, color: '#fff', fontSize: '0.85rem', margin: 0, width: '100%' }}>
                            {p.name}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span>Vendido: {p.sales} u.</span>
                            <span style={{ fontWeight: 700, color: 'var(--success)' }}>{p.profit}</span>
                          </div>
                          
                          {/* Sales Proportion mini-bar */}
                          <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '99px', overflow: 'hidden', marginTop: '0.1rem' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${scalePct}%`, 
                                background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', 
                                borderRadius: '99px' 
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Quick Actions (Bottom controls) */}
            <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setActiveTab('pos')}
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem', borderRadius: '10px' }}
                >
                  Nueva Venta
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setActiveTab('inventory')}
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem', borderRadius: '10px' }}
                >
                  Registrar Prod.
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
