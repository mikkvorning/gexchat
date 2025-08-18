import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    'Gemini API key is missing. Set NEXT_PUBLIC_GEMINI_API_KEY in your .env file.'
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

export const generateGeminiText = async (prompt: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};
