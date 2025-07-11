import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { uploadFile, updateGuestStats } from '@/lib/gcs';

// Configure the route for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large uploads

export async function POST(request) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const files = formData.getAll('files'); // Get all files

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate file sizes
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    const maxVideoSize = 200 * 1024 * 1024; // 200MB for videos

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        return NextResponse.json({ error: 'Only image and video files are allowed' }, { status: 400 });
      }

      const maxSize = isImage ? maxImageSize : maxVideoSize;
      if (file.size > maxSize) {
        const sizeLimit = isImage ? '10MB' : '200MB';
        const fileType = isImage ? 'Image' : 'Video';
        return NextResponse.json({
          error: `${fileType} file "${file.name}" exceeds the ${sizeLimit} size limit`
        }, { status: 400 });
      }
    }

    // Upload all files
    const uploaderName = decoded.type === 'guest' ? decoded.guestName : decoded.username;

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${randomSuffix}-${originalName}`;

        // Create file object for upload
        const fileObject = {
          buffer,
          originalName: file.name,
          type: file.type || 'application/octet-stream'
        };

        // Prepare metadata for GCS
        const fileMetadata = {
          uploadedBy: uploaderName,
          uploadedById: decoded.type === 'guest' ? decoded.guestId : decoded.userId,
          uploadedByType: decoded.type || 'admin',
          originalName: file.name
        };

        // Upload to Google Cloud Storage
        const publicUrl = await uploadFile(fileObject, fileName, fileMetadata);

        return {
          fileName: fileName,
          originalName: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size,
          uploadedBy: uploaderName,
          uploadedById: decoded.type === 'guest' ? decoded.guestId : decoded.userId,
          uploadedByType: decoded.type || 'admin',
          uploadedAt: new Date().toISOString()
        };
      })
    );

    // Update guest statistics if it's a guest upload
    if (decoded.type === 'guest') {
      try {
        await updateGuestStats(decoded.guestId, 'upload');
      } catch (error) {
        console.warn('Failed to update guest stats:', error);
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadResults,
      uploadedBy: uploaderName,
      uploadedAt: new Date().toISOString(),
      message: `Successfully uploaded ${uploadResults.length} file(s)`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
