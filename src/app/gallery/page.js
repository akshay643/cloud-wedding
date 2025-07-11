'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Heart,
  Download,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  MessageCircle,
  Home,
  Play,
  Image as ImageIcon,
  User,
  Calendar,
  Eye,
  Users
} from "lucide-react";
import { useRouter } from 'next/navigation';
import WeddingLoader from '@/components/WeddingLoader';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWishes, setShowWishes] = useState(false);
  const [user, setUser] = useState(null);
  const [hearts, setHearts] = useState([]);
  const router = useRouter();

  // Generate hearts only on client side to avoid hydration mismatch
  useEffect(() => {
    const generateHearts = () => {
      return Array.from({ length: 15 }, (_, i) => ({
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

  // Fetch gallery data
  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch gallery files
      const galleryRes = await fetch('/api/gallery', {
        credentials: 'include'
      });

      if (!galleryRes.ok) {
        throw new Error('Failed to fetch gallery');
      }

      const galleryData = await galleryRes.json();
      setImages(galleryData.files || []);

      // Fetch wishes
      const wishesRes = await fetch('/api/wishes', {
        credentials: 'include'
      });

      if (wishesRes.ok) {
        const wishesData = await wishesRes.json();
        setWishes(wishesData.wishes || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Check authentication and fetch data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
          await fetchGallery();
        } else {
          router.push('/login');
        }
      } catch (err) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [fetchGallery, router]);

  // Handle logout
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

  // Handle image selection
  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  // Navigate images in modal
  const navigateImage = useCallback((direction) => {
    if (images.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % images.length;
    } else {
      newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    }

    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
  }, [images, currentIndex]);

  // Handle keyboard navigation and touch gestures
  useEffect(() => {
    if (!selectedImage) return;

    let touchStartX = null;
    let touchStartY = null;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (!touchStartX || !touchStartY) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchStartX - touchEndX;
      const deltaY = touchStartY - touchEndY;

      // Only react to horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          navigateImage('next'); // Swipe left = next image
        } else {
          navigateImage('prev'); // Swipe right = previous image
        }
      }

      touchStartX = null;
      touchStartY = null;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [selectedImage, currentIndex, navigateImage]);

  // Handle download
  const handleDownload = async (image) => {
    try {
      const link = document.createElement('a');
      link.href = image.publicUrl;
      link.download = image.name.split('/').pop() || 'wedding-photo';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col space-y-4 sm:hidden">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Wedding Gallery
                </h1>
                <p className="text-xs text-gray-600">{images.length} photos & videos</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowWishes(!showWishes)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Wishes ({wishes.length})</span>
              </button>
              <button
                onClick={() => router.push('/guests')}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
              >
                <Users className="w-4 h-4" />
                <span>Guests</span>
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Wedding Gallery
                  </h1>
                  <p className="text-sm text-gray-600">{images.length} photos & videos</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowWishes(!showWishes)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Wishes ({wishes.length})</span>
              </button>

              <button
                onClick={() => router.push('/guests')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
              >
                <Users className="w-4 h-4" />
                <span>Guests</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <div
              key={image.name}
              className="group relative aspect-square bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => handleImageClick(image, index)}
            >
              {/* Image/Video Thumbnail */}
              {image.isVideo ? (
                <div className="relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <video
                    src={image.publicUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white drop-shadow-lg" fill="currentColor" />
                  </div>
                </div>
              ) : (
                <img
                  src={image.publicUrl}
                  alt={`Wedding photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {image.isVideo ? (
                        <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span className="text-xs sm:text-sm font-medium">
                        {image.isVideo ? 'Video' : 'Photo'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                      className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <div className="mt-1 sm:mt-2 text-xs text-white/80 truncate">
                    By {image.uploadedBy}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {images.length === 0 && (
          <div className="col-span-full text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No photos yet</h3>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Be the first to share your wedding memories!</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg text-sm sm:text-base"
            >
              Upload Photos
            </button>
          </div>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4">          {/* Top Controls - Mobile Optimized */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex space-x-2 z-20">
            {/* Download Button */}
            <button
              onClick={() => handleDownload(selectedImage)}
              className="p-2 sm:p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors shadow-lg flex items-center justify-center"
              title="Download this image"
            >
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="p-2 sm:p-3 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg flex items-center justify-center"
              title="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Navigation Buttons - Mobile Optimized */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => navigateImage('prev')}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors z-10 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => navigateImage('next')}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors z-10 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Media Content - Mobile Responsive */}
          <div className="max-w-full max-h-full flex items-center justify-center">
            {selectedImage.isVideo ? (
              <video
                src={selectedImage.publicUrl}
                controls
                className="max-w-full max-h-full object-contain"
                autoPlay
              />
            ) : (
              <img
                src={selectedImage.publicUrl}
                alt="Full size"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Image Info - Mobile Optimized */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 text-center text-white">
            <div className="bg-black/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm mb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>By {selectedImage.uploadedBy}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{new Date(selectedImage.timeCreated).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Download Button in Info Section */}
              <button
                onClick={() => handleDownload(selectedImage)}
                className="flex items-center justify-center space-x-2 mx-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs sm:text-sm transition-colors shadow-lg font-medium"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Download {selectedImage.isVideo ? 'Video' : 'Image'}</span>
              </button>

              <div className="mt-3 text-xs text-white/70">
                {currentIndex + 1} of {images.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wishes Sidebar - Mobile Responsive */}
      {showWishes && (
        <>
          {/* Mobile Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-30 sm:hidden"
            onClick={() => setShowWishes(false)}
          />

          {/* Wishes Panel */}
          <div className="fixed inset-x-0 bottom-0 sm:right-0 sm:top-0 sm:inset-x-auto h-3/4 sm:h-full w-full sm:w-80 bg-white/95 backdrop-blur-lg shadow-2xl z-40 transform transition-transform duration-300 border-t sm:border-t-0 sm:border-l border-white/20 rounded-t-3xl sm:rounded-none">
            <div className="p-4 sm:p-6 h-full flex flex-col">
              {/* Mobile Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>

              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Wedding Wishes</h3>
                <button
                  onClick={() => setShowWishes(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4">
                {wishes.map((wish) => (
                  <div key={wish.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{wish.name}</h4>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {new Date(wish.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{wish.message}</p>
                    <div className="mt-2 text-xs text-gray-400">
                      Submitted by {wish.submittedBy}
                    </div>
                  </div>
                ))}

                {wishes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm sm:text-base">No wishes yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Gallery;
