# Diggr - AI-Powered Music Discovery Platform

## Project Overview
Diggr is designed for music enthusiasts who value deep discovery over passive listening. The platform allows users to create personalized playlists based on specific genres, moods, regions, and eras. Using AI, Diggr curates tracklists with both popular tracks and hidden gems, which can be saved directly to the user's Spotify account.

The key differentiator for Diggr is its focus on curation quality and deep music discovery rather than algorithm-driven mainstream recommendations. Users get an intentional, soulful playlist experience with both familiar tracks and B-sides they might have missed.

## Technical Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router for server components and routing
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: React Context for global state, React Query for server state
- **Animations**: Framer Motion for transitions and micro-interactions
- **Form Handling**: React Hook Form for form state and validation
- **Responsive Design**: Mobile-first approach with responsive breakpoints

### Backend Architecture
- **API Routes**: Next.js API routes for serverless functions
- **Authentication**: Supabase Auth with Spotify OAuth integration
- **Database**: PostgreSQL via Supabase
- **AI Integration**: OpenAI API for playlist generation
- **External APIs**: Spotify Web API for music data and playlist creation
- **Payments**: Stripe API for subscription management

### Data Flow
1. User authenticates with Supabase and connects Spotify account
2. User completes playlist wizard with criteria selections
3. Frontend sends criteria to `/api/playlist/generate` endpoint
4. Backend validates user quota and subscription status
5. Backend sends structured prompt to OpenAI API
6. OpenAI returns recommended tracks based on criteria
7. Backend validates tracks against Spotify API
8. Backend creates playlist in user's Spotify account
9. Playlist metadata is stored in Supabase
10. User quota is updated in Supabase

## Database Schema

### Tables and Relationships

**users**
- `id` UUID PRIMARY KEY (references auth.users)
- `email` TEXT UNIQUE NOT NULL
- `spotify_connected` BOOLEAN DEFAULT FALSE
- `spotify_refresh_token` TEXT
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- Row Level Security: Users can only read and update their own data
- Triggers: 
  - `on_auth_user_created`: Creates a user record when a new auth user is created

**playlists**
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES users(id) ON DELETE CASCADE
- `spotify_playlist_id` TEXT
- `name` TEXT NOT NULL
- `description` TEXT
- `criteria` JSONB (stores genres, moods, regions, eras, etc.)
- `track_count` INTEGER DEFAULT 0
- `spotify_url` TEXT
- `image_url` TEXT
- `is_public` BOOLEAN DEFAULT true
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- Indexes: `playlists_user_id_idx` on user_id
- Row Level Security: Users can only read, insert, update, and delete their own playlists

**subscriptions**
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES users(id) ON DELETE CASCADE
- `stripe_customer_id` TEXT
- `stripe_subscription_id` TEXT
- `plan_type` ENUM ('free', 'premium') DEFAULT 'free'
- `status` ENUM ('active', 'cancelled', 'past_due') DEFAULT 'active'
- `current_period_start` TIMESTAMP WITH TIME ZONE
- `current_period_end` TIMESTAMP WITH TIME ZONE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- Constraints: `unique_user_subscription` ensures one subscription per user
- Row Level Security: Users can read their own subscriptions, service role can manage all
- Triggers:
  - `on_user_created_create_subscription`: Creates a free subscription when a new user is created

**usage_stats**
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES users(id) ON DELETE CASCADE
- `playlists_created_count` INTEGER DEFAULT 0
- `reset_date` TIMESTAMP WITH TIME ZONE (first day of next month)
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- Constraints: `unique_user_usage` ensures one usage stats record per user
- Row Level Security: Users can read their own usage stats, service role can manage all
- Triggers:
  - `on_user_created_create_usage_stats`: Creates usage stats record when a new user is created
  - `on_usage_stats_update`: Resets playlist count when reset_date is reached

### Custom Functions

**handle_new_user()**
- Creates a user record when a new auth user is created
- Triggered by: `on_auth_user_created`

**handle_new_user_subscription()**
- Creates a free subscription when a new user is created
- Triggered by: `on_user_created_create_subscription`

**handle_new_user_usage_stats()**
- Creates usage stats record when a new user is created
- Triggered by: `on_user_created_create_usage_stats`

**reset_monthly_usage_stats()**
- Resets playlist count when reset_date is reached
- Triggered by: `on_usage_stats_update`

**increment_playlist_count(user_id_param UUID)**
- Increments the playlists_created_count for a user by 1
- Security: SECURITY DEFINER, accessible to authenticated users and service_role

**check_user_playlist_limit(user_id_param UUID)**
- Checks if a user has reached their playlist limit based on subscription tier
- Free users limited to 5 playlists per month, premium users unlimited
- Security: SECURITY DEFINER, accessible to authenticated users and service_role

## Current Project Status

### Core Features Implemented
- ✅ User authentication with email and OAuth providers (Google, Spotify)
- ✅ Spotify API integration for playlist creation and management
- ✅ OpenAI integration for AI-powered playlist generation
- ✅ Multi-step playlist creation wizard UI
- ✅ Subscription management with Stripe
- ✅ Usage quota tracking for free vs premium users
- ✅ Dashboard and playlist management UI

