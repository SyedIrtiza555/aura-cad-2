import React, { useState } from 'react';
import { useUIStore } from '../../shared/store';
import { Button, Input, ImageCarousel } from '../../shared/ui';
import { PlusCircle, X, DollarSign, User, Phone, FileText, Image as ImageIcon, Gem } from 'lucide-react';
import type { Order, SpecimenType } from '../../shared/types';
import { SPECIMEN_TYPES, formatOrderCode } from '../../shared/formatters';

interface NewOrderModalProps {
  onCreateOrder: (order: Partial<Order>) => Promise<void>;
}

export function NewOrderModal({ onCreateOrder }: NewOrderModalProps) {
  const isNewOrderModalOpen = useUIStore((s) => s.isNewOrderModalOpen);
  const closeNewOrderModal = useUIStore((s) => s.closeNewOrderModal);
  const currentUser = useUIStore((s) => s.currentUser);

  // Mandatory fields
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');

  // Optional fields
  const [specimenType, setSpecimenType] = useState<SpecimenType>('Ring');
  const [clientPhone, setClientPhone] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [projectBrief, setProjectBrief] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isNewOrderModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    setSubmitting(true);

    try {
      const generatedCode = formatOrderCode(undefined, clientName.trim(), title.trim());

      await onCreateOrder({
        orderNumber: generatedCode,
        title: title.trim(),
        client_name: clientName.trim(),
        specimen_type: specimenType,
        client_phone: clientPhone.trim() || undefined,
        agreed_price: parseFloat(agreedPrice) || 0,
        project_brief: projectBrief.trim() || `${specimenType} design brief`,
        images: images.length > 0 ? images : undefined,
        status: 'Inbox',
        sales_agent_id: currentUser?.uid || 'anonymous',
        sales_agent_name: currentUser?.displayName || 'Sales Agent',
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      // Reset form
      setTitle('');
      setClientName('');
      setSpecimenType('Ring');
      setClientPhone('');
      setAgreedPrice('');
      setProjectBrief('');
      setImages([]);
      closeNewOrderModal();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Client Order Intake</h3>
              <p className="text-xs text-slate-400">
                Register a new client engagement into the Aura Desk pipeline.
              </p>
            </div>
          </div>
          <button
            onClick={closeNewOrderModal}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Mandatory: Order Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
              <span>Order Title / Design Description *</span>
              <span className="text-[10px] text-amber-400 font-mono">Required</span>
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Three Stone Platinum Halo Ring"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Mandatory: Client Name & Optional: Specimen Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Client Name *
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Required</span>
              </label>
              <Input
                type="text"
                required
                placeholder="Patrick Archer"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5 text-slate-400" /> Specimen / Project Type
              </label>
              <select
                value={specimenType}
                onChange={(e) => setSpecimenType(e.target.value as SpecimenType)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              >
                {SPECIMEN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional: Phone & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Client Phone (WhatsApp)
                </span>
                <span className="text-[10px] text-slate-500">Optional</span>
              </label>
              <Input
                type="tel"
                placeholder="+1 555-0199"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Agreed Price ($ USD)
                </span>
                <span className="text-[10px] text-slate-500">Optional</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="1450.00"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Optional: Project Brief */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Project Brief & Specifications
              </span>
              <span className="text-[10px] text-slate-500">Optional</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detail metal alloy, prong settings, stone dimensions, target delivery date..."
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Optional: Reference Pictures (Up to 5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Reference Pictures (Optional, Up to 5)
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {images.length}/5
              </span>
            </div>
            <ImageCarousel
              images={images}
              onDelete={(idx) => setImages((prev) => prev.filter((_, i) => i !== idx))}
              onAddImages={(newImgs) => setImages((prev) => [...prev, ...newImgs].slice(0, 5))}
              maxImages={5}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeNewOrderModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || !title.trim() || !clientName.trim()}
            >
              {submitting ? 'Submitting...' : 'Register Order (Inbox)'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
