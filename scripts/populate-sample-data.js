const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample data arrays
const products = [
  'Chocolate', 'French Fries', 'Milk', 'Mineral Water', 'Spaghetti', 
  'Burgers', 'Eggs', 'Green Tea', 'Tomatoes', 'Turkey', 'Cookies', 
  'Energy Bar', 'Frozen Vegetables', 'Ground Beef', 'Honey', 
  'Olive Oil', 'Pancakes', 'Soup', 'Avocado', 'Shrimp'
];

const genders = ['Male', 'Female'];
const months = ['June', 'July'];

async function populateSampleData() {
  try {
    console.log('Starting to populate sample data...');

    // Create a test user (you'll need to replace this with a real user ID)
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Replace with actual user ID

    // Populate supermarket branches
    console.log('Creating supermarket branches...');
    const supermarketBranches = [];
    for (let i = 1; i <= 50; i++) {
      supermarketBranches.push({
        user_id: testUserId,
        supermarket_id: i.toString(),
        state: 'CA',
        advertisement_spend: Math.random() * 0.3,
        promotion_spend: Math.random() * 0.3,
        administration_spend: Math.random() * 0.3,
        profit: Math.random() * 300 + 50
      });
    }

    const { error: branchesError } = await supabase
      .from('supermarket_branches')
      .upsert(supermarketBranches, { onConflict: 'user_id,supermarket_id' });

    if (branchesError) {
      console.error('Error creating supermarket branches:', branchesError);
      return;
    }

    // Populate customer members
    console.log('Creating customer members...');
    const customerMembers = [];
    for (let i = 1; i <= 100; i++) {
      customerMembers.push({
        user_id: testUserId,
        customer_id: `CUST${String(i).padStart(3, '0')}`,
        gender: genders[Math.floor(Math.random() * genders.length)],
        age: Math.floor(Math.random() * 50) + 20,
        annual_income: Math.floor(Math.random() * 80000) + 20000,
        spending_score: Math.floor(Math.random() * 100) + 1,
        total_purchases: Math.floor(Math.random() * 20) + 1,
        average_order_value: Math.floor(Math.random() * 200) + 50,
        purchase_frequency: Math.floor(Math.random() * 5) + 1,
        last_purchase_date: new Date().toISOString()
      });
    }

    const { error: customersError } = await supabase
      .from('supermarket_customer_members')
      .upsert(customerMembers, { onConflict: 'user_id,customer_id' });

    if (customersError) {
      console.error('Error creating customer members:', customersError);
      return;
    }

    // Populate products
    console.log('Creating products...');
    const productData = [];
    for (let i = 0; i < products.length; i++) {
      productData.push({
        user_id: testUserId,
        product_id: `PROD${String(i + 1).padStart(3, '0')}`,
        product_name: products[i],
        product_category: 'Food',
        price: Math.floor(Math.random() * 50) + 10,
        attributes: {},
        params: {}
      });
    }

    const { error: productsError } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'user_id,product_id' });

    if (productsError) {
      console.error('Error creating products:', productsError);
      return;
    }

    // Populate sentiment analyses
    console.log('Creating sentiment analyses...');
    const sentimentAnalyses = [];
    for (let i = 1; i <= 200; i++) {
      const sentiment = Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral';
      const sentimentScore = sentiment === 'positive' ? Math.random() * 0.5 + 0.5 : 
                            sentiment === 'negative' ? Math.random() * 0.5 - 0.5 : 
                            Math.random() * 0.2 - 0.1;
      
      sentimentAnalyses.push({
        user_id: testUserId,
        sentiment_id: `SENT${String(i).padStart(3, '0')}`,
        customer_id: `CUST${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
        supermarket_id: String(Math.floor(Math.random() * 50) + 1),
        sentiment_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        sentiment_score: sentimentScore,
        confidence_level: Math.random() * 0.3 + 0.7,
        sentiment_category: sentiment,
        input_text: `Sample review text ${i}`,
        sentiment_result: {
          sentiment: sentiment,
          confidence: Math.random() * 0.3 + 0.7,
          key_phrases: ['sample', 'phrase', 'test']
        },
        analysis_type: 'single_text',
        tokens_used: Math.floor(Math.random() * 100) + 50,
        processing_time_ms: Math.floor(Math.random() * 1000) + 100,
        created_at: new Date().toISOString()
      });
    }

    const { error: sentimentError } = await supabase
      .from('sentiment_analyses')
      .upsert(sentimentAnalyses, { onConflict: 'user_id,sentiment_id' });

    if (sentimentError) {
      console.error('Error creating sentiment analyses:', sentimentError);
      return;
    }

    console.log('Sample data populated successfully!');
    console.log(`Created:
    - ${supermarketBranches.length} supermarket branches
    - ${customerMembers.length} customer members
    - ${productData.length} products
    - ${sentimentAnalyses.length} sentiment analyses`);

  } catch (error) {
    console.error('Error populating sample data:', error);
  }
}

// Run the script
populateSampleData(); 