// Script to add the cancel_at_period_end column to subscriptions table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function addCancelAtPeriodEndColumn() {
  try {
    console.log('Adding cancel_at_period_end column to subscriptions table...');
    
    // Execute the SQL query to add the column
    const { data: addColumnData, error: addColumnError } = await supabaseAdmin.rpc(
      'exec_sql', 
      { query: 'ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false' }
    );

    if (addColumnError) {
      console.error('Error adding column:', addColumnError);
      return;
    }
    
    console.log('Column added successfully, updating existing rows...');
    
    // Update existing rows to set the default value
    const { data: updateData, error: updateError } = await supabaseAdmin.rpc(
      'exec_sql',
      { query: 'UPDATE subscriptions SET cancel_at_period_end = false WHERE cancel_at_period_end IS NULL' }
    );
    
    if (updateError) {
      console.error('Error updating existing rows:', updateError);
      return;
    }
    
    console.log('Successfully added cancel_at_period_end column to subscriptions table!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
addCancelAtPeriodEndColumn().catch(console.error); 