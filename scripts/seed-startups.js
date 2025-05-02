require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables for Supabase connection');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample data for startups
const sampleStartups = [
  {
    name: "EcoTrack",
    slug: "ecotrack",
    description: "EcoTrack provides innovative IoT solutions for environmental monitoring, helping companies reduce their carbon footprint and comply with environmental regulations. Our sensors track air quality, water usage, and energy consumption in real-time, providing actionable insights through our AI-powered dashboard.",
    website_url: "https://ecotrack.example.com",
    founding_date: "2020-03-15",
    employee_count: 12,
    funding_stage: "Seed",
    funding_amount: 750000,
    location: "San Francisco, CA",
    category_id: 12, // CleanTech
    status: "approved",
    tagline: "Sustainable monitoring for a greener future"
  },
  {
    name: "MediSync",
    slug: "medisync",
    description: "MediSync is revolutionizing healthcare with our seamless EMR (Electronic Medical Records) system. Built specifically for small to medium-sized practices, our platform integrates patient records, appointment scheduling, billing, and telemedicine into one intuitive interface, improving efficiency and patient care.",
    website_url: "https://medisync.example.com",
    founding_date: "2019-06-22",
    employee_count: 28,
    funding_stage: "Series A",
    funding_amount: 4500000,
    location: "Boston, MA",
    category_id: 11, // HealthTech
    status: "approved",
    tagline: "Streamlining healthcare for the digital age"
  },
  {
    name: "QuantumLeap AI",
    slug: "quantumleap-ai",
    description: "QuantumLeap AI is pushing the boundaries of artificial intelligence with our proprietary quantum machine learning algorithms. Our technology provides unprecedented computational efficiency for complex optimization problems in finance, logistics, and drug discovery, offering solutions that were previously computationally impossible.",
    website_url: "https://quantumleap.example.com",
    founding_date: "2021-01-10",
    employee_count: 8,
    funding_stage: "Pre-seed",
    funding_amount: 300000,
    location: "Austin, TX",
    category_id: 2, // AI & Machine Learning
    status: "approved",
    tagline: "Quantum-powered AI for impossible problems"
  },
  {
    name: "UrbanFarm",
    slug: "urbanfarm",
    description: "UrbanFarm is addressing food security and sustainability through vertical farming technology. Our modular, hydroponic systems enable high-yield farming in urban environments, using 95% less water than traditional methods. We provide both consumer systems for homes and commercial solutions for restaurants and grocery stores.",
    website_url: "https://urbanfarm.example.com",
    founding_date: "2018-09-05",
    employee_count: 35,
    funding_stage: "Series B",
    funding_amount: 12000000,
    location: "New York, NY",
    category_id: 9, // FoodTech
    status: "approved",
    tagline: "Bringing farms to cities, one building at a time"
  },
  {
    name: "SecureChain",
    slug: "securechain",
    description: "SecureChain provides enterprise-grade blockchain solutions for supply chain verification and authentication. Our platform enables transparent tracking of products from raw materials to retail, preventing counterfeiting and ensuring ethical sourcing. Already adopted by major players in pharmaceuticals and luxury goods.",
    website_url: "https://securechain.example.com",
    founding_date: "2017-11-18",
    employee_count: 42,
    funding_stage: "Series A",
    funding_amount: 6500000,
    location: "Singapore",
    category_id: 7, // Blockchain
    status: "approved",
    tagline: "Transparent supply chains through immutable records"
  }
];

// Sample social links for each startup
const generateSocialLinks = (startupId) => [
  {
    startup_id: startupId,
    platform: "twitter",
    url: `https://twitter.com/${startupId.slice(0, 8)}`,
  },
  {
    startup_id: startupId,
    platform: "linkedin",
    url: `https://linkedin.com/company/${startupId.slice(0, 8)}`,
  }
];

// Sample media for each startup
const generateMedia = (startupId) => [
  {
    startup_id: startupId,
    media_type: "image",
    url: `https://picsum.photos/seed/${startupId.slice(0, 8)}/800/600`,
    title: "Company Showcase",
    description: "Our team and product in action",
    is_featured: true,
  },
  {
    startup_id: startupId,
    media_type: "image",
    url: `https://picsum.photos/seed/${startupId.slice(0, 8)}/1200/800`,
    title: "Product Demo",
    description: "See how our product works",
    is_featured: false,
  }
];

// Sample looking for options for each startup (randomized)
const generateLookingForOptions = (startupId) => {
  // Option IDs from 1 to 6 (assuming these exist in your database)
  const availableOptions = [1, 2, 3, 4, 5, 6];
  const numOptions = Math.floor(Math.random() * 3) + 1; // 1 to 3 options
  const selectedOptions = [];
  
  for (let i = 0; i < numOptions; i++) {
    const randomIndex = Math.floor(Math.random() * availableOptions.length);
    const option = availableOptions.splice(randomIndex, 1)[0];
    selectedOptions.push({
      startup_id: startupId,
      option_id: option
    });
  }
  
  return selectedOptions;
};

// Main seeding function
async function seedStartups() {
  try {
    console.log('Starting database seeding...');
    
    // Create a test user if it doesn't exist
    const testUser = {
      email: 'demo@ventureconnect.example.com',
      password: 'password123',
      full_name: 'Demo User'
    };
    
    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', testUser.email)
      .single();
    
    let userId;
    
    if (userError || !existingUser) {
      console.log('Creating test user...');
      // Create user using Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true
      });
      
      if (authError) {
        console.error('Error creating test user:', authError);
        return;
      }
      
      userId = authUser.user.id;
      
      // Create user profile
      await supabase.from('profiles').insert({
        id: userId,
        full_name: testUser.full_name,
        role_id: 2 // Assuming 2 is a standard user role
      });
      
      console.log(`Test user created with ID: ${userId}`);
    } else {
      userId = existingUser.id;
      console.log(`Using existing test user with ID: ${userId}`);
    }
    
    console.log('Creating sample startups...');
    
    // Insert startups and related data
    for (const startup of sampleStartups) {
      // Generate UUID for the startup
      const startupId = uuidv4();
      
      // Insert the startup
      const { error: startupError } = await supabase
        .from('startups')
        .insert({
          id: startupId,
          name: startup.name,
          slug: startup.slug,
          description: startup.description,
          website_url: startup.website_url,
          founding_date: startup.founding_date,
          employee_count: startup.employee_count,
          funding_stage: startup.funding_stage,
          funding_amount: startup.funding_amount,
          location: startup.location,
          category_id: startup.category_id,
          user_id: userId,
          status: startup.status
        });
      
      if (startupError) {
        console.error(`Error creating startup ${startup.name}:`, startupError);
        continue;
      }
      
      console.log(`Created startup: ${startup.name} with ID: ${startupId}`);
      
      // Insert social links
      const socialLinks = generateSocialLinks(startupId);
      for (const link of socialLinks) {
        await supabase.from('social_links').insert(link);
      }
      
      // Insert media
      const media = generateMedia(startupId);
      for (const item of media) {
        await supabase.from('startup_media').insert(item);
      }
      
      // Insert looking for options
      const lookingForOptions = generateLookingForOptions(startupId);
      for (const option of lookingForOptions) {
        await supabase.from('startup_looking_for').insert(option);
      }
    }
    
    console.log('Seeding completed successfully!');
    
  } catch (error) {
    console.error('Unhandled error during seeding:', error);
  }
}

// Run the seeding
seedStartups(); 