'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Users, Image as ImageIcon, Heart, Video, ArrowLeft, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('files');
  const [files, setFiles] = useState([]);
  const [guests, setGuests] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const checkAdminAccess = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include',
      });

      console.log('Admin access check response:', response.status);

      if (!response.ok) {
        console.log('Auth verify failed, redirecting to login');
        router.push('/login');
        return;
      }

      const data = await response.json();
      console.log('User data:', data);

      if (data.user.type === 'guest') {
        console.log('User is guest, redirecting to home');
        router.push('/');
        return;
      }

      console.log('Admin access granted');
    } catch (err) {
      console.error('Admin access check error:', err);
      router.push('/login');
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch files
      const filesResponse = await fetch('/api/gallery', {
        credentials: 'include',
      });
      console.log('Files response:', filesResponse.status);
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData.files || []);
      } else {
        console.error('Failed to fetch files:', filesResponse.status);
      }

      // Fetch guests
      const guestsResponse = await fetch('/api/guests', {
        credentials: 'include',
      });
      console.log('Guests response:', guestsResponse.status);
      if (guestsResponse.ok) {
        const guestsData = await guestsResponse.json();
        setGuests(guestsData.guests || []);
      } else {
        console.error('Failed to fetch guests:', guestsResponse.status);
      }

      // Fetch wishes
      const wishesResponse = await fetch('/api/wishes', {
        credentials: 'include',
      });
      console.log('Wishes response:', wishesResponse.status);
      if (wishesResponse.ok) {
        const wishesData = await wishesResponse.json();
        setWishes(wishesData.wishes || []);
      } else {
        console.error('Failed to fetch wishes:', wishesResponse.status);
        if (wishesResponse.status === 401) {
          setError('Authentication failed. Please login as an admin user.');
          router.push('/login');
          return;
        }
      }
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, [checkAdminAccess, fetchData]);

  const handleDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    try {
      const { type, id, fileName } = deleteModal;
      let response;

      switch (type) {
        case 'file':
          response = await fetch(`/api/admin/delete-file`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ fileName })
          });
          break;
        case 'guest':
          response = await fetch(`/api/admin/delete-guest`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ guestId: id })
          });
          break;
        case 'wish':
          response = await fetch(`/api/admin/delete-wish`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ wishId: id })
          });
          break;
      }

      if (response && response.ok) {
        setDeleteModal(null);
        fetchData(); // Refresh data
      } else {
        setError('Failed to delete item');
      }
    } catch (err) {
      setError('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
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
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>

            <div className="text-sm text-red-600 font-medium">
              Admin Only
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'files'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ImageIcon size={18} />
            Files ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'guests'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users size={18} />
            Guests ({guests.length})
          </button>
          <button
            onClick={() => setActiveTab('wishes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'wishes'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Heart size={18} />
            Wishes ({wishes.length})
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Manage Files</h2>
              <p className="text-gray-600">Delete photos and videos uploaded by guests</p>
            </div>
            <div className="divide-y">
              {files.map((file) => (
                <div key={file.name} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      {file.isVideo ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <Image
                          src={file.publicUrl}
                          alt="Preview"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {file.name.split('-').slice(2).join('-').replace(/\.[^/.]+$/, "")}
                      </p>
                      <p className="text-sm text-gray-600">
                        By {file.uploadedBy} • {formatDate(file.timeCreated)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.isVideo ? 'Video' : 'Image'} • {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteModal({
                      type: 'file',
                      fileName: file.name,
                      name: file.name.split('-').slice(2).join('-').replace(/\.[^/.]+$/, "")
                    })}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {files.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No files uploaded yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guests Tab */}
        {activeTab === 'guests' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Manage Guests</h2>
              <p className="text-gray-600">Remove guests and all their associated data</p>
            </div>
            <div className="divide-y">
              {guests.map((guest) => (
                <div key={guest.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                      {guest.selfiePhoto ? (
                        <Image
                          src={guest.selfiePhoto}
                          alt={guest.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-bold">
                            {guest.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{guest.name}</p>
                      <p className="text-sm text-gray-600">
                        Joined {formatDate(guest.joinedAt)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {guest.uploadsCount || 0} uploads • {guest.wishesCount || 0} wishes
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteModal({
                      type: 'guest',
                      id: guest.id,
                      name: guest.name
                    })}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {guests.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No guests registered yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wishes Tab */}
        {activeTab === 'wishes' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Manage Wishes</h2>
              <p className="text-gray-600">Delete inappropriate or unwanted wishes</p>
            </div>
            <div className="divide-y">
              {wishes.map((wish, index) => (
                <div key={index} className="p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-800 mb-2">{wish.message}</p>
                    <p className="text-sm text-gray-600">
                      By {wish.guestName} • {formatDate(wish.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteModal({
                      type: 'wish',
                      id: index,
                      name: `Wish by ${wish.guestName}`
                    })}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {wishes.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No wishes submitted yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{deleteModal.name}&quot;? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
