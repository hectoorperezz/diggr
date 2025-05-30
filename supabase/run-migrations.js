#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Get the migrations directory
const migrationsDir = path.join(__dirname, 'migrations');

// Run migrations
async function runMigrations() {
  try {
    // Get all SQL files in the migrations directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper order

    console.log(`Found ${migrationFiles.length} migration files.`);

    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error running migration ${file}:`, error);
        process.exit(1);
      }
      
      console.log(`Migration ${file} completed successfully.`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations(); 