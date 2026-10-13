import React, { useState, useEffect } from 'react';
import type { UserProfile, UserRole, UserStatus } from '../../shared/types';
import { Button, Input, Badge, ImageCarousel } from '../../shared/ui';
import { X, Trash2, Shield, AlertTriangle, Check, UserCheck, Image as ImageIcon } from 'lucide-react';

interface EditUserModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<UserProfile> & { uid: string }) => Promise<void>;
  onDelete: (uid: string) => Promise<void>;
  isCurrentSuperOwner: boolean;
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isCurrentSuperOwner,
}: EditUserModalProps) {
  if (!isOpen || !user) return null;

  const isTargetRootOwner = user.email?.toLowerCase().includes('shahrukh');

  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [username, setUsername] = useState(user.username || '');
  const [initials, setInitials] = useState(user.initials || '');
  const [photos, setPhotos] = useState<string[]>(
    user.photos || (user.photoUrl ? [user.photoUrl] : [])
  );
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setUsername(user.username || user.email?.split('@')[0] || '');
      setInitials(user.initials || (user.displayName || 'U').slice(0, 2).toUpperCase());
      setPhotos(user.photos || (user.photoUrl ? [user.photoUrl] : []));
      setRole(user.role);
      setStatus(user.status);
      setConfirmDelete(false);
      setDeleteInput('');
      setError(null);
    }
  }, [user]);

  const handleNameChange = (name: string) => {
    setDisplayName(name);
    // Auto-suggest initials if empty or matches previous
    const parts = name.trim().split(' ');
    const autoInitials = parts.map((p) => p[0]?.toUpperCase()).slice(0, 2).join('');
    if (autoInitials) {
      setInitials(autoInitials);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        uid: user.uid,
        displayName: displayName.trim(),
        email: email.trim(),
        username: username.trim() || email.trim().split('@')[0],
        initials: (initials.trim() || displayName.slice(0, 2)).toUpperCase(),
        photoUrl: photos[0] || '',
        photos: photos.length > 0 ? photos : [],
        role: isTargetRootOwner ? 'owner' : role,
        status: isTargetRootOwner ? 'active' : status,
      });
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (isTargetRootOwner) {
      setError('Root owner account cannot be deleted.');
      return;
    }

    setLoading(true);
    try {
      await onDelete(user.uid);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to delete user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-floating rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/90">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/60 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#1C1D21] flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1C1D21] flex items-center gap-2">
                Edit Team Member Profile
                {isTargetRootOwner && (
                  <Badge variant="default" className="text-[9px]">Root Owner</Badge>
                )}
              </h2>
              <p className="text-xs text-[#6B7280]">
                Modify credentials, display names, and agency role access.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#1C1D21] p-1.5 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {!confirmDelete ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Member Pictures & Carousel */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-[#6B7280] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Member Photos / Portfolio (Up to 5)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {photos.length}/5
                  </span>
                </div>
                <ImageCarousel
                  images={photos}
                  onDelete={(idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  onAddImages={(newImgs) => setPhotos((prev) => [...prev, ...newImgs].slice(0, 5))}
                  maxImages={5}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Full Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="e.g. Farooq Ahmed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Username / Handle
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. farooq_cad"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@auradesk.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Initials (Avatar)
                  </label>
                  <Input
                    value={initials}
                    maxLength={3}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    placeholder="FA"
                    className="font-mono text-center uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Agency Role
                  </label>
                  {isTargetRootOwner ? (
                    <div className="text-xs px-3 py-2 bg-slate-100 rounded-xl text-slate-700 font-medium border border-slate-200">
                      Owner (Root Privileges)
                    </div>
                  ) : (
                    <select
                      value={role}
                      disabled={loading || !isCurrentSuperOwner}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:outline-none focus:border-[#1C1D21]"
                    >
                      <option value="unassigned">Unassigned</option>
                      <option value="sales_agent">Sales Agent</option>
                      <option value="designer">Designer</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Account Status
                  </label>
                  {isTargetRootOwner ? (
                    <div className="text-xs px-3 py-2 bg-emerald-50 rounded-xl text-emerald-800 font-medium border border-emerald-200 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Active
                    </div>
                  ) : (
                    <select
                      value={status}
                      disabled={loading || !isCurrentSuperOwner}
                      onChange={(e) => setStatus(e.target.value as UserStatus)}
                      className="w-full bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:outline-none focus:border-[#1C1D21]"
                    >
                      <option value="pending_approval">Pending Approval</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between gap-3">
                {!isTargetRootOwner && isCurrentSuperOwner ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete User
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={loading}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            /* Danger Zone Confirmation */
            <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Permanent User Deletion
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                You are about to permanently delete <strong>{user.displayName}</strong> ({user.email}).
                Their access will be revoked immediately and this action cannot be undone.
              </p>
              <div>
                <label className="block text-[11px] font-medium text-rose-800 mb-1">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="border-rose-300 focus:border-rose-600 focus:ring-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={deleteInput !== 'DELETE' || loading}
                  onClick={handleDeleteUser}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  {loading ? 'Deleting...' : 'Permanently Delete'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
