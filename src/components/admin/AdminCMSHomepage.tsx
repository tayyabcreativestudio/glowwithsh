import React, { useRef, useState } from 'react';
import { HomepageCMS } from '../../types';
import { Film, Loader2, Save, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { MediaLibraryButton } from './MediaLibraryButton';

interface AdminCMSHomepageProps {
  cms: HomepageCMS;
  onSave: (data: HomepageCMS) => Promise<void>;
}

export const AdminCMSHomepage: React.FC<AdminCMSHomepageProps> = ({ cms, onSave }) => {
  const [formData, setFormData] = useState<HomepageCMS>(cms);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = async (file?: File) => {
    if (!file) return;
    setVideoUploadError('');
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      setVideoUploadError('Choose an MP4 or WebM video file.');
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      setVideoUploadError('Video must be 40 MB or smaller. Compress it before uploading.');
      return;
    }
    setUploadingVideo(true);
    try {
      const uploaded = await api.adminUploadVideo(file);
      setFormData((current) => ({ ...current, hero: { ...current.hero, videoUrl: uploaded.url } }));
      setSavedMsg('✓ Video uploaded. Save CMS Updates to publish it on the homepage.');
    } catch (error: any) {
      setVideoUploadError(error.message || 'Video upload failed.');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await onSave(formData);
      setSavedMsg('✓ Homepage CMS content updated successfully!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DED7] pb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
            Homepage CMS &amp; Visual Experience
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Configure announcement banners, video hero, editorial quotes, and section toggles.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-lg text-xs uppercase font-sans font-semibold tracking-widest hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save size={14} />
          <span>{saving ? 'Publishing...' : 'Save CMS Updates'}</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-sans border border-emerald-200 font-medium">
          {savedMsg}
        </div>
      )}

      {/* Announcement Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-[#241E1C]">Top Announcement Bar</h3>
          <label className="flex items-center gap-2 text-xs font-sans cursor-pointer text-[#241E1C]">
            <input
              type="checkbox"
              checked={formData.announcementBar.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  announcementBar: { ...formData.announcementBar, enabled: e.target.checked },
                })
              }
              className="accent-[#241E1C]"
            />
            <span>Enable Announcement Bar</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Announcement Message
          </label>
          <input
            type="text"
            value={formData.announcementBar.text}
            onChange={(e) =>
              setFormData({
                ...formData,
                announcementBar: { ...formData.announcementBar, text: e.target.value },
              })
            }
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Announcement Target Link
          </label>
          <input
            type="text"
            value={formData.announcementBar.linkUrl || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                announcementBar: { ...formData.announcementBar, linkUrl: e.target.value },
              })
            }
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono"
          />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <h3 className="font-serif text-xl text-[#241E1C]">Cinematic Hero Section</h3>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Main Editorial Headline
          </label>
          <input
            type="text"
            value={formData.hero.headline}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, headline: e.target.value } })
            }
            className="w-full px-3.5 py-2 text-sm font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Subheadline / Poetic Tagline
          </label>
          <input
            type="text"
            value={formData.hero.subheadline}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, subheadline: e.target.value } })
            }
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Primary CTA Button Text
            </label>
            <input
              type="text"
              value={formData.hero.primaryCtaText}
              onChange={(e) =>
                setFormData({ ...formData, hero: { ...formData.hero, primaryCtaText: e.target.value } })
              }
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Primary CTA Button Link
            </label>
            <input
              type="text"
              value={formData.hero.primaryCtaLink}
              onChange={(e) =>
                setFormData({ ...formData, hero: { ...formData.hero, primaryCtaLink: e.target.value } })
              }
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Background Video Stream URL (.mp4)
          </label>
          <input
            type="text"
            value={formData.hero.videoUrl}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, videoUrl: e.target.value } })
            }
            placeholder="/videos/hero_optimized.mp4 or https://..."
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <MediaLibraryButton videos onSelect={(url) => setFormData((current) => ({ ...current, hero: { ...current.hero, videoUrl: url } }))} />
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,.mp4,.webm" className="hidden" onChange={(event) => handleVideoUpload(event.target.files?.[0])} />
            <button type="button" disabled={uploadingVideo} onClick={() => videoInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#241E1C] text-white text-xs font-semibold disabled:opacity-60">
              {uploadingVideo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploadingVideo ? 'Uploading video…' : 'Upload video file'}
            </button>
            <span className="text-[11px] text-[#665D58]">MP4 or WebM, maximum 40 MB. Short compressed clips load fastest.</span>
          </div>
          {videoUploadError && <p className="mt-2 text-xs text-red-700">{videoUploadError}</p>}
          {formData.hero.videoUrl && (
            <div className="mt-4 rounded-xl overflow-hidden bg-black border border-[#E7DED7] max-w-xl">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF7F3] text-xs text-[#665D58]"><Film size={14} /> Current hero video preview</div>
              <video key={formData.hero.videoUrl} src={formData.hero.videoUrl} controls muted loop playsInline className="w-full max-h-64 object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Editorial Split Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <h3 className="font-serif text-xl text-[#241E1C]">Editorial Philosophy Feature</h3>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Section Headline
          </label>
          <input
            type="text"
            value={formData.editorialStatement.headline}
            onChange={(e) =>
              setFormData({
                ...formData,
                editorialStatement: { ...formData.editorialStatement, headline: e.target.value },
              })
            }
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Philosophy Quote / Statement
          </label>
          <textarea
            rows={3}
            value={formData.editorialStatement.text}
            onChange={(e) =>
              setFormData({
                ...formData,
                editorialStatement: { ...formData.editorialStatement, text: e.target.value },
              })
            }
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between"><label className="block text-xs font-sans font-semibold text-[#241E1C]">Editorial Feature Image URL</label><MediaLibraryButton onSelect={(url) => setFormData((current) => ({ ...current, editorialStatement: { ...current.editorialStatement, image: url } }))} /></div>
          <input
            type="url"
            value={formData.editorialStatement.image || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                editorialStatement: { ...formData.editorialStatement, image: e.target.value },
              })
            }
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>
      </div>

      {/* Section Toggles */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <h3 className="font-serif text-xl text-[#241E1C]">Homepage Section Visibility Toggles</h3>
        <p className="text-xs font-sans text-[#665D58]">
          Choose which sections appear on the customer-facing storefront homepage.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-sans text-[#241E1C]">
          {formData.sectionVisibility &&
            Object.entries(formData.sectionVisibility).map(([key, val]) => (
              <label key={key} className="flex items-center gap-2 p-3 bg-[#FAF7F3] rounded-lg border border-[#E7DED7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(val)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sectionVisibility: {
                        ...formData.sectionVisibility,
                        [key as keyof typeof formData.sectionVisibility]: e.target.checked,
                      },
                    })
                  }
                  className="accent-[#241E1C]"
                />
                <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
        </div>
      </div>
    </form>
  );
};
