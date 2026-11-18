import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../context/StoreContext';
import { toast } from '../context/ToastContext';
import { 
  Sparkles,
  User, 
  LogOut, 
  Clock, 
  ShieldCheck, 
  Store,
  Sun,
  Moon,
  Menu,
  Layers
} from 'lucide-react';

export default function Navbar({ 
  activePage, 
  setActivePage, 
  sidebarCollapsed, 
  setSidebarCollapsed,
  mobileMenuOpen,
  setMobileMenuOpen 
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { storeName, storeSettings } = useStore();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    toast.info('Logged out of ZENTARA');
    logout();
  };

  return (
    <header className="bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border-b border-ivory-300/80 dark:border-ink-800 text-stone-900 dark:text-stone-100 flex-shrink-0 h-16 z-20 transition-colors duration-200 no-print shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Left: Brand Identity & Toggle */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-ivory-100 dark:hover:bg-ink-800 rounded-xl transition lg:hidden"
            title="Toggle Navigation Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group select-none" 
            onClick={() => setActivePage('dashboard')}
          >
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-ember-700 via-ember-600 to-saffron-600 flex items-center justify-center shadow-md shadow-ember-600/20 group-hover:scale-105 transition-all duration-300">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-ink-900"></div>
            </div>
            
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-stone-900 dark:text-stone-100">
                  {storeName}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full bg-ember-50 dark:bg-ember-950/60 text-ember-700 dark:text-ember-300 border border-ember-200 dark:border-ember-800/60">
                  RETAIL ERP
                </span>
              </div>
              <div className="text-[10px] font-medium text-stone-500 dark:text-stone-400 tracking-wide flex items-center space-x-1">
                <span>by</span>
                <span className="font-semibold text-stone-700 dark:text-stone-300">ZENTELEX</span>
                <span className="hidden sm:inline text-stone-300 dark:text-stone-600">•</span>
                <span className="hidden sm:inline display-italic">
                  {storeSettings?.tagline || 'Textile & Garment Counter'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Digital Clock with Material styling */}
        <div className="hidden md:flex items-center space-x-2 text-xs text-stone-600 dark:text-stone-400 bg-ivory-100/80 dark:bg-ink-850 px-3.5 py-1.5 rounded-full border border-ivory-300/80 dark:border-ink-700/60 font-mono shadow-xs">
          <Clock className="w-3.5 h-3.5 text-ember-600 dark:text-ember-400" />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <span className="text-stone-300 dark:text-stone-600">|</span>
          <span className="text-stone-900 dark:text-stone-200 font-bold">{currentTime}</span>
        </div>

        {/* Right: Actions, Theme Toggle, Role Switcher, Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-ivory-100/80 dark:bg-ink-850 border border-ivory-300/80 dark:border-ink-700/60 text-stone-700 dark:text-stone-200 hover:border-ember-500/40 transition-all shadow-xs"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-ember-600" />
                <span className="text-xs font-semibold hidden md:inline">Dark</span>
              </>
            )}
          </button>

          {/* Static Role Indicator Badge */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-ivory-100/80 dark:bg-ink-850 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-ivory-300/80 dark:border-ink-700/60 shadow-xs text-stone-800 dark:text-stone-200">
            <ShieldCheck className="w-3.5 h-3.5 text-ember-600 dark:text-ember-400" />
            <span className="hidden sm:inline text-stone-500 dark:text-stone-400 font-normal">Role:</span>
            <span className="text-ember-700 dark:text-ember-300 font-bold">{user?.role}</span>
          </div>

          {/* User Profile Chip */}
          <div className="flex items-center space-x-2 pl-1.5 sm:pl-2 pr-2 sm:pr-2.5 py-1 rounded-xl bg-ivory-100/80 dark:bg-ink-850 border border-ivory-300/80 dark:border-ink-700/60">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-ember-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden xl:block leading-none">
              <div className="text-xs font-bold text-stone-800 dark:text-stone-100 leading-tight">
                {user?.full_name?.split(' ')[0]}
              </div>
              <div className="text-[10px] text-stone-400">
                {user?.role}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 sm:p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
            title="Log out of ZENTARA"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
