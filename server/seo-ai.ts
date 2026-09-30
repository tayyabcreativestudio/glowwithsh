import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

export type SeoSuggestion = { title: string; description: string; focusKeyword: string; suggestions: string[] };
const cache = new Map<string, { expiresAt: number; value: SeoSuggestion }>();
const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

export async function generateSeoSuggestion(input: { name: string; description: string; currentTitle?: string; currentDescription?: string; category?: string }): Promise<SeoSuggestion> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('Gemini SEO assistant is not configured. Add GEMINI_API_KEY in your hosting environment.');
  const compactInput = JSON.stringify({ name: clean(input.name, 140), category: clean(input.category, 80), description: clean(input.description, 1800), currentTitle: clean(input.currentTitle, 90), currentDescription: clean(input.currentDescription, 350) });
  const cacheKey = crypto.createHash('sha256').update(compactInput).digest('hex');
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: process.env.GEMINI_SEO_MODEL?.trim() || 'gemini-2.5-flash-lite',
    contents: compactInput,
    config: {
      systemInstruction: 'You are a careful ecommerce on-page SEO editor for GlowWithSH, an Indian skincare brand. Suggest factual wording only from supplied information. Do not invent ingredients, clinical results, certifications, prices, or rankings. Avoid medical promises and keyword stuffing. Return compact JSON only with title (50-65 characters), description (140-160 characters), focusKeyword, and up to 3 short suggestions.',
      responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 300,
    },
  });
  let parsed: any;
  try { parsed = JSON.parse(response.text || '{}'); } catch { throw new Error('Gemini returned an invalid SEO suggestion. Please try again.'); }
  const value: SeoSuggestion = { title: clean(parsed.title, 70), description: clean(parsed.description, 170), focusKeyword: clean(parsed.focusKeyword, 80), suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map((item: unknown) => clean(item, 160)).filter(Boolean).slice(0, 3) : [] };
  if (!value.title || !value.description) throw new Error('Gemini returned an incomplete SEO suggestion. Please try again.');
  cache.set(cacheKey, { value, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return value;
}
