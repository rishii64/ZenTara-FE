import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { toast } from '../context/ToastContext';
import { exportToExcel } from '../utils/excelExport';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Boxes,
  Truck,
  RotateCcw,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const { storeName } = useStore();
  const [activeReport, setActiveReport] = useState('sales'); // 'sales', 'stock', 'purchases', 'returns'

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [salesGroupBy, setSalesGroupBy] = useState('daily');

  // Report Data
  const [salesData, setSalesData] = useState({ rows: [], totals: {} });
  const [stockData, setStockData] = useState({ rows: [], summary: {} });
  const [purchaseData, setPurchaseData] = useState({ rows: [], totalSpend: 0 });
  const [returnsData, setReturnsData] = useState({ rows: [], totalRefundAmount: 0 });
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeReport === 'sales') {
        let params = `?group_by=${salesGroupBy}&`;
        if (fromDate) params += `from_date=${fromDate}&`;
        if (toDate) params += `to_date=${toDate}&`;
        const data = await api.getSalesReport(params);
        setSalesData(data);
      } else if (activeReport === 'stock') {
        const data = await api.getStockReport();
        setStockData(data);
      } else if (activeReport === 'purchases') {
        let params = '?';
        if (fromDate) params += `from_date=${fromDate}&`;
        if (toDate) params += `to_date=${toDate}&`;
        const data = await api.getPurchasesReport(params);
        setPurchaseData(data);
      } else if (activeReport === 'returns') {
        let params = '?';
        if (fromDate) params += `from_date=${fromDate}&`;
        if (toDate) params += `to_date=${toDate}&`;
        const data = await api.getReturnsReport(params);
        setReturnsData(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load report data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport, salesGroupBy, fromDate, toDate]);

  // Configurations for Excel Export
  const getExportConfig = () => {
    if (activeReport === 'sales') {
      return {
        filename: `${storeName.toLowerCase().replace(/\s+/g, '_')}_sales_report`,
        sheetName: salesGroupBy === 'monthly' ? 'Monthly Sales' : 'Daily Sales',
        data: salesData.rows || [],
        columns: [
          { header: 'Period', key: 'period', isText: true },
          { header: 'Bills Count', key: 'invoice_count' },
          { header: 'Gross Sales (₹)', key: 'gross_sales', isCurrency: true },
          { header: 'Discounts (₹)', key: 'discounts', isCurrency: true },
          { header: 'Taxable Sales (₹)', key: 'taxable_sales', isCurrency: true },
          { header: 'Total GST (₹)', key: 'total_gst', isCurrency: true },
          { header: 'Net Sales (₹)', key: 'net_sales', isCurrency: true },
          { header: 'Cash Collections (₹)', key: 'cash_total', isCurrency: true },
          { header: 'UPI Collections (₹)', key: 'upi_total', isCurrency: true },
          { header: 'Card Collections (₹)', key: 'card_total', isCurrency: true }
        ],
        totals: {
          period: 'TOTALS',
          invoice_count: salesData.totals?.invoice_count || 0,
          gross_sales: salesData.totals?.gross_sales || 0,
          discounts: salesData.totals?.discounts || 0,
          taxable_sales: salesData.totals?.taxable_sales || 0,
          total_gst: salesData.totals?.total_gst || 0,
          net_sales: salesData.totals?.net_sales || 0,
          cash_total: salesData.totals?.cash_total || 0,
          upi_total: salesData.totals?.upi_total || 0,
          card_total: salesData.totals?.card_total || 0
        }
      };
    } else if (activeReport === 'stock') {
      return {
        filename: `${storeName.toLowerCase().replace(/\s+/g, '_')}_stock_valuation_report`,
        sheetName: 'Stock Valuation',
        data: stockData.rows || [],
        columns: [
          { header: 'Garment Style / Item', key: 'product_name', isText: true },
          { header: 'Category', key: 'category_name', isText: true },
          { header: 'Brand', key: 'brand_name', isText: true },
          { header: 'Size', key: 'size', isText: true },
          { header: 'Colour', key: 'colour', isText: true },
          { header: 'SKU Code', key: 'sku', isText: true },
          { header: 'Barcode', key: 'barcode', isText: true },
          { header: 'Purchase Cost (₹)', key: 'purchase_price', isCurrency: true },
          { header: 'Selling Price (₹)', key: 'selling_price', isCurrency: true },
          { header: 'Saleable Units (Pcs)', key: 'saleable_stock' },
          { header: 'Damaged Units (Pcs)', key: 'damaged_stock' },
          { header: 'Reorder Level', key: 'reorder_level' },
          { header: 'Total Purchase Cost (₹)', key: 'purchase_value', isCurrency: true },
          { header: 'Total Retail Valuation (₹)', key: 'retail_value', isCurrency: true },
          { header: 'Stock Status', key: 'stock_status', isText: true }
        ],
        totals: {
          product_name: 'INVENTORY TOTALS',
          saleable_stock: stockData.summary?.total_saleable_units || 0,
          damaged_stock: stockData.summary?.total_damaged_units || 0,
          purchase_value: stockData.summary?.total_purchase_valuation || 0,
          retail_value: stockData.summary?.total_retail_valuation || 0
        }
      };
    } else if (activeReport === 'purchases') {
      return {
        filename: `${storeName.toLowerCase().replace(/\s+/g, '_')}_purchases_inward_report`,
        sheetName: 'Purchase Inwards',
        data: purchaseData.rows || [],
        columns: [
          { header: 'Purchase Date', key: 'purchase_date', isText: true },
          { header: 'PO Number', key: 'purchase_number', isText: true },
          { header: 'Supplier Name', key: 'supplier_name', isText: true },
          { header: 'Supplier Invoice #', key: 'supplier_invoice_no', isText: true },
          { header: 'Item Lines Count', key: 'item_count' },
          { header: 'Accepted Units (Pcs)', key: 'accepted_units' },
          { header: 'Damaged / Rejected Units', key: 'damaged_units' },
          { header: 'Total Inward Spend (₹)', key: 'total_amount', isCurrency: true },
          { header: 'Received By', key: 'received_by', isText: true }
        ],
        totals: {
          purchase_date: 'TOTAL SPEND',
          total_amount: purchaseData.totalSpend || 0
        }
      };
    } else {
      // returns
      return {
        filename: `${storeName.toLowerCase().replace(/\s+/g, '_')}_returns_exchanges_report`,
        sheetName: 'Returns & Exchanges',
        data: returnsData.rows || [],
        columns: [
          { header: 'Return Date', key: 'return_date', isText: true },
          { header: 'Return Slip #', key: 'return_number', isText: true },
          { header: 'Original Invoice #', key: 'original_invoice', isText: true },
          { header: 'Action Type', key: 'type', isText: true },
          { header: 'Item Lines Count', key: 'item_count' },
          { header: 'Saleable Restocked Units', key: 'saleable_units' },
          { header: 'Damaged Units', key: 'damaged_units' },
          { header: 'Refund Issued (₹)', key: 'total_return_amount', isCurrency: true },
          { header: 'Net Difference (₹)', key: 'net_difference', isCurrency: true },
          { header: 'Refund Mode', key: 'refund_method', isText: true },
          { header: 'Cashier / Processed By', key: 'processed_by', isText: true }
        ],
        totals: {
          return_date: 'TOTAL REFUNDS',
          total_return_amount: returnsData.totalRefundAmount || 0
        }
      };
    }
  };

  const handleExportExcel = () => {
    try {
      const cfg = getExportConfig();
      if (!cfg.data || cfg.data.length === 0) {
        toast.warning('No records available to export for the selected date range.', 'Export Report');
        return;
      }
      const file = exportToExcel({
        filename: cfg.filename,
        sheetName: cfg.sheetName,
        columns: cfg.columns,
        data: cfg.data,
        storeName,
        totals: cfg.totals
      });
      toast.success(`Exported ${cfg.data.length} records to Excel (${file}) with bold headers & auto cell spacing`, 'Excel Export Ready');
    } catch (err) {
      toast.error(err.message || 'Failed to export to Excel', 'Export Error');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border border-ember-200 dark:border-ember-800/60 mb-1.5">
            <BarChart3 className="w-3 h-3 text-ember-600" />
            <span>Executive Analytics & Audits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Reports & Business Intelligence
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Analyze daily/monthly sales, stock valuation, supplier inwards, and refund metrics for <strong className="text-stone-800 dark:text-stone-200">{storeName}</strong>.
          </p>
        </div>

        {/* Report Selector Pills */}
        <div className="flex flex-wrap bg-ivory-100 dark:bg-ink-800 p-1 rounded-2xl text-xs font-semibold gap-1 border border-ivory-300 dark:border-ink-700">
          {[
            { id: 'sales', label: 'Sales & Tax', icon: TrendingUp },
            { id: 'stock', label: 'Stock Valuation', icon: Boxes },
            { id: 'purchases', label: 'Purchases', icon: Truck },
            { id: 'returns', label: 'Returns Log', icon: RotateCcw }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${isActive
                    ? 'bg-ember-600 hover:bg-ember-700 text-white dark:bg-ember-900 dark:text-stone-100 font-bold shadow-xs border border-ivory-300 dark:border-ink-700'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white dark:text-ember-400' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-ink-900 p-4 rounded-2xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {activeReport === 'sales' && (
            <div className="flex items-center space-x-1 bg-ivory-100 dark:bg-ink-800 p-1 rounded-xl text-xs font-semibold border border-ivory-300 dark:border-ink-700">
              <button
                onClick={() => setSalesGroupBy('daily')}
                className={`px-2.5 py-1 rounded-lg transition ${salesGroupBy === 'daily' ? 'bg-white dark:bg-ink-900 text-stone-900 dark:text-stone-100 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setSalesGroupBy('monthly')}
                className={`px-2.5 py-1 rounded-lg transition ${salesGroupBy === 'monthly' ? 'bg-white dark:bg-ink-900 text-stone-900 dark:text-stone-100 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
              >
                Monthly
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-medium">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 bg-ivory-50 dark:bg-ink-800 border border-ivory-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-ember-500"
            />
          </div>

          <button
            onClick={loadReport}
            className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white bg-ivory-100 dark:bg-ink-800 hover:bg-ivory-200 dark:hover:bg-ink-700 border border-ivory-300/80 dark:border-ink-700 rounded-xl transition"
            title="Reload report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-ember-600' : ''}`} />
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs border border-emerald-600/50"
          title="Export report to styled Microsoft Excel (.xls) spreadsheet with bold header and auto-spaced cells"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
          <span>Export to Excel</span>
        </button>
      </div>

      {/* Report 1: Sales & Tax Breakdown */}
      {activeReport === 'sales' && (
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ivory-200 dark:border-ink-800 pb-3">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              {salesGroupBy === 'monthly' ? 'Monthly Sales & Tax Report' : 'Daily Sales & Tax Report'}
            </h3>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              Total Invoices: <strong className="text-stone-900 dark:text-stone-100 font-mono font-bold">{salesData.totals?.invoice_count || 0}</strong> | Total Net: <strong className="text-ember-700 dark:text-ember-400 font-mono font-bold">₹{salesData.totals?.net_sales?.toLocaleString('en-IN') || 0}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3 text-center">Bills</th>
                  <th className="py-2.5 px-3 text-right">Gross Sales</th>
                  <th className="py-2.5 px-3 text-right">Discounts</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  <th className="py-2.5 px-3 text-right">Total GST</th>
                  <th className="py-2.5 px-3 text-right font-bold">Net Sales</th>
                  <th className="py-2.5 px-3 text-right">Cash</th>
                  <th className="py-2.5 px-3 text-right">UPI</th>
                  <th className="py-2.5 px-3 text-right">Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                {salesData.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-stone-100 font-mono text-[11px]">{row.period}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-700 dark:text-stone-300">{row.invoice_count}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-700 dark:text-stone-300">₹{Number(row.gross_sales || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold">-₹{Number(row.discounts || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-600 dark:text-stone-400">₹{Number(row.taxable_sales || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-600 dark:text-stone-400">₹{Number(row.total_gst || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">₹{Number(row.net_sales || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-600 dark:text-stone-400">₹{Number(row.cash_total || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-600 dark:text-stone-400">₹{Number(row.upi_total || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-600 dark:text-stone-400">₹{Number(row.card_total || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {(!salesData.rows || salesData.rows.length === 0) && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-stone-400 text-xs">
                      No sales records found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Stock Valuation & Low Stock */}
      {activeReport === 'stock' && (
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ivory-200 dark:border-ink-800 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Garment Inventory Valuation Report</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Live balance breakdown with purchase cost and retail price valuation.</p>
            </div>
            <div className="text-xs sm:text-right font-mono">
              <div>Retail Stock Value: <strong className="text-stone-900 dark:text-stone-100 font-bold">₹{stockData.summary?.total_retail_valuation?.toLocaleString('en-IN') || 0}</strong></div>
              <div className="text-stone-500 dark:text-stone-400">Purchase Cost: ₹{stockData.summary?.total_purchase_valuation?.toLocaleString('en-IN') || 0}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Garment Item</th>
                  <th className="py-2.5 px-3">Size & Colour</th>
                  <th className="py-2.5 px-3 font-mono">Barcode</th>
                  <th className="py-2.5 px-3 text-center">Saleable Qty</th>
                  <th className="py-2.5 px-3 text-center">Damaged Qty</th>
                  <th className="py-2.5 px-3 text-right">Cost Value</th>
                  <th className="py-2.5 px-3 text-right">Retail Value</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                {stockData.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-stone-100">{row.product_name}</td>
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-300">{row.size} / {row.colour}</td>
                    <td className="py-2.5 px-3 font-mono text-stone-500 dark:text-stone-400">{row.barcode}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-900 dark:text-stone-100">{row.saleable_stock}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">{row.damaged_stock}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-600 dark:text-stone-400">₹{Number(row.purchase_value || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">₹{Number(row.retail_value || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.stock_status === 'OUT_OF_STOCK' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' : row.stock_status === 'LOW_STOCK' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                        }`}>
                        {row.stock_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stockData.rows || stockData.rows.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                      No inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Supplier Purchases */}
      {activeReport === 'purchases' && (
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-5 transition-colors">
          <div className="flex justify-between items-center border-b border-ivory-200 dark:border-ink-800 pb-3">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Supplier Goods Purchases Report</h3>
            <div className="text-xs">
              Total Inward Spend: <strong className="text-stone-900 dark:text-stone-100 font-mono font-bold">₹{Number(purchaseData.totalSpend || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Purchase #</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Supplier Invoice</th>
                  <th className="py-2.5 px-3 text-center">Accepted Pcs</th>
                  <th className="py-2.5 px-3 text-center">Damaged Pcs</th>
                  <th className="py-2.5 px-3 text-right font-bold">Total Spend</th>
                  <th className="py-2.5 px-3">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                {purchaseData.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400 font-mono text-[11px]">{row.purchase_date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-ember-700 dark:text-ember-400">{row.purchase_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-stone-100">{row.supplier_name}</td>
                    <td className="py-2.5 px-3 font-mono text-stone-600 dark:text-stone-400">{row.supplier_invoice_no}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">{row.accepted_units}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">{row.damaged_units}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">₹{Number(row.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">{row.received_by}</td>
                  </tr>
                ))}
                {(!purchaseData.rows || purchaseData.rows.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                      No purchase inward records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: Returns & Exchanges */}
      {activeReport === 'returns' && (
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-5 transition-colors">
          <div className="flex justify-between items-center border-b border-ivory-200 dark:border-ink-800 pb-3">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Customer Returns & Exchanges Report</h3>
            <div className="text-xs">
              Total Refunds Issued: <strong className="text-stone-900 dark:text-stone-100 font-mono font-bold">₹{Number(returnsData.totalRefundAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-50 dark:bg-ink-850 border-b border-ivory-300/70 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Return #</th>
                  <th className="py-2.5 px-3">Original Invoice</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Saleable Restocked</th>
                  <th className="py-2.5 px-3 text-center">Damaged Units</th>
                  <th className="py-2.5 px-3 text-right font-bold">Refund Amount</th>
                  <th className="py-2.5 px-3">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 dark:divide-ink-800/60">
                {returnsData.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-ivory-50/60 dark:hover:bg-ink-800/40 transition">
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400 font-mono text-[11px]">{row.return_date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-ember-700 dark:text-ember-400">{row.return_number}</td>
                    <td className="py-2.5 px-3 font-mono text-stone-700 dark:text-stone-300">{row.original_invoice}</td>
                    <td className="py-2.5 px-3 uppercase font-bold text-[10px] text-stone-700 dark:text-stone-300">{row.type}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-700 dark:text-emerald-400 font-bold">{row.saleable_units}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-600 dark:text-rose-400 font-bold">{row.damaged_units}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">₹{Number(row.total_return_amount || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">{row.processed_by}</td>
                  </tr>
                ))}
                {(!returnsData.rows || returnsData.rows.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                      No customer return records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
