import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { saveGuestToGCS, getGuestsFromGCS } from '@/lib/gcs';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { guestName, passcode, selfiePhoto } = await request.json();

    if (!guestName || !passcode || !selfiePhoto) {
      return NextResponse.json({
        error: 'Name, passcode, and selfie are required'
      }, { status: 400 });
    }

    // Verify passcode against environment variable
    const correctPasscode = process.env.WEDDING_PASSCODE;
    if (!correctPasscode) {
      return NextResponse.json({
        error: 'Wedding passcode not configured'
      }, { status: 500 });
    }

    // Check if passcode matches
    if (passcode !== correctPasscode) {
      return NextResponse.json({
        error: 'Invalid wedding passcode'
      }, { status: 401 });
    }

    // Get existing guests to check for duplicates
    const existingGuests = await getGuestsFromGCS();
    const existingGuest = existingGuests.find(
      guest => guest.name.toLowerCase() === guestName.toLowerCase()
    );

    let guestId;
    if (existingGuest) {
      // Update existing guest's selfie and last login
      guestId = existingGuest.id;
      existingGuest.selfiePhoto = selfiePhoto;
      existingGuest.lastLogin = new Date().toISOString();
      await saveGuestToGCS(existingGuests);
    } else {
      // Create new guest
      guestId = Date.now().toString();
      const newGuest = {
        id: guestId,
        name: guestName,
        selfiePhoto: selfiePhoto,
        joinedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        uploadsCount: 0,
        wishesCount: 0
      };

      existingGuests.push(newGuest);
      await saveGuestToGCS(existingGuests);
    }

    // Create JWT token
    const token = signToken({
      guestId: guestId,
      guestName: guestName,
      type: 'guest'
    });

    // Create response and set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Welcome to the wedding!',
      guest: {
        id: guestId,
        name: guestName,
        type: 'guest'
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Guest login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}
