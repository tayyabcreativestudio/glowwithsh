import React, { useState } from 'react';
import { FounderCMS } from '../../types';
import { Save } from 'lucide-react';
import { MediaLibraryButton } from './MediaLibraryButton';

interface AdminCMSFounderProps {
  founder: FounderCMS;
  onSave: (data: FounderCMS) => Promise<void>;
}

export const AdminCMSFounder: React.FC<AdminCMSFounderProps> = ({ founder, onSave }) => {
  const [formData, setFormData] = useState<FounderCMS>(founder);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await onSave(formData);
      setSavedMsg('✓ Founder biography and portrait updated successfully!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DED7] pb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
            Founder CMS &amp; Philosophy
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Narrate Shagufi Hussain's formulations, atelier vision, and ritual philosophy.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-lg text-xs uppercase font-sans font-semibold tracking-widest hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save size={14} />
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-sans border border-emerald-200 font-medium">
          {savedMsg}
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Founder Full Name
            </label>
            <input
              type="text"
              value={formData.founderName}
              onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Founder Title / Role
            </label>
            <input
              type="text"
              value={formData.signatureTitle}
              onChange={(e) => setFormData({ ...formData, signatureTitle: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Featured Philosophy Headline
          </label>
          <input
            type="text"
            value={formData.headline}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Founder Signature Quote
          </label>
          <textarea
            rows={2}
            value={formData.quote}
            onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between"><label className="block text-xs font-sans font-semibold text-[#241E1C]">Portrait Photo URL</label><MediaLibraryButton onSelect={(url) => setFormData({ ...formData, image: url })} /></div>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono"
          />
          {formData.image && (
            <img
              src={formData.image}
              alt="Portrait Preview"
              className="w-20 h-24 object-cover rounded-lg border border-[#E7DED7] mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Founder Story &amp; Formulation Philosophy
          </label>
          <textarea
            rows={8}
            value={formData.story}
            onChange={(e) => setFormData({ ...formData, story: e.target.value })}
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded leading-relaxed"
          />
        </div>
      </div>
    </form>
  );
};
