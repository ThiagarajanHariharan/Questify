# Questify AI Planning Document

## Project Goal

Build a simple CA1-compliant web application called **Questify**, an AI-powered sidequest generator that creates personalized activities based on a user's profile, current mood, and selected difficulty level.

The app should be easy to explain, match the CA1 assignment brief, and be realistic for a student to build using Node.js, Express, EJS, and in-memory storage only.

## Problem Statement

Many simple productivity or activity apps give generic suggestions that feel repetitive and not personal. The goal of Questify is to make activity generation more engaging by using AI to create short sidequests tailored to the user's mood and preferred challenge level.

This gives the project a clear personalized feature while still staying within the CA1 requirement of a simple web application.

## Requirements

### CA1 Requirements

The application must:

- Use **Node.js**, **Express.js**, and **EJS**.
- Use **in-memory arrays only** for data storage.
- Use **GET and POST routes only**.
- Allow users to **view**, **add**, **edit**, and **delete** records.
- Use **multiple pages** rendered with EJS.
- Include at least **one personalized feature**.
- Be simple enough for the student to explain during demo and reflection.

### Project Requirements

Questify should:

- Let the user set up a basic profile.
- Generate AI-based sidequests using a mood and difficulty input.
- Show all created sidequests in a dashboard.
- Allow sidequests to be edited, regenerated, completed, and deleted.
- Show progress statistics to make the app feel more game-like.

## App Concept

Questify is a web app where a user first creates a simple profile with their name and a short self-description. After that, the user can generate sidequests by choosing how they feel and selecting a difficulty level such as Easy, Medium, or Hard.

The app sends this information to Gemini AI, which returns a short personalized activity and an estimated time to complete it. The generated quest is then stored in an in-memory array and displayed on the dashboard and detail pages.

## Core Features

### 1. User Profile Setup

The app should have a settings page where the user enters:

- Name
- Self-description

This profile will be reused when generating sidequests so the app feels more personalized.

### 2. Dashboard

The main dashboard should display:

- Total number of sidequests
- Completed sidequests
- Pending sidequests
- Progress percentage
- A list of created sidequests

This will act as the main view page required by CA1.

### 3. Add Sidequest

The user should be able to create a new sidequest by entering:

- Current feeling or mood
- Difficulty level

The system should combine this with the saved profile and ask Gemini to generate:

- A short activity
- An estimated timer
- A verification question or completion context if needed

### 4. View Sidequest Details

Each generated sidequest should have a detail page that shows:

- Activity description
- Difficulty
- Estimated timer
- Current status
- Buttons for edit, complete, and delete

### 5. Edit Sidequest

The user should be able to edit the feeling and difficulty of an existing sidequest.

The edit page should also include an optional **regenerate** checkbox. If selected, or if difficulty changes, the app should call Gemini again to generate a new activity and timer while keeping the same sidequest record.

### 6. Delete Sidequest

The user should be able to remove a sidequest from the in-memory array using a POST form.

### 7. Mark as Completed

The user should be able to mark a sidequest as completed. This updates the status and allows the dashboard statistics to change.

### 8. Personalized Feature

The personalized feature for this CA1 project will be **difficulty-based AI prompt generation**.

Instead of using one generic prompt, the backend will use different prompt styles for:

- Easy: quick, simple, low-effort activities
- Medium: moderate and creative activities
- Hard: more challenging or skill-building activities

This makes the AI response more meaningful and directly supports the assignment requirement for personalization.

## Planned Pages

The app should include these EJS pages:

- `settings.ejs` - Profile setup page
- `dashboard.ejs` - Main list and stats page
- `add.ejs` - Form to create a sidequest
- `sidequest.ejs` - Single sidequest detail page
- `edit.ejs` - Form to update a sidequest
- `404.ejs` - Custom error page

These pages are enough to satisfy the requirement for multiple pages.

## Data Design

### User Profile Object

```js
let userProfile = {
  name: '',
  selfDescription: ''
};
```

### Sidequest Object

