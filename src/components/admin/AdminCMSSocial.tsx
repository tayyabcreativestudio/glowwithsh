import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { MediaLibraryButton } from './MediaLibraryButton';

interface CuratedPost {
  id: string;
  imageUrl: string;
  caption: string;
  url: string;
  likes: number;
}

interface AdminCMSSocialProps {
  social: {
    instagramHandle: string;
    instagramUrl: string;
    posts: any[];
  };
  onSave: (data: {
    instagramHandle: string;
    instagramUrl: string;
    posts: any[];
  }) => Promise<void>;
}

export const AdminCMSSocial: React.FC<AdminCMSSocialProps> = ({ social, onSave }) => {
  const [handle, setHandle] = useState(social.instagramHandle);
  const [url, setUrl] = useState(social.instagramUrl);
  const [posts, setPosts] = useState<CuratedPost[]>(() =>
    (social.posts || []).map((p: any, idx: number) => ({
      id: p.id || `post-${idx}`,
      imageUrl: p.imageUrl || '',
      caption: p.caption || '',
      url: p.url || social.instagramUrl || '',
      likes: p.likes || 120,
    }))
  );

  const [newImage, setNewImage] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newPostUrl, setNewPostUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleAddPost = () => {
    if (!newImage.trim()) return;
    const item: CuratedPost = {
      id: `soc-${Date.now()}`,
      imageUrl: newImage.trim(),
      caption: newCaption.trim() || 'Atelier ritual moments with GlowWithSH',
      url: newPostUrl.trim() || url,
      likes: Math.floor(80 + Math.random() * 200),
    };
    setPosts([...posts, item]);
    setNewImage('');
    setNewCaption('');
    setNewPostUrl('');
  };

  const handleRemovePost = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await onSave({
        instagramHandle: handle,
        instagramUrl: url,
        posts,
      });
      setSavedMsg('✓ Instagram curation updated successfully!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 max-w-4xl pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DED7] pb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
            Instagram &amp; Community Curation
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Curate social gallery photos showcasing customer skin transformations and Delhi studio rituals.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-lg text-xs uppercase font-sans font-semibold tracking-widest hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save size={14} />
          <span>{saving ? 'Saving...' : 'Save Curation'}</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-sans border border-emerald-200 font-medium">
          {savedMsg}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <h3 className="font-serif text-xl text-[#241E1C]">Brand Social Identity</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Instagram Handle
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Profile Link
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono"
            />
          </div>
        </div>
      </div>

      {/* Curated Posts Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <h3 className="font-serif text-xl text-[#241E1C]">Curated Photo Stream ({posts.length})</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {posts.map((p) => (
            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-[#E7DED7] group">
              <img src={p.imageUrl} alt={p.caption} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemovePost(p.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <Trash2 size={13} />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[10px] text-white font-sans truncate">
                {p.caption}
              </div>
            </div>
          ))}
        </div>

        {/* Add new photo box */}
        <div className="pt-4 border-t border-[#E7DED7] space-y-3">
          <span className="font-serif text-base text-[#241E1C] block">Add Curated Photo to Stream</span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2"><input type="url" placeholder="Image URL (https://...)" value={newImage} onChange={(e) => setNewImage(e.target.value)} className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded" /><MediaLibraryButton onSelect={setNewImage} /></div>
            <input
              type="text"
              placeholder="Caption summary"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
            <input
              type="url"
              placeholder="Instagram post link"
              value={newPostUrl}
              onChange={(e) => setNewPostUrl(e.target.value)}
              className="px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>

          <button
            type="button"
            onClick={handleAddPost}
            className="px-4 py-2 bg-[#241E1C] text-[#FAF7F3] rounded text-xs uppercase font-sans font-semibold hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add to Feed</span>
          </button>
        </div>
      </div>
    </form>
  );
};
