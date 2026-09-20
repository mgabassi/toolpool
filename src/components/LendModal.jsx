import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';

export function LendModal({ isOpen, onClose, tool, trustedNeighbors, onLend }) {
  const [selectedUserId, setSelectedUserId] = useState('');

  if (!isOpen || !tool) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const neighbor = trustedNeighbors.find((n) => n.id === selectedUserId);
    if (neighbor) {
      onLend(tool, neighbor.id, neighbor.full_name);
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
          <h3 className="font-bold text-slate-800">Låna ut {tool.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Välj vem du vill låna ut till:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a neighbor...</option>
              {trustedNeighbors.map((neighbor) => (
                <option key={neighbor.id} value={neighbor.id}>
                  {neighbor.full_name || 'Anonym granne'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!selectedUserId}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" /> Låna ut
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}