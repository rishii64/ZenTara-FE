import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider } from './context/StoreContext';
import ToastContainer from './components/ToastContainer';
import TopProgressBar from './components/TopProgressBar';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import SalesHistory from './pages/SalesHistory';
import Returns from './pages/Returns';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import DailyClosing from './pages/DailyClosing';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import { ShieldAlert } from 'lucide-react';

function AppContent() {
  const { user, hasPermission } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    if (user) {
      if (user.role === 'Cashier' && activePage === 'dashboard') {
        setActivePage('pos');
      } else if (user.role === 'Inventory Staff' && activePage === 'dashboard') {
        setActivePage('products');
      }
    }
  }, [user]);

  // If user is not authenticated, render Login
  if (!user) {
    return <Login />;
  }

  // Guard page navigation against unauthorized access
  const pageModuleMap = {
    dashboard: 'dashboard',
    pos: 'pos',
    sales: 'sales',
    returns: 'returns',
    products: 'products',
    categories: 'categories',
    suppliers: 'suppliers',
    purchases: 'purchases',
    inventory: 'inventory',
    daily_closing: 'daily_closing',
    reports: 'reports',
    users: 'users',
    settings: 'settings'
  };

  const currentModule = pageModuleMap[activePage] || 'dashboard';
  const isPermitted = hasPermission(currentModule);

  return (
    <div className="h-screen bg-ivory-100 dark:bg-ink-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200 overflow-hidden">
      {/* Top Navbar (Fixed 4rem/64px) */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Container with Fixed Left Sidebar + Scrollable Right Content */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Right Scrollable Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full focus:outline-none">
          <div className="max-w-7xl mx-auto w-full pb-16">
            {!isPermitted ? (
              <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ivory-300/80 dark:border-ink-800 text-center space-y-4 max-w-md mx-auto my-12 shadow-mat-1 dark:shadow-mat-dark-1">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">Access Restricted</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Your current role (<strong>{user.role}</strong>) does not have access permissions for this module.
                </p>
                <button
                  onClick={() => setActivePage(user.role === 'Cashier' ? 'pos' : 'dashboard')}
                  className="px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white rounded-xl text-xs font-bold transition shadow-mat-1 hover:shadow-mat-2"
                >
                  Go to Allowed Module
                </button>
              </div>
            ) : (
              <>
                {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
                {activePage === 'pos' && <POS />}
                {activePage === 'sales' && <SalesHistory />}
                {activePage === 'returns' && <Returns />}
                {activePage === 'products' && <Products />}
                {activePage === 'categories' && <Categories />}
                {activePage === 'suppliers' && <Suppliers />}
                {activePage === 'purchases' && <Purchases />}
                {activePage === 'inventory' && <Inventory />}
                {activePage === 'daily_closing' && <DailyClosing />}
                {activePage === 'reports' && <Reports />}
                {activePage === 'users' && <Users />}
                {activePage === 'settings' && <Settings />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <TopProgressBar />
            <ToastContainer />
            <AppContent />
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
