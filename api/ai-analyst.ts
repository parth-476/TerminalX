import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

  try {
    const { prompt, context } = req.body ?? {};
    if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'prompt is required' });

    const ai = new GoogleGenAI({ apiKey });
    const system = `You are the AI analyst inside an intelligent freight forecasting and vessel chartering terminal for SIH26006. Give concise, decision-oriented analysis. Never claim that prototype data is live or that a prediction is guaranteed. Explain the main drivers, uncertainty, and recommended next action. Context: ${JSON.stringify(context ?? {})}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `${system}\n\nUSER QUERY:\n${prompt}` });
    return res.status(200).json({ answer: response.text ?? 'No model response.' });
  } catch (error) {
    console.error('AI analyst error', error);
    return res.status(500).json({ error: 'AI analyst request failed' });
  }
}
