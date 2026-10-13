import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isTauri } from '../../shared/notifications';
import { DownloadCloud, RefreshCw, X } from 'lucide-react';
import { Button } from '../../shared/ui';

export function UpdaterBanner() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [version, setVersion] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (!isTauri()) return;

    async function checkForUpdates() {
      try {
        const update = await check();
        if (update?.available) {
          setUpdateAvailable(true);
          setVersion(update.version);
        }
      } catch (err) {
        console.warn('[Aura Desk] Auto-updater check failed:', err);
      }
    }

    checkForUpdates();
    // Re-check periodically every 2 hours
    const interval = setInterval(checkForUpdates, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!updateAvailable || isDismissed) return null;

  const handleInstallUpdate = async () => {
    try {
      setIsUpdating(true);
      const update = await check();
      if (update?.available) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } catch (err) {
      console.error('[Aura Desk] Update install failed:', err);
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border-b border-indigo-700/60 px-4 py-2 flex items-center justify-between text-xs sm:text-sm text-indigo-100">
      <div className="flex items-center gap-2">
        <DownloadCloud className="w-4 h-4 text-indigo-300 animate-pulse" />
        <span>
          A new version of <strong>Aura Desk</strong> (v{version}) is ready to install.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={handleInstallUpdate}
          disabled={isUpdating}
          className="bg-indigo-500 hover:bg-indigo-400 text-xs py-1 px-3"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              Updating...
            </>
          ) : (
            'Update & Restart'
          )}
        </Button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-indigo-300 hover:text-white p-1 rounded transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
