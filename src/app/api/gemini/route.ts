import { GoogleGenAI, ApiError } from '@google/genai';
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/apiUtils';

export const POST = async (req: NextRequest) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return handleApiError(
      {
        code: 'GEMINI_API_KEY_MISSING',
        message: 'Gemini API key is missing.',
      },
      500
    );
  }

  const { prompt } = await req.json();

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // result.text is a getter that returns the concatenated text from the first candidate
    return createApiResponse({ text: result.text });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return handleApiError(
        {
          code: error.message,
          message: error.message,
        },
        error.status
      );
    }
    return handleApiError(error);
  }
};
