
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API with named parameter and direct environment variable access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFarmerAdvice = async (cropType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, 1-2 sentence professional agricultural tip for an Indian farmer currently growing ${cropType}. 
      Focus on profit optimization, cost saving, or market trends in India. 
      Use the currency "Rupees" or "₹" if mentioning money.
      IMPORTANT: Do NOT start your response with "To maximize profit" or "To maximize your profit". Be direct and practical.`,
      config: {
        temperature: 0.7,
        // Removed maxOutputTokens to avoid requirement for thinkingBudget and potential empty responses
      }
    });
    // Use .text property directly as per latest SDK guidelines
    return response.text || "Monitor soil moisture levels regularly to reduce unnecessary irrigation costs.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Check local mandi prices daily to get the best value for your crops.";
  }
};
