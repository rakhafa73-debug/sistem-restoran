import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/server/db.ts';
import { CreateOrderSchema, KitchenStatusUpdateSchema, ProcessPaymentSchema } from './src/lib/utils.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Simple Auth & Session Token Simulation (In-Memory Bearer tokens)
const activeSessions = new Map<string, { userId: string; role: string; name: string }>();

// Seed default sessions for easy staff switching
const defaultStaffTokens = {
  admin: 'token-admin-session-xyz',
  kitchen: 'token-kitchen-session-xyz',
  cashier: 'token-cashier-session-xyz',
};

const adminUser = db.getProfileByEmail('admin@dineqr.com')!;
const kitchenUser = db.getProfileByEmail('kitchen@dineqr.com')!;
const cashierUser = db.getProfileByEmail('cashier@dineqr.com')!;

if (adminUser) activeSessions.set(defaultStaffTokens.admin, { userId: adminUser.id, role: adminUser.role, name: adminUser.name });
if (kitchenUser) activeSessions.set(defaultStaffTokens.kitchen, { userId: kitchenUser.id, role: kitchenUser.role, name: kitchenUser.name });
if (cashierUser) activeSessions.set(defaultStaffTokens.cashier, { userId: cashierUser.id, role: cashierUser.role, name: cashierUser.name });

// Middleware: Extract staff session if present
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  let session: { userId: string; role: string; name: string } | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    session = activeSessions.get(token);

    // Fallback: Resolve token if token contains role prefix (e.g. across server restart)
    if (!session) {
      if (token.includes('admin')) {
        const u = db.getProfileByEmail('admin@dineqr.com');
        if (u) session = { userId: u.id, role: u.role, name: u.name };
      } else if (token.includes('kitchen')) {
        const u = db.getProfileByEmail('kitchen@dineqr.com');
        if (u) session = { userId: u.id, role: u.role, name: u.name };
      } else if (token.includes('cashier')) {
        const u = db.getProfileByEmail('cashier@dineqr.com');
        if (u) session = { userId: u.id, role: u.role, name: u.name };
      }
    }
  }

  // Fallback: Check role header
  if (!session) {
    const roleHeader = (req.headers['x-staff-role'] || req.headers['x-role']) as string;
    if (roleHeader && ['admin', 'kitchen', 'cashier'].includes(roleHeader)) {
      const u = db.getProfileByEmail(`${roleHeader}@dineqr.com`);
      if (u) session = { userId: u.id, role: u.role, name: u.name };
    }
  }

  if (session) {
    (req as unknown as { staff: typeof session }).staff = session;
  }
  next();
}

function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const staff = (req as unknown as { staff?: { userId: string; role: string; name: string } }).staff;
    if (!staff || !allowedRoles.includes(staff.role)) {
      return res.status(403).json({ error: 'Akses ditolak: Izin tidak mencukupi untuk peran ini.' });
    }
    next();
  };
}

app.use(authMiddleware);

// ==========================================
// 1. PUBLIC APIS (CUSTOMER & QR TABLE)
// ==========================================

// Validate QR table token and return table info
app.get('/api/public/tables/:token', (req, res) => {
  const { token } = req.params;
  const table = db.getTableByToken(token);
  const restaurant = db.getRestaurant();

  if (!table) {
    return res.status(404).json({ error: 'Kode QR Meja tidak valid atau meja sedang non-aktif.' });
  }

  res.json({
    table: {
      id: table.id,
      table_number: table.table_number,
      capacity: table.capacity,
    },
    restaurant: {
      name: restaurant.name,
      tagline: restaurant.tagline,
      is_open: restaurant.is_open,
      tax_rate_percent: restaurant.tax_rate_percent,
      service_charge_percent: restaurant.service_charge_percent,
    },
  });
});

// Get Public Menu (Categories, Menu items, Variants)
app.get('/api/public/menu', (req, res) => {
  const categories = db.getCategories();
  const items = db.getMenuItems(false);
  const restaurant = db.getRestaurant();

  res.json({
    restaurant,
    categories,
    items,
  });
});

