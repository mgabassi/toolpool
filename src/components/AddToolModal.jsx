import React, { useState } from 'react';
import { X, Camera, Save, Plus, Sparkles, Loader2 } from 'lucide-react';

export function AddToolModal({ isOpen, onClose, onAddTool }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trädgård');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  function resetForm() {
    setTitle('');
    setDescription('');
    setCategory('Trädgård');
    setImageFile(null);
    setImagePreview(null);
    setIsAnalyzing(false);
  }

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result;

        const response = await fetch('/api/analyze-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.title) setTitle(data.title);
          if (data.category) setCategory(data.category);
          if (data.description) setDescription(data.description);
        } else {
          console.error('AI-analys misslyckades med status:', response.status);
        }
        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error('Fel vid AI-analys:', err);
      setIsAnalyzing(false);
    }
  }

  // Spara och stäng modalen
  function handleSave(e) {
    e.preventDefault();
    onAddTool(
      { title, description, category, is_available: true },
      imageFile
    );
    resetForm();
    onClose();
  }

  // Spara och rensa formuläret för att lägga till ett nytt verktyg direkt
  function handleSaveAndAddAnother(e) {
    e.preventDefault();
    onAddTool(
      { title, description, category, is_available: true },
      imageFile
    );
    resetForm();
  }

  function handleCloseModal() {
    resetForm();
    onClose();
  }

  return (
    <div 
      onClick={handleCloseModal}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl relative cursor-default"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Lägg till verktyg</h3>
          <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Bild & AI-identifiering</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors border border-indigo-100">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Välj / Ta foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </label>

              {imagePreview && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                  <img src={imagePreview} alt="Förhandsvisning" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {isAnalyzing && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600 font-medium animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyserar verktyget med AI...</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Titel</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Slagborr 18V"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Trädgård">Trädgård</option>
              <option value="Bygg & El">Bygg & El</option>
              <option value="Handverktyg">Handverktyg</option>
              <option value="Städ & Rengöring">Städ & Rengöring</option>
              <option value="Övrigt">Övrigt</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Beskrivning</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Skriv kort om skick eller tillbehör..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Knappanordning */}
          <div className="pt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleCloseModal}
              className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer text-center"
            >
              Avbryt
            </button>

            <button
              type="button"
              onClick={handleSaveAndAddAnother}
              disabled={isAnalyzing || !title}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Spara & lägg till ny
            </button>

            <button
              type="submit"
              disabled={isAnalyzing || !title}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Spara
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}