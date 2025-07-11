import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

const WeddingLoader = () => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const generateHearts = () => {
      const newHearts = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      }));
      setHearts(newHearts);
    };

    generateHearts();
    const interval = setInterval(generateHearts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center z-50">
      {/* Floating Hearts Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {hearts.map((heart) => (
          <Heart
            key={heart.id}
            className="absolute text-pink-300 animate-pulse"
            style={{
              left: `${heart.left}%`,
              animationDelay: `${heart.delay}s`,
              animationDuration: `${heart.duration}s`,
              transform: 'translateY(100vh)',
              animation: `float-up ${heart.duration}s ${heart.delay}s ease-in-out infinite`,
            }}
            size={16}
            fill="currentColor"
          />
        ))}
      </div>

      {/* Main Loader */}
      <div className="text-center relative z-10">
        <div className="mb-8">
          <div className="w-20 h-20 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <Heart className="w-8 h-8 text-pink-500 mx-auto animate-pulse" fill="currentColor" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Memories...</h2>
        <p className="text-gray-600">Preparing your beautiful wedding gallery</p>

        <div className="mt-6 flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default WeddingLoader;
