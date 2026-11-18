import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, CheckCircle2, Receipt, FileText } from 'lucide-react';

export default function ThermalReceipt({ saleData, sale: directSale, onClose }) {
  const [format, setFormat] = useState('thermal'); // 'thermal' (80mm) or 'a4'
  const [mounted, setMounted] = useState(false);

  // Normalize sale object from props
  const sale = saleData?.sale || directSale || saleData;
  const store = saleData?.store || {};

  useEffect(() => {
    setMounted(true);
    // Mark body for print stylesheet isolation & lock background scrolling
    document.body.classList.add('receipt-modal-open');
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.classList.remove('receipt-modal-open');
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!sale || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeName = store.store_name || 'ZENTARA FASHION RETAIL';
  const tagline = store.tagline || 'Premium Apparel by ZENTELEX';
  const address1 = store.address_line1 || '42, Commercial Street, Fashion Square';
  const address2 = store.city_state_zip || 'Bengaluru, Karnataka - 560001';
  const phone = store.phone || '+91 98765 43210';
  const gstin = store.gstin || '29AABCG1234M1Z2';
  const footerNote = store.receipt_footer || 'Thank you for shopping at ZENTARA! Exchanges accepted within 7 days with original invoice.';

  const modalContent = (
    <div className="receipt-modal-backdrop fixed inset-0 bg-stone-950/75 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      
      {/* Modal Dialog Container - Responsive to format selection */}
      <div 
        className={`receipt-modal-dialog bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-ink-800 w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          format === 'thermal' ? 'max-w-2xl max-h-[92vh]' : 'max-w-4xl max-h-[92vh]'
        }`}
      >
        
        {/* Modal Header (Hidden during window.print) */}
        <div className="no-print px-5 sm:px-6 py-4 bg-stone-900 dark:bg-ink-950 text-white flex items-center justify-between border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-wide font-display">Invoice #{sale.invoice_number}</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Paid
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Sale finalized & inventory updated</p>
            </div>
          </div>

          {/* Format Toggle & Close */}
          <div className="flex items-center space-x-2">
            <div className="bg-stone-800/90 p-0.5 rounded-xl flex text-xs border border-stone-700">
              <button
                type="button"
                onClick={() => setFormat('thermal')}
                className={`px-3 py-1 rounded-lg transition font-semibold flex items-center space-x-1.5 ${
                  format === 'thermal' ? 'bg-ember-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
                title="80mm Thermal POS Receipt Format"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('a4')}
                className={`px-3 py-1 rounded-lg transition font-semibold flex items-center space-x-1.5 ${
                  format === 'a4' ? 'bg-ember-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
                title="Standard A4 Tax Invoice Format"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard A4</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition"
              title="Close Preview (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Preview Canvas - Scrollable with sufficient bottom padding */}
        <div className="receipt-modal-canvas flex-1 overflow-y-auto p-4 sm:p-6 pb-12 bg-ivory-100 dark:bg-ink-950 flex flex-col items-center">
          
          {/* Thermal 80mm Preview Format */}
          {format === 'thermal' ? (
            <div className="printable-area thermal-format bg-white shadow-xl border border-stone-300 p-5 sm:p-6 w-[340px] max-w-full text-slate-900 font-mono text-xs leading-relaxed rounded-lg">
              
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-0.5">
                <div className="font-black text-sm tracking-tight text-slate-950 uppercase">{storeName}</div>
                <div className="text-[10px] text-slate-600">{tagline}</div>
                <div className="text-[10px]">{address1}</div>
                <div className="text-[10px]">{address2}</div>
                <div className="text-[10px]">Ph: {phone}</div>
                <div className="text-[10px] font-bold mt-1 text-slate-950">GSTIN: {gstin}</div>
              </div>

              {/* Meta */}
              <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Bill No:</span>
                  <span className="font-bold text-slate-950">{sale.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date/Time:</span>
                  <span>{new Date(sale.created_at || Date.now()).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cashier:</span>
                  <span>{sale.cashier_name || 'Admin'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer:</span>
                  <span className="font-semibold text-slate-900">{sale.customer_name || 'Walk-in Customer'} {sale.customer_phone ? `(${sale.customer_phone})` : ''}</span>
                </div>
              </div>

              {/* Items List Table */}
              <div className="py-2.5 border-b border-dashed border-slate-400">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-400 text-left text-slate-700">
                      <th className="pb-1 font-bold">Item</th>
                      <th className="pb-1 text-center font-bold">Qty</th>
                      <th className="pb-1 text-right font-bold">Rate</th>
                      <th className="pb-1 text-right font-bold">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-300">
                    {sale.items?.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-1.5 pr-1">
                          <div className="font-bold text-slate-950">{item.product_name}</div>
                          <div className="text-[9px] text-slate-600">
                            {item.size ? `Size: ${item.size}` : ''} {item.colour ? `| ${item.colour}` : ''} {item.hsn_code ? `| HSN:${item.hsn_code}` : ''}
                          </div>
                        </td>
                        <td className="py-1.5 text-center font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-1.5 text-right text-slate-700">₹{Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-1.5 text-right font-bold text-slate-950">₹{Number(item.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown */}
              <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold">₹{Number(sale.subtotal || 0).toFixed(2)}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount:</span>
                    <span>-₹{Number(sale.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Taxable Value:</span>
                  <span>₹{Number(sale.taxable_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>CGST:</span>
                  <span>₹{Number(sale.cgst_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>SGST:</span>
                  <span>₹{Number(sale.sgst_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Prominent High-Contrast Net Payable Box */}
              <div className="my-2.5 p-2.5 bg-slate-100 border-2 border-slate-900 rounded text-slate-950">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black tracking-wider uppercase">NET PAYABLE:</span>
                  <span className="text-base font-black font-mono">₹{Number(sale.rounded_amount || 0).toFixed(2)}</span>
                </div>
                {sale.round_off !== undefined && Number(sale.round_off) !== 0 && (
                  <div className="text-[9px] text-slate-600 text-right mt-0.5">
                    Round off: {Number(sale.round_off) > 0 ? `+₹${Number(sale.round_off).toFixed(2)}` : `-₹${Math.abs(Number(sale.round_off)).toFixed(2)}`}
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Payment Mode:</span>
                  <span className="uppercase">{sale.payment_method}</span>
                </div>
                {sale.payment_method === 'Cash' && (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>Cash Tendered:</span>
                      <span>₹{Number(sale.cash_tendered || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>Change Returned:</span>
                      <span>₹{Number(sale.change_returned || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Barcode & Footer Note */}
              <div className="pt-3 text-center text-[9px] text-slate-500 space-y-1.5">
                <div className="font-mono text-xs tracking-widest text-slate-800 font-bold py-1 bg-slate-100 border border-dashed border-slate-300 rounded">
                  * {sale.invoice_number} *
                </div>
                <p className="font-semibold text-slate-700 leading-snug">{footerNote}</p>
                <p className="text-[8px] text-slate-500">Exchanges accepted within 7 days in pristine condition with original tags intact.</p>
                <div className="font-mono text-[9px] text-slate-400 pt-1 tracking-widest font-bold">
                  *** THANK YOU - VISIT AGAIN ***
                </div>
              </div>

            </div>
          ) : (
            /* Standard A4 Tax Invoice Format */
            <div className="printable-area a4-format bg-white shadow-xl border border-slate-200 p-8 w-full max-w-3xl text-slate-900 text-xs rounded-lg">
              
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">{storeName}</h1>
                  <p className="text-slate-600 font-medium">{tagline}</p>
                  <p className="text-slate-500 mt-1">{address1}, {address2}</p>
                  <p className="text-slate-500">Phone: {phone} | Email: {store.email || 'billing@zengarments.com'}</p>
                  <p className="font-bold text-slate-800 mt-1">GSTIN: {gstin}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white font-bold px-3 py-1 text-xs uppercase tracking-wider rounded">
                    Tax Invoice
                  </span>
                  <div className="mt-2 text-slate-700">
                    <p className="font-bold text-sm text-slate-950">Invoice #: {sale.invoice_number}</p>
                    <p>Date: {new Date(sale.created_at || Date.now()).toLocaleDateString('en-IN')}</p>
                    <p>Time: {new Date(sale.created_at || Date.now()).toLocaleTimeString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Bill To & Details */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed To</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{sale.customer_name || 'Walk-in Customer'}</div>
                  {sale.customer_phone && <div className="text-slate-600">Ph: {sale.customer_phone}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Details</div>
                  <div className="font-bold text-slate-800 mt-0.5">Mode: {sale.payment_method}</div>
                  <div className="text-slate-600">Cashier: {sale.cashier_name || 'Admin'}</div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full my-4 border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-[11px] font-bold text-slate-700">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Garment Description</th>
                    <th className="py-2 px-2 text-center">HSN</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Rate</th>
                    <th className="py-2 px-2 text-right">GST%</th>
                    <th className="py-2 px-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <div className="font-bold text-slate-900">{item.product_name}</div>
                        <div className="text-[10px] text-slate-500">Size: {item.size || 'N/A'} | Colour: {item.colour || 'N/A'} | SKU: {item.sku || 'N/A'}</div>
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600">{item.hsn_code || '6203'}</td>
                      <td className="py-2 px-2 text-center font-bold">{item.quantity}</td>
                      <td className="py-2 px-2 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">{item.gst_rate || 5}%</td>
                      <td className="py-2 px-2 text-right font-bold">₹{Number(item.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end pt-2 border-t border-slate-300">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{Number(sale.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {sale.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span>-₹{Number(sale.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount:</span>
                    <span>₹{Number(sale.taxable_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST:</span>
                    <span>₹{Number(sale.cgst_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST:</span>
                    <span>₹{Number(sale.sgst_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t-2 border-slate-900 pt-2 bg-slate-50 px-2 py-1 rounded">
                    <span>Grand Total:</span>
                    <span className="text-base font-black">₹{Number(sale.rounded_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 text-center space-y-1">
                <p className="font-semibold text-slate-700">{footerNote}</p>
                <p>This is a computer generated tax invoice and does not require physical signature.</p>
              </div>

            </div>
          )}

        </div>

        {/* Modal Actions Footer (Hidden during window.print) */}
        <div className="no-print p-4 bg-white dark:bg-ink-900 border-t border-stone-200 dark:border-ink-800 flex items-center justify-between flex-shrink-0">
          <div className="text-xs">
            <div className="text-stone-500 dark:text-stone-400">
              Selected Output: <strong className="text-stone-800 dark:text-white">{format === 'thermal' ? '80mm POS Receipt' : 'Standard A4 Tax Invoice'}</strong>
            </div>
            <div className="text-[11px] font-bold text-ember-600 dark:text-ember-400 mt-0.5 font-mono">
              Net Payable: ₹{Number(sale.rounded_amount || 0).toFixed(2)}
            </div>
          </div>

          <div className="flex space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 dark:border-ink-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-ink-800 rounded-xl text-xs font-semibold transition"
            >
              Done / Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-ember-600 hover:bg-ember-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-ember-600/25 flex items-center space-x-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
