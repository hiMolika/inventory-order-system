import React from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle 
} from 'lucide-react';

export default function Dashboard({ summary, setActiveTab, onQuickRestock }) {
  const { total_products = 0, total_customers = 0, total_orders = 0, low_stock_products = [] } = summary || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Dashboard Overview</h2>
          <p>Real-time analytics and inventory stock status.</p>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="summary-grid">
        <div className="summary-card" onClick={() => setActiveTab('products')} style={{ cursor: 'pointer' }}>
          <div className="card-info">
            <h3>Total Products</h3>
            <p>{total_products}</p>
          </div>
          <div className="card-icon teal">
            <Package size={24} />
          </div>
        </div>

        <div className="summary-card" onClick={() => setActiveTab('customers')} style={{ cursor: 'pointer' }}>
          <div className="card-info">
            <h3>Total Customers</h3>
            <p>{total_customers}</p>
          </div>
          <div className="card-icon blue">
            <Users size={24} />
          </div>
        </div>

        <div className="summary-card" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
          <div className="card-info">
            <h3>Total Orders</h3>
            <p>{total_orders}</p>
          </div>
          <div className="card-icon indigo">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="summary-card">
          <div className="card-info">
            <h3>Low Stock Alerts</h3>
            <p>{low_stock_products.length}</p>
          </div>
          <div className="card-icon amber">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      <div className="panel">
        <div className="panel-header">
          <h3>Critical Stock Status</h3>
          <span className="badge warning">Needs Attention</span>
        </div>
        
        {low_stock_products.length === 0 ? (
          <div className="empty-state">
            <h4>All Stocks Normal</h4>
            <p>Every product inventory level is above the low-stock threshold.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th>Quantity in Stock</th>
                  <th>Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {low_stock_products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td><code>{product.sku}</code></td>
                    <td>
                      <span style={{ 
                        color: product.quantity === 0 ? 'var(--danger)' : 'var(--warning)', 
                        fontWeight: 'bold' 
                      }}>
                        {product.quantity} units
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.quantity === 0 ? 'danger' : 'warning'}`}>
                        {product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onQuickRestock(product)}
                      >
                        Restock Inventory
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
