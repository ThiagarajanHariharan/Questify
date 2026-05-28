const express = require('express');
const path = require('path');
const uuid = require('uuid');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fsModule = require('fs');

const upload = multer({ dest: path.join(__dirname, 'uploads/') });
const app = express();
module.exports = app;

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(key => key && key.trim() !== '');

if (apiKeys.length === 0) {
  console.error('❌ No Gemini API keys found! Please set GEMINI_API_KEY in your .env file.');
  process.exit(1);
}

console.log(`✅ Loaded ${apiKeys.length} Gemini API key(s) for rotation.`);

let currentKeyIndex = 0;

function getGenAI() {
  return new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
}

function rotateKey() {
  const prevIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`🔄 Rotated API key: key ${prevIndex + 1} -> key ${currentKeyIndex + 1}`);
}

let sidequests = [];
let userProfile = { name: "", selfDescription: "" };

function getDashboardStats() {
  return {
    sidequests: [...sidequests].reverse(),
    totalCount: sidequests.length,
    completedCount: sidequests.filter(s => s.status === 'completed').length,
    pendingCount: sidequests.filter(s => s.status === 'pending').length,
    progressPercent: sidequests.length === 0 ? 0 : Math.round((sidequests.filter(s => s.status === 'completed').length / sidequests.length) * 100)
  };
}

const difficultyPrompts = {
  Easy: `You are a motivational AI creating a short, uplifting sidequest for someone feeling {feeling}.
The activity should be simple, accessible, and take around 5-10 minutes to complete.
User info: {selfDescription}

Generate ONLY a JSON object with this structure (no extra text):
{
  "activity": "Brief, fun activity description (2-3 sentences) that matches their current mood. Focus on quick wins and simple joy.",
  "estimatedTimer": "e.g., 7 min or 10 min",
  "verificationQuestion": "A short, specific question to prove they did the activity or to reflect on what they just did."
}`,
  
  Medium: `You are a creative AI designing an engaging sidequest for someone feeling {feeling}.
The activity should be moderately engaging and take around 15-30 minutes to complete.
User info: {selfDescription}

Generate ONLY a JSON object with this structure (no extra text):
{
  "activity": "Thoughtful activity description (3-5 sentences) that provides a meaningful experience. Focus on light challenge and creative engagement.",
  "estimatedTimer": "e.g., 20 min or 25 min",
  "verificationQuestion": "A short, specific question to prove they did the activity or to reflect on what they just did."
}`,
  
  Hard: `You are an inspiring AI crafting a challenging sidequest for someone feeling {feeling}.
The activity should push the user slightly outside their comfort zone and take around 30-60 minutes.
User info: {selfDescription}

Generate ONLY a JSON object with this structure (no extra text):
{
  "activity": "Ambitious activity description (4-6 sentences) that provides real accomplishment. Focus on skill-building and meaningful challenge.",
  "estimatedTimer": "e.g., 45 min or 50 min",
  "verificationQuestion": "A short, specific question to prove they did the activity or to reflect on what they just did."
}`
};

async function generateSidequest(name, selfDescription, feeling, difficulty) {
  let attempts = 0;
  while (attempts < apiKeys.length) {
    try {
      
      let prompt = difficultyPrompts[difficulty];
      prompt = prompt.replace('{feeling}', feeling);
      prompt = prompt.replace('{selfDescription}', selfDescription);

      
      const model = getGenAI().getGenerativeModel({ model: 'gemini-flash-latest' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('Raw Gemini response:', text);
          throw new Error('Could not parse Gemini response - no JSON found');
        }
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse failed:', parseError.message);
        console.error('Text to parse:', text.substring(0, 500));
        throw parseError;
      }

     
      const sidequest = {
        id: uuid.v4(),
        name,
        selfDescription,
        feeling,
        difficulty,
        timer: parsed.estimatedTimer,
        generatedActivity: parsed.activity,
        verificationQuestion: parsed.verificationQuestion || "What was the most interesting part of completing this sidequest?",
        userAnswer: null,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      return sidequest;
    } catch (error) {
      console.error(`Attempt ${attempts + 1} failed:`, error.message || error);
      const isRateLimited = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
      const isNotFound = error.status === 404 || error.message?.includes('404') || error.message?.includes('INVALID_ARGUMENT');
      
      if ((isRateLimited || isNotFound) && apiKeys.length > 1) {
        console.warn(`⚠️ Key ${currentKeyIndex + 1} failed. Rotating...`);
        rotateKey();
        attempts++;
      } else {
        console.error('Gemini API Error:', error);
        // Fallback: return mock sidequest if all keys fail
        console.warn('⚠️ All API keys failed. Using mock sidequest.');
        return {
          id: uuid.v4(),
          name,
          selfDescription,
          feeling,
          difficulty,
          timer: difficulty === 'Easy' ? '10 min' : difficulty === 'Medium' ? '25 min' : '50 min',
          generatedActivity: `Try something ${feeling}! Take a moment to reflect on what makes you feel this way. This sidequest encourages you to embrace your current mood and find joy in the moment.`,
          verificationQuestion: "What was the most interesting part of completing this sidequest?",
          userAnswer: null,
          status: 'pending',
          createdAt: new Date().toISOString(),
          isMockData: true
        };
      }
    }
  }
  
  
  console.warn('⚠️ All API keys exhausted. Using mock sidequest.');
  return {
    id: uuid.v4(),
    name,
    selfDescription,
    feeling,
    difficulty,
    timer: difficulty === 'Easy' ? '10 min' : difficulty === 'Medium' ? '25 min' : '50 min',
    generatedActivity: `Try something ${feeling}! Take a moment to reflect on what makes you feel this way. This sidequest encourages you to embrace your current mood and find joy in the moment.`,
    verificationQuestion: "What was the most interesting part of completing this sidequest?",
    userAnswer: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    isMockData: true
  };
}

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: fsModule.readFileSync(filePath).toString("base64"),
      mimeType
    },
  };
}

