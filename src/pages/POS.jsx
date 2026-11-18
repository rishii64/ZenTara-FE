import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Wallet,
  AlertTriangle,
  User,
  Phone,
  Tag,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import ThermalReceipt from '../components/ThermalReceipt';
import ModalPortal from '../components/ModalPortal';
import { toast } from '../context/ToastContext';

export default function POS() {
  const { user } = useAuth();
  
  // Barcode input & catalog state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Discount & Totals
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  
  // Catalog Modal
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogVariants, setCatalogVariants] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash', 'UPI', 'Card', 'Split'
  const [cashTendered, setCashTendered] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  
  // Completed Sale & Print Receipt Modal
  const [completedSaleData, setCompletedSaleData] = useState(null);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
    loadCatalogCategories();
  }, []);

  const loadCatalogCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCatalogVariants = async () => {
    try {
      let params = '?';
      if (catalogSearch) params += `search=${encodeURIComponent(catalogSearch)}&`;
      const vars = await api.getVariants(params);
      setCatalogVariants(vars);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (catalogOpen) {
      loadCatalogVariants();
    }
  }, [catalogOpen, catalogSearch]);

  // Barcode scanner submission
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    setBarcodeLoading(true);
    setBarcodeError('');

    try {
      const variant = await api.lookupBarcode(code);
      addToCart(variant);
      toast.success(`${variant.product_name} (${variant.size}) added to cart`, 'Barcode Scanned');
      setBarcodeInput('');
    } catch (err) {
      const msg = err.message || 'Product not found for scanned barcode';
      setBarcodeError(msg);
      toast.error(msg, 'Scan Failed');
      setTimeout(() => setBarcodeError(''), 4000);
    } finally {
      setBarcodeLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  const addToCart = (variant) => {
    if (variant.saleable_stock <= 0) {
      const msg = `"${variant.product_name} (${variant.size})" is OUT OF STOCK.`;
      setBarcodeError(msg);
      toast.error(msg, 'Out of Stock');
      setTimeout(() => setBarcodeError(''), 4000);
      return;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.variant.id === variant.id);

      if (existingIndex > -1) {
        const existingItem = prevCart[existingIndex];
        const nextQty = existingItem.quantity + 1;

        if (nextQty > variant.saleable_stock) {
          const msg = `Stock limit reached! Available: ${variant.saleable_stock}.`;
          setBarcodeError(msg);
          toast.warning(msg, 'Stock Limit');
          setTimeout(() => setBarcodeError(''), 4000);
          return prevCart;
        }

        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = {
          ...existingItem,
          quantity: nextQty,
          lineTotal: nextQty * existingItem.unitPrice
        };
        return updatedCart;
      } else {
        return [
          ...prevCart,
          {
            variant,
            quantity: 1,
            unitPrice: Number(variant.selling_price),
            lineDiscount: 0,
            lineTotal: Number(variant.selling_price)
          }
        ];
      }
    });

    setBarcodeError('');
  };

  const updateQuantity = (variantId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.variant.id === variantId) {
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.variant.saleable_stock) {
            const msg = `Cannot exceed available stock of ${item.variant.saleable_stock}.`;
            setBarcodeError(msg);
            toast.warning(msg, 'Stock Limit');
            setTimeout(() => setBarcodeError(''), 3000);
            return item;
          }
          return {
            ...item,
            quantity: nextQty,
            lineTotal: (nextQty * item.unitPrice) - item.lineDiscount
          };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (variantId) => {
    const item = cart.find(i => i.variant.id === variantId);
    setCart(prevCart => prevCart.filter(item => item.variant.id !== variantId));
    if (item) {
      toast.info(`Removed ${item.variant.product_name} from cart`);
    }
  };

  const clearCart = () => {
    if (window.confirm('Clear all items from the current cart?')) {
      setCart([]);
      setDiscountValue(0);
      setBarcodeError('');
      toast.info('Billing cart cleared');
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  
  let billDiscountAmount = 0;
  if (discountType === 'percent') {
    billDiscountAmount = (subtotal * (Number(discountValue) || 0)) / 100;
  } else {
    billDiscountAmount = Number(discountValue) || 0;
  }
  billDiscountAmount = Math.min(billDiscountAmount, subtotal);

  const taxableAmount = (subtotal - billDiscountAmount) / 1.05;
  const totalGst = (subtotal - billDiscountAmount) - taxableAmount;
  const grandTotal = Math.max(0, subtotal - billDiscountAmount);
  const roundedGrandTotal = Math.round(grandTotal);

  const cashNum = Number(cashTendered) || 0;
  const changeToReturn = cashNum >= roundedGrandTotal ? cashNum - roundedGrandTotal : 0;

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setCashTendered(roundedGrandTotal.toString());
    setPaymentModalOpen(true);
  };

  const handleCompleteSale = async () => {
    setCheckoutLoading(true);
    setCheckoutError('');

    const payload = {
      customer_name: customerName || 'Walk-in Customer',
      customer_phone: customerPhone || null,
      items: cart.map(item => ({
        variant_id: item.variant.id,
        quantity: item.quantity,
        discount_amount: item.lineDiscount || 0
      })),
      discount_amount: billDiscountAmount,
      discount_percentage: discountType === 'percent' ? Number(discountValue) : 0,
      payment_method: paymentMethod,
      cash_tendered: paymentMethod === 'Cash' ? Number(cashTendered) : 0,
      payment_details: paymentDetails || paymentMethod
    };

    try {
      const data = await api.checkout(payload);
      setPaymentModalOpen(false);
      setCart([]);
      setDiscountValue(0);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCompletedSaleData(data);
      toast.success(
        `Invoice #${data.sale.invoice_number} finalized for ₹${Number(data.sale.rounded_amount).toFixed(2)}`,
        'Checkout Completed'
      );
    } catch (err) {
      const msg = err.message || 'Checkout failed';
      setCheckoutError(msg);
      toast.error(msg, 'Payment Processing Failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner / Cashier Action Bar */}
      <div className="bg-white dark:bg-ink-900 p-4 sm:p-5 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        
        {/* Barcode Scanner Input Form */}
        <form onSubmit={handleBarcodeSubmit} className="flex-1 max-w-xl flex items-center space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ember-600 dark:text-ember-400">
              <Barcode className="w-5 h-5" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode or SKU (e.g. 8901001001) & press Enter..."
              className="w-full pl-11 pr-4 py-3 bg-ivory-50 dark:bg-ink-850 border-2 border-stone-200 dark:border-ink-700 focus:border-ember-600 dark:focus:border-ember-500 rounded-2xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:bg-white dark:focus:bg-ink-800 text-stone-900 dark:text-white transition shadow-xs"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={barcodeLoading || !barcodeInput.trim()}
            className="px-5 py-3 bg-gradient-to-r from-ember-700 to-saffron-600 hover:from-ember-800 hover:to-saffron-700 disabled:opacity-40 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-ember-600/25"
          >
            <Zap className="w-4 h-4" />
            <span>{barcodeLoading ? 'Scanning...' : 'Add'}</span>
          </button>
        </form>

        {/* Catalog Browser button & Clear */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="px-4 py-2.5 bg-ivory-100 dark:bg-ink-850 hover:bg-ivory-200 dark:hover:bg-ink-800 text-stone-800 dark:text-stone-200 rounded-2xl text-xs font-bold border border-stone-200/90 dark:border-ink-700 flex items-center space-x-2 transition shadow-xs"
          >
            <Search className="w-4 h-4 text-ember-600 dark:text-ember-400" />
            <span>Browse Garments Catalog</span>
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="px-3.5 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl text-xs font-semibold border border-rose-200 dark:border-rose-900/40 transition"
              title="Clear cart"
            >
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {/* Error alert if barcode not found or stock insufficient */}
      {barcodeError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="font-semibold">{barcodeError}</span>
        </div>
      )}

      {/* Main Counter Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Cart Line Items (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 overflow-hidden flex flex-col min-h-[460px] transition-colors">
          
          <div className="px-6 py-4 bg-ivory-50 dark:bg-ink-850 border-b border-stone-200/80 dark:border-ink-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-ember-500/10 text-ember-600 dark:text-ember-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm text-stone-900 dark:text-white font-display">
                Billing Cart ({cart.reduce((a, b) => a + b.quantity, 0)} Units)
              </h2>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Cashier: <strong className="text-stone-800 dark:text-white">{user?.full_name}</strong>
            </div>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-x-auto">
            {cart.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <div className="w-16 h-16 rounded-3xl bg-ivory-100 dark:bg-ink-800 flex items-center justify-center mb-3">
                  <Barcode className="w-8 h-8 text-stone-400" />
                </div>
                <div className="font-bold text-stone-700 dark:text-stone-300 text-sm">Cart is currently empty</div>
                <p className="text-xs text-stone-400 max-w-sm mt-1">
                  Point barcode scanner gun at garment tag or click "Browse Garments Catalog" to select items.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-ivory-100/70 dark:bg-ink-850/60 border-b border-stone-200 dark:border-ink-800 text-stone-500 dark:text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-5">Garment / Variant</th>
                    <th className="py-3 px-3 text-center">SKU / Barcode</th>
                    <th className="py-3 px-3 text-right">Price</th>
                    <th className="py-3 px-3 text-center">Quantity</th>
                    <th className="py-3 px-3 text-right">GST</th>
                    <th className="py-3 px-5 text-right">Total</th>
                    <th className="py-3 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-ink-800">
                  {cart.map((item) => (
                    <tr key={item.variant.id} className="hover:bg-ivory-50/70 dark:hover:bg-ink-850/40 transition">
                      
                      <td className="py-3 px-5">
                        <div className="font-bold text-stone-900 dark:text-white text-xs">{item.variant.product_name}</div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-ivory-100 dark:bg-ink-800 border border-stone-200/80 dark:border-ink-700 text-stone-700 dark:text-stone-300 text-[10px] font-bold">
                            Size: {item.variant.size}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-ivory-100 dark:bg-ink-800 border border-stone-200/80 dark:border-ink-700 text-stone-700 dark:text-stone-300 text-[10px]">
                            {item.variant.colour}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            (Stock: {item.variant.saleable_stock})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-[11px] text-stone-600 dark:text-stone-400">
                        <div>{item.variant.sku}</div>
                        <div className="text-[10px] text-stone-400">{item.variant.barcode}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-stone-800 dark:text-stone-200">
                        ₹{item.unitPrice}
                        {item.variant.mrp > item.unitPrice && (
                          <div className="text-[10px] text-stone-400 line-through">MRP ₹{item.variant.mrp}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center border border-stone-200 dark:border-ink-700 rounded-xl overflow-hidden bg-white dark:bg-ink-850 shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variant.id, -1)}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-ink-800 text-stone-600 dark:text-stone-300 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 py-1 font-bold text-stone-900 dark:text-white text-xs min-w-[2rem] text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variant.id, 1)}
                            disabled={item.quantity >= item.variant.saleable_stock}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-ink-800 disabled:opacity-30 text-stone-600 dark:text-stone-300 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                        {item.variant.gst_rate}%
                      </td>

                      <td className="py-3 px-5 text-right font-black text-stone-900 dark:text-white text-sm font-mono">
                        ₹{item.lineTotal?.toFixed(2)}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.variant.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          title="Remove line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Customer Metadata Bar */}
          <div className="p-4 bg-ivory-50 dark:bg-ink-850 border-t border-stone-200/80 dark:border-ink-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name (Default: Walk-in)"
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30 focus:border-ember-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                Mobile Number (SMS Invoice)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30 focus:border-ember-600"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Checkout Action (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-2 dark:shadow-mat-dark-2 space-y-5 transition-colors">
            <h3 className="font-extrabold text-base text-stone-900 dark:text-white font-display border-b border-stone-100 dark:border-ink-800 pb-3 flex items-center justify-between">
              <span>Checkout Breakdown</span>
              <span className="text-[10px] text-stone-400 font-mono">GST INCLUSIVE</span>
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items):</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Bill Discount Section */}
              <div className="pt-2 border-t border-dashed border-stone-200 dark:border-ink-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-stone-700 dark:text-stone-300 font-semibold flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-ember-600 dark:text-ember-400" />
                    <span>Store Discount</span>
                  </span>
                  <div className="flex text-[10px] border border-stone-300 dark:border-ink-700 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setDiscountType('amount')}
                      className={`px-2.5 py-0.5 ${discountType === 'amount' ? 'bg-ember-600 text-white font-bold' : 'bg-ivory-100 dark:bg-ink-800 text-stone-600 dark:text-stone-400'}`}
                    >
                      ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-2.5 py-0.5 ${discountType === 'percent' ? 'bg-ember-600 text-white font-bold' : 'bg-ivory-100 dark:bg-ink-800 text-stone-600 dark:text-stone-400'}`}
                    >
                      %
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white"
                    placeholder={discountType === 'amount' ? '₹ amount' : '% percentage'}
                  />
                </div>
                {billDiscountAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 font-mono">
                    <span>Discount Deducted:</span>
                    <span>-₹{billDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Tax Details */}
              <div className="pt-2 border-t border-dashed border-stone-200 dark:border-ink-800 text-[11px] text-stone-500 dark:text-stone-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Estimated Taxable:</span>
                  <span>₹{taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Amount:</span>
                  <span>₹{totalGst.toFixed(2)}</span>
                </div>
              </div>

              {/* Final Payable */}
              <div className="pt-4 border-t-2 border-stone-900 dark:border-ink-700 flex justify-between items-baseline">
                <div>
                  <div className="text-xs uppercase font-extrabold text-stone-500 dark:text-stone-400">Total Payable</div>
                  <div className="text-[10px] text-stone-400">Net Rounded Off</div>
                </div>
                <div className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight font-display">
                  ₹{roundedGrandTotal.toLocaleString('en-IN')}
                </div>
              </div>

            </div>

            {/* Collect Payment Button */}
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={cart.length === 0}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-2xl !text-[12px] sm:text-sm font-black shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all duration-200 tracking-wide uppercase hover:scale-[1.01]"
            >
              <CreditCard className="w-5 h-5" />
              <span>COLLECT PAYMENT & PRINT (F4)</span>
            </button>

          </div>

          {/* Quick Scanner Help Tip */}
          <div className="p-4 bg-ivory-200/70 dark:bg-ink-850 rounded-3xl border border-stone-200/80 dark:border-ink-800 text-xs text-stone-800 dark:text-stone-300 space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-ember-700 dark:text-ember-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Barcode Scanner Ready</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Standard handheld barcode guns type directly into the scan bar. Stock is verified instantly on every scan.
            </p>
          </div>

        </div>

      </div>

      {/* Catalog Modal */}
      {catalogOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-ink-800 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            
            <div className="px-6 py-4 bg-stone-900 dark:bg-ink-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-ember-400" />
                <h3 className="font-bold text-sm tracking-wide font-display">Select Garment from Catalog</h3>
              </div>
              <button
                type="button"
                onClick={() => setCatalogOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="p-4 bg-ivory-50 dark:bg-ink-850 border-b border-stone-200 dark:border-ink-800">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search by product name, colour, size, SKU or barcode..."
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30 focus:border-ember-600"
                  autoFocus
                />
              </div>
            </div>

            {/* Variants Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {catalogVariants.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    addToCart(v);
                    setCatalogOpen(false);
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer hover:shadow-md ${
                    v.saleable_stock > 0 
                      ? 'bg-white dark:bg-ink-850 border-stone-200 dark:border-ink-800 hover:border-ember-500' 
                      : 'bg-stone-50 dark:bg-ink-950 border-stone-200 dark:border-ink-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-bold text-xs text-stone-900 dark:text-white line-clamp-1">{v.product_name}</div>
                  <div className="flex items-center space-x-1 text-[10px] text-stone-400 mt-1">
                    <span>{v.category_name}</span>
                    <span>•</span>
                    <span>{v.brand_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 my-2">
                    <span className="px-2 py-0.5 rounded-md bg-ivory-100 dark:bg-ink-800 border border-stone-200 dark:border-ink-700 text-stone-800 dark:text-stone-200 text-[10px] font-bold">
                      Size: {v.size}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-ivory-100 dark:bg-ink-800 border border-stone-200 dark:border-ink-700 text-stone-700 dark:text-stone-300 text-[10px]">
                      {v.colour}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-ink-800">
                    <div className="text-sm font-black text-stone-900 dark:text-white font-mono">₹{v.selling_price}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.saleable_stock <= 0 
                        ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400' 
                        : v.saleable_stock <= v.reorder_level 
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' 
                        : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {v.saleable_stock <= 0 ? 'Out of Stock' : `${v.saleable_stock} in stock`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-ivory-100 dark:bg-ink-850 border-t border-stone-200 dark:border-ink-800 text-right text-xs">
              <button
                type="button"
                onClick={() => setCatalogOpen(false)}
                className="px-4 py-1.5 border border-stone-300 dark:border-ink-700 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-200 dark:hover:bg-ink-800 transition font-bold"
              >
                Close Catalog
              </button>
            </div>

          </div>
        </div>
        </ModalPortal>
      )}

      {/* Payment Method & Checkout Modal */}
      {paymentModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-ink-800 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in duration-150">
            
            <div className="px-6 py-4 bg-stone-900 dark:bg-ink-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm font-display">Complete Settlement</h3>
                <p className="text-xs text-stone-400">Total Bill: ₹{roundedGrandTotal}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                {checkoutError}
              </div>
            )}

            <div className="p-6 space-y-5">
              
              {/* Payment Mode Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'Cash', icon: Wallet, label: 'Cash' },
                    { id: 'UPI', icon: QrCode, label: 'UPI / QR' },
                    { id: 'Card', icon: CreditCard, label: 'Card Swipe' }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition ${
                          isSelected
                            ? 'bg-ember-500/10 border-ember-600 text-ember-700 dark:text-ember-300 font-bold shadow-xs'
                            : 'bg-ivory-50 dark:bg-ink-850 border-stone-200 dark:border-ink-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-ink-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash specific drawer calculator */}
              {paymentMethod === 'Cash' && (
                <div className="bg-ivory-50 dark:bg-ink-850 p-4 rounded-2xl border border-stone-200 dark:border-ink-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Cash Received from Customer (₹)
                    </label>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-lg font-black text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                      placeholder="0"
                    />
                  </div>

                  {/* Quick currency buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[roundedGrandTotal, 500, 1000, 2000, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTendered(amt.toString())}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-ink-900 border border-stone-200 dark:border-ink-700 hover:bg-stone-100 dark:hover:bg-ink-800 text-[11px] font-mono font-semibold text-stone-700 dark:text-stone-300"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  {/* Change calculation */}
                  <div className="pt-2 border-t border-stone-200 dark:border-ink-800 flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-500 dark:text-stone-400">Change to Return:</span>
                    <span className={`text-base font-black font-mono ${changeToReturn >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                      ₹{changeToReturn.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* UPI specific simulation */}
              {paymentMethod === 'UPI' && (
                <div className="bg-ivory-50 dark:bg-ink-850 p-4 rounded-2xl border border-stone-200 dark:border-ink-800 text-center space-y-2">
                  <div className="w-28 h-28 mx-auto bg-white p-2 rounded-2xl border border-stone-300 flex items-center justify-center shadow-xs">
                    <QrCode className="w-24 h-24 text-stone-900" />
                  </div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Scan QR Code to pay ₹{roundedGrandTotal}</div>
                  <p className="text-[10px] text-stone-400">Supports PhonePe, GPay, Paytm, BHIM</p>
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="UPI Transaction Reference / UTR (Optional)"
                    className="w-full px-3 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white"
                  />
                </div>
              )}

              {/* Card specific */}
              {paymentMethod === 'Card' && (
                <div className="bg-ivory-50 dark:bg-ink-850 p-4 rounded-2xl border border-stone-200 dark:border-ink-800 space-y-2">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Card Machine Approval / Last 4 Digits
                  </label>
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="e.g. Card Ref # 4081"
                    className="w-full px-3 py-2 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white"
                  />
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-ivory-100 dark:bg-ink-850 border-t border-stone-200 dark:border-ink-800 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 border border-stone-300 dark:border-ink-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-ink-800 rounded-xl text-xs font-bold transition"
              >
                Back to Cart
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={checkoutLoading || (paymentMethod === 'Cash' && cashNum < roundedGrandTotal)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/25 flex items-center space-x-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{checkoutLoading ? 'Processing Sale...' : 'CONFIRM & PRINT RECEIPT'}</span>
              </button>
            </div>

          </div>
        </div>
        </ModalPortal>
      )}

      {/* Completed Sale Receipt Modal */}
      {completedSaleData && (
        <ThermalReceipt
          saleData={completedSaleData}
          onClose={() => setCompletedSaleData(null)}
        />
      )}

    </div>
  );
}
