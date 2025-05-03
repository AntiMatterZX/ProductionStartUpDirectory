// Set environment variables directly in the script
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ztdsrfvzltszbumrrkdi.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A';

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables for Supabase connection');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateStartupMedia() {
  console.log('Starting startup_media migration...');
  
  try {
    // Step 1: Add media columns to startups table if they don't exist
    console.log('Checking media columns in startups table...');
    
    try {
      // Check if the columns already exist
      const { data: checkData, error: checkError } = await supabase
        .from('startups')
        .select('media_images, media_documents, media_videos')
        .limit(1)
        .catch(() => {
          console.log('Column check failed, columns likely do not exist');
          return { error: true };
        });
      
      if (checkError) {
        console.log('Media columns do not exist yet, database migration should be run first');
      } else {
        console.log('Media columns already exist, proceeding with data migration');
      }
    } catch (e) {
      console.log('Error checking column existence:', e);
    }
    
    // Step 2: Get all startups
    console.log('Fetching all startups...');
    const { data: startups, error: startupsError } = await supabase
      .from('startups')
      .select('id, name');
    
    if (startupsError) {
      console.error('Error fetching startups:', startupsError);
      return;
    }
    
    console.log(`Found ${startups.length} startups to process.`);
    
    // Step 3: Get all media from startup_media table
    console.log('Fetching all startup media...');
    const { data: mediaItems, error: mediaError } = await supabase
      .from('startup_media')
      .select('startup_id, media_type, url');
    
    if (mediaError) {
      console.error('Error fetching startup media:', mediaError);
      console.log('Continuing anyway, we will create empty arrays');
      mediaItems = [];
    }
    
    // Create maps for different media types
    const mediaMap = {
      image: {},
      document: {},
      video: {}
    };
    
    if (mediaItems && mediaItems.length > 0) {
      mediaItems.forEach(item => {
        const type = item.media_type.toLowerCase();
        if (!mediaMap[type][item.startup_id]) {
          mediaMap[type][item.startup_id] = [];
        }
        mediaMap[type][item.startup_id].push(item.url);
      });
      
      console.log(`Found media items for ${Object.keys(mediaMap.image).length + 
                   Object.keys(mediaMap.document).length + 
                   Object.keys(mediaMap.video).length} startup-media type combinations`);
    }
    
    // Step 4: Update each startup with its media
    let successCount = 0;
    let errorCount = 0;
    
    for (const startup of startups) {
      const images = mediaMap.image[startup.id] || [];
      const documents = mediaMap.document[startup.id] || [];
      const videos = mediaMap.video[startup.id] || [];
      
      console.log(`Updating startup ${startup.name} (${startup.id}) with media:
        Images: ${images.length}
        Documents: ${documents.length}
        Videos: ${videos.length}`);
      
      const { error: updateError } = await supabase
        .from('startups')
        .update({
          media_images: images,
          media_documents: documents,
          media_videos: videos
        })
        .eq('id', startup.id);
      
      if (updateError) {
        console.error(`Error updating startup ${startup.id}:`, updateError);
        errorCount++;
      } else {
        console.log(`Successfully updated media for ${startup.name}`);
        successCount++;
      }
    }
    
    console.log(`Migration complete! Successfully updated ${successCount} startups, ${errorCount} errors.`);
    
    // Verify by testing a startup
    if (startups.length > 0) {
      const testId = startups[0].id;
      console.log(`Testing by fetching first startup (ID: ${testId})...`);
      
      const { data: testStartup, error: testError } = await supabase
        .from('startups')
        .select('id, name, media_images, media_documents, media_videos')
        .eq('id', testId)
        .single();
      
      if (testError) {
        console.error('Error testing first startup:', testError);
      } else {
        console.log('Test result:', {
          id: testStartup.id,
          name: testStartup.name,
          media_images: testStartup.media_images || [],
          media_documents: testStartup.media_documents || [],
          media_videos: testStartup.media_videos || []
        });
        console.log('Startup media successfully migrated!');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error during migration:', error);
  }
}

// Run the migration
migrateStartupMedia(); 