// Create Customer Order from Table QR (Atomic checkout with price recalculation)
app.post('/api/orders', (req, res) => {
  try {
    const validation = CreateOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Data pesanan tidak valid.',
        details: validation.error.format(),
      });
    }

    const order = db.createOrder(validation.data);
    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat.',
      order: {
        id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
        customer_secret_token: order.customer_secret_token,
        status: order.status,
        payment_status: order.payment_status,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        service_charge: order.service_charge,
        total_amount: order.total_amount,
        items: order.items,
        created_at: order.created_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat pesanan.';
    res.status(400).json({ error: message });
  }
});

// Get Order Details (Secured by Customer Secret Token or Staff session)
app.get('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const customerToken = req.headers['x-customer-token'] as string | undefined;
    const staff = (req as unknown as { staff?: { userId: string; role: string; name: string } }).staff;

    const isStaff = !!staff;
    const order = db.getOrderById(id, customerToken, isStaff);

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan atau akses ditolak.' });
    }

    // Return sanitized data for customer vs full for staff
    res.json({ order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Akses ditolak.';
    res.status(403).json({ error: message });
  }
});

// Customer Cancel Request (only if status is confirmed / pending)
app.post('/api/orders/:id/cancel-request', (req, res) => {
  try {
    const { id } = req.params;
    const customerToken = req.headers['x-customer-token'] as string;
    const { reason } = req.body || {};

    if (!customerToken) {
      return res.status(403).json({ error: 'Token akses pelanggan diperlukan.' });
    }

    const cancelledOrder = db.requestOrderCancellation(id, customerToken, reason);
    res.json({ success: true, order: cancelledOrder });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membatalkan pesanan.';
    res.status(400).json({ error: message });
  }
});

