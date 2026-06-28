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
  Clock,
  BarChart3,
  Users
} from 'lucide-react';
import { getProductImage } from './POS';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalSales: 0.0,
    salesCount: 0,
    lowStockCount: 0,
    totalProducts: 0,
    totalSoldQty: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentDistribution, setPaymentDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Helper to extract client name initials
  const getInitials = (name) => {
    const cleanName = (name || 'Cliente General').toUpperCase().trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return cleanName.slice(0, 2);
  };

  // Helper to generate dynamic colored avatar gradients based on names
  const getAvatarColor = (name) => {
    const hash = (name || '').split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
      'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', // Purple
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
      'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Orange
      'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Green
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'  // Cyan
    ];
    return colors[hash % colors.length];
  };

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
      // 1. Get products count, low stock, and image URLs (wildcard avoids errors if image_url is missing)
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('*');

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

      // 4. Get sale items to calculate real Top Selling Products and Total Items Sold (wildcard avoids errors if image_url is missing)
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('quantity, subtotal, products(*)');

      if (itemsError) throw itemsError;

      let totalSoldQty = 0;
      const productMap = {};
      if (saleItems) {
        saleItems.forEach(item => {
          const name = item.products?.name || 'Producto Eliminado';
          const stock = item.products?.stock ?? 0;
          const image_url = item.products?.image_url || null;
          totalSoldQty += item.quantity;
          
          if (!productMap[name]) {
            productMap[name] = { name, sales: 0, stock, revenue: 0, image_url };
          }
          productMap[name].sales += item.quantity;
          productMap[name].revenue += Number(item.subtotal);
        });
      }

      // Merge local custom images if any
      const localImages = JSON.parse(localStorage.getItem('ferre_product_images') || '{}');
      const productsMapList = products || [];

      const topProductsData = Object.values(productMap)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 3)
        .map(p => {
          const matchedDbProd = productsMapList.find(pr => pr.name === p.name);
          const dbId = matchedDbProd?.id;
          return {
            name: p.name,
            sales: p.sales,
            stock: p.stock,
            profit: `S/ ${p.revenue.toFixed(2)}`,
            image_url: (dbId ? localImages[dbId] : null) || p.image_url || matchedDbProd?.image_url || null
          };
        });

      setStats({
        totalSales: totalSValue,
        salesCount: totalSCount,
        lowStockCount: lowStock.length,
        totalProducts: totalP,
        totalSoldQty: totalSoldQty,
      });
      setLowStockProducts(lowStock.slice(0, 5));
      setRecentSales(sales ? sales.slice(0, 5) : []);
      setPaymentDistribution(paymentData);
      setTopProducts(topProductsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDbError(true);
      
      setStats({
        totalSales: 0,
        salesCount: 0,
        lowStockCount: 0,
        totalProducts: 0,
        totalSoldQty: 0,
      });
      setLowStockProducts([]);
      setRecentSales([]);
      setPaymentDistribution([]);
      setTopProducts([]);
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
      )}      {/* Greeting and Goal Tracker Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.15rem', marginBottom: '1.15rem', flexShrink: 0 }}>
        {/* Welcome card */}
        <div className="glass-panel" style={{ 
          padding: '1.25rem 1.5rem', 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.65) 100%)', 
          border: '1px solid rgba(99, 102, 241, 0.12)', 
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '135px'
        }}>
          {/* Vector storefront graphic overlay */}
          <div style={{ 
            position: 'absolute', 
            right: '25px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            opacity: 0.15,
            pointerEvents: 'none'
          }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
              <path d="M9 22V12h6v10" />
              <path d="M2 9l3-6h14l3 6M12 3v6" />
            </svg>
          </div>

          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.1rem 0 0.4rem 0', color: '#fff' }}>
              ¡Hola, Administrador! 👋
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Bienvenido al sistema de gestión de FerreSantiago
            </p>
          </div>

          {/* Time & Date pills */}
          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.9rem', flexWrap: 'wrap', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <Calendar size={13} className="text-primary" />
              <span style={{ textTransform: 'capitalize' }}>{formatFullDate(currentTime)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <Clock size={13} className="text-accent" />
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatClock(currentTime)}</span>
            </div>
          </div>
        </div>

        {/* Goal tracker card */}
        <div className="glass-panel" style={{ 
          padding: '1.25rem 1.5rem', 
          background: 'rgba(13, 20, 38, 0.45)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '135px'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* SVG circular progress ring */}
            <div style={{ position: 'relative', width: '50px', height: '50px', flexShrink: 0 }}>
              <svg width="50" height="50" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="var(--success)" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${goalPercentage} ${100 - goalPercentage}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <span style={{ 
                position: 'absolute', 
                left: '50%', 
                top: '50%', 
                transform: 'translate(-50%, -50%)', 
                fontSize: '0.8rem', 
                fontWeight: 800, 
                color: 'var(--success)' 
              }}>{goalPercentage.toFixed(0)}%</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Meta de Ventas del Día
              </span>
              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.2rem', alignItems: 'baseline' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Actual</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>S/ {stats.totalSales.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Objetivo</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>S/ {salesGoal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', marginTop: '0.75rem' }}>
            {/* Goal progress track horizontal */}
            <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '99px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${goalPercentage}%`, 
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)', 
                  borderRadius: '99px'
                }} 
              />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0', textAlign: 'left', fontWeight: 550 }}>
              Faltan S/ {Math.max(0, salesGoal - stats.totalSales).toFixed(2)} para llegar a la meta
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid" style={{ marginBottom: '1.15rem' }}>
        {/* Card 1: Ventas Totales */}
        <div className="stat-card" style={{ padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.35)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="stat-icon-wrapper success" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', width: '40px', height: '40px', borderRadius: '10px' }}>
            <DollarSign size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Ventas Totales</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>S/ {stats.totalSales.toFixed(2)}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Hoy <span style={{ color: 'var(--success)', fontWeight: 700 }}>▲ 2% vs ayer</span>
            </span>
          </div>
        </div>

        {/* Card 2: Transacciones */}
        <div className="stat-card" style={{ padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.35)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="stat-icon-wrapper primary" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', width: '40px', height: '40px', borderRadius: '10px' }}>
            <ShoppingCart size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Transacciones</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>{stats.salesCount}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Hoy <span style={{ color: 'var(--success)', fontWeight: 700 }}>▲ 2% vs ayer</span>
            </span>
          </div>
        </div>

        {/* Card 3: Productos Vendidos */}
        <div className="stat-card" style={{ padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.35)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="stat-icon-wrapper warning" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', width: '40px', height: '40px', borderRadius: '10px' }}>
            <Package size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Productos Vendidos</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>{stats.totalSoldQty || 0}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Hoy <span style={{ color: 'var(--success)', fontWeight: 700 }}>▲ 2% vs ayer</span>
            </span>
          </div>
        </div>

        {/* Card 4: Stock Crítico */}
        <div className="stat-card" style={{ padding: '0.85rem 1rem', background: 'rgba(13, 20, 38, 0.35)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="stat-icon-wrapper danger" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', width: '40px', height: '40px', borderRadius: '10px' }}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Stock Crítico</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)', lineHeight: 1.15 }}>
              {stats.lowStockCount} {stats.lowStockCount === 1 ? 'producto' : 'productos'}
            </span>
            <span style={{ fontSize: '0.68rem', color: stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600, marginTop: '0.15rem' }}>
              {stats.lowStockCount > 0 ? 'Requiere atención' : 'Stock en niveles óptimos'}
            </span>
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
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <TrendingUp size={18} className="text-primary" /> Ventas Recientes
              </h2>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveTab('history')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: '8px' }}
              >
                Ver todas
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
                    {recentSales.map((sale) => {
                      const initials = getInitials(sale.customer_name);
                      const avatarBg = getAvatarColor(sale.customer_name || 'Cliente General');
                      
                      let paymentStyle = { padding: '0.18rem 0.5rem', fontSize: '0.72rem' };
                      if (sale.payment_method === 'efectivo') {
                        paymentStyle = { ...paymentStyle, background: 'rgba(16,185,129,0.08)', color: '#34d399', borderColor: 'rgba(16,185,129,0.15)' };
                      } else if (sale.payment_method === 'yape_plin') {
                        paymentStyle = { ...paymentStyle, background: 'rgba(168,85,247,0.08)', color: '#c084fc', borderColor: 'rgba(168,85,247,0.15)' };
                      } else if (sale.payment_method === 'tarjeta') {
                        paymentStyle = { ...paymentStyle, background: 'rgba(99,102,241,0.08)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.15)' };
                      } else {
                        paymentStyle = { ...paymentStyle, background: 'rgba(245,158,11,0.08)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.15)' };
                      }

                      const cleanMethodName = sale.payment_method === 'yape_plin' ? 'Yape / Plin' : sale.payment_method.replace('_', ' ');

                      return (
                        <tr key={sale.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{ 
                                width: '26px', 
                                height: '26px', 
                                borderRadius: '50%', 
                                background: avatarBg, 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '0.7rem', 
                                fontWeight: 800,
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>
                              <span style={{ fontWeight: 700 }}>{sale.customer_name || 'Cliente General'}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(sale.created_at)}</td>
                          <td>
                            <span className="badge" style={paymentStyle}>
                              {cleanMethodName}
                            </span>
                          </td>
                          <td style={{ fontWeight: 850, color: 'var(--success)' }}>
                            S/ {Number(sale.total).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Method Distribution Chart (Progress bars, SVG doughnut & Vertical Bar charts) */}
          <div className="glass-panel" style={{ flexShrink: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Distribución de Cobros por Método
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              
              {/* Left Side: Segmented Doughnut Chart */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '110px' }}>
                <svg width="100" height="100" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="4" />
                  
                  {/* Segment 1: Efectivo (green) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4.2" 
                    strokeDasharray={`${paymentDistribution[0]?.pct || 0} ${100 - (paymentDistribution[0]?.pct || 0)}`} 
                    strokeDashoffset="100" 
                  />
                  {/* Segment 2: Tarjeta (blue) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="4.2" 
                    strokeDasharray={`${paymentDistribution[1]?.pct || 0} ${100 - (paymentDistribution[1]?.pct || 0)}`} 
                    strokeDashoffset={`${100 - (paymentDistribution[0]?.pct || 0)}`} 
                  />
                  {/* Segment 3: Yape/Plin (purple) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#a855f7" strokeWidth="4.2" 
                    strokeDasharray={`${paymentDistribution[2]?.pct || 0} ${100 - (paymentDistribution[2]?.pct || 0)}`} 
                    strokeDashoffset={`${100 - (paymentDistribution[0]?.pct || 0) - (paymentDistribution[1]?.pct || 0)}`} 
                  />
                  {/* Segment 4: Transferencia (orange) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4.2" 
                    strokeDasharray={`${paymentDistribution[3]?.pct || 0} ${100 - (paymentDistribution[3]?.pct || 0)}`} 
                    strokeDashoffset={`${100 - (paymentDistribution[0]?.pct || 0) - (paymentDistribution[1]?.pct || 0) - (paymentDistribution[2]?.pct || 0)}`} 
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>S/ {stats.totalSales.toFixed(2)}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Total</span>
                </div>
              </div>

              {/* Middle Section: Detailed Legend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {paymentDistribution.map((pay) => (
                  <div key={pay.method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pay.color }} />
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 650 }}>{pay.method}</span>
                    </div>
                    <span style={{ fontWeight: 800 }}>{pay.amount} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pay.pct}%)</span></span>
                  </div>
                ))}
              </div>

              {/* Right Side: Glowing Vertical Bar Chart */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '95px', paddingBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '0.5rem' }}>
                {paymentDistribution.map((pay) => {
                  const height = Math.max(5, Math.min(100, pay.pct));
                  return (
                    <div key={pay.method} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18px', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ 
                        width: '100%', 
                        height: `${height}%`, 
                        background: `linear-gradient(to top, ${pay.color} 30%, rgba(255,255,255,0.15) 100%)`,
                        borderRadius: '4px 4px 0 0',
                        boxShadow: `0 0 10px ${pay.color}33`,
                        transition: 'height 0.6s ease'
                      }} />
                      <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                        {pay.method.split(' ')[0].slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Stock Alerts, Top Sellers, and Quick Actions */}
        <div className="dashboard-right">
          <div className="glass-panel dashboard-right-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
            
            {/* Section 1: Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="dashboard-right-section" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', flexShrink: 0 }}>
                  <AlertTriangle className="text-warning" size={17} />
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
                          gap: '0.25rem', 
                          padding: '0.65rem 0.75rem', 
                          background: 'rgba(255, 255, 255, 0.015)', 
                          border: '1px solid rgba(255, 255, 255, 0.03)', 
                          borderRadius: '10px' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div className={`pulse-dot ${isZero ? 'pulse-red' : 'pulse-orange'}`} />
                          
                          <span style={{ fontWeight: 750, color: '#fff', fontSize: '0.82rem', flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prod.name}
                          </span>
                          
                          <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '0.78rem', color: isZero ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }}>
                            {prod.stock} / {prod.min_stock}
                          </span>
                        </div>
                        
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

            {/* Section 2: Top Selling Products (Premium Medals + Image Thumbnails) */}
            <div className="dashboard-right-section" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', flexShrink: 0 }}>
                <Award size={17} className="text-primary" /> Productos Más Vendidos
              </h3>
              
              {topProducts.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem', margin: 'auto' }}>
                  Sin ventas registradas.
                </p>
              ) : (
                <div className="dashboard-right-scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {topProducts.map((p, idx) => {
                    const scalePct = maxTopSales > 0 ? (p.sales / maxTopSales) * 100 : 0;
                    const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';

                    return (
                      <div 
                        key={p.name} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.65rem', 
                          padding: '0.6rem', 
                          background: 'rgba(255, 255, 255, 0.012)', 
                          border: '1px solid rgba(255, 255, 255, 0.03)',
                          borderRadius: '10px',
                          flexShrink: 0
                        }}
                      >
                        <span style={{ fontSize: '1.1rem', marginRight: '0.15rem' }}>{rankMedal}</span>
                        
                        <img 
                          src={p.image_url || getProductImage(p.name)} 
                          alt={p.name} 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            objectFit: 'cover',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            flexShrink: 0
                          }}
                        />
                        
                        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <p style={{ fontWeight: 750, color: '#fff', fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            <span>Vendido: {p.sales} u.</span>
                            <span style={{ fontWeight: 800, color: 'var(--success)' }}>{p.profit}</span>
                          </div>
                          
                          <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '99px', overflow: 'hidden', marginTop: '0.1rem' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${scalePct}%`, 
                                background: 'linear-gradient(90deg, #a855f7 0%, var(--accent) 100%)', 
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

            {/* Section 3: Quick Actions 4x1 circular grid */}
            <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, paddingTop: '0.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                
                {/* Action 1: Nueva Venta */}
                <div 
                  onClick={() => setActiveTab('pos')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    background: 'rgba(168, 85, 247, 0.1)', 
                    color: '#c084fc', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(168, 85, 247, 0.15)',
                    transition: 'transform 0.2s',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <ShoppingCart size={16} />
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nueva Venta</span>
                </div>

                {/* Action 2: Registrar Producto */}
                <div 
                  onClick={() => setActiveTab('inventory')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    color: '#34d399', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    transition: 'transform 0.2s',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <Package size={16} />
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Registrar Prod.</span>
                </div>

                {/* Action 3: Agregar Cliente */}
                <div 
                  onClick={() => addNotification('Módulo de Clientes en desarrollo.', 'warning')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    color: '#60a5fa', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    transition: 'transform 0.2s',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <Users size={16} />
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Agregar Cliente</span>
                </div>

                {/* Action 4: Ver Reportes */}
                <div 
                  onClick={() => addNotification('Módulo de Reportes en desarrollo.', 'warning')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    color: '#fbbf24', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    transition: 'transform 0.2s',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <BarChart3 size={16} />
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ver Reportes</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
