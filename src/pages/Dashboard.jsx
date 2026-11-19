import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Receipt,
  Boxes,
  AlertTriangle,
  ShoppingCart,
  PackagePlus,
  Tag,
  Calculator,
  ArrowRight,
  Eye,
  RefreshCw,
  Wallet,
  CreditCard,
  QrCode,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  BarChart2,
  Layers
} from 'lucide-react';
import ThermalReceipt from '../components/ThermalReceipt';
import { toast } from '../context/ToastContext';

export default function Dashboard({ setActivePage }) {
  const { user, hasPermission } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleViewInvoice = async (saleId) => {
    try {
      const saleDetails = await api.getSale(saleId);
      setSelectedSale(saleDetails);
    } catch (err) {
      toast.error('Error fetching invoice: ' + err.message, 'Invoice Error');
    }
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white dark:bg-ink-900 rounded-3xl border border-stone-200 dark:border-ink-800"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-ink-900 rounded-3xl border border-stone-200 dark:border-ink-800"></div>
          ))}
        </div>
      </div>
    );
  }

  const { today = {}, inventory = {}, recentSales = [] } = metrics || {};

  // Percent of payment modes
  const totalRevenue = today.revenue || 1;
  const cashPct = Math.round(((today.cash_sales || 0) / totalRevenue) * 100);
  const upiPct = Math.round(((today.upi_sales || 0) / totalRevenue) * 100);
  const cardPct = Math.round(((today.card_sales || 0) / totalRevenue) * 100);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Summary Header - Material Elevation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 sm:p-8 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-2 dark:shadow-mat-dark-2 relative overflow-hidden transition-colors">
        
        {/* Ambient warm textile glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-ember-500/10 dark:from-ember-500/5 to-transparent pointer-events-none"></div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ember-700 dark:text-ember-400">
              Retail Intelligence
            </span>
            <span className="text-stone-300 dark:text-ink-700">•</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">Live Counter Feeds</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-1">
            Store Performance Overview
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time daily turnover, inventory levels, and counter activity for today.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 relative z-10">
          <button
            type="button"
            onClick={fetchMetrics}
            className="p-2.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-ink-800 rounded-2xl transition border border-stone-200 dark:border-ink-700 shadow-xs"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {hasPermission('pos') && (
            <button
              type="button"
              onClick={() => setActivePage('pos')}
              className="px-5 py-2.5 bg-gradient-to-r from-ember-700 to-saffron-600 hover:from-ember-800 hover:to-saffron-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-ember-600/25 flex items-center space-x-2 transition hover:scale-[1.02]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Counter</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* KPI Cards Row with Material Design elevation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Sales */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 flex flex-col justify-between hover:border-ember-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Today's Revenue
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight font-display">
              ₹{today.revenue?.toLocaleString('en-IN') || 0}
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{today.transactions || 0} bills finalized</span>
            </div>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 flex flex-col justify-between hover:border-ember-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Garments Sold
            </span>
            <div className="w-9 h-9 rounded-2xl bg-ember-500/10 text-ember-600 dark:text-ember-400 flex items-center justify-center border border-ember-500/20 group-hover:scale-105 transition">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight font-display">
              {today.units_sold || 0} <span className="text-sm font-sans font-medium text-stone-400">pcs</span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-medium">
              Gross: ₹{today.gross_sales?.toLocaleString('en-IN') || 0}
            </div>
          </div>
        </div>

        {/* Total Available Inventory */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 flex flex-col justify-between hover:border-ember-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Saleable Stock
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight font-display">
              {inventory.total_saleable_units || 0} <span className="text-sm font-sans font-medium text-stone-400">pcs</span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {inventory.total_products || 0} unique styles
            </div>
          </div>
        </div>

        {/* Stock Alerts (Low Stock + Damaged) */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 flex flex-col justify-between hover:border-ember-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Stock Warnings
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold font-display ${inventory.low_stock_variants > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-white'}`}>
                {inventory.low_stock_variants || 0}
              </span>
              <span className="text-xs font-semibold text-stone-400 uppercase">Low Stock SKUs</span>
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
              {inventory.total_damaged_units || 0} pcs damaged/defective
            </div>
          </div>
        </div>

      </div>

      {/* Middle Section: Collections Split & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Collections Breakdown Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 space-y-5 transition-colors">
          <div className="flex items-center justify-between border-b border-ivory-200 dark:border-ink-800 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Payment Collections Visualizer
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Cash drawer vs instant digital payment splits</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400">Total Net Collections</span>
              <div className="text-lg font-mono font-bold text-stone-900 dark:text-stone-100">
                ₹{today.revenue?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>

          {/* Payment Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-stone-100 dark:bg-ink-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${cashPct || 0}%` }} className="bg-emerald-500 transition-all duration-500" title={`Cash: ${cashPct}%`}></div>
              <div style={{ width: `${upiPct || 0}%` }} className="bg-ember-500 transition-all duration-500" title={`UPI: ${upiPct}%`}></div>
              <div style={{ width: `${cardPct || 0}%` }} className="bg-saffron-500 transition-all duration-500" title={`Card: ${cardPct}%`}></div>
            </div>
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>Cash ({cashPct || 0}%)</span>
              <span>UPI / QR ({upiPct || 0}%)</span>
              <span>Card / POS ({cardPct || 0}%)</span>
            </div>
          </div>

          {/* Payment Mode Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-1">
                <Wallet className="w-3.5 h-3.5" />
                <span>Cash Register</span>
              </div>
              <div className="text-base font-black text-emerald-900 dark:text-emerald-200 font-mono">
                ₹{today.cash_sales?.toLocaleString('en-IN') || 0}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-ember-50/70 dark:bg-ember-950/30 border border-ember-200/60 dark:border-ember-800/40">
              <div className="flex items-center space-x-1.5 text-ember-800 dark:text-ember-300 font-bold text-xs mb-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI / QR</span>
              </div>
              <div className="text-base font-black text-ember-900 dark:text-ember-200 font-mono">
                ₹{today.upi_sales?.toLocaleString('en-IN') || 0}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
              <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs mb-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card Machine</span>
              </div>
              <div className="text-base font-black text-amber-900 dark:text-amber-200 font-mono">
                ₹{today.card_sales?.toLocaleString('en-IN') || 0}
              </div>
            </div>

          </div>
        </div>

        {/* Quick Operations Navigation (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 space-y-4 transition-colors">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 border-b border-ivory-200 dark:border-ink-800 pb-2">
            Quick Operations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {hasPermission('pos') && (
              <button
                type="button"
                onClick={() => setActivePage('pos')}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-ink-700 bg-ivory-50 dark:bg-ink-850 hover:border-ember-500/50 hover:bg-white dark:hover:bg-ink-800 transition text-left group shadow-xs"
              >
                <ShoppingCart className="w-5 h-5 text-ember-600 dark:text-ember-400 mb-2 group-hover:scale-110 transition" />
                <div className="font-bold text-xs text-stone-900 dark:text-white">POS Billing</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Quick barcode checkout</div>
              </button>
            )}

            {hasPermission('purchases') && (
              <button
                type="button"
                onClick={() => setActivePage('purchases')}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-ink-700 bg-ivory-50 dark:bg-ink-850 hover:border-ember-500/50 hover:bg-white dark:hover:bg-ink-800 transition text-left group shadow-xs"
              >
                <PackagePlus className="w-5 h-5 text-ember-600 dark:text-ember-400 mb-2 group-hover:scale-110 transition" />
                <div className="font-bold text-xs text-stone-900 dark:text-white">Stock Inward</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Receive supplier shipments</div>
              </button>
            )}

            {hasPermission('inventory') && (
              <button
                type="button"
                onClick={() => setActivePage('inventory')}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-ink-700 bg-ivory-50 dark:bg-ink-850 hover:border-ember-500/50 hover:bg-white dark:hover:bg-ink-800 transition text-left group shadow-xs"
              >
                <Boxes className="w-5 h-5 text-ember-600 dark:text-ember-400 mb-2 group-hover:scale-110 transition" />
                <div className="font-bold text-xs text-stone-900 dark:text-white">Stock Audit</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Audit log & physical adjustment</div>
              </button>
            )}

            {hasPermission('daily_closing') && (
              <button
                type="button"
                onClick={() => setActivePage('daily_closing')}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-ink-700 bg-ivory-50 dark:bg-ink-850 hover:border-ember-500/50 hover:bg-white dark:hover:bg-ink-800 transition text-left group shadow-xs"
              >
                <Calculator className="w-5 h-5 text-ember-600 dark:text-ember-400 mb-2 group-hover:scale-110 transition" />
                <div className="font-bold text-xs text-stone-900 dark:text-white">Daily Cash Closing</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Physical note count & approval</div>
              </button>
            )}

          </div>
        </div>

      </div>

      {/* Recent Store Transactions Table */}
      <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-ivory-200 dark:border-ink-800 pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Recent Invoices & Transactions
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Latest completed checkout receipts processed through POS</p>
          </div>

          {hasPermission('sales') && (
            <button
              type="button"
              onClick={() => setActivePage('sales')}
              className="text-xs text-ember-700 dark:text-ember-400 hover:underline font-bold flex items-center space-x-1"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentSales.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No transactions completed yet today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-100/70 dark:bg-ink-850/60 border-b border-stone-200 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Net Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-ink-800">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-ivory-50/80 dark:hover:bg-ink-850/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-ember-700 dark:text-ember-400">
                      {sale.invoice_number}
                    </td>
                    <td className="py-3 px-3 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      {new Date(sale.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-800 dark:text-stone-200">{sale.customer_name || 'Walk-in Guest'}</div>
                      <div className="text-[10px] text-stone-400">{sale.customer_phone || '-'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-stone-700 dark:text-stone-300">
                      {sale.item_count || 1}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-ink-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-ink-700">
                        {sale.payment_method || sale.payment_mode || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono text-stone-900 dark:text-white">
                      ₹{Number(sale.net_amount ?? sale.rounded_amount ?? sale.total_amount ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        (sale.status || 'completed') === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {(sale.status || 'completed') === 'completed' ? 'Paid' : (sale.status || 'Voided')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewInvoice(sale.id)}
                        className="p-1.5 text-stone-400 hover:text-ember-700 dark:hover:text-ember-400 hover:bg-stone-100 dark:hover:bg-ink-800 rounded-lg transition"
                        title="View Thermal Receipt"
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

      {/* Modal Thermal Receipt Preview */}
      {selectedSale && (
        <ThermalReceipt
          saleData={selectedSale}
          sale={selectedSale?.sale || selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}

    </div>
  );
}
