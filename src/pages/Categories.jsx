import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { Layers, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function Categories() {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  const [catError, setCatError] = useState('');
  const [brandError, setBrandError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([api.getCategories(), api.getBrands()]);
      setCategories(c);
      setBrands(b);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatError('');
    try {
      await api.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      toast.success(`Category "${newCatName.trim()}" created`, 'Category Added');
      setNewCatName('');
      setNewCatDesc('');
      loadData();
    } catch (err) {
      setCatError(err.message);
      toast.error(err.message || 'Could not create category', 'Category Error');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      try {
        await api.deleteCategory(id);
        toast.success(`Deleted category "${name}"`, 'Category Removed');
        loadData();
      } catch (err) {
        toast.error(err.message || 'Could not delete category', 'Delete Error');
      }
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setBrandError('');
    try {
      await api.createBrand({ name: newBrandName.trim() });
      toast.success(`Brand "${newBrandName.trim()}" created`, 'Brand Added');
      setNewBrandName('');
      loadData();
    } catch (err) {
      setBrandError(err.message);
      toast.error(err.message || 'Could not create brand', 'Brand Error');
    }
  };

  const handleDeleteBrand = async (id, name) => {
    if (window.confirm(`Delete brand "${name}"?`)) {
      try {
        await api.deleteBrand(id);
        toast.success(`Deleted brand "${name}"`, 'Brand Removed');
        loadData();
      } catch (err) {
        toast.error(err.message || 'Could not delete brand', 'Delete Error');
      }
    }
  };

  const canManage = user?.role === 'Admin' || user?.role === 'Inventory Staff';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-ink-900 p-6 sm:p-7 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 transition-colors">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center space-x-2 font-display">
          <Layers className="w-6 h-6 text-ember-600 dark:text-ember-400" />
          <span>Garment Categories & Brands</span>
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Organize apparel items by garment categories and fashion brands.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Brands Section */}
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4 transition-colors">
          <h3 className="font-bold text-sm text-stone-900 dark:text-white border-b border-stone-100 dark:border-ink-800 pb-2 font-display">
            Fashion Brands ({brands.length})
          </h3>

          {canManage && (
            <form onSubmit={handleAddBrand} className="space-y-3 bg-ivory-50 dark:bg-ink-850 p-4 rounded-2xl border border-stone-200/80 dark:border-ink-700">
              <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Add New Brand</div>
              {brandError && <div className="text-xs text-rose-500">{brandError}</div>}
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Brand Name (e.g. Raymond, Levi's)"
                  className="flex-1 px-3 py-2 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-ember-600 hover:bg-ember-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Brand</span>
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-stone-100 dark:divide-ink-800">
            {brands.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                <div className="font-bold text-stone-900 dark:text-white">{b.name}</div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ivory-100 dark:bg-ink-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-ink-700">
                    {b.product_count} products
                  </span>
                  {user?.role === 'Admin' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(b.id, b.name)}
                      className="p-1 text-stone-400 hover:text-rose-500 transition"
                      title="Delete brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-stone-200/90 dark:border-ink-800 shadow-mat-1 dark:shadow-mat-dark-1 p-6 space-y-4 transition-colors">
          <h3 className="font-bold text-sm text-stone-900 dark:text-white border-b border-stone-100 dark:border-ink-800 pb-2 font-display">
            Garment Categories ({categories.length})
          </h3>

          {canManage && (
            <form onSubmit={handleAddCategory} className="space-y-3 bg-ivory-50 dark:bg-ink-850 p-4 rounded-2xl border border-stone-200/80 dark:border-ink-700">
              <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Add New Category</div>
              {catError && <div className="text-xs text-rose-500">{catError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name (e.g. Ethnic Wear)"
                  className="px-3 py-2 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                />
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Description (Optional)"
                  className="px-3 py-2 bg-white dark:bg-ink-900 border border-stone-300 dark:border-ink-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ember-500/30"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-ember-600 hover:bg-ember-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Category</span>
              </button>
            </form>
          )}

          <div className="divide-y divide-stone-100 dark:divide-ink-800">
            {categories.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-900 dark:text-white">{c.name}</div>
                  <div className="text-[10px] text-stone-400">{c.description || 'No description'}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ivory-100 dark:bg-ink-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-ink-700">
                    {c.product_count} products
                  </span>
                  {user?.role === 'Admin' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="p-1 text-stone-400 hover:text-rose-500 transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>

    </div>
  );
}
