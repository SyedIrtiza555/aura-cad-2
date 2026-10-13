import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Maximize2,
  X,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';

interface ImageCarouselProps {
  images?: string[];
  compact?: boolean;
  className?: string;
  onDelete?: (index: number) => void;
  onAddImages?: (newImages: string[]) => void;
  maxImages?: number;
}

export function ImageCarousel({
  images = [],
  compact = false,
  className = '',
  onDelete,
  onAddImages,
  maxImages = 5,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const safeIndex = images.length > 0 ? Math.min(activeIndex, images.length - 1) : 0;
  const currentImage = images[safeIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(index);
      if (safeIndex >= images.length - 1 && safeIndex > 0) {
        setActiveIndex(safeIndex - 1);
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const { processImageUploads } = await import('../images');
    const newImgs = await processImageUploads(e.target.files, images.length, maxImages);
    if (newImgs.length > 0 && onAddImages) {
      onAddImages(newImgs);
    }
    e.target.value = '';
  };

  // Compact Thumbnail View (e.g. for Cards Grid & Table View)
  if (compact) {
    if (!images || images.length === 0) {
      return (
        <div
          className={`w-full h-32 rounded-2xl bg-slate-100 border border-slate-200/80 flex flex-col items-center justify-center text-slate-400 select-none ${className}`}
        >
          <ImageIcon className="w-6 h-6 stroke-[1.5] text-slate-300 mb-1" />
          <span className="text-[10px] font-medium text-slate-400">No images</span>
        </div>
      );
    }

    return (
      <div
        className={`relative w-full h-36 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 group select-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage}
          alt={`Thumbnail ${safeIndex + 1}`}
          className="w-full h-full object-cover object-center transition-all duration-300"
        />

        {/* Counter Badge */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-medium">
            {safeIndex + 1}/{images.length}
          </div>
        )}

        {/* Next/Prev Navigation Buttons for cards */}
        {images.length > 1 && (
          <div className="absolute inset-y-0 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePrev}
              title="Previous picture"
              className="p-1 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-sm transition-transform active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              title="Next picture"
              className="p-1 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-sm transition-transform active:scale-95"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dots indicator at bottom */}
        {images.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === safeIndex
                    ? 'bg-white w-3'
                    : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full / Expanded Carousel View (e.g. for Order Detail & User Gallery)
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Preview Box */}
      {images.length > 0 ? (
        <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-inner group select-none flex items-center justify-center">
          <img
            src={currentImage}
            alt={`Order reference ${safeIndex + 1}`}
            className="w-full h-full object-contain object-center"
          />

          {/* Overlay controls */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-xs font-medium">
              {safeIndex + 1} / {images.length}
            </span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={() => setFullscreenOpen(true)}
              title="Full Screen Preview"
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {onDelete && (
              <button
                onClick={(e) => handleDelete(e, safeIndex)}
                title="Remove this image"
                className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white backdrop-blur-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Prev / Next Chevrons */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                title="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/80 hover:bg-white text-slate-800 shadow-md backdrop-blur-md transition-transform active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                title="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/80 hover:bg-white text-slate-800 shadow-md backdrop-blur-md transition-transform active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === safeIndex ? 'w-5 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
          <ImageIcon className="w-8 h-8 stroke-[1.5] text-slate-300 mb-2" />
          <div className="text-xs font-semibold text-slate-600">No Pictures Uploaded Yet</div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Add up to {maxImages} reference CAD or jewelry renders for this order.
          </p>
        </div>
      )}

      {/* Thumbnails strip & Upload button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`relative w-14 h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${
              i === safeIndex
                ? 'border-[#1C1D21] ring-2 ring-[#1C1D21]/20 scale-105'
                : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
            }`}
          >
            <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}

        {/* Upload slot button if under maxImages */}
        {onAddImages && images.length < maxImages && (
          <label className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1C1D21] bg-white hover:bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 text-slate-400 hover:text-[#1C1D21]">
            <Plus className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-medium font-mono leading-none">
              {images.length}/{maxImages}
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setFullscreenOpen(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <span className="text-white text-xs font-mono font-medium">
              {safeIndex + 1} of {images.length}
            </span>
            <button
              onClick={() => setFullscreenOpen(false)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <img
            src={currentImage}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none">
              <button
                onClick={handlePrev}
                className="pointer-events-auto p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="pointer-events-auto p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
