import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { toast } from '../context/ToastContext';
import { Settings as SettingsIcon, Save, Store, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { storeSettings, updateSettings } = useStore();
  const [settings, setSettings] = useState({
    store_name: '',
    tagline: '',
    address_line1: '',
    city_state_zip: '',
    phone: '',
    email: '',
    gstin: '',
    receipt_footer: '',
    currency_symbol: '₹',
    reorder_threshold: '5',
    ...storeSettings
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (storeSettings && Object.keys(storeSettings).length > 0) {
      setSettings(prev => ({ ...prev, ...storeSettings }));
    }
  }, [storeSettings]);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateSettings(settings);
      setSuccess(true);
      toast.success('Store configuration & tax info saved', 'Settings Updated');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Could not update settings', 'Settings Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border border-ember-200 dark:border-ember-800/60 mb-1.5">
          <SettingsIcon className="w-3 h-3 text-ember-600" />
          <span>Store Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Store & POS Settings
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Configure retail store profile, GSTIN tax registration, invoice header, and thermal receipt footer policy.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Store settings saved successfully! All newly printed receipts and invoices will reflect these details.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-6 transition-colors">
        
        {/* Store Profile */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 border-b border-ivory-200 dark:border-ink-800 pb-2.5 flex items-center space-x-2">
            <Store className="w-4 h-4 text-ember-600" />
            <span>Store Identity & Header</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Store / Outlet Name *</label>
              <input
                type="text"
                required
                value={settings.store_name}
                onChange={(e) => handleChange('store_name', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Store Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Address Line 1</label>
              <input
                type="text"
                value={settings.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">City, State & PIN</label>
              <input
                type="text"
                value={settings.city_state_zip}
                onChange={(e) => handleChange('city_state_zip', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>
          </div>
        </div>

        {/* Statutory & Tax Registration */}
        <div className="space-y-4 pt-4 border-t border-ivory-200 dark:border-ink-800">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 border-b border-ivory-200 dark:border-ink-800 pb-2.5">
            GST & Contact Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Store GSTIN *</label>
              <input
                type="text"
                required
                value={settings.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Support Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>
          </div>
        </div>

        {/* Receipt Policy & Footer Note */}
        <div className="space-y-4 pt-4 border-t border-ivory-200 dark:border-ink-800 text-xs">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 border-b border-ivory-200 dark:border-ink-800 pb-2.5">
            Thermal Receipt Policy & Footer
          </h3>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Receipt Footer Return & Exchange Policy Note</label>
            <textarea
              rows={3}
              value={settings.receipt_footer}
              onChange={(e) => handleChange('receipt_footer', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl leading-relaxed text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-ivory-200 dark:border-ink-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-ember-600 hover:bg-ember-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 flex items-center space-x-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
