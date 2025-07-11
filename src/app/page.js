'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [wishName, setWishName] = useState('');
  const [submittingWish, setSubmittingWish] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hearts, setHearts] = useState([]);
  const fileInputRef = useRef(null);
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
          setUser(userData);
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

    if (!wishText.trim() || !wishName.trim()) {
      setError('Please fill in both name and wish');
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
          name: wishName.trim(),
          message: wishText.trim()
        })
      });

      if (response.ok) {
        setWishText('');
        setWishName('');
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
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
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
              <div className="border-2 border-dashed border-pink-200 rounded-xl p-6 sm:p-8 text-center hover:border-pink-300 transition-colors">
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
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-pink-100 rounded-full flex items-center justify-center">
                    <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-medium text-gray-700">Click to select files</p>
                    <p className="text-sm text-gray-500">Images up to 10MB, Videos up to 200MB</p>
                  </div>
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Wish</label>
                <textarea
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm resize-none text-sm sm:text-base"
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
                onClick={() => window.open('/api/download/all', '_blank')}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all shadow-lg w-full sm:w-auto text-sm sm:text-base"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Download All</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