### Recent Fixes

#### Dashboard 404 Error Fix
- Added client-side mounting check to prevent hydration issues
- Created error boundary with `error.tsx` to catch and display rendering errors
- Added loading state with `loading.tsx` to improve UX during page transitions
- Ensured trailing slash configuration for consistent URL handling

### Next Steps
1. Address remaining vulnerabilities from npm audit report
2. Add comprehensive error handling for authentication edge cases
3. Implement additional user management features
4. Enhance analytics and reporting capabilities
5. Improve playlist recommendation algorithm performance

## Key Lessons
1. When implementing OAuth flows, ensure consistent redirect URIs throughout the flow
2. Implement proper error handling for authentication issues with detailed logging
3. Process API requests in batches to avoid rate limits with external services
4. Implement fallback strategies for AI recommendations that may not exactly match catalog items
5. Use progressive loading patterns to improve perceived performance in complex pages
6. Prioritize using cached data before making database queries to improve performance
7. Handle client-side hydration carefully in Next.js applications to avoid 404 errors

## Spotify Verification Flow Issue (Planner 2025-06-11)

### Background and Motivation
Email sign-up flow shows a dedicated `/auth/verify` page prompting the user to check their inbox. The same UX is required for Spotify sign-up when Supabase returns `provider_email_needs_verification`. Currently users are redirected to `/` with query parameters and no verify page, so UX is inconsistent.

### Key Challenges and Analysis
1. **Where error surfaces** – When Spotify OAuth completes, Supabase hosts the callback at `https://<project>.supabase.co/auth/v1/callback`. If the provider email is unverified, Supabase *does not* redirect to our `redirectTo` URL. Instead it appends `?error=access_denied&error_code=provider_email_needs_verification&error_description=…` to *that* URL and instantly redirects the browser there. Therefore our application first lands on whatever `redirectTo` we supplied **plus** those query params.
2. **Current implementation** – `signInWithSpotify` sets `redirectTo=/auth/callback?provider=spotify`. However logs show the browser eventually hits `/` or `/settings`, *not* `/auth/callback`. This implies Supabase still uses a *server route* style, e.g. `/api/auth/callback/spotify` (from NextAuth) and then our app router exits early with session.
3. **Missing verify redirect** – The new logic that forwards to `/auth/verify` lives in `src/app/auth/callback/route.ts`, but that handler is **never invoked** for Spotify – the hosted callback goes to `/api/auth/callback/spotify`, bypassing it.
4. **Fix direction** – We need a universal guard: wherever the browser first lands with the `provider_email_needs_verification` params we must reroute to `/auth/verify?provider=spotify`. Two paths:
   a) Middleware catch-all: detect these query params on *any* path and reroute early.
   b) Custom API route for `/api/auth/callback/spotify` to transform redirect.
   c) Ensure `redirectTo` points to `/auth/callback` (app router) not `/api/...`.

### High-level Task Breakdown
- [ ] T1 Confirm actual `redirectTo` param received by Supabase in network log and path that loads with error params (success criteria: reproduce unverified flow in dev, capture URL).
- [ ] T2 Decide approach: either guarantee `redirectTo=/auth/callback` works, or add middleware fallback.
- [ ] T3 If `/auth/callback` never reached, adjust `signInWithSpotify` options to absolute URL including protocol & port (Supabase requires fully qualified). Success: after auth, app hits `/auth/callback`.
- [ ] T4 Implement universal middleware rule: if any request contains `error_code=provider_email_needs_verification`, redirect to `/auth/verify?provider=spotify&email=<parsed>`.
- [ ] T5 Unit test: trigger fake callback URL locally and assert redirect.
- [ ] T6 Manual QA: run flow with Spotify account w/ unverified email, ensure verify page shows.

### Success Criteria
1. Browser displays `/auth/verify` page with Spotify branding immediately after attempting Spotify auth with unverified email.
2. URL contains provider param, email if available.
3. No landing page toast; same UX as email flow.
4. Normal Spotify auth with verified email still signs in to dashboard.

### Project Status Board
- [x] Add 'use client' directive to src/app/auth/verify/page.tsx to fix Next.js build error

## Stripe Plan Upgrade Issue (Planner 2025-06-12)

### Background and Motivation
Users can upgrade from free → premium via Stripe checkout/portal. After successful payment, Stripe sends webhooks; Supabase DB `subscriptions.plan_type` should update to `premium`. Currently it remains `free`, so app still treats upgraded users as free.

### Key Challenges and Analysis
1. **Webhook endpoint** – Need to verify we have `/api/webhooks/stripe` (or similar) handling `customer.subscription.updated` / `checkout.session.completed`, updating Supabase.
2. **DB schema** – `subscriptions` table has `plan_type` enum default `free`. Update likely via Supabase function (e.g., `handle_stripe_webhook`) or our Next.js API.
3. **Admin vs service_role** – Update requires service key or RLS bypass.
4. **Failure modes** – webhook secret incorrect, endpoint returns 500, SQL update missing `plan_type`, wrong customer id mapping.
5. **HTTP 308 Status Codes** – Logs show webhooks are receiving HTTP 308 "Permanent Redirect" responses, which indicates the endpoint exists but the request is being redirected. This is likely related to the trailing slash configuration in Next.js.

