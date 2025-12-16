import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from '../types';

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    if (!process.env.API_KEY) {
      console.warn("API_KEY is missing. AI features will be disabled.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const analyzeJsonStructure = async (jsonString: string): Promise<AnalysisResult> => {
  const client = getAiClient();
  if (!client) {
    throw new Error("API Key not configured.");
  }

  // Truncate if too large for a quick analysis, though Gemini 2.5 Flash has a huge context.
  // For a responsive UI, we limit the initial string if it's absurdly large, 
  // but let's trust the 1M token window for now up to a reasonable limit (~500KB text for speed).
  // If it's a 5MB msgpack, the JSON might be 10MB. 
  // We'll send a truncated version if it exceeds ~1MB characters to keep the request fast.
  
  const maxLength = 1000000; 
  const processedString = jsonString.length > maxLength 
    ? jsonString.substring(0, maxLength) + "\n...(truncated for analysis)" 
    : jsonString;

  const prompt = `
    You are a data structure expert. Analyze the following JSON data (which was converted from MessagePack).
    Provide a concise summary in JSON format with the following keys:
    - summary: A brief textual description of what this data represents (e.g., "Game save data", "Configuration file").
    - structure: A description of the schema or key hierarchy.
    - suggestions: An array of potential issues or observations (e.g., "Large array detected at root.users").

    Data:
    \`\`\`json
    ${processedString}
    \`\`\`
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("AI Analysis failed", error);
    throw new Error("Failed to analyze data.");
  }
};
