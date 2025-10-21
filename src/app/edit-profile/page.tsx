"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Menu, X } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  username: string;
  bio: string;
  avatar: string;
  role?: string;
  newsletterSubscribed?: boolean;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, getToken } = useAuth();
  const [form, setForm] = useState<UserProfile>({ 
    name: '', 
    email: '', 
    username: '', 
    bio: '', 
    avatar: '',
    newsletterSubscribed: true
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        // Check if user is authenticated
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }

        // Get userId and token from cookies
        const userId = Cookies.get('userId');
        const token = getToken();
        
        if (!userId || !token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/user/profile?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': userId,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        console.log('Loaded profile data - newsletterSubscribed:', data.user.newsletterSubscribed);
        setForm({
          name: data.user.name || '',
          email: data.user.email || '',
          username: data.user.username || '',
          bio: data.user.bio || '',
          avatar: data.user.avatar || '',
          role: data.user.role,
          newsletterSubscribed: data.user.newsletterSubscribed !== undefined ? data.user.newsletterSubscribed : true,
        });
        setAvatarPreview(data.user.avatar || '');
      } catch (err) {
        console.error('Error fetching profile:', err);
        // If we have auth user data from context, use it as fallback
        if (authUser) {
          setForm({
            name: authUser.name || '',
            email: authUser.email || '',
            username: authUser.username || '',
            bio: authUser.bio || '',
            avatar: authUser.avatar || '',
            role: authUser.role,
            newsletterSubscribed: authUser.newsletterSubscribed !== undefined ? authUser.newsletterSubscribed : true,
          });
          setAvatarPreview(authUser.avatar || '');
        } else {
          setError('Failed to load profile. Please try logging in again.');
        }
      } finally {
        setLoadingProfile(false);
      }
    }
    
    fetchUserProfile();
  }, [router, isAuthenticated, authUser, getToken]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  }

  async function handleUploadAvatar(file: File): Promise<string> {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Upload error:', err);
      throw new Error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password change if attempting
    if (showPasswordSection) {
      if (newPassword && newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (newPassword && newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (newPassword && !currentPassword) {
        setError('Current password is required to set a new password');
        return;
      }
    }

    setLoading(true);

    try {
      let avatarUrl = form.avatar;

      // Upload avatar if changed
      if (avatarFile) {
        try {
          avatarUrl = await handleUploadAvatar(avatarFile);
        } catch {
          setError('Avatar upload failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Update profile
      const userId = Cookies.get('userId');
      const token = getToken();
      
      if (!userId || !token) {
        setError('Authentication required. Please log in again.');
        router.push('/login');
        return;
      }

      const updateData: Record<string, string | boolean> = {
        name: form.name,
        // Email is not included as it cannot be changed
        username: form.username,
        bio: form.bio,
        avatar: avatarUrl,
        newsletterSubscribed: form.newsletterSubscribed !== undefined ? form.newsletterSubscribed : true,
      };

      // Add password fields if changing password
      if (showPasswordSection && newPassword && currentPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      console.log('Updating profile with data:', { ...updateData, currentPassword: '***', newPassword: '***' });

      const response = await fetch(`/api/user/profile?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update form with new data
      setForm(prev => ({ ...prev, avatar: avatarUrl }));
      setAvatarFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      setSuccess('Profile updated successfully!');
      
      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
          <DashboardSidebar isAdmin={form.role === 'admin'} />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <DashboardSidebar isAdmin={form.role === 'admin'} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Edit Profile</h1>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8 w-full">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          {form.role === 'admin' && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
              Admin
            </span>
          )}
        </div>

        <form className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-4xl" onSubmit={handleSubmit}>

        {/* Avatar Section */}
        <div className="mb-6 flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
          <div className="mb-3 relative">
            {avatarPreview ? (
              <Image 
                src={avatarPreview} 
                alt="avatar" 
                width={96} 
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" 
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-blue-100">
                <span className="text-3xl text-gray-400">
                  {form.name ? form.name[0].toUpperCase() : '?'}
                </span>
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange}
              className="hidden"
            />
            Choose Photo
          </label>
          <p className="text-xs text-gray-500 mt-2">Max size: 5MB</p>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email * 
            <span className="text-xs text-gray-500 font-normal ml-2">(Cannot be changed)</span>
          </label>
          <input
            type="email"
            value={form.email}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={4}
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Newsletter Subscription */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="newsletterSubscribed"
              checked={form.newsletterSubscribed === true}
              onChange={e => setForm(f => ({ ...f, newsletterSubscribed: e.target.checked }))}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <div className="flex-1">
              <label htmlFor="newsletterSubscribed" className="text-sm font-medium text-gray-700 cursor-pointer">
                Subscribe to Newsletter
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Receive updates, announcements, and exclusive offers from Opalineart directly to your inbox.
              </p>
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="mb-6 border-t pt-6">
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <span>{showPasswordSection ? '▼' : '▶'}</span>
            <span className="ml-2">Change Password</span>
          </button>
          
          {showPasswordSection && (
            <div className="space-y-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={loading || uploadingAvatar}
          >
            {loading ? 'Saving...' : uploadingAvatar ? 'Uploading...' : 'Save Changes'}
          </button>
        </div>
        </form>
        </div>
      </main>
    </div>
  );
}
