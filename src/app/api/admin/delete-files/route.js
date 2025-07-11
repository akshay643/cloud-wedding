import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { deleteFile } from '@/lib/gcs';

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

    const { fileNames } = await request.json();

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: 'File names array is required' },
        { status: 400 }
      );
    }

    // Delete files in parallel for better performance
    const deletePromises = fileNames.map(async (fileName) => {
      try {
        await deleteFile(fileName);
        return { fileName, success: true };
      } catch (error) {
        console.error(`Error deleting file ${fileName}:`, error);
        return { fileName, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(deletePromises);
    
    // Process results
    const successes = [];
    const failures = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successes.push(result.value.fileName);
        } else {
          failures.push({
            fileName: result.value.fileName,
            error: result.value.error
          });
        }
      } else {
        failures.push({
          fileName: fileNames[index],
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${successes.length} file(s)`,
      deleted: successes,
      failed: failures,
      summary: {
        total: fileNames.length,
        successful: successes.length,
        failed: failures.length
      }
    });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
