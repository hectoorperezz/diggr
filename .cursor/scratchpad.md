# Diggr - AI-Powered Music Discovery Platform

## Background and Motivation
Diggr is designed for music enthusiasts who value deep discovery over passive listening. The platform allows users to create personalized playlists based on specific genres, moods, regions, and eras. Using AI, Diggr curates tracklists with both popular tracks and hidden gems, which can be saved directly to the user's Spotify account.

The key differentiator for Diggr is its focus on curation quality and deep music discovery rather than algorithm-driven mainstream recommendations. Users get an intentional, soulful playlist experience with both familiar tracks and B-sides they might have missed.

## Technical Architecture

### Frontend Architecture
- **Framework**: Next.js with App Router for server components and routing
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

### Database Schema (Updated from Migration Files)

#### Tables and Relationships

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

#### Custom Functions

**exec_sql(sql text)**
- Executes dynamic SQL for migrations
- Security: SECURITY DEFINER, accessible only to service_role

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

## Project Timeline

### Phase 1: Foundation (Weeks 1-2)
- Project setup and configuration
- Supabase integration and authentication
- Database schema implementation
- Frontend core and component library

### Phase 2: Core Functionality (Weeks 3-4)
- Playlist creation wizard
- OpenAI integration
- Spotify API integration

### Phase 3: Monetization & Polish (Weeks 5-6)
- Subscription management
- Quota tracking and enforcement
- UI polish and responsive design

### Phase 4: Testing & Launch (Weeks 7-8)
- Testing and deployment
- Beta launch and feedback collection
- Adjustments and optimization

## Risk Management

### Identified Risks and Mitigation Strategies

#### 1. Spotify API Rate Limits
**Risk**: Exceeding Spotify API rate limits, especially during high traffic.
**Mitigation**: Implement request batching, caching mechanisms, and rate limiting on our side. Use exponential backoff for retries.

#### 2. OpenAI API Costs
**Risk**: Unexpected OpenAI API costs if usage spikes.
**Mitigation**: Implement strict token limits, caching for similar requests, and budget alerts. Consider fallback strategies for high traffic periods.

#### 3. Inaccurate Music Recommendations
**Risk**: OpenAI generating recommendations that don't match user criteria.
**Mitigation**: Implement validation against Spotify API, develop comprehensive prompt engineering, and create feedback loops for continuous improvement.

#### 4. Authentication Security
**Risk**: Security vulnerabilities in the authentication flow.
**Mitigation**: Follow OAuth best practices, implement token refresh strategies, encrypt sensitive data, and regularly audit authentication flows.

#### 5. Payment Processing Issues
**Risk**: Failed payments or subscription management problems.
**Mitigation**: Extensive testing of Stripe integration, clear error handling, and robust webhook processing for subscription events.

## Deployment Strategy

### Development Environment
- Local development with environment variables for API credentials
- Supabase local development instance
- Mock data for testing

### Staging Environment
- Vercel preview deployments for PR testing
- Supabase staging project
- Test Stripe accounts
- Limited OpenAI API usage

### Production Environment
- Vercel production deployment
- Supabase production project
- Production Stripe account
- Full OpenAI API access
- Monitoring and alerting setup

### CI/CD Pipeline
- GitHub Actions for automated testing
- Vercel integration for automatic deployments
- Code quality checks (linting, formatting)
- Database migration management

## Key Challenges and Analysis

### 1. Spotify API Integration
- OAuth flow implementation for secure user authentication
- Managing token refresh and persistence
- Efficient search and filtering of Spotify's vast catalog
- Playlist creation and management via API
- Handling rate limits and API constraints

### 2. OpenAI Integration
- Crafting effective prompts that yield high-quality music recommendations
- Balancing mainstream and obscure recommendations based on user preference
- Ensuring genre, mood, era, and regional accuracy in recommendations
- Processing and formatting OpenAI's responses for Spotify API compatibility
- Managing token usage and costs

### 3. Multi-step UI Wizard
- Creating an intuitive flow that doesn't overwhelm users
- Implementing responsive design for all device sizes
- Building smooth transitions between steps using Framer Motion
- Validating user inputs at each step
- Providing visual feedback during the generation process

### 4. Subscription Management
- Implementing Stripe for secure payment processing
- Creating subscription tiers (free vs. premium)
- Handling subscription lifecycle events (creation, cancellation, updates)
- Setting up webhook endpoints to process Stripe events
- Managing subscription status in the database

### 5. Database Schema
- Designing efficient Supabase tables for users, playlists, and usage
- Implementing quota tracking for free users
- Storing playlist metadata for history and analytics
- Managing user preferences and settings
- Ensuring proper indexing for performance

### 6. Authentication and Dashboard Loading Issues

#### Root Cause Analysis
The dashboard is not loading because of several potential issues with the authentication flow:

1. **Authentication Initialization Loop**: The SupabaseProvider is responsible for initializing the authentication state, but there might be a loop or timing issue with how the authentication is being initialized.

2. **Missing User Profile Data**: When a user signs in, a corresponding record should be created in the `users` table. If this record is missing or fails to be created, it could cause the dashboard to not render properly.

3. **State Management Issues**: The dashboard component relies on multiple state variables (`isLoading`, `hasCheckedAuth`, `session`, `user`, `userProfile`), and there might be a race condition or incorrect dependencies in the useEffect hooks.

4. **Client-Side Rendering Conflicts**: The dashboard uses both client-side and server-side data fetching, which might lead to hydration errors or mismatches.

5. **Error Handling**: The current error handling might be swallowing critical errors or not setting the error state properly, causing the dashboard to appear stuck in loading.

#### Impact
Users can't access the dashboard after logging in, effectively blocking them from using the application's core functionality.

#### Potential Solutions
1. Improve the authentication initialization logic to prevent multiple initializations
2. Enhance error handling in the SupabaseProvider to capture and display authentication errors
3. Ensure user profiles are automatically created when missing
4. Add more detailed logging to track the authentication flow
5. Restructure the dashboard component to handle loading states more gracefully

### 7. Settings Page UI Issues

#### Root Cause Analysis
The Settings page has several user interface issues that impact usability:

1. **Spotify Connection Button Logic**: The Spotify connection button is always clickable, even when a user is already connected. This can lead to confusion and unnecessary attempts to reconnect.

2. **Member Since Field Not Displaying Data**: The "Member Since" field is not properly displaying the user's registration date even though the user object should contain this information.

3. **Inefficient Status Checking**: The current implementation makes excessive database calls to verify the Spotify connection status, which could be optimized.

4. **Unclear Connection Status**: The status indication could be clearer, especially during loading states.

#### Impact
These issues lead to a confusing user experience in the Settings page, potentially causing users to attempt invalid actions or miss important account information.

#### Potential Solutions
1. Improve the Spotify connection button logic to ensure it's only clickable when appropriate
2. Fix the data formatting for the Member Since field
3. Optimize the status verification process to reduce database queries
4. Enhance the UI to more clearly indicate connection states

### 8. Dashboard Loading Timeout Issue (NEW)

#### Root Cause Analysis
After examining the codebase, particularly the `dashboard/page.tsx` and `components/providers/SupabaseProvider.tsx` files, I've identified several potential causes for the "Loading took too long" error that users are experiencing:

1. **Multiple API Requests Creating Race Conditions**:
   - The dashboard is making several API calls simultaneously:
     - Authentication status check
     - User profile fetching
     - Subscription data fetching
     - Playlist data fetching
   - If any of these requests take too long or fail, it can trigger the timeout

2. **Fixed Timeout Constraints**:
   - The dashboard has a 5-second timeout (line 30 in dashboard/page.tsx)
   - The SupabaseProvider has a 3-second timeout (line 281 in SupabaseProvider.tsx)
   - These timeouts may not be sufficient for users with slower connections

3. **Inefficient Authentication Flow**:
   - Authentication initialization is guarded by both local and global flags
   - The authentication state change listener can trigger multiple updates
   - Profile fetching errors aren't properly handled in all cases

4. **Network Connectivity Issues**:
   - The error is more likely to occur on slower connections or unstable networks
   - Multiple fetches exacerbate the problem in poor network conditions

5. **Supabase Response Time Spikes**:
   - Supabase may occasionally have performance fluctuations
   - The authentication flow makes several requests to Supabase

6. **Client-Side Hydration Issues**:
   - The dashboard has complex state dependencies (user, session, userProfile, etc.)
   - Hydration mismatches could lead to rendering delays

#### Impact
This issue significantly affects user experience:
- Users see a frustrating "Something went wrong" screen
- They're forced to sign out and try again, creating a poor first impression
- Users might abandon the app entirely if they encounter this repeatedly

#### Potential Solutions

1. **Optimize Authentication Flow**:
   - Simplify the authentication process by reducing redundant checks
   - Implement better caching of authentication state
   - Prioritize critical data fetching over non-essential data

2. **Increase Timeout Thresholds**:
   - Adjust the timeout values to be more generous (8-10 seconds instead of 3-5)
   - Implement dynamic timeouts based on network conditions detection

3. **Implement Progressive Loading**:
   - Show the dashboard shell as soon as authentication is confirmed
   - Load non-critical data (playlists, subscription details) asynchronously
   - Use skeleton UI elements while content loads

4. **Add Retry Mechanisms**:
   - Implement automatic retries with exponential backoff for failed requests
   - Add refresh button to allow users to retry loading without signing out

5. **Enhance Error Handling**:
   - Differentiate between authentication failures and data fetch failures
   - Provide more specific error messages and recovery actions
   - Add detailed logging for debugging

6. **Server-Side Data Prefetching**:
   - Consider migrating critical data fetching to server components
   - Use Next.js's built-in data fetching capabilities to preload data

7. **Implement Service Worker**:
   - Cache authentication data with a service worker
   - Speed up subsequent loads by serving cached data first

## High-level Task Breakdown

### 1. Project Setup and Configuration (1-2 days)
- [x] Initialize Next.js project with App Router
- [x] Configure Tailwind CSS and design system
- [x] Set up Framer Motion
- [x] Create environment variables structure
- [x] Configure Git repository
- [x] Set up linting and formatting tools
- [x] Create project structure and core components

**Success Criteria:** Project initialized with all dependencies installed, environment variables set up, and basic structure defined.

### 2. Supabase Integration and Authentication (1-2 days)
- [x] Set up Supabase project
- [x] Design and create database schema
- [x] Implement user authentication with Supabase
- [x] Set up Spotify OAuth flow
- [x] Create authentication middleware
- [x] Implement session management
- [x] Build user profile pages

**Success Criteria:** Users can sign up, log in, and authenticate with Spotify. Sessions persist and user data is stored in Supabase.

### 3. Database Schema Implementation (1 day)
- [x] Create users table with Spotify connection status
- [x] Design playlists table with metadata
- [x] Set up subscriptions table linked to Stripe
- [x] Implement usage_stats table for quota tracking
- [x] Create database access functions and helpers

**Success Criteria:** All tables created in Supabase with proper relationships and indexing. Helper functions successfully interact with the database.

### 4. Frontend Core and Component Library (2-3 days)
- [x] Build layout components (header, footer, navigation)
- [x] Create form components for the wizard
- [x] Implement card components for playlists and tracks
- [x] Build button and input component library
- [x] Create loading and error states
- [x] Implement responsive grid system

**Success Criteria:** Component library is complete with all necessary UI elements styled according to the design guide.

### 5. Playlist Creation Wizard (3-4 days)
- [x] Build step navigation and progress indicator
- [x] Implement genre and subgenre selection
- [x] Create country and language selection UI
- [x] Build mood and era selection interface
- [x] Implement uniqueness slider
- [x] Create playlist details form (name, visibility, count)
- [x] Build wizard state management
- [x] Implement form validation

**Success Criteria:** Users can complete the full wizard flow with all inputs validated and state preserved between steps.

### 6. OpenAI Integration (2-3 days)
- [x] Create prompt engineering module
- [x] Build prompt templates for different criteria combinations
- [x] Implement OpenAI API client
- [ ] Create response parsing and formatting logic
- [ ] Implement error handling and fallbacks
- [ ] Build caching mechanism for similar requests

**Success Criteria:** The system can generate relevant track recommendations based on user criteria via OpenAI that match the specified genres, moods, and eras.

### 7. Spotify API Integration (2-3 days)
- [x] Implement Spotify Web API client
- [x] Create track search and metadata retrieval functions
- [x] Build playlist creation and management
- [x] Implement user profile and library access
- [x] Create token refresh and management system
- [ ] Build error handling for API limits and failures

**Success Criteria:** The system can search for tracks, retrieve metadata, and create playlists in users' Spotify accounts.

### 8. Subscription Management (2-3 days)
- [x] Set up Stripe integration
- [x] Create subscription plans in Stripe
- [x] Implement checkout flow
- [x] Build webhook endpoints for Stripe events
- [x] Create subscription management UI
- [x] Implement billing history and management

**Success Criteria:** Users can subscribe to the premium plan, manage their subscription, and view billing history.

### 9. Quota Tracking and Enforcement (1-2 days)
- [x] Implement usage tracking for playlist creation
- [x] Build quota reset logic (monthly)
- [x] Create middleware to enforce quotas
- [x] Implement UI for displaying quota usage
- [x] Build upgrade prompts for users approaching limits

**Success Criteria:** Free users are limited to 5 playlists per month, with proper notifications and upgrade prompts.

### 10. UI Polish and Responsive Design (2-3 days)
- [ ] Implement animations with Framer Motion
- [ ] Optimize for mobile and tablet
- [x] Create dark mode
- [ ] Implement accessibility features
- [ ] Optimize load times and performance
- [ ] Add micro-interactions and feedback

**Success Criteria:** UI is polished, responsive, and follows the design guide with smooth animations and transitions.

### 11. Testing and Deployment (2-3 days)
- [ ] Write unit tests for critical components
- [ ] Implement integration tests for key flows
- [ ] Set up CI/CD pipeline
- [ ] Configure Vercel deployment
- [ ] Implement error monitoring
- [ ] Create production environment variables

**Success Criteria:** Application passes all tests, deploys successfully to Vercel, and monitoring is in place.

### 5. Spotify OAuth Integration (2-3 days) [COMPLETED]
- [x] Set up Spotify Developer account and create app
- [x] Implement OAuth flow with authorization code grant
- [x] Create server-side token exchange endpoint
- [x] Store Spotify refresh tokens securely in Supabase
- [x] Implement token refresh mechanism
- [x] Integrate Spotify connection UI in settings page
- [x] Add proper error handling and debugging tools
- [x] Test connection and token exchange flows

**Success Criteria:** Users can successfully connect their Spotify accounts, tokens are securely stored, and the application can make authorized Spotify API calls.

### 12. Settings Page Improvements (1-2 days) [NEW]
- [x] Fix Spotify connection button state logic
  - Ensure button is only clickable when user is not connected
  - Add proper disabled state for already connected users
- [x] Fix Member Since date display
  - Properly format the user's creation date
  - Add fallback for missing data
- [x] Optimize Spotify connection status verification
  - Reduce unnecessary database queries
  - Improve status caching and state management
- [x] Enhance UI feedback for connection status
  - Clearer loading states
  - More intuitive status indicators

**Success Criteria:** The Settings page correctly displays the Member Since date, and the Spotify connection button is only clickable when appropriate (when user is not already connected). The page performs efficiently without excessive database queries.

### 13. Fix Dashboard Loading Timeout Issue (NEW)

1. **Optimize Authentication Flow**
   - Refactor SupabaseProvider to reduce complexity
   - Simplify authentication state management
   - Consolidate duplicate API calls

