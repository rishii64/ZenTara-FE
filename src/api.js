const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('zen_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function apiRequest(endpoint, method = 'GET', body = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('api-request-start'));
  }

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader()
  };

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
      localStorage.removeItem('zen_token');
      localStorage.removeItem('zen_user');
      window.dispatchEvent(new Event('auth-expired'));
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } finally {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('api-request-end'));
    }
  }
}

export const api = {
  // Auth
  login: (username, password) => apiRequest('/auth/login', 'POST', { username, password }),
  getMe: () => apiRequest('/auth/me'),
  getUsers: () => apiRequest('/auth/users'),
  createUser: (userData) => apiRequest('/auth/users', 'POST', userData),
  updateUser: (id, userData) => apiRequest(`/auth/users/${id}`, 'PUT', userData),

  // Categories & Brands
  getCategories: () => apiRequest('/categories'),
  createCategory: (data) => apiRequest('/categories', 'POST', data),
  updateCategory: (id, data) => apiRequest(`/categories/${id}`, 'PUT', data),
  deleteCategory: (id) => apiRequest(`/categories/${id}`, 'DELETE'),
  getBrands: () => apiRequest('/brands'),
  createBrand: (data) => apiRequest('/brands', 'POST', data),
  deleteBrand: (id) => apiRequest(`/brands/${id}`, 'DELETE'),

  // Suppliers
  getSuppliers: () => apiRequest('/suppliers'),
  getSupplier: (id) => apiRequest(`/suppliers/${id}`),
  createSupplier: (data) => apiRequest('/suppliers', 'POST', data),
  updateSupplier: (id, data) => apiRequest(`/suppliers/${id}`, 'PUT', data),
  deleteSupplier: (id) => apiRequest(`/suppliers/${id}`, 'DELETE'),

  // Products
  getProducts: (params = '') => apiRequest(`/products${params}`),
  getVariants: (params = '') => apiRequest(`/products/variants${params}`),
  getProduct: (id) => apiRequest(`/products/${id}`),
  lookupBarcode: (barcode) => apiRequest(`/products/lookup/${encodeURIComponent(barcode)}`),
  createProduct: (data) => apiRequest('/products', 'POST', data),
  updateProduct: (id, data) => apiRequest(`/products/${id}`, 'PUT', data),
  deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE'),

  // Purchases
  getPurchases: (params = '') => apiRequest(`/purchases${params}`),
  getPurchase: (id) => apiRequest(`/purchases/${id}`),
  createPurchase: (data) => apiRequest('/purchases', 'POST', data),

  // Inventory & Ledger
  getInventory: (params = '') => apiRequest(`/inventory${params}`),
  getLedger: (params = '') => apiRequest(`/inventory/ledger${params}`),
  adjustStock: (data) => apiRequest('/inventory/adjust', 'POST', data),

  // POS & Sales
  checkout: (data) => apiRequest('/pos/checkout', 'POST', data),
  getSales: (params = '') => apiRequest(`/sales${params}`),
  getSale: (id) => apiRequest(`/sales/${id}`),
  cancelSale: (id, data) => apiRequest(`/sales/${id}/cancel`, 'POST', data),

  // Returns & Exchanges
  getReturns: (params = '') => apiRequest(`/returns${params}`),
  verifyInvoiceForReturn: (invoiceNo) => apiRequest(`/returns/verify-invoice/${encodeURIComponent(invoiceNo)}`),
  getReturn: (id) => apiRequest(`/returns/${id}`),
  processReturn: (data) => apiRequest('/returns', 'POST', data),

  // Daily Closing
  getTodayClosingSummary: (date = '') => apiRequest(`/daily-closing/today-summary${date ? `?date=${date}` : ''}`),
  getClosingHistory: () => apiRequest('/daily-closing/history'),
  submitClosing: (data) => apiRequest('/daily-closing', 'POST', data),
  approveClosing: (id) => apiRequest(`/daily-closing/${id}/approve`, 'PUT'),

  // Reports & Dashboard
  getDashboardMetrics: () => apiRequest('/reports/dashboard'),
  getSalesReport: (params = '') => apiRequest(`/reports/sales${params}`),
  getPurchasesReport: (params = '') => apiRequest(`/reports/purchases${params}`),
  getStockReport: (params = '') => apiRequest(`/reports/stock${params}`),
  getReturnsReport: (params = '') => apiRequest(`/reports/returns${params}`),

  // Settings
  getSettings: () => apiRequest('/settings'),
  updateSettings: (data) => apiRequest('/settings', 'POST', data)
};
