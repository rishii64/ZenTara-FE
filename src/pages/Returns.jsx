import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Boxes,
  Layers,
  Clock,
  Printer,
  X
} from 'lucide-react';

import ModalPortal from '../components/ModalPortal';
import { toast } from '../context/ToastContext';

export default function Returns() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('process'); // 'process' or 'history'
  
  // Step 1: Invoice lookup
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [verifiedSale, setVerifiedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);

  // Step 2: Selected items for return
  const [returnSelections, setReturnSelections] = useState({});

  // Step 3: Return Type & Exchange
  const [returnType, setReturnType] = useState('refund');
  const [refundMethod, setRefundMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  // Exchange state
  const [exchangeItems, setExchangeItems] = useState([]);
  const [catalogVariants, setCatalogVariants] = useState([]);
  const [exchangeSearch, setExchangeSearch] = useState('');
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);

  // Processing state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // History Tab state
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getReturns();
      setReturnsHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLookupInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceNumberInput.trim()) return;

    setLookupLoading(true);
    setLookupError('');
    setVerifiedSale(null);
    setSaleItems([]);
    setReturnSelections({});
    setExchangeItems([]);
    setSubmitSuccess(null);

    try {
      const data = await api.verifyInvoiceForReturn(invoiceNumberInput.trim());
      setVerifiedSale(data.sale);
      setSaleItems(data.items);

      const initMap = {};
      data.items.forEach(item => {
        initMap[item.id] = {
          selected: false,
          quantity: item.eligible_quantity > 0 ? 1 : 0,
          condition: 'saleable',
          reason: 'Wrong size / fitting issue'
        };
      });
      setReturnSelections(initMap);
    } catch (err) {
      setLookupError(err.message || 'Invoice lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleToggleItem = (itemId) => {
    setReturnSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected
      }
    }));
  };

  const handleUpdateItem = (itemId, key, val) => {
    setReturnSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [key]: val
      }
    }));
  };

  let totalReturnRefund = 0;
  saleItems.forEach(item => {
    const sel = returnSelections[item.id];
    if (sel?.selected && sel.quantity > 0) {
      totalReturnRefund += item.unit_price * sel.quantity;
    }
  });

  const totalReplacement = exchangeItems.reduce((acc, ex) => acc + (ex.selling_price * ex.quantity), 0);
  const netDifference = totalReplacement - totalReturnRefund;

  const loadExchangeCatalog = async () => {
    try {
      const data = await api.getVariants(exchangeSearch ? `?search=${encodeURIComponent(exchangeSearch)}` : '');
      setCatalogVariants(data.filter(v => v.saleable_stock > 0));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (catalogModalOpen) {
      loadExchangeCatalog();
    }
  }, [catalogModalOpen, exchangeSearch]);

  const addExchangeItem = (variant) => {
    setExchangeItems(prev => {
      const existing = prev.find(i => i.id === variant.id);
      if (existing) {
        return prev.map(i => i.id === variant.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...variant, quantity: 1 }];
    });
    setCatalogModalOpen(false);
  };

  const removeExchangeItem = (variantId) => {
    setExchangeItems(prev => prev.filter(i => i.id !== variantId));
  };

  const handleProcessSubmit = async () => {
    const itemsToReturn = [];
    saleItems.forEach(item => {
      const sel = returnSelections[item.id];
      if (sel?.selected && sel.quantity > 0) {
        itemsToReturn.push({
          sale_item_id: item.id,
          quantity: sel.quantity,
          condition: sel.condition,
          reason: sel.reason
        });
      }
    });

    if (itemsToReturn.length === 0) {
      toast.warning('Please select at least one item to return.', 'Return Selection');
      return;
    }

    if (returnType === 'exchange' && exchangeItems.length === 0) {
      toast.warning('Please add at least one replacement garment for exchange.', 'Exchange Required');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        original_invoice_number: verifiedSale.invoice_number,
        type: returnType,
        items: itemsToReturn,
        refund_method: refundMethod,
        notes,
        exchange_items: returnType === 'exchange' ? exchangeItems.map(i => ({ variant_id: i.id, quantity: i.quantity })) : []
      };

      const result = await api.processReturn(payload);
      setSubmitSuccess(result);
      toast.success(
        `Return #${result.return_number} finalized (${result.type.toUpperCase()})`,
        'Return Processed'
      );
      setVerifiedSale(null);
      setSaleItems([]);
      setReturnSelections({});
      setExchangeItems([]);
    } catch (err) {
      const msg = err.message || 'Failed to process return';
      toast.error(msg, 'Return Error');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 sm:p-7 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center space-x-2 font-display">
            <RotateCcw className="w-6 h-6 text-ember-600 dark:text-ember-400" />
            <span>Returns & Exchanges Counter</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Verify original invoice, inspect garment condition, route stock to saleable or damaged, and issue refunds or exchanges.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-ivory-100 dark:bg-ink-850 p-1 rounded-2xl text-xs font-semibold border border-stone-200/80 dark:border-ink-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('process')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'process' 
                ? 'bg-white dark:bg-ink-900 text-stone-900 dark:text-white shadow-xs font-bold' 
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Process Return / Exchange
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'history' 
                ? 'bg-white dark:bg-ink-900 text-stone-900 dark:text-white shadow-xs font-bold' 
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Past Returns Log
          </button>
        </div>
      </div>

      {activeTab === 'process' ? (
        <div className="space-y-6">
          
          {/* Step 1: Invoice Search Form */}
          <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-1 flex items-center space-x-2 font-display">
              <Receipt className="w-4 h-4 text-ember-600 dark:text-ember-400" />
              <span>Step 1: Look up Original Retail Bill</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Enter the invoice number printed on the customer's receipt (e.g. INV-20261118-0001).
            </p>

            <form onSubmit={handleLookupInvoice} className="flex flex-col sm:flex-row items-center gap-3 max-w-xl">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={invoiceNumberInput}
                  onChange={(e) => setInvoiceNumberInput(e.target.value)}
                  placeholder="e.g. INV-20261118-0001"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-2xl text-xs font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30 focus:border-ember-600"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading || !invoiceNumberInput.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-ember-600 hover:bg-ember-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-ember-600/25"
              >
                {lookupLoading ? 'Verifying...' : 'Find Bill'}
              </button>
            </form>

            {lookupError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 rounded-2xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-6 rounded-3xl space-y-2">
              <div className="flex items-center space-x-3 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm">{submitSuccess.message}</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Return Reference: <strong className="font-mono">{submitSuccess.return?.return_number}</strong>
                  </p>
                </div>
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                Stock has been updated automatically. Saleable units restocked; damaged units logged separately.
              </div>
            </div>
          )}

          {/* Step 2 & 3: Bill Items & Return Configuration */}
          {verifiedSale && (
            <div className="space-y-6">
              
              {/* Verified Bill Info Banner */}
              <div className="bg-stone-900 dark:bg-ink-950 text-white p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-stone-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-ember-400 text-sm sm:text-base">{verifiedSale.invoice_number}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Original Bill Verified
                    </span>
                  </div>
                  <div className="text-xs text-stone-300 mt-1">
                    Customer: <strong className="text-white">{verifiedSale.customer_name}</strong> {verifiedSale.customer_phone ? `(${verifiedSale.customer_phone})` : ''} | Date: {new Date(verifiedSale.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Original Paid Amount</div>
                  <div className="text-xl font-black text-white font-mono">₹{verifiedSale.rounded_amount?.toFixed(2)}</div>
                </div>
              </div>

              {/* Items Selection Card */}
              <div className="bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4">
                <h3 className="font-bold text-sm text-stone-900 dark:text-white font-display">
                  Step 2: Select Items, Condition & Return Reason
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-ivory-100/70 dark:bg-ink-850/60 border-b border-stone-200 dark:border-ink-800 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Select</th>
                        <th className="py-2.5 px-3">Garment Item</th>
                        <th className="py-2.5 px-3 text-center">Billed Qty</th>
                        <th className="py-2.5 px-3 text-center">Eligible Qty</th>
                        <th className="py-2.5 px-3 text-center">Return Qty</th>
                        <th className="py-2.5 px-3">Condition</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3 text-right">Refund (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-ink-800">
                      {saleItems.map((item) => {
                        const sel = returnSelections[item.id] || {};
                        const isEligible = item.eligible_quantity > 0;

                        return (
                          <tr key={item.id} className={sel.selected ? 'bg-ember-50/50 dark:bg-ember-950/20' : ''}>
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                disabled={!isEligible}
                                checked={sel.selected || false}
                                onChange={() => handleToggleItem(item.id)}
                                className="w-4 h-4 rounded text-ember-600 focus:ring-ember-500 cursor-pointer"
                              />
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-stone-900 dark:text-white">{item.product_name}</div>
                              <div className="text-[10px] text-stone-400">
                                Size: {item.size} | Colour: {item.colour} | SKU: {item.sku}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center text-stone-600 dark:text-stone-400 font-medium">
                              {item.quantity}
                            </td>

                            <td className="py-3 px-3 text-center font-bold">
                              {item.eligible_quantity <= 0 ? (
                                <span className="text-stone-400 text-[10px]">Already Returned</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">{item.eligible_quantity} units</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              {isEligible && sel.selected ? (
                                <input
                                  type="number"
                                  min="1"
                                  max={item.eligible_quantity}
                                  value={sel.quantity}
                                  onChange={(e) => handleUpdateItem(item.id, 'quantity', Math.min(item.eligible_quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                                  className="w-16 px-2 py-1 text-center bg-white dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-lg font-bold text-xs text-stone-900 dark:text-white"
                                />
                              ) : (
                                <span className="text-stone-400">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              {isEligible && sel.selected ? (
                                <select
                                  value={sel.condition}
                                  onChange={(e) => handleUpdateItem(item.id, 'condition', e.target.value)}
                                  className="px-2 py-1 bg-white dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-lg text-xs font-medium text-stone-900 dark:text-white"
                                >
                                  <option value="saleable">Saleable (Restock to Shelf)</option>
                                  <option value="damaged">Damaged / Defective (Damaged Stock)</option>
                                </select>
                              ) : (
                                <span className="text-stone-400">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              {isEligible && sel.selected ? (
                                <select
                                  value={sel.reason}
                                  onChange={(e) => handleUpdateItem(item.id, 'reason', e.target.value)}
                                  className="px-2 py-1 bg-white dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-lg text-xs text-stone-900 dark:text-white"
                                >
                                  <option value="Wrong size / fitting issue">Wrong size / fitting issue</option>
                                  <option value="Defect / Fabric flaw / Stain">Defect / Fabric flaw / Stain</option>
                                  <option value="Customer changed mind">Customer changed mind</option>
                                  <option value="Colour / Style disliked">Colour / Style disliked</option>
                                </select>
                              ) : (
                                <span className="text-stone-400">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right font-bold text-stone-900 dark:text-white font-mono">
                              {isEligible && sel.selected ? `₹${(item.unit_price * (sel.quantity || 0)).toFixed(2)}` : '₹0.00'}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-ink-800 flex justify-between items-center text-xs">
                  <span className="text-stone-500 font-semibold">Total Item Return Value:</span>
                  <span className="text-base font-black text-stone-900 dark:text-white font-mono">₹{totalReturnRefund.toFixed(2)}</span>
                </div>
              </div>

              {/* Step 3: Action Type */}
              <div className="bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4">
                <h3 className="font-bold text-sm text-stone-900 dark:text-white font-display">
                  Step 3: Choose Refund or Exchange
                </h3>

                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <button
                    type="button"
                    onClick={() => setReturnType('refund')}
                    className={`p-4 rounded-2xl border text-center transition ${
                      returnType === 'refund'
                        ? 'bg-ember-500/10 border-ember-600 text-ember-700 dark:text-ember-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-ink-850 border-stone-200 dark:border-ink-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <div className="text-sm">Money Refund</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Return funds to customer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnType('exchange')}
                    className={`p-4 rounded-2xl border text-center transition ${
                      returnType === 'exchange'
                        ? 'bg-ember-500/10 border-ember-600 text-ember-700 dark:text-ember-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-ink-850 border-stone-200 dark:border-ink-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <div className="text-sm">Product Exchange</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Exchange for replacement item</div>
                  </button>
                </div>

                {returnType === 'refund' && (
                  <div className="bg-ivory-50 dark:bg-ink-850 p-4 rounded-2xl border border-stone-200 dark:border-ink-800 space-y-3 max-w-md">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      Refund Mode
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white"
                    >
                      <option value="Cash">Cash Drawer Refund</option>
                      <option value="UPI">UPI Refund</option>
                      <option value="Store Credit">Store Credit Note</option>
                    </select>
                  </div>
                )}

                {returnType === 'exchange' && (
                  <div className="bg-ivory-50 dark:bg-ink-850 p-4 rounded-2xl border border-stone-200 dark:border-ink-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200 font-display">
                        Replacement Items ({exchangeItems.length})
                      </div>
                      <button
                        type="button"
                        onClick={() => setCatalogModalOpen(true)}
                        className="px-3.5 py-1.5 bg-ember-600 hover:bg-ember-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Select Replacement Garment</span>
                      </button>
                    </div>

                    {exchangeItems.length === 0 ? (
                      <div className="p-4 bg-white dark:bg-ink-900 rounded-xl border border-dashed border-stone-300 dark:border-ink-700 text-center text-xs text-stone-400">
                        No replacement garment added yet. Click "Select Replacement Garment".
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {exchangeItems.map(item => (
                          <div key={item.id} className="p-3 bg-white dark:bg-ink-900 rounded-xl border border-stone-200 dark:border-ink-700 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-stone-900 dark:text-white">{item.product_name}</div>
                              <div className="text-[10px] text-stone-400">Size: {item.size} | Colour: {item.colour}</div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="font-bold text-stone-900 dark:text-white font-mono">₹{item.selling_price} x {item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => removeExchangeItem(item.id)}
                                className="text-rose-500 hover:underline text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="p-3 bg-ember-50/70 dark:bg-ember-950/30 border border-ember-200 dark:border-ember-900/50 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-ember-900 dark:text-ember-300">Exchange Net Calculation:</span>
                            <div className="text-[10px] text-ember-700 dark:text-ember-400">
                              Replacement total (₹{totalReplacement}) - Return value (₹{totalReturnRefund})
                            </div>
                          </div>
                          <div className="text-right">
                            {netDifference > 0 ? (
                              <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                                Customer Pays: +₹{netDifference.toFixed(2)}
                              </span>
                            ) : netDifference < 0 ? (
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                Store Refunds: ₹{Math.abs(netDifference).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-sm font-black text-stone-800 dark:text-stone-200">
                                Exact Exchange (₹0.00 difference)
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* Final Submit Button */}
                <div className="pt-4 border-t border-stone-100 dark:border-ink-800 flex justify-end">
                  <button
                    type="button"
                    onClick={handleProcessSubmit}
                    disabled={submitLoading || totalReturnRefund <= 0}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-500/25 flex items-center space-x-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitLoading ? 'Processing...' : 'CONFIRM & COMPLETE RETURN'}</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      ) : (
        /* History Tab */
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4">
          <h3 className="font-bold text-sm text-stone-900 dark:text-white font-display">Historical Returns & Exchanges</h3>

          {historyLoading ? (
            <div className="text-center py-10 text-xs text-stone-400">Loading returns history...</div>
          ) : returnsHistory.length === 0 ? (
            <div className="text-center py-10 text-xs text-stone-400">No returns recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-ivory-100/70 dark:bg-ink-850/60 border-b border-stone-200 dark:border-ink-800 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Return #</th>
                    <th className="py-2.5 px-3">Original Invoice</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Cashier</th>
                    <th className="py-2.5 px-3 text-right">Refund Amount</th>
                    <th className="py-2.5 px-3 text-right">Net Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-ink-800">
                  {returnsHistory.map((ret) => (
                    <tr key={ret.id} className="hover:bg-ivory-50/70 dark:hover:bg-ink-850/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-ember-700 dark:text-ember-400">{ret.return_number}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-700 dark:text-stone-300">{ret.original_invoice}</td>
                      <td className="py-2.5 px-3 text-stone-500 dark:text-stone-400 font-mono text-[11px]">{new Date(ret.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ret.type === 'exchange' ? 'bg-ember-100 dark:bg-ember-950/40 text-ember-700 dark:text-ember-300' : 'bg-ivory-100 dark:bg-ink-800 text-stone-700 dark:text-stone-300'
                        }`}>
                          {ret.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-800 dark:text-stone-200 font-medium">{ret.customer_name}</td>
                      <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">{ret.processed_by_name}</td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-stone-900 dark:text-white">₹{ret.total_return_amount?.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-600 dark:text-stone-400 font-semibold">₹{ret.net_difference?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Exchange Replacement Selection Modal */}
      {catalogModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-ink-800 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-4 bg-stone-900 dark:bg-ink-950 text-white flex justify-between items-center">
              <span className="font-bold text-sm font-display">Select Replacement Garment</span>
              <button type="button" onClick={() => setCatalogModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <div className="p-3.5 bg-ivory-50 dark:bg-ink-850 border-b border-stone-200 dark:border-ink-800">
              <input
                type="text"
                value={exchangeSearch}
                onChange={(e) => setExchangeSearch(e.target.value)}
                placeholder="Search replacement garments..."
                className="w-full px-3 py-2 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
              />
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {catalogVariants.map(v => (
                <div
                  key={v.id}
                  onClick={() => addExchangeItem(v)}
                  className="p-3 bg-white dark:bg-ink-850 border border-stone-200 dark:border-ink-800 hover:border-ember-500 rounded-2xl cursor-pointer flex justify-between items-center transition"
                >
                  <div>
                    <div className="font-bold text-xs text-stone-900 dark:text-white">{v.product_name}</div>
                    <div className="text-[10px] text-stone-400">Size: {v.size} | Colour: {v.colour} | In Stock: {v.saleable_stock}</div>
                  </div>
                  <div className="text-sm font-black text-stone-900 dark:text-white font-mono">₹{v.selling_price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

    </div>
  );
}
