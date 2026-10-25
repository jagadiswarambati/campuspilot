import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiConnectionStatus } from "../../types";

export interface GemmaConfig {
  apiKey?: string;
  modelName: string;
  demoMode: boolean;
  provider: string;
}

export function getGemmaConfig(): GemmaConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";
  const demoMode =
    process.env.DEMO_MODE === "true" ||
    !apiKey ||
    apiKey.trim() === "" ||
    apiKey.includes("PASTE_YOUR_API_KEY_HERE");
  const provider = process.env.AI_PROVIDER || "gemma";

  return {
    apiKey,
    modelName,
    demoMode,
    provider,
  };
}

/**
 * Test connectivity with the configured Gemma 4 model.
 * Never leaks API key. Reports exact reasons for failure.
 */
export async function testGemmaConnectivity(): Promise<AiConnectionStatus> {
  const config = getGemmaConfig();
  const now = new Date().toISOString();

  if (config.demoMode) {
    const isPlaceholder =
      !config.apiKey || config.apiKey.includes("PASTE_YOUR_API_KEY_HERE");
    return {
      connected: false,
      provider: "demo",
      model: config.modelName,
      demoMode: true,
      message: isPlaceholder
        ? "Demo Mode Active. Replace PASTE_YOUR_API_KEY_HERE in .env.local and set DEMO_MODE=false to enable live Gemma 4."
        : "Demo Mode Active (DEMO_MODE=true in .env.local). Deterministic multi-agent engine is active.",
      lastChecked: now,
    };
  }

  if (!config.apiKey) {
    return {
      connected: false,
      provider: "demo",
      model: config.modelName,
      demoMode: true,
      message: "No API key configured. Running in high-fidelity demo mode.",
      lastChecked: now,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    // Strict requirement: MUST use configured GEMMA_MODEL, never silently substitute Gemini
    const model = genAI.getGenerativeModel({ model: config.modelName });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Respond with the word 'READY'." }] }],
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0.1,
      },
    });

    const response = await result.response;
    const text = response.text();

    if (text) {
      return {
        connected: true,
        provider: "gemma",
        model: config.modelName,
        demoMode: false,
        message: `Connected successfully to Gemma 4 (${config.modelName}). Live AI orchestration active.`,
        lastChecked: now,
      };
    } else {
      return {
        connected: false,
        provider: "demo",
        model: config.modelName,
        demoMode: true,
        message: "Model returned an empty response. Running in demo mode.",
        lastChecked: now,
      };
    }
  } catch (error: any) {
    const rawError = String(error?.message || error || "");
    // Sanitize any accidental secret leakage
    const sanitizedError = config.apiKey
      ? rawError.replace(new RegExp(config.apiKey, "g"), "[REDACTED_API_KEY]")
      : rawError;

    let friendlyMessage = `Gemma 4 connection failed: ${sanitizedError}`;

    if (
      sanitizedError.includes("API_KEY_INVALID") ||
      sanitizedError.includes("401") ||
      sanitizedError.includes("Unauthorized")
    ) {
      friendlyMessage =
        "Google AI Studio authentication failed: Invalid API key. Please check GEMINI_API_KEY in .env.local.";
    } else if (
      sanitizedError.includes("not found") ||
      sanitizedError.includes("404") ||
      sanitizedError.includes("is not supported")
    ) {
      friendlyMessage = `Model identifier "${config.modelName}" is not available on this API key or endpoint. Ensure Gemma 4 model access is enabled in Google AI Studio or configure a valid Gemma 4 model identifier.`;
    } else if (
      sanitizedError.includes("429") ||
      sanitizedError.includes("RESOURCE_EXHAUSTED") ||
      sanitizedError.includes("quota")
    ) {
      friendlyMessage =
        "Google AI Studio quota exceeded for Gemma 4. Falling back to deterministic demo mode.";
    }

    return {
      connected: false,
      provider: "demo",
      model: config.modelName,
      demoMode: true,
      message: friendlyMessage,
      lastChecked: now,
    };
  }
}

/**
 * Natural language intent extraction using Gemma 4 when connected,
 * or returning null to trigger the deterministic fallback parser.
 */
export async function parseIntentWithGemma(
  prompt: string
): Promise<{
  minutes?: number;
  wantsVegetarian?: boolean;
  pageCount?: number;
  budget?: number;
  needsFood?: boolean;
  needsPrint?: boolean;
  intentSummary?: string;
} | null> {
  const config = getGemmaConfig();
  if (config.demoMode || !config.apiKey) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.modelName,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const systemPrompt = `You are the Central Orchestrator for CampusPilot AI.
Parse the student's request and extract structured scheduling requirements in JSON format:
{
  "minutes": number or null (e.g. 35 if student mentions 35 minutes before class),
  "wantsVegetarian": boolean,
  "pageCount": number or null (e.g. 25 if student mentions 25 pages),
  "budget": number or null (if student mentions budget),
  "needsFood": boolean,
  "needsPrint": boolean,
  "intentSummary": string
}
Do not hallucinate prices or shops. Only extract what the student explicitly requested.`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\nStudent request: "${prompt}"` }] },
      ],
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.warn("Gemma intent parsing fell back to deterministic parser:", err);
    return null;
  }
}
