# Wedding Gallery Project - Setup Guide

## Overview
This is a Next.js wedding gallery application that uses Google Cloud Storage for storing images, videos, and wishes. It features a beautiful UI with authentication and file upload capabilities.

## Features
- ✨ Beautiful wedding-themed UI with floating hearts animation
- 🔐 JWT-based authentication system
- 📸 Image and video upload to Google Cloud Storage
- 🎥 Gallery view with modal preview
- 💌 Wedding wishes system
- 📱 Responsive design
- ⬬ Download functionality

## Prerequisites
1. Node.js (v18 or higher)
2. Google Cloud Storage bucket
3. Google Cloud Service Account with Storage permissions

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Google Cloud Storage Setup

#### Option A: Using Service Account Key File (Recommended for Local Development)
1. Create a Google Cloud Storage bucket
2. Create a service account with Storage Object Admin permissions
3. Download the service account key JSON file
4. Place it in your project root (don't commit to git!)

#### Option B: Using Environment Variables (Recommended for Production)
1. Extract the credentials from your service account key file
2. Set them as environment variables

### 3. Environment Configuration
Create a `.env.local` file in the project root:

```env
# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name

# Option A: Using service account key file
GOOGLE_APPLICATION_CREDENTIALS=./path-to-your-service-account-key.json

# Option B: Using environment variables (for production)
# GOOGLE_CLOUD_PRIVATE_KEY_ID=your-private-key-id
# GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
# GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
# GOOGLE_CLOUD_CLIENT_ID=your-client-id

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 4. Default Login Credentials
The app comes with pre-configured demo users:

- **Username:** `bride` | **Password:** `bride123`
- **Username:** `groom` | **Password:** `groom123`
- **Username:** `family` | **Password:** `family123`
- **Username:** `friends` | **Password:** `friends123`

### 5. Run the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── upload/        # File upload endpoint
│   │   ├── gallery/       # Gallery data endpoint
│   │   ├── wishes/        # Wishes CRUD endpoint
│   │   └── download/      # Download functionality
│   ├── gallery/           # Gallery page
│   ├── login/             # Login page
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── WeddingLoader.js   # Loading animation
│   └── withAuth.js        # Authentication HOC
└── lib/
    ├── gcs.js             # Google Cloud Storage utilities
    └── auth.js            # Authentication utilities
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Gallery
- `GET /api/gallery` - Get all uploaded files
- `POST /api/upload` - Upload files to GCS

### Wishes
- `GET /api/wishes` - Get all wishes
- `POST /api/wishes` - Submit a new wish

### Download
- `GET /api/download/all` - Get download URLs for all files

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
Make sure to:
1. Set all required environment variables
2. Ensure Node.js version compatibility
3. Configure build command: `npm run build`
4. Configure start command: `npm start`

## Security Notes
- JWT tokens are stored in HTTP-only cookies
- File uploads are validated for type and size
- All API endpoints require authentication
- Service account keys should never be committed to version control

## Customization
- Update colors in `tailwind.config.js`
- Modify user credentials in `src/lib/auth.js`
- Adjust file size limits in `src/app/api/upload/route.js`
- Customize UI components in respective page files

## Support
For issues or questions, check the console logs and ensure:
1. Google Cloud Storage bucket exists and is accessible
2. Service account has proper permissions
3. Environment variables are correctly set
4. Network connectivity to Google Cloud Storage

## License
This project is for personal use in wedding celebrations.
# cloud-wedding
