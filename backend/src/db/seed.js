import bcrypt from 'bcryptjs';

const toCount = (row) => Number(row?.count || 0);

export const seedDatabase = async ({
  dbClient,
  isProd,
  saltRounds
}) => {
  console.log('🌱 Checking & Seeding Data (PostgreSQL)...');

  const usersCountRow = await dbClient.get('SELECT count(*) as count FROM users');
  if (toCount(usersCountRow) === 0) {
    const bootstrapUsername = String(process.env.ADMIN_BOOTSTRAP_USERNAME || 'admin').trim() || 'admin';
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || (isProd ? null : '123456');

    if (!bootstrapPassword) {
      throw new Error('Missing ADMIN_BOOTSTRAP_PASSWORD for initial admin seeding');
    }

    const hashedPassword = bcrypt.hashSync(bootstrapPassword, saltRounds);
    await dbClient.run(
      'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
      [bootstrapUsername, hashedPassword, 'admin', 'Super Admin']
    );
    console.log(`   -> Admin created: ${bootstrapUsername}`);
  }

  const settingsCountRow = await dbClient.get('SELECT count(*) as count FROM settings');
  if (toCount(settingsCountRow) === 0) {
    await dbClient.run('INSERT INTO settings (id) VALUES (1)');
    console.log('   -> Default Settings created');
  }

  const categories = ['Laptops', 'Smartphones', 'Headphones', 'Cameras', 'Accessories'];
  for (const cat of categories) {
    await dbClient.run(
      'INSERT INTO categories (name, description) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ?)',
      [cat, `Best ${cat} deals`, cat]
    );
  }

  const productsCountRow = await dbClient.get('SELECT count(*) as count FROM products');
  if (toCount(productsCountRow) === 0) {
    const products = [
      {
        name: 'MacBook Pro M3',
        description: 'Powerful Apple silicon laptop with stunning display and long battery life.',
        base_price: 1999,
        category: 'Laptops',
        stock: 10,
        sku: 'MBP-M3',
        image_url: 'https://placehold.co/600x600?text=MacBook+Pro+M3',
        hover_image_url: 'https://placehold.co/600x600?text=MacBook+Pro+M3+Side'
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultra-portable laptop with InfinityEdge display and premium build.',
        base_price: 1299,
        category: 'Laptops',
        stock: 15,
        sku: 'XPS-13',
        image_url: 'https://placehold.co/600x600?text=Dell+XPS+13',
        hover_image_url: 'https://placehold.co/600x600?text=Dell+XPS+13+Open'
      },
      {
        name: 'iPhone 15 Pro',
        description: 'Titanium design, A17 Pro chip, and pro camera system.',
        base_price: 999,
        category: 'Smartphones',
        stock: 25,
        sku: 'IPH-15',
        image_url: 'https://placehold.co/600x600?text=iPhone+15+Pro',
        hover_image_url: 'https://placehold.co/600x600?text=iPhone+15+Pro+Back'
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Flagship Android phone with brilliant display and AI features.',
        base_price: 899,
        category: 'Smartphones',
        stock: 30,
        sku: 'S24-ULTRA',
        image_url: 'https://placehold.co/600x600?text=Galaxy+S24',
        hover_image_url: 'https://placehold.co/600x600?text=Galaxy+S24+Back'
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise cancellation with premium sound.',
        base_price: 348,
        category: 'Headphones',
        stock: 50,
        sku: 'SNY-WH',
        image_url: 'https://placehold.co/600x600?text=Sony+XM5',
        hover_image_url: 'https://placehold.co/600x600?text=Sony+XM5+Case'
      },
      {
        name: 'Apple AirPods Pro 2',
        description: 'Adaptive audio, active noise cancellation, and spatial sound.',
        base_price: 249,
        category: 'Headphones',
        stock: 60,
        sku: 'APP-AP2',
        image_url: 'https://placehold.co/600x600?text=AirPods+Pro+2',
        hover_image_url: 'https://placehold.co/600x600?text=AirPods+Pro+2+Case'
      },
      {
        name: 'Canon EOS R8',
        description: 'Full-frame mirrorless camera for hybrid photo/video creators.',
        base_price: 1499,
        category: 'Cameras',
        stock: 12,
        sku: 'CAN-R8',
        image_url: 'https://placehold.co/600x600?text=Canon+EOS+R8',
        hover_image_url: 'https://placehold.co/600x600?text=Canon+EOS+R8+Kit'
      },
      {
        name: 'Sony ZV-E10',
        description: 'Compact vlogging camera with excellent autofocus.',
        base_price: 699,
        category: 'Cameras',
        stock: 18,
        sku: 'SNY-ZVE10',
        image_url: 'https://placehold.co/600x600?text=Sony+ZV-E10',
        hover_image_url: 'https://placehold.co/600x600?text=Sony+ZV-E10+Lens'
      },
      {
        name: 'Logitech MX Master 3S',
        description: 'Ergonomic wireless mouse with ultra-precise scrolling.',
        base_price: 99,
        category: 'Accessories',
        stock: 100,
        sku: 'LGT-MX3S',
        image_url: 'https://placehold.co/600x600?text=MX+Master+3S',
        hover_image_url: 'https://placehold.co/600x600?text=MX+Master+3S+Side'
      },
      {
        name: 'Anker 65W GaN Charger',
        description: 'Fast compact charger for laptops and phones.',
        base_price: 59,
        category: 'Accessories',
        stock: 80,
        sku: 'ANK-65W',
        image_url: 'https://placehold.co/600x600?text=Anker+65W',
        hover_image_url: 'https://placehold.co/600x600?text=Anker+65W+Ports'
      },
      {
        name: 'iPad Air 6',
        description: 'Thin, light, powerful tablet with stunning display.',
        base_price: 599,
        category: 'Accessories',
        stock: 35,
        sku: 'IPAD-A6',
        image_url: 'https://placehold.co/600x600?text=iPad+Air+6',
        hover_image_url: 'https://placehold.co/600x600?text=iPad+Air+6+Back',
        has_variants: true,
        variants: [
          { name: '64GB', price: 599, cost_price: 420, stock_quantity: 15, sku: 'IPAD-A6-64' },
          { name: '256GB', price: 749, cost_price: 520, stock_quantity: 20, sku: 'IPAD-A6-256' }
        ]
      }
    ];

    const buildSpecs = (p) => {
      const base = [
        { label: 'Warranty', value: '12 Months' },
        { label: 'Shipping', value: '2-4 Business Days' }
      ];
      if (p.category === 'Laptops') {
        return [
          { label: 'Processor', value: 'Latest Gen' },
          { label: 'Display', value: '13-14 inch' },
          ...base
        ];
      }
      if (p.category === 'Smartphones') {
        return [
          { label: 'Chipset', value: 'Flagship' },
          { label: 'Camera', value: 'Pro Grade' },
          { label: 'Battery', value: 'All-day' },
          ...base
        ];
      }
      if (p.category === 'Headphones') {
        return [
          { label: 'Noise Cancelling', value: 'Active' },
          { label: 'Battery', value: '30+ Hours' },
          ...base
        ];
      }
      if (p.category === 'Cameras') {
        return [
          { label: 'Sensor', value: 'Full Frame' },
          { label: 'Video', value: '4K' },
          ...base
        ];
      }
      return [
        { label: 'Compatibility', value: 'Universal' },
        ...base
      ];
    };

    const productSql = `INSERT INTO products
      (name, description, image_url, hover_image_url, base_price, cost_price, category, stock_quantity, sku, has_variants, is_published, specs_json, seo_title, seo_description, seo_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const variantSql = `INSERT INTO product_variants
      (product_id, name, price, cost_price, stock_quantity, sku)
      VALUES (?, ?, ?, ?, ?, ?)`;

    for (const p of products) {
      const specs = p.specs || buildSpecs(p);
      const seoTitle = p.seo_title || `${p.name} | TechStore`;
      const seoDescription = p.seo_description || String(p.description || '').slice(0, 140);
      const seoKeywords = p.seo_keywords || `${p.category || 'tech'}, ${p.name.split(' ')[0] || ''}, electronics`;

      const inserted = await dbClient.run(
        productSql,
        [
          p.name,
          p.description,
          p.image_url || '',
          p.hover_image_url || '',
          p.base_price,
          p.cost_price ?? Number((Number(p.base_price || 0) * 0.7).toFixed(2)),
          p.category,
          p.stock,
          p.sku,
          p.has_variants ? 1 : 0,
          p.is_published === 0 ? 0 : 1,
          JSON.stringify(specs),
          seoTitle,
          seoDescription,
          seoKeywords
        ]
      );

      if (p.has_variants && Array.isArray(p.variants) && p.variants.length > 0) {
        for (const v of p.variants) {
          await dbClient.run(
            variantSql,
            [
              inserted.lastID,
              v.name,
              v.price,
              v.cost_price ?? Number((Number(v.price || 0) * 0.7).toFixed(2)),
              v.stock_quantity,
              v.sku
            ]
          );
        }
      }
    }
    console.log('   -> Demo products seeded');
  }

  const homePage = await dbClient.get("SELECT id FROM pages WHERE slug = 'home'");
  if (!homePage) {
    const insertedPage = await dbClient.run(
      "INSERT INTO pages (title, slug, is_published) VALUES ('الرئيسية', 'home', 1)"
    );

    const blocks = [
      { type: 'hero', content: { title: 'مرحباً بك في TechStore', subtitle: 'أحدث التقنيات بين يديك', image: '' } },
      { type: 'grid', content: { title: 'أحدث المنتجات', count: 4 } },
      { type: 'text', content: { body: '<p style=\"text-align:center;\">نحن نضمن لك أفضل جودة وأقل سعر.</p>' } }
    ];

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      await dbClient.run(
        'INSERT INTO page_blocks (page_id, type, content, sort_order) VALUES (?, ?, ?, ?)',
        [insertedPage.lastID, block.type, JSON.stringify(block.content), i]
      );
    }
    console.log('   -> Home Page Blocks seeded');
  }

  await dbClient.run("INSERT INTO pages (title, slug, is_published) VALUES ('من نحن', 'about', 1) ON CONFLICT (slug) DO NOTHING");
  await dbClient.run("INSERT INTO pages (title, slug, is_published) VALUES ('تواصل معنا', 'contact', 1) ON CONFLICT (slug) DO NOTHING");
};
