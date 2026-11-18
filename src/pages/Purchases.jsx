import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  PackagePlus,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Eye,
  ShieldCheck,
  Boxes,
  X
} from 'lucide-react';

import ModalPortal from '../components/ModalPortal';
import { toast } from '../context/ToastContext';

export default function Purchases() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inward'); // 'inward' or 'history'
  
  const [suppliers, setSuppliers] = useState([]);
  const [variants, setVariants] = useState([]);
  
  // Inward Form State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState([
    { variant_id: '', received_qty: 20, accepted_qty: 20, damaged_qty: 0, purchase_rate: 500 }
  ]);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const loadInitialData = async () => {
    try {
      const [sList, vList] = await Promise.all([api.getSuppliers(), api.getVariants()]);
      setSuppliers(sList);
      setVariants(vList);
      if (sList.length > 0) setSelectedSupplier(sList[0].id.toString());
      if (vList.length > 0) {
        setItems([{
          variant_id: vList[0].id.toString(),
          received_qty: 20,
          accepted_qty: 20,
          damaged_qty: 0,
          purchase_rate: vList[0].purchase_price || 500
        }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getPurchases();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const addItemRow = () => {
    const firstVar = variants[0];
    setItems(prev => [
      ...prev,
      {
        variant_id: firstVar ? firstVar.id.toString() : '',
        received_qty: 10,
        accepted_qty: 10,
        damaged_qty: 0,
        purchase_rate: firstVar?.purchase_price || 500
      }
    ]);
  };

  const removeItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      const updated = { ...next[idx], [field]: value };

      if (field === 'variant_id') {
        const selected = variants.find(v => v.id.toString() === value);
        if (selected) {
          updated.purchase_rate = selected.purchase_price;
        }
      }

      if (field === 'received_qty') {
        const rQty = parseInt(value) || 0;
        updated.accepted_qty = Math.max(0, rQty - (parseInt(updated.damaged_qty) || 0));
      }

      next[idx] = updated;
      return next;
    });
  };

  const totalInwardCost = items.reduce((acc, item) => {
    const qty = (parseInt(item.accepted_qty) || 0) + (parseInt(item.damaged_qty) || 0);
    return acc + (qty * (parseFloat(item.purchase_rate) || 0));
  }, 0);

  const handleSubmitInward = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!selectedSupplier || !supplierInvoiceNo.trim() || !purchaseDate) {
      setFormError('Supplier, invoice number, and purchase date are required.');
      return;
    }

    for (const item of items) {
      if (!item.variant_id) {
        setFormError('Please select a garment variant for all rows.');
        return;
      }
      const rQty = parseInt(item.received_qty) || 0;
      const aQty = parseInt(item.accepted_qty) || 0;
      const dQty = parseInt(item.damaged_qty) || 0;

      if (rQty <= 0) {
        setFormError('Received quantity must be greater than zero.');
        return;
      }
      if (aQty + dQty !== rQty) {
        setFormError(`Row error: Accepted (${aQty}) + Damaged (${dQty}) must exactly equal Received (${rQty}).`);
        return;
      }
    }

    setFormLoading(true);

    const payload = {
      supplier_id: parseInt(selectedSupplier),
      supplier_invoice_no: supplierInvoiceNo.trim(),
      purchase_date: purchaseDate,
      notes: notes.trim(),
      items: items.map(i => ({
        variant_id: parseInt(i.variant_id),
        received_qty: parseInt(i.received_qty),
        accepted_qty: parseInt(i.accepted_qty),
        damaged_qty: parseInt(i.damaged_qty) || 0,
        purchase_rate: parseFloat(i.purchase_rate) || 0
      }))
    };

    try {
      const res = await api.createPurchase(payload);
      setSuccessMsg(`Purchase inward "${res.purchase_number}" confirmed! Stock updated.`);
      toast.success(`Inward #${res.purchase_number} recorded & inventory updated!`, 'Stock Inward Confirmed');
      setSupplierInvoiceNo('');
      setNotes('');
      loadInitialData();
    } catch (err) {
      const msg = err.message || 'Inward creation failed';
      setFormError(msg);
      toast.error(msg, 'Inward Stock Error');
    } finally {
      setFormLoading(false);
    }
  };

  const viewPurchaseDetails = async (id) => {
    try {
      const details = await api.getPurchase(id);
      setSelectedPurchase(details);
    } catch (err) {
      toast.error(err.message || 'Error fetching purchase details', 'Inward Details Error');
    }
  };

  const canInward = user?.role === 'Admin' || user?.role === 'Inventory Staff';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border border-ember-200 dark:border-ember-800/60 mb-1.5">
            <PackagePlus className="w-3 h-3 text-ember-600" />
            <span>Procurement & Inward</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Stock Inward & Purchases
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Receive incoming shipments, verify accepted vs damaged goods, and update retail inventory.
          </p>
        </div>

        <div className="flex bg-ivory-100 dark:bg-ink-800 p-1 rounded-2xl text-xs font-semibold border border-ivory-300 dark:border-ink-700">
          <button
            onClick={() => setActiveTab('inward')}
            className={`px-4 py-2 rounded-xl transition font-medium ${
              activeTab === 'inward' 
                ? 'bg-ember-600 text-white shadow-sm font-bold' 
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            New Inward Entry
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition font-medium ${
              activeTab === 'history' 
                ? 'bg-ember-600 text-white shadow-sm font-bold' 
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Purchase History
          </button>
        </div>
      </div>

      {activeTab === 'inward' ? (
        <form onSubmit={handleSubmitInward} className="space-y-6">
          
          {/* Business rule banner */}
          <div className="bg-amber-50/70 dark:bg-ink-900/80 border border-amber-200 dark:border-amber-900/50 p-4 rounded-3xl text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-stone-900 dark:text-stone-100">Quality Control Segregation</div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed mt-0.5">
                On confirmation, only <strong>Accepted Quantities</strong> will increase live retail saleable stock. Damaged or defective units are isolated into damaged inventory ledger.
              </p>
            </div>
          </div>

          {formError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-semibold">
              {formError}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Supplier & Invoice Header Card */}
          <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 space-y-4">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-ember-100 dark:bg-ember-950/80 text-ember-700 dark:text-ember-300 text-xs font-sans font-bold flex items-center justify-center">1</span>
              Supplier & Invoice Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Apparel Supplier *</label>
                <select
                  required
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.gstin || 'No GSTIN'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Supplier Invoice No. *</label>
                <input
                  type="text"
                  required
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  placeholder="e.g. ARV/INV/2026/894"
                  className="w-full px-3 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Inward Date *</label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Notes / Batch Ref</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Winter collection lot 2"
                  className="w-full px-3 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                />
              </div>
            </div>
          </div>

          {/* Received Garment Items Card */}
          <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-ember-100 dark:bg-ember-950/80 text-ember-700 dark:text-ember-300 text-xs font-sans font-bold flex items-center justify-center">2</span>
                  Inward Garments & Verification
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Record received, accepted (saleable), and damaged/rejected units.</p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3.5 py-1.5 bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 hover:bg-ember-100 border border-ember-200 dark:border-ember-800/60 rounded-xl text-xs font-bold transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Garment Line</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const rQty = parseInt(item.received_qty) || 0;
                const aQty = parseInt(item.accepted_qty) || 0;
                const dQty = parseInt(item.damaged_qty) || 0;
                const isMatch = aQty + dQty === rQty;

                return (
                  <div key={idx} className={`p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-12 gap-3 items-end transition ${
                    isMatch 
                      ? 'bg-ivory-50/70 dark:bg-ink-850 border-ivory-300/70 dark:border-ink-800' 
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                  }`}>
                    
                    <div className="col-span-2 sm:col-span-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Garment Variant *</label>
                      <select
                        value={item.variant_id}
                        onChange={(e) => updateItem(idx, 'variant_id', e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-ink-900 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                      >
                        {variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.product_name} - {v.size} / {v.colour} (SKU: {v.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Received Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.received_qty}
                        onChange={(e) => updateItem(idx, 'received_qty', e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-ink-900 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs text-center font-mono font-bold text-stone-900 dark:text-white"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Accepted (Saleable)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.accepted_qty}
                        onChange={(e) => updateItem(idx, 'accepted_qty', e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-ink-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs text-center font-mono font-bold"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">Damaged</label>
                      <input
                        type="number"
                        min="0"
                        value={item.damaged_qty}
                        onChange={(e) => updateItem(idx, 'damaged_qty', e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-ink-900 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs text-center font-mono font-bold"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        value={item.purchase_rate}
                        onChange={(e) => updateItem(idx, 'purchase_rate', e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-ink-900 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs text-right font-mono font-bold text-stone-900 dark:text-white"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-1 flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-2 text-stone-400 hover:text-rose-600 disabled:opacity-30 rounded-lg hover:bg-stone-100 dark:hover:bg-ink-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Inward Total & Submit Bar */}
            <div className="pt-4 border-t border-ivory-200 dark:border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-stone-600 dark:text-stone-400">
                Total Purchase Spend: <strong className="text-base text-stone-900 dark:text-stone-100 font-mono font-bold ml-1">₹{totalInwardCost.toLocaleString('en-IN')}</strong>
              </div>

              {canInward && (
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-3 bg-ember-600 hover:bg-ember-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 flex items-center justify-center space-x-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{formLoading ? 'Recording Inward...' : 'CONFIRM INWARD & UPDATE STOCK'}</span>
                </button>
              )}
            </div>

          </div>

        </form>
      ) : (
        /* Purchase History Tab */
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Completed Supplier Inward Records</h3>

          {historyLoading ? (
            <div className="text-center py-10 text-xs text-stone-400">Loading purchase history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-xs text-stone-400">No purchase records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">Purchase #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Supplier</th>
                    <th className="py-3 px-3">Supplier Invoice</th>
                    <th className="py-3 px-3 text-center">Accepted Units</th>
                    <th className="py-3 px-3 text-center">Damaged Units</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                    <th className="py-3 px-3">Received By</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                  {history.map((p) => (
                    <tr key={p.id} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-ember-700 dark:text-ember-400">{p.purchase_number}</td>
                      <td className="py-3 px-3 text-stone-600 dark:text-stone-400 font-mono text-[11px]">{p.purchase_date}</td>
                      <td className="py-3 px-3 font-semibold text-stone-900 dark:text-stone-100">{p.supplier_name}</td>
                      <td className="py-3 px-3 font-mono text-stone-600 dark:text-stone-400">{p.supplier_invoice_no}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">{p.total_accepted_qty} pcs</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-600">{p.total_damaged_qty} pcs</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">₹{p.total_amount?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-stone-600 dark:text-stone-400">{p.received_by_name}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => viewPurchaseDetails(p.id)}
                          className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-ember-600 dark:hover:text-ember-400 transition rounded-lg hover:bg-stone-100 dark:hover:bg-ink-800"
                          title="View Inward Items"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-mat-3 border border-ivory-300 dark:border-ink-800 max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-ivory-200 dark:border-ink-800">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Inward Entry #{selectedPurchase.purchase_number}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">Supplier: {selectedPurchase.supplier_name} | Invoice: {selectedPurchase.supplier_invoice_no}</p>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-lg">✕</button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-2.5">Garment Item</th>
                    <th className="py-2.5 px-2.5 text-center">Accepted</th>
                    <th className="py-2.5 px-2.5 text-center">Damaged</th>
                    <th className="py-2.5 px-2.5 text-right">Rate</th>
                    <th className="py-2.5 px-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                  {selectedPurchase.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-2.5 font-medium text-stone-900 dark:text-stone-100">
                        {item.product_name} ({item.size}, {item.colour})
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-emerald-700 dark:text-emerald-400 font-mono font-bold">{item.accepted_qty}</td>
                      <td className="py-2.5 px-2.5 text-center text-rose-600 font-mono font-bold">{item.damaged_qty}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">₹{item.purchase_rate}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-stone-900 dark:text-stone-100">₹{item.total_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-ivory-200 dark:border-ink-800 flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-600 dark:text-stone-400">Total Purchase Value:</span>
              <span className="text-base font-mono font-bold text-stone-900 dark:text-stone-100">₹{selectedPurchase.total_amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

    </div>
  );
}
