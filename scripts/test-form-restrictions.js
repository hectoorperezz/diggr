// Test script to verify form restrictions in playlist creation
require('dotenv').config();

// Simulate the form data with our restrictions
const formData = {
  // Single genre selection
  genres: ['rock'],
  // Up to 3 subgenres
  subGenres: ['Classic Rock', 'Progressive Rock', 'Hard Rock'],
  // One mood per category
  moods: ['upbeat', 'happy', 'party'],
  // Multiple eras (up to 3)
  eras: ['1970s', '1980s'],
  // Multiple regions (up to 3)
  regions: ['us', 'uk'],
  // Multiple languages (up to 3)
  languages: ['english'],
  // User prompt
  userPrompt: 'I want a playlist with energetic rock songs for a road trip',
  // Other details
  playlistName: 'Road Trip Rock',
  description: 'Energetic rock songs for a road trip',
  trackCount: 25,
  isPublic: true,
  uniquenessLevel: 4
};

// Function to construct a prompt (similar to the one in OpenAI client)
function constructPrompt(criteria) {
  const { genres, subgenres, regions, languages, moods, eras, uniqueness, songCount, userPrompt } = criteria;
  
  let prompt = `Create a playlist with ${songCount} songs `;
  
  // Add genres and subgenres
  prompt += `in the ${genres.join(', ')} genre${genres.length > 1 ? 's' : ''}`;
  
  if (subgenres && subgenres.length > 0) {
    prompt += `, specifically the ${subgenres.join(', ')} subgenre${subgenres.length > 1 ? 's' : ''}`;
  }
  
  // Add regions
  if (regions && regions.length > 0) {
    prompt += `, from ${regions.length > 1 ? 'these regions: ' : ''}${regions.join(', ')}`;
  }
  
  // Add languages
  if (languages && languages.length > 0) {
    prompt += `, in ${languages.length > 1 ? 'these languages: ' : ''}${languages.join(', ')}`;
  }
  
  // Add moods
  if (moods && moods.length > 0) {
    prompt += `, with ${moods.length > 1 ? 'these moods: ' : 'a '}${moods.join(', ')}`;
  }
  
  // Add eras
  if (eras && eras.length > 0) {
    prompt += `, from ${eras.length > 1 ? 'these eras: ' : 'the '}${eras.join(', ')}`;
  }
  
  // Add uniqueness parameter
  if (uniqueness >= 8) {
    prompt += `. Focus on very obscure, hidden gems and deep cuts that only dedicated fans would know.`;
  } else if (uniqueness >= 5) {
    prompt += `. Include a mix of well-known tracks and some deeper cuts.`;
  } else {
    prompt += `. Focus on popular, well-known tracks that most people would recognize.`;
  }
  
  // Add user prompt if available
  if (userPrompt && userPrompt.trim()) {
    prompt += `\n\nAdditionally, the user has provided the following specific request: "${userPrompt.trim()}". 
    Please incorporate these preferences into your recommendations while still adhering to the other criteria.`;
  }
  
  return prompt;
}

// Transform form data to OpenAI criteria
const criteria = {
  genres: formData.genres || [],
  subgenres: formData.subGenres || [],
  regions: formData.regions || [],
  languages: formData.languages || [],
  moods: formData.moods || [],
  eras: formData.eras || [],
  uniqueness: formData.uniquenessLevel || 3,
  songCount: formData.trackCount || 25,
  userPrompt: formData.userPrompt || undefined
};

// Generate the prompt
console.log('Form data with restrictions:');
console.log('============================');
console.log('Genres (single):', formData.genres);
console.log('Subgenres (up to 3):', formData.subGenres);
console.log('Moods (one per category):', formData.moods);
console.log('Eras (up to 3):', formData.eras);
console.log('Regions (up to 3):', formData.regions);
console.log('Languages (up to 3):', formData.languages);
console.log('\nGenerated OpenAI prompt:');
console.log('========================');
console.log(constructPrompt(criteria)); 