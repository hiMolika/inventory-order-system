import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import { api } from './api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });
  
  // App-wide Alerts
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Trigger alert helper
  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    // Auto-dismiss alert after 6 seconds
    setTimeout(() => {
      setAlert(prev => prev && prev.message === message ? null : prev);
    }, 6000);
  };

  // Load all data from API
  const refreshData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const [prodData, custData, ordData, sumData] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getOrders(),
        api.getDashboard()
      ]);
      setProducts(prodData);
      setCustomers(custData);
      setOrders(ordData);
      setSummary(sumData);
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert(err.message || 'Failed to fetch data from backend service.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData(true);
  }, []);

  // Database Seed Action
  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedData();
      showAlert(res.message, 'success');
      await refreshData();
    } catch (err) {
      showAlert(err.message || 'Seeding failed.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // --- Product Operations ---
  const handleAddProduct = async (productPayload) => {
    const newProduct = await api.createProduct(productPayload);
    showAlert(`Product "${newProduct.name}" created successfully.`, 'success');
    await refreshData();
  };

  const handleUpdateProduct = async (id, productPayload) => {
    const updated = await api.updateProduct(id, productPayload);
    showAlert(`Product "${updated.name}" updated successfully.`, 'success');
    await refreshData();
  };

  const handleDeleteProduct = async (id) => {
    try {
      const deleted = await api.deleteProduct(id);
      showAlert(`Product "${deleted.name}" deleted successfully.`, 'success');
      await refreshData();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const handleQuickRestock = async (product) => {
    try {
      // Increase product quantity by 50 units
      const newQuantity = product.quantity + 50;
      await api.updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: newQuantity
      });
      showAlert(`Restocked 50 units for "${product.name}". New Stock: ${newQuantity}.`, 'success');
      await refreshData();
    } catch (err) {
      showAlert(err.message || 'Restock action failed.', 'error');
    }
  };

  // --- Customer Operations ---
  const handleAddCustomer = async (customerPayload) => {
    const newCustomer = await api.createCustomer(customerPayload);
    showAlert(`Customer "${newCustomer.name}" registered successfully.`, 'success');
    await refreshData();
  };

  const handleDeleteCustomer = async (id) => {
    try {
      const deleted = await api.deleteCustomer(id);
      showAlert(`Customer "${deleted.name}" deleted successfully.`, 'success');
      await refreshData();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // --- Order Operations ---
  const handleCreateOrder = async (orderPayload) => {
    const newOrder = await api.createOrder(orderPayload);
    showAlert(`Order ORD-${newOrder.id.toString().padStart(4, '0')} placed successfully. Stock levels updated.`, 'success');
    await refreshData();
  };

  const handleDeleteOrder = async (id) => {
    try {
      await api.deleteOrder(id);
      showAlert('Order cancelled successfully. Stock levels restored.', 'success');
      await refreshData();
    } catch (err) {
      showAlert(err.message || 'Failed to cancel order.', 'error');
    }
  };

  // Show database empty seed option if there are no products and no customers
  const showSeedOption = products.length === 0 && customers.length === 0;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        color: 'var(--text-light)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          border: '4px solid var(--border-color)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span>Connecting to Inventory Service...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      alert={alert}
      setAlert={setAlert}
      onSeed={handleSeed}
      isSeeding={isSeeding}
      showSeedOption={showSeedOption}
    >
      {activeTab === 'dashboard' && (
        <Dashboard 
          summary={summary} 
          setActiveTab={setActiveTab} 
          onQuickRestock={handleQuickRestock}
        />
      )}
      
      {activeTab === 'products' && (
        <Products 
          products={products}
          onAdd={handleAddProduct}
          onUpdate={handleUpdateProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {activeTab === 'customers' && (
        <Customers 
          customers={customers}
          onAdd={handleAddCustomer}
          onDelete={handleDeleteCustomer}
        />
      )}

      {activeTab === 'orders' && (
        <Orders 
          orders={orders}
          products={products}
          customers={customers}
          onCreate={handleCreateOrder}
          onDelete={handleDeleteOrder}
        />
      )}
    </Layout>
  );
}
