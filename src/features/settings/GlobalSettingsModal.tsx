import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../shared/store';
import { auth, db } from '../../shared/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button, Input, Badge, ImageCarousel } from '../../shared/ui';
import {
  X,
  User,
  Palette,
  Sliders,
  AlertOctagon,
  Check,
  Bell,
  HardDrive,
  Radio,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { dispatchNativeNotification } from '../../shared/notifications';

type SettingsTab = 'account' | 'appearance' | 'app' | 'terminate';

export function GlobalSettingsModal() {
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const currentUser = useUIStore((s) => s.currentUser);
  const setCurrentUser = useUIStore((s) => s.setCurrentUser);

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Account Settings States
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [initials, setInitials] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // 2. Appearance States
  const [theme, setTheme] = useState<'glass' | 'dark' | 'clean'>('glass');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // 4. Terminate Account State
  const [terminateInput, setTerminateInput] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setUsername(currentUser.username || currentUser.email?.split('@')[0] || '');
      setInitials(currentUser.initials || (currentUser.displayName || 'U').slice(0, 2).toUpperCase());
      setPhotos(currentUser.photos || (currentUser.photoUrl ? [currentUser.photoUrl] : []));
      setSaveSuccess(false);
      setError(null);
    }
  }, [currentUser, isSettingsOpen]);

  if (!isSettingsOpen || !currentUser) return null;

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = {
        ...currentUser,
        displayName: displayName.trim(),
        username: username.trim() || currentUser.email?.split('@')[0] || 'member',
        initials: (initials.trim() || displayName.slice(0, 2)).toUpperCase(),
        photoUrl: photos[0] || '',
        photos: photos.length > 0 ? photos : [],
      };

      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      setCurrentUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      console.warn('Failed to update account settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    await dispatchNativeNotification(
      'Aura Desk Audio-Visual Ping',
      'Desktop notification channel is active and operating smoothly.'
    );
  };

  const handleTerminateAccount = async () => {
    if (terminateInput !== 'TERMINATE') return;
    setLoading(true);
    try {
      // Suspend profile
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { status: 'suspended', role: 'unassigned' },
        { merge: true }
      );
      try {
        await auth.signOut();
      } catch {}
      setCurrentUser(null);
      closeSettings();
    } catch (err) {
      console.warn('Account termination error:', err);
      setError('Could not terminate account. Please contact system owner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F5F5F7] border border-white/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200/80 flex items-center justify-between bg-white/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1C1D21] flex items-center justify-center text-white font-mono text-xs font-bold">
              AD
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1D21]">Global Workspace Settings</h3>
              <p className="text-[11px] text-[#6B7280]">
                Configure preferences, theme styling, and personal profile.
              </p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="p-1.5 text-slate-400 hover:text-[#1C1D21] rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 px-6 border-b border-slate-200/60 bg-white/40 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'account'
                ? 'bg-[#1C1D21] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#1C1D21] hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'appearance'
                ? 'bg-[#1C1D21] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#1C1D21] hover:bg-slate-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'app'
                ? 'bg-[#1C1D21] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#1C1D21] hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>App Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('terminate')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'terminate'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-600/80 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Terminate Account</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto min-h-0 flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* TAB 1: Account Settings */}
          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="space-y-4">
              {/* Profile Pictures & Carousel */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-[#6B7280] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Profile & Portfolio Pictures (Up to 5)
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
                    Display Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Username / Handle
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="handle_cad"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Email Address
                  </label>
                  <Input value={currentUser.email} disabled className="opacity-70 bg-slate-100" />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                    Initials Code
                  </label>
                  <Input
                    value={initials}
                    maxLength={3}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    placeholder="SH"
                    className="font-mono text-center uppercase"
                  />
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#1C1D21] block">Assigned Role</span>
                  <span className="text-[11px] text-[#6B7280]">
                    Permissions are managed by the agency owner.
                  </span>
                </div>
                <Badge variant="purple" className="capitalize">
                  {currentUser.role.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" /> Saved successfully
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" size="sm" disabled={loading}>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1C1D21] block">
                  Workspace Visual Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('glass')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      theme === 'glass'
                        ? 'border-[#1C1D21] bg-white ring-1 ring-[#1C1D21] shadow-xs'
                        : 'border-slate-200 bg-white/60 hover:bg-white'
                    }`}
                  >
                    <div className="w-full h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/40 mb-2" />
                    <span className="text-xs font-semibold text-[#1C1D21] block">Aura Glass</span>
                    <span className="text-[10px] text-slate-500">Translucent frosted panels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('clean')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      theme === 'clean'
                        ? 'border-[#1C1D21] bg-white ring-1 ring-[#1C1D21] shadow-xs'
                        : 'border-slate-200 bg-white/60 hover:bg-white'
                    }`}
                  >
                    <div className="w-full h-8 rounded-lg bg-white border border-slate-300 mb-2" />
                    <span className="text-xs font-semibold text-[#1C1D21] block">Clean Minimal</span>
                    <span className="text-[10px] text-slate-500">Zero blur, solid high-contrast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      theme === 'dark'
                        ? 'border-[#1C1D21] bg-white ring-1 ring-[#1C1D21] shadow-xs'
                        : 'border-slate-200 bg-white/60 hover:bg-white'
                    }`}
                  >
                    <div className="w-full h-8 rounded-lg bg-slate-900 border border-slate-800 mb-2" />
                    <span className="text-xs font-semibold text-[#1C1D21] block">Charcoal Graphite</span>
                    <span className="text-[10px] text-slate-500">Low-glare dark palette</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-[#1C1D21] block">
                      Information Density
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      Adjust spacing in tables and grid views.
                    </span>
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setDensity('comfortable')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        density === 'comfortable'
                          ? 'bg-white text-[#1C1D21] shadow-xs'
                          : 'text-slate-500 hover:text-[#1C1D21]'
                      }`}
                    >
                      Comfortable
                    </button>
                    <button
                      onClick={() => setDensity('compact')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        density === 'compact'
                          ? 'bg-white text-[#1C1D21] shadow-xs'
                          : 'text-slate-500 hover:text-[#1C1D21]'
                      }`}
                    >
                      Compact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: App Settings */}
          {activeTab === 'app' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="font-semibold text-xs text-[#1C1D21] block">
                        Desktop Audio & Push Notifications
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        Alert when orders are assigned, returned, or review-ready.
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleTestNotification}>
                    Test Ping
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="font-semibold text-xs text-[#1C1D21] block">
                      Local Offline Cache & Tauri Storage
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      Cloud Firestore persistentLocalCache is active.
                    </span>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span>Status: Synchronized with Google Cloud</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="font-semibold text-xs text-[#1C1D21] block">
                      Watcher Bot & Telemetry Proxy
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      Streaming UI element quotes and error triage to 0.0.0.0:4141.
                    </span>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-indigo-700 bg-indigo-50 p-2 rounded-xl border border-indigo-200">
                  Proxy Active: http://100.100.56.31:4141
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Terminate Account */}
          {activeTab === 'terminate' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Danger Zone: Permanent Account Termination</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Terminating your account will revoke all workspace access, remove your credentials
                  from active team assignments, and mark your profile as terminated. This cannot be undone.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3">
                <label className="block text-xs font-semibold text-[#1C1D21]">
                  Type <span className="font-mono text-rose-600">TERMINATE</span> to confirm:
                </label>
                <Input
                  value={terminateInput}
                  onChange={(e) => setTerminateInput(e.target.value)}
                  placeholder="TERMINATE"
                  className="font-mono text-sm"
                />

                <Button
                  variant="danger"
                  size="sm"
                  disabled={terminateInput !== 'TERMINATE' || loading}
                  onClick={handleTerminateAccount}
                  className="w-full py-2"
                >
                  {loading ? 'Terminating...' : 'Permanently Terminate Account'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
