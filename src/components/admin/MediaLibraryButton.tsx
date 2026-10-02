import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { api } from '../../services/api';
import { MediaItem } from '../../types';

interface MediaLibraryButtonProps {
  onSelect: (url: string) => void;
  videos?: boolean;
  className?: string;
  label?: string;
}

export const MediaLibraryButton: React.FC<MediaLibraryButtonProps> = ({
  onSelect,
  videos = false,
  className = '',
  label = 'Choose from media',
}) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    api.adminGetMedia()
      .then(setItems)
      .catch((err: Error) => setError(err.message || 'Could not load your media library.'))
      .finally(() => setLoading(false));
  }, [open]);

  const selectableItems = items.filter((item) => {
    const isVideo = item.category === 'hero-videos' || /\.(mp4|webm)(\?|$)/i.test(item.url);
    return videos ? isVideo : !isVideo;
  });

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center gap-1.5 rounded-lg border border-[#C9CCCF] bg-white px-3 py-2 text-xs font-medium text-[#202223] hover:bg-zinc-50 ${className}`}>
      <ImageIcon size={14} /> {label}
    </button>
    {open && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Choose media">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div><h2 className="text-lg font-semibold text-zinc-900">Choose from media</h2><p className="text-xs text-zinc-500">Select an existing {videos ? 'video' : 'image'} from your library.</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close media picker" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><X size={18} /></button>
        </div>
        <div className="min-h-48 flex-1 overflow-y-auto p-5">
          {loading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500"><Loader2 size={18} className="animate-spin" /> Loading library…</div>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!loading && !error && selectableItems.length === 0 && <p className="py-12 text-center text-sm text-zinc-500">No {videos ? 'videos' : 'images'} yet. Upload files in the product editor or use an external URL.</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {selectableItems.map((item) => <button key={item.id} type="button" onClick={() => { onSelect(item.url); setOpen(false); }} className="group overflow-hidden rounded-xl border border-zinc-200 text-left hover:border-[#8A5A32] hover:ring-2 hover:ring-[#8A5A32]/20">
              <div className="aspect-square bg-zinc-100">
                {videos ? <video src={item.url} muted className="h-full w-full object-cover" /> : <img src={item.url} alt={item.altText || item.title} className="h-full w-full object-cover" />}
              </div>
              <div className="p-2"><p className="truncate text-xs font-medium text-zinc-800">{item.title}</p><p className="truncate text-[10px] text-zinc-500">{item.category}</p></div>
            </button>)}
          </div>
        </div>
      </div>
    </div>}
  </>;
};
