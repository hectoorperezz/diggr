# Diggr Playlist Creation Revamp

## Background and Motivation

The user wants to improve the playlist creation process in Diggr. The current process is a multi-step wizard. The user has requested the following changes:

1.  **Remove the "Specific Era" section:** The selection should only show decade options, not specific musical eras.
2.  **Simplify the "Mood Selection" step:** The current mood selection might be too complex or offer too many choices. The goal is to make it more straightforward for the user.
3.  **Add a "User Prompt" section:** This new step will allow users to provide natural language input to guide the playlist generation, giving them more control and flexibility.
4.  **Remove playlist cover image option:** The cover image upload functionality should be removed from the review page.

The overall goal is to create a more intuitive and powerful playlist creation experience.

Additionally, the user now wants to improve the landing page to make it more engaging and effective at converting visitors to users.

## Key Challenges and Analysis

-   **Era Selection Modification:** The `EraSelection.tsx` component currently has two tabs: "decades" and "specific eras". We need to remove the specific eras tab and only keep the decades options.
-   **Mood Selection Simplification:** The `MoodSelection.tsx` component is quite complex with multiple categories and many mood options. We need to simplify this to make it more user-friendly.
-   **User Prompt Addition:** We need to create a new component for users to input natural language prompts to guide playlist creation.
-   **State Management:** The `PlaylistFormData` interface in `src/app/create-playlist/page.tsx` will need to be updated to include a new field for the user prompt.
-   **Backend Integration:** The backend API endpoint that handles playlist generation (`/api/playlists/generate`) will need to be updated to accept the new user prompt.
-   **Cover Image Removal:** The cover image upload functionality needs to be removed from the `Review.tsx` component.
-   **Landing Page Improvement:** The current landing page is well-designed but could be improved to increase conversion rates and better showcase the app's features.

## High-level Task Breakdown

1.  **Modify the Era Selection Component:**
    -   Remove the "specific eras" tab from `EraSelection.tsx`.
    -   Remove the tab-switching UI (the tabs for "decades" and "specific eras")
    -   Remove the `activeTab` state and related conditional rendering
    -   Update the main UI to only display the decade options
    -   Ensure proper spacing and layout after removing the tabs
    -   *Success Criteria:* The era selection page only shows decade options and functions correctly.

2.  **Simplify Mood Selection:**
    -   Reduce the number of mood categories and options in `MoodSelection.tsx`.
    -   Simplify the UI by consolidating similar moods and removing less common ones.
    -   Consider reducing the maximum selectable moods from 5 to 3.
    -   *Success Criteria:* The mood selection step is noticeably simpler with fewer options and a cleaner UI.

3.  **Implement User Prompt Component:**
    -   Create a new file `src/components/playlist-wizard/UserPrompt.tsx`.
    -   Implement a form with a textarea for natural language input.
    -   Add character count/limit (e.g., 200-300 characters)
    -   Include helpful placeholder text
    -   Add example prompts that users can click to use or modify
    -   Implement proper form validation
    -   Add animations consistent with other components
    -   *Success Criteria:* The component renders correctly and updates the form state.

4.  **Integrate User Prompt Component into Wizard Flow:**
    -   Update `PlaylistFormData` interface to add `userPrompt: string`
    -   Add `'prompt'` to `WizardStep` type in `src/app/create-playlist/page.tsx`
    -   Add the new step to the wizard flow, placing it after "mood" step
    -   Update `nextStep` and `prevStep` logic to include the new step
    -   Add the component to `renderStepContent()`
    -   *Success Criteria:* The user prompt step appears in the wizard flow and works correctly.

5.  **Update Backend API:**
    -   Modify `/api/playlists/generate/route.ts` to accept and process the `userPrompt` field
    -   Update the logic to incorporate the user's prompt into the playlist generation algorithm
    -   *Success Criteria:* The API successfully generates playlists based on the user prompt input.

6.  **Remove Cover Image Option:**
    -   Remove the playlist cover image upload section from `Review.tsx`
    -   Remove related state variables and functions
    -   Add a section for displaying the user prompt in the review page
    -   *Success Criteria:* The cover image upload option is completely removed and the review page still functions properly.

7.  **Testing:**
    -   Test the entire playlist creation flow with the new changes
    -   Verify that removing the specific era section doesn't break functionality
    -   Test the simplified mood selection to ensure it still provides enough options
    -   Test the user prompt with various inputs to ensure it produces good results
    -   Verify that playlist creation works correctly without cover image uploads
    -   *Success Criteria:* The entire flow works as expected without bugs.

8.  **Improve Landing Page:**
    -   Enhance the hero section with more compelling copy and visuals
    -   Add a features showcase section with screenshots/demos
    -   Improve the call-to-action buttons and their placement
    -   Add social proof elements (user testimonials, statistics)
    -   Optimize for mobile responsiveness
    -   Add a FAQ section to address common questions
    -   *Success Criteria:* The landing page is more engaging and effective at converting visitors to users.

