import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Truck, Plus, Phone, Mail, MapPin, Edit2, Trash2, X } from 'lucide-react';
import ModalPortal from '../components/ModalPortal';
import { toast } from '../context/ToastContext';

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormGstin('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormContact(supplier.contact_person || '');
    setFormPhone(supplier.phone || '');
    setFormEmail(supplier.email || '');
    setFormAddress(supplier.address || '');
    setFormGstin(supplier.gstin || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Supplier name is required.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    const payload = {
      name: formName.trim(),
      contact_person: formContact.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      address: formAddress.trim(),
      gstin: formGstin.trim().toUpperCase()
    };

    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, payload);
        toast.success(`Updated supplier "${formName}"`, 'Supplier Updated');
      } else {
        await api.createSupplier(payload);
        toast.success(`Created supplier "${formName}"`, 'Supplier Created');
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      const msg = err.message || 'Failed to save supplier';
      setFormError(msg);
      toast.error(msg, 'Supplier Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete supplier "${name}"? Only suppliers without purchase entries can be deleted.`)) {
      try {
        await api.deleteSupplier(id);
        toast.success(`Deleted supplier "${name}"`, 'Supplier Removed');
        fetchSuppliers();
      } catch (err) {
        toast.error(err.message || 'Could not delete supplier', 'Delete Error');
      }
    }
  };

  const canManage = user?.role === 'Admin' || user?.role === 'Inventory Staff';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 sm:p-7 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center space-x-2 font-display">
            <Truck className="w-6 h-6 text-ember-600 dark:text-ember-400" />
            <span>Apparel Suppliers & Vendors</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Maintain mills, apparel distributors, and garment wholesale vendors.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-2.5 bg-gradient-to-r from-ember-700 to-saffron-600 hover:from-ember-800 hover:to-saffron-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-ember-600/25 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-3 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900 dark:text-white font-display">{s.name}</h3>
                  {s.contact_person && (
                    <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">Contact: {s.contact_person}</div>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-stone-400 hover:text-ember-700 dark:hover:text-ember-400 rounded-xl transition"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {user?.role === 'Admin' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 text-stone-400 hover:text-rose-500 rounded-xl transition"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Contact meta */}
              <div className="space-y-1.5 pt-3 border-t border-stone-100 dark:border-ink-800 text-xs text-stone-600 dark:text-stone-400">
                {s.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5" />
                    <span className="line-clamp-2">{s.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-ink-800 flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-ivory-100 dark:bg-ink-800 border border-stone-200 dark:border-ink-700 px-2 py-0.5 rounded-md">
                GSTIN: {s.gstin || 'UNREGISTERED'}
              </span>
              <span className="text-[11px] font-bold text-ember-700 dark:text-ember-400">
                {s.purchase_count} purchases
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-ink-800 max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-ink-800">
              <h3 className="font-bold text-sm tracking-wide text-stone-900 dark:text-white font-display">
                {editingSupplier ? 'Edit Supplier' : 'Add New Apparel Supplier'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Arvind Mills Textile Ltd."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="e.g. Sanjay Shah"
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="24AAACA1234A1Z1"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl font-mono text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="orders@supplier.com"
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Street, City, State, PIN"
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-ink-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 dark:border-ink-700 rounded-xl text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-ink-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-ember-600 hover:bg-ember-700 text-white rounded-xl font-bold shadow-md shadow-ember-600/25"
                >
                  {formLoading ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

    </div>
  );
}
