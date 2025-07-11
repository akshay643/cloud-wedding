import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getWishesFromGCS, saveWishesToGCS, updateGuestStats } from '@/lib/gcs';

// GET - Retrieve all wishes
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

    // Get wishes from GCS
    const wishes = await getWishesFromGCS();

    return NextResponse.json({
      success: true,
      wishes: wishes
    });

  } catch (error) {
    console.error('Error retrieving wishes:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve wishes' },
      { status: 500 }
    );
  }
}

// POST - Add a new wish
export async function POST(request) {
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

    // Get the wish data from request
    const { name, message } = await request.json();

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    // Get existing wishes
    const existingWishes = await getWishesFromGCS();

    // Create new wish
    const newWish = {
      id: Date.now().toString(),
      name: name.trim(),
      message: message.trim(),
      submittedBy: decoded.type === 'guest' ? decoded.guestName : decoded.username,
      submittedById: decoded.type === 'guest' ? decoded.guestId : decoded.userId,
      submittedByType: decoded.type || 'admin',
      submittedAt: new Date().toISOString()
    };

    // Add to existing wishes
    const updatedWishes = [...existingWishes, newWish];

    // Save back to GCS
    await saveWishesToGCS(updatedWishes);

    // Update guest statistics if it's a guest wish
    if (decoded.type === 'guest') {
      try {
        await updateGuestStats(decoded.guestId, 'wish');
      } catch (error) {
        console.warn('Failed to update guest stats:', error);
      }
    }

    return NextResponse.json({
      success: true,
      wish: newWish,
      message: 'Wish submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting wish:', error);
    return NextResponse.json(
      { error: 'Failed to submit wish' },
      { status: 500 }
    );
  }
}
