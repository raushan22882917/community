import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Initialize Google GenAI on the server side securely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined. Falling back to mock responses.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 0. API: Get Supabase Config from Secrets
app.get('/api/supabase-config', (req, res) => {
  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (url && anonKey) {
    res.json({ url, anonKey });
  } else {
    res.status(404).json({ error: 'Supabase credentials not configured in server environment.' });
  }
});

// 1. API: Auto-Categorize Issue
app.post('/api/categorize-issue', async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and Description are required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant fallback if API key is not present yet
    const categoryMap: { [key: string]: string } = {
      pothole: 'Roads',
      leak: 'Water & Sewage',
      water: 'Water & Sewage',
      sewer: 'Water & Sewage',
      light: 'Electricity',
      power: 'Electricity',
      street: 'Roads',
      waste: 'Sanitation',
      trash: 'Sanitation',
      garbage: 'Sanitation',
      park: 'Public Infrastructure',
      bench: 'Public Infrastructure'
    };

    let matchedCategory = 'Infrastructure';
    let matchedDept = 'Public Infrastructure';
    const lowerText = (title + ' ' + description).toLowerCase();

    if (lowerText.includes('pothole') || lowerText.includes('road') || lowerText.includes('street')) {
      matchedCategory = 'Pothole';
      matchedDept = 'Roads';
    } else if (lowerText.includes('leak') || lowerText.includes('water') || lowerText.includes('sewage')) {
      matchedCategory = 'Water Leakage';
      matchedDept = 'Water & Sewage';
    } else if (lowerText.includes('light') || lowerText.includes('electricity') || lowerText.includes('power')) {
      matchedCategory = 'Damaged Streetlight';
      matchedDept = 'Electricity';
    } else if (lowerText.includes('waste') || lowerText.includes('trash') || lowerText.includes('garbage') || lowerText.includes('litter')) {
      matchedCategory = 'Waste Management';
      matchedDept = 'Sanitation';
    }

    return res.json({
      category: matchedCategory,
      department: matchedDept,
      priority: lowerText.includes('emergency') || lowerText.includes('hazard') ? 'High' : 'Medium',
      ai_summary: `Reporting a standard local ${matchedCategory.toLowerCase()} issue that warrants immediate investigation.`,
      isMock: true
    });
  }

  try {
    const prompt = `As an expert community infrastructure dispatcher, analyze this citizen report and categorize it.
Title: "${title}"
Description: "${description}"

Strictly match to one of the following:
Categories: "Pothole", "Water Leakage", "Damaged Streetlight", "Waste Management", "Infrastructure"
Departments: "Roads", "Water & Sewage", "Electricity", "Sanitation", "Public Infrastructure"
Priority: "Low", "Medium", "High"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Must be exactly one of: Pothole, Water Leakage, Damaged Streetlight, Waste Management, Infrastructure" },
            department: { type: Type.STRING, description: "Must be exactly one of: Roads, Water & Sewage, Electricity, Sanitation, Public Infrastructure" },
            priority: { type: Type.STRING, description: "Must be exactly one of: Low, Medium, High" },
            ai_summary: { type: Type.STRING, description: "An action-focused single-sentence summary of the core issue under 15 words" }
          },
          required: ['category', 'department', 'priority', 'ai_summary']
        }
      }
    });

    const resultText = response.text?.trim() || '{}';
    const result = JSON.parse(resultText);
    res.json({ ...result, isMock: false });
  } catch (error: any) {
    console.error('Gemini categorization failed:', error);
    res.status(500).json({ error: 'Failed to analyze issue', details: error.message });
  }
});

// 2. API: Community Predictive Insights & Hotspots
app.post('/api/predictive-insights', async (req, res) => {
  const { issues } = req.body;

  if (!issues || !Array.isArray(issues)) {
    return res.status(400).json({ error: 'Issues array is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful, robust simulated insights
    return res.json({
      hotspots: [
        { area: "Downtown Core", category: "Water Leakage", riskIndex: 85, reason: "Recent cluster of 3 water mains issues reported near old pipes." },
        { area: "Westside Suburbs", category: "Potholes", riskIndex: 72, reason: "High traffic volume during recent heavy rains has aggravated tarmac degradation." },
        { area: "Industrial Belt", category: "Waste Management", riskIndex: 64, reason: "Recurring commercial overflow reports on weekends." }
      ],
      recommendations: [
        "Pre-emptively inspect the storm drains in the Downtown Core before next Tuesday's forecasted rainfall.",
        "Reallocate Sanitation Workers to the Industrial Belt on Friday evenings to prevent bin overflows.",
        "Upgrade street lighting in South Sector to deter waste dumping in poorly-lit alleys."
      ],
      citizen_engagement_score: "8.4 / 10",
      ai_analysis: "The current issue distribution reveals a 35% increase in sewage/water issues. Roads remain the leading reported category. Active community verification rate is high, reducing dispatch errors by 42%.",
      isMock: true
    });
  }

  try {
    const sanitizedIssues = issues.map(issue => ({
      category: issue.category,
      status: issue.status,
      lat: issue.latitude,
      lng: issue.longitude,
      dept: issue.department,
      created: issue.created_at
    }));

    const prompt = `You are a municipal urban planning AI analyzer.
Examine this batch of community reported issues and generate predictive insights, risk hotspot areas, and strategic dispatch recommendations.
Data: ${JSON.stringify(sanitizedIssues)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hotspots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING, description: "Neighborhood or general sector name" },
                  category: { type: Type.STRING, description: "Leading issue type" },
                  riskIndex: { type: Type.INTEGER, description: "Calculated hazard/risk rating from 0 to 100" },
                  reason: { type: Type.STRING, description: "Core technical cause or pattern observed" }
                },
                required: ['area', 'category', 'riskIndex', 'reason']
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 strategic, actionable recommendations for city resource planning"
            },
            citizen_engagement_score: { type: Type.STRING, description: "Engagement quality rating (e.g., 8.2 / 10)" },
            ai_analysis: { type: Type.STRING, description: "A paragraph summarizing deep trends, infrastructure wear-and-tear projections, or citizen feedback patterns" }
          },
          required: ['hotspots', 'recommendations', 'citizen_engagement_score', 'ai_analysis']
        }
      }
    });

    const resultText = response.text?.trim() || '{}';
    const result = JSON.parse(resultText);
    res.json({ ...result, isMock: false });
  } catch (error: any) {
    console.error('Gemini predictive insights failed:', error);
    res.status(500).json({ error: 'Failed to generate insights', details: error.message });
  }
});

// Configure Vite integration
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Dev mode: Mount Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Prod mode: Static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Community Hero Server] Listening at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start Community Hero server:", err);
});
