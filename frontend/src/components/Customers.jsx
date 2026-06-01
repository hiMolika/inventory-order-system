import React, { useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function Customers({ customers, onAdd, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const openAddModal = () => {
    setFormData({ name: '', email: '', phone: '' });
    setErrors({});
    setApiError('');
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Full name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      tempErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || null
    };

    try {
      await onAdd(payload);
      setIsModalOpen(false);
    } catch (err) {
      setApiError(err.message || 'Operation failed. Check if email is already registered.');
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      onDelete(id);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Customer Directory</h2>
          <p>Register and manage customer profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add New Customer</span>
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Active Customer List</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} style={{ color: 'var(--text-light)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <h4>No Customers Registered</h4>
            <p>Try refining your search or add a customer profile to start placing orders.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600 }}>{customer.name}</td>
                    <td><a href={`mailto:${customer.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{customer.email}</a></td>
                    <td>{customer.phone || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>None</span>}</td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDelete(customer.id, customer.name)}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Register Customer</button>
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
            <label htmlFor="cust-name">Full Name</label>
            <input 
              id="cust-name"
              type="text" 
              className={`form-control ${errors.name ? 'error-field' : ''}`}
              placeholder="e.g. Alice Johnson"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="cust-email">Email Address (Unique)</label>
            <input 
              id="cust-email"
              type="email" 
              className={`form-control ${errors.email ? 'error-field' : ''}`}
              placeholder="e.g. alice@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="cust-phone">Phone Number (Optional)</label>
            <input 
              id="cust-phone"
              type="text" 
              className="form-control"
              placeholder="e.g. +1-555-0100"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
