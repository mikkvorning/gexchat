import axios from 'axios';

export interface AuthRequest {
  email: string;
  password: string;
  isSignup: boolean;
  nickname?: string;
}

interface AuthResponse {
  success: boolean;
  user: {
    uid: string;
    email: string;
    emailVerified: boolean;
    displayName: string;
  };
}

interface SessionVerificationResponse {
  success: boolean;
  user: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
}

interface AuthError extends Error {
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
      const authError = new Error(
        error.response.data.message || 'Authentication failed'
      ) as AuthError;

      // Preserve Firebase error code for getErrorMessage translation
      authError.code = error.response.data.error;

      throw authError;
    }
    throw error;
  }
);

export const authService = {
  authenticate: async (authRequest: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', authRequest);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  verifySession: async (): Promise<SessionVerificationResponse> => {
    const response = await api.get('/auth/verify-session');
    return response.data;
  },

  resendVerification: async (): Promise<SessionVerificationResponse> => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },
};
