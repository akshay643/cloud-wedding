import { NextResponse } from 'next/server';
import { listFiles } from '@/lib/gcs';

export async function GET() {
  try {
    const files = await listFiles();

    // Return detailed file info for debugging
    const debugInfo = files.map(file => ({
      name: file.name,
      contentType: file.contentType,
      size: file.size,
      timeCreated: file.timeCreated,
      metadata: file.metadata,
      hasMetadata: !!file.metadata && Object.keys(file.metadata).length > 0
    }));

    return NextResponse.json({
      totalFiles: files.length,
      files: debugInfo
    });
  } catch (error) {
    console.error('Debug files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
}
