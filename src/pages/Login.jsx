import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from '../context/ToastContext';
import { 
  Lock, 
  User, 
  ArrowRight, 
  Sun, 
  Moon,
  Layers,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Login() {
  const { login, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    try {
      const loggedInUser = await login(username.trim(), password);
      toast.success(`Welcome back, ${loggedInUser?.full_name || username}!`, `Signed in as ${loggedInUser?.role}`);
    } catch (err) {
      const msg = err.message || 'Login failed. Please verify credentials.';
      setError(msg);
      toast.error(msg, 'Authentication Error');
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-ink-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 relative overflow-hidden transition-colors duration-200">
      
      {/* Ambient warm textile glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] bg-ember-500/10 dark:bg-ember-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-saffron-500/10 dark:bg-saffron-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white dark:bg-ink-900 border border-stone-200 dark:border-ink-700/70 shadow-mat-1 text-stone-700 dark:text-stone-200 hover:border-ember-500/40 transition-all"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-ember-600" />
              <span className="text-xs font-semibold">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Logo icon */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-ember-700 via-ember-600 to-saffron-600 items-center justify-center shadow-lg shadow-ember-600/25 mb-3 group hover:scale-105 transition-all">
          <Layers className="w-7 h-7 text-white" />
        </div>
        
        {/* Editorial Fraunces serif brand heading */}
        <h1 className="text-4xl font-extrabold tracking-tight font-display text-stone-900 dark:text-white">
          ZENTARA
        </h1>
        
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
          by <span className="text-ember-600 dark:text-ember-400 font-bold">ZENTELEX</span> — <span className="display-italic normal-case tracking-normal text-sm">Retail Garment & POS ERP</span>
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-ink-900 border border-stone-200/90 dark:border-ink-700/70 py-8 px-6 shadow-mat-2 dark:shadow-mat-dark-2 rounded-3xl sm:px-9 transition-colors">
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Staff Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ember-500/30 focus:border-ember-600 transition"
                  placeholder="Enter staff username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-ivory-50 dark:bg-ink-850 border border-stone-300 dark:border-ink-700 rounded-xl text-stone-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ember-500/30 focus:border-ember-600 transition"
                  placeholder="Enter secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-ember-700 via-ember-600 to-saffron-600 hover:from-ember-800 hover:to-ember-600 text-white font-bold rounded-xl text-xs tracking-wide shadow-md shadow-ember-600/25 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Counter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 dark:border-ink-800 flex items-center justify-center space-x-2 text-[11px] text-stone-400 dark:text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Authorized Retail Personnel Only • RBAC Protected</span>
          </div>

        </div>
      </div>
    </div>
  );
}
