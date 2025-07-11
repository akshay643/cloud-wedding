import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getGuestsFromGCS, getGuestMediaCounts } from '@/lib/gcs';

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

    // Get guests from GCS and actual media counts
    const guests = await getGuestsFromGCS();
    const mediaCounts = await getGuestMediaCounts();

    // Return guest list with accurate photo/video counts
    const publicGuestList = guests.map(guest => ({
      id: guest.id,
      name: guest.name,
      selfiePhoto: guest.selfiePhoto,
      joinedAt: guest.joinedAt,
      uploadsCount: mediaCounts[guest.id] || 0, // Use actual media count
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
