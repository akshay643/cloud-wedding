'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, Upload, Heart, ArrowLeft, X, ChevronLeft, ChevronRight, Play, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const GuestsPage = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestFiles, setGuestFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuestFiles = async (guestId, guestName) => {
    setLoadingFiles(true);
    try {
      // Fetch files specifically for this guest using the API filter
      const response = await fetch(`/api/gallery?guestId=${encodeURIComponent(guestId)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Files for guest:', guestId, guestName, data.files);

        setGuestFiles(data.files || []);
        setSelectedGuest({ id: guestId, name: guestName });
      } else {
        setError('Failed to load guest files');
      }
    } catch (err) {
      console.error('Error fetching guest files:', err);
      setError('Failed to load guest files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const openImageModal = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const navigateImage = (direction) => {
    if (direction === 'next') {
      const nextIndex = currentIndex + 1 >= guestFiles.length ? 0 : currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedImage(guestFiles[nextIndex]);
    } else {
      const prevIndex = currentIndex - 1 < 0 ? guestFiles.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedImage(guestFiles[prevIndex]);
    }
  };

  const handleDownload = (file) => {
    try {
      const link = document.createElement('a');
      link.href = file.publicUrl;
      link.download = file.name.split('/').pop() || 'wedding-photo';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await fetch('/api/guests', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGuests(data.guests || []);
      } else {
        setError('Failed to load guest list');
      }
    } catch (err) {
      console.error('Error fetching guests:', err);
      setError('Failed to load guest list');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatLastActivity = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading guest list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <Users className="text-pink-600" size={24} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Wedding Guests</h1>
            </div>

            <div className="text-sm text-gray-600">
              {guests.length} {guests.length === 1 ? 'Guest' : 'Guests'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {guests.length === 0 ? (
          <div className="text-center py-12">
            <Users size={64} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No guests yet</h2>
            <p className="text-gray-500">Guests will appear here once they join the celebration!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Guest Avatar */}
                <div className="p-6 text-center">
                  <div className="relative mx-auto mb-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-pink-200 mx-auto">
                      {guest.selfiePhoto ? (
                        <Image
                          src={guest.selfiePhoto}
                          alt={`${guest.name}'s selfie`}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center">
                          <span className="text-pink-600 font-bold text-xl">
                            {guest.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Guest Name */}
                  <h3 className="font-semibold text-gray-800 mb-1 text-lg">
                    {guest.name}
                  </h3>

                  {/* Join Date */}
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-4">
                    <Calendar size={14} />
                    <span>Joined {formatDate(guest.joinedAt)}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <button
                      onClick={() => fetchGuestFiles(guest.id, guest.name)}
                      className={`rounded-lg p-2 transition-colors ${
                        guest.uploadsCount && guest.uploadsCount > 0
                          ? 'bg-pink-50 hover:bg-pink-100 cursor-pointer'
                          : 'bg-gray-50 cursor-pointer hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Upload size={14} className={
                          guest.uploadsCount && guest.uploadsCount > 0 ? 'text-pink-600' : 'text-gray-400'
                        } />
                        <span className="text-xs font-medium text-gray-600">Photos</span>
                      </div>
                      <div className={`text-lg font-bold ${
                        guest.uploadsCount && guest.uploadsCount > 0 ? 'text-pink-600' : 'text-gray-400'
                      }`}>
                        {guest.uploadsCount || 0}
                      </div>
                    </button>

                    <div className="bg-rose-50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart size={14} className="text-rose-600" />
                        <span className="text-xs font-medium text-gray-600">Wishes</span>
                      </div>
                      <div className="text-lg font-bold text-rose-600">
                        {guest.wishesCount || 0}
                      </div>
                    </div>
                  </div>

                  {/* Last Activity */}
                  {guest.lastActivity && (
                    <div className="mt-3 text-xs text-gray-400">
                      Last active {formatLastActivity(guest.lastActivity)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Guest Gallery Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedGuest.name}&apos;s Photos & Videos
              </h2>
              <button
                onClick={() => {
                  setSelectedGuest(null);
                  setGuestFiles([]);
                  setSelectedImage(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              {loadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                  <span className="ml-3 text-gray-600">Loading photos...</span>
                </div>
              ) : guestFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Upload size={64} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No uploads yet</h3>
                  <p className="text-gray-500">{selectedGuest.name} hasn&apos;t uploaded any photos or videos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {guestFiles.map((file, index) => (
                    <div
                      key={file.name}
                      onClick={() => openImageModal(file, index)}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
                    >
                      {file.isVideo ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <Play className="w-8 h-8 text-white" />
                          <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Video
                          </span>
                        </div>
                      ) : (
                        <img
                          src={file.publicUrl}
                          alt={`Photo by ${selectedGuest.name}`}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Download button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-60 p-4">
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Buttons */}
          {guestFiles.length > 1 && (
            <>
              <button
                onClick={() => navigateImage('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => navigateImage('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Download Button */}
          <button
            onClick={() => handleDownload(selectedImage)}
            className="absolute top-4 right-20 p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors z-10"
          >
            <Download className="w-6 h-6" />
          </button>

          {/* Image/Video Content */}
          <div className="max-w-full max-h-full flex items-center justify-center">
            {selectedImage.isVideo ? (
              <video
                src={selectedImage.publicUrl}
                controls
                className="max-w-full max-h-full"
                autoPlay
              />
            ) : (
              <img
                src={selectedImage.publicUrl}
                alt={`Photo by ${selectedGuest.name}`}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Image Info */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Photo by {selectedGuest.name}</h3>
                <p className="text-sm text-gray-300">
                  {currentIndex + 1} of {guestFiles.length}
                </p>
              </div>
              <div className="text-right text-sm text-gray-300">
                <p>{selectedImage.isVideo ? 'Video' : 'Photo'}</p>
                {selectedImage.timeCreated && (
                  <p>{new Date(selectedImage.timeCreated).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestsPage;
