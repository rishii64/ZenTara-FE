import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Tag,
  Boxes,
  Truck,
  PackagePlus,
  Layers,
  Calculator,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  sidebarCollapsed, 
  setSidebarCollapsed,
  mobileMenuOpen,
  setMobileMenuOpen 
}) {
  const { user, hasPermission } = useAuth();
  const { storeName } = useStore();

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
        { id: 'pos', label: 'POS Billing Counter', icon: ShoppingCart, module: 'pos', primary: true },
        { id: 'sales', label: 'Sales History', icon: Receipt, module: 'sales' },
        { id: 'returns', label: 'Returns & Exchanges', icon: RotateCcw, module: 'returns' }
      ]
    },
    {
      title: 'INVENTORY & GOODS',
      items: [
        { id: 'categories', label: 'Categories & Brands', icon: Layers, module: 'categories' },
        { id: 'products', label: 'Product Master', icon: Tag, module: 'products' },
        { id: 'suppliers', label: 'Suppliers & Mills', icon: Truck, module: 'suppliers' },
        { id: 'purchases', label: 'Stock Inward (Purchase)', icon: PackagePlus, module: 'purchases' },
        { id: 'inventory', label: 'Stock Ledger & Audit', icon: Boxes, module: 'inventory' }
      ]
    },
    {
      title: 'ACCOUNTS & ADMIN',
      items: [
        { id: 'daily_closing', label: 'Daily Closing / Cash', icon: Calculator, module: 'daily_closing' },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, module: 'reports' },
        { id: 'users', label: 'User & Permissions', icon: Users, module: 'users' },
        { id: 'settings', label: 'Store Configuration', icon: Settings, module: 'settings' }
      ]
    }
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Fixed Sidebar Aside */}
      <aside 
        className={`bg-white dark:bg-ink-900 border-r border-ivory-300/80 dark:border-ink-800 transition-all duration-300 flex flex-col flex-shrink-0 z-50 no-print
          fixed inset-y-0 left-0 h-full lg:static lg:h-full
          ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'w-72 lg:w-64'}
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-ivory-200 dark:border-ink-800 lg:hidden bg-ivory-50/60 dark:bg-ink-950/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ember-700 via-ember-600 to-saffron-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">{storeName}</span>
              <span className="text-[9px] font-bold text-ember-700 dark:text-ember-300 ml-1.5 px-1.5 py-0.5 rounded-full bg-ember-50 dark:bg-ember-950/60">ERP</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto overflow-x-hidden">
          {navSections.map((sec, sIdx) => {
            const visibleItems = sec.items.filter(item => hasPermission(item.module));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {(!sidebarCollapsed || mobileMenuOpen) && (
                  <div className="px-3 text-[10px] font-bold tracking-wider text-stone-400 dark:text-stone-500 uppercase mb-2">
                    {sec.title}
                  </div>
                )}

                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      title={sidebarCollapsed && !mobileMenuOpen ? item.label : undefined}
                      className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                        sidebarCollapsed && !mobileMenuOpen ? 'justify-center p-3' : 'space-x-3 px-3.5 py-2.5'
                      } ${
                        isActive
                          ? item.primary
                            ? 'bg-gradient-to-r from-ember-700 to-saffron-600 text-white shadow-md shadow-ember-600/25 font-bold'
                            : 'bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 font-bold border-l-4 border-ember-600'
                          : item.primary
                          ? 'text-ember-700 dark:text-ember-300 bg-ember-50/50 hover:bg-ember-100/60 dark:bg-ember-950/30 dark:hover:bg-ember-950/50 border border-ember-200 dark:border-ember-800/40'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-ivory-100 dark:hover:bg-ink-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${
                        isActive && item.primary ? 'text-white' : ''
                      }`} />
                      
                      {(!sidebarCollapsed || mobileMenuOpen) && (
                        <span className="truncate">{item.label}</span>
                      )}

                      {sidebarCollapsed && !mobileMenuOpen && isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-ember-600 dark:bg-ember-400 rounded-r-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Collapse toggle & role badge footer (Pinned at bottom of fixed sidebar) */}
        <div className="flex-shrink-0 p-3 border-t border-ivory-200 dark:border-ink-800 bg-ivory-50/60 dark:bg-ink-950/60 flex flex-col space-y-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-ink-800 text-xs font-semibold transition"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center space-x-2 w-full justify-between px-2">
                <span className="text-[11px] text-stone-400 dark:text-stone-500">Collapse menu</span>
                <ChevronLeft className="w-4 h-4" />
              </div>
            )}
          </button>

          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-ink-850 border border-ivory-300/80 dark:border-ink-700 text-[11px] text-stone-500 dark:text-stone-400 shadow-xs">
              <div className="flex items-center space-x-1.5 text-stone-800 dark:text-stone-200 font-bold mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-ember-600 dark:text-ember-400" />
                <span>{user?.role}</span>
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-tight">
                Access permissions active.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
