'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Upload,
  Camera,
  Video,
  MessageCircle,
  Images,
  LogOut,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  Users
} from 'lucide-react';
import WeddingLoader from '@/components/WeddingLoader';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [wishText, setWishText] = useState('');
  const [submittingWish, setSubmittingWish] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hearts, setHearts] = useState([]);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const router = useRouter();

  // Generate hearts only on client side to avoid hydration mismatch
  useEffect(() => {
    const generateHearts = () => {
      return Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 5,
        animationDuration: 4 + Math.random() * 3,
        size: 8 + Math.random() * 12,
      }));
    };
    setHearts(generateHearts());
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          router.push('/login');
          return;
        }
      } catch (err) {
        router.push('/login');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      // Different size limits for images and videos
      const maxImageSize = 10 * 1024 * 1024; // 10MB for images
      const maxVideoSize = 200 * 1024 * 1024; // 200MB for videos

      const isValidSize = isImage ? file.size <= maxImageSize : file.size <= maxVideoSize;

      if (!isImage && !isVideo) {
        setError('Please select only image or video files');
        return false;
      }

      if (!isValidSize) {
        if (isImage) {
          setError('Image size must be less than 10MB');
        } else {
          setError('Video size must be less than 200MB');
        }
        return false;
      }

      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Camera Functions
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleCameraFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const maxImageSize = 10 * 1024 * 1024; // 10MB for images

      if (!isImage) {
        setError('Camera capture only supports image files');
        return false;
      }

      if (file.size > maxImageSize) {
        setError('Image size must be less than 10MB');
        return false;
      }

      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    setError('');
  };

  const startAdvancedCamera = async () => {
    try {
      setError('');
      setIsCameraOpen(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported by this browser');
        return;
      }

      // Show the modal first
      setShowCameraCapture(true);

      // Small delay to ensure modal is rendered
      await new Promise(resolve => setTimeout(resolve, 200));

      // Determine if we're on mobile for appropriate constraints
      const isMobile = window.innerWidth < 768;

      const videoConstraints = {
        video: {
          width: {
            ideal: isMobile ? 800 : 1280,
            max: isMobile ? 1024 : 1920
          },
          height: {
            ideal: isMobile ? 600 : 720,
            max: isMobile ? 768 : 1080
          },
          facingMode: 'environment', // Back camera by default
          aspectRatio: { ideal: 4/3 } // More stable aspect ratio for mobile
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to load and play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              setIsCameraOpen(true);
            })
            .catch((playError) => {
              console.error('Play error:', playError);
              setError('Failed to start camera preview');
            });
        };

        // Try to play immediately if metadata already loaded
        if (videoRef.current.readyState >= 1) {
          try {
            await videoRef.current.play();
            setIsCameraOpen(true);
          } catch (playError) {
            // Direct play failed, waiting for metadata
          }
        }
      } else {
        // If video element still not ready, close modal and show error
        setShowCameraCapture(false);
        setError('Camera interface not ready. Please try again.');
      }

    } catch (err) {
      console.error('Camera error:', err);
      setShowCameraCapture(false);

      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Camera failed to start. Please try again.');
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Wait for video to be ready and have proper dimensions
      if (!video.videoWidth || !video.videoHeight) {
        setError('Camera not ready. Please wait a moment and try again.');
        return;
      }

      // Get actual video stream dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // For mobile, use a more conservative max resolution to avoid stretching
      const isMobile = window.innerWidth < 768;
      const maxWidth = isMobile ? 800 : 1280;
      const maxHeight = isMobile ? 600 : 720;

      // Calculate canvas dimensions maintaining exact aspect ratio
      let canvasWidth, canvasHeight;
      const videoAspectRatio = videoWidth / videoHeight;
      const maxAspectRatio = maxWidth / maxHeight;

      if (videoAspectRatio > maxAspectRatio) {
        // Video is wider than our max ratio, limit by width
        canvasWidth = Math.min(videoWidth, maxWidth);
        canvasHeight = canvasWidth / videoAspectRatio;
      } else {
        // Video is taller than our max ratio, limit by height
        canvasHeight = Math.min(videoHeight, maxHeight);
        canvasWidth = canvasHeight * videoAspectRatio;
      }

      // Ensure dimensions are integers
      canvasWidth = Math.round(canvasWidth);
      canvasHeight = Math.round(canvasHeight);

      // Set canvas size
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext('2d');

      // Reset any previous transformations
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Apply selected filter BEFORE drawing
      if (selectedFilter && selectedFilter !== 'none') {
        ctx.filter = getFilterStyle(selectedFilter);
      } else {
        ctx.filter = 'none';
      }

      // Clear canvas first
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw video frame maintaining aspect ratio
      ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

      // Reset filter before drawing frame
      ctx.filter = 'none';

      // Apply frame if selected
      if (selectedFrame && selectedFrame !== 'none') {
        drawFrame(ctx, canvasWidth, canvasHeight, selectedFrame);
      }

      // Convert to blob with high quality
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = Date.now();
          const fileName = `wedding-photo-${timestamp}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });

          setFiles(prev => [...prev, file]);
          setCapturedPhotos(prev => [...prev, URL.createObjectURL(blob)]);
        } else {
          setError('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Wedding filter styles
  const getFilterStyle = (filter) => {
    switch (filter) {
      case 'romantic':
        return 'sepia(0.3) saturate(1.4) brightness(1.1) contrast(0.9)';
      case 'vintage':
        return 'sepia(0.6) contrast(1.2) brightness(0.9) saturate(0.8)';
      case 'dreamy':
        return 'blur(0.5px) brightness(1.2) contrast(0.8) saturate(1.3)';
      case 'golden':
        return 'sepia(0.4) saturate(1.6) brightness(1.15) hue-rotate(10deg)';
      case 'elegant':
        return 'contrast(1.1) brightness(1.05) saturate(0.9) grayscale(0.1)';
      case 'warm':
        return 'sepia(0.2) saturate(1.3) brightness(1.1) hue-rotate(-5deg)';
      default:
        return 'none';
    }
  };

  // Helper function to draw a heart
  const drawHeart = useCallback((ctx, x, y, size, color) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size/4);
    ctx.quadraticCurveTo(x, y, x + size/4, y);
    ctx.quadraticCurveTo(x + size/2, y, x + size/2, y + size/4);
    ctx.quadraticCurveTo(x + size/2, y, x + 3*size/4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size/4);
    ctx.quadraticCurveTo(x + size, y + size/2, x + 3*size/4, y + 3*size/4);
    ctx.lineTo(x + size/2, y + size);
    ctx.lineTo(x + size/4, y + 3*size/4);
    ctx.quadraticCurveTo(x, y + size/2, x, y + size/4);
    ctx.fill();
    ctx.restore();
  }, []);

  // Helper function to draw flourish
  const drawFlourish = useCallback((ctx, x, y, size) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + size/2, y - size/2, x + size, y);
    ctx.quadraticCurveTo(x + size/2, y + size/2, x, y);
    ctx.stroke();
    ctx.restore();
  }, []);

  // Helper function to draw rose
  const drawRose = useCallback((ctx, x, y, size, color) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, 2 * Math.PI);
    ctx.fill();

    // Petals
    ctx.beginPath();
    ctx.arc(x - size/3, y - size/3, size/3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size/3, y - size/3, size/3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }, []);

  // Wedding frame drawing function
  const drawFrame = useCallback((ctx, width, height, frameType) => {
    ctx.save();

    switch (frameType) {
      case 'hearts':
        // Pink heart border
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 8;
        ctx.setLineDash([]);

        // Draw border
        ctx.strokeRect(10, 10, width - 20, height - 20);

        // Draw hearts in corners
        const heartSize = 20;
        drawHeart(ctx, 25, 25, heartSize, '#ec4899');
        drawHeart(ctx, width - 45, 25, heartSize, '#ec4899');
        drawHeart(ctx, 25, height - 45, heartSize, '#ec4899');
        drawHeart(ctx, width - 45, height - 45, heartSize, '#ec4899');
        break;

      case 'floral':
        // Elegant floral border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 12;
        ctx.setLineDash([]);

        // Golden border
        ctx.strokeRect(15, 15, width - 30, height - 30);

        // Corner flourishes
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        drawFlourish(ctx, 30, 30, 25);
        drawFlourish(ctx, width - 55, 30, 25);
        drawFlourish(ctx, 30, height - 55, 25);
        drawFlourish(ctx, width - 55, height - 55, 25);
        break;

      case 'vintage':
        // Vintage photo frame
        ctx.fillStyle = 'rgba(139, 69, 19, 0.8)';
        ctx.fillRect(0, 0, width, 25);
        ctx.fillRect(0, height - 25, width, 25);
        ctx.fillRect(0, 0, 25, height);
        ctx.fillRect(width - 25, 0, 25, height);

        // Corner decorations
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(0, 0, 40, 40);
        ctx.fillRect(width - 40, 0, 40, 40);
        ctx.fillRect(0, height - 40, 40, 40);
        ctx.fillRect(width - 40, height - 40, 40, 40);
        break;

      case 'lace':
        // Delicate lace border
        ctx.strokeStyle = '#f8f9fa';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(20, 20, width - 40, height - 40);

        ctx.setLineDash([10, 5]);
        ctx.strokeRect(25, 25, width - 50, height - 50);
        break;

      case 'rose':
        // Rose gold elegant frame
        ctx.strokeStyle = '#e91e63';
        ctx.lineWidth = 6;
        ctx.setLineDash([]);

        // Multiple nested borders
        ctx.strokeRect(8, 8, width - 16, height - 16);
        ctx.strokeRect(15, 15, width - 30, height - 30);

        // Rose decorations
        drawRose(ctx, 30, 30, 15, '#e91e63');
        drawRose(ctx, width - 45, 30, 15, '#e91e63');
        drawRose(ctx, 30, height - 45, 15, '#e91e63');
        drawRose(ctx, width - 45, height - 45, 15, '#e91e63');
        break;
    }

    ctx.restore();
  }, [drawHeart, drawFlourish, drawRose]);

  const stopCamera = () => {
    // Clean up video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset camera state
    setIsCameraOpen(false);
    setShowCameraCapture(false);
    setSelectedFilter('none');
    setSelectedFrame('none');

    // Clean up captured photo URLs to prevent memory leaks
    capturedPhotos.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setCapturedPhotos([]);
  };

  const switchCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const currentTrack = streamRef.current?.getVideoTracks()[0];
      const currentFacingMode = currentTrack?.getSettings()?.facingMode || 'environment';
      const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

      // Determine if we're on mobile for appropriate constraints
      const isMobile = window.innerWidth < 768;

      const videoConstraints = {
        video: {
          width: {
            ideal: isMobile ? 800 : 1280,
            max: isMobile ? 1024 : 1920
          },
          height: {
            ideal: isMobile ? 600 : 720,
            max: isMobile ? 768 : 1080
          },
          facingMode: newFacingMode,
          aspectRatio: { ideal: 4/3 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();
    } catch (err) {
      setError('Failed to switch camera: ' + err.message);
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Real-time frame preview
  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !overlayCanvasRef.current || selectedFrame === 'none') {
      if (overlayCanvasRef.current) {
        try {
          const ctx = overlayCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
          }
        } catch (error) {
          // Ignore context errors during cleanup
        }
      }
      return;
    }

    let animationId;

    const drawFramePreview = () => {
      const video = videoRef.current;
      const canvas = overlayCanvasRef.current;

      // Add comprehensive null checks
      if (!video || !canvas || video.readyState < 2 || !isCameraOpen || selectedFrame === 'none') {
        return;
      }

      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match video display size
        const rect = video.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        canvas.width = rect.width;
        canvas.height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw frame overlay
        drawFrame(ctx, canvas.width, canvas.height, selectedFrame);

        // Continue animation only if still mounted and camera is open
        if (isCameraOpen && overlayCanvasRef.current && selectedFrame !== 'none') {
          animationId = requestAnimationFrame(drawFramePreview);
        }
      } catch (error) {
        // Ignore canvas errors during state transitions
      }
    };

    // Start frame preview animation
    animationId = requestAnimationFrame(drawFramePreview);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isCameraOpen, selectedFrame, drawFrame]);

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        setFiles([]);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleWishSubmit = async (e) => {
    e.preventDefault();

    if (!wishText.trim()) {
      setError('Please write your wish');
      return;
    }

    setSubmittingWish(true);
    setError('');

    try {
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: wishText.trim()
        })
      });

      if (response.ok) {
        setWishText('');
        setWishSuccess(true);
        setTimeout(() => setWishSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit wish');
      }
    } catch (err) {
      setError('Failed to submit wish. Please try again.');
    } finally {
      setSubmittingWish(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      setDownloading(true);
      setError('');

      // Create download link
      const link = document.createElement('a');
      link.href = '/api/download/all';
      link.download = `wedding-gallery-${new Date().toISOString().split('T')[0]}.zip`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message after a short delay
      setTimeout(() => {
        setDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }, 2000); // 2 seconds to simulate download preparation

    } catch (error) {
      setDownloading(false);
      setError('Download failed. Please try again.');
    }
  };

  if (loading) {
    return <WeddingLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Floating Hearts Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {hearts.map((heart) => (
          <Heart
            key={heart.id}
            className="absolute text-pink-200 animate-pulse"
            style={{
              left: `${heart.left}%`,
              top: `${heart.top}%`,
              animationDelay: `${heart.animationDelay}s`,
              animationDuration: `${heart.animationDuration}s`,
            }}
            size={heart.size}
            fill="currentColor"
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col space-y-4 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Wedding Gallery
                  </h1>
                  <p className="text-xs text-gray-600">Welcome, {user?.username}</p>
                </div>
              </div>
              {user?.type !== 'guest' && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/gallery')}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
              >
                <Images className="w-4 h-4" />
                <span>Gallery</span>
              </button>
              <button
                onClick={() => router.push('/guests')}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
              >
                <Users className="w-4 h-4" />
                <span>Guests</span>
              </button>
              {user?.type !== 'guest' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                >
                  <span className="text-xs">🛡️</span>
                  <span>Admin</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Wedding Gallery
                </h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/gallery')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
              >
                <Images className="w-4 h-4" />
                <span>Gallery</span>
              </button>

              <button
                onClick={() => router.push('/guests')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
              >
                <Users className="w-4 h-4" />
                <span>Guests</span>
              </button>

              {user?.type !== 'guest' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                >
                  <span>🛡️</span>
                  <span>Admin</span>
                </button>
              )}

              {user?.type !== 'guest' && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Success Messages */}
        {uploadSuccess && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center text-sm sm:text-base">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            Files uploaded successfully!
          </div>
        )}

        {wishSuccess && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center text-sm sm:text-base">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            Your wish has been submitted successfully!
          </div>
        )}

        {downloadSuccess && (
          <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center text-sm sm:text-base">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            Download started! Check your downloads folder.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center text-sm sm:text-base">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Upload Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border border-white/20">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Share Your Memories</h2>
                <p className="text-sm sm:text-base text-gray-600">Upload photos and videos from our special day</p>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              {/* Upload Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* File Selection */}
                <div className="border-2 border-dashed border-pink-200 rounded-xl p-4 sm:p-6 text-center hover:border-pink-300 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-100 rounded-full flex items-center justify-center">
                      <Images className="w-6 h-6 sm:w-7 sm:h-7 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-gray-700">Choose Files</p>
                      <p className="text-xs text-gray-500">From gallery</p>
                    </div>
                  </label>
                </div>

                {/* Camera Options */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Quick Camera Capture */}
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-3 text-center hover:border-blue-300 transition-colors">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraFileSelect}
                      className="hidden"
                      id="camera-capture"
                    />
                    <button
                      onClick={handleCameraCapture}
                      className="w-full flex flex-col items-center space-y-2"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Camera className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Quick Camera</p>
                        <p className="text-xs text-gray-500">One-click photo</p>
                      </div>
                    </button>
                  </div>

                  {/* Advanced Camera */}
                  <div className="border-2 border-dashed border-green-200 rounded-lg p-3 text-center hover:border-green-300 transition-colors">
                    <button
                      onClick={startAdvancedCamera}
                      className="w-full flex flex-col items-center space-y-2"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Video className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Camera Studio</p>
                        <p className="text-xs text-gray-500">Multiple photos</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700 text-sm sm:text-base">Selected Files ({files.length})</h3>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          {file.type.startsWith('image/') ? (
                            <Camera className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          ) : (
                            <Video className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          )}
                          <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base"
              >
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Upload Files
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Camera Capture Modal */}
          {showCameraCapture && (
            <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-2">
              <div className="bg-white rounded-2xl w-full max-w-7xl h-full max-h-[98vh] flex flex-col">
                <div className="flex-1 flex flex-col lg:flex-row">
                  {/* Camera Preview - Main Area */}
                  <div className="flex-1 p-2">
                    <div className="relative w-full h-full min-h-[350px] lg:min-h-[500px] bg-gray-900 rounded-xl overflow-hidden">
                      {/* Close Button - Positioned over camera */}
                      <button
                        onClick={stopCamera}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>

                      {/* Studio Title - Mobile Only */}
                      <div className="absolute top-4 left-4 z-20 lg:hidden">
                        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                          <span className="text-white text-sm font-medium">📸 Wedding Studio</span>
                        </div>
                      </div>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${
                          isCameraOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          filter: selectedFilter !== 'none' ? getFilterStyle(selectedFilter) : 'none'
                        }}
                      />

                      {/* Frame Overlay Canvas */}
                      <canvas
                        ref={overlayCanvasRef}
                        className={`absolute inset-0 w-full h-full pointer-events-none ${
                          isCameraOpen && selectedFrame !== 'none' ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ zIndex: 10 }}
                      />

                      {!isCameraOpen && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <Camera className="w-16 h-16 text-gray-400 mb-4" />
                          <span className="text-lg">Initializing Wedding Camera Studio...</span>
                        </div>
                      )}

                      {/* Camera Controls Overlay */}
                      {isCameraOpen && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                          <button
                            onClick={switchCamera}
                            className="p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors text-white"
                            title="Switch Camera"
                          >
                            <Camera className="w-5 h-5" />
                          </button>

                          <button
                            onClick={capturePhoto}
                            className="p-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full text-white transition-colors shadow-lg transform hover:scale-105"
                            title="Capture Photo"
                          >
                            <Camera className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar - Filters & Controls */}
                  <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-gray-50 flex flex-col max-h-[40vh] lg:max-h-none">
                    {/* Mobile: Horizontal Scroll, Desktop: Vertical Layout */}
                    <div className="p-3 lg:p-4 flex-1 overflow-y-auto">
                      {/* Wedding Filters */}
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-800 mb-3">🌸 Wedding Filters</h4>
                        <div className="overflow-x-auto lg:overflow-visible">
                          <div className="flex lg:grid gap-2 lg:grid-cols-2 pb-2 lg:pb-0 min-w-max lg:min-w-0">
                            {[
                              { id: 'none', name: 'Original', emoji: '✨' },
                              { id: 'romantic', name: 'Romantic', emoji: '💕' },
                              { id: 'vintage', name: 'Vintage', emoji: '📸' },
                              { id: 'dreamy', name: 'Dreamy', emoji: '💫' },
                              { id: 'golden', name: 'Golden Hour', emoji: '🌅' },
                              { id: 'elegant', name: 'Elegant', emoji: '👑' },
                              { id: 'warm', name: 'Warm', emoji: '🌻' }
                            ].map((filter) => (
                              <button
                                key={filter.id}
                                onClick={() => setSelectedFilter(filter.id)}
                                className={`flex-shrink-0 lg:flex-shrink-0 p-2 rounded-lg text-xs font-medium transition-all border-2 w-24 lg:w-auto ${
                                  selectedFilter === filter.id
                                    ? 'bg-pink-500 text-white border-pink-500 shadow-lg transform scale-105'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300 hover:shadow-md'
                                }`}
                              >
                                <div className="text-sm mb-1">{filter.emoji}</div>
                                <div className="text-xs">{filter.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Wedding Frames */}
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-800 mb-3">🖼️ Wedding Frames</h4>
                        <div className="overflow-x-auto lg:overflow-visible">
                          <div className="flex lg:grid gap-2 lg:grid-cols-2 pb-2 lg:pb-0 min-w-max lg:min-w-0">
                            {[
                              { id: 'none', name: 'No Frame', emoji: '⭕' },
                              { id: 'hearts', name: 'Hearts', emoji: '💝' },
                              { id: 'floral', name: 'Floral', emoji: '🌺' },
                              { id: 'vintage', name: 'Vintage', emoji: '🏛️' },
                              { id: 'lace', name: 'Lace', emoji: '🤍' },
                              { id: 'rose', name: 'Rose Gold', emoji: '🌹' }
                            ].map((frame) => (
                              <button
                                key={frame.id}
                                onClick={() => setSelectedFrame(frame.id)}
                                className={`flex-shrink-0 lg:flex-shrink-0 p-2 rounded-lg text-xs font-medium transition-all border-2 w-24 lg:w-auto ${
                                  selectedFrame === frame.id
                                    ? 'bg-purple-500 text-white border-purple-500 shadow-lg transform scale-105'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:shadow-md'
                                }`}
                              >
                                <div className="text-sm mb-1">{frame.emoji}</div>
                                <div className="text-xs">{frame.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Captured Photos */}
                      {capturedPhotos.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-gray-800 mb-2">
                            📷 Captured Photos ({capturedPhotos.length})
                          </h4>
                          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                            {capturedPhotos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Wedding photo ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200 hover:border-pink-300 transition-colors"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Sticky at bottom */}
                    <div className="p-3 lg:p-4 bg-white border-t space-y-2">
                      {capturedPhotos.length > 0 && (
                        <button
                          onClick={stopCamera}
                          className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg font-medium text-sm"
                        >
                          ✅ Done ({capturedPhotos.length} photos)
                        </button>
                      )}

                      <button
                        onClick={stopCamera}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden canvas for photo capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Wishes Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border border-white/20">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Leave a Wish</h2>
                <p className="text-sm sm:text-base text-gray-600">Share your blessings and good wishes</p>
              </div>
            </div>

            <form onSubmit={handleWishSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Wish</label>
                <textarea
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 resize-none text-sm sm:text-base"
                  placeholder="Write your heartfelt wishes for the couple..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingWish}
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-red-600 focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base"
              >
                {submittingWish ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Send Wish
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 text-center">Quick Actions</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => router.push('/gallery')}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg w-full sm:w-auto text-sm sm:text-base"
              >
                <Images className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Browse Gallery</span>
              </button>

              <button
                onClick={handleDownloadAll}
                disabled={downloading}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all shadow-lg w-full sm:w-auto text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Preparing Download...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Download All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
