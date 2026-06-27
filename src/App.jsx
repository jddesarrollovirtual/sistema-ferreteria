import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SuppliersCategories from './components/SuppliersCategories';
import SalesHistory from './components/SalesHistory';
import { LayoutDashboard, ShoppingCart, Package, Users, History, Bell } from 'lucide-react';

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
        <div className="brand-section">
          <div className="brand-icon">
            <Package size={28} />
          </div>
          <span className="brand-name">FerreSantiago</span>
        </div>

        <nav className="nav-links">
          <li className="nav-item">
            <button
              className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-button ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <ShoppingCart size={20} />
              <span>Punto de Venta</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Package size={20} />
              <span>Inventario</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-button ${activeTab === 'suppliers' ? 'active' : ''}`}
              onClick={() => setActiveTab('suppliers')}
            >
              <Users size={20} />
              <span>Proveedores</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={20} />
              <span>Historial Ventas</span>
            </button>
          </li>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">AD</div>
            <div className="user-details">
              <span className="user-name">Admin General</span>
              <span className="user-role">Ferretería Santiago</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Render Active View */}
        {renderContent()}
      </main>

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
