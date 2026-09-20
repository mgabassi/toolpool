import React, { useState } from 'react';
import { Wrench, User, LogIn, Users, Home } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { EditProfileModal } from './EditProfileModal';
import { ManageNetworkModal } from './ManageNetworkModal';

export function Navbar({ currentUser }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);

  return (
    <>
      {/* Top Navbar med extra marginal för kameraö/notch */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 pt-10 sm:pt-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-lg">ToolPool</span>
          </div>

          {/* Dator-meny */}
          <div className="hidden sm:flex items-center gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => setIsNetworkOpen(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Grannar</span>
                </button>

                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Profil</span>
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

          {/* Mobil inloggningsknapp i toppen om utloggad */}
          {!currentUser && (
            <div className="sm:hidden">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Logga in</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobil Bottenmeny (Fixed Bottom) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-6 py-2 flex justify-around items-center shadow-lg">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-600 cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Hem</span>
        </button>

        {currentUser ? (
          <>
            <button
              onClick={() => setIsNetworkOpen(true)}
              className="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-600 cursor-pointer"
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium">Grannar</span>
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-600 cursor-pointer"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">Profil</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex flex-col items-center gap-1 text-indigo-600 font-semibold cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            <span className="text-[10px]">Logga in</span>
          </button>
        )}
      </nav>

      {/* Modaler */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <EditProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} currentUser={currentUser} />
      <ManageNetworkModal isOpen={isNetworkOpen} onClose={() => setIsNetworkOpen(false)} currentUser={currentUser} />
    </>
  );
}