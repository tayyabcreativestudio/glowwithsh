import React, { useState } from 'react';
import { BlogPost } from '../../types';
import { formatDate } from '../../utils/format';
import { Plus, Edit, Trash2, FileText, CheckCircle2, EyeOff } from 'lucide-react';

interface AdminBlogProps {
  posts: BlogPost[];
  onSavePost: (post: Partial<BlogPost>) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
}

export const AdminBlog: React.FC<AdminBlogProps> = ({ posts, onSavePost, onDeletePost }) => {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('Ritual Guides');
  const [readTime, setReadTime] = useState('4 min read');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingPost(null);
    setIsNew(true);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCoverImage('https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop');
    setCategory('Ritual Guides');
    setReadTime('4 min read');
    setPublished(true);
  };

  const handleOpenEdit = (p: BlogPost) => {
    setEditingPost(p);
    setIsNew(false);
    setTitle(p.title);
    setSlug(p.slug);
    setExcerpt(p.excerpt);
    setContent(p.content);
    setCoverImage(p.coverImage);
    setCategory(p.category);
    setReadTime(p.readTime);
    setPublished(p.status === 'published');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSavePost({
        id: editingPost?.id,
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt,
        content,
        coverImage,
        category,
        readTime,
        status: published ? 'published' : 'draft',
        author: 'Shagufi Hussain',
      });
      setEditingPost(null);
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
            The Glow Journal ({posts.length})
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Publish skincare ritual stories, botanical ingredient deep-dives, and seasonal regimens.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-5 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-lg text-xs uppercase font-sans font-semibold tracking-wider hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>Write New Article</span>
        </button>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl border border-[#E7DED7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#FAF7F3] border-b border-[#E7DED7] text-[#665D58] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Article Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Read Time</th>
                <th className="px-4 py-3.5">Published Date</th>
                <th className="px-4 py-3.5">Visibility</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED7]">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF7F3]/60 transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      className="w-12 h-14 object-cover rounded border border-[#E7DED7]"
                    />
                    <div>
                      <span className="font-serif text-sm text-[#241E1C] font-medium block">
                        {p.title}
                      </span>
                      <span className="text-[11px] text-[#665D58] font-mono">
                        /{p.slug}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-[#665D58]">
                    {p.category}
                  </td>

                  <td className="px-4 py-3.5 text-[#665D58]">
                    {p.readTime}
                  </td>

                  <td className="px-4 py-3.5 text-[#665D58]">
                    {formatDate(p.publishedAt)}
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {p.status === 'published' ? 'Live' : 'Draft'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-[#665D58] hover:text-[#241E1C] hover:bg-[#F1EBE5] rounded"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete article "${p.title}"?`)) {
                            onDeletePost(p.id);
                          }
                        }}
                        className="p-1.5 text-[#665D58] hover:text-[#8F3E3E] hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {(editingPost || isNew) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-xl border border-[#E7DED7] max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-serif text-2xl text-[#241E1C]">
              {isNew ? 'Create Journal Story' : `Edit: ${editingPost?.title}`}
            </h3>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Story Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (isNew) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                  Read Time Estimate
                </label>
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Cover Photo URL
              </label>
              <input
                type="url"
                required
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Short Excerpt *
              </label>
              <textarea
                rows={2}
                required
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Full Article Content (Markdown / paragraphs supported) *
              </label>
              <textarea
                rows={7}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-sans text-[#241E1C] cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="accent-[#241E1C]"
              />
              <span>Publish article to the public journal</span>
            </label>

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPost(null);
                  setIsNew(false);
                }}
                className="px-4 py-2 bg-white border border-[#E7DED7] rounded text-xs font-sans text-[#665D58]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#241E1C] text-[#FAF7F3] rounded text-xs uppercase font-sans font-semibold hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Article'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
