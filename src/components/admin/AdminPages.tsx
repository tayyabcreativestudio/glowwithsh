import React, { useEffect, useState } from 'react';
import { ExternalLink, FilePlus2, Pencil, Trash2 } from 'lucide-react';
import { StorePage } from '../../types';
import { api } from '../../services/api';
import { MediaLibraryButton } from './MediaLibraryButton';

interface AdminPagesProps { onChanged?: () => Promise<void> | void; }

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const getStorefrontPageUrl = (slug: string) => {
  const hostname = window.location.hostname.replace(/^admin\./, '');
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${hostname}${port}/${slug}`;
};

export const AdminPages: React.FC<AdminPagesProps> = ({ onChanged }) => {
  const [pages, setPages] = useState<StorePage[]>([]);
  const [active, setActive] = useState<StorePage | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => { setPages(await api.adminGetPages()); };
  useEffect(() => { refresh().catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);

  const clearForm = () => {
    setActive(null); setTitle(''); setSlug(''); setContent(''); setCoverImage('');
    setStatus('draft'); setSeoTitle(''); setSeoDescription(''); setError(''); setNotice('');
  };

  const editPage = (page: StorePage) => {
    setActive(page); setTitle(page.title); setSlug(page.slug); setContent(page.content);
    setCoverImage(page.coverImage || ''); setStatus(page.status);
    setSeoTitle(page.seoTitle || ''); setSeoDescription(page.seoDescription || ''); setError(''); setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savePage = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const data = { title, slug, content, coverImage, status, seoTitle, seoDescription };
      if (active) await api.adminUpdatePage(active.id, data); else await api.adminCreatePage(data);
      await refresh(); await onChanged?.();
      clearForm();
      setNotice(status === 'published' ? 'Page published to your storefront.' : 'Draft saved.');
    } catch (err: any) { setError(err.message || 'Could not save page.'); }
    finally { setSaving(false); }
  };

  const deletePage = async (page: StorePage) => {
    if (!window.confirm(`Delete “${page.title}”? This removes its storefront URL.`)) return;
    try { await api.adminDeletePage(page.id); await refresh(); await onChanged?.(); if (active?.id === page.id) clearForm(); }
    catch (err: any) { setError(err.message || 'Could not delete page.'); }
  };

  return <div className="space-y-6 pb-12">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-4">
      <div><h1 className="text-2xl font-bold text-[#202223]">Pages</h1><p className="mt-1 text-xs text-zinc-500">Create storefront pages, control their URLs, and publish when they are ready.</p></div>
      {!active && <button type="button" onClick={clearForm} className="inline-flex items-center gap-2 rounded-lg bg-[#202223] px-4 py-2.5 text-xs font-semibold text-white"><FilePlus2 size={15} /> Create page</button>}
    </div>
    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

    <form onSubmit={savePage} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-zinc-900">Page content</h2>{active && <button type="button" onClick={clearForm} className="text-xs text-zinc-500 hover:text-zinc-900">New page</button>}</div>
          <label className="block text-xs font-medium text-zinc-700">Title<input required maxLength={120} value={title} onChange={(e) => { setTitle(e.target.value); if (!active) setSlug(slugify(e.target.value)); }} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm" placeholder="Our story, FAQs, custom landing page…" /></label>
          <label className="block text-xs font-medium text-zinc-700">URL<input required maxLength={120} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm" placeholder="your-page-url" /><span className="mt-1 block text-[11px] text-zinc-500">Your page will be available at /{slug || 'your-page-url'}</span></label>
          <label className="block text-xs font-medium text-zinc-700">Page copy<textarea rows={14} maxLength={100000} value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm leading-6" placeholder="Write the content customers should see. Separate paragraphs with a blank line." /></label>
          <div><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-zinc-700">Header image <span className="font-normal text-zinc-400">(optional)</span></span><MediaLibraryButton onSelect={setCoverImage} /></div><input type="text" inputMode="url" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs" placeholder="Paste an image URL or choose from media" />{coverImage && <img src={coverImage} alt="Page header preview" className="mt-3 max-h-52 w-full rounded-lg object-cover" />}</div>
        </section>
        <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h2 className="font-semibold text-zinc-900">Search engine listing</h2>
          <label className="block text-xs font-medium text-zinc-700">SEO title<input maxLength={180} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></label>
          <label className="block text-xs font-medium text-zinc-700">Meta description<textarea maxLength={320} rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></label>
        </section>
        <div className="flex justify-end gap-2"><button type="button" onClick={clearForm} className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700">Cancel</button><button disabled={saving} type="submit" className="rounded-lg bg-[#202223] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : status === 'published' ? 'Save and publish' : 'Save draft'}</button></div>
      </div>
      <aside className="space-y-4">
        <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h2 className="font-semibold text-zinc-900">Visibility</h2>
          <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="draft">Draft</option><option value="published">Published</option></select>
          <p className="text-[11px] leading-5 text-zinc-500">Published pages are live at their URL and appear in the storefront Pages menu.</p>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-zinc-900">All pages <span className="text-zinc-400">({pages.length})</span></h2>
          {loading ? <p className="text-xs text-zinc-500">Loading…</p> : pages.length === 0 ? <p className="text-xs leading-5 text-zinc-500">Your pages will show here. Start with a story, FAQ, or custom landing page.</p> : <div className="space-y-2">{pages.map((page) => <div key={page.id} className="flex items-start gap-2 rounded-lg border border-zinc-100 p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-zinc-800">{page.title}</p><p className="truncate text-[10px] text-zinc-500">/{page.slug} · {page.status}</p></div>
            {page.status === 'published' && <a href={getStorefrontPageUrl(page.slug)} target="_blank" rel="noreferrer" aria-label={`View ${page.title}`} className="rounded p-1 text-zinc-500 hover:bg-zinc-100"><ExternalLink size={14} /></a>}
            <button type="button" onClick={() => editPage(page)} aria-label={`Edit ${page.title}`} className="rounded p-1 text-zinc-500 hover:bg-zinc-100"><Pencil size={14} /></button>
            <button type="button" onClick={() => deletePage(page)} aria-label={`Delete ${page.title}`} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
          </div>)}</div>}
        </section>
      </aside>
    </form>
  </div>;
};
