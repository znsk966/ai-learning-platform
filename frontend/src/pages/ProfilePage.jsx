import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/profileService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProfile();
      setProfile(data);
      setForm({ first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || '' });
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const data = await updateProfile(form);
      setProfile(data);
      setEditing(false);
      setSaveMessage('Profile updated successfully.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ first_name: profile.first_name || '', last_name: profile.last_name || '', email: profile.email || '' });
    setEditing(false);
    setSaveMessage('');
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (error) return <ErrorDisplay title="Error" message={error} onRetry={fetchProfile} />;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account settings</p>
      </div>

      {/* Success message */}
      {saveMessage && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${saveMessage.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {saveMessage}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-gray-800 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold">
              {(profile.first_name?.[0] || profile.username?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {profile.first_name && profile.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile.username}
              </h2>
              <p className="text-gray-400 text-sm">@{profile.username}</p>
              {profile.is_premium && (
                <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-300">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Premium
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="px-6 py-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="First Name"
              value={form.first_name}
              editing={editing}
              onChange={(v) => setForm({ ...form, first_name: v })}
              placeholder="Enter first name"
            />
            <Field
              label="Last Name"
              value={form.last_name}
              editing={editing}
              onChange={(v) => setForm({ ...form, last_name: v })}
              placeholder="Enter last name"
            />
          </div>
          <Field
            label="Email"
            value={form.email}
            editing={editing}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
            placeholder="Enter email"
          />
          <Field label="Username" value={profile.username} editing={false} />
          <Field label="Member Since" value={profile.date_joined} editing={false} />
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <Link
            to="/change-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Change Password
          </Link>
          <div className="flex gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, editing, onChange, type = 'text', placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    {editing && onChange ? (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      />
    ) : (
      <p className="text-sm text-gray-900">{value || <span className="text-gray-400 italic">Not set</span>}</p>
    )}
  </div>
);

export default ProfilePage;
