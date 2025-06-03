// Add this script to your project and include it in your HTML
// You can add it to the head of your layout.tsx file

(function() {
  // Create a simple button to force refresh the session
  document.addEventListener('DOMContentLoaded', function() {
    const button = document.createElement('button');
    button.innerText = 'Force Refresh Subscription';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.style.padding = '10px 15px';
    button.style.backgroundColor = '#1DB954';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', async function() {
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force a subscription refresh
      try {
        const response = await fetch('/api/user/subscription', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          // After getting a fresh response, reload the page
          window.location.reload(true);
        } else {
          alert('Error refreshing subscription. Please try again.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error refreshing subscription. Please try again.');
      }
    });
    
    document.body.appendChild(button);
  });
})(); 