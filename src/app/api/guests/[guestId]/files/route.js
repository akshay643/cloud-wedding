import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllFilesFromGCS } from '@/lib/gcs';

export async function GET(request, { params }) {
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

    const { guestId } = params;

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Get all files from GCS
    const allFiles = await getAllFilesFromGCS();

    // Filter files by the specific guest and only include photos/videos
    const guestFiles = allFiles.filter(file => {
      // Only include image and video files
      const isMedia = file.contentType && (
        file.contentType.startsWith('image/') ||
        file.contentType.startsWith('video/')
      );

      if (!isMedia) return false;

      // Check if the file metadata contains uploader information
      const metadata = file.metadata || {};
      return metadata.uploadedById === guestId ||
             (file.name && file.name.includes(guestId));
    });

    // Transform files to include display information
    const processedFiles = guestFiles.map(file => {
      const isVideo = file.contentType?.startsWith('video/') ||
                     file.name?.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i);

      return {
        name: file.name,
        publicUrl: `https://storage.googleapis.com/${file.bucket.name}/${file.name}`,
        isVideo: isVideo,
        contentType: file.contentType,
        size: file.metadata?.size,
        uploaded: file.timeCreated,
        uploadedBy: metadata.uploadedBy || 'Unknown',
        uploadedById: metadata.uploadedById || null,
        uploadedByType: metadata.uploadedByType || 'guest'
      };
    });

    return NextResponse.json({
      success: true,
      files: processedFiles,
      count: processedFiles.length
    });

  } catch (error) {
    console.error('Error retrieving guest files:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve guest files' },
      { status: 500 }
    );
  }
}
