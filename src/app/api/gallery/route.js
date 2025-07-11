import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { listFiles, getSignedUrl } from '@/lib/gcs';

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

    // Check for guest filter in query params
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');

    // Get all files from the wedding-gallery folder
    const files = await listFiles();

    // Filter and sort files
    const galleryFiles = await Promise.all(
      files
        .filter(file => {
          // Only include image and video files
          const isMedia = file.contentType && (
            file.contentType.startsWith('image/') ||
            file.contentType.startsWith('video/')
          );

          // If guestId filter is provided, filter by metadata or filename
          if (guestId && isMedia) {
            const metadata = file.metadata || {};
            const uploadedById = metadata.uploadedById;
            const uploadedBy = metadata.uploadedBy;

            // Check metadata first (for new files)
            if (uploadedById === guestId ||
                (uploadedBy && uploadedBy.toLowerCase().includes(guestId.toLowerCase()))) {
              return true;
            }

            // Fallback to filename pattern matching (for old files)
            const fileName = file.name.toLowerCase();
            return fileName.includes(guestId.toLowerCase());
          }

          return isMedia;
        })
        .map(async (file) => {
          // Try to use public URL, fallback to signed URL if needed
          let imageUrl = file.publicUrl;
          try {
            // Test if public URL works, if not generate signed URL
            const response = await fetch(file.publicUrl, { method: 'HEAD' });
            if (!response.ok) {
              imageUrl = await getSignedUrl(file.name, 'read', Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            }
          } catch (error) {
            // If public URL fails, use signed URL
            imageUrl = await getSignedUrl(file.name, 'read', Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          }

          // Extract metadata if available
          const metadata = file.metadata || {};
          let uploadedBy = metadata.uploadedBy;
          let uploadedById = metadata.uploadedById;
          const uploadedByType = metadata.uploadedByType || 'unknown';

          // Fallback for files without metadata (try to extract from filename)
          if (!uploadedBy || uploadedBy === 'unknown') {
            // Try to extract guest info from filename pattern
            const fileNameParts = file.name.split('-');
            if (fileNameParts.length >= 3) {
              // Look for guest info in the filename
              uploadedBy = fileNameParts.slice(2).join('-').replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
            } else {
              uploadedBy = 'Guest';
            }
          }

          console.log(`File: ${file.name}, metadata:`, metadata, 'uploadedBy:', uploadedBy);

          return {
            name: file.name,
            publicUrl: imageUrl,
            size: parseInt(file.size),
            contentType: file.contentType,
            timeCreated: file.timeCreated,
            uploadedBy,
            uploadedById,
            uploadedByType,
            isImage: file.contentType.startsWith('image/'),
            isVideo: file.contentType.startsWith('video/'),
          };
        })
    );

    galleryFiles.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated)); // Sort by newest first

    return NextResponse.json(
      {
        files: galleryFiles,
        totalCount: galleryFiles.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}
