import React from 'react';
import { User, X } from 'lucide-react';

export default function DashboardProfileCard({ show, onClose, user }: {
  show: boolean;
  onClose: () => void;
  user: { name: string; email: string; bio?: string };
}) {
  if (!show) return null;
  return (
    <aside className="w-80 bg-white border-l border-gray-200 p-6 sticky top-0 h-screen overflow-y-auto relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>
      {/* Profile Header */}
      <div className="relative mb-6">
        <div className="h-32 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-xl"></div>
        <div className="absolute -bottom-8 left-6">
          <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <User size={40} className="text-gray-400" />
          </div>
        </div>
      </div>
      <div className="mt-12 mb-6">
        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
        <p className="text-sm text-gray-500">{user.bio || 'No bio added yet'}</p>
      </div>
      {/* Social Links */}
      <div className="flex gap-4 mb-6">
        {/* ...social buttons... */}
      </div>
      <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
        Edit Profile
      </button>
    </aside>
  );
}
