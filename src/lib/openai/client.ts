import OpenAI from 'openai';

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OpenAI API key');
}

const openai = new OpenAI({
  apiKey,
});

export interface PlaylistCriteria {
  genres: string[];
  subgenres?: string[];
  regions?: string[];
  languages?: string[];
  moods?: string[];
  eras?: string[];
  uniqueness: number; // 1-10, where 10 is most unique/obscure
  songCount: number;
  userPrompt?: string; // User's natural language input
}

export interface TrackRecommendation {
  artist: string;
  title: string;
  year?: string;
  album?: string;
  reason?: string;
}

/**
 * Generate a playlist based on user criteria
 */
export async function generatePlaylist(
  criteria: PlaylistCriteria
): Promise<TrackRecommendation[]> {
  // Construct a prompt based on the criteria
  const prompt = constructPrompt(criteria);

  // Log the prompt for development purposes
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n[${new Date().toISOString()}] [DEV ONLY] OpenAI API Request:`);
    console.log('='.repeat(80));
    console.log('PROMPT:', prompt);
    console.log('='.repeat(80));
  }

  // Call the OpenAI API
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a music expert with encyclopedic knowledge of music across all genres, eras, and regions.
        Your task is to recommend songs that match specific criteria. 
        Always return accurate artist names, song titles, and albums.
        For obscure or unique recommendations, focus on hidden gems, b-sides, and tracks by lesser-known artists
        that still fit the criteria.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  // Parse the response
  const content = response.choices[0]?.message.content;
  
  // Log the response for development purposes
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n[${new Date().toISOString()}] [DEV ONLY] OpenAI API Response:`);
    console.log('='.repeat(80));
    console.log('CONTENT:', content?.substring(0, 500) + (content && content.length > 500 ? '...' : ''));
    console.log('TOKEN USAGE:', {
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens
    });
    console.log('='.repeat(80));
  }
  
  if (!content) {
    throw new Error('Failed to generate playlist recommendations');
  }

  try {
    const data = JSON.parse(content);
    return data.tracks || [];
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    throw new Error('Failed to parse playlist recommendations');
  }
}

/**
 * Construct a prompt for the OpenAI API based on user criteria
 */
function constructPrompt(criteria: PlaylistCriteria): string {
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
  
  prompt += `
  
  Return the result as a JSON object with the following format:
  
  {
    "tracks": [
      {
        "artist": "Artist Name",
        "title": "Song Title",
        "year": "Release Year",
        "album": "Album Name",
        "reason": "Brief explanation of why this track matches the criteria"
      }
    ]
  }`;
  
  return prompt;
}

/**
 * For testing purposes only - logs a prompt with multiple selections
 */
export function testMultipleSelections() {
  const testCriteria: PlaylistCriteria = {
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
  
  const prompt = constructPrompt(testCriteria);
  console.log('TEST MULTIPLE SELECTIONS PROMPT:');
  console.log('='.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80));
  
  return prompt;
} 