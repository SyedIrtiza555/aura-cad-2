import { useState } from 'react';
import { Button, Input } from './index';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  requireTypedText?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  description,
  itemName,
  requireTypedText,
  onConfirm,
  onClose,
  loading = false,
}: DeleteConfirmModalProps) {
  const [typedInput, setTypedInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireTypedText && typedInput.trim() !== requireTypedText) {
      setError(`Please type "${requireTypedText}" exactly to confirm.`);
      return;
    }
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-floating rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-white/90 bg-[#F5F5F7]">
        <div className="p-5 border-b border-slate-200/60 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1D21]">{title}</h3>
              <p className="text-xs text-[#6B7280]">Irreversible action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-[#1C1D21] p-1.5 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-[#4B5563] leading-relaxed">
            {description}
          </p>

          {itemName && (
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-800 break-all">
              {itemName}
            </div>
          )}

          {requireTypedText && (
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Type <strong className="text-rose-600">{requireTypedText}</strong> to confirm:
              </label>
              <Input
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder={requireTypedText}
                className="border-rose-200 focus:border-rose-500 focus:ring-rose-500"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
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
              type="button"
              variant="danger"
              size="sm"
              disabled={
                loading ||
                (Boolean(requireTypedText) && typedInput.trim() !== requireTypedText)
              }
              onClick={handleConfirm}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {loading ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
