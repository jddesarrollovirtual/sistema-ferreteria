import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SuppliersCategories from './components/SuppliersCategories';
import SalesHistory from './components/SalesHistory';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  History, 
  Bell, 
  Box as BoxIcon, 
  Tags, 
  Truck, 
  Settings, 
  BarChart3, 
  ChevronDown, 
  Search, 
  Calendar, 
  Menu, 
  Plus 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove notification after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'pos':
        return <POS addNotification={addNotification} />;
      case 'inventory':
        return <Inventory addNotification={addNotification} />;
      case 'suppliers':
        return <SuppliersCategories addNotification={addNotification} />;
      case 'history':
        return <SalesHistory addNotification={addNotification} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Panel de Control';
      case 'pos':
        return 'Punto de Venta (POS)';
      case 'inventory':
        return 'Inventario';
      case 'suppliers':
        return 'Proveedores y Categorías';
      case 'history':
        return 'Historial de Transacciones';
      default:
        return 'Panel de Control';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Resumen general del estado de la ferretería';
      case 'pos':
        return 'Registre ventas y emita comprobantes en tiempo real';
      case 'inventory':
        return 'Gestión completa de stock, precios y códigos de barras';
      case 'suppliers':
        return 'Administre familias de productos e información de distribuidores';
      case 'history':
        return 'Auditoría de boletas y exportación de comprobantes';
      default:
        return '';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section" style={{ marginBottom: '1.5rem', gap: '0.75rem' }}>
          <div className="brand-icon" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', width: '38px', height: '38px', padding: 0 }}>
            {/* Outline Shop Icon with Gear (SVG) */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}>
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <circle cx="12" cy="13" r="3"/>
              <path d="M12 10v1"/>
              <path d="M12 15v1"/>
              <path d="M10 13h1"/>
              <path d="M13 13h1"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="brand-name" style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.15 }}>FerreSantiago</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>Sistema de Ferretería</span>
          </div>
        </div>

        <nav className="nav-links" style={{ gap: '0.22rem', overflowY: 'auto' }}>
          <li className="nav-item">
            <button className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} style={{ padding: '0.65rem 0.8rem' }}>
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-button ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')} style={{ padding: '0.65rem 0.8rem' }}>
              <ShoppingCart size={17} />
              <span>Punto de Venta</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')} style={{ padding: '0.65rem 0.8rem' }}>
              <Package size={17} />
              <span>Inventario</span>
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-button" onClick={() => { setActiveTab('inventory'); addNotification('Redirigido a Inventario (Productos)', 'success'); }} style={{ padding: '0.65rem 0.8rem' }}>
              <BoxIcon size={17} />
              <span>Productos</span>
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-button" onClick={() => { setActiveTab('suppliers'); addNotification('Redirigido a Proveedores y Categorías', 'success'); }} style={{ padding: '0.65rem 0.8rem' }}>
              <Tags size={17} />
              <span>Categorías</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-button ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')} style={{ padding: '0.65rem 0.8rem' }}>
              <Truck size={17} />
              <span>Proveedores</span>
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-button" onClick={() => addNotification('Módulo de Clientes en desarrollo.', 'warning')} style={{ padding: '0.65rem 0.8rem' }}>
              <Users size={17} />
              <span>Clientes</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} style={{ padding: '0.65rem 0.8rem' }}>
              <History size={17} />
              <span>Historial de Ventas</span>
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-button" onClick={() => addNotification('Módulo de Reportes en desarrollo.', 'warning')} style={{ padding: '0.65rem 0.8rem' }}>
              <BarChart3 size={17} />
              <span>Reportes</span>
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-button" onClick={() => addNotification('Módulo de Configuración en desarrollo.', 'warning')} style={{ padding: '0.65rem 0.8rem' }}>
              <Settings size={17} />
              <span>Configuración</span>
            </button>
          </li>
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.9rem', marginTop: '0.75rem' }}>
          <div className="user-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="user-avatar" style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                AD
              </div>
              <div className="user-details" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="user-name" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Admin General</span>
                <span className="user-role" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Administrador</span>
              </div>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }} />
          </div>
        </div>
      </aside>

      {/* Main Container wrapping Header & Page View */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100vh', overflow: 'hidden' }}>
        
        {/* Top Header Bar */}
        <header style={{ 
          height: '56px', 
          borderBottom: '1px solid var(--border-color)', 
          background: 'rgba(6, 9, 19, 0.4)', 
          backdropFilter: 'var(--glass-backdrop)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          flexShrink: 0,
          zIndex: 90
        }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexGrow: 1, maxWidth: '420px' }}>
            <Menu size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar productos, clientes, ventas..."
                style={{ 
                  paddingLeft: '2.1rem', 
                  paddingRight: '3.2rem', 
                  height: '34px', 
                  fontSize: '0.78rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '8px'
                }} 
              />
              <span style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                fontSize: '0.65rem', 
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.04)',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>Ctrl + K</span>
            </div>
          </div>
          
          {/* Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.04)',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}>
              <Calendar size={13} />
              <span>27 Jun 2026</span>
              <ChevronDown size={11} />
            </div>
            
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.04)',
                padding: '0.45rem',
                borderRadius: '8px',
                color: 'var(--text-secondary)'
              }}>
                <Bell size={16} />
              </div>
              <span style={{ 
                position: 'absolute', 
                top: '-3px', 
                right: '-3px', 
                background: '#a855f7', 
                color: 'white', 
                fontSize: '0.6rem', 
                fontWeight: 800,
                width: '14px', 
                height: '14px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>3</span>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('pos')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                padding: '0.45rem 0.85rem', 
                fontSize: '0.78rem', 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                border: 'none',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
              }}
            >
              <Plus size={14} />
              <span>Nueva Venta</span>
            </button>
          </div>
        </header>

        {/* Render Active View in Main Content Area */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>

      {/* Toast Notification Container */}
      <div className="notifications-container">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            className="toast-notification"
            style={{
              borderLeftColor: 
                n.type === 'danger' ? 'var(--danger)' : 
                n.type === 'warning' ? 'var(--warning)' : 
                'var(--success)'
            }}
          >
            <Bell size={18} style={{ color: n.type === 'danger' ? 'var(--danger)' : n.type === 'warning' ? 'var(--warning)' : 'var(--success)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
