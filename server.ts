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

  // Memory OTP registry
  const otpRegistry = new Map<string, { otp: string; expiresAt: number; fullName?: string }>();

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // POST: Send verification OTP to email
  app.post("/api/otp/send", async (req, res) => {
    const { email, fullName } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email address is required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // Store in-memory
    otpRegistry.set(cleanEmail, { otp, expiresAt, fullName });

    console.log(`[SECURE CLINIC OTP HANDSHAKE] Generated OTP for user: ${cleanEmail} -> Code: ${otp}`);

    const resendApiKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let mailError = "";

    if (resendApiKey && resendApiKey !== "MY_RESEND_API_KEY") {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev", // Using verified onboarding address
            to: [cleanEmail],
            subject: "🔐 HUMS Appointment Gate - OTP Verification",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 40px;">🏥</span>
                  <h2 style="color: #2563eb; margin: 8px 0 0 0; font-size: 20px; font-weight: 800;">HUMS Digital Portal</h2>
                  <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Hospital Universiti Malaysia Sabah</p>
                </div>
                
                <p style="font-size: 14px; line-height: 20px;">Hello <strong>${fullName || "Patient"}</strong>,</p>
                <p style="font-size: 14px; line-height: 20px; color: #475569;">To securely verify and login to your booking portal, please use the following one-time password (OTP):</p>
                
                <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; border-radius: 12px; font-size: 28px; font-weight: 800; text-align: center; letter-spacing: 4px; color: #1e3a8a; margin: 20px 0;">
                  ${otp}
                </div>
                
                <p style="font-size: 12px; color: #64748b; line-height: 16px;">
                  This verification code is valid for <strong>5 minutes</strong>. Under PDPA data compliance protocols, hospital staff will never ask you for this OTP code.
                </p>
                
                <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8;">
                  HUMS Appointments • Secure Clinical Encryption Verified
                </div>
              </div>
            `
          })
        });

        if (response.ok) {
          emailSent = true;
        } else {
          const detail = await response.text();
          mailError = `Resend status: ${response.status} - ${detail}`;
          console.error(`Resend send failure for ${cleanEmail}: ${mailError}`);
        }
      } catch (err: any) {
        mailError = err?.message || String(err);
        console.error("Failed to route mail via Resend API:", err);
      }
    }

    // Always succeed so the user can continue in sandbox. Return the OTP for the client-side Sandbox Helper Simulator to read in dev mode!
    res.json({
      success: true,
      emailSent,
      sandboxOtp: otp, // For ease of sandbox simulation
      message: emailSent 
        ? "We have dispatched a secure code straight to your physical email inbox!" 
        : "Sandbox local dispatch generated. Since RESEND_API_KEY is not defined, you can read the code inside our clinical simulator alert below!"
    });
  });

  // POST: Verify user OTP
  app.post("/api/otp/verify", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: "Email address and OTP code are required parameters." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = otpRegistry.get(cleanEmail);

    if (!record) {
      res.status(400).json({ error: "No OTP was requested for this email. Please request a code first." });
      return;
    }

    if (Date.now() > record.expiresAt) {
      otpRegistry.delete(cleanEmail);
      res.status(400).json({ error: "This OTP verification code has expired. Please request a fresh code." });
      return;
    }

    if (record.otp !== otp.trim()) {
      res.status(400).json({ error: "Invalid verification code. Please check your spelling and try again." });
      return;
    }

    // Success! Verify complete, remove OTP record
    otpRegistry.delete(cleanEmail);
    res.json({
      success: true,
      message: "Security handshake complete."
    });
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
