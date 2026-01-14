const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock data
const mockCategories = [
  { id: 1, name: 'Electronics', description: 'Electronic devices and gadgets', image_url: null },
  { id: 2, name: 'Fashion', description: 'Clothing and accessories', image_url: null },
  { id: 3, name: 'Home', description: 'Home and garden products', image_url: null },
];

const mockProducts = [
  {
    id: 1,
    name: 'Smartphone',
    description: 'Latest model smartphone',
    price: 500,
    category_id: 1,
    image_url: null,
    stock_quantity: 10,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'T-Shirt',
    description: 'Cotton t-shirt',
    price: 20,
    category_id: 2,
    image_url: null,
    stock_quantity: 50,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock API server running' });
});

// Categories
app.get('/api/v1/categories', (req, res) => {
  res.json({ data: mockCategories });
});

app.get('/api/v1/categories/:id', (req, res) => {
  const category = mockCategories.find(c => c.id === parseInt(req.params.id));
  if (category) {
    res.json({ data: category });
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

// Products
app.get('/api/v1/products', (req, res) => {
  res.json({ data: mockProducts });
});

app.get('/api/v1/products/:id', (req, res) => {
  const product = mockProducts.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json({ data: product });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Auth
app.post('/api/v1/auth/login', (req, res) => {
  res.json({
    data: {
      access_token: 'mock-token-' + Date.now(),
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'user@example.com',
        full_name: 'Mock User',
        role: 'customer',
      },
    },
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  res.json({
    data: {
      access_token: 'mock-token-' + Date.now(),
      token_type: 'bearer',
      user: {
        id: 2,
        email: req.body.email || 'newuser@example.com',
        full_name: req.body.full_name || 'New User',
        role: 'customer',
      },
    },
  });
});

app.get('/api/v1/auth/me', (req, res) => {
  res.json({
    data: {
      id: 1,
      email: 'user@example.com',
      full_name: 'Mock User',
      role: 'customer',
    },
  });
});

// Cart
app.get('/api/v1/cart', (req, res) => {
  res.json({ data: [] });
});

app.post('/api/v1/cart', (req, res) => {
  res.json({
    data: {
      id: Date.now(),
      product_id: req.body.product_id,
      quantity: req.body.quantity,
      product: mockProducts[0],
    },
  });
});

// Orders
app.get('/api/v1/orders', (req, res) => {
  res.json({ data: [] });
});

app.post('/api/v1/orders', (req, res) => {
  res.json({
    data: {
      id: Date.now(),
      status: 'pending',
      total_amount: 100,
      delivery_address: req.body.delivery_address,
      created_at: new Date().toISOString(),
      items: [],
    },
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✓ Mock API server running on http://localhost:${PORT}`);
  console.log(`✓ API endpoint: http://localhost:${PORT}/api/v1`);
});
