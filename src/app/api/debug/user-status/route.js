import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'No token found', user: null },
        { status: 200 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token', user: null },
        { status: 200 }
      );
    }

    const user = decoded.type === 'guest'
      ? { id: decoded.guestId, username: decoded.guestName, type: 'guest' }
      : { id: decoded.userId, username: decoded.username, type: 'admin' };

    return NextResponse.json({
      message: 'Current user status',
      user,
      token: decoded,
      canAccessAdmin: user.type !== 'guest'
    });
  } catch (error) {
    console.error('User status error:', error);
    return NextResponse.json(
      { message: 'Error checking user status', error: error.message },
      { status: 500 }
    );
  }
}
