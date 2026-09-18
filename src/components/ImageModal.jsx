import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function ImageModal({ isOpen, imageUrl, title, onClose }) {
  // Stäng om man trycker på Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 rounded-full transition-colors cursor-pointer"
          title="Stäng (Esc)"
        >
          <X className="w-7 h-7" />
        </button>

        <img
          src={imageUrl}
          alt={title}
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
        />

        {title && (
          <p className="mt-3 text-white text-sm font-medium tracking-wide bg-slate-900/60 px-4 py-1.5 rounded-full backdrop-blur-sm">
            {title}
          </p>
        )}
      </div>
    </div>
  );
}