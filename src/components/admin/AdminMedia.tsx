import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clipboard, ImagePlus, Loader2, Search, Trash2, UploadCloud, Video } from 'lucide-react';
import { MediaItem } from '../../types';
import { api } from '../../services/api';

type MediaCategory = MediaItem['category'];
const categories: { value: MediaCategory; label: string }[] = [
  { value: 'products', label: 'Products' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'founder', label: 'Founder' },
  { value: 'awards', label: 'Awards' },
  { value: 'social', label: 'Social' },
];

const isVideo = (item: MediaItem) => item.category === 'hero-videos' || /\.(mp4|webm)(\?|$)/i.test(item.url);
const formatSize = (bytes?: number) => !bytes ? '' : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const AdminMedia: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [category, setCategory] = useState<MediaCategory>('products');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const loadItems = async () => { setItems(await api.adminGetMedia()); };
  useEffect(() => { loadItems().catch((err) => setError(err.message || 'Could not load media.')).finally(() => setLoading(false)); }, []);

  const visibleItems = useMemo(() => items.filter((item) => {
    if (filter === 'images' && isVideo(item)) return false;
    if (filter === 'videos' && !isVideo(item)) return false;
    const value = query.trim().toLowerCase();
    return !value || item.title.toLowerCase().includes(value) || item.altText.toLowerCase().includes(value) || item.url.toLowerCase().includes(value);
  }), [items, filter, query]);

  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    setUploading(true); setError(''); setNotice('');
    let uploaded = 0;
    const failures: string[] = [];
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        failures.push(`${file.name}: choose a JPG, PNG, or WebP image.`); continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        failures.push(`${file.name}: images must be 5 MB or smaller.`); continue;
      }
      try { await api.adminUploadImage(file, category, file.name.replace(/\.[^.]+$/, ''), file.name.replace(/\.[^.]+$/, '')); uploaded += 1; }
      catch (err: any) { failures.push(`${file.name}: ${err.message || 'upload failed'}`); }
    }
    try { await loadItems(); } catch (err: any) { failures.push(err.message || 'Could not refresh the media library.'); }
    setUploading(false);
    if (uploaded) setNotice(`${uploaded} image${uploaded === 1 ? '' : 's'} added to your media library.`);
    if (failures.length) setError(failures.join(' '));
    if (fileInput.current) fileInput.current.value = '';
  };

  const copyUrl = async (item: MediaItem) => {
    try { await navigator.clipboard.writeText(item.url); setCopiedId(item.id); window.setTimeout(() => setCopiedId(''), 1600); }
    catch { setError('Clipboard access is unavailable. Copy the URL from the item details instead.'); }
  };

  const removeItem = async (item: MediaItem) => {
    if (!window.confirm(`Remove “${item.title}” from the media library?`)) return;
    setError(''); setNotice('');
    try { await api.adminDeleteMedia(item.id); await loadItems(); setNotice('Media item removed.'); }
    catch (err: any) { setError(err.message || 'Could not remove this media item.'); }
  };

  return <div className="space-y-6 pb-12">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-4">
      <div><h1 className="text-2xl font-bold text-[#202223]">Media library</h1><p className="mt-1 text-xs text-zinc-500">Upload, find, and reuse images across your online store.</p></div>
      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-2xs">{items.length} assets</span>
    </header>

    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

    <section onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFiles(event.dataTransfer.files); }} className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 ${dragging ? 'border-[#008060] bg-emerald-50' : 'border-zinc-300 bg-white'}`}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#008060]"><ImagePlus size={25} /></div>
        <div className="min-w-0 flex-1"><h2 className="font-semibold text-zinc-900">Add images to your media library</h2><p className="mt-1 text-xs leading-5 text-zinc-500">Drop files here or choose images from your computer. JPG, PNG, and WebP; up to 5 MB each.</p></div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <label className="text-left text-[11px] font-medium text-zinc-600">Save under
            <select value={category} onChange={(event) => setCategory(event.target.value as MediaCategory)} className="ml-2 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs">
              {categories.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => event.target.files && void uploadFiles(event.target.files)} />
          <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#202223] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}{uploading ? 'Uploading…' : 'Choose images'}
          </button>
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-zinc-200/70 p-1">
          {(['all', 'images', 'videos'] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filter === value ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'}`}>{value}</button>)}
        </div>
        <label className="relative block sm:w-72"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media" className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-xs" /></label>
      </div>

      {loading ? <div className="flex justify-center py-16 text-sm text-zinc-500"><Loader2 size={18} className="mr-2 animate-spin" /> Loading media…</div> : visibleItems.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center"><ImagePlus size={26} className="mx-auto text-zinc-300" /><p className="mt-3 text-sm font-medium text-zinc-700">No media found</p><p className="mt-1 text-xs text-zinc-500">Upload an image above to start your library.</p></div> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {visibleItems.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs">
          <div className="relative aspect-square bg-zinc-100">{isVideo(item) ? <><video src={item.url} muted className="h-full w-full object-cover" /><span className="absolute left-2 top-2 rounded-full bg-black/70 p-1.5 text-white"><Video size={13} /></span></> : <img src={item.url} alt={item.altText || item.title} loading="lazy" className="h-full w-full object-cover" />}</div>
          <div className="space-y-2 p-3"><div><h3 className="truncate text-xs font-semibold text-zinc-800" title={item.title}>{item.title}</h3><p className="mt-0.5 text-[10px] capitalize text-zinc-500">{item.category.replace('-', ' ')}{item.sizeBytes ? ` · ${formatSize(item.sizeBytes)}` : ''}</p></div>
            <div className="flex gap-2"><button type="button" onClick={() => void copyUrl(item)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50">{copiedId === item.id ? <Check size={12} /> : <Clipboard size={12} />}{copiedId === item.id ? 'Copied' : 'Copy URL'}</button><button type="button" onClick={() => void removeItem(item)} aria-label={`Remove ${item.title}`} className="rounded-md border border-zinc-200 px-2 py-1.5 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button></div>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
};
