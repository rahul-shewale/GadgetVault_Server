/**
 * Seeder: npm run seed
 * Creates all tables via Sequelize sync, then seeds categories and products.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { sequelize, User, Category, Product } = require('../models');

const categories = [
  { name: 'Smartphones' },
  { name: 'Laptops' },
  { name: 'Audio' },
  { name: 'Accessories' },
];

const products = [
  // Smartphones
  { name: 'iPhone 15 128GB',        price: 79999,  category: 'Smartphones' },
  { name: 'Samsung Galaxy S24',      price: 74999,  category: 'Smartphones' },
  { name: 'OnePlus 12',             price: 64999,  category: 'Smartphones' },
  // Laptops
  { name: 'MacBook Air M2',         price: 114900, category: 'Laptops' },
  { name: 'Dell XPS 15',            price: 124999, category: 'Laptops' },
  { name: 'Lenovo ThinkPad E14',    price: 58999,  category: 'Laptops' },
  // Audio
  { name: 'Sony WH-1000XM5',       price: 26990,  category: 'Audio' },
  { name: 'boAt Airdopes 141',      price: 1299,   category: 'Audio' },
  { name: 'JBL Flip 6',            price: 11999,  category: 'Audio' },
  // Accessories
  { name: 'Anker 65W Charger',      price: 2499,   category: 'Accessories' },
  { name: 'Belkin USB-C Hub',       price: 4999,   category: 'Accessories' },
  { name: 'Logitech MX Master 3',   price: 9995,   category: 'Accessories' },
];

async function seed() {
  try {
    // Sync all models — creates tables if they don't exist
    await sequelize.sync({ alter: true });
    console.log('Tables synced');

    // Create a default admin user
    const existing = await User.scope('withPassword').findOne({ where: { email: 'admin@gadgetvault.com' } });
    if (!existing) {
      await User.create({ email: 'admin@gadgetvault.com', password: 'admin123' });
      console.log('Admin user created — email: admin@gadgetvault.com, password: admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Seed categories
    const createdCategories = {};
    for (const cat of categories) {
      const [category] = await Category.findOrCreate({ where: { name: cat.name } });
      createdCategories[cat.name] = category;
      console.log(`Category: ${cat.name} (${category.unique_id})`);
    }

    // Seed products
    for (const p of products) {
      const category = createdCategories[p.category];
      const [product, created] = await Product.findOrCreate({
        where: { name: p.name },
        defaults: {
          price: p.price,
          category_id: category.id,
        },
      });
      if (created) console.log(`Product: ${p.name} — ₹${p.price}`);
      else console.log(`Product exists: ${p.name}`);
    }

    console.log('\nSeeding complete! GadgetVault is ready.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
