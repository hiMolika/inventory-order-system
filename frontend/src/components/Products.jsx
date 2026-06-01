import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function Products({ products, onAdd, onUpdate, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', quantity: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Handle open modal
  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', sku: '', price: '', quantity: '0' });
    setErrors({});
    setApiError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity: product.quantity.toString()
    });
    setErrors({});
    setApiError('');
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Product name is required';
    if (!formData.sku.trim()) tempErrors.sku = 'SKU / Code is required';
    
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      tempErrors.price = 'Price must be a valid number greater than 0';
    }
    
    const qtyNum = parseInt(formData.quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      tempErrors.quantity = 'Stock quantity must be a non-negative integer';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity, 10)
    };

    try {
      if (modalMode === 'add') {
        await onAdd(payload);
      } else {
        await onUpdate(selectedProduct.id, payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      setApiError(err.message || 'Operation failed. Check if SKU is unique.');
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      onDelete(id);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Product Inventory</h2>
          <p>Create, update, and manage your products catalog.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Catalog List</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} style={{ color: 'var(--text-light)' }} />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <h4>No Products Found</h4>
            <p>Try refining your search or add a new product to start tracking stock.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th>Price</th>
                  <th>Stock Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td><code>{product.sku}</code></td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.quantity} units</td>
                    <td>
                      {product.quantity === 0 ? (
                        <span className="badge danger">Out of Stock</span>
                      ) : product.quantity < 10 ? (
                        <span className="badge warning">Low Stock</span>
                      ) : (
                        <span className="badge success">In Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="actions-group">
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => openEditModal(product)}
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
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

      {/* Product Form Modal (Add / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add New Product' : 'Edit Product Details'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {apiError && (
            <div className="alert-banner error" style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>
              <span>{apiError}</span>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="prod-name">Product Name</label>
            <input 
              id="prod-name"
              type="text" 
              className={`form-control ${errors.name ? 'error-field' : ''}`}
              placeholder="e.g. Mechanical Keyboard"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="prod-sku">SKU / Code (Unique)</label>
            <input 
              id="prod-sku"
              type="text" 
              className={`form-control ${errors.sku ? 'error-field' : ''}`}
              placeholder="e.g. KEY-002"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
            {errors.sku && <p className="error-text">{errors.sku}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="prod-price">Price ($)</label>
              <input 
                id="prod-price"
                type="number" 
                step="0.01"
                min="0"
                className={`form-control ${errors.price ? 'error-field' : ''}`}
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              {errors.price && <p className="error-text">{errors.price}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="prod-qty">Initial Stock Quantity</label>
              <input 
                id="prod-qty"
                type="number" 
                min="0"
                className={`form-control ${errors.quantity ? 'error-field' : ''}`}
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              {errors.quantity && <p className="error-text">{errors.quantity}</p>}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
