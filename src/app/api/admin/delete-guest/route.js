import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getGuestsFromGCS, saveGuestToGCS, listFiles, deleteFile } from '@/lib/gcs';

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

    const { guestId } = await request.json();

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Get all guests
    const guests = await getGuestsFromGCS();
    const guestIndex = guests.findIndex(guest => guest.id === guestId);

    if (guestIndex === -1) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    const guest = guests[guestIndex];

    // Delete all files uploaded by this guest
    try {
      const files = await listFiles();
      const guestFiles = files.filter(file => {
        const metadata = file.metadata || {};
        return metadata.uploadedById === guestId;
      });

      // Delete each file
      for (const file of guestFiles) {
        try {
          await deleteFile(file.name);
        } catch (error) {
          console.warn(`Failed to delete file ${file.name}:`, error);
        }
      }
    } catch (error) {
      console.warn('Error deleting guest files:', error);
    }

    // Remove guest from the list
    guests.splice(guestIndex, 1);

    // Save updated guest list
    await saveGuestToGCS(guests);

    return NextResponse.json({
      success: true,
      message: `Guest ${guest.name} and all associated data deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting guest:', error);
    return NextResponse.json(
      { error: 'Failed to delete guest' },
      { status: 500 }
    );
  }
}
