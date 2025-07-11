import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
  },
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;

if (!bucketName) {
  throw new Error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set');
}

const bucket = storage.bucket(bucketName);

// Export storage and bucketName for other modules
export { storage, bucketName };

export const uploadFile = async (file, fileName, metadata = {}) => {
  try {
    console.log(`Uploading file: ${fileName} to bucket: ${bucketName}`);
    console.log('Metadata to store:', metadata);

    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
        }
      },
      resumable: false, // Use simple upload for smaller files
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          // Generate public URL (works with uniform bucket-level access)
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
          console.log(`File uploaded successfully: ${publicUrl}`);
          resolve(publicUrl);
        } catch (error) {
          console.error('Error generating URL:', error);
          reject(error);
        }
      });

      // Write the buffer to the stream
      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (fileName) => {
  try {
    await bucket.file(fileName).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const listFiles = async () => {
  try {
    const [files] = await bucket.getFiles();
    return files.map(file => ({
      name: file.name,
      url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${file.name}`,
      created: file.metadata.timeCreated,
      timeCreated: file.metadata.timeCreated,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      metadata: file.metadata.metadata || {}, // Include custom metadata
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

// Wishes management functions
export const saveWishesToGCS = async (wishes) => {
  try {
    const wishesFile = bucket.file('wedding-wishes/wishes.json');
    const stream = wishesFile.createWriteStream({
      metadata: {
        contentType: 'application/json',
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        console.log('Wishes saved successfully');
        resolve();
      });
      stream.end(JSON.stringify(wishes, null, 2));
    });
  } catch (error) {
    console.error('Error saving wishes:', error);
    throw error;
  }
};

export const getWishesFromGCS = async () => {
  try {
    const wishesFile = bucket.file('wedding-wishes/wishes.json');
    const [exists] = await wishesFile.exists();

    if (!exists) {
      return [];
    }

    const [contents] = await wishesFile.download();
    return JSON.parse(contents.toString());
  } catch (error) {
    console.error('Error getting wishes:', error);
    if (error.code === 404) {
      return [];
    }
    throw error;
  }
};

// Guest management functions
export const saveGuestToGCS = async (guests) => {
  try {
    const guestsFile = bucket.file('wedding-guests/guests.json');
    const stream = guestsFile.createWriteStream({
      metadata: {
        contentType: 'application/json',
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        console.log('Guests saved successfully');
        resolve();
      });
      stream.end(JSON.stringify(guests, null, 2));
    });
  } catch (error) {
    console.error('Error saving guests:', error);
    throw error;
  }
};

export const getGuestsFromGCS = async () => {
  try {
    const guestsFile = bucket.file('wedding-guests/guests.json');
    const [exists] = await guestsFile.exists();

    if (!exists) {
      return [];
    }

    const [contents] = await guestsFile.download();
    return JSON.parse(contents.toString());
  } catch (error) {
    console.error('Error getting guests:', error);
    if (error.code === 404) {
      return [];
    }
    throw error;
  }
};

export const updateGuestStats = async (guestId, type) => {
  try {
    const guests = await getGuestsFromGCS();
    const guestIndex = guests.findIndex(guest => guest.id === guestId);

    if (guestIndex !== -1) {
      if (type === 'upload') {
        guests[guestIndex].uploadsCount = (guests[guestIndex].uploadsCount || 0) + 1;
      } else if (type === 'wish') {
        guests[guestIndex].wishesCount = (guests[guestIndex].wishesCount || 0) + 1;
      }
      guests[guestIndex].lastActivity = new Date().toISOString();

      await saveGuestToGCS(guests);
    }
  } catch (error) {
    console.error('Error updating guest stats:', error);
    // Don't throw error to avoid breaking main functionality
  }
};

// Generate signed URL for private files (if needed)
export const getSignedUrl = async (fileName, action = 'read', expires = Date.now() + 15 * 60 * 1000) => {
  try {
    const file = bucket.file(fileName);
    const [url] = await file.getSignedUrl({
      action: action,
      expires: expires,
    });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// Get accurate count of photos/videos for all guests
export const getGuestMediaCounts = async () => {
  try {
    const files = await listFiles();
    const guestCounts = {};

    files.forEach(file => {
      // Only count image and video files
      const isMedia = file.contentType && (
        file.contentType.startsWith('image/') ||
        file.contentType.startsWith('video/')
      );

      if (isMedia) {
        const metadata = file.metadata || {};
        const guestId = metadata.uploadedById;
        
        // Count by guest ID if available
        if (guestId) {
          guestCounts[guestId] = (guestCounts[guestId] || 0) + 1;
        } else {
          // Fallback: try to extract guest info from filename pattern
          const fileNameParts = file.name.split('-');
          if (fileNameParts.length >= 3) {
            const extractedGuestId = fileNameParts[1];
            if (extractedGuestId) {
              guestCounts[extractedGuestId] = (guestCounts[extractedGuestId] || 0) + 1;
            }
          }
        }
      }
    });

    return guestCounts;
  } catch (error) {
    console.error('Error getting guest media counts:', error);
    return {};
  }
};
