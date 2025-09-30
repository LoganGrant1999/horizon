import { useState, useEffect } from 'react';
import { Button, Card } from '@health-heatmap/ui';
import { User, Lock, Download, Trash2, AlertTriangle } from 'lucide-react';
import { Toast } from '@/components/Toast';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Export data
  const [exportLoading, setExportLoading] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setDisplayName(data.user.displayName || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName || null }),
        credentials: 'include',
      });

      if (res.ok) {
        await loadProfile();
        setIsEditingProfile(false);
        setToastMessage('Profile updated successfully');
        setShowToast(true);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setToastMessage('Failed to update profile');
      setShowToast(true);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setToastMessage('Passwords do not match');
      setShowToast(true);
      return;
    }

    if (newPassword.length < 8) {
      setToastMessage('Password must be at least 8 characters');
      setShowToast(true);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });

      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setToastMessage('Password changed successfully');
        setShowToast(true);
      } else {
        const error = await res.json();
        setToastMessage(error.error || 'Failed to change password');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to change password');
      setShowToast(true);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const res = await fetch('/api/auth/export', { credentials: 'include' });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `horizon-data-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setToastMessage('Data exported successfully');
        setShowToast(true);
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      setToastMessage('Failed to export data');
      setShowToast(true);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setToastMessage('Please type DELETE to confirm');
      setShowToast(true);
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        navigate('/');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      setToastMessage('Failed to delete account');
      setShowToast(true);
      setDeleteLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
              {isEditingProfile ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={profileLoading}
                      className="h-11 min-w-[44px]"
                    >
                      {profileLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setDisplayName(profile.displayName || '');
                      }}
                      className="h-11 min-w-[44px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName || 'Not set'}
                    disabled
                    className="flex-1 px-3 py-2 border border-input rounded-lg bg-muted text-foreground cursor-not-allowed"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingProfile(true)}
                    className="h-11 min-w-[44px]"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Change Password Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className="h-11 min-w-[44px]"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </Card>

        {/* Export Data Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Your Data
          </h2>

          <p className="text-sm text-muted-foreground mb-4">
            Download all your health data in JSON format. This includes symptoms, conditions,
            medications, vitals, and journal entries.
          </p>

          <Button
            onClick={handleExportData}
            disabled={exportLoading}
            variant="outline"
            className="h-11 min-w-[44px]"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export All Data'}
          </Button>
        </Card>

        {/* Delete Account Section */}
        <Card className="p-6 border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>

          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="outline"
            className="h-11 min-w-[44px] border-red-300 text-red-600 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-xl font-semibold">Delete Account</h3>
            </div>

            <p className="text-sm text-foreground">
              This will permanently delete your account and all associated data. This action cannot
              be undone.
            </p>

            <p className="text-sm text-foreground">
              Type <strong>DELETE</strong> to confirm:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="flex-1 h-11 min-w-[44px] bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 h-11 min-w-[44px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}