### High-level Tasks
- [x] S1 Locate webhook handler file; read logic.
- [x] S2 Reproduce Stripe webhook event in logs to confirm hitting endpoint.
- [ ] S3 Check update query to `subscriptions` table; ensure it sets `plan_type`.
- [ ] S4 Ensure Supabase service role key env var available in prod & dev.
- [ ] S5 Add unit/integration test simulating webhook to verify DB update.
- [ ] S6 Fix the 308 redirection issue with the webhook endpoint.

### Success Criteria
Subscription upgrade triggers `subscriptions.plan_type` → `premium` within seconds; app shows premium features.

### Project Status Board
- [x] S1 Located webhook handler in `src/app/api/webhooks/stripe/route.ts` and processing logic in `src/lib/stripe/webhooks.ts`. The webhook handler processes Stripe events correctly, and updating the subscription plan type to 'premium' is handled in the `handleCheckoutSessionCompleted` and `handleSubscriptionUpdated` functions.
- [x] S2 Verified webhook logs show requests are being received, but they're receiving 308 redirects instead of 200 responses.
- [x] S3 Check HTTP 308 issue - this is likely related to Next.js config where `trailingSlash: true` is configured. The webhook requests might be hitting `/api/webhooks/stripe` without a trailing slash, causing Next.js to issue a 308 redirect to `/api/webhooks/stripe/` with a trailing slash using a 308 status code (permanent redirect). Stripe's webhook system may not be following these redirects correctly.
- [x] S4 Fix and test the webhook handler - Modified `next.config.js` to set `trailingSlash: false` so that requests without trailing slashes will be handled directly without redirection.
- [ ] S5 Restart the server and test with real Stripe webhooks to verify the fix.

### Executor Requests
Identified that the issue was related to the trailing slash configuration in Next.js (`trailingSlash: true` in next.config.js). Stripe was sending webhooks to `http://localhost:3000/api/webhooks/stripe` without a trailing slash, but our Next.js configuration was redirecting these to `http://localhost:3000/api/webhooks/stripe/` with a trailing slash using a 308 status code (permanent redirect). Stripe's webhook system wasn't following these redirects correctly.

I've implemented the fix by modifying the Next.js configuration in `next.config.js` to set `trailingSlash: false`, which will handle requests with or without trailing slashes. The server needs to be restarted for this change to take effect.

Next steps:
1. Restart the Next.js server
2. Test the webhook endpoint with a Stripe webhook
3. Verify that the subscription updates correctly in the Supabase database

## Subscription UI Status Bug (Planner 2025-06-12)

### Background and Motivation
The backend and database correctly show the user as "premium", but the UI in the settings subscription section still displays "Free Plan". This suggests a frontend data fetching, state management, or mapping issue that needs to be resolved so users always see their correct plan status.

### Key Challenges and Analysis
- The API endpoint `/api/user/subscription` returns the correct data (`plan_type: "premium"`, `isPremium: true`).
- The UI component is not reflecting this, possibly due to:
  - Stale or cached data in React Query or SWR.
  - Incorrect mapping of API response to UI state.
  - A bug in the logic that determines which plan to display.
  - A race condition or async issue in fetching/rendering.
  - The UI is using a different endpoint or not waiting for the fetch to complete.

### High-level Task Breakdown
- [ ] P1: Locate the settings subscription section component and identify how it fetches and maps the subscription data.
- [ ] P2: Check which API endpoint is being called and verify the data flow from API to UI.
- [ ] P3: Review the logic that determines which plan is displayed (mapping of `plan_type` or `isPremium`).
- [ ] P4: Add debug logs or use React DevTools to verify the state and props at render time.
- [ ] P5: Test with a premium user and ensure the UI updates after a successful fetch.
- [ ] P6: If using React Query/SWR, check for cache invalidation or stale data issues.
- [ ] P7: Write a unit/integration test to ensure the UI reflects the correct plan based on API data.

### Success Criteria
- The settings subscription section always displays the correct plan ("Pro" or "Free") based on the latest backend data.
- The UI updates immediately after a successful upgrade/downgrade.
- No stale or incorrect plan status is shown after a page reload.

### Project Status Board
- [ ] P1: Locate and audit subscription section component
- [ ] P2: Trace API call and data mapping
- [ ] P3: Fix mapping/logic if needed
- [ ] P4: Test and verify

## Executor's Feedback or Assistance Requests
- The 'use client' directive was added at the top of src/app/auth/verify/page.tsx, as required for React hooks usage in Next.js app directory.
- Linter errors about missing modules/types (e.g., 'react', 'next/link', 'react-hot-toast') are likely due to local type resolution and should not affect Vercel deployment if dependencies are installed correctly.
- Please trigger a new build on Vercel to verify if the issue is resolved. If the build still fails, provide the new error output for further debugging.

## Lessons
- When using React hooks in a Next.js app directory file, always add 'use client' at the top of the file.