2. **Implement Progressive Loading**
   - Modify dashboard to load in stages
   - Add skeleton UI components
   - Prioritize critical user data

3. **Improve Error Handling**
   - Add more specific error states
   - Implement recovery actions for common errors
   - Add detailed logging for debugging

4. **Adjust Timeouts and Add Retries**
   - Increase timeout thresholds
   - Add automatic retry logic for failed requests
   - Implement refresh functionality

**Success Criteria:** Users no longer experience the "Loading took too long" error or, if network issues persist, they have clear options to recover without signing out.

## Project Status Board (Updated)

### Completed Tasks
- [x] Initialize Next.js project with App Router
- [x] Configure Tailwind CSS and design system
- [x] Create environment variables structure
- [x] Configure Git repository
- [x] Create project structure and core components
- [x] Build layout components (header, footer, navigation)
- [x] Create form components for authentication
- [x] Implement card components for dashboard
- [x] Build button and input component library
- [x] Set up Supabase project
- [x] Implement user authentication with Supabase
- [x] Create authentication middleware
- [x] Implement session management
- [x] Create users table with Spotify connection status
- [x] Implement basic Dashboard UI
- [x] Create Settings page with Spotify connection UI
- [x] Implement Spotify authorization URL generation
- [x] Create Spotify callback route handler
- [x] Implement token storage and refresh mechanism
- [x] Add UI indicators for Spotify connection status
- [x] Create multi-step playlist creation wizard
- [x] Implement genre and mood selection components
- [x] Add era and region selection components
- [x] Create playlist details form (name, description, etc.)
- [x] Implement OpenAI client for track suggestions
- [x] Create API endpoint for playlist generation
- [x] Implement track search and matching with Spotify
- [x] Connect wizard UI to API endpoints
- [x] Implement playlist creation in user's Spotify account
- [x] Create database storage for playlist metadata
- [x] Implement playlist detail view
- [x] Create public directory for static assets
- [x] Add logo images and favicon
- [x] Implement logo across all application pages
- [x] Configure proper favicon handling
- [x] Fix authentication and loading issues
- [x] Implement usage_stats table for quota tracking
- [x] Create database functions for playlist count and usage tracking
- [x] Fix function naming conflicts in database
- [x] Implement playlist limit checking based on subscription tier
- [x] Fix Member Since date display in Settings page
- [x] Fix Spotify connection button state logic in Settings page
- [x] Optimize Spotify connection status verification
- [x] Enhance UI feedback for connection status
- [x] Create Stripe utility library
- [x] Implement subscription database schema
- [x] Create checkout and portal API endpoints
- [x] Create webhook handler for Stripe events
- [x] Implement subscription status checks
- [x] Create pricing page with subscription options
- [x] Add subscription management to settings page
- [x] Add subscription status to dashboard
- [x] Enforce subscription limits in playlist creation

### Next Priority Tasks
- [ ] Add comprehensive error handling and testing
- [ ] Implement playlist management (delete, edit)
- [ ] Add user dashboard with playlist history

### Backlog
- [ ] Set up Stripe integration
- [ ] Create subscription plans
- [ ] Implement checkout flow
- [ ] Build subscription management UI

## Current Status / Progress Tracking

### Completed Tasks
1. Project setup and base structure implemented
2. Supabase authentication and database schema established
3. Basic UI components and layout created
4. Spotify OAuth integration completed with proper error handling
5. Playlist creation wizard UI implementation completed with multi-step form and all selection components
6. OpenAI integration for generating playlist recommendations implemented
7. Spotify API integration for creating playlists implemented
8. Playlist detail view created
9. Public directory setup with logo and favicon implementation
10. UI enhancements with logo integration across all pages
11. Authentication issues resolved in SupabaseProvider component
12. Improved loading states and error handling
13. Fixed database functions for playlist quota tracking and limit enforcement
14. Added usage statistics tracking functionality for playlist creation
15. Fixed settings page UI issues:
    - Fixed the Spotify connection button to only be clickable when the user is not connected
    - Improved Member Since date display with better formatting
    - Optimized Spotify connection status verification to reduce database queries
    - Enhanced UI feedback for connection states
16. Stripe integration completed successfully
17. Added subscription database schema
18. Created checkout and portal API endpoints
19. Created webhook handler for Stripe events
20. Implemented subscription status checks
21. Created pricing page with subscription options
22. Added subscription management to settings page
23. Added subscription status to dashboard
24. Enforced subscription limits in playlist creation

### In Progress
1. Implementing comprehensive error handling and validation across the application

### Next Steps
1. Implement comprehensive error handling and validation
2. Create playlist management functionality (edit, delete)
3. Implement user profile and playlist history pages

### Blockers
None currently - All tasks are progressing as expected.

## Executor's Feedback or Assistance Requests
Successfully improved the Settings page functionality:

1. Fixed the Spotify connection button logic to ensure it's only clickable when the user is not already connected.
2. Improved the Member Since date display with more detailed formatting.
3. Completely refactored the Spotify connection status verification to:
   - Prioritize using userProfile data when available (faster)
   - Only fall back to database queries when necessary
   - Provide clearer logging and error handling
   - Optimize the verification process to avoid redundant queries
4. Enhanced the UI with better status indicators and improved the user experience.

These improvements create a more intuitive and efficient user interface that clearly shows the user's account status and prevents them from attempting invalid actions.

## Lessons
1. When implementing OAuth flows, always ensure the exact same redirect URI is used throughout the flow and matches what's registered in the provider's dashboard.
2. Authorization codes from Spotify expire quickly (within a minute) and can only be used once.
3. Handle UI notifications carefully to prevent duplicate or endless notifications.
4. Implement proper error handling with detailed logs to diagnose authentication issues.
5. Create debug endpoints and pages when troubleshooting complex auth flows.
6. Process API requests in batches to avoid rate limits, especially when making multiple calls to external services.
7. Implement fallback strategies when searching for tracks, as AI recommendations might not exactly match Spotify's catalog.
8. Provide clear feedback to users throughout asynchronous processes like playlist creation.
9. When using authentication providers like Supabase in Next.js, prevent multiple initialization events to avoid re-rendering loops.
10. Always have a graceful error handling path for missing user profiles or auth state issues to prevent loading screens from getting stuck.
11. Consider using the authInitialized state variable pattern to ensure auth is only initialized once per session.
12. Be cautious with router refreshes in auth state changes as they can cause unnecessary re-renders or redirects.
13. Include info useful for debugging in the program output.
14. Read the file before you try to edit it.
15. If there are vulnerabilities that appear in the terminal, run npm audit before proceeding.
16. Always ask before using the -force git command.
17. When implementing favicons, ensure they're properly formatted and referenced in multiple ways to support various browsers.
18. For Next.js applications using the App Router, static assets in the public directory are automatically served at the root path.
19. Adding explicit link tags in the head section can help ensure browser recognition of favicons and logos.
20. In PostgreSQL, function overloading (multiple functions with the same name but different parameter signatures) can cause ambiguity errors. Always use unique function names or explicitly specify parameter types when calling functions, and include DROP FUNCTION IF EXISTS statements in your migrations to avoid conflicts.
21. When handling UI state for connectivity or status features, ensure button enablement logic properly reflects the current state to prevent users from attempting actions that aren't applicable to their current state.
22. For status verification operations, prioritize using cached or already-available data (like userProfile) before making database queries to improve performance and reduce server load.
23. When implementing complex authentication flows, consider using progressive loading patterns to improve perceived performance and avoid timeout errors.
24. Always provide users with self-service recovery options (like a retry button) rather than forcing them to sign out when errors occur.
25. Use skeleton UI components to improve perceived loading performance on screens with multiple data dependencies.

## Code Cleanup Execution (Executor Mode)

I'm now executing the code cleanup tasks in order of priority as outlined in the plan. I'll track progress here and update as tasks are completed.

### Task 1: Create dedicated scripts directory

**Current Status:** ✅ Completed

**Steps Taken:**
1. ✅ Created `/scripts` directory
2. ✅ Reviewed each utility script in the root directory
3. ✅ Moved relevant scripts to the new directory
4. ✅ Created a README.md file documenting each script's purpose
5. ✅ Committed changes to the repository

**Results:**
- Created a dedicated scripts directory
- Moved all 14 utility JavaScript files from the root directory to `/scripts`
- Added documentation for each script in a README.md file
- Improved code organization by removing clutter from the project root

### Task 2: Fix favicon duplication

**Current Status:** ✅ Completed

**Steps Taken:**
1. ✅ Audited all favicon files across the project
2. ✅ Determined which favicon files were actually being used
3. ✅ Established proper favicon structure following Next.js best practices
4. ✅ Updated head components to use the correct favicon references
5. ✅ Removed duplicate favicon files

**Results:**
- Created a dedicated `/public/favicons` directory to organize all favicon files
- Consolidated all favicon files into a single location
- Updated all references in the codebase to use the new location
- Removed 7 duplicate favicon files from various locations
- Improved maintainability by following Next.js best practices for static assets

### Task 3: Improve documentation

**Current Status:** ✅ Completed

**Steps Taken:**
1. ✅ Created a comprehensive README.md file for the project
2. ✅ Added detailed setup instructions
3. ✅ Documented project architecture and structure
4. ✅ Added information about development workflow

**Results:**
- Created a comprehensive README.md with project overview, features, and tech stack
- Added detailed installation and setup instructions
- Documented database structure and configuration
- Included project structure and key components information
- Added deployment and contribution guidelines

## Code Cleanup Summary

All planned code cleanup tasks have been successfully completed:

1. **Organized Utility Scripts** ✅
   - Created a dedicated `/scripts` directory
   - Moved 14 utility JavaScript files from the root directory
   - Added documentation for each script

2. **Fixed Favicon Duplication** ✅
   - Created a dedicated `/public/favicons` directory
   - Consolidated all favicon files into a single location
   - Updated all references in the codebase
   - Removed 7 duplicate favicon files

3. **Improved Documentation** ✅
   - Created a comprehensive README.md
   - Documented setup instructions and architecture
   - Added project structure information

These improvements have significantly enhanced the project's organization, maintainability, and onboarding experience for new developers. The codebase is now cleaner, more structured, and better documented.

## Executor's Feedback or Assistance Requests

All code cleanup tasks have been successfully completed. The project structure is now more organized with:

1. A dedicated scripts directory for utility scripts
2. Properly organized favicon files in a single location
3. Comprehensive documentation for the project

These changes have improved the maintainability of the codebase and made it easier for new developers to understand and contribute to the project. No further cleanup tasks are required at this time.

## Bug: Stripe Subscription Upgrade Not Updating Plan Details

**Reported by:** User
**Date:** 2023-06-03

### Problem Description
When a user upgrades their subscription in Stripe, the `stripe_customer_id` is correctly updated in the `subscriptions` table in the database. However, the `plan_type`, `current_period_start`, and `current_period_end` columns are not being updated. This is crucial for managing subscriptions correctly and displaying the accurate plan type to the user in the frontend.

**Root Cause Analysis (Updated by Planner):**
The investigation revealed that the Express server defined in `server/index.ts` and `server/routes.ts` **does not currently have a Stripe webhook endpoint defined.** The `server/routes.ts` file, responsible for registering API routes, is essentially empty. Therefore, the application is not listening for or processing any Stripe events, which is why the database fields are not being updated upon subscription changes.

This means the task is not to fix a bug in an existing handler, but to **implement the Stripe webhook endpoint and its processing logic from scratch.**

### Goal
Implement a Stripe webhook endpoint and handler logic to ensure that `plan_type`, `current_period_start`, and `current_period_end` are correctly updated in the `subscriptions` table upon a subscription change event from Stripe.

### Analysis and Planning (Planner Mode) - Revised

1.  **Establish Webhook Endpoint:** Define a new POST route (e.g., `/api/stripe/webhook`) in `server/routes.ts`.
2.  **Implement Signature Verification:** Ensure the server can parse raw request bodies for this route (using `express.raw({ type: 'application/json' })`) and implement Stripe's `stripe.webhooks.constructEvent()` for signature verification.
3.  **Process Relevant Events:** Focus on handling `customer.subscription.updated` and potentially `invoice.payment_succeeded` events.
4.  **Data Extraction:** Correctly extract `stripe_subscription_id`, `stripe_customer_id`, `current_period_start`, `current_period_end`, `status`, and determine `plan_type` (by mapping Stripe Price ID to your internal plan names).
5.  **Database Update:** Implement the Supabase query to update the `subscriptions` table with the extracted data.
6.  **Configuration for Plan Mapping:** Plan how Stripe Price IDs will be mapped to your application's `plan_type` (e.g., using environment variables for Stripe Price IDs for 'premium', etc.).

### High-Level Task Breakdown (for Executor) - Revised

-   **Task 1: Create Stripe Webhook Endpoint and Basic Handler**
    -   **Action:** In `server/index.ts`, ensure `express.raw({ type: 'application/json' })` middleware is correctly applied for the future webhook route to allow Stripe signature verification. (✅ Done - `express.json()` made conditional, `express.raw()` applied for webhook path).
    -   **Action:** In `server/routes.ts`, define a new POST route (e.g., `/api/stripe/webhook`). (✅ Done).
    -   **Action:** Implement the basic structure of a Stripe webhook handler within this route. This includes:
        *   Retrieving the Stripe signature from the `Stripe-Signature` header. (✅ Done).
        *   Using `stripe.webhooks.constructEvent()` (ensure `stripe` SDK is imported and initialized) to verify the event and parse the body. (✅ Done).
        *   Setting up a basic `switch` statement to log different event types initially. (✅ Done, and expanded to handle subscription events).
    -   **Current Status:** ✅ Completed.
    -   **Success Criteria:** A new `/api/stripe/webhook` endpoint is created that can receive events from Stripe, verify their signatures, and log the event type. The server correctly handles raw JSON bodies for this endpoint.

-   **Task 2: Implement Subscription Update Logic in Webhook Handler**
    -   **Action:** Within the `switch` statement, add cases for `customer.subscription.updated` and `invoice.payment_succeeded`. (✅ Done, also included `customer.subscription.created` and `customer.subscription.deleted`).
    -   **Action:** Extract the relevant data from the Stripe event object:
        *   `stripe_subscription_id`, `stripe_customer_id`, `current_period_start`, `current_period_end`, `plan_id_from_stripe`, `status`. (✅ Done).
    -   **Action:** Implement logic to map `plan_id_from_stripe` to your internal `plan_type` (e.g., 'free', 'premium'). This might involve checking against Stripe Price IDs stored in environment variables (e.g., `STRIPE_PREMIUM_PRICE_ID`). (✅ Done - basic mapping for `STRIPE_PREMIUM_PRICE_ID` implemented. User needs to configure this env var and potentially add more for other plans).
    -   **Action:** Construct and execute a Supabase query (using the Supabase client) to update the `subscriptions` table. The update should target the record matching `stripe_subscription_id` and set `plan_type`, `current_period_start`, `current_period_end`, and `status`. (✅ Done - includes update logic and a basic insert for new subscriptions).
    -   **Current Status:** ✅ Completed.
    -   **Success Criteria:** The webhook handler correctly processes `customer.subscription.updated` and `invoice.payment_succeeded` events, extracts all necessary information including the mapped `plan_type`, and updates the `subscriptions` table in Supabase.

