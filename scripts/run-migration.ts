import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'fs'
import path from 'path'

// Load environment variables from .env file
import dotenv from 'dotenv'
dotenv.config()

async function runMigration() {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Missing required environment variables:')
    console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Create Supabase client with service role key for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migrations', '20240615_fix_startup_looking_for.sql')
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8')

    console.log('Running database migration to fix startup_looking_for relationship...')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('Migration failed:', error.message)
      process.exit(1)
    }

    console.log('Migration completed successfully!')
    
    // Verify the startup_looking_for table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('startup_looking_for')
      .select('id')
      .limit(1)
    
    if (tableError) {
      if (tableError.code === 'PGRST200') {
        console.error('ERROR: The startup_looking_for table still has issues.')
        console.error('You may need to manually check the database schema.')
      } else {
        console.error('Verification error:', tableError.message)
      }
    } else {
      console.log('Verification successful: startup_looking_for table is working correctly.')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

runMigration() 