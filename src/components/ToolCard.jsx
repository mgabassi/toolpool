import React from 'react';
import { Camera, Trash2, Pencil, User } from 'lucide-react';

export function ToolCard({
  tool,
  currentUser,
  onToggleStatus,
  onUpdateImage,
  onDeleteTool,
  onEditTool,
  onOpenLendModal,
}) {
  const isOwner = currentUser?.id === tool.user_id;

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      onUpdateImage(tool.id, file);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md">
      <div>
        {/* Bildsektion med actionknappar */}
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {tool.image_url ? (
            <img src={tool.image_url} alt={tool.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <span className="text-xs font-medium">Ingen bild</span>
            </div>
          )}

          {/* Knappar i övre högra hörnet för ägaren */}
          {isOwner && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/50">
              {/* Kamera-knapp */}
              <label
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer transition-colors"
                title="Byt bild"
              >
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {/* Penn-knapp för redigering */}
              <button
                onClick={() => onEditTool(tool)}
                className="p-2 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer"
                title="Redigera verktyg"
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Papperskorgs-knapp */}
              <button
                onClick={() => onDeleteTool(tool.id)}
                className="p-2 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                title="Ta bort verktyg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Kategori-tagg */}
          <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {tool.category}
          </div>
        </div>

        {/* Innehåll */}
        <div className="p-4">
          <h3 className="font-bold text-slate-800 text-sm mb-1">{tool.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[32px]">
            {tool.description || 'Ingen beskrivning angiven.'}
          </p>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
              {tool.owner_avatar ? (
                <img src={tool.owner_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-xs text-slate-600 font-medium truncate">{tool.owner_name}</span>
          </div>
        </div>
      </div>

      {/* Status & Knappar längst ned */}
      <div className="p-4 pt-0">
        {tool.is_available ? (
          <div className="flex gap-2">
            {isOwner ? (
              <button
                onClick={() => onOpenLendModal(tool)}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Låna ut till granne
              </button>
            ) : (
              <button
                onClick={() => onToggleStatus(tool)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Jag vill låna
              </button>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 text-center">
            <p className="text-[11px] font-medium text-amber-800">
              Utlånad till <span className="font-bold">{tool.borrower_name || 'En granne'}</span>
            </p>
            {(isOwner || currentUser?.id === tool.borrower_id) && (
              <button
                onClick={() => onToggleStatus(tool)}
                className="mt-1.5 text-[11px] font-semibold text-amber-900 underline hover:no-underline cursor-pointer"
              >
                Märk som återlämnad
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}