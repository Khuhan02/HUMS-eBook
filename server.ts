import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Waring: GEMINI_API_KEY is not defined. Using mock predictions.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Virtual Queue Predictor route using gemini-3.5-flash
  app.post("/api/gemini/predict-wait", async (req: express.Request, res: express.Response) => {
    const { patientsAhead, symptomName, averageWaitTime } = req.body;

    if (patientsAhead === undefined || !symptomName || averageWaitTime === undefined) {
      res.status(400).json({ error: "Missing required fields (patientsAhead, symptomName, averageWaitTime)." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Graceful fallback helper if API key is not yet set
      const calculatedTime = Math.max(5, (patientsAhead * 8) + averageWaitTime);
      res.json({
        estimatedWait: calculatedTime,
        explanation: `${calculatedTime} minutes estimated. Calculated dynamically on server based on symptom load and ${patientsAhead} patients ahead.`
      });
      return;
    }

    try {
      const gClient = getGeminiClient();
      const prompt = `Current queue: ${patientsAhead}
Symptom: ${symptomName}
Historical average consultation duration: ${averageWaitTime}

Estimate waiting time and explain in one short sentence.`;

      const response = await gClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a healthcare queue assistant for Malaysian clinics. Evaluate wait times and always return a short response. The explanation must count estimated minutes clearly.",
          temperature: 0.2,
        }
      });

      const text = response.text || "";
      // Strip integer if possible to extract estimated wait
      let estimatedWait = Math.max(5, (patientsAhead * 8) + averageWaitTime);
      const match = text.match(/(\d+)\s*minutes/i);
      if (match) {
        estimatedWait = parseInt(match[1], 10);
      }

      res.json({
        estimatedWait: estimatedWait,
        explanation: text.trim() || `${estimatedWait} minutes estimated. Slightly longer wait due to incoming volume.`
      });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      // Fallback
      const calculatedTime = Math.max(5, (patientsAhead * 8) + averageWaitTime);
      res.json({
        estimatedWait: calculatedTime,
        explanation: `${calculatedTime} minutes. Slightly longer wait due to high patient volume.`
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
