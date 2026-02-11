const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'gogomarket',
  logging: console.log,
});

const { v4: uuidv4 } = require('uuid');

async function setupCategories() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully!');

    // Create categories table if it doesn't exist
    console.log('Creating categories table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        name_ru VARCHAR(100),
        name_uz VARCHAR(100),
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        description_ru TEXT,
        description_uz TEXT,
        icon VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);');

    console.log('Table created successfully!');

    // Insert categories
    console.log('Inserting categories...');
    
    const categories = [
      { name: 'Electronics', name_ru: 'Электроника', name_uz: 'Elektronika', slug: 'electronics', icon: '📱', sort_order: 1 },
      { name: 'Clothing', name_ru: 'Одежда', name_uz: 'Kiyim', slug: 'clothing', icon: '👕', sort_order: 2 },
      { name: 'Footwear', name_ru: 'Обувь', name_uz: 'Oyoq kiyim', slug: 'footwear', icon: '👟', sort_order: 3 },
      { name: 'Home & Garden', name_ru: 'Дом и сад', name_uz: 'Uy va bog\'', slug: 'home-garden', icon: '🏠', sort_order: 4 },
      { name: 'Automotive', name_ru: 'Авто', name_uz: 'Avtomobil', slug: 'automotive', icon: '🚗', sort_order: 5 },
      { name: 'Beauty & Health', name_ru: 'Красота и здоровье', name_uz: 'Go\'zallik va sog\'liqni saqlash', slug: 'beauty-health', icon: '💄', sort_order: 6 },
      { name: 'Kids Products', name_ru: 'Детские товары', name_uz: 'Bolalar mahsulotlari', slug: 'kids-products', icon: '🧸', sort_order: 7 },
      { name: 'Sports', name_ru: 'Спорт', name_uz: 'Sport', slug: 'sports', icon: '⚽', sort_order: 8 },
      { name: 'Food & Beverages', name_ru: 'Еда и напитки', name_uz: 'Oziq-ovqat va ichimliklar', slug: 'food-beverages', icon: '🍕', sort_order: 9 },
      { name: 'Other', name_ru: 'Другое', name_uz: 'Boshqa', slug: 'other', icon: '📦', sort_order: 10 },
    ];

    for (const category of categories) {
      await sequelize.query(`
        INSERT INTO categories (name, name_ru, name_uz, slug, icon, is_active, sort_order, created_at, updated_at)
        VALUES (:name, :name_ru, :name_uz, :slug, :icon, true, :sort_order, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING;
      `, {
        replacements: category
      });
      console.log(`Inserted category: ${category.name}`);
    }

    console.log('Categories setup completed successfully!');
    
    // Verify insertion
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM categories;');
    console.log(`Total categories in database: ${results[0].count}`);

  } catch (error) {
    console.error('Error setting up categories:', error);
  } finally {
    await sequelize.close();
  }
}

setupCategories();