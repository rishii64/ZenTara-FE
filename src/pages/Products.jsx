import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Boxes,
  Barcode,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';

import ModalPortal from '../components/ModalPortal';
import { toast } from '../context/ToastContext';

export default function Products() {
  const { user } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  
  // Expanded products accordion
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formHsn, setFormHsn] = useState('6109');
  const [formGst, setFormGst] = useState('5.0');
  const [formDesc, setFormDesc] = useState('');
  
  // Form variants array
  const [formVariants, setFormVariants] = useState([
    { size: 'M', colour: 'Black', sku: '', barcode: '', purchase_price: 500, mrp: 1299, selling_price: 999, saleable_stock: 10, reorder_level: 5 }
  ]);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let params = '?';
      if (search) params += `search=${encodeURIComponent(search)}&`;
      if (categoryFilter) params += `category_id=${categoryFilter}&`;
      if (brandFilter) params += `brand_id=${brandFilter}&`;
      if (lowStockFilter) params += `low_stock=true&`;

      const data = await api.getProducts(params);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [cats, brs] = await Promise.all([api.getCategories(), api.getBrands()]);
      setCategories(cats);
      setBrands(brs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, brandFilter, lowStockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory(categories[0]?.id?.toString() || '');
    setFormBrand(brands[0]?.id?.toString() || '');
    setFormHsn('6109');
    setFormGst('5.0');
    setFormDesc('');
    
    const prefix = 'ZEN';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormVariants([
      { size: 'M', colour: 'Navy Blue', sku: `${prefix}-M-${rand}`, barcode: `890${rand}01`, purchase_price: 450, mrp: 1299, selling_price: 999, saleable_stock: 15, reorder_level: 5 }
    ]);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category_id?.toString() || '');
    setFormBrand(product.brand_id?.toString() || '');
    setFormHsn(product.hsn_code || '6109');
    setFormGst(product.gst_rate?.toString() || '5.0');
    setFormDesc(product.description || '');
    setFormVariants(product.variants?.map(v => ({ ...v })) || []);
    setFormError('');
    setModalOpen(true);
  };

  const addVariantRow = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormVariants(prev => [
      ...prev,
      {
        size: 'L',
        colour: 'Black',
        sku: `ZEN-L-${rand}`,
        barcode: `890${rand}02`,
        purchase_price: prev[0]?.purchase_price || 500,
        mrp: prev[0]?.mrp || 1299,
        selling_price: prev[0]?.selling_price || 999,
        saleable_stock: 10,
        reorder_level: 5
      }
    ]);
  };

  const removeVariantRow = (index) => {
    if (formVariants.length <= 1) {
      toast.warning('Product must have at least one variant.', 'Variant Required');
      return;
    }
    setFormVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariantRow = (index, field, value) => {
    setFormVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Product name is required.');
      return;
    }

    const skus = new Set();
    const barcodes = new Set();
    for (const v of formVariants) {
      if (!v.size?.trim() || !v.colour?.trim() || !v.sku?.trim() || !v.barcode?.trim()) {
        setFormError('All variants must have size, colour, unique SKU, and barcode.');
        return;
      }
      if (skus.has(v.sku.trim())) {
        setFormError(`Duplicate SKU "${v.sku}" found in variants list.`);
        return;
      }
      if (barcodes.has(v.barcode.trim())) {
        setFormError(`Duplicate Barcode "${v.barcode}" found in variants list.`);
        return;
      }
      skus.add(v.sku.trim());
      barcodes.add(v.barcode.trim());
    }

    setFormLoading(true);
    setFormError('');

    const payload = {
      name: formName.trim(),
      category_id: formCategory ? parseInt(formCategory) : null,
      brand_id: formBrand ? parseInt(formBrand) : null,
      hsn_code: formHsn.trim(),
      gst_rate: parseFloat(formGst) || 5.0,
      description: formDesc.trim(),
      variants: formVariants
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        toast.success(`Updated "${payload.name}" successfully`, 'Garment Updated');
      } else {
        await api.createProduct(payload);
        toast.success(`Created "${payload.name}" with ${payload.variants.length} variant(s)`, 'Garment Created');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      const msg = err.message || 'Failed to save product';
      setFormError(msg);
      toast.error(msg, 'Save Product Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? Only products without sales can be deleted.`)) {
      try {
        await api.deleteProduct(id);
        toast.success(`Deleted product "${name}"`, 'Product Removed');
        fetchProducts();
      } catch (err) {
        toast.error(err.message || 'Could not delete product', 'Delete Failed');
      }
    }
  };

  const canManage = user?.role === 'Admin' || user?.role === 'Inventory Staff';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 sm:p-7 rounded-3xl border border-ivory-300/80 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border border-ember-200 dark:border-ember-800/60 mb-1.5">
            <Tag className="w-3 h-3 text-ember-600" />
            <span>Catalog Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Garment Product Master
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Maintain apparel catalog, manage size/colour variants, barcodes, HSN, and selling prices.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white rounded-2xl text-xs font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garment Product</span>
          </button>
        )}
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
              placeholder="Search product name, SKU, or Barcode..."
              className="w-full pl-10 pr-3.5 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30 focus:border-ember-600"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white font-medium"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white font-medium"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center space-x-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="w-4 h-4 rounded text-ember-600 focus:ring-ember-500"
              />
              <span className="text-amber-600 dark:text-amber-400 font-bold">Low Stock Alerts Only</span>
            </label>
          </div>

        </form>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 rounded-2xl">
          {error}
        </div>
      )}

      {/* Products & Variants Accordion Table */}
      <div className="bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">Loading products catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">No garments match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-100/70 dark:bg-ink-850/60 border-b border-stone-200 dark:border-ink-800 text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3 text-center">HSN</th>
                  <th className="py-3 px-3 text-center">GST Rate</th>
                  <th className="py-3 px-3 text-center">Variants</th>
                  <th className="py-3 px-3 text-center">Saleable Units</th>
                  <th className="py-3 px-3 text-right">Price Range</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-ink-800">
                {products.map((p) => {
                  const isExpanded = expandedIds.has(p.id);
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-ivory-50/70 dark:hover:bg-ink-850/40 transition">
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(p.id)}
                            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-900 dark:text-white text-xs">{p.name}</div>
                          {p.description && <div className="text-[10px] text-stone-400 line-clamp-1">{p.description}</div>}
                        </td>
                        <td className="py-3 px-3 text-stone-600 dark:text-stone-400">{p.category_name || '-'}</td>
                        <td className="py-3 px-3 text-stone-600 dark:text-stone-400">{p.brand_name || '-'}</td>
                        <td className="py-3 px-3 text-center font-mono text-stone-500">{p.hsn_code}</td>
                        <td className="py-3 px-3 text-center font-bold text-stone-700 dark:text-stone-300">{p.gst_rate}%</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ivory-100 dark:bg-ink-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-ink-700">
                            {p.variant_count} variants
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-black">
                          <span className={p.total_saleable_stock <= 5 ? 'text-amber-500 font-mono' : 'text-stone-800 dark:text-stone-200 font-mono'}>
                            {p.total_saleable_stock} pcs
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-stone-800 dark:text-stone-200 font-mono">
                          {p.min_selling_price === p.max_selling_price ? `₹${p.min_selling_price}` : `₹${p.min_selling_price} - ₹${p.max_selling_price}`}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-stone-400 hover:text-ember-700 dark:hover:text-ember-400 hover:bg-stone-100 dark:hover:bg-ink-800 rounded-xl transition"
                                title="Edit Product & Variants"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {user?.role === 'Admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Variants Nested View */}
                      {isExpanded && (
                        <tr className="bg-ivory-50/70 dark:bg-ink-850/60 border-y border-stone-200 dark:border-ink-800">
                          <td colSpan={10} className="p-4 pl-12">
                            <div className="bg-white dark:bg-ink-900 rounded-2xl border border-stone-200 dark:border-ink-800 p-4 shadow-xs space-y-2">
                              <div className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center space-x-1.5 mb-2 font-display">
                                <Boxes className="w-3.5 h-3.5 text-ember-600 dark:text-ember-400" />
                                <span>Specific Size & Colour Variants for "{p.name}"</span>
                              </div>

                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="border-b border-stone-200 dark:border-ink-800 text-stone-400 uppercase text-[9px] font-bold tracking-wider">
                                    <th className="py-1.5 px-2">Size</th>
                                    <th className="py-1.5 px-2">Colour</th>
                                    <th className="py-1.5 px-2">SKU</th>
                                    <th className="py-1.5 px-2">Barcode</th>
                                    <th className="py-1.5 px-2 text-right">Cost</th>
                                    <th className="py-1.5 px-2 text-right">MRP</th>
                                    <th className="py-1.5 px-2 text-right">Sell Price</th>
                                    <th className="py-1.5 px-2 text-center">Saleable</th>
                                    <th className="py-1.5 px-2 text-center">Damaged</th>
                                    <th className="py-1.5 px-2 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 dark:divide-ink-800">
                                  {p.variants?.map((v) => (
                                    <tr key={v.id}>
                                      <td className="py-2 px-2 font-bold text-stone-900 dark:text-white">{v.size}</td>
                                      <td className="py-2 px-2 text-stone-700 dark:text-stone-300">{v.colour}</td>
                                      <td className="py-2 px-2 font-mono text-stone-600 dark:text-stone-400 text-[11px]">{v.sku}</td>
                                      <td className="py-2 px-2 font-mono text-stone-600 dark:text-stone-400 text-[11px]">{v.barcode}</td>
                                      <td className="py-2 px-2 text-right text-stone-500 font-mono">₹{v.purchase_price}</td>
                                      <td className="py-2 px-2 text-right text-stone-400 line-through font-mono">₹{v.mrp}</td>
                                      <td className="py-2 px-2 text-right font-bold text-stone-900 dark:text-white font-mono">₹{v.selling_price}</td>
                                      <td className="py-2 px-2 text-center font-bold">
                                        <span className={v.saleable_stock <= v.reorder_level ? 'text-amber-500 font-mono' : 'text-emerald-600 dark:text-emerald-400 font-mono'}>
                                          {v.saleable_stock}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-center text-rose-500 font-semibold font-mono">{v.damaged_stock}</td>
                                      <td className="py-2 px-2 text-center">
                                        {v.saleable_stock <= 0 ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">Out of Stock</span>
                                        ) : v.saleable_stock <= v.reorder_level ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">Low Stock</span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">In Stock</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-ink-800 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            
            <div className="px-6 py-4 bg-white dark:bg-ink-900 border-b border-ivory-200 dark:border-ink-800 text-stone-900 dark:text-stone-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base tracking-wide">
                {editingProduct ? `Edit Garment: ${editingProduct.name}` : 'Add New Garment Product'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Garment Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Raymond Classic 100% Cotton Formal Shirt"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Brand</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formHsn}
                    onChange={(e) => setFormHsn(e.target.value)}
                    placeholder="e.g. 6109"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">GST Rate (%)</label>
                  <select
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value)}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white"
                  >
                    <option value="5.0">5% GST (Apparel &lt; ₹1,000)</option>
                    <option value="12.0">12% GST (Apparel &gt; ₹1,000)</option>
                    <option value="18.0">18% GST (Accessories & Silk)</option>
                    <option value="0.0">0% Exempt</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="e.g. Slim fit, breathable, structured collar"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="space-y-3 pt-4 border-t border-stone-200 dark:border-ink-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white font-display">
                      Variants Builder (Size + Colour + Unique SKU/Barcode)
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Enforces unique SKU and Barcode per size and colour variant.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="px-3.5 py-1.5 bg-ember-500/10 text-ember-700 dark:text-ember-300 hover:bg-ember-500/20 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formVariants.map((v, idx) => (
                    <div key={idx} className="p-4 bg-ivory-50 dark:bg-ink-850 rounded-2xl border border-stone-200 dark:border-ink-800 grid grid-cols-2 sm:grid-cols-9 gap-2.5 items-end">
                      
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Size *</label>
                        <input
                          type="text"
                          required
                          value={v.size}
                          onChange={(e) => updateVariantRow(idx, 'size', e.target.value)}
                          placeholder="M, L, 32"
                          className="w-full px-2 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-lg text-xs font-bold text-stone-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Colour *</label>
                        <input
                          type="text"
                          required
                          value={v.colour}
                          onChange={(e) => updateVariantRow(idx, 'colour', e.target.value)}
                          placeholder="Navy Blue"
                          className="w-full px-2 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-lg text-xs text-stone-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Unique SKU *</label>
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)}
                          placeholder="SHIRT-M-NAVY"
                          className="w-full px-2 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-lg text-xs font-mono font-semibold text-stone-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Barcode *</label>
                        <input
                          type="text"
                          required
                          value={v.barcode}
                          onChange={(e) => updateVariantRow(idx, 'barcode', e.target.value)}
                          placeholder="8901234567"
                          className="w-full px-2 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-lg text-xs font-mono font-semibold text-stone-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Cost (₹)</label>
                        <input
                          type="number"
                          value={v.purchase_price}
                          onChange={(e) => updateVariantRow(idx, 'purchase_price', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-lg text-xs text-stone-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Sell (₹) *</label>
                        <input
                          type="number"
                          required
                          value={v.selling_price}
                          onChange={(e) => updateVariantRow(idx, 'selling_price', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-lg text-xs font-bold text-stone-900 dark:text-white font-mono"
                        />
                      </div>

                      <div className="flex items-center space-x-1">
                        {!editingProduct && (
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Initial Qty</label>
                            <input
                              type="number"
                              value={v.saleable_stock}
                              onChange={(e) => updateVariantRow(idx, 'saleable_stock', e.target.value)}
                              className="w-full px-1.5 py-1.5 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-lg text-xs text-center font-bold text-stone-900 dark:text-white font-mono"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="p-2 text-stone-400 hover:text-rose-500 transition"
                          title="Remove variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Actions */}
              <div className="pt-4 border-t border-stone-200 dark:border-ink-800 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 dark:border-ink-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-ink-800 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-ember-600 hover:bg-ember-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide shadow-mat-1 hover:shadow-mat-2 transition"
                >
                  {formLoading ? 'Saving Garment...' : editingProduct ? 'Update Garment' : 'Create Garment & Variants'}
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
