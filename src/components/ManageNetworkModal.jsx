import React, { useState, useEffect } from 'react';
import { X, Users, Check, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ManageNetworkModal({ isOpen, onClose, currentUser }) {
  const [allUsers, setAllUsers] = useState([]);
  const [trustedUserIds, setTrustedUserIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchNetworkData();
    }
  }, [isOpen, currentUser]);

  async function fetchNetworkData() {
    setLoading(true);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url');

    const otherProfiles = (profiles || []).filter((p) => p.id !== currentUser.id);
    setAllUsers(otherProfiles);

    const { data: trusted } = await supabase
      .from('trusted_users')
      .select('trusted_user_id')
      .eq('owner_id', currentUser.id);

    const trustedIds = (trusted || []).map((t) => t.trusted_user_id);
    setTrustedUserIds(trustedIds);

    setLoading(false);
  }

  async function toggleTrust(targetUserId) {
    const isTrusted = trustedUserIds.includes(targetUserId);

    if (isTrusted) {
      setTrustedUserIds((prev) => prev.filter((id) => id !== targetUserId));
      await supabase
        .from('trusted_users')
        .delete()
        .eq('owner_id', currentUser.id)
        .eq('trusted_user_id', targetUserId);
    } else {
      setTrustedUserIds((prev) => [...prev, targetUserId]);
      await supabase
        .from('trusted_users')
        .insert([{ owner_id: currentUser.id, trusted_user_id: targetUserId }]);
    }
  }

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl relative cursor-default"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Hantera grannar</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-500 text-xs my-3">
          Välj vilka grannar som får se och låna dina verktyg.
        </p>

        {loading ? (
          <p className="text-slate-400 text-xs py-4 text-center">Laddar grannar...</p>
        ) : allUsers.length === 0 ? (
          <p className="text-slate-400 text-xs py-4 text-center">Inga andra grannar har registrerat sig ännu.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {allUsers.map((user) => {
              const isTrusted = trustedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">
                        {user.full_name?.[0]?.toUpperCase() || 'G'}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-700">
                      {user.full_name || 'Anonym granne'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleTrust(user.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      isTrusted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isTrusted ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Betrodd
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-slate-400" /> Lägg till
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
}