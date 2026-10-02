import React, { useState } from 'react';
import { Award } from '../../types';
import { Plus, Edit, Trash2, Award as AwardIcon, CheckCircle2, ExternalLink } from 'lucide-react';
import { MediaLibraryButton } from './MediaLibraryButton';

interface AdminCMSAwardsProps {
  awards: Award[];
  onSaveAward: (award: Partial<Award>) => Promise<void>;
  onDeleteAward: (awardId: string) => Promise<void>;
}

export const AdminCMSAwards: React.FC<AdminCMSAwardsProps> = ({
  awards,
  onSaveAward,
  onDeleteAward,
}) => {
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [year, setYear] = useState('2025');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [verified, setVerified] = useState(true);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingAward(null);
    setIsNew(true);
    setTitle('');
    setOrganization('');
    setYear('2025');
    setDescription('');
    setImage('');
    setExternalLink('');
    setVerified(true);
    setPublished(true);
  };

  const handleOpenEdit = (a: Award) => {
    setEditingAward(a);
    setIsNew(false);
    setTitle(a.title);
    setOrganization(a.organization);
    setYear(a.year);
    setDescription(a.description);
    setImage(a.image || '');
    setExternalLink(a.externalLink || '');
    setVerified(a.verified);
    setPublished(a.published);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveAward({
        id: editingAward?.id,
        title,
        organization,
        year,
        description,
        image,
        externalLink,
        verified,
        published,
      });
      setEditingAward(null);
      setIsNew(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
            Verified Accolades &amp; Awards ({awards.length})
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Maintain strict, verifiable industry recognitions and formulation awards.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-5 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-lg text-xs uppercase font-sans font-semibold tracking-wider hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>Add Accolade</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {awards.map((a) => (
          <div
            key={a.id}
            className="bg-white p-6 rounded-2xl border border-[#E7DED7] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C4A36A] transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-[#C4A36A] font-semibold">
                  {a.year} • {a.organization}
                </span>
                {a.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle2 size={11} />
                    Verified
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl text-[#241E1C]">{a.title}</h3>
              {a.image && <img src={a.image} alt={a.title} className="h-36 w-full rounded-lg object-cover" />}
              <p className="text-xs font-sans text-[#665D58] leading-relaxed">
                {a.description}
              </p>

              {a.externalLink && (
                <a
                  href={a.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-sans text-[#B98D80] hover:text-[#241E1C] inline-flex items-center gap-1"
                >
                  <span>Verification Reference</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            <div className="pt-3 border-t border-[#E7DED7] flex items-center justify-between">
              <button
                onClick={() => handleOpenEdit(a)}
                className="text-xs font-sans font-semibold text-[#241E1C] hover:text-[#C4A36A] inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit size={13} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete accolade "${a.title}"?`)) {
                    onDeleteAward(a.id);
                  }
                }}
                className="text-xs font-sans text-[#8F3E3E] hover:text-red-700 p-1 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {(editingAward || isNew) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-xl border border-[#E7DED7]"
          >
            <h3 className="font-serif text-2xl text-[#241E1C]">
              {isNew ? 'Add Verified Accolade' : `Edit Accolade: ${editingAward?.title}`}
            </h3>

            <div className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-semibold text-[#241E1C] mb-1">Title of Honor</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Best Botanical Squalane Innovation"
                  className="w-full px-3.5 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#241E1C] mb-1">Awarding Body / Press</label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Vogue India Beauty Awards"
                    className="w-full px-3.5 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#241E1C] mb-1">Year</label>
                  <input
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#241E1C] mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding the recognition..."
                  className="w-full px-3.5 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between"><label className="block font-semibold text-[#241E1C]">Award image</label><MediaLibraryButton onSelect={setImage} /></div>
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="Paste an image URL or choose from media" className="w-full px-3.5 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded" />
                {image && <img src={image} alt="Award preview" className="mt-2 h-24 w-36 rounded-lg object-cover" />}
              </div>

              <div>
                <label className="block font-semibold text-[#241E1C] mb-1">External Verification URL</label>
                <input
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="rounded border-[#E7DED7]"
                  />
                  <span className="font-semibold text-[#241E1C]">Verified Accolade</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="rounded border-[#E7DED7]"
                  />
                  <span className="font-semibold text-[#241E1C]">Published on Site</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7DED7]">
              <button
                type="button"
                onClick={() => {
                  setEditingAward(null);
                  setIsNew(false);
                }}
                className="px-4 py-2 text-xs uppercase font-sans text-[#665D58] hover:text-[#241E1C]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#241E1C] text-[#FAF7F3] rounded text-xs uppercase font-sans font-semibold hover:bg-[#C4A36A] hover:text-[#241E1C]"
              >
                {saving ? 'Saving...' : 'Save Accolade'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
