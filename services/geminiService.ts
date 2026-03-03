import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "./supabaseClient";

// 1. Landing Page JSON Schema (Page 1)
const landingPageSchema = {
  type: Type.OBJECT,
  description: "Structure for the high-conversion landing page (Page 1)",
  properties: {
    header: {
      type: Type.OBJECT,
      properties: {
        logoText: { type: Type.STRING },
        phone: { type: Type.STRING },
        ctaText: { type: Type.STRING }
      },
      required: ["logoText", "ctaText"]
    },
    hero: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        subheadline: { type: Type.STRING },
        ctaText: { type: Type.STRING },
        heroImage: { type: Type.STRING, description: "Relevant image URL from a high quality library" }
      },
      required: ["headline", "subheadline", "ctaText"]
    },
    logos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          alt: { type: Type.STRING },
          src: { type: Type.STRING, description: "Iconify URL for a well-known industry brand" }
        }
      }
    },
    howItWorks: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              icon: { type: Type.STRING, description: "Lucide icon name" }
            }
          }
        }
      }
    },
    testimonials: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              quote: { type: Type.STRING },
              author: { type: Type.STRING },
              role: { type: Type.STRING },
              avatar: { type: Type.STRING }
            }
          }
        }
      }
    },
    faq: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            }
          }
        }
      }
    }
  }
};

// 2. Quiz Funnel Master Template JSON Schema
const quizFunnelSchema = {
  type: Type.OBJECT,
  description: "Structure for the qualification quiz steps and result logic",
  properties: {
    niche: { type: Type.STRING },
    metadata: {
      type: Type.OBJECT,
      properties: {
        goal: { type: Type.STRING },
        primaryTone: { type: Type.STRING }
      }
    },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          type: { type: Type.STRING, description: "single | slider | input" },
          field: { type: Type.STRING, description: "camelCaseFieldName" },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING },
                icon: { type: Type.STRING, description: "LucideIconName" }
              }
            }
          },
          validation: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER },
              step: { type: Type.NUMBER },
              format: { type: Type.STRING }
            }
          }
        },
        required: ["title", "type", "field"]
      }
    },
    resultsPageConfig: {
      type: Type.OBJECT,
      properties: {
        headlineTemplate: { type: Type.STRING },
        subheadlineTemplate: { type: Type.STRING },
        metrics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              icon: { type: Type.STRING },
              label: { type: Type.STRING },
              valueRule: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        }
      }
    }
  }
};

const migrationResponseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    primaryColor: { type: Type.STRING },
    landing: landingPageSchema,
    quiz: quizFunnelSchema
  },
  required: ["name", "primaryColor", "landing", "quiz"]
};

export const generateFunnelContent = async (prompt: string, url?: string): Promise<any> => {
  try {
    // Note: process.env.API_KEY is usually for server-side. 
    // If calling from client, ensure this function is invoked via Supabase safely.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3.1-pro-preview"; // Updated to stable 2026 model

    const systemInstruction = `
      You are the Lead Funnel Architect for Wisefunnel. 
      Your mission is to migrate content from a provided URL into a structured, 7-section landing page and a qualifying quiz funnel.
      
      STRICT REQUIREMENTS:
      1. IGNORE the original website design/branding. Use our "Wisefunnel Canvas" methodology.
      2. LANDING PAGE: Must have exactly Header, Hero, Trust Logos, HowItWorks, Testimonials, FAQ, Footer.
      3. QUIZ: Build a 4-5 step qualification quiz based on the industry niche found in the URL.
      4. FONT: Use "Inter" as the primary font family.
      5. ASSETS: Use generic high-quality descriptive image URLs or established placeholders.
    `;

    const contents = `Migrate this URL: ${url || prompt}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: contents }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: migrationResponseSchema,
        temperature: 0.1,
      },
    });

    const textOutput = response.text?.trim();
    if (!textOutput) {
        throw new Error("The AI model returned an empty analysis. Please try again with a more descriptive URL.");
    }

    const cleanedText = textOutput.replace(/^```json/, '').replace(/```$/, '').trim();

    try {
        const parsed = JSON.parse(cleanedText);
        if (!parsed.landing || !parsed.quiz) throw new Error("Incomplete funnel mapping generated.");
        return parsed;
    } catch (parseError) {
        console.error("[Gemini] Parse failure on output:", cleanedText);
        throw new Error("AI logic generated an invalid structure. Please retry.");
    }
  } catch (error: any) {
    console.error("Migration Critical Failure:", error);
    throw error;
  }
};

export const findPotentialBuyers = async (niche: string, location: string, radius: number, query?: string): Promise<any[]> => {
  try {
    const model = 'gemini-2.5-flash-lite'; // Updated to cost-effective 2026 model
    const prompt = `Find verified businesses in "${niche}" within ${radius} miles of "${location}". ${query ? `Target criteria: ${query}` : ''}. Return a JSON array of objects with: businessName, category, location, phone, website, and rating. IMPORTANT: Your entire response must be only the raw JSON array, with no surrounding text or markdown.`;

    const { data, error } = await supabase.functions.invoke('get-gemini-api-key', {
      body: { 
        model, 
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ "google_search": {} }],
      },
    });

    if (error) {
      console.error('Supabase function invocation error:', error);
      throw error;
    }

    if (!data) {
        console.warn("No data returned from Supabase function.");
        return [];
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      console.warn('Gemini returned no text in the response part.');
      return [];
    }

    const match = textResponse.match(/(\[.*\])/s);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse extracted JSON:", e);
      }
    }

    try {
        return JSON.parse(textResponse);
    } catch(e) {
        console.error("Failed to parse the entire textResponse as JSON:", e);
        console.error("Raw response was:", textResponse);
    }

    return [];

  } catch (error: any) {
    console.error('Error finding potential buyers:', error.message);
    return [];
  }
};
