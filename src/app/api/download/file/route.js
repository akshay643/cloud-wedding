import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { storage, bucketName } from '@/lib/gcs';

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get filename from query parameters
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json(
        { message: 'File parameter is required' },
        { status: 400 }
      );
    }

    // Get file from GCS
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      );
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();
    
    // Download file buffer
    const [fileBuffer] = await file.download();

    // Determine content type
    const contentType = metadata.contentType || 'application/octet-stream';
    
    // Create clean filename for download
    const cleanFileName = fileName.split('/').pop() || 'download';
    
    // Return file with proper download headers
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { message: 'Failed to download file', error: error.message },
      { status: 500 }
    );
  }
}
