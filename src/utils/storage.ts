// Simple sessionStorage utilities for email verification
// sessionStorage clears when tab closes, providing good security

const STORAGE_KEY = 'pendingVerificationEmail';

interface VerificationData {
  email: string;
  timestamp: number;
}

export const saveVerificationEmail = (email: string): void => {
  const data: VerificationData = {
    email,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (incognito mode, storage full, etc.)
    console.warn('Failed to save verification email to sessionStorage');
  }
};

export const getVerificationEmail = (): VerificationData | null => {
  try {
    const storedData = sessionStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;

    const data: VerificationData = JSON.parse(storedData);

    // Check if data is expired (15 minutes)
    const fifteenMinutesInMs = 15 * 60 * 1000;
    const isExpired = Date.now() - data.timestamp > fifteenMinutesInMs;

    if (isExpired) {
      clearVerificationEmail();
      return null;
    }

    return data;
  } catch {
    // If parsing fails or data is invalid, clean up
    clearVerificationEmail();
    return null;
  }
};

export const clearVerificationEmail = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};

// Optional: Check if verification data exists
export const hasVerificationEmail = (): boolean => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};