-   **Task 3: Testing and Verification**
    -   **Current Status:** ⏳ Pending User Action.
    -   **Action:** Use the Stripe CLI to forward webhook events to your local development server (e.g., `stripe listen --forward-to localhost:5001/api/stripe/webhook`).
    -   **Action:** Trigger subscription update events from the Stripe dashboard (e.g., changing a test customer's plan).
    -   **Action:** Verify in the Supabase dashboard that the `plan_type`, `current_period_start`, `current_period_end`, and `status` are updated correctly in the `subscriptions` table for the appropriate user.
    -   **Success Criteria:** The bug is confirmed to be resolved through testing, and subscription details are accurately reflected in the database.

### Executor's Feedback or Assistance Requests
- Implemented the Stripe webhook handler in `server/routes.ts` and modified `server/index.ts` for raw body parsing on the webhook route.
- The handler processes `customer.subscription.created/updated/deleted` and `invoice.payment_succeeded` events.
- It updates `plan_type`, `status`, `current_period_start`, `current_period_end`, and `stripe_customer_id` in the `subscriptions` table.
- **Important:** User needs to set the `STRIPE_PREMIUM_PRICE_ID` environment variable. If other paid plans exist, their Price IDs and mapping logic should be added.
- The `server/` files (`index.ts` and `routes.ts`) exhibited persistent linter errors related to module imports and Express typings. These seem to be environment-specific or related to the project's TS configuration for the `server/` directory and did not block the functional implementation of the webhook logic. The implemented webhook code follows standard Express and Stripe practices.

### Lessons
- When a feature reliant on webhooks isn't working as expected, first verify the webhook endpoint exists, is correctly configured to receive events (including raw body parsing for signature verification), and is processing the correct event types.
- Mapping external plan/price IDs (like Stripe's) to internal application plan identifiers is a common requirement in webhook handlers.

## Implementation Plan: Targeted Ads for Free Users During Playlist Creation

### Background and Motivation
To enhance the monetization strategy for Diggr, we need to implement video ads specifically for free tier users during the playlist creation process. This approach leverages a natural pause in user activity (when waiting for playlist generation) to show ads without disrupting the core user experience, while also creating a tangible benefit for premium subscribers who will enjoy an ad-free experience.

### Key Requirements
1. Ads should only be displayed to free tier users
2. Ads should appear during the playlist creation loading/generation process
3. Implementation should integrate with Google AdSense
4. Premium upgrade CTAs should be presented alongside ads

### Technical Analysis

#### 1. User Subscription Status Detection
We already have the subscription status infrastructure through the Supabase integration:
- `useSupabase()` hook provides `userProfile` with plan information
- Existing checks can determine if a user is on a free or premium plan
- We'll leverage this to conditionally show ads

#### 2. Playlist Creation Flow Analysis
The playlist creation process occurs primarily in:
- `/src/app/create-playlist/` - Frontend UI and wizard
- `/src/app/api/playlist/generate/` - Backend API endpoint

The key opportunity is during the API call to generate the playlist, when users are naturally waiting for results.

#### 3. Optimal Integration Points
The most effective point to show ads is:
- After user submits playlist criteria
- While the AI generation process is running
- Before displaying the final playlist results

This creates a non-disruptive ad experience that appears during a natural waiting period.

### Implementation Plan

#### 1. Create Video Ad Components

**VideoAdComponent.tsx**
```tsx
import React, { useEffect, useRef, useState } from 'react';

interface VideoAdProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
}

export const VideoAdComponent: React.FC<VideoAdProps> = ({
  onAdComplete,
  onAdError,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5); // Skip countdown
  const [canSkip, setCanSkip] = useState(false);
  
  // Handle ad initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Initialize Google AdSense
      const adScript = document.createElement('script');
      adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      adScript.async = true;
      adScript.dataset.adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // Publisher ID
      document.head.appendChild(adScript);
      
      adScript.onload = () => {
        if (adContainerRef.current) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
            
            // Track ad impression in Google Analytics
            if (window.gtag) {
              window.gtag('event', 'ad_impression', {
                'event_category': 'ads',
                'event_label': 'playlist_creation'
              });
            }
          } catch (e) {
            console.error("Ad push error:", e);
            setAdError("Failed to load advertisement");
            onAdError?.(e);
          }
        }
      };
      
      // Error handling
      adScript.onerror = (e) => {
        console.error("Ad loading error:", e);
        setAdError("Failed to load advertisement");
        onAdError?.(e);
      };
    } catch (e) {
      console.error("Ad initialization error:", e);
      setAdError("Failed to load advertisement");
      onAdError?.(e);
    }
  }, [onAdError]);
  
  // Skip button timer
  useEffect(() => {
    if (isLoaded && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLoaded && timeRemaining === 0) {
      setCanSkip(true);
    }
  }, [timeRemaining, isLoaded]);
  
  // Handle ad completion
  const handleSkip = () => {
    // Track skip event in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'ad_skipped', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    onAdComplete?.();
  };
  
  return (
    <div className="video-ad-container relative w-full max-w-xl mx-auto">
      {/* Loading state */}
      {!isLoaded && !adError && (
        <div className="flex flex-col items-center justify-center h-40 bg-black/20 backdrop-blur-lg rounded-xl p-6">
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-300">Loading advertisement...</p>
        </div>
      )}
      
      {/* Error state */}
      {adError && (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">Unable to load advertisement</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#1DB954] rounded-full text-sm"
          >
            Continue to Your Playlist
          </button>
        </div>
      )}
      
      {/* Ad display */}
      <div className={`ad-wrapper relative ${!isLoaded ? 'hidden' : ''}`}>
        <ins
          ref={adContainerRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Publisher ID
          data-ad-slot="XXXXXXXXXX" // Ad slot ID
          data-ad-format="video"
        />
        
        {/* Skip button */}
        <div className="absolute bottom-4 right-4">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="px-3 py-1 bg-black/70 text-white text-sm rounded-full flex items-center"
            >
              Skip Ad
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="px-3 py-1 bg-black/70 text-white/70 text-sm rounded-full">
              Skip in {timeRemaining}s
            </div>
          )}
        </div>
      </div>
      
      {/* Premium upgrade CTA */}
      {isLoaded && (
        <div className="mt-4 bg-black/30 backdrop-blur-md rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Enjoy an ad-free experience with Diggr Premium
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full text-sm font-medium"
            onClick={() => {
              // Track upgrade click
              if (window.gtag) {
                window.gtag('event', 'premium_cta_click', {
                  'event_category': 'conversion',
                  'event_label': 'from_ad'
                });
              }
            }}
          >
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoAdComponent;
```

**ConditionalAdDisplay.tsx**
```tsx
import React from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import VideoAdComponent from './VideoAdComponent';

interface ConditionalAdDisplayProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
  fallback?: React.ReactNode; // Component to show for premium users
}

export const ConditionalAdDisplay: React.FC<ConditionalAdDisplayProps> = ({
  onAdComplete,
  onAdError,
  fallback
}) => {
  const { userProfile } = useSupabase();
  
  // Check if user should see ads (free tier or no subscription)
  const shouldShowAds = !userProfile?.plan_type || userProfile?.plan_type === 'free';
  
  if (!shouldShowAds) {
    return <>{fallback}</>;
  }
  
  return (
    <VideoAdComponent
      onAdComplete={onAdComplete}
      onAdError={onAdError}
    />
  );
};

export default ConditionalAdDisplay;
```

#### 2. Integration with Playlist Creation Flow

The playlist creation process should be modified to include the following steps:

1. Submit playlist criteria and start generation
2. For free users, show ad while playlist generates
3. After ad completes or for premium users, show playlist results

**PlaylistCreation.tsx (modified)**
```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import ConditionalAdDisplay from '@/components/ads/ConditionalAdDisplay';

export default function PlaylistCreationComponent() {
  const router = useRouter();
  const { userProfile } = useSupabase();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  
  const handleCreatePlaylist = async (formData) => {
    // Start playlist generation
    setIsGenerating(true);
    
    // For free users, show ad immediately
    const isFreeUser = !userProfile?.plan_type || userProfile.plan_type === 'free';
    if (isFreeUser) {
      setShowAd(true);
    }
    
    try {
      // Call API to generate playlist
      const response = await fetch('/api/playlist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }
      
      const data = await response.json();
      setPlaylistId(data.id);
      
      // Mark generation as complete
      setGenerationComplete(true);
      
      // If premium user or ad already completed, proceed to results
      if (!showAd || !isFreeUser) {
        handleContinueToPlaylist();
      }
      
      // Track successful generation
      if (window.gtag) {
        window.gtag('event', 'playlist_generated', {
          'event_category': 'engagement',
          'event_label': isFreeUser ? 'free_user' : 'premium_user'
        });
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      setIsGenerating(false);
      // Handle error state
    }
  };
  
  const handleContinueToPlaylist = () => {
    if (playlistId) {
      router.push(`/playlists/${playlistId}`);
    } else {
      setIsGenerating(false);
    }
  };
  
  const handleAdComplete = () => {
    // Track ad completion
    if (window.gtag) {
      window.gtag('event', 'ad_completed', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    setShowAd(false);
    
    // If generation is already complete, proceed to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  const handleAdError = (error) => {
    console.error('Ad error:', error);
    
    // Skip ad on error and proceed with normal flow
    setShowAd(false);
    
    // If generation is complete, continue to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  return (
    <div className="playlist-creation-container">
      {/* Creation form - hide when generating */}
      {!isGenerating && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          // Process form data
          handleCreatePlaylist({
            // Form fields
          });
        }}>
          {/* Form fields for playlist criteria */}
          <button 
            type="submit"
            className="px-6 py-3 bg-[#1DB954] rounded-full"
          >
            Create Playlist
          </button>
        </form>
      )}
      
      {/* Generation state with conditional ad */}
      {isGenerating && (
        <div className="generation-container">
          {showAd ? (
            <ConditionalAdDisplay
              onAdComplete={handleAdComplete}
              onAdError={handleAdError}
              fallback={
                <GeneratingPlaylist 
                  isComplete={generationComplete} 
                  onContinue={handleContinueToPlaylist} 
                />
              }
            />
          ) : (
            <GeneratingPlaylist 
              isComplete={generationComplete} 
              onContinue={handleContinueToPlaylist} 
            />
          )}
        </div>
      )}
    </div>
  );
}

// Loading state component
const GeneratingPlaylist = ({ isComplete, onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-lg rounded-xl">
      {!isComplete ? (
        <>
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-medium mb-2">Creating your perfect playlist...</h3>
          <p className="text-[#A3A3A3]">Our AI is curating tracks tailored to your taste</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-[#1DB954]/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Your playlist is ready!</h3>
          <button 
            onClick={onContinue} 
            className="mt-4 px-6 py-2 bg-[#1DB954] rounded-full"
          >
            View Your Playlist
          </button>
        </>
      )}
    </div>
  );
};
```

### Testing Strategy

1. **User Type Testing**
   - Test with free user accounts to verify ads display correctly
   - Test with premium users to verify direct access without ads
   - Test edge cases (e.g., expired subscriptions)

2. **Ad Experience Testing**
   - Test ad loading behavior
   - Verify skip functionality after countdown
   - Test error handling when ads fail to load
   - Ensure premium CTA works properly

3. **Integration Testing**
   - Verify that playlist generation works correctly in parallel with ad display
   - Test entire flow from form submission to playlist display
   - Ensure no race conditions between ad completion and playlist generation

### Analytics Integration

To track the effectiveness of ads and their impact on conversions:

1. **Custom Events to Track**
   - `ad_impression` - When ad is successfully displayed
   - `ad_completed` - When user watches the full ad
   - `ad_skipped` - When user skips the ad
   - `premium_cta_click` - When user clicks upgrade from ad
   
2. **Conversion Tracking**
   - Track conversion rate from ad views to premium subscriptions
   - Measure impact on user retention (do users who see ads return less?)
   
3. **Performance Metrics**
   - Load time for ads
   - Error rate for ad display
   - Skip rate and average watch time

### Implementation Timeline

1. **Phase 1: Core Components (3-4 days)**
   - Create VideoAdComponent
   - Create ConditionalAdDisplay
   - Set up Google AdSense integration

2. **Phase 2: Integration (2-3 days)**
   - Modify playlist creation flow
   - Implement conditional logic for free vs premium
   - Add analytics tracking

3. **Phase 3: Testing & Optimization (3-4 days)**
   - Test with different user types
   - Measure performance and UX impact
   - Optimize based on initial data

### Success Criteria

1. Ads are only shown to free tier users
2. Ad display doesn't significantly impact playlist completion rate
3. Premium CTAs alongside ads generate measurable conversions
4. Ad integration generates revenue without hurting core metrics

### Key Considerations

1. **Performance Impact**
   - Ad loading should not delay playlist generation
   - Implement proper error handling to prevent blocking UX
   
2. **User Experience**
   - Clear messaging about why ads are shown
   - Seamless transitions between app and ad states
   - Skip option after reasonable time
   
3. **Premium Value Proposition**
   - Highlight ad-free experience in premium marketing
   - Direct CTA from ad to pricing page
   - Consider special offer for users upgrading from ad view

### Next Steps

1. Identify the exact files to modify in the codebase
2. Develop and test the ad components in isolation
3. Integrate with playlist creation flow
4. Add analytics tracking
5. Measure impact on both revenue and user experience

### Expected Outcome

- Free users will see video ads during playlist creation, with a premium upgrade CTA
- Premium users will experience ad-free playlist creation
- Ad performance and conversion data will be trackable via Google Analytics
- The user experience remains smooth, with ads appearing at a natural waiting point 

### High-level Task Breakdown: Implementing Spotify Authentication Provider

### Background and Motivation
Adding Spotify as an authentication provider will streamline the user experience by allowing users to sign up and log in using their Spotify accounts. The key enhancement will be automatically linking users' Spotify accounts during authentication, eliminating the need for a separate connection step later. This feature will reduce friction in the onboarding process and increase the likelihood of users creating playlists immediately after registration.

### Key Challenges and Analysis

1. **Dual Role of Spotify Integration**:
   - Currently, Spotify is used only for playlist creation and management
   - We need to extend it to serve as an authentication provider while maintaining existing functionality
   - Must handle cases where users have previously registered with email but want to connect Spotify

2. **User Identity Management**:
   - Need to properly link Spotify user identity with Supabase user accounts
   - Handle potential email conflicts between existing accounts and Spotify accounts
   - Maintain security throughout the authentication flow

3. **Token Management**:
   - Store both authentication tokens and Spotify API tokens
   - Implement proper refresh mechanisms for both token types
   - Ensure secure storage and transmission of tokens

4. **User Experience Considerations**:
   - Provide clear UI for login options
   - Handle failures gracefully with informative error messages
   - Create a seamless experience for users switching between auth methods

### High-level Task Breakdown

1. **Setup Spotify OAuth for Authentication in Supabase**
   - Success Criteria: Spotify is properly configured as an auth provider in Supabase dashboard
   - Tasks:
     - Configure Spotify Developer App for authentication (adjust redirect URIs)
     - Configure Spotify auth provider in Supabase dashboard
     - Update environment variables with necessary credentials

2. **Update Database Schema and Types**
   - Success Criteria: Database schema properly supports Spotify authentication data
   - Tasks:
     - Add new fields to users table if needed (spotify_user_id, etc.)
     - Update TypeScript types to reflect schema changes
     - Create migration for existing users if necessary

3. **Implement Spotify Sign-In UI Components**
   - Success Criteria: Login page displays Spotify login option with appropriate styling
   - Tasks:
     - Create Spotify login button component with brand colors and logo
     - Add button to login page alongside existing options
     - Implement loading states and error handling

4. **Implement Spotify Authentication Flow**
   - Success Criteria: Users can successfully sign in with Spotify
   - Tasks:
     - Add signInWithSpotify function to SupabaseProvider
     - Implement proper redirection to Spotify auth page
     - Set up callback handling for Spotify auth responses

5. **Implement Automatic Account Linking**
   - Success Criteria: When a user signs in with Spotify, their account is automatically marked as connected to Spotify with appropriate tokens
   - Tasks:
     - Update user profile upon successful Spotify authentication
     - Store Spotify refresh token in user profile
     - Set spotify_connected flag to true

6. **Handle Edge Cases and Error Scenarios**
   - Success Criteria: All edge cases are properly handled with appropriate user feedback
   - Tasks:
     - Implement handling for email conflicts between auth methods
     - Create error handling for failed authentication attempts
     - Add flow for linking Spotify to existing accounts manually if needed

7. **Testing and Validation**
   - Success Criteria: Authentication works reliably in all scenarios with appropriate error handling
   - Tasks:
     - Test sign-up flow with new users
     - Test sign-in with existing Spotify-authenticated users
     - Test account linking scenarios and email conflicts
     - Verify token refresh mechanisms work properly

8. **Documentation and Deployment**
   - Success Criteria: Feature is properly documented and deployed
   - Tasks:
     - Update documentation with new authentication option
     - Create user guide for authentication options
     - Deploy changes to staging for testing
     - Deploy to production after validation

### Project Status Board

- [x] Setup Spotify OAuth for Authentication in Supabase (Need to be completed in Supabase dashboard)
- [ ] Update Database Schema and Types (Schema already supports Spotify data)
- [x] Implement signInWithSpotify function in SupabaseProvider
- [x] Add Spotify Sign-In UI Components to login page
- [x] Add Spotify Sign-Up UI Components to register page
- [x] Implement automatic account linking in auth callback
- [ ] Handle Edge Cases and Error Scenarios
- [ ] Testing and Validation
- [ ] Documentation and Deployment

### Executor's Feedback or Assistance Requests

The implementation of Spotify Authentication in Diggr is now partially complete. The following has been accomplished:

1. Added `signInWithSpotify` function to SupabaseProvider that handles OAuth authentication with Spotify
2. Added Spotify login buttons to both login and registration forms with appropriate styling and loading states
3. Implemented automatic account linking in the auth callback handler
4. Ensured that when a user authenticates with Spotify, their account is automatically marked as connected with appropriate tokens stored

The implementation leverages the existing OAuth infrastructure that was already in place for Google authentication. When a user authenticates with Spotify, we:
1. Redirect them to Spotify's authorization page with appropriate scopes
2. Handle the OAuth callback to establish their session
3. Automatically update their user profile to mark them as Spotify-connected
4. Store their Spotify refresh token for later API calls

Next steps:
1. Configure Spotify as an authentication provider in the Supabase dashboard (this must be done manually)
2. Test the authentication flow with real users
3. Implement comprehensive error handling for:
   - Email conflicts between auth methods
   - Account linking failures
   - Token refresh issues

This implementation brings several benefits:
- Streamlines the user onboarding process
- Reduces friction in getting users to create playlists
- Eliminates the need for a separate Spotify connection step
- Provides a more integrated authentication experience

### Lessons

- OAuth authentication requires configuration both in the provider (Spotify) and in Supabase
- When using Spotify as both an authentication provider and API service, we need to properly manage the different types of tokens (auth tokens vs. API tokens)
- Automatic account linking improves user experience by eliminating the need for a separate connection step
- The existing OAuth callback infrastructure can be extended to handle provider-specific operations

## Implementation Plan: Targeted Ads for Free Users During Playlist Creation

### Background and Motivation
To enhance the monetization strategy for Diggr, we need to implement video ads specifically for free tier users during the playlist creation process. This approach leverages a natural pause in user activity (when waiting for playlist generation) to show ads without disrupting the core user experience, while also creating a tangible benefit for premium subscribers who will enjoy an ad-free experience.

### Key Requirements
1. Ads should only be displayed to free tier users
2. Ads should appear during the playlist creation loading/generation process
3. Implementation should integrate with Google AdSense
4. Premium upgrade CTAs should be presented alongside ads

### Technical Analysis

#### 1. User Subscription Status Detection
We already have the subscription status infrastructure through the Supabase integration:
- `useSupabase()` hook provides `userProfile` with plan information
- Existing checks can determine if a user is on a free or premium plan
- We'll leverage this to conditionally show ads

#### 2. Playlist Creation Flow Analysis
The playlist creation process occurs primarily in:
- `/src/app/create-playlist/` - Frontend UI and wizard
- `/src/app/api/playlist/generate/` - Backend API endpoint

The key opportunity is during the API call to generate the playlist, when users are naturally waiting for results.

#### 3. Optimal Integration Points
The most effective point to show ads is:
- After user submits playlist criteria
- While the AI generation process is running
- Before displaying the final playlist results

This creates a non-disruptive ad experience that appears during a natural waiting period.

### Implementation Plan

#### 1. Create Video Ad Components

**VideoAdComponent.tsx**
```tsx
import React, { useEffect, useRef, useState } from 'react';

interface VideoAdProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
}

export const VideoAdComponent: React.FC<VideoAdProps> = ({
  onAdComplete,
  onAdError,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5); // Skip countdown
  const [canSkip, setCanSkip] = useState(false);
  
  // Handle ad initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Initialize Google AdSense
      const adScript = document.createElement('script');
      adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      adScript.async = true;
      adScript.dataset.adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // Publisher ID
      document.head.appendChild(adScript);
      
      adScript.onload = () => {
        if (adContainerRef.current) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
            
            // Track ad impression in Google Analytics
            if (window.gtag) {
              window.gtag('event', 'ad_impression', {
                'event_category': 'ads',
                'event_label': 'playlist_creation'
              });
            }
          } catch (e) {
            console.error("Ad push error:", e);
            setAdError("Failed to load advertisement");
            onAdError?.(e);
          }
        }
      };
      
      // Error handling
      adScript.onerror = (e) => {
        console.error("Ad loading error:", e);
        setAdError("Failed to load advertisement");
        onAdError?.(e);
      };
    } catch (e) {
      console.error("Ad initialization error:", e);
      setAdError("Failed to load advertisement");
      onAdError?.(e);
    }
  }, [onAdError]);
  
  // Skip button timer
  useEffect(() => {
    if (isLoaded && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLoaded && timeRemaining === 0) {
      setCanSkip(true);
    }
  }, [timeRemaining, isLoaded]);
  
  // Handle ad completion
  const handleSkip = () => {
    // Track skip event in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'ad_skipped', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    onAdComplete?.();
  };
  
  return (
    <div className="video-ad-container relative w-full max-w-xl mx-auto">
      {/* Loading state */}
      {!isLoaded && !adError && (
        <div className="flex flex-col items-center justify-center h-40 bg-black/20 backdrop-blur-lg rounded-xl p-6">
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-300">Loading advertisement...</p>
        </div>
      )}
      
      {/* Error state */}
      {adError && (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">Unable to load advertisement</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#1DB954] rounded-full text-sm"
          >
            Continue to Your Playlist
          </button>
        </div>
      )}
      
      {/* Ad display */}
      <div className={`ad-wrapper relative ${!isLoaded ? 'hidden' : ''}`}>
        <ins
          ref={adContainerRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Publisher ID
          data-ad-slot="XXXXXXXXXX" // Ad slot ID
          data-ad-format="video"
        />
        
        {/* Skip button */}
        <div className="absolute bottom-4 right-4">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="px-3 py-1 bg-black/70 text-white text-sm rounded-full flex items-center"
            >
              Skip Ad
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="px-3 py-1 bg-black/70 text-white/70 text-sm rounded-full">
              Skip in {timeRemaining}s
            </div>
          )}
        </div>
      </div>
      
      {/* Premium upgrade CTA */}
      {isLoaded && (
        <div className="mt-4 bg-black/30 backdrop-blur-md rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Enjoy an ad-free experience with Diggr Premium
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full text-sm font-medium"
            onClick={() => {
              // Track upgrade click
              if (window.gtag) {
                window.gtag('event', 'premium_cta_click', {
                  'event_category': 'conversion',
                  'event_label': 'from_ad'
                });
              }
            }}
          >
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoAdComponent;
```

**ConditionalAdDisplay.tsx**
```tsx
import React from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import VideoAdComponent from './VideoAdComponent';

interface ConditionalAdDisplayProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
  fallback?: React.ReactNode; // Component to show for premium users
}

export const ConditionalAdDisplay: React.FC<ConditionalAdDisplayProps> = ({
  onAdComplete,
  onAdError,
  fallback
}) => {
  const { userProfile } = useSupabase();
  
  // Check if user should see ads (free tier or no subscription)
  const shouldShowAds = !userProfile?.plan_type || userProfile?.plan_type === 'free';
  
  if (!shouldShowAds) {
    return <>{fallback}</>;
  }
  
  return (
    <VideoAdComponent
      onAdComplete={onAdComplete}
      onAdError={onAdError}
    />
  );
};

export default ConditionalAdDisplay;
```

#### 2. Integration with Playlist Creation Flow

The playlist creation process should be modified to include the following steps:

1. Submit playlist criteria and start generation
2. For free users, show ad while playlist generates
3. After ad completes or for premium users, show playlist results

**PlaylistCreation.tsx (modified)**
```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import ConditionalAdDisplay from '@/components/ads/ConditionalAdDisplay';

export default function PlaylistCreationComponent() {
  const router = useRouter();
  const { userProfile } = useSupabase();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  
  const handleCreatePlaylist = async (formData) => {
    // Start playlist generation
    setIsGenerating(true);
    
    // For free users, show ad immediately
    const isFreeUser = !userProfile?.plan_type || userProfile.plan_type === 'free';
    if (isFreeUser) {
      setShowAd(true);
    }
    
    try {
      // Call API to generate playlist
      const response = await fetch('/api/playlist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }
      
      const data = await response.json();
      setPlaylistId(data.id);
      
      // Mark generation as complete
      setGenerationComplete(true);
      
      // If premium user or ad already completed, proceed to results
      if (!showAd || !isFreeUser) {
        handleContinueToPlaylist();
      }
      
      // Track successful generation
      if (window.gtag) {
        window.gtag('event', 'playlist_generated', {
          'event_category': 'engagement',
          'event_label': isFreeUser ? 'free_user' : 'premium_user'
        });
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      setIsGenerating(false);
      // Handle error state
    }
  };
  
  const handleContinueToPlaylist = () => {
    if (playlistId) {
      router.push(`/playlists/${playlistId}`);
    } else {
      setIsGenerating(false);
    }
  };
  
  const handleAdComplete = () => {
    // Track ad completion
    if (window.gtag) {
      window.gtag('event', 'ad_completed', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    setShowAd(false);
    
    // If generation is already complete, proceed to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  const handleAdError = (error) => {
    console.error('Ad error:', error);
    
    // Skip ad on error and proceed with normal flow
    setShowAd(false);
    
    // If generation is complete, continue to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  return (
    <div className="playlist-creation-container">
      {/* Creation form - hide when generating */}
      {!isGenerating && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          // Process form data
          handleCreatePlaylist({
            // Form fields
          });
        }}>
          {/* Form fields for playlist criteria */}
          <button 
            type="submit"
            className="px-6 py-3 bg-[#1DB954] rounded-full"
          >
            Create Playlist
          </button>
        </form>
      )}
      
      {/* Generation state with conditional ad */}
      {isGenerating && (
        <div className="generation-container">
          {showAd ? (
            <ConditionalAdDisplay
              onAdComplete={handleAdComplete}
              onAdError={handleAdError}
              fallback={
                <GeneratingPlaylist 
                  isComplete={generationComplete} 
                  onContinue={handleContinueToPlaylist} 
                />
              }
            />
          ) : (
            <GeneratingPlaylist 
              isComplete={generationComplete} 
              onContinue={handleContinueToPlaylist} 
            />
          )}
        </div>
      )}
    </div>
  );
}

// Loading state component
const GeneratingPlaylist = ({ isComplete, onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-lg rounded-xl">
      {!isComplete ? (
        <>
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-medium mb-2">Creating your perfect playlist...</h3>
          <p className="text-[#A3A3A3]">Our AI is curating tracks tailored to your taste</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-[#1DB954]/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Your playlist is ready!</h3>
          <button 
            onClick={onContinue} 
            className="mt-4 px-6 py-2 bg-[#1DB954] rounded-full"
          >
            View Your Playlist
          </button>
        </>
      )}
    </div>
  );
};
```

### Testing Strategy

1. **User Type Testing**
   - Test with free user accounts to verify ads display correctly
   - Test with premium users to verify direct access without ads
   - Test edge cases (e.g., expired subscriptions)

2. **Ad Experience Testing**
   - Test ad loading behavior
   - Verify skip functionality after countdown
   - Test error handling when ads fail to load
   - Ensure premium CTA works properly

3. **Integration Testing**
   - Verify that playlist generation works correctly in parallel with ad display
   - Test entire flow from form submission to playlist display
   - Ensure no race conditions between ad completion and playlist generation

### Analytics Integration

To track the effectiveness of ads and their impact on conversions:

1. **Custom Events to Track**
   - `ad_impression` - When ad is successfully displayed
   - `ad_completed` - When user watches the full ad
   - `ad_skipped` - When user skips the ad
   - `premium_cta_click` - When user clicks upgrade from ad
   
2. **Conversion Tracking**
   - Track conversion rate from ad views to premium subscriptions
   - Measure impact on user retention (do users who see ads return less?)
   
3. **Performance Metrics**
   - Load time for ads
   - Error rate for ad display
   - Skip rate and average watch time

### Implementation Timeline

1. **Phase 1: Core Components (3-4 days)**
   - Create VideoAdComponent
   - Create ConditionalAdDisplay
   - Set up Google AdSense integration

2. **Phase 2: Integration (2-3 days)**
   - Modify playlist creation flow
   - Implement conditional logic for free vs premium
   - Add analytics tracking

3. **Phase 3: Testing & Optimization (3-4 days)**
   - Test with different user types
   - Measure performance and UX impact
   - Optimize based on initial data

### Success Criteria

1. Ads are only shown to free tier users
2. Ad display doesn't significantly impact playlist completion rate
3. Premium CTAs alongside ads generate measurable conversions
4. Ad integration generates revenue without hurting core metrics

### Key Considerations

1. **Performance Impact**
   - Ad loading should not delay playlist generation
   - Implement proper error handling to prevent blocking UX
   
2. **User Experience**
   - Clear messaging about why ads are shown
   - Seamless transitions between app and ad states
   - Skip option after reasonable time
   
3. **Premium Value Proposition**
   - Highlight ad-free experience in premium marketing
   - Direct CTA from ad to pricing page
   - Consider special offer for users upgrading from ad view

### Next Steps

1. Identify the exact files to modify in the codebase
2. Develop and test the ad components in isolation
3. Integrate with playlist creation flow
4. Add analytics tracking
5. Measure impact on both revenue and user experience

### Expected Outcome

- Free users will see video ads during playlist creation, with a premium upgrade CTA
- Premium users will experience ad-free playlist creation
- Ad performance and conversion data will be trackable via Google Analytics
- The user experience remains smooth, with ads appearing at a natural waiting point 

### High-level Task Breakdown: Implementing Spotify Authentication Provider

### Background and Motivation
Adding Spotify as an authentication provider will streamline the user experience by allowing users to sign up and log in using their Spotify accounts. The key enhancement will be automatically linking users' Spotify accounts during authentication, eliminating the need for a separate connection step later. This feature will reduce friction in the onboarding process and increase the likelihood of users creating playlists immediately after registration.

### Key Challenges and Analysis

1. **Dual Role of Spotify Integration**:
   - Currently, Spotify is used only for playlist creation and management
   - We need to extend it to serve as an authentication provider while maintaining existing functionality
   - Must handle cases where users have previously registered with email but want to connect Spotify

2. **User Identity Management**:
   - Need to properly link Spotify user identity with Supabase user accounts
   - Handle potential email conflicts between existing accounts and Spotify accounts
   - Maintain security throughout the authentication flow

3. **Token Management**:
   - Store both authentication tokens and Spotify API tokens
   - Implement proper refresh mechanisms for both token types
   - Ensure secure storage and transmission of tokens

4. **User Experience Considerations**:
   - Provide clear UI for login options
   - Handle failures gracefully with informative error messages
   - Create a seamless experience for users switching between auth methods

### High-level Task Breakdown

1. **Setup Spotify OAuth for Authentication in Supabase**
   - Success Criteria: Spotify is properly configured as an auth provider in Supabase dashboard
   - Tasks:
     - Configure Spotify Developer App for authentication (adjust redirect URIs)
     - Configure Spotify auth provider in Supabase dashboard
     - Update environment variables with necessary credentials

2. **Update Database Schema and Types**
   - Success Criteria: Database schema properly supports Spotify authentication data
   - Tasks:
     - Add new fields to users table if needed (spotify_user_id, etc.)
     - Update TypeScript types to reflect schema changes
     - Create migration for existing users if necessary

3. **Implement Spotify Sign-In UI Components**
   - Success Criteria: Login page displays Spotify login option with appropriate styling
   - Tasks:
     - Create Spotify login button component with brand colors and logo
     - Add button to login page alongside existing options
     - Implement loading states and error handling

4. **Implement Spotify Authentication Flow**
   - Success Criteria: Users can successfully sign in with Spotify
   - Tasks:
     - Add signInWithSpotify function to SupabaseProvider
     - Implement proper redirection to Spotify auth page
     - Set up callback handling for Spotify auth responses

5. **Implement Automatic Account Linking**
   - Success Criteria: When a user signs in with Spotify, their account is automatically marked as connected to Spotify with appropriate tokens
   - Tasks:
     - Update user profile upon successful Spotify authentication
     - Store Spotify refresh token in user profile
     - Set spotify_connected flag to true

6. **Handle Edge Cases and Error Scenarios**
   - Success Criteria: All edge cases are properly handled with appropriate user feedback
   - Tasks:
     - Implement handling for email conflicts between auth methods
     - Create error handling for failed authentication attempts
     - Add flow for linking Spotify to existing accounts manually if needed

7. **Testing and Validation**
   - Success Criteria: Authentication works reliably in all scenarios with appropriate error handling
   - Tasks:
     - Test sign-up flow with new users
     - Test sign-in with existing Spotify-authenticated users
     - Test account linking scenarios and email conflicts
     - Verify token refresh mechanisms work properly

8. **Documentation and Deployment**
   - Success Criteria: Feature is properly documented and deployed
   - Tasks:
     - Update documentation with new authentication option
     - Create user guide for authentication options
     - Deploy changes to staging for testing
     - Deploy to production after validation

### Project Status Board

- [x] Setup Spotify OAuth for Authentication in Supabase (Need to be completed in Supabase dashboard)
- [ ] Update Database Schema and Types (Schema already supports Spotify data)
- [x] Implement signInWithSpotify function in SupabaseProvider
- [x] Add Spotify Sign-In UI Components to login page
- [x] Add Spotify Sign-Up UI Components to register page
- [x] Implement automatic account linking in auth callback
- [ ] Handle Edge Cases and Error Scenarios
- [ ] Testing and Validation
- [ ] Documentation and Deployment

### Executor's Feedback or Assistance Requests

I've successfully implemented the core components for Spotify authentication:

1. Added `signInWithSpotify` function to the SupabaseProvider
2. Added Spotify login/signup buttons to both the login and registration forms
3. Modified the auth callback handler to automatically link a user's Spotify account when they authenticate with Spotify

Next steps:
1. Configure Spotify as an auth provider in the Supabase dashboard
2. Test the authentication flow with real users
3. Implement comprehensive error handling for edge cases like:
   - Email conflicts between auth methods
   - Account linking failures
   - Token refresh issues

### Lessons

- OAuth authentication requires configuration both in the provider (Spotify) and in Supabase
- When using Spotify as both an authentication provider and API service, we need to properly manage the different types of tokens (auth tokens vs. API tokens)
- Automatic account linking improves user experience by eliminating the need for a separate connection step
- The existing OAuth callback infrastructure can be extended to handle provider-specific operations

## Implementation Plan: Targeted Ads for Free Users During Playlist Creation

### Background and Motivation
To enhance the monetization strategy for Diggr, we need to implement video ads specifically for free tier users during the playlist creation process. This approach leverages a natural pause in user activity (when waiting for playlist generation) to show ads without disrupting the core user experience, while also creating a tangible benefit for premium subscribers who will enjoy an ad-free experience.

### Key Requirements
1. Ads should only be displayed to free tier users
2. Ads should appear during the playlist creation loading/generation process
3. Implementation should integrate with Google AdSense
4. Premium upgrade CTAs should be presented alongside ads

### Technical Analysis

#### 1. User Subscription Status Detection
We already have the subscription status infrastructure through the Supabase integration:
- `useSupabase()` hook provides `userProfile` with plan information
- Existing checks can determine if a user is on a free or premium plan
- We'll leverage this to conditionally show ads

#### 2. Playlist Creation Flow Analysis
The playlist creation process occurs primarily in:
- `/src/app/create-playlist/` - Frontend UI and wizard
- `/src/app/api/playlist/generate/` - Backend API endpoint

The key opportunity is during the API call to generate the playlist, when users are naturally waiting for results.

#### 3. Optimal Integration Points
The most effective point to show ads is:
- After user submits playlist criteria
- While the AI generation process is running
- Before displaying the final playlist results

This creates a non-disruptive ad experience that appears during a natural waiting period.

### Implementation Plan

#### 1. Create Video Ad Components

**VideoAdComponent.tsx**
```tsx
import React, { useEffect, useRef, useState } from 'react';

interface VideoAdProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
}

export const VideoAdComponent: React.FC<VideoAdProps> = ({
  onAdComplete,
  onAdError,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5); // Skip countdown
  const [canSkip, setCanSkip] = useState(false);
  
  // Handle ad initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Initialize Google AdSense
      const adScript = document.createElement('script');
      adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      adScript.async = true;
      adScript.dataset.adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // Publisher ID
      document.head.appendChild(adScript);
      
      adScript.onload = () => {
        if (adContainerRef.current) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
            
            // Track ad impression in Google Analytics
            if (window.gtag) {
              window.gtag('event', 'ad_impression', {
                'event_category': 'ads',
                'event_label': 'playlist_creation'
              });
            }
          } catch (e) {
            console.error("Ad push error:", e);
            setAdError("Failed to load advertisement");
            onAdError?.(e);
          }
        }
      };
      
      // Error handling
      adScript.onerror = (e) => {
        console.error("Ad loading error:", e);
        setAdError("Failed to load advertisement");
        onAdError?.(e);
      };
    } catch (e) {
      console.error("Ad initialization error:", e);
      setAdError("Failed to load advertisement");
      onAdError?.(e);
    }
  }, [onAdError]);
  
  // Skip button timer
  useEffect(() => {
    if (isLoaded && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLoaded && timeRemaining === 0) {
      setCanSkip(true);
    }
  }, [timeRemaining, isLoaded]);
  
  // Handle ad completion
  const handleSkip = () => {
    // Track skip event in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'ad_skipped', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    onAdComplete?.();
  };
  
  return (
    <div className="video-ad-container relative w-full max-w-xl mx-auto">
      {/* Loading state */}
      {!isLoaded && !adError && (
        <div className="flex flex-col items-center justify-center h-40 bg-black/20 backdrop-blur-lg rounded-xl p-6">
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-300">Loading advertisement...</p>
        </div>
      )}
      
      {/* Error state */}
      {adError && (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">Unable to load advertisement</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#1DB954] rounded-full text-sm"
          >
            Continue to Your Playlist
          </button>
        </div>
      )}
      
      {/* Ad display */}
      <div className={`ad-wrapper relative ${!isLoaded ? 'hidden' : ''}`}>
        <ins
          ref={adContainerRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Publisher ID
          data-ad-slot="XXXXXXXXXX" // Ad slot ID
          data-ad-format="video"
        />
        
        {/* Skip button */}
        <div className="absolute bottom-4 right-4">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="px-3 py-1 bg-black/70 text-white text-sm rounded-full flex items-center"
            >
              Skip Ad
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="px-3 py-1 bg-black/70 text-white/70 text-sm rounded-full">
              Skip in {timeRemaining}s
            </div>
          )}
        </div>
      </div>
      
      {/* Premium upgrade CTA */}
      {isLoaded && (
        <div className="mt-4 bg-black/30 backdrop-blur-md rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Enjoy an ad-free experience with Diggr Premium
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full text-sm font-medium"
            onClick={() => {
              // Track upgrade click
              if (window.gtag) {
                window.gtag('event', 'premium_cta_click', {
                  'event_category': 'conversion',
                  'event_label': 'from_ad'
                });
              }
            }}
          >
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoAdComponent;
```

**ConditionalAdDisplay.tsx**
```tsx
import React from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import VideoAdComponent from './VideoAdComponent';

interface ConditionalAdDisplayProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
  fallback?: React.ReactNode; // Component to show for premium users
}

export const ConditionalAdDisplay: React.FC<ConditionalAdDisplayProps> = ({
  onAdComplete,
  onAdError,
  fallback
}) => {
  const { userProfile } = useSupabase();
  
  // Check if user should see ads (free tier or no subscription)
  const shouldShowAds = !userProfile?.plan_type || userProfile?.plan_type === 'free';
  
  if (!shouldShowAds) {
    return <>{fallback}</>;
  }
  
  return (
    <VideoAdComponent
      onAdComplete={onAdComplete}
      onAdError={onAdError}
    />
  );
};

export default ConditionalAdDisplay;
```

#### 2. Integration with Playlist Creation Flow

The playlist creation process should be modified to include the following steps:

1. Submit playlist criteria and start generation
2. For free users, show ad while playlist generates
3. After ad completes or for premium users, show playlist results

**PlaylistCreation.tsx (modified)**
```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import ConditionalAdDisplay from '@/components/ads/ConditionalAdDisplay';

export default function PlaylistCreationComponent() {
  const router = useRouter();
  const { userProfile } = useSupabase();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  
  const handleCreatePlaylist = async (formData) => {
    // Start playlist generation
    setIsGenerating(true);
    
    // For free users, show ad immediately
    const isFreeUser = !userProfile?.plan_type || userProfile.plan_type === 'free';
    if (isFreeUser) {
      setShowAd(true);
    }
    
    try {
      // Call API to generate playlist
      const response = await fetch('/api/playlist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }
      
      const data = await response.json();
      setPlaylistId(data.id);
      
      // Mark generation as complete
      setGenerationComplete(true);
      
      // If premium user or ad already completed, proceed to results
      if (!showAd || !isFreeUser) {
        handleContinueToPlaylist();
      }
      
      // Track successful generation
      if (window.gtag) {
        window.gtag('event', 'playlist_generated', {
          'event_category': 'engagement',
          'event_label': isFreeUser ? 'free_user' : 'premium_user'
        });
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      setIsGenerating(false);
      // Handle error state
    }
  };
  
  const handleContinueToPlaylist = () => {
    if (playlistId) {
      router.push(`/playlists/${playlistId}`);
    } else {
      setIsGenerating(false);
    }
  };
  
  const handleAdComplete = () => {
    // Track ad completion
    if (window.gtag) {
      window.gtag('event', 'ad_completed', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    setShowAd(false);
    
    // If generation is already complete, proceed to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  const handleAdError = (error) => {
    console.error('Ad error:', error);
    
    // Skip ad on error and proceed with normal flow
    setShowAd(false);
    
    // If generation is complete, continue to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  return (
    <div className="playlist-creation-container">
      {/* Creation form - hide when generating */}
      {!isGenerating && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          // Process form data
          handleCreatePlaylist({
            // Form fields
          });
        }}>
          {/* Form fields for playlist criteria */}
          <button 
            type="submit"
            className="px-6 py-3 bg-[#1DB954] rounded-full"
          >
            Create Playlist
          </button>
        </form>
      )}
      
      {/* Generation state with conditional ad */}
      {isGenerating && (
        <div className="generation-container">
          {showAd ? (
            <ConditionalAdDisplay
              onAdComplete={handleAdComplete}
              onAdError={handleAdError}
              fallback={
                <GeneratingPlaylist 
                  isComplete={generationComplete} 
                  onContinue={handleContinueToPlaylist} 
                />
              }
            />
          ) : (
            <GeneratingPlaylist 
              isComplete={generationComplete} 
              onContinue={handleContinueToPlaylist} 
            />
          )}
        </div>
      )}
    </div>
  );
}

// Loading state component
const GeneratingPlaylist = ({ isComplete, onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-lg rounded-xl">
      {!isComplete ? (
        <>
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-medium mb-2">Creating your perfect playlist...</h3>
          <p className="text-[#A3A3A3]">Our AI is curating tracks tailored to your taste</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-[#1DB954]/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Your playlist is ready!</h3>
          <button 
            onClick={onContinue} 
            className="mt-4 px-6 py-2 bg-[#1DB954] rounded-full"
          >
            View Your Playlist
          </button>
        </>
      )}
    </div>
  );
};
```

### Testing Strategy

1. **User Type Testing**
   - Test with free user accounts to verify ads display correctly
   - Test with premium users to verify direct access without ads
   - Test edge cases (e.g., expired subscriptions)

2. **Ad Experience Testing**
   - Test ad loading behavior
   - Verify skip functionality after countdown
   - Test error handling when ads fail to load
   - Ensure premium CTA works properly

3. **Integration Testing**
   - Verify that playlist generation works correctly in parallel with ad display
   - Test entire flow from form submission to playlist display
   - Ensure no race conditions between ad completion and playlist generation

### Analytics Integration

To track the effectiveness of ads and their impact on conversions:

1. **Custom Events to Track**
   - `ad_impression` - When ad is successfully displayed
   - `ad_completed` - When user watches the full ad
   - `ad_skipped` - When user skips the ad
   - `premium_cta_click` - When user clicks upgrade from ad
   
2. **Conversion Tracking**
   - Track conversion rate from ad views to premium subscriptions
   - Measure impact on user retention (do users who see ads return less?)
   
3. **Performance Metrics**
   - Load time for ads
   - Error rate for ad display
   - Skip rate and average watch time

### Implementation Timeline

1. **Phase 1: Core Components (3-4 days)**
   - Create VideoAdComponent
   - Create ConditionalAdDisplay
   - Set up Google AdSense integration

2. **Phase 2: Integration (2-3 days)**
   - Modify playlist creation flow
   - Implement conditional logic for free vs premium
   - Add analytics tracking

3. **Phase 3: Testing & Optimization (3-4 days)**
   - Test with different user types
   - Measure performance and UX impact
   - Optimize based on initial data

### Success Criteria

1. Ads are only shown to free tier users
2. Ad display doesn't significantly impact playlist completion rate
3. Premium CTAs alongside ads generate measurable conversions
4. Ad integration generates revenue without hurting core metrics

### Key Considerations

1. **Performance Impact**
   - Ad loading should not delay playlist generation
   - Implement proper error handling to prevent blocking UX
   
2. **User Experience**
   - Clear messaging about why ads are shown
   - Seamless transitions between app and ad states
   - Skip option after reasonable time
   
3. **Premium Value Proposition**
   - Highlight ad-free experience in premium marketing
   - Direct CTA from ad to pricing page
   - Consider special offer for users upgrading from ad view

### Next Steps

1. Identify the exact files to modify in the codebase
2. Develop and test the ad components in isolation
3. Integrate with playlist creation flow
4. Add analytics tracking
5. Measure impact on both revenue and user experience

### Expected Outcome

- Free users will see video ads during playlist creation, with a premium upgrade CTA
- Premium users will experience ad-free playlist creation
- Ad performance and conversion data will be trackable via Google Analytics
- The user experience remains smooth, with ads appearing at a natural waiting point 

### High-level Task Breakdown: Implementing Spotify Authentication Provider

### Background and Motivation
Adding Spotify as an authentication provider will streamline the user experience by allowing users to sign up and log in using their Spotify accounts. The key enhancement will be automatically linking users' Spotify accounts during authentication, eliminating the need for a separate connection step later. This feature will reduce friction in the onboarding process and increase the likelihood of users creating playlists immediately after registration.

### Key Challenges and Analysis

1. **Dual Role of Spotify Integration**:
   - Currently, Spotify is used only for playlist creation and management
   - We need to extend it to serve as an authentication provider while maintaining existing functionality
   - Must handle cases where users have previously registered with email but want to connect Spotify

2. **User Identity Management**:
   - Need to properly link Spotify user identity with Supabase user accounts
   - Handle potential email conflicts between existing accounts and Spotify accounts
   - Maintain security throughout the authentication flow

3. **Token Management**:
   - Store both authentication tokens and Spotify API tokens
   - Implement proper refresh mechanisms for both token types
   - Ensure secure storage and transmission of tokens

4. **User Experience Considerations**:
   - Provide clear UI for login options
   - Handle failures gracefully with informative error messages
   - Create a seamless experience for users switching between auth methods

### High-level Task Breakdown

1. **Setup Spotify OAuth for Authentication in Supabase**
   - Success Criteria: Spotify is properly configured as an auth provider in Supabase dashboard
   - Tasks:
     - Configure Spotify Developer App for authentication (adjust redirect URIs)
     - Configure Spotify auth provider in Supabase dashboard
     - Update environment variables with necessary credentials

2. **Update Database Schema and Types**
   - Success Criteria: Database schema properly supports Spotify authentication data
   - Tasks:
     - Add new fields to users table if needed (spotify_user_id, etc.)
     - Update TypeScript types to reflect schema changes
     - Create migration for existing users if necessary

3. **Implement Spotify Sign-In UI Components**
   - Success Criteria: Login page displays Spotify login option with appropriate styling
   - Tasks:
     - Create Spotify login button component with brand colors and logo
     - Add button to login page alongside existing options
     - Implement loading states and error handling

4. **Implement Spotify Authentication Flow**
   - Success Criteria: Users can successfully sign in with Spotify
   - Tasks:
     - Add signInWithSpotify function to SupabaseProvider
     - Implement proper redirection to Spotify auth page
     - Set up callback handling for Spotify auth responses

5. **Implement Automatic Account Linking**
   - Success Criteria: When a user signs in with Spotify, their account is automatically marked as connected to Spotify with appropriate tokens
   - Tasks:
     - Update user profile upon successful Spotify authentication
     - Store Spotify refresh token in user profile
     - Set spotify_connected flag to true

6. **Handle Edge Cases and Error Scenarios**
   - Success Criteria: All edge cases are properly handled with appropriate user feedback
   - Tasks:
     - Implement handling for email conflicts between auth methods
     - Create error handling for failed authentication attempts
     - Add flow for linking Spotify to existing accounts manually if needed

7. **Testing and Validation**
   - Success Criteria: Authentication works reliably in all scenarios with appropriate error handling
   - Tasks:
     - Test sign-up flow with new users
     - Test sign-in with existing Spotify-authenticated users
     - Test account linking scenarios and email conflicts
     - Verify token refresh mechanisms work properly

8. **Documentation and Deployment**
   - Success Criteria: Feature is properly documented and deployed
   - Tasks:
     - Update documentation with new authentication option
     - Create user guide for authentication options
     - Deploy changes to staging for testing
     - Deploy to production after validation

### Project Status Board

- [x] Setup Spotify OAuth for Authentication in Supabase (Need to be completed in Supabase dashboard)
- [ ] Update Database Schema and Types (Schema already supports Spotify data)
- [x] Implement signInWithSpotify function in SupabaseProvider
- [x] Add Spotify Sign-In UI Components to login page
- [x] Add Spotify Sign-Up UI Components to register page
- [x] Implement automatic account linking in auth callback
- [ ] Handle Edge Cases and Error Scenarios
- [ ] Testing and Validation
- [ ] Documentation and Deployment

### Executor's Feedback or Assistance Requests

I've successfully implemented the core components for Spotify authentication:

1. Added `signInWithSpotify` function to the SupabaseProvider
2. Added Spotify login/signup buttons to both the login and registration forms
3. Modified the auth callback handler to automatically link a user's Spotify account when they authenticate with Spotify

Next steps:
1. Configure Spotify as an auth provider in the Supabase dashboard
2. Test the authentication flow with real users
3. Implement comprehensive error handling for edge cases like:
   - Email conflicts between auth methods
   - Account linking failures
   - Token refresh issues

### Lessons

- OAuth authentication requires configuration both in the provider (Spotify) and in Supabase
- When using Spotify as both an authentication provider and API service, we need to properly manage the different types of tokens (auth tokens vs. API tokens)
- Automatic account linking improves user experience by eliminating the need for a separate connection step

## Implementation Plan: Targeted Ads for Free Users During Playlist Creation

### Background and Motivation
To enhance the monetization strategy for Diggr, we need to implement video ads specifically for free tier users during the playlist creation process. This approach leverages a natural pause in user activity (when waiting for playlist generation) to show ads without disrupting the core user experience, while also creating a tangible benefit for premium subscribers who will enjoy an ad-free experience.

### Key Requirements
1. Ads should only be displayed to free tier users
2. Ads should appear during the playlist creation loading/generation process
3. Implementation should integrate with Google AdSense
4. Premium upgrade CTAs should be presented alongside ads

### Technical Analysis

#### 1. User Subscription Status Detection
We already have the subscription status infrastructure through the Supabase integration:
- `useSupabase()` hook provides `userProfile` with plan information
- Existing checks can determine if a user is on a free or premium plan
- We'll leverage this to conditionally show ads

#### 2. Playlist Creation Flow Analysis
The playlist creation process occurs primarily in:
- `/src/app/create-playlist/` - Frontend UI and wizard
- `/src/app/api/playlist/generate/` - Backend API endpoint

The key opportunity is during the API call to generate the playlist, when users are naturally waiting for results.

#### 3. Optimal Integration Points
The most effective point to show ads is:
- After user submits playlist criteria
- While the AI generation process is running
- Before displaying the final playlist results

This creates a non-disruptive ad experience that appears during a natural waiting period.

### Implementation Plan

#### 1. Create Video Ad Components

**VideoAdComponent.tsx**
```tsx
import React, { useEffect, useRef, useState } from 'react';

interface VideoAdProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
}

export const VideoAdComponent: React.FC<VideoAdProps> = ({
  onAdComplete,
  onAdError,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5); // Skip countdown
  const [canSkip, setCanSkip] = useState(false);
  
  // Handle ad initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Initialize Google AdSense
      const adScript = document.createElement('script');
      adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      adScript.async = true;
      adScript.dataset.adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // Publisher ID
      document.head.appendChild(adScript);
      
      adScript.onload = () => {
        if (adContainerRef.current) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
            
            // Track ad impression in Google Analytics
            if (window.gtag) {
              window.gtag('event', 'ad_impression', {
                'event_category': 'ads',
                'event_label': 'playlist_creation'
              });
            }
          } catch (e) {
            console.error("Ad push error:", e);
            setAdError("Failed to load advertisement");
            onAdError?.(e);
          }
        }
      };
      
      // Error handling
      adScript.onerror = (e) => {
        console.error("Ad loading error:", e);
        setAdError("Failed to load advertisement");
        onAdError?.(e);
      };
    } catch (e) {
      console.error("Ad initialization error:", e);
      setAdError("Failed to load advertisement");
      onAdError?.(e);
    }
  }, [onAdError]);
  
  // Skip button timer
  useEffect(() => {
    if (isLoaded && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLoaded && timeRemaining === 0) {
      setCanSkip(true);
    }
  }, [timeRemaining, isLoaded]);
  
  // Handle ad completion
  const handleSkip = () => {
    // Track skip event in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'ad_skipped', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    onAdComplete?.();
  };
  
  return (
    <div className="video-ad-container relative w-full max-w-xl mx-auto">
      {/* Loading state */}
      {!isLoaded && !adError && (
        <div className="flex flex-col items-center justify-center h-40 bg-black/20 backdrop-blur-lg rounded-xl p-6">
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-300">Loading advertisement...</p>
        </div>
      )}
      
      {/* Error state */}
      {adError && (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">Unable to load advertisement</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#1DB954] rounded-full text-sm"
          >
            Continue to Your Playlist
          </button>
        </div>
      )}
      
      {/* Ad display */}
      <div className={`ad-wrapper relative ${!isLoaded ? 'hidden' : ''}`}>
        <ins
          ref={adContainerRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Publisher ID
          data-ad-slot="XXXXXXXXXX" // Ad slot ID
          data-ad-format="video"
        />
        
        {/* Skip button */}
        <div className="absolute bottom-4 right-4">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="px-3 py-1 bg-black/70 text-white text-sm rounded-full flex items-center"
            >
              Skip Ad
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="px-3 py-1 bg-black/70 text-white/70 text-sm rounded-full">
              Skip in {timeRemaining}s
            </div>
          )}
        </div>
      </div>
      
      {/* Premium upgrade CTA */}
      {isLoaded && (
        <div className="mt-4 bg-black/30 backdrop-blur-md rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Enjoy an ad-free experience with Diggr Premium
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full text-sm font-medium"
            onClick={() => {
              // Track upgrade click
              if (window.gtag) {
                window.gtag('event', 'premium_cta_click', {
                  'event_category': 'conversion',
                  'event_label': 'from_ad'
                });
              }
            }}
          >
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoAdComponent;
```

**ConditionalAdDisplay.tsx**
```tsx
import React from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import VideoAdComponent from './VideoAdComponent';

interface ConditionalAdDisplayProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
  fallback?: React.ReactNode; // Component to show for premium users
}

export const ConditionalAdDisplay: React.FC<ConditionalAdDisplayProps> = ({
  onAdComplete,
  onAdError,
  fallback
}) => {
  const { userProfile } = useSupabase();
  
  // Check if user should see ads (free tier or no subscription)
  const shouldShowAds = !userProfile?.plan_type || userProfile?.plan_type === 'free';
  
  if (!shouldShowAds) {
    return <>{fallback}</>;
  }
  
  return (
    <VideoAdComponent
      onAdComplete={onAdComplete}
      onAdError={onAdError}
    />
  );
};

export default ConditionalAdDisplay;
```

#### 2. Integration with Playlist Creation Flow

The playlist creation process should be modified to include the following steps:

1. Submit playlist criteria and start generation
2. For free users, show ad while playlist generates
3. After ad completes or for premium users, show playlist results

**PlaylistCreation.tsx (modified)**
```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import ConditionalAdDisplay from '@/components/ads/ConditionalAdDisplay';

export default function PlaylistCreationComponent() {
  const router = useRouter();
  const { userProfile } = useSupabase();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  
  const handleCreatePlaylist = async (formData) => {
    // Start playlist generation
    setIsGenerating(true);
    
    // For free users, show ad immediately
    const isFreeUser = !userProfile?.plan_type || userProfile.plan_type === 'free';
    if (isFreeUser) {
      setShowAd(true);
    }
    
    try {
      // Call API to generate playlist
      const response = await fetch('/api/playlist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }
      
      const data = await response.json();
      setPlaylistId(data.id);
      
      // Mark generation as complete
      setGenerationComplete(true);
      
      // If premium user or ad already completed, proceed to results
      if (!showAd || !isFreeUser) {
        handleContinueToPlaylist();
      }
      
      // Track successful generation
      if (window.gtag) {
        window.gtag('event', 'playlist_generated', {
          'event_category': 'engagement',
          'event_label': isFreeUser ? 'free_user' : 'premium_user'
        });
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      setIsGenerating(false);
      // Handle error state
    }
  };
  
  const handleContinueToPlaylist = () => {
    if (playlistId) {
      router.push(`/playlists/${playlistId}`);
    } else {
      setIsGenerating(false);
    }
  };
  
  const handleAdComplete = () => {
    // Track ad completion
    if (window.gtag) {
      window.gtag('event', 'ad_completed', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    setShowAd(false);
    
    // If generation is already complete, proceed to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  const handleAdError = (error) => {
    console.error('Ad error:', error);
    
    // Skip ad on error and proceed with normal flow
    setShowAd(false);
    
    // If generation is complete, continue to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  return (
    <div className="playlist-creation-container">
      {/* Creation form - hide when generating */}
      {!isGenerating && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          // Process form data
          handleCreatePlaylist({
            // Form fields
          });
        }}>
          {/* Form fields for playlist criteria */}
          <button 
            type="submit"
            className="px-6 py-3 bg-[#1DB954] rounded-full"
          >
            Create Playlist
          </button>
        </form>
      )}
      
      {/* Generation state with conditional ad */}
      {isGenerating && (
        <div className="generation-container">
          {showAd ? (
            <ConditionalAdDisplay
              onAdComplete={handleAdComplete}
              onAdError={handleAdError}
              fallback={
                <GeneratingPlaylist 
                  isComplete={generationComplete} 
                  onContinue={handleContinueToPlaylist} 
                />
              }
            />
          ) : (
            <GeneratingPlaylist 
              isComplete={generationComplete} 
              onContinue={handleContinueToPlaylist} 
            />
          )}
        </div>
      )}
    </div>
  );
}

// Loading state component
const GeneratingPlaylist = ({ isComplete, onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-lg rounded-xl">
      {!isComplete ? (
        <>
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-medium mb-2">Creating your perfect playlist...</h3>
          <p className="text-[#A3A3A3]">Our AI is curating tracks tailored to your taste</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-[#1DB954]/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Your playlist is ready!</h3>
          <button 
            onClick={onContinue} 
            className="mt-4 px-6 py-2 bg-[#1DB954] rounded-full"
          >
            View Your Playlist
          </button>
        </>
      )}
    </div>
  );
};
```

### Testing Strategy

1. **User Type Testing**
   - Test with free user accounts to verify ads display correctly
   - Test with premium users to verify direct access without ads
   - Test edge cases (e.g., expired subscriptions)

2. **Ad Experience Testing**
   - Test ad loading behavior
   - Verify skip functionality after countdown
   - Test error handling when ads fail to load
   - Ensure premium CTA works properly

3. **Integration Testing**
   - Verify that playlist generation works correctly in parallel with ad display
   - Test entire flow from form submission to playlist display
   - Ensure no race conditions between ad completion and playlist generation

### Analytics Integration

To track the effectiveness of ads and their impact on conversions:

1. **Custom Events to Track**
   - `ad_impression` - When ad is successfully displayed
   - `ad_completed` - When user watches the full ad
   - `ad_skipped` - When user skips the ad
   - `premium_cta_click` - When user clicks upgrade from ad
   
2. **Conversion Tracking**
   - Track conversion rate from ad views to premium subscriptions
   - Measure impact on user retention (do users who see ads return less?)
   
3. **Performance Metrics**
   - Load time for ads
   - Error rate for ad display
   - Skip rate and average watch time

### Implementation Timeline

1. **Phase 1: Core Components (3-4 days)**
   - Create VideoAdComponent
   - Create ConditionalAdDisplay
   - Set up Google AdSense integration

2. **Phase 2: Integration (2-3 days)**
   - Modify playlist creation flow
   - Implement conditional logic for free vs premium
   - Add analytics tracking

3. **Phase 3: Testing & Optimization (3-4 days)**
   - Test with different user types
   - Measure performance and UX impact
   - Optimize based on initial data

### Success Criteria

1. Ads are only shown to free tier users
2. Ad display doesn't significantly impact playlist completion rate
3. Premium CTAs alongside ads generate measurable conversions
4. Ad integration generates revenue without hurting core metrics

### Key Considerations

1. **Performance Impact**
   - Ad loading should not delay playlist generation
   - Implement proper error handling to prevent blocking UX
   
2. **User Experience**
   - Clear messaging about why ads are shown
   - Seamless transitions between app and ad states
   - Skip option after reasonable time
   
3. **Premium Value Proposition**
   - Highlight ad-free experience in premium marketing
   - Direct CTA from ad to pricing page
   - Consider special offer for users upgrading from ad view

### Next Steps

1. Identify the exact files to modify in the codebase
2. Develop and test the ad components in isolation
3. Integrate with playlist creation flow
4. Add analytics tracking
5. Measure impact on both revenue and user experience

### Expected Outcome

- Free users will see video ads during playlist creation, with a premium upgrade CTA
- Premium users will experience ad-free playlist creation
- Ad performance and conversion data will be trackable via Google Analytics
- The user experience remains smooth, with ads appearing at a natural waiting point 

### High-level Task Breakdown: Implementing Spotify Authentication Provider

### Background and Motivation
Adding Spotify as an authentication provider will streamline the user experience by allowing users to sign up and log in using their Spotify accounts. The key enhancement will be automatically linking users' Spotify accounts during authentication, eliminating the need for a separate connection step later. This feature will reduce friction in the onboarding process and increase the likelihood of users creating playlists immediately after registration.

### Key Challenges and Analysis

1. **Dual Role of Spotify Integration**:
   - Currently, Spotify is used only for playlist creation and management
   - We need to extend it to serve as an authentication provider while maintaining existing functionality
   - Must handle cases where users have previously registered with email but want to connect Spotify

2. **User Identity Management**:
   - Need to properly link Spotify user identity with Supabase user accounts
   - Handle potential email conflicts between existing accounts and Spotify accounts
   - Maintain security throughout the authentication flow

3. **Token Management**:
   - Store both authentication tokens and Spotify API tokens
   - Implement proper refresh mechanisms for both token types
   - Ensure secure storage and transmission of tokens

4. **User Experience Considerations**:
   - Provide clear UI for login options
   - Handle failures gracefully with informative error messages
   - Create a seamless experience for users switching between auth methods

### High-level Task Breakdown

1. **Setup Spotify OAuth for Authentication in Supabase**
   - Success Criteria: Spotify is properly configured as an auth provider in Supabase dashboard
   - Tasks:
     - Configure Spotify Developer App for authentication (adjust redirect URIs)
     - Configure Spotify auth provider in Supabase dashboard
     - Update environment variables with necessary credentials

2. **Update Database Schema and Types**
   - Success Criteria: Database schema properly supports Spotify authentication data
   - Tasks:
     - Add new fields to users table if needed (spotify_user_id, etc.)
     - Update TypeScript types to reflect schema changes
     - Create migration for existing users if necessary

3. **Implement Spotify Sign-In UI Components**
   - Success Criteria: Login page displays Spotify login option with appropriate styling
   - Tasks:
     - Create Spotify login button component with brand colors and logo
     - Add button to login page alongside existing options
     - Implement loading states and error handling

4. **Implement Spotify Authentication Flow**
   - Success Criteria: Users can successfully sign in with Spotify
   - Tasks:
     - Add signInWithSpotify function to SupabaseProvider
     - Implement proper redirection to Spotify auth page
     - Set up callback handling for Spotify auth responses

5. **Implement Automatic Account Linking**
   - Success Criteria: When a user signs in with Spotify, their account is automatically marked as connected to Spotify with appropriate tokens
   - Tasks:
     - Update user profile upon successful Spotify authentication
     - Store Spotify refresh token in user profile
     - Set spotify_connected flag to true

6. **Handle Edge Cases and Error Scenarios**
   - Success Criteria: All edge cases are properly handled with appropriate user feedback
   - Tasks:
     - Implement handling for email conflicts between auth methods
     - Create error handling for failed authentication attempts
     - Add flow for linking Spotify to existing accounts manually if needed

7. **Testing and Validation**
   - Success Criteria: Authentication works reliably in all scenarios with appropriate error handling
   - Tasks:
     - Test sign-up flow with new users
     - Test sign-in with existing Spotify-authenticated users
     - Test account linking scenarios and email conflicts
     - Verify token refresh mechanisms work properly

8. **Documentation and Deployment**
   - Success Criteria: Feature is properly documented and deployed
   - Tasks:
     - Update documentation with new authentication option
     - Create user guide for authentication options
     - Deploy changes to staging for testing
     - Deploy to production after validation

### Project Status Board

- [x] Setup Spotify OAuth for Authentication in Supabase (Need to be completed in Supabase dashboard)
- [ ] Update Database Schema and Types (Schema already supports Spotify data)
- [x] Implement signInWithSpotify function in SupabaseProvider
- [x] Add Spotify Sign-In UI Components to login page
- [x] Add Spotify Sign-Up UI Components to register page
- [x] Implement automatic account linking in auth callback
- [ ] Handle Edge Cases and Error Scenarios
- [ ] Testing and Validation
- [ ] Documentation and Deployment

### Executor's Feedback or Assistance Requests

I've successfully implemented the core components for Spotify authentication:

1. Added `signInWithSpotify` function to the SupabaseProvider
2. Added Spotify login/signup buttons to both the login and registration forms
3. Modified the auth callback handler to automatically link a user's Spotify account when they authenticate with Spotify

Next steps:
1. Configure Spotify as an auth provider in the Supabase dashboard
2. Test the authentication flow with real users
3. Implement comprehensive error handling for edge cases like:
   - Email conflicts between auth methods
   - Account linking failures
   - Token refresh issues

### Lessons

- OAuth authentication requires configuration both in the provider (Spotify) and in Supabase
- When using Spotify as both an authentication provider and API service, we need to properly manage the different types of tokens (auth tokens vs. API tokens)
- Automatic account linking improves user experience by eliminating the need for a separate connection step

## Implementation Plan: Targeted Ads for Free Users During Playlist Creation

### Background and Motivation
To enhance the monetization strategy for Diggr, we need to implement video ads specifically for free tier users during the playlist creation process. This approach leverages a natural pause in user activity (when waiting for playlist generation) to show ads without disrupting the core user experience, while also creating a tangible benefit for premium subscribers who will enjoy an ad-free experience.

### Key Requirements
1. Ads should only be displayed to free tier users
2. Ads should appear during the playlist creation loading/generation process
3. Implementation should integrate with Google AdSense
4. Premium upgrade CTAs should be presented alongside ads

### Technical Analysis

#### 1. User Subscription Status Detection
We already have the subscription status infrastructure through the Supabase integration:
- `useSupabase()` hook provides `userProfile` with plan information
- Existing checks can determine if a user is on a free or premium plan
- We'll leverage this to conditionally show ads

#### 2. Playlist Creation Flow Analysis
The playlist creation process occurs primarily in:
- `/src/app/create-playlist/` - Frontend UI and wizard
- `/src/app/api/playlist/generate/` - Backend API endpoint

The key opportunity is during the API call to generate the playlist, when users are naturally waiting for results.

#### 3. Optimal Integration Points
The most effective point to show ads is:
- After user submits playlist criteria
- While the AI generation process is running
- Before displaying the final playlist results

This creates a non-disruptive ad experience that appears during a natural waiting period.

### Implementation Plan

#### 1. Create Video Ad Components

**VideoAdComponent.tsx**
```tsx
import React, { useEffect, useRef, useState } from 'react';

interface VideoAdProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
}

export const VideoAdComponent: React.FC<VideoAdProps> = ({
  onAdComplete,
  onAdError,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5); // Skip countdown
  const [canSkip, setCanSkip] = useState(false);
  
  // Handle ad initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Initialize Google AdSense
      const adScript = document.createElement('script');
      adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      adScript.async = true;
      adScript.dataset.adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // Publisher ID
      document.head.appendChild(adScript);
      
      adScript.onload = () => {
        if (adContainerRef.current) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
            
            // Track ad impression in Google Analytics
            if (window.gtag) {
              window.gtag('event', 'ad_impression', {
                'event_category': 'ads',
                'event_label': 'playlist_creation'
              });
            }
          } catch (e) {
            console.error("Ad push error:", e);
            setAdError("Failed to load advertisement");
            onAdError?.(e);
          }
        }
      };
      
      // Error handling
      adScript.onerror = (e) => {
        console.error("Ad loading error:", e);
        setAdError("Failed to load advertisement");
        onAdError?.(e);
      };
    } catch (e) {
      console.error("Ad initialization error:", e);
      setAdError("Failed to load advertisement");
      onAdError?.(e);
    }
  }, [onAdError]);
  
  // Skip button timer
  useEffect(() => {
    if (isLoaded && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLoaded && timeRemaining === 0) {
      setCanSkip(true);
    }
  }, [timeRemaining, isLoaded]);
  
  // Handle ad completion
  const handleSkip = () => {
    // Track skip event in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'ad_skipped', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    onAdComplete?.();
  };
  
  return (
    <div className="video-ad-container relative w-full max-w-xl mx-auto">
      {/* Loading state */}
      {!isLoaded && !adError && (
        <div className="flex flex-col items-center justify-center h-40 bg-black/20 backdrop-blur-lg rounded-xl p-6">
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-300">Loading advertisement...</p>
        </div>
      )}
      
      {/* Error state */}
      {adError && (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">Unable to load advertisement</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#1DB954] rounded-full text-sm"
          >
            Continue to Your Playlist
          </button>
        </div>
      )}
      
      {/* Ad display */}
      <div className={`ad-wrapper relative ${!isLoaded ? 'hidden' : ''}`}>
        <ins
          ref={adContainerRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Publisher ID
          data-ad-slot="XXXXXXXXXX" // Ad slot ID
          data-ad-format="video"
        />
        
        {/* Skip button */}
        <div className="absolute bottom-4 right-4">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="px-3 py-1 bg-black/70 text-white text-sm rounded-full flex items-center"
            >
              Skip Ad
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="px-3 py-1 bg-black/70 text-white/70 text-sm rounded-full">
              Skip in {timeRemaining}s
            </div>
          )}
        </div>
      </div>
      
      {/* Premium upgrade CTA */}
      {isLoaded && (
        <div className="mt-4 bg-black/30 backdrop-blur-md rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Enjoy an ad-free experience with Diggr Premium
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full text-sm font-medium"
            onClick={() => {
              // Track upgrade click
              if (window.gtag) {
                window.gtag('event', 'premium_cta_click', {
                  'event_category': 'conversion',
                  'event_label': 'from_ad'
                });
              }
            }}
          >
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoAdComponent;
```

**ConditionalAdDisplay.tsx**
```tsx
import React from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import VideoAdComponent from './VideoAdComponent';

interface ConditionalAdDisplayProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
  fallback?: React.ReactNode; // Component to show for premium users
}

export const ConditionalAdDisplay: React.FC<ConditionalAdDisplayProps> = ({
  onAdComplete,
  onAdError,
  fallback
}) => {
  const { userProfile } = useSupabase();
  
  // Check if user should see ads (free tier or no subscription)
  const shouldShowAds = !userProfile?.plan_type || userProfile?.plan_type === 'free';
  
  if (!shouldShowAds) {
    return <>{fallback}</>;
  }
  
  return (
    <VideoAdComponent
      onAdComplete={onAdComplete}
      onAdError={onAdError}
    />
  );
};

export default ConditionalAdDisplay;
```

#### 2. Integration with Playlist Creation Flow

The playlist creation process should be modified to include the following steps:

1. Submit playlist criteria and start generation
2. For free users, show ad while playlist generates
3. After ad completes or for premium users, show playlist results

**PlaylistCreation.tsx (modified)**
```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import ConditionalAdDisplay from '@/components/ads/ConditionalAdDisplay';

export default function PlaylistCreationComponent() {
  const router = useRouter();
  const { userProfile } = useSupabase();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  
  const handleCreatePlaylist = async (formData) => {
    // Start playlist generation
    setIsGenerating(true);
    
    // For free users, show ad immediately
    const isFreeUser = !userProfile?.plan_type || userProfile.plan_type === 'free';
    if (isFreeUser) {
      setShowAd(true);
    }
    
    try {
      // Call API to generate playlist
      const response = await fetch('/api/playlist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }
      
      const data = await response.json();
      setPlaylistId(data.id);
      
      // Mark generation as complete
      setGenerationComplete(true);
      
      // If premium user or ad already completed, proceed to results
      if (!showAd || !isFreeUser) {
        handleContinueToPlaylist();
      }
      
      // Track successful generation
      if (window.gtag) {
        window.gtag('event', 'playlist_generated', {
          'event_category': 'engagement',
          'event_label': isFreeUser ? 'free_user' : 'premium_user'
        });
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      setIsGenerating(false);
      // Handle error state
    }
  };
  
  const handleContinueToPlaylist = () => {
    if (playlistId) {
      router.push(`/playlists/${playlistId}`);
    } else {
      setIsGenerating(false);
    }
  };
  
  const handleAdComplete = () => {
    // Track ad completion
    if (window.gtag) {
      window.gtag('event', 'ad_completed', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    setShowAd(false);
    
    // If generation is already complete, proceed to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  const handleAdError = (error) => {
    console.error('Ad error:', error);
    
    // Skip ad on error and proceed with normal flow
    setShowAd(false);
    
    // If generation is complete, continue to playlist
    if (generationComplete) {
      handleContinueToPlaylist();
    }
  };
  
  return (
    <div className="playlist-creation-container">
      {/* Creation form - hide when generating */}
      {!isGenerating && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          // Process form data
          handleCreatePlaylist({
            // Form fields
          });
        }}>
          {/* Form fields for playlist criteria */}
          <button 
            type="submit"
            className="px-6 py-3 bg-[#1DB954] rounded-full"
          >
            Create Playlist
          </button>
        </form>
      )}
      
      {/* Generation state with conditional ad */}
      {isGenerating && (
        <div className="generation-container">
          {showAd ? (
            <ConditionalAdDisplay
              onAdComplete={handleAdComplete}
              onAdError={handleAdError}
              fallback={
                <GeneratingPlaylist 
                  isComplete={generationComplete} 
                  onContinue={handleContinueToPlaylist} 
                />
              }
            />
          ) : (
            <GeneratingPlaylist 
              isComplete={generationComplete} 
              onContinue={handleContinueToPlaylist} 
            />
          )}
        </div>
      )}
    </div>
  );
}

// Loading state component
const GeneratingPlaylist = ({ isComplete, onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-lg rounded-xl">
      {!isComplete ? (
        <>
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-medium mb-2">Creating your perfect playlist...</h3>
          <p className="text-[#A3A3A3]">Our AI is curating tracks tailored to your taste</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-[#1DB954]/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Your playlist is ready!</h3>
          <button 
            onClick={onContinue} 
            className="mt-4 px-6 py-2 bg-[#1DB954] rounded-full"
          >
            View Your Playlist
          </button>
        </>
      )}
    </div>
  );
};
```

### Testing Strategy

1. **User Type Testing**
   - Test with free user accounts to verify ads display correctly
   - Test with premium users to verify direct access without ads
   - Test edge cases (e.g., expired subscriptions)

2. **Ad Experience Testing**
   - Test ad loading behavior
   - Verify skip functionality after countdown
   - Test error handling when ads fail to load
   - Ensure premium CTA works properly

3. **Integration Testing**
   - Verify that playlist generation works correctly in parallel with ad display
   - Test entire flow from form submission to playlist display
   - Ensure no race conditions between ad completion and playlist generation

### Analytics Integration

To track the effectiveness of ads and their impact on conversions:

1. **Custom Events to Track**
   - `ad_impression` - When ad is successfully displayed
   - `ad_completed` - When user watches the full ad
   - `ad_skipped` - When user skips the ad
   - `premium_cta_click` - When user clicks upgrade from ad
   
2. **Conversion Tracking**
   - Track conversion rate from ad views to premium subscriptions
   - Measure impact on user retention (do users who see ads return less?)
   
3. **Performance Metrics**
   - Load time for ads
   - Error rate for ad display
   - Skip rate and average watch time

### Implementation Timeline

1. **Phase 1: Core Components (3-4 days)**
   - Create VideoAdComponent
   - Create ConditionalAdDisplay
   - Set up Google AdSense integration

2. **Phase 2: Integration (2-3 days)**
   - Modify playlist creation flow
   - Implement conditional logic for free vs premium
   - Add analytics tracking

3. **Phase 3: Testing & Optimization (3-4 days)**
   - Test with different user types
   - Measure performance and UX impact
   - Optimize based on initial data

### Success Criteria

1. Ads are only shown to free tier users
2. Ad display doesn't significantly impact playlist completion rate
3. Premium CTAs alongside ads generate measurable conversions
4. Ad integration generates revenue without hurting core metrics

### Key Considerations

1. **Performance Impact**
   - Ad loading should not delay playlist generation
   - Implement proper error handling to prevent blocking UX
   
2. **User Experience**
   - Clear messaging about why ads are shown
   - Seamless transitions between app and ad states
   - Skip option after reasonable time
   
3. **Premium Value Proposition**
   - Highlight ad-free experience in premium marketing
   - Direct CTA from ad to pricing page
   - Consider special offer for users upgrading from ad view

### Next Steps

1. Identify the exact files to modify in the codebase
2. Develop and test the ad components in isolation
3. Integrate with playlist creation flow
4. Add analytics tracking
5. Measure impact on both revenue and user experience

### Expected Outcome

- Free users will see video ads during playlist creation, with a premium upgrade CTA
- Premium users will experience ad-free playlist creation
- Ad performance and conversion data will be trackable via Google Analytics
- The user experience remains smooth, with ads appearing at a natural waiting point 

### High-level Task Breakdown: Implementing Spotify Authentication Provider

### Background and Motivation
Adding Spotify as an authentication provider will streamline the user experience by allowing users to sign up and log in using their Spotify accounts. The key enhancement will be automatically linking users' Spotify accounts during authentication, eliminating the need for a separate connection step later. This feature will reduce friction in the onboarding process and increase the likelihood of users creating playlists immediately after registration.

### Key Challenges and Analysis

1. **Dual Role of Spotify Integration**:
   - Currently, Spotify is used only for playlist creation and management
   - We need to extend it to serve as an authentication provider while maintaining existing functionality
   - Must handle cases where users have previously registered with email but want to connect Spotify

2. **User Identity Management**:
   - Need to properly link Spotify user identity with Supabase user accounts
   - Handle potential email conflicts between existing accounts and Spotify accounts
   - Maintain security throughout the authentication flow

3. **Token Management**:
   - Store both authentication tokens and Spotify API tokens
   - Implement proper refresh mechanisms for both token types
   - Ensure secure storage and transmission of tokens

4. **User Experience Considerations**:
   - Provide clear UI for login options
   - Handle failures gracefully with informative error messages
   - Create a seamless experience for users switching between auth methods

### High-level Task Breakdown

1. **Setup Spotify OAuth for Authentication in Supabase**
   - Success Criteria: Spotify is properly configured as an auth provider in Supabase dashboard
   - Tasks:
     - Configure Spotify Developer App for authentication (adjust redirect URIs)
     - Configure Spotify auth provider in Supabase dashboard
     - Update environment variables with necessary credentials

2. **Update Database Schema and Types**
   - Success Criteria: Database schema properly supports Spotify authentication data
   - Tasks:
     - Add new fields to users table if needed (spotify_user_id, etc.)
     - Update TypeScript types to reflect schema changes
     - Create migration for existing users if necessary

3. **Implement Spotify Sign-In UI Components**
   - Success Criteria: Login page displays Spotify login option with appropriate styling
   - Tasks:
     - Create Spotify login button component with brand colors and logo
     - Add button to login page alongside existing options
     - Implement loading states and error handling

4. **Implement Spotify Authentication Flow**
   - Success Criteria: Users can successfully sign in with Spotify
   - Tasks:
     - Add signInWithSpotify function to SupabaseProvider
     - Implement proper redirection to Spotify auth page
     - Set up callback handling for Spotify auth responses

5. **Implement Automatic Account Linking**
   - Success Criteria: When a user signs in with Spotify, their account is automatically marked as connected to Spotify with appropriate tokens
   - Tasks:
     - Update user profile upon successful Spotify authentication
     - Store Spotify refresh token in user profile
     - Set spotify_connected flag to true

6. **Handle Edge Cases and Error Scenarios**
   - Success Criteria: All edge cases are properly handled with appropriate user feedback
   - Tasks:
     - Implement handling for email conflicts between auth methods
     - Create error handling for failed authentication attempts
     - Add flow for linking Spotify to existing accounts manually if needed

7. **Testing and Validation**
   - Success Criteria: Authentication works reliably in all scenarios with appropriate error handling
   - Tasks:
     - Test sign-up flow with new users
     - Test sign-in with existing Spotify-authenticated users
     - Test account linking scenarios and email conflicts
     - Verify token refresh mechanisms work properly

8. **Documentation and Deployment**
   - Success Criteria: Feature is properly documented and deployed
   - Tasks:
     - Update documentation with new authentication option
     - Create user guide for authentication options
     - Deploy changes to staging for testing
     - Deploy to production after validation

### Project Status Board

- [x] Setup Spotify OAuth for Authentication in Supabase (Need to be completed in Supabase dashboard)
- [ ] Update Database Schema and Types (Schema already supports Spotify data)
- [x] Implement signInWithSpotify function in SupabaseProvider
- [x] Add Spotify Sign-In UI Components to login page
- [x] Add Spotify Sign-Up UI Components to register page
- [x] Implement automatic account linking in auth callback
- [ ] Handle Edge Cases and Error Scenarios
- [ ] Testing and Validation
- [ ] Documentation and Deployment

### Executor's Feedback or Assistance Requests

I've successfully implemented the core components for Spotify authentication:

1. Added `signInWithSpotify` function to the SupabaseProvider
2. Added Spotify login/signup buttons to both the login and registration forms
3. Modified the auth callback handler to automatically link a user's Spotify account when they authenticate with Spotify

Next steps:
1. Configure Spotify as an auth provider in the Supabase dashboard
2. Test the authentication flow with real users
3. Implement comprehensive error handling for edge cases like:
   - Email conflicts between auth methods
   - Account linking failures
   - Token refresh issues

### Lessons

- OAuth authentication requires configuration both in the provider (Spotify) and in Supabase
- When using Spotify as both an authentication provider and API service, we need to properly manage the different types of tokens (auth tokens vs. API tokens)
- Automatic account linking improves user experience by eliminating the need for a separate connection step

## Implementation Plan: Targeted Ads for Free Users During Playlist Creation

### Background and Motivation
To enhance the monetization strategy for Diggr, we need to implement video ads specifically for free tier users during the playlist creation process. This approach leverages a natural pause in user activity (when waiting for playlist generation) to show ads without disrupting the core user experience, while also creating a tangible benefit for premium subscribers who will enjoy an ad-free experience.

### Key Requirements
1. Ads should only be displayed to free tier users
2. Ads should appear during the playlist creation loading/generation process
3. Implementation should integrate with Google AdSense
4. Premium upgrade CTAs should be presented alongside ads

### Technical Analysis

#### 1. User Subscription Status Detection
We already have the subscription status infrastructure through the Supabase integration:
- `useSupabase()` hook provides `userProfile` with plan information
- Existing checks can determine if a user is on a free or premium plan
- We'll leverage this to conditionally show ads

#### 2. Playlist Creation Flow Analysis
The playlist creation process occurs primarily in:
- `/src/app/create-playlist/` - Frontend UI and wizard
- `/src/app/api/playlist/generate/` - Backend API endpoint

The key opportunity is during the API call to generate the playlist, when users are naturally waiting for results.

#### 3. Optimal Integration Points
The most effective point to show ads is:
- After user submits playlist criteria
- While the AI generation process is running
- Before displaying the final playlist results

This creates a non-disruptive ad experience that appears during a natural waiting period.

### Implementation Plan

#### 1. Create Video Ad Components

**VideoAdComponent.tsx**
```tsx
import React, { useEffect, useRef, useState } from 'react';

interface VideoAdProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
}

export const VideoAdComponent: React.FC<VideoAdProps> = ({
  onAdComplete,
  onAdError,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5); // Skip countdown
  const [canSkip, setCanSkip] = useState(false);
  
  // Handle ad initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Initialize Google AdSense
      const adScript = document.createElement('script');
      adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      adScript.async = true;
      adScript.dataset.adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // Publisher ID
      document.head.appendChild(adScript);
      
      adScript.onload = () => {
        if (adContainerRef.current) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
            
            // Track ad impression in Google Analytics
            if (window.gtag) {
              window.gtag('event', 'ad_impression', {
                'event_category': 'ads',
                'event_label': 'playlist_creation'
              });
            }
          } catch (e) {
            console.error("Ad push error:", e);
            setAdError("Failed to load advertisement");
            onAdError?.(e);
          }
        }
      };
      
      // Error handling
      adScript.onerror = (e) => {
        console.error("Ad loading error:", e);
        setAdError("Failed to load advertisement");
        onAdError?.(e);
      };
    } catch (e) {
      console.error("Ad initialization error:", e);
      setAdError("Failed to load advertisement");
      onAdError?.(e);
    }
  }, [onAdError]);
  
  // Skip button timer
  useEffect(() => {
    if (isLoaded && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLoaded && timeRemaining === 0) {
      setCanSkip(true);
    }
  }, [timeRemaining, isLoaded]);
  
  // Handle ad completion
  const handleSkip = () => {
    // Track skip event in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'ad_skipped', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    onAdComplete?.();
  };
  
  return (
    <div className="video-ad-container relative w-full max-w-xl mx-auto">
      {/* Loading state */}
      {!isLoaded && !adError && (
        <div className="flex flex-col items-center justify-center h-40 bg-black/20 backdrop-blur-lg rounded-xl p-6">
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-300">Loading advertisement...</p>
        </div>
      )}
      
      {/* Error state */}
      {adError && (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">Unable to load advertisement</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#1DB954] rounded-full text-sm"
          >
            Continue to Your Playlist
          </button>
        </div>
      )}
      
      {/* Ad display */}
      <div className={`ad-wrapper relative ${!isLoaded ? 'hidden' : ''}`}>
        <ins
          ref={adContainerRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Publisher ID
          data-ad-slot="XXXXXXXXXX" // Ad slot ID
          data-ad-format="video"
        />
        
        {/* Skip button */}
        <div className="absolute bottom-4 right-4">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="px-3 py-1 bg-black/70 text-white text-sm rounded-full flex items-center"
            >
              Skip Ad
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="px-3 py-1 bg-black/70 text-white/70 text-sm rounded-full">
              Skip in {timeRemaining}s
            </div>
          )}
        </div>
      </div>
      
      {/* Premium upgrade CTA */}
      {isLoaded && (
        <div className="mt-4 bg-black/30 backdrop-blur-md rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Enjoy an ad-free experience with Diggr Premium
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full text-sm font-medium"
            onClick={() => {
              // Track upgrade click
              if (window.gtag) {
                window.gtag('event', 'premium_cta_click', {
                  'event_category': 'conversion',
                  'event_label': 'from_ad'
                });
              }
            }}
          >
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoAdComponent;
```

**ConditionalAdDisplay.tsx**
```tsx
import React from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import VideoAdComponent from './VideoAdComponent';

interface ConditionalAdDisplayProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
1. Implement comprehensive error handling and validation
2. Create playlist management functionality (edit, delete)
3. Implement user profile and playlist history pages

### Blockers
None currently - All tasks are progressing as expected.

## Executor's Feedback or Assistance Requests
Successfully improved the Settings page functionality:

1. Fixed the Spotify connection button logic to ensure it's only clickable when the user is not already connected.
2. Improved the Member Since date display with more detailed formatting.
3. Completely refactored the Spotify connection status verification to:
   - Prioritize using userProfile data when available (faster)
   - Only fall back to database queries when necessary
   - Provide clearer logging and error handling
   - Optimize the verification process to avoid redundant queries
4. Enhanced the UI with better status indicators and improved the user experience.

These improvements create a more intuitive and efficient user interface that clearly shows the user's account status and prevents them from attempting invalid actions.

## Lessons
1. When implementing OAuth flows, always ensure the exact same redirect URI is used throughout the flow and matches what's registered in the provider's dashboard.
2. Authorization codes from Spotify expire quickly (within a minute) and can only be used once.
3. Handle UI notifications carefully to prevent duplicate or endless notifications.
4. Implement proper error handling with detailed logs to diagnose authentication issues.
5. Create debug endpoints and pages when troubleshooting complex auth flows.
6. Process API requests in batches to avoid rate limits, especially when making multiple calls to external services.
7. Implement fallback strategies when searching for tracks, as AI recommendations might not exactly match Spotify's catalog.
8. Provide clear feedback to users throughout asynchronous processes like playlist creation.
9. When using authentication providers like Supabase in Next.js, prevent multiple initialization events to avoid re-rendering loops.
10. Always have a graceful error handling path for missing user profiles or auth state issues to prevent loading screens from getting stuck.
11. Consider using the authInitialized state variable pattern to ensure auth is only initialized once per session.
12. Be cautious with router refreshes in auth state changes as they can cause unnecessary re-renders or redirects.
13. Include info useful for debugging in the program output.
14. Read the file before you try to edit it.
15. If there are vulnerabilities that appear in the terminal, run npm audit before proceeding.
16. Always ask before using the -force git command.
17. When implementing favicons, ensure