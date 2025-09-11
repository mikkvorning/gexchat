import axios from 'axios';

interface GeminiError extends Error {
  code?: string;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.data) {
      const geminiError = new Error(
        error.response.data.error || 'Failed to fetch Gemini response'
      ) as GeminiError;
      // Add code property for consistency with error handling pattern
      geminiError.code = error.response.data.code || 'gemini-error';
      throw geminiError;
    }
    throw error;
  }
);

export const generateGeminiText = async (prompt: string): Promise<string> => {
  // Frontend validation
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required');
  }

  if (prompt.trim().length > 2000) {
    throw new Error('Prompt is too long. Maximum 2000 characters allowed.');
  }

  const response = await api.post('/gemini', { prompt });
  return response.data.text;
};
