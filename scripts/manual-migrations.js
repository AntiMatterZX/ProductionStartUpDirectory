// Script to generate SQL statements for manual execution in Supabase Studio
// Run with: node scripts/manual-migrations.js

const fs = require('fs');
const path = require('path');

// Directory containing migration files
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const OUTPUT_FILE = path.join(__dirname, '..', 'migrations-to-run.sql');

function main() {
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
      process.exit(1);
    }
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure correct order
    
    console.log(`Found ${migrationFiles.length} migration files.`);
    
    // Create combined SQL file
    let combinedSql = `-- Combined migration script for manual execution in Supabase Studio
-- Generated on ${new Date().toISOString()}
-- Run this file in the Supabase Studio SQL Editor

-- First creating exec_sql function to support automated migrations in the future
`;
    
    // First include the exec_sql function creation
    const execSqlFile = migrationFiles.find(file => file.includes('exec_sql_function'));
    if (execSqlFile) {
      const execSqlPath = path.join(MIGRATIONS_DIR, execSqlFile);
      const execSqlContent = fs.readFileSync(execSqlPath, 'utf8');
      combinedSql += execSqlContent + '\n\n';
      
      // Remove from list so we don't include it twice
      const index = migrationFiles.indexOf(execSqlFile);
      if (index > -1) {
        migrationFiles.splice(index, 1);
      }
    } else {
      console.warn("Warning: exec_sql function creation file not found!");
    }
    
    // Now add all other migrations
    for (const migrationFile of migrationFiles) {
      const filePath = path.join(MIGRATIONS_DIR, migrationFile);
      const content = fs.readFileSync(filePath, 'utf8');
      
      combinedSql += `\n-- ========================================
-- Migration: ${migrationFile}
-- ========================================\n\n`;
      
      combinedSql += content + '\n';
    }
    
    // Write combined SQL to output file
    fs.writeFileSync(OUTPUT_FILE, combinedSql);
    
    console.log(`Generated combined SQL file at: ${OUTPUT_FILE}`);
    console.log('Please run this file in the Supabase Studio SQL Editor.');
  } catch (error) {
    console.error('Error generating combined SQL file:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 