import { useState } from 'react';
import { Heart, Camera, MessageCircle, Calendar, Users, Download, Upload, Star } from 'lucide-react';
import withAuth from '../components/withAuth';

const Home = () => {
  const [wishes, setWishes] = useState([]);
  const [newWish, setNewWish] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleWishSubmit = async (e) => {
    e.preventDefault();
    if (!newWish.trim()) return;

    try {
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: newWish }),
      });

      if (response.ok) {
        setNewWish('');
        // Refresh wishes list
        fetchWishes();
      }
    } catch (error) {
      console.error('Error submitting wish:', error);
    }
  };

  const fetchWishes = async () => {
    try {
      const response = await fetch('/api/wishes', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWishes(data.wishes || []);
      }
    } catch (error) {
      console.error('Error fetching wishes:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setUploading(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        alert('Photos uploaded successfully!');
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Floating Hearts Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <Heart
            key={i}
            className="absolute text-pink-200 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
            size={8 + Math.random() * 12}
            fill="currentColor"
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-8 h-8 text-pink-500" fill="currentColor" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Wedding Gallery
              </h1>
              <Heart className="w-8 h-8 text-pink-500" fill="currentColor" />
            </div>
            <p className="text-gray-600 text-lg">Welcome to our special day</p>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>December 2024</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Family & Friends</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column - Actions */}
          <div className="lg:col-span-1 space-y-6">

            {/* Gallery Access */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Photo Gallery</h3>
                <p className="text-gray-600 mb-4">Browse all our wedding memories</p>
                <a
                  href="/gallery"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                  View Gallery
                </a>
              </div>
            </div>

            {/* Upload Photos */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Photos</h3>
                <p className="text-gray-600 mb-4">Share your favorite moments</p>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <button
                    disabled={uploading}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Choose Files
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Gallery Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Photos</span>
                  <span className="font-bold text-gray-900">Loading...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Videos</span>
                  <span className="font-bold text-gray-900">Loading...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wishes</span>
                  <span className="font-bold text-gray-900">{wishes.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Wishes */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-pink-500" />
                Wedding Wishes
              </h3>

              {/* Submit Wish Form */}
              <form onSubmit={handleWishSubmit} className="mb-8">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newWish}
                    onChange={(e) => setNewWish(e.target.value)}
                    placeholder="Share your wishes for the happy couple..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Send
                  </button>
                </div>
              </form>

              {/* Wishes List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {wishes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No wishes yet</p>
                    <p className="text-sm mt-1">Be the first to share your wishes!</p>
                  </div>
                ) : (
                  wishes.map((wish, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100"
                    >
                      <p className="text-gray-800 mb-2">{wish.message}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{wish.author || 'Anonymous'}</span>
                        <span>{new Date(wish.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-white/80 backdrop-blur-lg border-t border-white/20 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-gray-600">
            Thank you for being part of our special day ❤️
          </p>
        </div>
      </div>
    </div>
  );
};

export default withAuth(Home);
