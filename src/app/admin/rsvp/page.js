'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Users, Calendar, Mail, Phone, MessageCircle, ArrowLeft } from 'lucide-react';

export default function AdminRSVP() {
  const [rsvpData, setRsvpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchRSVPData();
  }, []);

  const fetchRSVPData = async () => {
    try {
      const response = await fetch('/api/rsvp');
      const data = await response.json();

      if (response.ok) {
        setRsvpData(data);
      } else {
        setError(data.error || 'Failed to fetch RSVP data');
      }
    } catch (err) {
      setError('Failed to fetch RSVP data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'yes': return 'bg-green-100 text-green-800 border-green-200';
      case 'maybe': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'no': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'yes': return '✨';
      case 'maybe': return '🤔';
      case 'no': return '💔';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-dancing text-lg">Loading RSVP data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-great-vibes text-gray-800 mb-4">Oops!</h2>
          <p className="text-gray-600 font-dancing">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 px-6 rounded-full font-dancing hover:from-pink-600 hover:to-rose-600 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/login')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-4xl font-great-vibes text-gray-800">Wedding RSVPs</h1>
                <p className="text-gray-600 font-dancing">Manage your guest responses</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Heart className="w-8 h-8 text-pink-500" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 font-pacifico">{rsvpData?.totalCount || 0}</div>
            <div className="text-gray-600 font-dancing">Total Responses</div>
          </div>
          <div className="bg-green-100 rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 font-pacifico">{rsvpData?.yesCount || 0}</div>
            <div className="text-green-700 font-dancing">Attending</div>
          </div>
          <div className="bg-yellow-100 rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 font-pacifico">{rsvpData?.maybeCount || 0}</div>
            <div className="text-yellow-700 font-dancing">Maybe</div>
          </div>
          <div className="bg-red-100 rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-600 font-pacifico">{rsvpData?.noCount || 0}</div>
            <div className="text-red-700 font-dancing">Can&apos;t Attend</div>
          </div>
        </div>

        {/* RSVP List */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-great-vibes text-gray-800">Guest Responses</h2>
          </div>

          {rsvpData?.rsvps?.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="space-y-4 p-6">
                {rsvpData.rsvps.map((rsvp) => (
                  <div key={rsvp.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-dancing font-semibold text-gray-800">{rsvp.guestName}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(rsvp.rsvpStatus)}`}>
                            {getStatusEmoji(rsvp.rsvpStatus)} {rsvp.rsvpStatus.charAt(0).toUpperCase() + rsvp.rsvpStatus.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          {rsvp.email && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              <span className="font-dancing">{rsvp.email}</span>
                            </div>
                          )}
                          {rsvp.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              <span className="font-dancing">{rsvp.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span className="font-dancing">{formatDate(rsvp.submittedAt)}</span>
                          </div>
                          {rsvp.additionalGuests?.length > 0 && (
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              <span className="font-dancing">+{rsvp.additionalGuests.length} guests</span>
                            </div>
                          )}
                        </div>

                        {rsvp.additionalGuests?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 font-dancing mb-1">Additional Guests:</p>
                            <div className="flex flex-wrap gap-2">
                              {rsvp.additionalGuests.map((guest, index) => (
                                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-sm font-dancing">
                                  {guest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rsvp.message && (
                          <div className="mt-3">
                            <div className="flex items-start">
                              <MessageCircle className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-700 font-dancing mb-1">Message:</p>
                                <p className="text-sm text-gray-600 font-dancing italic">&ldquo;{rsvp.message}&rdquo;</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💌</div>
              <h3 className="text-2xl font-great-vibes text-gray-800 mb-2">No RSVPs Yet</h3>
              <p className="text-gray-600 font-dancing">Guest responses will appear here once they start RSVPing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
