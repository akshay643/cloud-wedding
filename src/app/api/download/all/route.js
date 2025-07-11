import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { listFiles, storage, bucketName } from '@/lib/gcs';
import archiver from 'archiver';

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

    // Get all media files
    const files = await listFiles();

    // Filter for media files only
    const mediaFiles = files.filter(file => {
      const isMedia = file.contentType && (
        file.contentType.startsWith('image/') ||
        file.contentType.startsWith('video/')
      );
      return isMedia;
    });

    if (mediaFiles.length === 0) {
      return NextResponse.json(
        { message: 'No files found' },
        { status: 404 }
      );
    }

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set up the response as a stream
    const chunks = [];

    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Add files to the archive from GCS directly
    const bucket = storage.bucket(bucketName);

    for (const file of mediaFiles) {
      try {
        console.log(`Adding file to archive: ${file.name}`);

        // Get file from GCS bucket directly
        const gcsFile = bucket.file(file.name);
        const [fileBuffer] = await gcsFile.download();

        // Add file to archive with a clean filename
        const cleanName = file.name.split('/').pop() || file.name;
        archive.append(fileBuffer, { name: cleanName });

      } catch (error) {
        console.error(`Error adding file ${file.name} to archive:`, error);
      }
    }

    // Finalize the archive
    await new Promise((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    // Combine all chunks
    const zipBuffer = Buffer.concat(chunks);

    // Return the zip file
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="wedding-gallery-${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { message: 'Failed to create download archive', error: error.message },
      { status: 500 }
    );
  }
}
