// Script to apply database migrations
// Run with: node scripts/apply-migrations.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Directory containing migration files
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// Function to execute a single SQL statement
async function executeStatement(statement) {
  try {
    // Try a direct query (if supported)
    const { error } = await supabase.from('_dummy_query').select('*').limit(1);
    
    // If no error, we can use the REST API
    const { error: queryError } = await supabase.rpc('exec_sql', { sql: statement });
    
    if (queryError) {
      console.error(`Error executing statement: ${queryError.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error executing SQL: ${error}`);
    return false;
  }
}

// Function to create the exec_sql function if it doesn't exist
async function setupExecSqlFunction() {
  console.log("Checking if exec_sql function exists...");
  
  try {
    // First attempt to directly use the exec_sql function
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT 1 as test;' 
    });
    
    // If no error, function exists
    if (!error) {
      console.log("exec_sql function exists. Proceeding with migrations.");
      return true;
    }
    
    // If we got here, function doesn't exist, need to create it
    console.log("exec_sql function does not exist. Creating it...");
    
    // Read the function creation SQL
    const funcSqlPath = path.join(MIGRATIONS_DIR, '20240630_create_exec_sql_function.sql');
    if (!fs.existsSync(funcSqlPath)) {
      console.error("exec_sql function creation script not found at:", funcSqlPath);
      return false;
    }
    
    // Split SQL into statements
    const functionSql = fs.readFileSync(funcSqlPath, 'utf8');
    const statements = functionSql.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Since we can't use exec_sql yet, we need to use a REST API approach
    // We'll create a table, then alter it, then drop it to test execution capability
    console.log("Attempting to create function using Supabase client...");
    
    const { error: createError } = await supabase
      .from('migrations')
      .select('*')
      .limit(1);
    
    if (createError && createError.message.includes('does not exist')) {
      // Create a migrations table to track what we've run
      console.log("Creating migrations table...");
      const { error: tableError } = await supabase
        .from('migrations')
        .insert([
          { name: 'init', executed_at: new Date().toISOString() }
        ]);
      
      if (tableError && !tableError.message.includes('already exists')) {
        console.error("Failed to create migrations table:", tableError.message);
        return false;
      }
    }
    
    // Unable to create the function with REST API, need manual intervention
    console.log(`
============================================================
ERROR: Could not automatically create the exec_sql function.
------------------------------------------------------------
Please run the following SQL in your Supabase SQL editor:

${functionSql}
============================================================
    `);
    
    return false;
  } catch (error) {
    console.error("Error setting up exec_sql function:", error);
    return false;
  }
}

async function runMigration(migrationFileName) {
  try {
    const filePath = path.join(MIGRATIONS_DIR, migrationFileName);
    console.log(`Reading migration file: ${filePath}`);
    
    // Skip the exec_sql creation file as we handle it separately
    if (migrationFileName === '20240630_create_exec_sql_function.sql') {
      console.log("Skipping exec_sql function creation file - handled separately");
      return true;
    }
    
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Log which migration we're running
    console.log(`Running migration: ${migrationFileName}...`);
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log("Error running migration with exec_sql. Trying statement by statement...");
      
      // Split SQL into individual statements
      const statements = sql.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      // Execute each statement individually
      for (const statement of statements) {
        console.log(`Executing statement: ${statement.substring(0, 50)}...`);
        const success = await executeStatement(statement);
        
        if (!success) {
          console.error(`Failed to execute statement. Please run the migration manually:`);
          console.error(`\n${statement}\n`);
          return false;
        }
      }
      
      console.log(`Migration ${migrationFileName} completed successfully by executing statements individually.`);
      return true;
    }
    
    console.log(`Migration ${migrationFileName} completed successfully.`);
    return true;
  } catch (error) {
    console.error(`Error processing migration ${migrationFileName}:`, error);
    return false;
  }
}

async function main() {
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
      process.exit(1);
    }
    
    // First try to set up the exec_sql function
    const execSqlReady = await setupExecSqlFunction();
    if (!execSqlReady) {
      console.log("Please run the exec_sql function creation SQL manually, then try again.");
      process.exit(1);
    }
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure correct order
    
    console.log(`Found ${migrationFiles.length} migration files.`);
    
    // Process each migration file
    for (const migrationFile of migrationFiles) {
      const success = await runMigration(migrationFile);
      if (!success) {
        console.error(`Migration ${migrationFile} failed. Stopping.`);
        process.exit(1);
      }
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 