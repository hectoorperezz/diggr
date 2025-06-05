// Simple script to check the member date format in the browser console
// Paste this into your browser console when logged in

async function checkMemberDate() {
  console.log('Checking Member Since date...');
  
  // Get Supabase client
  const supabase = window.supabase || window.sb;
  if (!supabase) {
    console.error('No Supabase client found in window globals');
    return;
  }
  
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session found');
    return;
  }
  
  // Get user data from the database
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user data:', error);
    return;
  }
  
  // Log the created_at date
  console.log('Database created_at:', data.created_at);
  
  // Parse and format the date
  if (data.created_at) {
    const date = new Date(data.created_at);
    
    // Different format options
    console.log('Formatted date options:');
    
    console.log('1. US format (Month Day, Year):',
      date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    );
    
    console.log('2. European format (Day Month Year):',
      date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    );
    
    console.log('3. Month and Year only:',
      date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    );
    
    console.log('4. Day and Month only:',
      date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long'
      })
    );
  }
}

// Run the function
checkMemberDate(); 