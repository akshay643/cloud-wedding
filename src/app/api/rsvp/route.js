import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const RSVP_FILE_PATH = path.join(process.cwd(), 'data', 'rsvp.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read existing RSVP data
async function readRSVPData() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(RSVP_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Write RSVP data
async function writeRSVPData(data) {
  await ensureDataDirectory();
  await fs.writeFile(RSVP_FILE_PATH, JSON.stringify(data, null, 2));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { guestName, email, phone, rsvpStatus, additionalGuests, message } = body;

    // Validate required fields
    if (!guestName || !rsvpStatus) {
      return NextResponse.json(
        { error: 'Guest name and RSVP status are required' },
        { status: 400 }
      );
    }

    // Read existing data
    const existingData = await readRSVPData();

    // Create new RSVP entry
    const newRSVP = {
      id: Date.now().toString(),
      guestName,
      email: email || '',
      phone: phone || '',
      rsvpStatus,
      additionalGuests: additionalGuests || [],
      message: message || '',
      submittedAt: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    };

    // Check if guest already exists (update instead of duplicate)
    const existingIndex = existingData.findIndex(
      (entry) => entry.guestName.toLowerCase() === guestName.toLowerCase()
    );

    if (existingIndex !== -1) {
      // Update existing entry
      existingData[existingIndex] = { ...existingData[existingIndex], ...newRSVP };
    } else {
      // Add new entry
      existingData.push(newRSVP);
    }

    // Write updated data
    await writeRSVPData(existingData);

    return NextResponse.json({
      success: true,
      message: 'RSVP submitted successfully',
      rsvp: newRSVP
    });

  } catch (error) {
    console.error('RSVP submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit RSVP' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // This endpoint should be protected - only accessible to admins
    // You can add authentication logic here

    const data = await readRSVPData();

    return NextResponse.json({
      success: true,
      rsvps: data,
      totalCount: data.length,
      yesCount: data.filter(r => r.rsvpStatus === 'yes').length,
      noCount: data.filter(r => r.rsvpStatus === 'no').length,
      maybeCount: data.filter(r => r.rsvpStatus === 'maybe').length
    });

  } catch (error) {
    console.error('RSVP fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSVP data' },
      { status: 500 }
    );
  }
}
