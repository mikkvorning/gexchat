import { NextResponse } from 'next/server';

export const POST = async () => {
  try {
    // Create response
    const response = NextResponse.json({ success: true });

    // Clear session cookies
    response.cookies.delete('session');
    response.cookies.delete('emailVerified');

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
};
