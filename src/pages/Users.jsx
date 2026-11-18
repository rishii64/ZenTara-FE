import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, Plus, ShieldCheck, CheckCircle2, XCircle, Edit2, Key, UserCheck, X, Eye, EyeOff } from 'lucide-react';
import ModalPortal from '../components/ModalPortal';
import { toast } from '../context/ToastContext';

export default function Users() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState('Cashier');
  const [formStatus, setFormStatus] = useState('active');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsersList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPassword('');
    setShowPassword(false);
    setFormFullName('');
    setFormRole('Cashier');
    setFormStatus('active');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormPassword('');
    setShowPassword(false);
    setFormFullName(u.full_name);
    setFormRole(u.role);
    setFormStatus(u.status);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!editingUser && (!formUsername.trim() || !formPassword.trim())) {
      setFormError('Username and password are required.');
      return;
    }

    setFormLoading(true);

    try {
      if (editingUser) {
        const payload = {
          full_name: formFullName.trim(),
          role: formRole,
          status: formStatus
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }
        await api.updateUser(editingUser.id, payload);
        toast.success(`Updated staff account "${formFullName}"`, 'Account Updated');
      } else {
        await api.createUser({
          username: formUsername.trim(),
          password: formPassword.trim(),
          full_name: formFullName.trim(),
          role: formRole
        });
        toast.success(`Created staff account "${formFullName}" (${formRole})`, 'Account Created');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err.message || 'Operation failed';
      setFormError(msg);
      toast.error(msg, 'Staff Management Error');
    } finally {
      setFormLoading(false);
    }
  };

  const roleColors = {
    'Admin': 'bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border-ember-200 dark:border-ember-800/60',
    'Store Manager': 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    'Inventory Staff': 'bg-stone-100 dark:bg-ink-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-ink-700',
    'Cashier': 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border border-ember-200 dark:border-ember-800/60 mb-1.5">
            <UsersIcon className="w-3 h-3 text-ember-600" />
            <span>Store Access & Permissions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            User Management & RBAC
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Create user accounts and assign Role-Based Access for Admin, Store Manager, Inventory Staff, and Cashier.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white rounded-2xl text-xs font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 flex items-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-16 text-center text-stone-400 text-xs">Loading staff accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Username</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Role Permissions</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Created Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">{u.full_name}</td>
                    <td className="py-3.5 px-3 font-mono text-stone-700 dark:text-stone-300 font-semibold">{u.username}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleColors[u.role] || 'bg-stone-100 text-stone-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-stone-500 dark:text-stone-400 text-[11px]">
                      {u.role === 'Admin' && 'Full Access; User Management & Configuration'}
                      {u.role === 'Store Manager' && 'Dashboard, Reports, Returns & Discount Approvals'}
                      {u.role === 'Inventory Staff' && 'Products, Categories, Suppliers & Stock Inward'}
                      {u.role === 'Cashier' && 'POS Billing, Payments, Receipt Print & Returns'}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-stone-500 dark:text-stone-400 font-mono text-[11px]">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-ember-600 dark:hover:text-ember-400 hover:bg-stone-100 dark:hover:bg-ink-800 rounded-lg transition"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {modalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-mat-3 border border-ivory-300 dark:border-ink-800 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-ivory-200 dark:border-ink-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {editingUser ? `Edit Staff Account: ${editingUser.username}` : 'Create New Staff Account'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-400 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Username *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. cashier2"
                    className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl font-mono font-semibold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  {editingUser ? 'Reset Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl font-mono text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition focus:outline-none cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Role & Permissions *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                >
                  <option value="Cashier">Cashier (POS Billing & Standard Returns)</option>
                  <option value="Inventory Staff">Inventory Staff (Products, Suppliers & Stock Inward)</option>
                  <option value="Store Manager">Store Manager (Reports, Approvals & Stock Audit)</option>
                  <option value="Admin">Admin (Full Access & User Management)</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl font-semibold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (Deactivated)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-ivory-200 dark:border-ink-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-700 dark:text-stone-300 font-semibold hover:bg-stone-100 dark:hover:bg-ink-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white rounded-xl font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 transition disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
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
