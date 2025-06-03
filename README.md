# Diggr - AI-Powered Music Discovery Platform

Diggr is designed for music enthusiasts who value deep discovery over passive listening. The platform allows users to create personalized playlists based on specific genres, moods, regions, and eras. Using AI, Diggr curates tracklists with both popular tracks and hidden gems, which can be saved directly to the user's Spotify account.

![Diggr Logo](/public/images/diggr.png)

## Features

- **AI-Powered Playlist Generation**: Create personalized playlists based on your preferences
- **Deep Music Discovery**: Find hidden gems and B-sides alongside popular tracks
- **Spotify Integration**: Connect your Spotify account and save playlists directly
- **Customizable Criteria**: Select genres, moods, regions, eras, and uniqueness level
- **Subscription Plans**: Free tier with limited playlists and premium tier with unlimited access

## Tech Stack

- **Frontend**: Next.js with App Router, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API routes (serverless functions)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with Spotify OAuth
- **AI**: OpenAI API for playlist generation
- **External APIs**: Spotify Web API
- **Payments**: Stripe API for subscription management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Spotify Developer account
- OpenAI API key
- Stripe account (for subscription features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/diggr.git
   cd diggr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Spotify
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Set up the database:
   ```bash
   node scripts/create-tables-interactive.js
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

Diggr uses Supabase for database and authentication. The schema includes:

- **users**: User profiles and Spotify connection status
- **playlists**: Playlist metadata and criteria
- **subscriptions**: User subscription details
- **usage_stats**: Tracking of playlist creation limits

Refer to the `migrations` directory for detailed schema information.

## Development Workflow

### Project Structure

```
diggr/
├── public/             # Static assets
│   ├── favicons/       # Favicon files
│   └── images/         # Image assets
├── scripts/            # Utility scripts
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   │   ├── providers/  # Context providers
│   │   └── ui/         # UI components
│   ├── lib/            # Utility libraries
│   │   ├── spotify/    # Spotify API integration
│   │   └── supabase/   # Supabase client
│   └── pages/          # Legacy Next.js pages
└── supabase/           # Supabase configuration
```

### Key Components

- **SupabaseProvider**: Handles authentication and database access
- **Playlist Wizard**: Multi-step form for creating playlists
- **Subscription Management**: Handles Stripe integration and user plans

### Deployment

The application is deployed on Vercel with the following environment:

1. **Development**: Local development with environment variables
2. **Staging**: Vercel preview deployments for PR testing
3. **Production**: Vercel production deployment with full API access

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Spotify Web API for music data
- OpenAI for AI-powered recommendations
- Supabase for database and authentication
- Vercel for hosting and deployment 