async function evaluateAnswer(activity, answer, imageFile) {
  let attempts = 0;
  while (attempts < apiKeys.length) {
    try {
      const promptText = `You are a lenient but fun AI Evaluator evaluating a player's completion of a sidequest.
Sidequest: "${activity}"
Their Text Description (if any): "${answer || 'None provided'}"
Attached is an image they submitted as proof.

Analyze the image (and text if provided) to see if it plausibly proves they completed the sidequest. 
Be very lenient and generous. Accept it as long as it's not a completely black screen or totally unrelated.
Generate ONLY a JSON object with this structure (no extra text or markdown blocks):
{
  "accepted": true or false,
  "rating": "A star rating (e.g., '⭐⭐⭐⭐', max 5 stars based on effort)",
  "feedback": "A short 1-2 sentence fun response from the AI Evaluator."
}`;

      const model = getGenAI().getGenerativeModel({ model: 'gemini-flash-latest' });
      const parts = [promptText];
      if (imageFile) {
        parts.push(fileToGenerativePart(imageFile.path, imageFile.mimetype));
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/\s*```json\s*/g, '').replace(/\s*```\s*/g, '');
      return JSON.parse(text);
    } catch (error) {
      console.error(`Attempt ${attempts + 1} failed:`, error.message || error);
      const isRateLimited = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota');
      const isNotFound = error.status === 404 || error.message?.includes('404');
      
      if ((isRateLimited || isNotFound) && apiKeys.length > 1) {
        console.warn(`⚠️ Key ${currentKeyIndex + 1} failed. Rotating...`);
        rotateKey();
        attempts++;
      } else {
        console.error('Gemini Evaluation Error:', error);
        return { accepted: true, rating: "⭐⭐⭐", feedback: "The AI Evaluator nods in approval (API Fallback)." };
      }
    }
  }
  return { accepted: true, rating: "⭐⭐⭐", feedback: "The AI Evaluator nods in approval (API Fallback - all keys limited)." };
}


app.get('/settings', (req, res) => {
  res.render('settings', { userProfile });
});

app.post('/settings', (req, res) => {
  const { name, selfDescription } = req.body;
  if (!name || !selfDescription) {
    return res.status(400).render('settings', { userProfile, error: 'All fields are required' });
  }
  userProfile.name = name;
  userProfile.selfDescription = selfDescription;
  res.redirect('/');
});

app.get('/', (req, res) => {
  res.render('dashboard', getDashboardStats());
});

app.get('/add', (req, res) => {
  if (!userProfile.name || !userProfile.selfDescription) {
    return res.render('settings', { userProfile, error: 'Please set up your profile first before creating a sidequest.' });
  }
  res.render('add', { userProfile });
});

app.post('/add-sidequest', async (req, res) => {
  try {
    const { feeling, difficulty } = req.body;
    const { name, selfDescription } = userProfile;

    if (!feeling || !difficulty) {
      return res.status(400).render('add', { error: 'All fields are required' });
    }

    const sidequest = await generateSidequest(name, selfDescription, feeling, difficulty);
    sidequests.push(sidequest);

    // Redirect to view the newly created sidequest
    res.redirect(`/sidequest/${sidequest.id}`);
  } catch (error) {
    console.error('Error creating sidequest:', error);
    res.status(500).render('add', { error: 'Failed to generate sidequest. Try again!' });
  }
});

