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
  country?: string;
  language?: string;
  mood?: string;
  era?: string;
  uniqueness: number; // 1-10, where 10 is most unique/obscure
  songCount: number;
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
  const { genres, subgenres, country, language, mood, era, uniqueness, songCount } = criteria;
  
  let prompt = `Create a playlist with ${songCount} songs `;
  
  // Add genres and subgenres
  prompt += `in the ${genres.join(', ')} genre${genres.length > 1 ? 's' : ''}`;
  
  if (subgenres && subgenres.length > 0) {
    prompt += `, specifically the ${subgenres.join(', ')} subgenre${subgenres.length > 1 ? 's' : ''}`;
  }
  
  // Add country and language
  if (country) {
    prompt += `, from ${country}`;
  }
  
  if (language) {
    prompt += `, in ${language}`;
  }
  
  // Add mood and era
  if (mood) {
    prompt += `, with a ${mood} mood`;
  }
  
  if (era) {
    prompt += `, from the ${era} era`;
  }
  
  // Add uniqueness parameter
  if (uniqueness >= 8) {
    prompt += `. Focus on very obscure, hidden gems and deep cuts that only dedicated fans would know.`;
  } else if (uniqueness >= 5) {
    prompt += `. Include a mix of well-known tracks and some deeper cuts.`;
  } else {
    prompt += `. Focus on popular, well-known tracks that most people would recognize.`;
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