// ==========================================
// 2. REAL-TIME SERVER-SENT EVENTS (SSE)
// ==========================================
app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial connected ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  const unsubscribe = db.subscribe((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// ==========================================
// 3. KITCHEN APIS
// ==========================================

// Get Kitchen active orders
app.get('/api/kitchen/orders', requireRole(['kitchen', 'admin']), (req, res) => {
  const orders = db.getKitchenOrders();
  res.json({ orders });
});

// Update order status from kitchen
app.patch('/api/kitchen/orders/:id/status', requireRole(['kitchen', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const validation = KitchenStatusUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const updated = db.updateOrderStatus(id, validation.data.status, staff, validation.data.notes);

    res.json({ success: true, order: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui status pesanan.';
    res.status(400).json({ error: message });
  }
});

// ==========================================
// 4. CASHIER APIS
// ==========================================

// Get Cashier orders queue
app.get('/api/cashier/orders', requireRole(['cashier', 'admin']), (req, res) => {
  const orders = db.getCashierOrders();
  res.json({ orders });
});

// Process Cash Payment
app.post('/api/cashier/orders/:id/payments', requireRole(['cashier', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const validation = ProcessPaymentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Data pembayaran tidak valid.', details: validation.error.format() });
    }

    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const result = db.processPayment(id, validation.data.amount_tendered, {
      id: staff.userId,
      name: staff.name,
      role: staff.role,
    }, validation.data.idempotency_key);

    res.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses pembayaran.';
    res.status(400).json({ error: message });
  }
});

// ==========================================
// 5. ADMIN APIS
// ==========================================

// Admin Reports
app.get('/api/admin/reports', requireRole(['admin']), (req, res) => {
  const report = db.getAdminReports();
  res.json({ report });
});

// Admin Tables
app.get('/api/admin/tables', requireRole(['admin']), (req, res) => {
  const tables = db.getTables();
  res.json({ tables });
});

app.post('/api/admin/tables', requireRole(['admin']), (req, res) => {
  try {
    const { table_number, capacity } = req.body;
    if (!table_number) return res.status(400).json({ error: 'Nomor meja wajib diisi.' });
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const table = db.createTable(table_number, Number(capacity) || 4, staff);
    res.status(201).json({ table });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat meja.';
    res.status(400).json({ error: message });
  }
});

app.put('/api/admin/tables/:id', requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const updated = db.updateTable(id, req.body, staff);
    res.json({ table: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengubah meja.';
    res.status(400).json({ error: message });
  }
});

app.post('/api/admin/tables/:id/regenerate-qr', requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const updated = db.regenerateTableQR(id, staff);
    res.json({ table: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal meregenerasi token QR.';
    res.status(400).json({ error: message });
  }
});

// Admin Menu
app.get('/api/admin/menu', requireRole(['admin']), (req, res) => {
  const menuItems = db.getMenuItems(true);
  res.json({ menuItems });
});

app.post('/api/admin/menu', requireRole(['admin']), (req, res) => {
  try {
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const item = db.createMenuItem(req.body, staff);
    res.status(201).json({ item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat menu.';
    res.status(400).json({ error: message });
  }
});

app.put('/api/admin/menu/:id', requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const item = db.updateMenuItem(id, req.body, staff);
    res.json({ item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengubah menu.';
    res.status(400).json({ error: message });
  }
});

app.delete('/api/admin/menu/:id', requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    db.deleteMenuItem(id, staff);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus menu.';
    res.status(400).json({ error: message });
  }
});

// Admin Categories
app.get('/api/admin/categories', requireRole(['admin']), (req, res) => {
  const categories = db.getCategories();
  res.json({ categories });
});

app.post('/api/admin/categories', requireRole(['admin']), (req, res) => {
  try {
    const { name, icon } = req.body;
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const cat = db.createCategory(name, icon || 'UtensilsCrossed', staff);
    res.status(201).json({ category: cat });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat kategori.';
    res.status(400).json({ error: message });
  }
});

// Admin Staff Management
app.get('/api/admin/staff', requireRole(['admin']), (req, res) => {
  const profiles = db.getProfiles();
  res.json({ profiles });
});

app.post('/api/admin/staff', requireRole(['admin']), (req, res) => {
  try {
    const { name, email, role } = req.body;
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const profile = db.createProfile(name, email, role, staff);
    res.status(201).json({ profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat staf.';
    res.status(400).json({ error: message });
  }
});

// Admin Settings
app.get('/api/admin/settings', requireRole(['admin']), (req, res) => {
  const restaurant = db.getRestaurant();
  res.json({ restaurant });
});

app.put('/api/admin/settings', requireRole(['admin']), (req, res) => {
  try {
    const staff = (req as unknown as { staff: { userId: string; role: string; name: string } }).staff;
    const updated = db.updateRestaurant(req.body, staff);
    res.json({ restaurant: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui pengaturan.';
    res.status(400).json({ error: message });
  }
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', requireRole(['admin']), (req, res) => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});

// ==========================================
// 6. AUTHENTICATION (STAFF LOGIN / SWITCH)
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.getProfileByEmail(email);

  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Email atau kata sandi tidak valid.' });
  }

  // Demo password 'dineqr123' check
  if (password !== 'dineqr123') {
    return res.status(401).json({ error: 'Kata sandi salah. Gunakan: dineqr123' });
  }

  // Issue session token
  const token = `token-${user.role}-${Date.now()}`;
  activeSessions.set(token, {
    userId: user.id,
    role: user.role,
    name: user.name,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  const staff = (req as unknown as { staff?: { userId: string; role: string; name: string } }).staff;
  if (!staff) {
    return res.status(401).json({ user: null });
  }
  const user = db.getProfileById(staff.userId);
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// ==========================================
// 7. VITE INTEGRATION & SERVER STARTUP
// ==========================================
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`DineQR Full-Stack Server running on port ${PORT} [Mode: ${isProd ? 'Production' : 'Development'}]`);
  });
}

startServer();
