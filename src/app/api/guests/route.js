import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getGuestsFromGCS } from '@/lib/gcs';

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get guests from GCS
    const guests = await getGuestsFromGCS();

    // Return guest list with public info only (no sensitive data)
    const publicGuestList = guests.map(guest => ({
      id: guest.id,
      name: guest.name,
      selfiePhoto: guest.selfiePhoto,
      joinedAt: guest.joinedAt,
      uploadsCount: guest.uploadsCount || 0,
      wishesCount: guest.wishesCount || 0,
      lastActivity: guest.lastActivity || guest.lastLogin
    }));

    return NextResponse.json({
      success: true,
      guests: publicGuestList
    });

  } catch (error) {
    console.error('Error retrieving guests:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve guest list' },
      { status: 500 }
    );
  }
}
