import { useEffect, useState, useRef, useCallback } from "react";
import {
  Heart,
  Download,
  Share2,
  ArrowLeft,
  CheckSquare,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  MessageCircle,
  Home,
  Play,
  Wifi,
  WifiOff
} from "lucide-react";
import withAuth from '../components/withAuth';
import WeddingLoader from '../components/WeddingLoader';

const eventOptions = [
  { id: "all", name: "All Events" },
  { id: "mehndi", name: "Mehndi" },
  { id: "haldi", name: "Haldi" },
  { id: "dj-night", name: "DJ Night" },
  { id: "wedding", name: "Wedding" },
];

const fetchGalleryImages = async (event) => {
  const res = await fetch(`/api/gallery?event=${event}`);
  return res.json();
};

// Connection speed detection
const detectConnectionSpeed = () => {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      if (connection.effectiveType === '4g' && connection.downlink > 10) return 'fast';
      if (connection.effectiveType === '4g' || connection.effectiveType === '3g') return 'medium';
      return 'slow';
    }
  }
  return 'medium'; // Default fallback
};

// Optimized video thumbnail component
const VideoThumbnail = ({ src, videoSrc, alt, className, onLoad, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Reset state when src changes
    setError(false);
    setIsLoading(true);
    setCurrentSrc(src);
  }, [src]);

  const handleImageError = () => {
    if (currentSrc === src && videoSrc) {
      // Try direct video URL as fallback
      setCurrentSrc(videoSrc);
      setIsLoading(true);
    } else {
      // Final fallback to placeholder
      setError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  if (error) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center relative`}>
        <div className="text-center text-white">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-70" fill="currentColor" />
          <div className="text-xs opacity-70">Video</div>
        </div>
        {/* Video Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {/* Video Play Icon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
        </div>
      </div>
      {/* Video Duration Badge */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
        🎥 Video
      </div>
    </div>
  );
};

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [previewImg, setPreviewImg] = useState(null);
  const [previewImgHD, setPreviewImgHD] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [connectionSpeed, setConnectionSpeed] = useState('medium');
  const [previewCache, setPreviewCache] = useState(new Map());

  // Detect connection speed on mount
  useEffect(() => {
    setConnectionSpeed(detectConnectionSpeed());
  }, []);

  // Aggressive preloading for visible images
  const preloadVisibleImages = useCallback((imageList) => {
    // Simple preloading for first few images using authenticated API
    const preloadCount = connectionSpeed === 'fast' ? 4 : 2;

    imageList.slice(0, preloadCount).forEach((img) => {
      if (!img.isVideo) {
        const imageUrl = `/api/image?fileId=${img.id}`;
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = imageUrl;
        document.head.appendChild(link);
      }
    });
  }, [connectionSpeed]);

  // Preload adjacent images in preview mode
  const preloadAdjacentPreviews = useCallback((currentIndex) => {
    const preloadIndexes = [
      currentIndex - 1,
      currentIndex + 1
    ].filter(i => i >= 0 && i < images.length);

    preloadIndexes.forEach(index => {
      const img = images[index];
      if (img && !img.isVideo) {
        const imageUrl = `/api/image?fileId=${img.id}`;
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = imageUrl;
        document.head.appendChild(link);
      }
    });
  }, [images]);

  const fetchImages = async (event) => {
    setLoading(true);
    try {
      const response = await fetchGalleryImages(event);
      console.log('Gallery API response:', response); // Debug log

      // Handle the API response structure
      const imageList = response.images || response || [];
      const processedImages = Array.isArray(imageList) ? imageList.filter(img => img && img.id) : [];

      console.log('Processed images:', processedImages.length); // Debug log
      setImages(processedImages);

      // Start aggressive preloading
      if (processedImages.length > 0) {
        preloadVisibleImages(processedImages);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      setImages([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(filter);
  }, [filter]);

  // Preload when images change
  useEffect(() => {
    if (images.length > 0) {
      preloadVisibleImages(images);
    }
  }, [images, preloadVisibleImages]);

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Touch gesture handling for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!previewImg) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
        case 'Escape':
          e.preventDefault();
          closeCarousel();
          break;
      }
    };

    if (previewImg) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [previewImg]);

  const toggleSelection = (imageId) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const selectAll = () => {
    setSelectedImages(new Set(images.map((img) => img.id)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
    setIsSelectionMode(false);
  };

  const handleDownload = async (img) => {
    try {
      // Show loading state
      const loadingToast = document.createElement('div');
      loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      loadingToast.textContent = 'Preparing download...';
      document.body.appendChild(loadingToast);

      // Use our download API endpoint
      const downloadUrl = `/api/download?fileId=${img.id}&fileName=${encodeURIComponent(img.name || 'wedding-photo.jpg')}`;

      // Create a temporary link to trigger download
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      a.download = img.name || "wedding-photo.jpg";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Remove loading toast
      setTimeout(() => {
        if (document.body.contains(loadingToast)) {
          document.body.removeChild(loadingToast);
        }
      }, 2000);

    } catch (error) {
      console.error("Download failed:", error);

      // Remove any loading toast
      const loadingToast = document.querySelector('.fixed.top-4.right-4');
      if (loadingToast) {
        document.body.removeChild(loadingToast);
      }

      // Show error message
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorToast.textContent = 'Download failed. Please try again.';
      document.body.appendChild(errorToast);

      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 3000);

      // Fallback: try the original Google Drive link
      const fallbackUrl = img.webContentLink || img.webViewLink || `https://drive.google.com/uc?export=download&id=${img.id}`;
      const newWindow = window.open(fallbackUrl, '_blank');
      if (!newWindow) {
        alert("Download failed. Please allow popups and try again, or right-click the image to save.");
      }
    }
  };

  const handleBulkDownload = async () => {
    if (selectedImages.size === 0) return;

    setIsDownloading(true);
    const selectedImagesArray = images.filter((img) =>
      selectedImages.has(img.id)
    );
    setDownloadProgress({ current: 0, total: selectedImagesArray.length });

    // Show initial progress toast
    const progressToast = document.createElement('div');
    progressToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    progressToast.id = 'bulk-download-progress';
    document.body.appendChild(progressToast);

    for (let i = 0; i < selectedImagesArray.length; i++) {
      const img = selectedImagesArray[i];
      setDownloadProgress({
        current: i + 1,
        total: selectedImagesArray.length,
      });

      // Update progress toast
      progressToast.textContent = `Downloading ${i + 1} of ${selectedImagesArray.length} photos...`;

      try {
        // Add a small delay between downloads to avoid overwhelming the server
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Use our download API for each file
        const downloadUrl = `/api/download?fileId=${img.id}&fileName=${encodeURIComponent(img.name || `wedding-photo-${i + 1}.jpg`)}`;

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = downloadUrl;
        a.download = img.name || `wedding-photo-${i + 1}.jpg`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

      } catch (error) {
        console.error(`Failed to download ${img.name}:`, error);
      }
    }

    // Remove progress toast and show completion message
    if (document.body.contains(progressToast)) {
      document.body.removeChild(progressToast);
    }

    // Show completion toast
    const completionToast = document.createElement('div');
    completionToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    completionToast.textContent = `Downloaded ${selectedImagesArray.length} photos successfully!`;
    document.body.appendChild(completionToast);

    setTimeout(() => {
      if (document.body.contains(completionToast)) {
        document.body.removeChild(completionToast);
      }
    }, 3000);

    setIsDownloading(false);
    setDownloadProgress({ current: 0, total: 0 });
    clearSelection();
  };

  const handleShare = async (img) => {
    // Use high-quality URL for sharing instead of thumbnail
    const shareUrl = img.webViewLink || img.webContentLink || img.url;

    if (navigator.share) {
      await navigator.share({
        url: shareUrl,
        title: `Wedding Photo - ${img.name}`,
        text: "Check out this beautiful wedding photo!"
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("High-quality image link copied to clipboard!");
    }
  };

  const openCarousel = (imageIndex) => {
    setCurrentImageIndex(imageIndex);
    setIsPreviewLoading(false);
    setPreviewImgHD(null);

    const currentImage = images[imageIndex];

    // Use the authenticated API for both images and videos to avoid 403 errors
    const mediaUrl = currentImage.fullUrl; // This is `/api/image?fileId=${id}` from gallery API
    setPreviewImg(mediaUrl);
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % images.length;
    navigateToImage(nextIndex);
  };

  const prevImage = () => {
    const prevIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
    navigateToImage(prevIndex);
  };

  const navigateToImage = (index) => {
    setCurrentImageIndex(index);
    const currentImage = images[index];

    // Use the authenticated API for both images and videos
    const mediaUrl = currentImage.fullUrl; // This is `/api/image?fileId=${id}` from gallery API
    setPreviewImg(mediaUrl);
    setIsPreviewLoading(false);
  };

  const closeCarousel = () => {
    setPreviewImg(null);
    setCurrentImageIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="hidden sm:inline text-gray-600">Back</span>
            </button>

            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />
              Gallery
            </h1>

            <div className="flex items-center gap-2">
              <a
                href="/"
                className="flex items-center gap-1 px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md"
                title="Home"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {eventOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap font-medium transition-all duration-200 ${
                  filter === option.id
                    ? "bg-pink-500 text-white shadow-md scale-105"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      {isSelectionMode && (
        <div className="bg-pink-50 border-b border-pink-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-pink-700 font-medium">
              {selectedImages.size} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm bg-pink-500 text-white rounded-lg"
              >
                All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
              {selectedImages.size > 0 && (
                <button
                  onClick={handleBulkDownload}
                  disabled={isDownloading}
                  className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Download Progress */}
      {isDownloading && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700 font-medium">
              Downloading...
            </span>
            <span className="text-sm text-blue-600">
              {downloadProgress.current}/{downloadProgress.total}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <WeddingLoader />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Heart className="w-12 h-12 mb-4 text-gray-300" />
            <p>No photos yet</p>
            <p className="text-sm mt-1">Photos will appear here once uploaded</p>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            {!isSelectionMode && images.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                >
                  <CheckSquare className="w-4 h-4" />
                  Select
                </button>
              </div>
            )}

            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, index) => (
                <div key={img.id} className="relative">
                  {/* Selection Overlay */}
                  {isSelectionMode && (
                    <div
                      className="absolute top-2 left-2 z-10"
                      onClick={() => toggleSelection(img.id)}
                    >
                      {selectedImages.has(img.id) ? (
                        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-white/80 border-2 border-gray-300 rounded-full backdrop-blur-sm" />
                      )}
                    </div>
                  )}

                  {/* Media Content */}
                  <div
                    className={`relative aspect-square overflow-hidden rounded-xl ${
                      selectedImages.has(img.id) ? "ring-2 ring-pink-500" : ""
                    }`}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleSelection(img.id);
                      } else {
                        openCarousel(index);
                      }
                    }}
                  >
                    {img.isVideo ? (
                      <VideoThumbnail
                        src={`/api/image?fileId=${img.id}`}
                        videoSrc={img.fullUrl}
                        alt={img.name}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <img
                        src={`/api/image?fileId=${img.id}`}
                        alt={img.name}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          console.warn('Authenticated API failed for thumbnail, using direct URL');
                          // Fallback to direct Google Drive URL
                          e.target.src = img.fullUrl || img.webContentLink || img.url;
                        }}
                      />
                    )}

                    {/* Uploader Info Overlay */}
                    {!isSelectionMode && img.uploader && img.uploader !== 'Unknown' && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                        📸 {img.uploader}
                      </div>
                    )}

                    {/* Action Buttons - Always visible */}
                    {!isSelectionMode && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(img);
                          }}
                          className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(img);
                          }}
                          className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Carousel Modal */}
      {previewImg && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl z-20 bg-black/30 rounded-full p-2 backdrop-blur-sm"
            onClick={closeCarousel}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter & Info */}
          <div className="absolute top-4 left-4 text-white z-20 space-y-1">
            <div className="bg-black/50 px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
              {currentImageIndex + 1} of {images.length}
            </div>
            {/* Connection Speed Indicator */}
            <div className="bg-black/50 px-3 py-2 rounded-lg text-sm backdrop-blur-sm flex items-center gap-2">
              {connectionSpeed === 'fast' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : connectionSpeed === 'medium' ? (
                <Wifi className="w-4 h-4 text-yellow-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs">{connectionSpeed} connection</span>
            </div>
            {images[currentImageIndex]?.isVideo && (
              <div className="bg-black/50 px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
                🎥 Video
              </div>
            )}
            {images[currentImageIndex]?.uploader && images[currentImageIndex].uploader !== 'Unknown' && (
              <div className="bg-black/50 px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
                📸 {images[currentImageIndex].uploader}
              </div>
            )}
            {/* Loading Indicator */}
            {isPreviewLoading && (
              <div className="bg-black/50 px-3 py-2 rounded-lg text-sm backdrop-blur-sm flex items-center gap-2">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Loading HD...</span>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-white/80 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all z-20 backdrop-blur-sm"
                onClick={prevImage}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white/80 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all z-20 backdrop-blur-sm"
                onClick={nextImage}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Full Screen Media Container */}
          <div
            className="w-full h-full flex items-center justify-center p-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {images[currentImageIndex]?.isVideo ? (
              <div className="relative max-w-full max-h-full flex items-center justify-center">
                <video
                  src={previewImg}
                  controls
                  className="max-w-full max-h-full object-contain select-none"
                  style={{ maxWidth: '100vw', maxHeight: '100vh' }}
                  playsInline
                  preload="metadata"
                  onLoadStart={() => setIsPreviewLoading(true)}
                  onCanPlay={() => setIsPreviewLoading(false)}
                  onError={(e) => {
                    console.error('Failed to load video, falling back to thumbnail');
                    setIsPreviewLoading(false);
                    const currentImage = images[currentImageIndex];
                    if (currentImage?.url && e.target.src !== currentImage.url) {
                      e.target.src = currentImage.url;
                    }
                  }}
                />
                {isPreviewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative max-w-full max-h-full flex items-center justify-center">
                <img
                  src={previewImg}
                  alt="Full size preview"
                  className={`max-w-full max-h-full object-contain select-none transition-opacity duration-300 ${
                    isPreviewLoading ? 'opacity-70' : 'opacity-100'
                  }`}
                  style={{ maxWidth: '100vw', maxHeight: '100vh' }}
                  onClick={nextImage}
                  draggable={false}
                  onLoad={() => setIsPreviewLoading(false)}
                  onError={(e) => {
                    console.error('Failed to load full image, falling back to thumbnail');
                    setIsPreviewLoading(false);
                    const currentImage = images[currentImageIndex];
                    if (currentImage?.url && e.target.src !== currentImage.url) {
                      e.target.src = currentImage.url;
                    }
                  }}
                />
                {/* Loading overlay for images */}
                {isPreviewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2">
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white text-sm">Enhancing quality...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            <button
              onClick={() => handleDownload(images[currentImageIndex])}
              className="px-4 py-3 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-all flex items-center gap-2 backdrop-blur-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => handleShare(images[currentImageIndex])}
              className="px-4 py-3 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-all flex items-center gap-2 backdrop-blur-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(Gallery);
