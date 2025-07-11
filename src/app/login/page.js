'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, Lock, User, Eye, EyeOff, Camera, ChevronRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Login = () => {
  const [loginType, setLoginType] = useState('guest'); // 'guest' or 'admin'
  const [step, setStep] = useState(1); // 1: Name, 2: Passcode, 3: Selfie
  const [guestName, setGuestName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Admin login fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const router = useRouter();

  // Generate hearts only on client side to avoid hydration mismatch
  useEffect(() => {
    const generateHearts = () => {
      return Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 3,
        animationDuration: 3 + Math.random() * 2,
        size: 12 + Math.random() * 8,
      }));
    };
    setHearts(generateHearts());
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setIsCameraOpen(false);

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported by this browser');
        return;
      }

      // Simple approach - get stream and set it directly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480, max: 640 },
          height: { ideal: 480, max: 640 },
          facingMode: 'user'
        }        });

      // Set the stream directly to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to be ready and play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              setIsCameraOpen(true);
            })
            .catch((error) => {
              console.error('Play failed:', error);
              setError('Failed to start video preview');
            });
        };

        // Force play if metadata already loaded
        if (videoRef.current.readyState >= 1) {
          try {
            await videoRef.current.play();
            setIsCameraOpen(true);
          } catch (error) {
            // Ignore direct play errors
          }
        }
      } else {
        throw new Error('Video element not available');
      }

    } catch (err) {
      // Clean up stream on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

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
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready for photo capture');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Check if video is ready
    if (video.readyState < 2) {
      setError('Video not ready yet. Please wait a moment and try again.');
      return;
    }

    // Check if video has valid dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) {
      setError('Video dimensions not available. Please try again.');
      return;
    }

    canvas.width = 300;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');

    // Clear canvas first
    ctx.clearRect(0, 0, 300, 300);

    // Calculate crop area to get a square from the center
    const size = Math.min(videoWidth, videoHeight);
    const x = (videoWidth - size) / 2;
    const y = (videoHeight - size) / 2;

    // Draw the video frame onto canvas
    try {
      // Flip the image horizontally to match the mirrored video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-300, 0);
      ctx.drawImage(video, x, y, size, size, 0, 0, 300, 300);
      ctx.restore();

      const dataURL = canvas.toDataURL('image/jpeg', 0.8);

      // Validate the data URL
      if (dataURL && dataURL.length > 50 && dataURL.startsWith('data:image/')) {
        setCapturedPhoto(dataURL);
      } else {
        setError('Failed to capture photo. Please try again.');
        return;
      }
    } catch (err) {
      setError('Failed to capture photo. Please try again.');
      return;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraOpen(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setError('');

    // Stop current stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsCameraOpen(false);

    // Small delay to ensure cleanup before restarting
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const handleStepSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!guestName.trim()) {
        setError('Please enter your name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!passcode.trim()) {
        setError('Please enter the passcode');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!capturedPhoto) {
        setError('Please take a selfie to continue');
        return;
      }
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guestName: guestName.trim(),
          passcode: passcode.trim(),
          selfiePhoto: capturedPhoto
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword.trim()
        }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
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

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative z-10 border border-white/20">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Wedding Gallery
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            {loginType === 'guest' && (
              <>
                {step === 1 && "Welcome! Please tell us your name"}
                {step === 2 && "Enter the wedding passcode"}
                {step === 3 && "Take a selfie for our guest list"}
              </>
            )}
            {loginType === 'admin' && "Admin Access"}
          </p>
        </div>



        {/* Step Indicator - Only for Guest Login */}
        {loginType === 'guest' && (
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= stepNum
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <ChevronRight className={`w-4 h-4 mx-2 ${
                      step > stepNum ? 'text-pink-500' : 'text-gray-400'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Admin Login Form */}
        {loginType === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                  placeholder="Enter admin username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl font-medium hover:from-red-600 hover:to-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all shadow-lg text-sm sm:text-base disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </button>

            <div className="text-center text-xs text-gray-500 mt-4">
              <p>Admin accounts: bride, groom, family, friends</p>
            </div>
          </form>
        )}

        {/* Guest Login Forms */}
        {loginType === 'guest' && (
          <>
            {/* Step 1: Guest Name */}
            {step === 1 && (
          <form onSubmit={handleStepSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all shadow-lg text-sm sm:text-base"
            >
              <div className="flex items-center justify-center">
                <span>Continue</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </div>
            </button>
          </form>
        )}

        {/* Step 2: Passcode */}
        {step === 2 && (
          <form onSubmit={handleStepSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Wedding Passcode</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                  placeholder="Enter wedding passcode"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all text-sm sm:text-base"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all shadow-lg text-sm sm:text-base"
              >
                <div className="flex items-center justify-center">
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </div>
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Selfie */}
        {step === 3 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-full overflow-hidden border-4 border-pink-200 relative">
                {/* Video element - always rendered but only visible when camera is open */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform scale-x-[-1] ${
                    isCameraOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Camera placeholder */}
                {!capturedPhoto && !isCameraOpen && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-10">
                    <Camera className="w-16 h-16 text-gray-400 mb-2" />
                    <span className="text-sm">Camera Preview</span>
                  </div>
                )}

                {/* Captured photo */}
                {capturedPhoto && (
                  <div className="absolute inset-0 z-20">
                    <img
                      src={capturedPhoto}
                      alt="Your selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="text-center space-y-3">
              {!capturedPhoto && !isCameraOpen && (
                <div className="space-y-2">
                  <button
                    onClick={startCamera}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg text-sm sm:text-base"
                  >
                    <div className="flex items-center justify-center">
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Start Camera
                    </div>
                  </button>

                  <p className="text-xs text-gray-500">
                    Make sure to allow camera access when prompted
                  </p>
                </div>
              )}

              {isCameraOpen && (
                <button
                  onClick={capturePhoto}
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-teal-600 transition-all shadow-lg text-sm sm:text-base"
                >
                  <div className="flex items-center justify-center">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Take Photo
                  </div>
                </button>
              )}

              {capturedPhoto && (
                <div className="flex space-x-3">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all text-sm sm:text-base"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleStepSubmit}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Joining...
                      </div>
                    ) : (
                      'Join Wedding'
                    )}
                  </button>
                </div>
              )}
            </div>

            {!capturedPhoto && (
              <div className="flex justify-center">
                <button
                  onClick={() => setStep(2)}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500">
          <p>Join our special celebration</p>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => setLoginType('admin')}
              className="text-gray-400 hover:text-gray-600 transition-colors underline text-xs"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
