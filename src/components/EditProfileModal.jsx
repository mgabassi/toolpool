import React, { useState, useEffect } from 'react';
import { X, User, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function EditProfileModal({ isOpen, onClose, currentUser }) {
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Hämta befintlig profil när modalen öppnas
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchProfile();
    }
  }, [isOpen, currentUser]);

  async function fetchProfile() {
    setFetching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (!error && data) {
      setFullName(data.full_name || '');
      setAvatarUrl(data.avatar_url || '');
      setPreviewUrl(data.avatar_url || '');
    } else {
      // Om ingen profil finns ännu, använd e-postens namn som standard
      setFullName(currentUser.email?.split('@')[0] || '');
    }
    setFetching(false);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    let newAvatarUrl = avatarUrl;

    // Om användaren valt en ny profilbild, ladda upp till Supabase Storage
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tool-images')
        .upload(filePath, imageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('tool-images')
          .getPublicUrl(filePath);
        newAvatarUrl = urlData.publicUrl;
      }
    }

    // Spara eller uppdatera i tabellen profiles
    const { error } = await supabase.from('profiles').upsert({
      id: currentUser.id,
      full_name: fullName,
      avatar_url: newAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);

    if (!error) {
      // Uppdatera även namnet på alla verktyg som användaren äger så att det syns överallt
      await supabase
        .from('tools')
        .update({ owner_name: fullName, owner_avatar: newAvatarUrl })
        .eq('user_id', currentUser.id);

      onClose();
      window.location.reload(); // Laddar om för att läsa in nya profilnamnet
    } else {
      alert('Kunde inte spara profilen: ' + error.message);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-6">Redigera Profil</h2>

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Hämtar profildata...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profilbild */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-24 h-24 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center overflow-hidden group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-indigo-400" />
                )}

                <label className="absolute inset-0 bg-slate-900/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-medium">
                  <Upload className="w-5 h-5 mb-1" />
                  Ändra
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <label className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">
                Välj profilbild
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Namnfält */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ditt namn
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="T.ex. Michael Svensson"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Knappar */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sparar...</span>
                  </>
                ) : (
                  <span>Spara</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}