// Script to diagnose and fix member since date issues
// Run this in the browser console when logged in

async function diagnoseMemberSinceDate() {
  console.log('Diagnosing Member Since date issues...');
  
  // 1. Get current user session from supabase
  const supabase = window.sb || window.supabaseClient;
  if (!supabase) {
    console.error('No Supabase client found in window.sb or window.supabaseClient');
    return;
  }
  
  // Get session and user
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session found. Please log in first.');
    return;
  }
  
  const authUser = session.user;
  console.log('Auth User:', {
    id: authUser.id,
    email: authUser.email,
    created_at: authUser.created_at,
    raw_created_at: authUser.created_at ? new Date(authUser.created_at) : null,
    formatted: authUser.created_at ? new Date(authUser.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null,
    last_sign_in_at: authUser.last_sign_in_at
  });
  
  // 2. Get user profile from database
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    console.log('User profile might not exist in the database yet.');
  } else {
    console.log('User Profile from DB:', {
      id: userProfile.id,
      email: userProfile.email,
      created_at: userProfile.created_at,
      raw_created_at: userProfile.created_at ? new Date(userProfile.created_at) : null,
      formatted: userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null,
      spotify_connected: userProfile.spotify_connected
    });
  }
  
  // 3. Call the fix-created-at API to fix the issue
  console.log('Calling fix-created-at API...');
  try {
    const response = await fetch('/api/user/fix-created-at');
    const result = await response.json();
    
    console.log('API Response:', result);
    
    if (result.success) {
      console.log('✅ Success! Member Since date was fixed.');
      console.log(`Old date: ${result.oldDate || 'None'}`);
      console.log(`New date: ${result.newDate}`);
      console.log(`Action: ${result.action}`);
      
      // Format the fixed date
      if (result.newDate) {
        const fixedDate = new Date(result.newDate);
        console.log('Formatted fixed date:', fixedDate.toLocaleDateString('en-US', { 
          month: 'long', day: 'numeric', year: 'numeric'
        }));
      }
      
      console.log('Please refresh the page to see the updated date.');
      
      // Offer to refresh for the user
      if (confirm('Refresh page now to see the changes?')) {
        window.location.reload();
      }
    } else {
      console.error('❌ Failed to fix date:', result.error);
    }
  } catch (error) {
    console.error('Error calling fix-created-at API:', error);
  }
}

// Run the function
diagnoseMemberSinceDate(); 