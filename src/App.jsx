import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { ToolCard } from './components/ToolCard';
import { AddToolModal } from './components/AddToolModal';
import { LendModal } from './components/LendModal';
import { AuthModal } from './components/AuthModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ManageNetworkModal } from './components/ManageNetworkModal';
import { Search, Plus, Filter, Loader2, Wrench } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [trustedNeighbors, setTrustedNeighbors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter-states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modaler
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lendModalTool, setLendModalTool] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    fetchInitialData();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchTrustedNeighbors();
    }
  }, [currentUser]);

  async function fetchInitialData() {
    setLoading(true);
    await Promise.all([fetchTools(), fetchProfiles()]);
    setLoading(false);
  }

  async function fetchTools() {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setTools(data);
  }

  async function fetchProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) setProfiles(data);
  }

  async function fetchTrustedNeighbors() {
    if (!currentUser) return;

    const { data: trusted } = await supabase
      .from('trusted_users')
      .select('trusted_user_id')
      .eq('owner_id', currentUser.id);

    if (trusted && trusted.length > 0) {
      const ids = trusted.map((t) => t.trusted_user_id);
      const { data: neighborProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ids);

      setTrustedNeighbors(neighborProfiles || []);
    } else {
      setTrustedNeighbors([]);
    }
  }

  async function handleAddTool(toolData, imageFile) {
    if (!currentUser) return;

    let imageUrl = null;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tool-images')
        .upload(filePath, imageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('tool-images')
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }

    const userProfile = profiles.find((p) => p.id === currentUser.id);

    const newTool = {
      ...toolData,
      user_id: currentUser.id,
      owner_name: userProfile?.full_name || currentUser.email?.split('@')[0] || 'Anonym',
      owner_avatar: userProfile?.avatar_url || null,
      image_url: imageUrl,
      is_available: true,
    };

    const { error } = await supabase.from('tools').insert([newTool]);

    if (!error) fetchTools();
  }

  async function handleUpdateImage(toolId, imageFile) {
    if (!currentUser || !imageFile) return;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${currentUser.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tool-images')
      .upload(filePath, imageFile);

    if (uploadError) return;

    const { data: urlData } = supabase.storage
      .from('tool-images')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('tools')
      .update({ image_url: urlData.publicUrl })
      .eq('id', toolId);

    if (!updateError) fetchTools();
  }

  async function handleDeleteTool(toolId) {
    const { error } = await supabase.from('tools').delete().eq('id', toolId);
    if (!error) fetchTools();
  }

  async function handleToggleStatus(tool) {
    if (!currentUser) return;

    const userProfile = profiles.find((p) => p.id === currentUser.id);
    const borrowerName = userProfile?.full_name || currentUser.email?.split('@')[0] || 'Anonym';
    const willBeAvailable = !tool.is_available;

    const { error } = await supabase
      .from('tools')
      .update({
        is_available: willBeAvailable,
        borrower_id: willBeAvailable ? null : currentUser.id,
        borrower_name: willBeAvailable ? null : borrowerName,
      })
      .eq('id', tool.id);

    if (!error) fetchTools();
  }

  async function handleLendToNeighbor(tool, borrowerId, borrowerName) {
    const { error } = await supabase
      .from('tools')
      .update({
        is_available: false,
        borrower_id: borrowerId,
        borrower_name: borrowerName,
      })
      .eq('id', tool.id);

    if (!error) fetchTools();
  }

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const titleMatch = tool.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = tool.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = tool.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const ownerMatch = tool.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSearch = titleMatch || descMatch || categoryMatch || ownerMatch;
      const matchesOwner = selectedOwner === 'all' || tool.owner_name === selectedOwner;
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === 'lent_out') {
        matchesStatus = tool.user_id === currentUser?.id && !tool.is_available;
      } else if (statusFilter === 'borrowed_by_me') {
        matchesStatus = tool.borrower_id === currentUser?.id && !tool.is_available;
      }

      return matchesSearch && matchesOwner && matchesCategory && matchesStatus;
    });
  }, [tools, searchQuery, selectedOwner, selectedCategory, statusFilter, currentUser]);

  const uniqueOwners = useMemo(() => {
    const owners = tools.map((t) => t.owner_name).filter(Boolean);
    return ['all', ...Array.from(new Set(owners))];
  }, [tools]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 sm:pb-12">
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNetwork={() => setIsNetworkOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 pt-6">
        {/* Sök och Lägg till */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Sök verktyg, ägare eller kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          {currentUser && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Lägg till verktyg</span>
            </button>
          )}
        </div>

        {/* Filter-sektion */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Alla verktyg
            </button>
            {currentUser && (
              <>
                <button
                  onClick={() => setStatusFilter('lent_out')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === 'lent_out'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Mina utlånade verktyg
                </button>
                <button
                  onClick={() => setStatusFilter('borrowed_by_me')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === 'borrowed_by_me'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Verktyg jag lånat
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="flex-1 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Ägare:</label>
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Alla ägare</option>
                {uniqueOwners
                  .filter((o) => o !== 'all')
                  .map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Kategori:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Alla kategorier</option>
                <option value="Trädgård">Trädgård</option>
                <option value="Bygg & El">Bygg & El</option>
                <option value="Handverktyg">Handverktyg</option>
                <option value="Städ & Rengöring">Städ & Rengöring</option>
                <option value="Övrigt">Övrigt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Verktygslista */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Hämtar verktyg...</p>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 mb-1">Inga verktyg hittades</h3>
            <p className="text-xs text-slate-500">
              Prova att ändra dina sökfilter eller lägg till ett nytt verktyg.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                currentUser={currentUser}
                onToggleStatus={handleToggleStatus}
                onUpdateImage={handleUpdateImage}
                onDeleteTool={handleDeleteTool}
                onOpenLendModal={(toolToLend) => setLendModalTool(toolToLend)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Alla Modaler samlade i App */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <EditProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} currentUser={currentUser} />
      <ManageNetworkModal isOpen={isNetworkOpen} onClose={() => setIsNetworkOpen(false)} currentUser={currentUser} />

      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTool={handleAddTool}
      />

      <LendModal
        isOpen={!!lendModalTool}
        onClose={() => setLendModalTool(null)}
        tool={lendModalTool}
        trustedNeighbors={trustedNeighbors}
        onLend={handleLendToNeighbor}
      />
    </div>
  );
}