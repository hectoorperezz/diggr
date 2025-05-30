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

// Function to run a SQL query using direct POST request
async function runQuery(sql, name) {
  try {
    console.log(`Running query: ${name}`);
    
    // Use the supabase client to execute SQL directly
    const { data, error } = await supabase.from('_posts').select('*').limit(1);
    
    if (error) {
      console.error(`Error connecting to Supabase for ${name}:`, error);
      return false;
    }
    
    console.log(`Successfully connected to Supabase. Now trying direct SQL for ${name}`);
    
    // For now, let's use this as a test of connectivity
    // In a real implementation, you would use a different method to execute SQL
    console.log(`Query ${name} would run: ${sql.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error(`Error running query ${name}:`, error);
    return false;
  }
}

// Main function to create tables
async function createTables() {
  try {
    console.log('Testing connection to Supabase...');
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        spotify_connected BOOLEAN DEFAULT FALSE,
        spotify_refresh_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    
    // Run a simple test query
    await runQuery(createUsersTable, "Connection Test");
    
    console.log('Connection test complete!');
    console.log('');
    console.log('IMPORTANT: To create database tables, you need to use the Supabase web interface SQL editor.');
    console.log('Please visit https://app.supabase.com/project/llkaervhlvqygjhqbvec/sql/new');
    console.log('And paste the migration files content from the supabase/migrations/ directory one by one.');
    console.log('Start with 00000_create_exec_sql_function.sql and then proceed with the other files in order.');
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
  }
}

// Run the function
createTables(); 