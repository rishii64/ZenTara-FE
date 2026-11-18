import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'ZENTARA',
    tagline: 'Premium Retail Garment & Fashion Flagship',
    address_line1: '',
    city_state_zip: '',
    phone: '',
    email: '',
    gstin: '',
    receipt_footer: '',
    currency_symbol: '₹',
    reorder_threshold: '5'
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && Object.keys(data).length > 0) {
        setStoreSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Could not load store settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    await api.updateSettings(newSettings);
    setStoreSettings(prev => ({ ...prev, ...newSettings }));
  };

  const storeName = storeSettings.store_name?.trim() || 'ZENTARA';

  return (
    <StoreContext.Provider value={{
      storeSettings,
      setStoreSettings,
      storeName,
      updateSettings,
      refreshSettings: loadSettings,
      loading
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
