import React, { useState, useEffect } from 'react';
import { Wrench, Users, User, LogOut, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Navbar({ currentUser, onOpenAuth, onOpenProfile, onOpenNetwork, onOpenAddTool }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [currentUser]);

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', currentUser.id)
      .single();

    if (data) {
      setProfile(data);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const displayName = profile?.full_name || currentUser?.email?.split('@')[0] || 'Profil';
  const avatarUrl = profile?.avatar_url;

  return (
    <>
      {/* Topprad / Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-800 text-base tracking-tight">ToolPool</span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Profil-visning i toppraden */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 p-1 pr-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Redigera profil"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate hidden sm:inline">
                  {displayName}
                </span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200" />

              {/* Logga ut-knapp */}
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Logga ut"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Logga in
            </button>
          )}
        </div>
      </header>

      {/* Bottenmeny för alla skärmstorlekar om man är inloggad */}
      {currentUser && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 pb-safe">
          <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between relative">
            {/* Grannar */}
            <button
              onClick={onOpenNetwork}
              className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer w-16"
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium">Grannar</span>
            </button>

            {/* Upphöjd Blå Plusknapp med text i mitten */}
            <div className="relative -top-3 flex flex-col items-center">
              <button
                onClick={onOpenAddTool}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 cursor-pointer mb-1"
                title="Lägg till verktyg"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[10px] font-semibold text-indigo-600">Nytt verktyg</span>
            </div>

            {/* Profil */}
            <button
              onClick={onOpenProfile}
              className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer w-16"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">Profil</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}