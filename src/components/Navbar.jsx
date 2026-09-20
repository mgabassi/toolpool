import React, { useState } from 'react';
import { Wrench, User, LogIn, LogOut, Users } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { EditProfileModal } from './EditProfileModal';
import { ManageNetworkModal } from './ManageNetworkModal';

export function Navbar({ currentUser }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-lg">ToolPool</span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => setIsNetworkOpen(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Hantera grannar"
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Grannar</span>
                </button>

                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Profil"
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Profil</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Logga in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <EditProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} currentUser={currentUser} />
      <ManageNetworkModal isOpen={isNetworkOpen} onClose={() => setIsNetworkOpen(false)} currentUser={currentUser} />
    </>
  );
}