## Detailed Task Specifications

### Task 1: Modify the Era Selection Component

1. In `EraSelection.tsx`:
   - Remove the `specificEraOptions` array and all references to it
   - Remove the tab-switching UI (the tabs for "decades" and "specific eras")
   - Remove the `activeTab` state and related conditional rendering
   - Update the main UI to only display the decade options
   - Ensure proper spacing and layout after removing the tabs

### Task 2: Simplify Mood Selection

1. In `MoodSelection.tsx`:
   - Reduce the number of mood categories from 5 to 3-4 most important ones
   - For each category, limit to 4-5 most common/useful moods
   - Consider consolidating the "Energy" and "Tempo" categories
   - Update the UI to make selection more intuitive (potentially using a simpler grid layout)
   - Consider reducing the maximum selectable moods from 5 to 3 or 4
   - Update helper text and UI elements to reflect the simplified options

### Task 3: Implement User Prompt Component

1. Create `src/components/playlist-wizard/UserPrompt.tsx`:
   - Component should accept `formData` and `updateFormData` props
   - Include a textarea with appropriate styling matching other components
   - Add character count/limit (e.g., 200-300 characters)
   - Include helpful placeholder text
   - Add example prompts that users can click to use or modify
   - Implement proper form validation
   - Add animations consistent with other components

### Task 4: Integrate User Prompt Component

1. In `src/app/create-playlist/page.tsx`:
   - Update `PlaylistFormData` interface to add `userPrompt: string`
   - Add `'prompt'` to `WizardStep` type
   - Initialize the new field in the initial state: `userPrompt: ''`
   - Import the new UserPrompt component
   - Update `renderStepContent()` function to include the new component
   - Modify `nextStep` and `prevStep` functions to include the new step
   - Update the progress calculation to include the new step

### Task 6: Remove Cover Image Option

1. In `src/components/playlist-wizard/Review.tsx`:
   - Remove the `isUploading` and `previewImage` state variables
   - Remove the `fileInputRef` reference
   - Remove the `handleFileChange`, `processImage`, and `convertPngToJpeg` functions
   - Remove the entire Playlist Cover Image section from the JSX
   - Add a section to display the user's prompt if available

### Task 8: Improve Landing Page

1. Enhance the hero section:
   - Update headline to be more benefit-focused
   - Add a subheadline that clearly explains what Diggr does
   - Improve the CTA button text and design
   - Add a hero image or animation showing the app in action

2. Add a features showcase section:
   - Create visual representations of key features
   - Add screenshots or mockups of the app interface
   - Include brief, benefit-focused descriptions for each feature

3. Improve social proof:
   - Add more authentic user testimonials with photos
   - Include usage statistics (e.g., "X playlists created", "Y songs discovered")
   - Add logos of music publications or partners if applicable

4. Enhance the "How It Works" section:
   - Make it more visual with screenshots of each step
   - Simplify the explanation of each step
   - Add a video demo if possible

5. Optimize the pricing section:
   - Make the value proposition clearer
   - Highlight the most popular plan
   - Add a comparison table for features

6. Improve mobile responsiveness:
   - Ensure all sections look good on mobile devices
   - Optimize image loading for mobile
   - Improve touch targets for mobile users

## Project Status Board

-   [x] **Task 1:** Modify the Era Selection Component
-   [x] **Task 2:** Simplify Mood Selection
-   [x] **Task 3:** Implement User Prompt Component
-   [x] **Task 4:** Integrate User Prompt Component into Wizard Flow
-   [x] **Task 5:** Update Backend API
-   [x] **Task 6:** Remove Cover Image Option
-   [ ] **Task 7:** Testing
-   [ ] **Task 8:** Improve Landing Page

## Executor's Feedback or Assistance Requests

All tasks related to the playlist creation process have been completed successfully. The changes include:

1. Removed the specific era section from EraSelection component, keeping only the decade options.
2. Simplified the MoodSelection component by:
   - Reducing categories from 5 to 3
   - Consolidating "Energy" and "Tempo" categories
   - Reducing maximum selectable moods from 5 to 3
3. Created a new UserPrompt component with:
   - Character-limited text input (250 chars)
   - Example prompts users can select
   - Tips for writing effective prompts
   - Visual feedback on character limit
4. Integrated the UserPrompt component into the wizard flow
5. Updated the backend API to handle and process the userPrompt field
6. Removed the cover image upload functionality from the Review component and added a section to display the user's prompt

The application now offers a more streamlined experience with the simplified mood selection and era selection, while giving users more control through the natural language prompt feature, and removing the unnecessary cover image upload functionality.

Now we need to focus on improving the landing page to increase user conversion.

## Lessons

- When using React hooks in a Next.js app directory file, always add 'use client' at the top of the file.
- When adding a new property to an interface used across the application, make sure to update all relevant files that use that interface to avoid TypeScript errors.