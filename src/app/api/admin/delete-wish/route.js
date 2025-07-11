import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getWishesFromGCS, saveWishesToGCS } from '@/lib/gcs';

export async function DELETE(request) {
  try {
    // Verify authentication and admin access
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

    // Check if user is admin (not a guest)
    if (decoded.type === 'guest') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { wishId } = await request.json();

    if (wishId === undefined || wishId === null) {
      return NextResponse.json(
        { error: 'Wish ID is required' },
        { status: 400 }
      );
    }

    // Get all wishes
    const wishes = await getWishesFromGCS();

    if (wishId >= wishes.length || wishId < 0) {
      return NextResponse.json(
        { error: 'Wish not found' },
        { status: 404 }
      );
    }

    const deletedWish = wishes[wishId];

    // Remove wish from the list
    wishes.splice(wishId, 1);

    // Save updated wishes list
    await saveWishesToGCS(wishes);

    return NextResponse.json({
      success: true,
      message: `Wish by ${deletedWish.guestName} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting wish:', error);
    return NextResponse.json(
      { error: 'Failed to delete wish' },
      { status: 500 }
    );
  }
}
