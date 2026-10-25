import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { User, Mail, Calendar, Shield, LogOut, Check } from 'lucide-react';
import { formatRideDate } from '../utils/formatDate';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black tracking-tight">
          User Profile
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Your account credentials and system privileges
        </p>
      </div>

      <div className="bg-white border border-border-subtle rounded-xl p-8 shadow-sm">
        {/* Profile Card Header */}
        <div className="flex items-center gap-5 pb-6 border-b border-neutral-100">
          <div className="w-16 h-16 rounded-full bg-brand-black text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-black">{user?.name}</h2>
            <p className="text-xs text-text-secondary">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Check className="w-3 h-3" />
              Unified Driver & Rider Account
            </div>
          </div>
        </div>

        {/* Details list */}
        <div className="py-6 space-y-4 text-sm divide-y divide-neutral-100">
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-text-secondary uppercase font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-400" /> Full Name
            </span>
            <span className="font-medium text-brand-black">{user?.name}</span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-text-secondary uppercase font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-400" /> Email Address
            </span>
            <span className="font-medium text-brand-black">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-text-secondary uppercase font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" /> Account Created
            </span>
            <span className="font-medium text-brand-black">
              {formatRideDate(user?.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-text-secondary uppercase font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-400" /> MongoDB User ID
            </span>
            <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              {user?._id}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-neutral-100 flex justify-between items-center">
          <span className="text-xs text-text-secondary">
            Authenticated via secure JWT & HttpOnly session
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
