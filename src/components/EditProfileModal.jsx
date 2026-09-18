import React, { useState, useEffect } from 'react';
import { X, Camera, User, Loader2 } from 'lucide-react';
import { compressImage } from '../lib/imageCompressor';
import { supabase } from '../lib/supabase';

export function EditProfileModal({ isOpen, onClose, currentUser, userProfile, onProfileUpdated }) {
  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setAvatarPreview(userProfile.avatar_url || null);
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    let avatarUrl = userProfile?.avatar_url || null;

    if (avatarFile) {
      const compressed = await compressImage(avatarFile, 400, 0.8);
      const fileName = `avatar_${currentUser.id}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('tool-images')
        .upload(fileName, compressed, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from('tool-images').getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (!error) {
      onProfileUpdated();
      onClose();
    }
  }

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl relative cursor-default"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Redigera Profil</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center overflow-hidden mb-2">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-indigo-400" />
              )}
              <label className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <label className="text-xs font-semibold text-indigo-600 cursor-pointer">
              {avatarPreview ? 'Ändra profilbild' : 'Välj profilbild'}
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ditt namn</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="T.ex. Anna Svensson"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Spara'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}