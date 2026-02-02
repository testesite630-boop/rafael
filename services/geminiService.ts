import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Delivery } from "../types";

const sanitizeJsonResponse = (text: string) => {
  if (!text) return "";
  let clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const startIdx = Math.max(clean.indexOf('['), clean.indexOf('{'));
  const endIdx = Math.max(clean.lastIndexOf(']'), clean.lastIndexOf('}'));
  if (startIdx !== -1 && endIdx !== -1) {
    clean = clean.substring(startIdx, endIdx + 1);
  }
  return clean;
};

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const extractAddressesFromImages = async (base64Images: string[]): Promise<string[]> => {
  if (base64Images.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts = base64Images.map(img => ({
    inlineData: {
      mimeType: getMimeType(img),
      data: img.includes('base64,') ? img.split(',')[1] : img
    }
  }));

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          ...parts,
          { text: "Extraia todos os endereços de entrega destas imagens de recibos/etiquetas. Ignore nomes e foque apenas no endereço completo (Rua, Número, Bairro, Cidade). Retorne um array JSON de strings." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const sanitized = sanitizeJsonResponse(response.text || "[]");
    return JSON.parse(sanitized);
  } catch (e: any) {
    console.error("Erro no OCR Gemini:", e);
    return [];
  }
};

export interface OptimizationResult {
  orderedIds: string[];
  estimatedTimeSaved: string;
  insights: string;
}

export const optimizeRoute = async (deliveries: Delivery[], startLocation?: { lat: number; lng: number }): Promise<OptimizationResult> => {
  const fallback: OptimizationResult = { 
    orderedIds: deliveries.map(d => d.id), 
    estimatedTimeSaved: "0 min", 
    insights: "Não foi possível otimizar no momento." 
  };
  
  if (deliveries.length <= 1) return fallback;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const context = deliveries.map(d => ({
    id: d.id,
    coleta: d.pickupAddress || 'Não informada',
    entrega: d.address,
    status: d.status
  }));

  const startLocationPrompt = startLocation
    ? `O ponto de partida OBRIGATÓRIO é a localização atual do motoboy: latitude ${startLocation.lat}, longitude ${startLocation.lng}. A primeira parada da rota otimizada deve ser o ponto mais próximo e eficiente a partir desta localização.`
    : '';

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Você é um especialista em logística e otimização de rotas (problema do caixeiro viajante com restrições) para motoboys no Brasil. Sua única e principal tarefa é reordenar os IDs para criar a rota com a MENOR DISTÂNCIA TOTAL POSSÍVEL em quilômetros. ${startLocationPrompt} Regras Obrigatórias: 1. Para cada entrega, a 'coleta' DEVE ocorrer ANTES da 'entrega'. 2. Status 'PICKED_UP': ponto de 'coleta' já visitado, ignorar. A rota só precisa incluir a 'entrega'. 3. Status 'IN_ROUTE' ou 'PENDING': a rota deve incluir AMBAS as paradas, 'coleta' e 'entrega', na ordem correta. Analise todos os pontos de parada e retorne a sequência de IDs que resulta no percurso mais curto. Contexto: ${JSON.stringify(context)}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2, // Torna a resposta mais determinística e focada.
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            orderedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedTimeSaved: { type: Type.STRING },
            insights: { type: Type.STRING }
          },
          required: ["orderedIds", "estimatedTimeSaved", "insights"]
        },
        thinkingConfig: { thinkingBudget: 1500 }
      }
    });

    const sanitized = sanitizeJsonResponse(response.text || "{}");
    return JSON.parse(sanitized);
  } catch (e: any) {
    console.error("Erro na otimização Gemini Pro:", e);
    return fallback;
  }
};