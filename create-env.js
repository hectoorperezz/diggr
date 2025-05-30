#!/usr/bin/env node
const fs = require('fs');

// Supabase credentials
const supabaseUrl = 'https://llkaervhlvqygjhqbvec.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsa2FlcnZobHZxeWdqaHFidmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDk0NjQsImV4cCI6MjA2MzkyNTQ2NH0.7Np5C_45CmGpAVgGLZA82T6nZDGYYMKL0J2eBBWu6PI';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsa2FlcnZobHZxeWdqaHFidmVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0OTQ2NCwiZXhwIjoyMDYzOTI1NDY0fQ.jfp1GzkvCJiNCl2HfczgBetSfORuZEMoFa3_oYBsZHA';

// Create the .env.local file content
const envContent = `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}
`;

// Write the file
fs.writeFileSync('.env.local', envContent);

console.log('.env.local file created successfully with the following content:');
console.log(envContent);
console.log('\nNow you can run the application with "npm run dev"');
console.log('\nIMPORTANT: To create database tables, you need to use the Supabase web interface SQL editor.');
console.log('Please visit https://app.supabase.com/project/llkaervhlvqygjhqbvec/sql/new');
console.log('And paste the migration files content from the supabase/migrations/ directory one by one.');
console.log('Start with 00000_create_exec_sql_function.sql and then proceed with the other files in order.'); 