import React, { useState } from 'react';
import { Plus, Eye, Trash2, Calendar, ShoppingCart, DollarSign, User, AlertCircle, X } from 'lucide-react';
import Modal from './Modal';

export default function Orders({ orders, products, customers, onCreate, onDelete }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create Order Form State
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Handle open modals
  const openCreateModal = () => {
    setCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setFormErrors({});
    setApiError('');
    setIsCreateModalOpen(true);
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  // Add Item line to Order Wizard
  const addOrderItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  // Remove Item line from Order Wizard
  const removeOrderItemRow = (index) => {
    const list = [...orderItems];
    list.splice(index, 1);
    setOrderItems(list);
  };

  // Change Item field
  const handleItemChange = (index, field, value) => {
    const list = [...orderItems];
    if (field === 'quantity') {
      const parsedVal = parseInt(value, 10);
      list[index][field] = isNaN(parsedVal) ? '' : parsedVal;
    } else {
      list[index][field] = value;
    }
    setOrderItems(list);
  };

  // Live stock validator check
  const getProductStockWarning = (productId, requestedQty) => {
    if (!productId || !requestedQty) return null;
    const product = products.find(p => p.id === parseInt(productId, 10));
    if (!product) return null;
    if (product.quantity < requestedQty) {
      return `Warning: Only ${product.quantity} units available in stock.`;
    }
    return null;
  };

  // Live Total calculation
  const calculateLiveTotal = () => {
    return orderItems.reduce((acc, item) => {
      if (!item.product_id || !item.quantity) return acc;
      const product = products.find(p => p.id === parseInt(item.product_id, 10));
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  // Form Validation
  const validateForm = () => {
    const tempErrors = {};
    if (!customerId) tempErrors.customer = 'Please select a customer';
    
    const itemsErrors = [];
    let hasItemsError = false;

    if (orderItems.length === 0) {
      tempErrors.items = 'Order must contain at least one product';
      hasItemsError = true;
    }

    orderItems.forEach((item, index) => {
      const rowErr = {};
      if (!item.product_id) {
        rowErr.product = 'Select a product';
        hasItemsError = true;
      }
      
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        rowErr.quantity = 'Must be > 0';
        hasItemsError = true;
      } else if (item.product_id) {
        const prod = products.find(p => p.id === parseInt(item.product_id, 10));
        if (prod && prod.quantity < qty) {
          rowErr.quantity = 'Insufficient stock';
          hasItemsError = true;
        }
      }
      itemsErrors[index] = rowErr;
    });

    if (hasItemsError) {
      tempErrors.items = itemsErrors;
    }

    setFormErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      customer_id: parseInt(customerId, 10),
      items: orderItems.map(item => ({
        product_id: parseInt(item.product_id, 10),
        quantity: parseInt(item.quantity, 10)
      }))
    };

    try {
      await onCreate(payload);
      setIsCreateModalOpen(false);
    } catch (err) {
      setApiError(err.message || 'Failed to place order. Check inventory levels.');
    }
  };

  const handleCancelOrder = (id) => {
    if (window.confirm('Are you sure you want to cancel and delete this order? Inventory stock levels will be restored.')) {
      onDelete(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Sales Orders</h2>
          <p>Create and monitor sales orders, invoices, and fulfillment.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Place New Order</span>
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Order History</h3>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <h4>No Orders Found</h4>
            <p>Click "Place New Order" to start a sales transaction.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Order Date</th>
                  <th>Total Invoice</th>
                  <th>Items Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>ORD-{order.id.toString().padStart(4, '0')}</td>
                    <td>{order.customer ? order.customer.name : 'Unknown Customer'}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} style={{ color: 'var(--text-light)' }} />
                        {new Date(order.created_at).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>${order.total_amount.toFixed(2)}</td>
                    <td>
                      <span className="badge secondary">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </span>
                    </td>
                    <td>
                      <div className="actions-group">
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => openDetailsModal(order)}
                        >
                          <Eye size={12} />
                          <span>Invoice</span>
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <Trash2 size={12} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ORDER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Sales Order"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Place Order</button>
          </>
        }
      >
        {customers.length === 0 ? (
          <div className="empty-state" style={{ padding: '1rem 0' }}>
            <AlertCircle size={28} className="empty-state-icon" style={{ color: 'var(--warning)' }} />
            <h4>No Customers Registered</h4>
            <p style={{ marginBottom: '1rem' }}>You must add at least one customer to place an order.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state" style={{ padding: '1rem 0' }}>
            <AlertCircle size={28} className="empty-state-icon" style={{ color: 'var(--warning)' }} />
            <h4>No Products Available</h4>
            <p style={{ marginBottom: '1rem' }}>You must add products with stock to create an order.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {apiError && (
              <div className="alert-banner error" style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>
                <span>{apiError}</span>
              </div>
            )}

            {/* Select Customer */}
            <div className="form-group">
              <label htmlFor="order-cust">Select Customer</label>
              <select
                id="order-cust"
                className={`form-control ${formErrors.customer ? 'error-field' : ''}`}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
              {formErrors.customer && <p className="error-text">{formErrors.customer}</p>}
            </div>

            {/* Order Items Builder */}
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Products Ordered</label>
              <div className="order-items-builder">
                {orderItems.map((item, index) => {
                  const rowErr = formErrors.items && formErrors.items[index] ? formErrors.items[index] : {};
                  const stockWarn = getProductStockWarning(item.product_id, item.quantity);
                  
                  return (
                    <div key={index} style={{ marginBottom: '1rem' }}>
                      <div className="order-item-row">
                        {/* Select Product */}
                        <div>
                          <select
                            aria-label={`Select product for row ${index + 1}`}
                            className={`form-control ${rowErr.product ? 'error-field' : ''}`}
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          >
                            <option value="">-- Product --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (${p.price.toFixed(2)} - Stock: {p.quantity})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <input
                            aria-label={`Quantity for row ${index + 1}`}
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className={`form-control ${rowErr.quantity ? 'error-field' : ''}`}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </div>

                        {/* Price Subtotal Calculation */}
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', height: '100%', paddingLeft: '0.5rem' }}>
                          {(() => {
                            if (!item.product_id || !item.quantity) return '$0.00';
                            const prod = products.find(p => p.id === parseInt(item.product_id, 10));
                            return prod ? `$${(prod.price * item.quantity).toFixed(2)}` : '$0.00';
                          })()}
                        </div>

                        {/* Delete row */}
                        <button
                          aria-label={`Remove row ${index + 1}`}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem', color: 'var(--danger)' }}
                          onClick={() => removeOrderItemRow(index)}
                          disabled={orderItems.length === 1}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      {/* Sub-row Stock alerts / errors */}
                      {rowErr.product && <p className="error-text" style={{ marginTop: '-4px' }}>{rowErr.product}</p>}
                      {rowErr.quantity && <p className="error-text" style={{ marginTop: '-4px' }}>Quantity Error: {rowErr.quantity}</p>}
                      {stockWarn && !rowErr.quantity && (
                        <p className="error-text" style={{ color: 'var(--warning)', marginTop: '-4px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertCircle size={12} />
                          {stockWarn}
                        </p>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  onClick={addOrderItemRow}
                >
                  <Plus size={12} />
                  <span>Add Line Item</span>
                </button>
              </div>
            </div>

            {/* Total Indicator */}
            <div className="order-total-bar">
              <span>Grand Total:</span>
              <span style={{ color: 'var(--primary-hover)', fontSize: '1.25rem' }}>
                ${calculateLiveTotal().toFixed(2)}
              </span>
            </div>
          </form>
        )}
      </Modal>

      {/* VIEW ORDER INVOICE DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Sales Invoice"
        footer={
          <button className="btn btn-primary" onClick={() => setIsDetailsModalOpen(false)}>Close Invoice</button>
        }
      >
        {selectedOrder && (
          <div className="invoice">
            {/* Invoice Metadata */}
            <div className="invoice-section">
              <div className="invoice-grid">
                <div>
                  <p>Invoice Code</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700 }}>ORD-{selectedOrder.id.toString().padStart(4, '0')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>Issue Date</p>
                  <p>{new Date(selectedOrder.created_at).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="invoice-section">
              <h4>Customer Details</h4>
              <div className="invoice-grid">
                <div>
                  <p>Name</p>
                  <p>{selectedOrder.customer ? selectedOrder.customer.name : 'N/A'}</p>
                </div>
                <div>
                  <p>Email / Contact</p>
                  <p>{selectedOrder.customer ? selectedOrder.customer.email : 'N/A'}</p>
                  {selectedOrder.customer && selectedOrder.customer.phone && (
                    <p style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{selectedOrder.customer.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Product items list */}
            <div className="invoice-section">
              <h4>Line Items Summary</h4>
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Product Name</th>
                    <th>SKU</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.product ? item.product.name : 'Unknown Product'}</td>
                      <td><code>{item.product ? item.product.sku : 'N/A'}</code></td>
                      <td style={{ textAlign: 'right' }}>${item.product ? item.product.price.toFixed(2) : '0.00'}</td>
                      <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ${((item.product ? item.product.price : 0) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Cost */}
            <div className="invoice-total">
              <span>Invoice Total: ${selectedOrder.total_amount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
