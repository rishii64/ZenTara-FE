# Zen Garments Retail Billing & Inventory Management System (MVP)

A web-based retail billing and inventory management application tailored specifically for retail garments and apparel stores, built strictly following the **Garments Retail MVP Workflow & Development Scope (SOW)**.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v18+ (Tested & verified on Node v24)
- **Web Browser**: Chrome, Edge, Firefox, or Safari
- **Hardware (Optional for retail counter)**: USB / Bluetooth Barcode Scanner and 80mm POS Thermal Receipt Printer

### Run the Application
From the project root:
```bash
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your web browser.

> The Express backend serves both the REST API and the compiled React single-page frontend.

---

## 2. Pre-Configured Demo Accounts (Roles & Permissions)

The application comes pre-seeded with test accounts for each of the four MVP roles (with 1-click login buttons on the login screen):

| Role | Username | Password | Full Name | Primary MVP Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Rajesh Verma | Full system access; user creation, RBAC, store tax & GST settings, all modules |
| **Store Manager** | `manager` | `manager123` | Priya Sharma | Performance dashboard, sales/inventory reports, voiding bills, stock adjustments, daily closing approval |
| **Inventory Staff** | `inventory` | `inventory123` | Arun Kumar | Garment product catalog, size/colour variants, categories, brands, supplier purchase inward & goods verification |
| **Cashier** | `cashier` | `cashier123` | Sneha Patel | High-speed POS counter, barcode scanning, payments, 80mm thermal receipts, customer returns & drawer count |

---

## 3. End-to-End Business Workflows Implemented

### 1. Product Master & Multi-Variant Engine
- Garment products with attributes: Category, Brand, HSN Code (default `6109`), GST Rate (5% / 12% / 18%), Description.
- Multi-variant management: Size (e.g. `39 (M)`, `40 (L)`, `32`, `34`), Colour, SKU, Barcode, Purchase Cost, MRP, Selling Price, and Reorder Level.
- **Strict Rule**: Each variant (`Product + Size + Colour`) enforces a unique SKU and unique Barcode in the database.

### 2. Purchase Entry & Stock Inward
- Record supplier invoice, invoice date, supplier selection.
- Received quantity verification with **Accepted Quantity** vs **Damaged / Rejected Quantity**.
- **Critical Business Rule**: Only accepted units increase *saleable* inventory. Damaged items are quarantined into a separate damaged stock bucket.

### 3. High-Speed POS Billing & Checkout
- **Barcode Scanner First**: Focused scanner input box accepts keyboard emulation from USB/Bluetooth handheld barcode guns with auto-add on scan.
- Catalog browser modal with live stock level indicator.
- Live stock validation: Prevents selling more than available saleable stock.
- Subtotal, line discounts, bill discounts (with role validation), GST calculations (CGST + SGST), and round-off.
- Multi-mode payment support: Cash (with Cash Tendered & Change Return calculator), UPI (with QR code simulation), Card, and Split.
- Atomic stock decrement upon successful checkout.

### 4. Thermal Receipt & Tax Invoice Printing
- **80mm POS Thermal Receipt**: Optimized for standard thermal receipt printers with store header, GSTIN, invoice number, cashier name, itemized table, GST breakdown, and store return policy.
- **Standard A4 Tax Invoice**: Toggle for full A4 corporate invoice printing.
- Clean `@media print` CSS styling for `window.print()`.

### 5. Customer Return & Exchange Workflow
- Search and verify original retail invoice.
- Displays eligible return quantities (preventing returning more units than originally purchased).
- Garment inspection status:
  - **Saleable**: Restocked back to active saleable shelf inventory.
  - **Damaged**: Routed to separate defective stock status.
- Return Options:
  - **Refund**: Cash, UPI, or store credit note.
  - **Exchange**: Select replacement garments from catalog, calculates net price difference (customer pays difference or store refunds difference).

### 6. Daily Closing & Cash Drawer Reconciliation
- Computes real-time sales aggregates by payment mode (Cash, UPI, Card).
- Interactive physical currency denomination counter (₹500, ₹200, ₹100, ₹50, ₹20, ₹10, coins).
- Automatic variance calculation (`Physical Cash - Expected Cash in Drawer`), indicating exact match, cash shortage, or surplus.
- Store Manager review and formal sign-off.

### 7. Inventory Management & Stock Audit Ledger
- Live stock table with saleable units, damaged units, reorder threshold, and status badges (`Available`, `Low Stock`, `Out of Stock`).
- Full immutable Stock Ledger audit trail tracking who performed each action, when, and the stock before & after.
- Manual stock adjustment capability for Admin and Store Manager with mandatory audit reason.

### 8. Reports & Analytics
- Daily and Monthly sales performance report with GST tax breakdowns.
- Current inventory stock valuation at cost and retail value.
- Supplier purchase spend report.
- Returns and refunds report.
- One-click **Export to CSV** for all tabular reports.

---

## 4. Technical Architecture

- **Backend**: Node.js v24 + Express.js
- **Database**: SQLite with `DatabaseSync`, WAL journaling, and foreign key integrity.
- **Authentication**: JWT tokens with bcrypt password hashing and Role-Based Access Control (RBAC).
- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide React icons.
- **Print Support**: Native browser print with dedicated thermal receipt styling.

---

## 5. Development Mode (Optional)

If modifying frontend components with Vite hot module replacement (HMR):
```bash
# Terminal 1: Backend API Server
cd backend
npm run dev

# Terminal 2: Vite Dev Server
cd frontend
npm run dev
```
Vite runs at `http://localhost:5173` with automatic API proxying to port `5000`.
