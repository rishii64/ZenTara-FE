import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Search,
  Eye,
  Printer,
  Ban,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import ThermalReceipt from '../components/ThermalReceipt';
import ModalPortal from '../components/ModalPortal';
import { toast } from '../context/ToastContext';

export default function SalesHistory() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Selected Invoice for Thermal Receipt
  const [selectedSaleData, setSelectedSaleData] = useState(null);
  
  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetSale, setCancelTargetSale] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    setError('');
    try {
      let params = '?';
      if (search) params += `search=${encodeURIComponent(search)}&`;
      if (status) params += `status=${status}&`;
      if (fromDate) params += `from_date=${fromDate}&`;
      if (toDate) params += `to_date=${toDate}&`;
      
      const data = await api.getSales(params);
      setSales(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [status, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSales();
  };

  const handleViewInvoice = async (id) => {
    try {
      const data = await api.getSale(id);
      setSelectedSaleData(data);
    } catch (err) {
      toast.error('Error fetching invoice: ' + err.message, 'Invoice Error');
    }
  };

  const handleOpenCancelModal = (sale) => {
    setCancelTargetSale(sale);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleExecuteCancel = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Cancellation reason is required.', 'Reason Required');
      return;
    }

    setCancelLoading(true);
    try {
      await api.cancelSale(cancelTargetSale.id, { reason: cancelReason });
      toast.success(
        `Invoice #${cancelTargetSale.invoice_number} voided & inventory restored`,
        'Invoice Voided'
      );
      setCancelModalOpen(false);
      setCancelTargetSale(null);
      fetchSales();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel invoice', 'Cancellation Error');
    } finally {
      setCancelLoading(false);
    }
  };

  const canCancel = user?.role === 'Admin' || user?.role === 'Store Manager';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 sm:p-7 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center space-x-2 font-display">
            <Receipt className="w-6 h-6 text-ember-600 dark:text-ember-400" />
            <span>Sales & Invoice History</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Browse all past retail transactions, reprint receipts, and process manager cancellations.
          </p>
        </div>

        <button
          onClick={fetchSales}
          className="p-2.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-ink-800 rounded-2xl transition border border-stone-200 dark:border-ink-700 shadow-xs"
          title="Refresh sales list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-ink-900 p-4 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Invoice #, Customer, Phone..."
              className="w-full pl-10 pr-3.5 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30 focus:border-ember-600"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white font-medium"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed (Paid)</option>
              <option value="cancelled">Voided / Cancelled</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white"
            />
          </div>

          <div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white"
            />
          </div>

        </form>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 rounded-2xl">
          {error}
        </div>
      )}

      {/* Sales Invoices Table */}
      <div className="bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">Loading sales history...</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            No sales invoices match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-100/70 dark:bg-ink-850/60 border-b border-stone-200 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3">Cashier</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-ink-800">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-ivory-50/70 dark:hover:bg-ink-850/40 transition">
                    <td className="py-3 px-5 font-mono font-bold text-ember-700 dark:text-ember-400">
                      {sale.invoice_number}
                    </td>
                    <td className="py-3 px-3 text-stone-500 dark:text-stone-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(sale.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900 dark:text-white">{sale.customer_name}</div>
                      {sale.customer_phone && (
                        <div className="text-[10px] text-stone-400">{sale.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-stone-700 dark:text-stone-300">
                      {sale.total_units || sale.item_count}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-ivory-100 dark:bg-ink-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-ink-700 uppercase">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                      {sale.cashier_name}
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono text-stone-900 dark:text-white">
                      ₹{sale.rounded_amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {sale.status === 'completed' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800" title={`Cancelled by ${sale.cancelled_by_name}: ${sale.cancellation_reason}`}>
                          <XCircle className="w-3 h-3" />
                          <span>Voided</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewInvoice(sale.id)}
                          className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-ember-700 dark:hover:text-ember-400 hover:bg-stone-100 dark:hover:bg-ink-800 rounded-xl transition"
                          title="View & Reprint Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {sale.status === 'completed' && canCancel && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(sale)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                            title="Cancel / Void Invoice"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Invoice Modal (Admin / Manager) */}
      {cancelModalOpen && cancelTargetSale && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-ink-800 max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-white font-display">Void / Cancel Invoice</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">Invoice #{cancelTargetSale.invoice_number}</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Cancelling this invoice will mark it as voided and <strong>automatically return all items to saleable inventory</strong> with an audit ledger entry.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Mandatory Cancellation Reason:
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Cashier error, duplicate billing, customer cancelled transaction immediately..."
                className="w-full p-3 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-stone-300 dark:border-ink-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-ink-800 rounded-xl text-xs font-bold transition"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                disabled={cancelLoading || !cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Void & Restore Stock'}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Receipt Modal */}
      {selectedSaleData && (
        <ThermalReceipt
          saleData={selectedSaleData}
          onClose={() => setSelectedSaleData(null)}
        />
      )}

    </div>
  );
}
