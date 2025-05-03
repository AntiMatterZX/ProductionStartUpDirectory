const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables for Supabase connection');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample data for fields that might be missing
const defaultValues = {
  tagline: "Innovative solutions for tomorrow's challenges",
  location: "San Francisco, CA",
  funding_stage: "Seed",
  funding_amount: 500000,
  employee_count: 5,
  founding_date: "2022-01-01",
};

async function fillMissingStartupFields() {
  console.log('Starting to fill missing fields in startup entries...');
  
  try {
    // Get all startups
    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching startups:', fetchError);
      return;
    }
    
    console.log(`Found ${startups.length} startups to check for missing fields.`);
    
    // Loop through each startup and check for missing fields
    for (const startup of startups) {
      let needsUpdate = false;
      const updateData = {};
      
      // Check each field and set default if missing
      if (!startup.tagline) {
        updateData.tagline = `${startup.name} - ${defaultValues.tagline}`;
        needsUpdate = true;
      }
      
      if (!startup.location) {
        updateData.location = defaultValues.location;
        needsUpdate = true;
      }
      
      if (!startup.funding_stage) {
        updateData.funding_stage = defaultValues.funding_stage;
        needsUpdate = true;
      }
      
      if (!startup.funding_amount) {
        updateData.funding_amount = defaultValues.funding_amount;
        needsUpdate = true;
      }
      
      if (!startup.employee_count) {
        updateData.employee_count = defaultValues.employee_count;
        needsUpdate = true;
      }
      
      if (!startup.founding_date) {
        updateData.founding_date = defaultValues.founding_date;
        needsUpdate = true;
      }
      
      // Update the startup if needed
      if (needsUpdate) {
        console.log(`Updating startup: ${startup.name} (ID: ${startup.id})`);
        console.log('Fields to update:', Object.keys(updateData).join(', '));
        
        const { error: updateError } = await supabase
          .from('startups')
          .update(updateData)
          .eq('id', startup.id);
          
        if (updateError) {
          console.error(`Error updating startup ${startup.id}:`, updateError);
        } else {
          console.log(`Successfully updated startup: ${startup.name}`);
        }
      } else {
        console.log(`Startup ${startup.name} has all required fields filled.`);
      }
      
      // Check if startup has social links
      const { data: socialLinks, error: socialLinksError } = await supabase
        .from('social_links')
        .select('*')
        .eq('startup_id', startup.id);
      
      if (socialLinksError) {
        console.error(`Error fetching social links for startup ${startup.id}:`, socialLinksError);
      } else if (!socialLinks || socialLinks.length === 0) {
        // Create default social links if none exist
        console.log(`Creating default social links for startup: ${startup.name}`);
        
        const defaultSocialLinks = [
          {
            startup_id: startup.id,
            platform: 'linkedin',
            url: `https://linkedin.com/company/${startup.slug}`,
          },
          {
            startup_id: startup.id,
            platform: 'twitter',
            url: `https://twitter.com/${startup.slug}`,
          }
        ];
        
        const { error: insertLinksError } = await supabase
          .from('social_links')
          .insert(defaultSocialLinks);
          
        if (insertLinksError) {
          console.error(`Error creating social links for startup ${startup.id}:`, insertLinksError);
        } else {
          console.log(`Successfully created social links for startup: ${startup.name}`);
        }
      }
      
      // Check if startup has looking_for options
      const { data: lookingFor, error: lookingForError } = await supabase
        .from('startup_looking_for')
        .select('*')
        .eq('startup_id', startup.id);
      
      if (lookingForError) {
        console.error(`Error fetching looking_for options for startup ${startup.id}:`, lookingForError);
      } else if (!lookingFor || lookingFor.length === 0) {
        // Create default looking_for options if none exist
        console.log(`Creating default looking_for options for startup: ${startup.name}`);
        
        // First get available options
        const { data: options, error: optionsError } = await supabase
          .from('looking_for_options')
          .select('id')
          .limit(3);
        
        if (optionsError || !options || options.length === 0) {
          console.error('Error fetching looking_for options:', optionsError);
        } else {
          const defaultLookingFor = options.map(option => ({
            startup_id: startup.id,
            option_id: option.id,
          }));
          
          const { error: insertLookingForError } = await supabase
            .from('startup_looking_for')
            .insert(defaultLookingFor);
            
          if (insertLookingForError) {
            console.error(`Error creating looking_for options for startup ${startup.id}:`, insertLookingForError);
          } else {
            console.log(`Successfully created looking_for options for startup: ${startup.name}`);
          }
        }
      }
    }
    
    console.log('Finished filling missing fields in startup entries!');
    
  } catch (error) {
    console.error('Unhandled error during field filling:', error);
  }
}

// Run the function
fillMissingStartupFields(); 