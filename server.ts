import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Database
const db = new Database('softrose.db');
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'delivered',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Products
  app.get('/api/products', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM products ORDER BY name');
      const products = stmt.all();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', (req, res) => {
    try {
      const { name, price } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
      }
      const stmt = db.prepare('INSERT INTO products (name, price) VALUES (?, ?)');
      const info = stmt.run(name, price);
      res.json({ id: info.lastInsertRowid, name, price });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add product' });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, price } = req.body;
      const stmt = db.prepare('UPDATE products SET name = ?, price = ? WHERE id = ?');
      stmt.run(name, price, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM products WHERE id = ?');
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Invoices
  app.get('/api/invoices', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC');
      const invoices = stmt.all();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  app.get('/api/invoices/:id', (req, res) => {
    try {
      const { id } = req.params;
      const invoiceStmt = db.prepare('SELECT * FROM invoices WHERE id = ?');
      const invoice = invoiceStmt.get(id);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const itemsStmt = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
      const items = itemsStmt.all(id);

      res.json({ ...invoice, items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoice details' });
    }
  });

  app.post('/api/invoices', (req, res) => {
    const { customer_name, invoice_date, subtotal, tax_rate, tax_amount, total_amount, status, items } = req.body;

    const insertInvoice = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO invoices (customer_name, invoice_date, subtotal, tax_rate, tax_amount, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(customer_name, invoice_date, subtotal, tax_rate, tax_amount, total_amount, status);
      const invoiceId = info.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        itemStmt.run(invoiceId, item.product_name, item.quantity, item.unit_price, item.subtotal);
      }

      return invoiceId;
    });

    try {
      const invoiceId = insertInvoice();
      res.json({ id: invoiceId, success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  });

  app.put('/api/invoices/:id', (req, res) => {
    const { id } = req.params;
    const { customer_name, invoice_date, subtotal, tax_rate, tax_amount, total_amount, status, items } = req.body;

    const updateInvoice = db.transaction(() => {
      // Update Invoice Header
      const stmt = db.prepare(`
        UPDATE invoices 
        SET customer_name = ?, invoice_date = ?, subtotal = ?, tax_rate = ?, tax_amount = ?, total_amount = ?, status = ?
        WHERE id = ?
      `);
      stmt.run(customer_name, invoice_date, subtotal, tax_rate, tax_amount, total_amount, status, id);

      // Delete existing items
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);

      // Insert new items
      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        itemStmt.run(id, item.product_name, item.quantity, item.unit_price, item.subtotal);
      }
    });

    try {
      updateInvoice();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  });

  app.delete('/api/invoices/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if needed, though this env is mostly dev)
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
