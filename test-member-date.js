// Script to test and diagnose Member Since date issues
// To use, paste in browser console when logged in

async function testMemberDate() {
  console.group('Member Since Date Diagnostics');
  console.log('Starting Member Since date diagnostics...');
  
  // Step 1: Check for global Supabase client
  const supabase = window.sb || window.supabase || window.supabaseClient;
  if (!supabase) {
    console.error('No Supabase client found in global scope');
    console.groupEnd();
    return;
  }
  
  console.log('Found Supabase client in window');
  
  // Step 2: Get current session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found - user not logged in');
      console.groupEnd();
      return;
    }
    
    console.log('Active session found for user:', session.user.email);
    console.log('Auth user data:', {
      id: session.user.id,
      email: session.user.email,
      created_at: session.user.created_at,
      created_at_formatted: session.user.created_at ? new Date(session.user.created_at).toLocaleString() : 'none',
      session_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'unknown'
    });
    
    // Step 3: Query user profile directly
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile from database:', error);
      } else if (!profile) {
        console.warn('No profile found in database');
      } else {
        console.log('Database profile found:', {
          ...profile,
          created_at_formatted: profile.created_at ? new Date(profile.created_at).toLocaleString() : 'none'
        });
      }
    } catch (dbError) {
      console.error('Exception querying database:', dbError);
    }
    
    // Step 4: Call the profile API endpoint
    try {
      console.log('Calling profile API endpoint...');
      const response = await fetch('/api/user/profile', {
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error('API responded with error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      } else {
        const result = await response.json();
        console.log('API profile data:', result);
        
        // Show table of data sources
        console.table({
          'Auth (Session)': {
            created_at: session.user.created_at || 'missing',
            formatted: session.user.created_at ? new Date(session.user.created_at).toLocaleString() : 'invalid' 
          },
          'Auth (API)': {
            created_at: result.auth?.created_at || 'missing',
            formatted: result.auth?.created_at ? new Date(result.auth.created_at).toLocaleString() : 'invalid'
          },
          'Profile (Database)': {
            created_at: result.profile?.created_at || 'missing',
            formatted: result.profile?.created_at_display || 'invalid'
          }
        });
        
        // Compare auth and database dates
        if (result.auth?.created_at && result.profile?.created_at) {
          console.log('Date comparison:',
            result.timestamps?.dates_match ? 
              '✅ MATCH - both sources have same date' : 
              '❌ MISMATCH - dates differ between auth and database'
          );
        }
        
        // Check if date is valid
        if (result.profile?.created_at) {
          try {
            const date = new Date(result.profile.created_at);
            if (!isNaN(date.getTime())) {
              console.log('✓ Valid date in database:', date.toLocaleString());
              
              // Format options for display
              console.log('Format options:');
              console.log('1. Day, Month Year:', date.toLocaleDateString('en-US', {
                day: 'numeric', month: 'long', year: 'numeric'
              }));
              console.log('2. Month Year:', date.toLocaleDateString('en-US', {
                month: 'long', year: 'numeric'
              }));
              
              // If there's a mismatch, offer to fix automatically
              if (!result.timestamps?.dates_match) {
                console.log('Would you like to fix the date mismatch? (y/n)');
                if (confirm('Fix the date mismatch between auth and database?')) {
                  await fixDate();
                }
              }
            } else {
              console.error('✗ Invalid date format in database:', result.profile.created_at);
              console.log('Would you like to fix the invalid date? (y/n)');
              if (confirm('Fix the invalid date?')) {
                await fixDate();
              }
            }
          } catch (parseError) {
            console.error('✗ Error parsing date:', parseError);
          }
        } else {
          console.error('✗ No created_at date found in profile');
          console.log('Would you like to fix the missing date? (y/n)');
          if (confirm('Fix the missing date?')) {
            await fixDate();
          }
        }
      }
    } catch (apiError) {
      console.error('Exception calling API:', apiError);
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
  
  console.groupEnd();
}

// Helper function to fix date
async function fixDate() {
  try {
    console.log('Calling fix-created-at API...');
    const response = await fetch('/api/user/fix-created-at', {
      method: 'GET',
      cache: 'no-cache',
      headers: { 
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.error('Fix API responded with error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
      console.log('💡 The API error might be due to authentication issues. Let\'s try refreshing the session first.');
      
      // Create a refresh button
      const shouldRefresh = confirm('Would you like to try refreshing your session first?');
      if (shouldRefresh) {
        // Try to refresh the auth session
        const supabase = window.sb || window.supabase || window.supabaseClient;
        if (supabase) {
          console.log('Refreshing session...');
          await supabase.auth.refreshSession();
          console.log('Session refreshed. Trying fix-date again...');
          
          // Try the fix again
          return await fixDate();
        }
      }
    } else {
      const result = await response.json();
      console.log('Fix result:', result);
      
      if (result.success) {
        console.log('✅ Date fixed successfully!');
        console.log('New date:', result.newDate);
        console.log('Formatted:', result.formatted);
        
        if (confirm('Date fixed! Would you like to reload the page to see the changes?')) {
          window.location.reload();
        }
      } else {
        console.error('✗ Fix attempt failed:', result.error);
        
        // Suggest alternative method if API fails
        console.log('💡 If the API fails, we can try using the SupabaseProvider.refreshSession() method');
        console.log('Type the following in the console to try:');
        console.log('const provider = window.__NEXT_DATA__.props.pageProps.supabaseProvider;');
        console.log('if (provider && provider.refreshSession) provider.refreshSession();');
      }
    }
  } catch (error) {
    console.error('Exception fixing date:', error);
  }
}

// Run the test
testMemberDate(); 