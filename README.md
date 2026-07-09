# Questify

Questify is an AI-powered sidequest generator built with **Node.js**, **Express**, and **EJS**.  
It creates personalized mini-quests based on your mood and profile, then lets you submit proof for AI-based completion feedback.

## Features

- Personalized sidequest generation using Gemini
- Difficulty levels: **Easy**, **Medium**, **Hard**
- Profile-based prompts (name + self description)
- "Surprise Me" random quest generation
- Quest progress dashboard (total, completed, pending, progress %)
- Image proof upload for quest completion
- AI evaluator feedback and star-style rating
- API key rotation across multiple Gemini keys
- Fallback mock quest/evaluation behavior when API calls fail

## Tech Stack

- Node.js (CommonJS)
- Express
- EJS templates
- Multer (file uploads)
- Google Generative AI SDK (`@google/generative-ai`)
- Bootstrap 5 (via CDN)

## Prerequisites

- Node.js 18+ (recommended)
- npm
- One or more Gemini API keys

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   GEMINI_API_KEY=your_primary_key
   GEMINI_API_KEY_2=your_secondary_key_optional
   GEMINI_API_KEY_3=your_third_key_optional
   PORT=3000
   ```

   At least `GEMINI_API_KEY` is required.

3. Start the app:

   ```bash
   npm start
   ```

4. Open:

   ```text
   http://localhost:3000
   ```

If port 3000 is busy, the app automatically tries the next ports.

## Available Scripts

- `npm start` – run the server
- `npm run dev` – run with nodemon
- `npm run test-keys` – runs API key test script (if present)

## Basic Flow

1. Go to **Settings** and save your profile.
2. Create a sidequest from **Create New Quest** (or use **Surprise Me**).
3. View quest details and complete it.
4. Upload image proof and optional notes.
5. Review AI evaluator feedback on the completed quest.

## Project Structure

```text
Questify/
├── app.js
├── package.json
├── views/
│   ├── 404.ejs
│   ├── add.ejs
│   ├── dashboard.ejs
│   ├── edit.ejs
│   ├── navbar.ejs
│   ├── settings.ejs
│   └── sidequest.ejs
└── README.md
```

## Notes

- Data is currently stored in memory (no database), so sidequests reset on server restart.
- Uploaded proof images are stored in `uploads/`.
