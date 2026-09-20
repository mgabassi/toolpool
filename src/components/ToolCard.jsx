import React, { useState } from 'react';
import { Wrench, CheckCircle, XCircle, Camera, Loader2, UserCheck, Maximize2, Trash2, User, Handshake } from 'lucide-react';
import { ImageModal } from './ImageModal';

export function ToolCard({ tool, currentUser, onToggleStatus, onUpdateImage, onDeleteTool, onOpenLendModal }) {
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  
  const isOwner = currentUser && currentUser.id === tool.user_id;
  const isBorrower = currentUser && currentUser.id === tool.borrower_id;
  const canChangeStatus = isOwner || isBorrower || tool.is_available;

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    await onUpdateImage(tool.id, file);
    setUploading(false);
  }

  async function handleDelete() {
    if (window.confirm(`Är du säker på att du vill ta bort "${tool.title}"?`)) {
      setIsDeleting(true);
      await onDeleteTool(tool.id);
    }
  }

  function handleActionButtonClick() {
    if (tool.is_available) {
      if (isOwner) {
        onOpenLendModal(tool);
      } else {
        onToggleStatus(tool);
      }
    } else {
      onToggleStatus(tool);
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        {/* Bildsektion */}
        <div className="relative h-44 bg-slate-100 flex items-center justify-center border-b border-slate-100 group">
          {tool.image_url ? (
            <div 
              onClick={() => setIsImageOpen(true)}
              className="w-full h-full cursor-pointer relative overflow-hidden"
            >
              <img
                src={tool.image_url}
                alt={tool.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <Wrench className="w-8 h-8 opacity-40" />
              <span className="text-xs">Ingen bild</span>
            </div>
          )}

          {isOwner && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
              <label
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 p-2 rounded-xl shadow-md cursor-pointer transition-colors border border-slate-200"
                title="Ändra bild"
                onClick={(e) => e.stopPropagation()}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <Camera className="w-4 h-4 text-slate-600" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                title="Ta bort verktyg"
                className="bg-white/90 backdrop-blur-sm hover:bg-rose-50 hover:text-rose-600 text-slate-600 p-2 rounded-xl shadow-md transition-colors border border-slate-200 cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Innehållssektion */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {tool.category}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{tool.title}</h3>

            <div className="flex items-center gap-2 mb-3 mt-1.5">
              {tool.owner_avatar ? (
                <img
                  src={tool.owner_avatar}
                  alt={tool.owner_name}
                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <User className="w-3 h-3" />
                </div>
              )}
              <span className="text-xs font-medium text-slate-600">{tool.owner_name}</span>
            </div>

            <p className="text-slate-600 text-xs mb-3 line-clamp-2">{tool.description}</p>

            {!tool.is_available && tool.borrower_name && (
              <div className="text-xs text-amber-800 bg-amber-50/80 p-2 rounded-xl flex items-center gap-1.5 mb-3 border border-amber-100">
                <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Lånas av: <strong>{tool.borrower_name}</strong></span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {tool.is_available ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-700">Ledig</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-700">Utlånad</span>
                </>
              )}
            </div>

            {canChangeStatus ? (
              <button
                onClick={handleActionButtonClick}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  tool.is_available
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tool.is_available ? (
                  isOwner ? (
                    <>
                      <Handshake className="w-3.5 h-3.5" />
                      Låna ut
                    </>
                  ) : (
                    'Låna'
                  )
                ) : (
                  'Återlämna'
                )}
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                Utlånad
              </span>
            )}
          </div>
        </div>
      </div>

      <ImageModal
        isOpen={isImageOpen}
        imageUrl={tool.image_url}
        title={tool.title}
        onClose={() => setIsImageOpen(false)}
      />
    </>
  );
}