```js
{
  id: 'unique-id',
  name: 'John',
  selfDescription: 'Likes creative tasks',
  feeling: 'tired',
  difficulty: 'Easy',
  timer: '10 min',
  generatedActivity: 'Take a short walk and find 3 interesting things around you.',
  status: 'pending',
  createdAt: 'timestamp'
}
```

### Storage Plan

```js
let sidequests = [];
```

The project will not use a database because CA1 requires simple in-memory storage.

## Route Plan

The app should use only GET and POST methods.

### Planned Routes

- `GET /settings` - Show profile form
- `POST /settings` - Save profile
- `GET /` - Show dashboard
- `GET /add` - Show create form
- `POST /add-sidequest` - Generate and save a new sidequest
- `GET /sidequest/:id` - Show one sidequest
- `GET /edit/:id` - Show edit form
- `POST /edit/:id` - Update sidequest
- `POST /complete/:id` - Mark sidequest as complete
- `POST /delete/:id` - Delete sidequest
- Catch-all route for `404.ejs`

## AI Integration Plan

Gemini will be used to generate sidequests.

### Prompt Strategy

The backend will define three prompt templates:

- **Easy prompt**: generate short and uplifting activities around 5 to 10 minutes.
- **Medium prompt**: generate engaging activities around 15 to 30 minutes.
- **Hard prompt**: generate more ambitious activities around 30 to 60 minutes.

Each prompt should include:

- User name
- Self-description
- Current feeling
- Selected difficulty
- A request to return JSON only

### Expected AI Response

The response should be parsed as JSON with a structure like:

```json
{
  "activity": "Write down 3 things you want to improve this week and choose one to start now.",
  "estimatedTimer": "15 min"
}
```

### Why This Matters

This approach keeps the personalized feature simple, explainable, and useful. It also makes the output more consistent for rendering in EJS.

## UI and Styling Plan

The interface should be built with Bootstrap and a small amount of custom CSS.

Planned design choices:

- Clean dashboard cards for statistics
- Difficulty badges with different colors
- Responsive layout for mobile and desktop
- Clear buttons for create, edit, complete, and delete actions
- Simple, student-friendly design that is easy to explain

## Validation Plan

Basic validation should be added for:

- Empty profile fields
- Empty feeling field
- Missing difficulty selection
- Invalid sidequest ID

If validation fails, the page should re-render with a simple error message.

## Build Plan

The app should be implemented in this order:

1. Set up Express app and EJS configuration.
2. Create the settings page and save profile in memory.
3. Build the dashboard page to show all sidequests.
4. Build the add sidequest form.
5. Integrate Gemini for AI generation.
6. Store generated sidequests in an in-memory array.
7. Create the sidequest detail page.
8. Add edit functionality with optional regeneration.
9. Add delete functionality.
10. Add complete status tracking.
11. Improve layout and styling.
12. Test all routes and edge cases.

This order follows the CA1-friendly workflow and makes the project easier to explain in the reflection journal.

## Testing Plan

Before submission, test these flows:

- User can save profile successfully.
- User can create a new sidequest.
- AI returns valid activity and timer.
- Dashboard updates after new sidequest is added.
- User can open sidequest detail page.
- User can edit and regenerate a sidequest.
- User can mark a sidequest as completed.
- User can delete a sidequest.
- Invalid routes show the custom 404 page.
- Validation errors display clearly.

## Risks and Constraints

### Constraints

- No database allowed.
- Must stay simple enough for CA1.
- Must use GET and POST only.
- Student must be able to explain the code clearly.

### Risks

- Gemini may sometimes return extra text instead of clean JSON.
- API calls may fail or be rate-limited.
- AI-generated content may need prompt tuning for better quality.

### Mitigation

- Use strict JSON-style prompts.
- Add parsing and fallback error handling.
- Keep prompts simple and focused.

## Expected Outcome

By the end of implementation, Questify should be a working multi-page AI-powered web app that demonstrates:

- CRUD features using Express and EJS
- In-memory data handling
- A personalized AI feature
- Clear UI and navigation
- A project structure that matches CA1 requirements