app.post('/surprise-me', async (req, res) => {
  try {
    if (!userProfile.name || !userProfile.selfDescription) {
      return res.render('settings', { userProfile, error: 'Please set up your profile first before generating a surprise sidequest.' });
    }

    const difficulties = ['Easy', 'Medium', 'Hard'];
    const feelings = ['adventurous', 'curious', 'energetic', 'relaxed', 'spontaneous', 'bored', 'creative'];
    
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const randomFeeling = feelings[Math.floor(Math.random() * feelings.length)];

    const sidequest = await generateSidequest(userProfile.name, userProfile.selfDescription, randomFeeling, randomDifficulty);
    sidequests.push(sidequest);

    res.redirect(`/sidequest/${sidequest.id}`);
  } catch (error) {
    console.error('Error creating surprise sidequest:', error);
    res.status(500).render('dashboard', { 
        sidequests, 
        totalCount: sidequests.length,
        completedCount: sidequests.filter(s => s.status === 'completed').length,
        pendingCount: sidequests.filter(s => s.status === 'pending').length,
        progressPercent: sidequests.length === 0 ? 0 : Math.round((sidequests.filter(s => s.status === 'completed').length / sidequests.length) * 100),
        error: 'Failed to generate surprise sidequest. Try again!' 
    });
  }
});

app.get('/sidequest/:id', (req, res) => {
  const sidequest = sidequests.find(s => s.id === req.params.id);
  if (!sidequest) {
    return res.status(404).render('404');
  }
  res.render('sidequest', { sidequest });
});

app.get('/edit/:id', (req, res) => {
  const sidequest = sidequests.find(s => s.id === req.params.id);
  if (!sidequest) {
    return res.status(404).render('404');
  }
  res.render('edit', { sidequest, userProfile });
});

app.post('/edit/:id', async (req, res) => {
  try {
    const sidequest = sidequests.find(s => s.id === req.params.id);
    if (!sidequest) {
      return res.status(404).render('404');
    }

    const { feeling, difficulty } = req.body;
    const { name, selfDescription } = userProfile;

    if (!feeling || !difficulty) {
      return res.status(400).render('edit', { 
        sidequest, 
        error: 'All fields are required' 
      });
    }

    // Update basic fields
    sidequest.name = name;
    sidequest.selfDescription = selfDescription;
    sidequest.feeling = feeling;
    sidequest.difficulty = difficulty;

    // Regenerate activity if difficulty changed or user requests it
    const regenerate = req.body.regenerate === 'on';
    if (regenerate || difficulty !== sidequest.difficulty) {
      const updatedSidequest = await generateSidequest(name, selfDescription, feeling, difficulty);
      sidequest.timer = updatedSidequest.timer;
      sidequest.generatedActivity = updatedSidequest.generatedActivity;
    }

    res.redirect(`/sidequest/${sidequest.id}`);
  } catch (error) {
    console.error('Error updating sidequest:', error);
    const sidequest = sidequests.find(s => s.id === req.params.id);
    res.status(500).render('edit', { 
      sidequest, 
      error: 'Failed to update sidequest' 
    });
  }
});

app.post('/complete/:id', upload.single('questProof'), async (req, res) => {
  try {
    const sidequest = sidequests.find(s => s.id === req.params.id);
    if (!sidequest) return res.status(404).render('404');

    const userAnswer = req.body.userAnswer;
    const postQuestFeeling = req.body.postQuestFeeling;
    const imageFile = req.file;

    if (!imageFile) {
      return res.render('sidequest', { sidequest, error: "An image upload is required to verify completion!" });
    }
    
    
    const evaluation = await evaluateAnswer(sidequest.generatedActivity, userAnswer, imageFile);

    if (evaluation.accepted) {
      sidequest.status = 'completed';
      sidequest.userAnswer = userAnswer;
      sidequest.postQuestFeeling = postQuestFeeling || 'Not specified';
      sidequest.imagePath = '/uploads/' + imageFile.filename; // Save image path for display
      sidequest.rating = evaluation.rating;
      sidequest.feedback = evaluation.feedback;
      res.redirect('/sidequest/' + sidequest.id);
    } else {
      res.render('sidequest', { 
        sidequest, 
        error: "The AI Evaluator rejected your proof: " + evaluation.feedback 
      });
    }
  } catch (error) {
    console.error('Completion error:', error);
    res.redirect('/');
  }
});

app.post('/delete/:id', (req, res) => {
  sidequests = sidequests.filter(s => s.id !== req.params.id);
  res.redirect('/');
});

app.use((req, res) => {
  res.status(404).render('404');
});

const BASE_PORT = Number(process.env.PORT) || 3000;
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('Make sure GEMINI_API_KEY is set in your environment variables');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && port < BASE_PORT + 10) {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    throw error;
  });
}

if (require.main === module) { startServer(BASE_PORT); }
