import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  History,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  RefreshCw,
  X,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

import ModalPortal from '../components/ModalPortal';
import { toast } from '../context/ToastContext';

export default function Inventory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'ledger'
  
  // Stock list state
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [damagedOnlyFilter, setDamagedOnlyFilter] = useState(false);

  // Stock Ledger state
  const [ledgerLogs, setLedgerLogs] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerFilterType, setLedgerFilterType] = useState('');

  // Manual Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustStockType, setAdjustStockType] = useState('saleable');
  const [adjustNewQty, setAdjustNewQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Physical Stock Count Audit');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    try {
      let params = '?';
      if (search) params += `search=${encodeURIComponent(search)}&`;
      if (lowStockFilter) params += `low_stock=true&`;
      if (damagedOnlyFilter) params += `damaged_only=true&`;

      const data = await api.getInventory(params);
      setStockList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    setLedgerLoading(true);
    try {
      let params = '?';
      if (ledgerFilterType) params += `transaction_type=${ledgerFilterType}&`;
      const data = await api.getLedger(params);
      setLedgerLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') {
      fetchStock();
    } else {
      fetchLedger();
    }
  }, [activeTab, lowStockFilter, damagedOnlyFilter, ledgerFilterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStock();
  };

  const openAdjustModal = (item) => {
    setAdjustTarget(item);
    setAdjustStockType('saleable');
    setAdjustNewQty(item.saleable_stock.toString());
    setAdjustReason('Physical Stock Count Audit');
    setAdjustNotes('');
    setAdjustError('');
    setAdjustModalOpen(true);
  };

  const handleExecuteAdjust = async (e) => {
    e.preventDefault();
    if (adjustNewQty === '') {
      setAdjustError('Please specify the new target quantity.');
      return;
    }

    setAdjustLoading(true);
    setAdjustError('');

    try {
      await api.adjustStock({
        variant_id: adjustTarget.variant_id,
        stock_type: adjustStockType,
        new_quantity: parseInt(adjustNewQty),
        reason: adjustReason,
        notes: adjustNotes
      });
      toast.success(
        `Adjusted ${adjustTarget.product_name} (${adjustStockType}) to ${adjustNewQty} pcs`,
        'Stock Adjusted'
      );
      setAdjustModalOpen(false);
      fetchStock();
    } catch (err) {
      const msg = err.message || 'Stock adjustment failed';
      setAdjustError(msg);
      toast.error(msg, 'Adjustment Error');
    } finally {
      setAdjustLoading(false);
    }
  };

  const canAdjust = user?.role === 'Admin' || user?.role === 'Store Manager';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border border-ember-200 dark:border-ember-800/60 mb-1.5">
            <Boxes className="w-3 h-3 text-ember-600" />
            <span>Warehouse & Floor Stock</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Garment Inventory & Ledger
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time stock balance tracking, low stock notifications, isolated damaged stock, and complete audit trail.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-ivory-100 dark:bg-ink-800 p-1 rounded-2xl text-xs font-semibold border border-ivory-300 dark:border-ink-700">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-xl transition font-medium ${
              activeTab === 'stock'
                ? 'bg-ember-600 text-white shadow-sm font-bold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Live Stock Balances
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl transition font-medium ${
              activeTab === 'ledger'
                ? 'bg-ember-600 text-white shadow-sm font-bold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Stock Audit Ledger
          </button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white dark:bg-ink-900 p-4 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search garment, SKU, Barcode, colour..."
                className="w-full pl-10 pr-3 py-2 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <label className="flex items-center space-x-2 cursor-pointer text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                <input
                  type="checkbox"
                  checked={lowStockFilter}
                  onChange={(e) => setLowStockFilter(e.target.checked)}
                  className="w-4 h-4 rounded text-ember-600 focus:ring-ember-500 accent-ember-600"
                />
                <span>Low Stock Only</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                <input
                  type="checkbox"
                  checked={damagedOnlyFilter}
                  onChange={(e) => setDamagedOnlyFilter(e.target.checked)}
                  className="w-4 h-4 rounded text-ember-600 focus:ring-ember-500 accent-ember-600"
                />
                <span>Damaged Goods Only</span>
              </label>

              <button
                onClick={fetchStock}
                className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white bg-ivory-100 dark:bg-ink-800 hover:bg-ivory-200 dark:hover:bg-ink-700 border border-ivory-300/80 dark:border-ink-700 rounded-xl transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 overflow-hidden transition-colors">
            {loading ? (
              <div className="p-16 text-center text-stone-400 text-xs">Loading inventory stock...</div>
            ) : stockList.length === 0 ? (
              <div className="p-16 text-center text-stone-400 text-xs">No garments match the selected filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                      <th className="py-3 px-4">Garment / Brand</th>
                      <th className="py-3 px-3">Size & Colour</th>
                      <th className="py-3 px-3 font-mono">SKU / Barcode</th>
                      <th className="py-3 px-3 text-right">Selling Price</th>
                      <th className="py-3 px-3 text-center">Saleable Stock</th>
                      <th className="py-3 px-3 text-center">Damaged Stock</th>
                      <th className="py-3 px-3 text-center">Reorder Threshold</th>
                      <th className="py-3 px-3 text-center">Stock Status</th>
                      {canAdjust && <th className="py-3 px-4 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                    {stockList.map((item) => (
                      <tr key={item.variant_id} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900 dark:text-stone-100">{item.product_name}</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">{item.category_name} • {item.brand_name}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-ivory-100 dark:bg-ink-800 text-stone-800 dark:text-stone-200 font-bold text-[10px] border border-ivory-300/80 dark:border-ink-700">
                              {item.size}
                            </span>
                            <span className="text-stone-600 dark:text-stone-300 font-medium">{item.colour}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                          <div className="font-semibold text-stone-900 dark:text-stone-100">{item.sku}</div>
                          <div className="text-[10px] text-stone-400 dark:text-stone-500">{item.barcode}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">
                          ₹{item.selling_price}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                            item.saleable_stock <= 0 
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40' 
                              : item.saleable_stock <= item.reorder_level 
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40' 
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                          }`}>
                            {item.saleable_stock} pcs
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`font-mono font-bold ${item.damaged_stock > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-stone-400 dark:text-stone-600'}`}>
                            {item.damaged_stock} pcs
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-stone-500 dark:text-stone-400 font-mono">
                          {item.reorder_level}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {item.stock_status === 'OUT_OF_STOCK' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                              Out of Stock
                            </span>
                          ) : item.stock_status === 'LOW_STOCK' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                              Available
                            </span>
                          )}
                        </td>
                        {canAdjust && (
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openAdjustModal(item)}
                              className="px-3 py-1.5 text-stone-700 dark:text-stone-300 hover:text-ember-700 dark:hover:text-ember-300 hover:bg-ember-50 dark:hover:bg-ember-950/40 rounded-xl text-xs font-semibold border border-ivory-300 dark:border-ink-700 transition"
                              title="Manual Stock Adjustment"
                            >
                              Adjust
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Stock Ledger / Audit History Tab */
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ivory-200 dark:border-ink-800 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <History className="w-4 h-4 text-ember-600" />
                <span>Complete Stock Movement Audit Ledger</span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Every inward, sale, return, and manager adjustment is recorded with user & timestamp.
              </p>
            </div>

            <select
              value={ledgerFilterType}
              onChange={(e) => setLedgerFilterType(e.target.value)}
              className="px-3 py-1.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-ember-500"
            >
              <option value="">All Transaction Types</option>
              <option value="POS_SALE">POS Sales</option>
              <option value="PURCHASE_INWARD">Purchase Inwards</option>
              <option value="CUSTOMER_RETURN_SALEABLE">Returns (Saleable)</option>
              <option value="CUSTOMER_RETURN_DAMAGED">Returns (Damaged)</option>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustments</option>
              <option value="SALE_CANCELLED">Cancelled Bills</option>
            </select>
          </div>

          {ledgerLoading ? (
            <div className="p-16 text-center text-stone-400 text-xs">Loading ledger entries...</div>
          ) : ledgerLogs.length === 0 ? (
            <div className="p-16 text-center text-stone-400 text-xs">No ledger records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Garment Item</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reference #</th>
                    <th className="py-2.5 px-3 text-center">Stock Change</th>
                    <th className="py-2.5 px-3 text-center">Before &rarr; After</th>
                    <th className="py-2.5 px-3">Performed By</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                  {ledgerLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                      <td className="py-2.5 px-3 text-stone-500 dark:text-stone-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-stone-900 dark:text-stone-100">{log.product_name}</div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-500">{log.size} • {log.colour}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ivory-100 dark:bg-ink-800 text-stone-700 dark:text-stone-300 border border-ivory-300/70 dark:border-ink-700">
                          {log.transaction_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-600 dark:text-stone-400">{log.reference_id}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={log.quantity_change > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}>
                          {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-stone-600 dark:text-stone-400">
                        {log.stock_before} &rarr; <strong className="text-stone-900 dark:text-stone-100">{log.stock_after}</strong>
                      </td>
                      <td className="py-2.5 px-3 text-stone-700 dark:text-stone-300">
                        <div className="font-semibold text-stone-900 dark:text-stone-100">{log.performed_by_name}</div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-500">{log.performed_by_role}</div>
                      </td>
                      <td className="py-2.5 px-3 text-stone-500 dark:text-stone-400 max-w-xs truncate">{log.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustModalOpen && adjustTarget && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-mat-3 border border-ivory-300 dark:border-ink-800 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-ivory-200 dark:border-ink-800">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Manual Stock Adjustment</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">{adjustTarget.product_name} ({adjustTarget.size}, {adjustTarget.colour})</p>
              </div>
              <button 
                onClick={() => setAdjustModalOpen(false)} 
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-400 rounded-xl">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleExecuteAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Target Stock Bucket</label>
                <select
                  value={adjustStockType}
                  onChange={(e) => {
                    setAdjustStockType(e.target.value);
                    setAdjustNewQty(e.target.value === 'saleable' ? adjustTarget.saleable_stock.toString() : adjustTarget.damaged_stock.toString());
                  }}
                  className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                >
                  <option value="saleable">Saleable Inventory (Current: {adjustTarget.saleable_stock})</option>
                  <option value="damaged">Damaged / Defective Stock (Current: {adjustTarget.damaged_stock})</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">New Verified Physical Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustNewQty}
                  onChange={(e) => setAdjustNewQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl font-mono font-bold text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Reason for Adjustment *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                >
                  <option value="Physical Stock Count Audit">Physical Stock Count Audit</option>
                  <option value="Damaged / Defective Write-off">Damaged / Defective Write-off</option>
                  <option value="Theft / Store Shrinkage">Theft / Store Shrinkage</option>
                  <option value="Supplier Replacement">Supplier Replacement</option>
                  <option value="Data Entry Correction">Data Entry Correction</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Auditor Notes</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Discrepancy found during monthly shelf audit."
                  className="w-full px-3.5 py-2 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-ivory-200 dark:border-ink-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2.5 border border-ivory-300 dark:border-ink-700 rounded-xl text-stone-700 dark:text-stone-300 font-semibold hover:bg-stone-100 dark:hover:bg-ink-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white rounded-xl font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 transition disabled:opacity-50"
                >
                  {adjustLoading ? 'Updating...' : 'Save Stock Adjustment'}
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
