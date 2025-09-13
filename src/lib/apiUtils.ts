/**
 * Utility functions for consistent API error handling and response formatting
 * in Next.js API routes. Ensures proper preservation of Firebase error codes
 * for client-side error message translation.
 */

import { NextResponse } from 'next/server';
import { FirebaseError } from 'firebase/app';

/**
 * Interface for standardized API error structure
 */
export interface ApiError {
  code?: string;
  message?: string;
}

/**
 * Handles API errors by preserving the original error information.
 * Simply passes through the error code and message so they can be
 * properly handled by client-side error translation.
 *
 * @param error - The error to handle
 * @param statusCode - HTTP status code to return (defaults to 500)
 * @returns NextResponse with preserved error information
 */
export const handleApiError = (error: unknown, statusCode: number = 500) => {
  console.error('API error:', error);

  // Check error type once to avoid repetition
  const isFirebaseError = error instanceof FirebaseError;
  const fallbackError = error as ApiError;

  // Preserve the original error information
  const apiError: ApiError = {
    code: isFirebaseError
      ? error.code
      : fallbackError?.code || 'Internal server error',
    message: isFirebaseError
      ? error.message
      : fallbackError?.message || 'An error occurred',
  };

  return NextResponse.json(
    {
      error: apiError.code,
      message: apiError.message,
    },
    { status: statusCode }
  );
};
/**
 * Convenience wrapper for authentication-related errors.
 * Returns a 401 Unauthorized status code.
 *
 * @param error - The authentication error to handle
 * @returns NextResponse with 401 status and standardized error format
 */
export const handleAuthError = (error: unknown) => {
  return handleApiError(error, 401);
};

/**
 * Creates a standardized successful API response.
 *
 * @param data - The response data to return
 * @param statusCode - HTTP status code (defaults to 200)
 * @returns NextResponse with the provided data and status code
 */
export const createApiResponse = <T>(data: T, statusCode: number = 200) => {
  return NextResponse.json(data, { status: statusCode });
};
