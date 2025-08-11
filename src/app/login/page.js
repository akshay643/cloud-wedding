'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, Lock, User, Eye, EyeOff, Camera, ChevronRight, Check, MapPin, Calendar, Clock, Users, Mail, Phone, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';

const Login = () => {
  const [showWeddingDetails, setShowWeddingDetails] = useState(true); // Show wedding details first
  const [loginType, setLoginType] = useState('guest'); // 'guest' or 'admin'
  const [step, setStep] = useState(1); // 1: Name, 2: Passcode, 3: Selfie
  const [guestName, setGuestName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [sparkles, setSparkles] = useState([]);
  const [isClient, setIsClient] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(''); // 'yes', 'no', 'maybe'
  const [showRSVPForm, setShowRSVPForm] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // RSVP Form fields
  const [rsvpData, setRsvpData] = useState({
    guestName: '',
    email: '',
    phone: '',
    additionalGuests: [],
    message: ''
  });

  // Admin login fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  // Wedding animation data (simple heart animation)
  const heartAnimation = {
    "v": "5.5.7",
    "fr": 60,
    "ip": 0,
    "op": 120,
    "w": 100,
    "h": 100,
    "nm": "Heart Animation",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Heart",
        "sr": 1,
        "ks": {
          "o": {"a": 1, "k": [{"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 0, "s": [0]}, {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 30, "s": [100]}, {"t": 90, "s": [0]}], "ix": 11},
          "r": {"a": 0, "k": 0, "ix": 10},
          "p": {"a": 0, "k": [50, 50, 0], "ix": 2},
          "a": {"a": 0, "k": [0, 0, 0], "ix": 1},
          "s": {"a": 1, "k": [{"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 0, "s": [50, 50, 100]}, {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 60, "s": [120, 120, 100]}, {"t": 119, "s": [50, 50, 100]}], "ix": 6}
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "d": 1,
                "ty": "el",
                "s": {"a": 0, "k": [20, 20], "ix": 2},
                "p": {"a": 0, "k": [0, 0], "ix": 3},
                "nm": "Heart Path",
                "mn": "ADBE Vector Shape - Ellipse",
                "hd": false
              },
              {
                "ty": "fl",
                "c": {"a": 0, "k": [0.91, 0.32, 0.5, 1], "ix": 4},
                "o": {"a": 0, "k": 100, "ix": 5},
                "r": 1,
                "bm": 0,
                "nm": "Fill 1",
                "mn": "ADBE Vector Graphic - Fill",
                "hd": false
              }
            ],
            "nm": "Heart",
            "np": 2,
            "cix": 2,
            "bm": 0,
            "ix": 1,
            "mn": "ADBE Vector Group",
            "hd": false
          }
        ],
        "ip": 0,
        "op": 120,
        "st": 0,
        "bm": 0
      }
    ],
    "markers": []
  };

  const ringAnimation = {
    "v": "5.5.7",
    "fr": 30,
    "ip": 0,
    "op": 90,
    "w": 60,
    "h": 60,
    "nm": "Ring Animation",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Ring",
        "sr": 1,
        "ks": {
          "o": {"a": 0, "k": 100, "ix": 11},
          "r": {"a": 1, "k": [{"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 0, "s": [0]}, {"t": 89, "s": [360]}], "ix": 10},
          "p": {"a": 0, "k": [30, 30, 0], "ix": 2},
          "a": {"a": 0, "k": [0, 0, 0], "ix": 1},
          "s": {"a": 0, "k": [100, 100, 100], "ix": 6}
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "d": 1,
                "ty": "el",
                "s": {"a": 0, "k": [25, 25], "ix": 2},
                "p": {"a": 0, "k": [0, 0], "ix": 3},
                "nm": "Ring Path",
                "mn": "ADBE Vector Shape - Ellipse",
                "hd": false
              },
              {
                "ty": "st",
                "c": {"a": 0, "k": [1, 0.84, 0, 1], "ix": 3},
                "o": {"a": 0, "k": 100, "ix": 4},
                "w": {"a": 0, "k": 3, "ix": 5},
                "lc": 1,
                "lj": 1,
                "ml": 4,
                "bm": 0,
                "nm": "Stroke 1",
                "mn": "ADBE Vector Graphic - Stroke",
                "hd": false
              }
            ],
            "nm": "Ring",
            "np": 2,
            "cix": 2,
            "bm": 0,
            "ix": 1,
            "mn": "ADBE Vector Group",
            "hd": false
          }
        ],
        "ip": 0,
        "op": 90,
        "st": 0,
        "bm": 0
      }
    ],
    "markers": []
  };

  // Generate hearts and sparkles only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);

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

    const generateSparkles = () => {
      return Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 3,
      }));
    };

    setHearts(generateHearts());
    setSparkles(generateSparkles());
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const weddingDate = new Date('2025-11-01T00:00:00'); // November 1st, 2025

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = weddingDate.getTime() - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
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

  const handleRSVP = (status) => {
    setRsvpStatus(status);
    setShowRSVPForm(true);
  };

  const addAdditionalGuest = () => {
    setRsvpData({
      ...rsvpData,
      additionalGuests: [...rsvpData.additionalGuests, '']
    });
  };

  const removeAdditionalGuest = (index) => {
    const newGuests = rsvpData.additionalGuests.filter((_, i) => i !== index);
    setRsvpData({
      ...rsvpData,
      additionalGuests: newGuests
    });
  };

  const updateAdditionalGuest = (index, value) => {
    const newGuests = [...rsvpData.additionalGuests];
    newGuests[index] = value;
    setRsvpData({
      ...rsvpData,
      additionalGuests: newGuests
    });
  };

  const submitRSVP = async () => {
    if (!rsvpData.guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...rsvpData,
          rsvpStatus,
          additionalGuests: rsvpData.additionalGuests.filter(guest => guest.trim() !== '')
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRsvpSubmitted(true);
        setShowRSVPForm(false);
      } else {
        setError(data.error || 'Failed to submit RSVP');
      }
    } catch (err) {
      setError('Failed to submit RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    const currentDate = new Date();
    const activationDate = new Date('2025-10-30T00:00:00'); // October 30th, 2025

    if (currentDate < activationDate) {
      alert('Login will be active on October 30th, 2025. Please check back then!');
      return;
    }

    setShowWeddingDetails(false);
  };

  const openGoogleMaps = () => {
    // Direct link to Sunhari Bagh farmhouse
    const url = 'https://maps.app.goo.gl/1A5Y6aS4xAy43EuEA';
    window.open(url, '_blank');
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
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

      {/* Sparkle Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.animationDelay}s`
            }}
          />
        ))}
      </div>

      {/* Floating Lottie Animations */}
      {isClient && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-16 h-16 opacity-30 animate-float">
            <Lottie
              animationData={ringAnimation}
              loop={true}
              className="w-full h-full"
            />
          </div>
          <div className="absolute top-40 right-20 w-12 h-12 opacity-40 animate-bounce">
            <Lottie
              animationData={heartAnimation}
              loop={true}
              className="w-full h-full"
            />
          </div>
          <div className="absolute bottom-32 left-20 w-14 h-14 opacity-25 animate-pulse">
            <Lottie
              animationData={ringAnimation}
              loop={true}
              className="w-full h-full"
            />
          </div>
          <div className="absolute bottom-20 right-10 w-10 h-10 opacity-35 animate-float">
            <Lottie
              animationData={heartAnimation}
              loop={true}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Wedding Details Page */}
      {showWeddingDetails && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl relative z-10 border border-white/20">
          {/* Login Button - Top Right */}
          <div className="absolute top-4 right-4">
            <button
              onClick={handleLoginClick}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg text-sm"
            >
              Login
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              {isClient && (
                <Lottie
                  animationData={heartAnimation}
                  loop={true}
                  className="w-full h-full"
                />
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 font-great-vibes">
              Akshay & Tripti
            </h1>
            <p className="text-xl text-gray-600 font-medium font-dancing">
              Are Getting Married!
            </p>
            {/* Ring Animation */}
            <div className="w-16 h-16 mx-auto mt-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-lg">
              <div 
                className="text-3xl"
                style={{
                  animation: 'spin 2s linear infinite',
                  transformOrigin: 'center'
                }}
              >
                💍
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-pink-500 mr-2" />
                <span className="text-lg font-medium text-gray-700 font-dancing">Countdown to Our Special Day</span>
                <div className="w-6 h-6 ml-2">
                  {isClient && (
                    <Lottie
                      animationData={heartAnimation}
                      loop={true}
                      className="w-full h-full"
                    />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
                <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl p-4 border border-pink-200">
                  <div className="text-2xl sm:text-3xl font-bold text-pink-600 font-pacifico">
                    {timeLeft.days}
                  </div>
                  <div className="text-xs sm:text-sm text-pink-700 font-dancing mt-1">
                    Days
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 border border-purple-200">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 font-pacifico">
                    {timeLeft.hours}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-700 font-dancing mt-1">
                    Hours
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-4 border border-blue-200">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 font-pacifico">
                    {timeLeft.minutes}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700 font-dancing mt-1">
                    Minutes
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl p-4 border border-orange-200">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600 font-pacifico">
                    {timeLeft.seconds}
                  </div>
                  <div className="text-xs sm:text-sm text-orange-700 font-dancing mt-1">
                    Seconds
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 font-dancing mt-4 text-sm">
                Until November 1st, 2025 - Mehndi Ceremony
              </p>
            </div>
          </div>


          {/* Traditional Indian Wedding Invitation */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 rounded-3xl shadow-2xl p-8 border-4 border-orange-200 relative overflow-hidden">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-br-full opacity-20"></div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-400 to-red-400 rounded-bl-full opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-400 to-red-400 rounded-tr-full opacity-20"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-orange-400 to-red-400 rounded-tl-full opacity-20"></div>

              <div className="text-center relative z-10">
                {/* Opening Blessing */}
                <div className="mb-6">
                  <p className="text-2xl font-bold text-orange-800 mb-2">ॐ श्री गणेशाय नमः</p>
                  <p className="text-sm text-orange-700 font-dancing italic">(With the blessings of Lord Ganesha)</p>
                </div>

                {/* Invitation Line */}
                <div className="mb-6">
                  <p className="text-lg text-gray-800 font-dancing leading-relaxed">
                    With immense joy and gratitude, we invite you to join us in celebrating<br/>
                    the sacred union of our beloved children
                  </p>
                </div>

                {/* Couple Names */}
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Groom */}
                    <div className="text-center">
                      <h3 className="text-3xl font-great-vibes text-blue-800 mb-2">Akshay</h3>
                      <p className="text-sm text-gray-700 font-dancing">Son of</p>
                      <p className="text-sm font-pacifico text-blue-700">Mr. Jarnail Singh &amp; Mrs. Kusum Lata</p>
                    </div>

                    {/* With Symbol */}
                    <div className="flex justify-center items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl">💕</span>
                      </div>
                    </div>

                    {/* Bride */}
                    <div className="text-center">
                      <h3 className="text-3xl font-great-vibes text-pink-800 mb-2">Tripti</h3>
                      <p className="text-sm text-gray-700 font-dancing">Daughter of</p>
                      <p className="text-sm font-pacifico text-pink-700">Mr. Bishamber Nath Arora &amp; Mrs. Sunita Arora</p>
                    </div>
                  </div>
                </div>



                {/* Invitation Closing */}
                <div className="mb-6">
                  <p className="text-base text-gray-800 font-dancing leading-relaxed mb-2">
                    Your presence will make our celebration more special.
                  </p>
                  <p className="text-base text-gray-800 font-dancing leading-relaxed">
                    Kindly grace the occasion with your blessings and love.
                  </p>
                </div>

                {/* Decorative element */}
                <div className="flex justify-center">
                  <div className="w-24 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Wedding Dates & Events */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5 text-pink-500 mr-2" />
              <span className="text-lg font-medium text-gray-700 font-dancing">Wedding Celebrations</span>
              <div className="w-6 h-6 ml-2">
                {isClient && (
                  <Lottie
                    animationData={heartAnimation}
                    loop={true}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-4">
              {/* Mehndi Day */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-100 rounded-2xl p-4">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">🎨</span>
                  <h3 className="text-lg font-dancing font-bold text-orange-800">Mehndi Ceremony</h3>
                </div>
                <p className="text-orange-700 font-pacifico text-sm">November 1st, 2025</p>
              </div>

              {/* Wedding Day */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-100 rounded-2xl p-4">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">💒</span>
                  <h3 className="text-lg font-dancing font-bold text-rose-800">Wedding Day</h3>
                </div>
                <p className="text-rose-700 font-pacifico text-sm mb-2">November 2nd, 2025</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/50 rounded-lg p-2">
                    <span className="font-dancing text-rose-600">🐎 Baraat:</span>
                    <span className="font-pacifico ml-1">2:00 PM</span>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <span className="font-dancing text-rose-600">💍 Pheras:</span>
                    <span className="font-pacifico ml-1">4:30 PM</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 font-pacifico mt-4">At Sunhari Bagh</p>
          </div>



          {/* Venue Location */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-pink-500 mr-2" />
              <span className="text-lg font-medium text-gray-700 font-dancing">Wedding Venue</span>
              <div className="w-6 h-6 ml-2">
                {isClient && (
                  <Lottie
                    animationData={ringAnimation}
                    loop={true}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
            <div className="text-center mb-4">
              <p className="text-gray-600 mb-2 font-pacifico text-lg">Sunhari Bagh</p>
              <p className="text-gray-600 mb-4 font-dancing">Farmhouse Wedding Venue</p>
              <button
                onClick={openGoogleMaps}
                className="bg-gradient-to-r from-blue-500 to-teal-500 text-white py-2 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all shadow-lg"
              >
                View on Google Maps
              </button>
            </div>
          </div>

          {/* RSVP Section */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-pink-500 mr-2" />
              <span className="text-lg font-medium text-gray-700 font-dancing">Will you be joining us?</span>
              <div className="w-8 h-8 ml-2">
                {isClient && (
                  <Lottie
                    animationData={heartAnimation}
                    loop={true}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleRSVP('yes')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  rsvpStatus === 'yes'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleRSVP('maybe')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  rsvpStatus === 'maybe'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                Maybe
              </button>
              <button
                onClick={() => handleRSVP('no')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  rsvpStatus === 'no'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                No
              </button>
            </div>
            {rsvpStatus && (
              <div className="text-center mt-4">
                <p className="text-gray-600">
                  Thank you for your response! We&apos;ve noted that you{' '}
                  {rsvpStatus === 'yes' ? 'will be attending' :
                   rsvpStatus === 'maybe' ? 'might be attending' :
                   'will not be attending'}.
                </p>
              </div>
            )}
          </div>

          {/* Footer Message */}
          <div className="text-center text-gray-600">
            <p className="mb-2 font-dancing text-lg">We can&apos;t wait to celebrate with you!</p>
            <p className="text-sm font-pacifico">Click the Login button when it becomes available on October 30th to access the wedding gallery.</p>
          </div>
        </div>
      )}

      {/* RSVP Form Modal */}
      {showRSVPForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-white/30">
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => {
                  setShowRSVPForm(false);
                  setRsvpStatus('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors bg-white rounded-full p-2 shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 pt-8 sm:pt-0">
              <h2 className="text-2xl sm:text-4xl font-great-vibes text-gray-800 mb-4">
                {rsvpStatus === 'yes' && '✨ Wonderful! Please tell us more'}
                {rsvpStatus === 'maybe' && '🤔 Thanks! Please share your details'}
                {rsvpStatus === 'no' && '💔 We understand, but please confirm'}
              </h2>
              <p className="text-gray-600 font-dancing text-base sm:text-lg">Help us plan the perfect celebration</p>
            </div>

            {error && (
              <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* RSVP Form */}
            <div className="space-y-4 sm:space-y-6">
            {/* Guest Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-dancing">
                Your Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={rsvpData.guestName}
                  onChange={(e) => setRsvpData({...rsvpData, guestName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-dancing">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={rsvpData.email}
                  onChange={(e) => setRsvpData({...rsvpData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-dancing">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={rsvpData.phone}
                  onChange={(e) => setRsvpData({...rsvpData, phone: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Additional Guests - Only show for 'yes' responses */}
            {rsvpStatus === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-dancing">
                  Additional Guests
                </label>
                <div className="space-y-3">
                  {rsvpData.additionalGuests.map((guest, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={guest}
                        onChange={(e) => updateAdditionalGuest(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50"
                        placeholder="Guest name"
                      />
                      <button
                        onClick={() => removeAdditionalGuest(index)}
                        className="px-3 py-3 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addAdditionalGuest}
                    className="flex items-center text-pink-600 hover:text-pink-700 transition-colors font-dancing"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Guest
                  </button>
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-dancing">
                Special Message (Optional)
              </label>
              <textarea
                value={rsvpData.message}
                onChange={(e) => setRsvpData({...rsvpData, message: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                rows="3"
                placeholder="Any dietary restrictions, song requests, or special messages..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <button
                onClick={() => {
                  setShowRSVPForm(false);
                  setRsvpStatus('');
                }}
                className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all font-dancing"
              >
                Cancel
              </button>
              <button
                onClick={submitRSVP}
                disabled={loading}
                className="w-full sm:flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-dancing"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit RSVP'
                )}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Login Page - Only shown when showWeddingDetails is false */}
      {!showWeddingDetails && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative z-10 border border-white/20">
          {/* Back Button */}
          <div className="absolute top-4 left-4">
            <button
              onClick={() => setShowWeddingDetails(true)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Wedding Details
            </button>
          </div>

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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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
      )}
    </div>
  );
};

export default Login;
