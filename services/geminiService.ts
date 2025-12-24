import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateContentSubtasks = async (projectTitle: string, projectDescription: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key provided.");
    return [
      "Scripting",
      "Filming",
      "Editing",
      "Thumbnail Design",
      "Publishing"
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am a content creator and teacher. I have a project titled "${projectTitle}" described as "${projectDescription}". 
      Please generate a list of 5 to 8 concrete, actionable subtasks (steps) to complete this video or teaching project. 
      Return ONLY the list of tasks as strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return [];
    
    const tasks = JSON.parse(jsonStr);
    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    console.error("Failed to generate subtasks", error);
    return [
      "Research & Outline",
      "Draft Script",
      "Record Video",
      "Edit Footage",
      "Create Thumbnail",
      "Write Description & Tags",
      "Publish"
    ];
  }
};