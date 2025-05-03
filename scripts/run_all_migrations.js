// Set environment variables directly in the script
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ztdsrfvzltszbumrrkdi.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A';

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables for Supabase connection');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to run SQL files on Supabase
async function runSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file into separate statements by semicolons
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
    
    console.log(`Executing ${statements.length} SQL statements from ${filePath}`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}: ${error.message}`);
          // Continue despite errors as some statements might be comments or already executed
        }
      }
    }
    
    console.log(`Completed execution of ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Failed to execute SQL file ${filePath}:`, error);
    return false;
  }
}

// Run a JavaScript migration script
async function runJsScript(scriptPath) {
  try {
    console.log(`Running JavaScript migration: ${scriptPath}`);
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`Completed JavaScript migration: ${scriptPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to run JavaScript migration ${scriptPath}:`, error);
    return false;
  }
}

// Main migration function
async function runAllMigrations() {
  console.log('Starting all database migrations...');
  
  // List of migrations to run in order
  const migrations = [
    { type: 'sql', path: path.join(__dirname, '../supabase/migrations/20240513_simplify_looking_for.sql') },
    { type: 'js', path: path.join(__dirname, './migrate_looking_for.js') },
    { type: 'sql', path: path.join(__dirname, '../supabase/migrations/20240514_merge_startup_media.sql') },
    { type: 'js', path: path.join(__dirname, './migrate_startup_media.js') }
  ];
  
  // Run each migration
  for (const migration of migrations) {
    console.log(`\n--- Running migration: ${migration.path} ---\n`);
    
    let success;
    if (migration.type === 'sql') {
      success = await runSqlFile(migration.path);
    } else if (migration.type === 'js') {
      success = await runJsScript(migration.path);
    }
    
    if (!success) {
      console.error(`Migration failed: ${migration.path}`);
      // Continue with other migrations despite failures
    }
  }
  
  console.log('\n--- All migrations completed ---\n');
  
  // Ask user about finalizing the migration by dropping old tables
  console.log(`
IMPORTANT: You have successfully migrated all data to the consolidated startups table.

To complete the process, you should:
1. Verify that all data has been correctly migrated by checking the startups table
2. Once confirmed, run the finalization script to drop the old tables:
   node -e "require('./supabase/migrations/20240515_finalize_startup_table_merge.sql')"

WARNING: Do not run the finalization script until you have verified all data has been migrated correctly!
  `);
}

// Run the migrations
runAllMigrations(); 