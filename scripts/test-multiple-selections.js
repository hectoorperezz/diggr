// Test script to verify multiple selections in OpenAI prompt construction
require('dotenv').config();

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

// Test criteria with multiple selections
const testCriteria = {
  genres: ['rock', 'pop'],
  subgenres: ['classic rock', 'indie pop'],
  regions: ['us', 'uk', 'japan'],
  languages: ['english', 'japanese'],
  moods: ['upbeat', 'nostalgic', 'chill'],
  eras: ['1970s', '1980s', '1990s'],
  uniqueness: 5,
  songCount: 25,
  userPrompt: 'I want a mix of classic rock hits and modern indie pop songs'
};

// Run the test
console.log('Running test for multiple selections in playlist criteria...');
const prompt = constructPrompt(testCriteria);

console.log('\nGenerated prompt:');
console.log('='.repeat(80));
console.log(prompt);
console.log('='.repeat(80));

console.log('\nPrompt successfully generated!');
console.log('Check that the prompt correctly includes:');
console.log('- Multiple genres: rock, pop');
console.log('- Multiple subgenres: classic rock, indie pop');
console.log('- Multiple regions: us, uk, japan');
console.log('- Multiple languages: english, japanese');
console.log('- Multiple moods: upbeat, nostalgic, chill');
console.log('- Multiple eras: 1970s, 1980s, 1990s'); 