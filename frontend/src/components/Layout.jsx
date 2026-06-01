import React from 'react';
import { 
  LayoutGrid, 
  Package, 
  Users, 
  ShoppingCart, 
  Database,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function Layout({ 
  activeTab, 
  setActiveTab, 
  alert, 
  setAlert, 
  onSeed, 
  isSeeding, 
  showSeedOption,
  children 
}) {
  return (
    <div className="layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <Database size={24} color="#0d9488" />
          <h1>StockOrder</h1>
        </div>
        
        <nav className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutGrid size={18} />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            <span>Products</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={18} />
            <span>Customers</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart size={18} />
            <span>Orders</span>
          </button>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        {/* Global Notifications/Alert Banner */}
        {alert && (
          <div className={`alert-banner ${alert.type}`}>
            {alert.type === 'success' && <CheckCircle size={18} />}
            {alert.type === 'error' && <XCircle size={18} />}
            {alert.type === 'warning' && <AlertTriangle size={18} />}
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{alert.message}</span>
            <button className="alert-close" onClick={() => setAlert(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Database Seeding Quick Option (Only shown when DB appears empty) */}
        {showSeedOption && activeTab === 'dashboard' && (
          <div className="seed-box">
            <div className="seed-info">
              <h4>Database is Empty</h4>
              <p>Get started instantly by seeding sample products, customers, and orders.</p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={onSeed} 
              disabled={isSeeding}
            >
              <Database size={16} />
              {isSeeding ? 'Seeding...' : 'Seed Sample Data'}
            </button>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
