import { useEffect, useState, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { compressImage } from './lib/imageCompressor';
import { ToolCard } from './components/ToolCard';
import { AddToolModal } from './components/AddToolModal';
import { AuthModal } from './components/AuthModal';
import { ManageNetworkModal } from './components/ManageNetworkModal';
import { EditProfileModal } from './components/EditProfileModal';
import {
  ShieldCheck,
  Plus,
  LogIn,
  LogOut,
  Search,
  User,
  Users,
  Filter,
  X,
  Tag,
  Wrench,
  UserCog,
} from 'lucide-react';

export default function App() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchTools();
  }, [currentUser]);

  async function fetchUserProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setUserProfile(data);
  }

  async function fetchTools() {
    setLoading(true);

    const { data: allTools, error } = await supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fel vid hämtning:', error);
      setLoading(false);
      return;
    }

    if (!currentUser) {
      setTools([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url');
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const { data: trustedByOwners } = await supabase
      .from('trusted_users')
      .select('owner_id')
      .eq('trusted_user_id', currentUser.id);

    const allowedOwnerIds = (trustedByOwners || []).map((t) => t.owner_id);

    const visibleTools = (allTools || [])
      .filter((tool) => tool.user_id === currentUser.id || allowedOwnerIds.includes(tool.user_id))
      .map((tool) => {
        const ownerProf = profileMap.get(tool.user_id);
        return {
          ...tool,
          owner_name: ownerProf?.full_name || tool.owner_name || 'Anonym granne',
          owner_avatar: ownerProf?.avatar_url || null,
        };
      });

    setTools(visibleTools);
    setLoading(false);
  }

  async function uploadImageToStorage(file) {
    if (!file) return null;

    const compressedFile = await compressImage(file);
    const cleanFileName = compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tool-images')
      .upload(fileName, compressedFile, { cacheControl: '3600', upsert: true });

    if (uploadError) return null;

    const { data: urlData } = supabase.storage.from('tool-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function handleToggleStatus(tool) {
    if (!currentUser) return;

    const willBeAvailable = !tool.is_available;
    const borrowerId = willBeAvailable ? null : currentUser.id;
    const borrowerName = willBeAvailable
      ? null
      : userProfile?.full_name || currentUser.email;

    const { error } = await supabase
      .from('tools')
      .update({
        is_available: willBeAvailable,
        borrower_id: borrowerId,
        borrower_name: borrowerName,
      })
      .eq('id', tool.id);

    if (!error) fetchTools();
  }

  async function handleAddTool(newTool, imageFile) {
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImageToStorage(imageFile);
    }

    const ownerName = userProfile?.full_name || currentUser?.email || 'Anonym granne';

    const { error } = await supabase.from('tools').insert([
      {
        ...newTool,
        owner_name: ownerName,
        image_url: imageUrl,
        user_id: currentUser?.id ?? null,
      },
    ]);

    if (!error) fetchTools();
  }

  async function handleUpdateImage(id, imageFile) {
    const imageUrl = await uploadImageToStorage(imageFile);
    if (!imageUrl) return;

    const { error } = await supabase
      .from('tools')
      .update({ image_url: imageUrl })
      .eq('id', id);

    if (!error) fetchTools();
  }

  async function handleDeleteTool(id) {
    const { error } = await supabase.from('tools').delete().eq('id', id);
    if (!error) fetchTools();
  }

  const { uniqueOwners, uniqueCategories } = useMemo(() => {
    const owners = new Set();
    const categories = new Set();

    tools.forEach((tool) => {
      if (tool.owner_name) owners.add(tool.owner_name);
      if (tool.category) categories.add(tool.category);
    });

    return {
      uniqueOwners: Array.from(owners),
      uniqueCategories: Array.from(categories),
    };
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const titleMatch = tool.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = tool.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = tool.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const ownerMatch = tool.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSearch = titleMatch || descMatch || categoryMatch || ownerMatch;
      const matchesOwner = selectedOwner === 'all' || tool.owner_name === selectedOwner;
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;

      return matchesSearch && matchesOwner && matchesCategory;
    });
  }, [tools, searchQuery, selectedOwner, selectedCategory]);

  const hasActiveFilters = searchQuery !== '' || selectedOwner !== 'all' || selectedCategory !== 'all';

  function resetFilters() {
    setSearchQuery('');
    setSelectedOwner('all');
    setSelectedCategory('all');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-8 select-none w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm w-full">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">ToolPool</h1>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-1.5 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Redigera profil"
                >
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {userProfile?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => supabase.auth.signOut()}
                  title="Logga ut"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Logga in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 w-full">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Tillgängliga verktyg</h2>
          <p className="text-slate-500 text-xs">
            {currentUser
              ? 'Dina och dina grannars utlånade verktyg.'
              : 'Logga in för att se tillgängliga verktyg.'}
          </p>
        </div>

        {currentUser && (
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 mb-6 shadow-sm space-y-3 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Sök & Filter
              </span>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Rensa
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Sök verktyg..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              <div className="relative w-full">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="all">Alla ägare</option>
                  {uniqueOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full">
                <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="all">Alla typer av verktyg</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {!currentUser ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
            <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">Välkommen till ToolPool</h3>
            <p className="text-xs text-slate-500 mb-4">
              Logga in eller skapa ett konto för att lägga till verktyg och börja dela tryggt i grannskapet.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Logga in / Skapa konto
            </button>
          </div>
        ) : loading ? (
          <p className="text-slate-500 text-sm">Laddar verktyg...</p>
        ) : filteredTools.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-6">
            <p className="text-slate-500 text-sm mb-3">
              {hasActiveFilters
                ? 'Inga verktyg matchade din sökning eller filtrering.'
                : 'Inga verktyg tillgängliga ännu.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Rensa alla filter
              </button>
            ) : (
              <button
                onClick={() => setIsNetworkModalOpen(true)}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Välj vilka grannar du litar på
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                currentUser={currentUser}
                onToggleStatus={handleToggleStatus}
                onUpdateImage={handleUpdateImage}
                onDeleteTool={handleDeleteTool}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottenmeny för mobiler */}
      {currentUser && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex items-center justify-around z-40 shadow-lg pb-safe">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center gap-1 text-indigo-600 cursor-pointer"
          >
            <Wrench className="w-5 h-5" />
            <span className="text-[10px] font-medium">Verktyg</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-600 cursor-pointer"
          >
            <div className="bg-indigo-600 text-white p-2.5 rounded-full shadow-md -mt-5 border-4 border-slate-50">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium -mt-1">Lägg till</span>
          </button>

          <button
            onClick={() => setIsNetworkModalOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-600 cursor-pointer"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Grannar</span>
          </button>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-600 cursor-pointer"
          >
            <UserCog className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </button>
        </nav>
      )}

      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTool={handleAddTool}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={fetchTools}
      />

      <ManageNetworkModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        currentUser={currentUser}
      />

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        onProfileUpdated={() => {
          if (currentUser) fetchUserProfile(currentUser.id);
          fetchTools();
        }}
      />
    </div>
  );
}