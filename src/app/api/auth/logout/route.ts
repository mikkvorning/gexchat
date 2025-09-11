import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';

export const POST = async () => {
  try {
    // Create response
    const response = NextResponse.json({ success: true });

    // Clear session cookies
    response.cookies.delete('session');
    response.cookies.delete('emailVerified');

    return response;
  } catch (error) {
    return handleApiError(error);
  }
};
