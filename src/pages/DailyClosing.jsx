import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import {
  Calculator,
  Wallet,
  QrCode,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  RefreshCw,
  Coins
} from 'lucide-react';

export default function DailyClosing() {
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Currency Denominations State
  const [denominations, setDenominations] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    coins: 0
  });

  const [notes, setNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Past Closings History
  const [history, setHistory] = useState([]);

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getTodayClosingSummary(selectedDate);
      setSummaryData(data);
      if (data.existingClosing) {
        setNotes(data.existingClosing.notes || '');
        if (data.existingClosing.cash_denominations) {
          try {
            setDenominations(JSON.parse(data.existingClosing.cash_denominations));
          } catch {}
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api.getClosingHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchHistory();
  }, [selectedDate]);

  const updateDenomination = (denom, count) => {
    setDenominations(prev => ({
      ...prev,
      [denom]: Math.max(0, parseInt(count) || 0)
    }));
  };

  // Calculate physical cash from denominations
  const physicalCashCounted = 
    (denominations[500] * 500) +
    (denominations[200] * 200) +
    (denominations[100] * 100) +
    (denominations[50] * 50) +
    (denominations[20] * 20) +
    (denominations[10] * 10) +
    (denominations.coins * 1);

  const { sales = {}, returns = {}, cancelled = {}, expectedCashInDrawer = 0, existingClosing } = summaryData || {};

  const discrepancy = physicalCashCounted - expectedCashInDrawer;

  const handleSubmitClosing = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitSuccess('');

    try {
      await api.submitClosing({
        closing_date: selectedDate,
        physical_cash_counted: physicalCashCounted,
        cash_denominations: denominations,
        notes: notes.trim()
      });
      setSubmitSuccess('Daily closing figures submitted successfully!');
      toast.success(
        `Daily closing for ${selectedDate} submitted (Physical cash: ₹${physicalCashCounted})`,
        'Closing Submitted'
      );
      fetchSummary();
      fetchHistory();
    } catch (err) {
      const msg = err.message || 'Error submitting closing';
      toast.error(msg, 'Closing Error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApproveClosing = async () => {
    if (!existingClosing) return;
    try {
      await api.approveClosing(existingClosing.id);
      toast.success('Daily closing approved and signed off by manager!', 'Closing Approved');
      fetchSummary();
      fetchHistory();
    } catch (err) {
      toast.error(err.message || 'Approval failed', 'Approval Error');
    }
  };

  const canApprove = (user?.role === 'Admin' || user?.role === 'Store Manager') && existingClosing?.status !== 'approved';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border border-ember-200 dark:border-ember-800/60 mb-1.5">
            <Calculator className="w-3 h-3 text-ember-600" />
            <span>Till Reconciliation & Sign-off</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Daily Cash Drawer Closing
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Reconcile physical cash drawer with recorded store sales, audit payment modes, and complete manager sign-off.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
          />
          <button
            onClick={fetchSummary}
            className="p-2.5 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white bg-ivory-100 dark:bg-ink-800 hover:bg-ivory-200 dark:hover:bg-ink-700 rounded-xl transition border border-ivory-300/80 dark:border-ink-700"
            title="Refresh summary"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Live Sales Aggregate Cards for Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Net Sales */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Sales</div>
          <div className="text-2xl font-mono font-bold text-stone-900 dark:text-stone-100 mt-1">₹{sales.total_sales?.toLocaleString('en-IN') || 0}</div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{sales.total_invoices || 0} completed bills</div>
        </div>

        {/* Expected Cash in Drawer */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-emerald-300/80 dark:border-emerald-900/40 shadow-mat-1 dark:shadow-mat-dark-1 bg-gradient-to-br from-emerald-50/40 dark:from-emerald-950/20 to-white dark:to-ink-900 transition-colors">
          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span>Expected Cash in Drawer</span>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-800 dark:text-emerald-300 mt-1">₹{expectedCashInDrawer.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            Cash sales (₹{sales.cash_sales || 0}) - Returns (₹{returns.cash_returns || 0})
          </div>
        </div>

        {/* Digital Collections (UPI + Card) */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-saffron-300/80 dark:border-amber-900/40 shadow-mat-1 dark:shadow-mat-dark-1 bg-gradient-to-br from-amber-50/40 dark:from-amber-950/20 to-white dark:to-ink-900 transition-colors">
          <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital Total (UPI + Card)</span>
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 dark:text-stone-100 mt-1">
            ₹{((sales.upi_sales || 0) + (sales.card_sales || 0)).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            UPI: ₹{sales.upi_sales || 0} | Card: ₹{sales.card_sales || 0}
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Deductions</div>
          <div className="text-2xl font-mono font-bold text-stone-800 dark:text-stone-200 mt-1">₹{(sales.total_discounts || 0) + (returns.total_returns || 0)}</div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Discounts: ₹{sales.total_discounts || 0} | Returns: ₹{returns.total_returns || 0}
          </div>
        </div>

      </div>

      {/* Main Reconciliation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Physical Cash Counting Tool (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-5 transition-colors">
          <div className="flex items-center justify-between border-b border-ivory-200 dark:border-ink-800 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Physical Cash Denomination Counter</h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Count physical currency notes and coins in the register drawer.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Physical Count Total</span>
              <div className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100">₹{physicalCashCounted.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <form onSubmit={handleSubmitClosing} className="space-y-4">
            
            {/* Currency Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { denom: 500, label: '₹500 Notes' },
                { denom: 200, label: '₹200 Notes' },
                { denom: 100, label: '₹100 Notes' },
                { denom: 50, label: '₹50 Notes' },
                { denom: 20, label: '₹20 Notes' },
                { denom: 10, label: '₹10 Notes' }
              ].map(({ denom, label }) => (
                <div key={denom} className="p-3 rounded-2xl bg-ivory-50 dark:bg-ink-850 border border-ivory-300/70 dark:border-ink-800 transition-colors">
                  <div className="flex justify-between items-center mb-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
                    <span>{label}</span>
                    <span className="text-stone-400 font-mono text-[11px]">₹{(denominations[denom] || 0) * denom}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={denominations[denom] || ''}
                    onChange={(e) => updateDenomination(denom, e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-ink-900 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs font-mono font-bold text-center text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
                  />
                </div>
              ))}
            </div>

            {/* Coins */}
            <div className="p-3.5 rounded-2xl bg-ivory-50 dark:bg-ink-850 border border-ivory-300/70 dark:border-ink-800 flex items-center justify-between transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Coins & Loose Change</div>
                  <div className="text-[10px] text-stone-400">Total coin value in rupees</div>
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={denominations.coins || ''}
                onChange={(e) => updateDenomination('coins', e.target.value)}
                placeholder="0"
                className="w-28 px-3 py-1.5 bg-white dark:bg-ink-900 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs font-mono font-bold text-right text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>

            {/* Cashier Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Closing Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Counter closed by Cashier, all UPI settlements verified."
                className="w-full px-3.5 py-2 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 bg-ember-600 hover:bg-ember-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 transition"
            >
              {submitLoading ? 'Submitting...' : 'Submit Cash Drawer Closing'}
            </button>
          </form>
        </div>

        {/* Discrepancy & Status Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-5 transition-colors">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 border-b border-ivory-200 dark:border-ink-800 pb-3">
              Reconciliation Variance Status
            </h3>

            {/* Variance Metric Box */}
            <div className={`p-5 rounded-2xl border ${
              discrepancy === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : discrepancy > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider mb-1">
                {discrepancy === 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>PERFECT BALANCE</span>
                  </>
                ) : discrepancy > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>CASH SURPLUS (OVERAGE)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>CASH SHORTAGE (DEFICIT)</span>
                  </>
                )}
              </div>

              <div className="text-3xl font-mono font-bold mt-1">
                {discrepancy >= 0 ? `+₹${discrepancy.toFixed(2)}` : `-₹${Math.abs(discrepancy).toFixed(2)}`}
              </div>

              <p className="text-[11px] mt-2 leading-relaxed opacity-85">
                {discrepancy === 0
                  ? 'Physical cash in drawer perfectly matches system sales.'
                  : discrepancy > 0
                  ? `There is ₹${discrepancy.toFixed(2)} extra cash in the drawer compared to recorded sales.`
                  : `There is a shortage of ₹${Math.abs(discrepancy).toFixed(2)} in physical cash compared to recorded sales.`}
              </p>
            </div>

            {/* Manager Review Status */}
            <div className="pt-2 border-t border-ivory-200 dark:border-ink-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600 dark:text-stone-400">Approval Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  existingClosing?.status === 'approved'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}>
                  {existingClosing?.status || 'Pending Submission'}
                </span>
              </div>

              {existingClosing?.closed_by_name && (
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Closed by: <strong className="text-stone-800 dark:text-stone-200">{existingClosing.closed_by_name}</strong>
                </div>
              )}

              {existingClosing?.approved_by_name && (
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Approved by: <strong className="text-stone-800 dark:text-stone-200">{existingClosing.approved_by_name}</strong>
                </div>
              )}

              {canApprove && (
                <button
                  type="button"
                  onClick={handleApproveClosing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 flex items-center justify-center space-x-1.5 transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Store Manager Sign-off & Approve</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Historical Daily Closings Table */}
      <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4 transition-colors">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Past Daily Closings Log</h3>

        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-400">No past closing records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Total Sales</th>
                  <th className="py-2.5 px-3 text-right">Cash Sales</th>
                  <th className="py-2.5 px-3 text-right">Physical Cash</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                  <th className="py-2.5 px-3">Closed By</th>
                  <th className="py-2.5 px-3">Approved By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                {history.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-stone-100 font-mono text-[11px]">{c.closing_date}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">₹{c.total_sales_amount?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-700 dark:text-stone-300">₹{c.cash_sales_amount?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">₹{c.physical_cash_counted?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={c.cash_discrepancy === 0 ? 'text-emerald-700 dark:text-emerald-400' : c.cash_discrepancy > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-600'}>
                        {c.cash_discrepancy >= 0 ? `+₹${c.cash_discrepancy}` : `-₹${Math.abs(c.cash_discrepancy)}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">{c.closed_by_name}</td>
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">{c.approved_by_name || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'approved' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
