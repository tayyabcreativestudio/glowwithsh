import React, { useState } from 'react';
import { SiteSettings } from '../../types';
import {
  Save,
  RotateCcw,
  ShieldAlert,
  Building2,
  Phone,
  Truck,
  Lock,
  KeyRound,
  ShieldCheck,
  Globe,
  Search,
  UploadCloud,
  ExternalLink,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { MediaLibraryButton } from './MediaLibraryButton';

interface AdminSettingsProps {
  settings: SiteSettings;
  onSaveSettings: (settings: SiteSettings) => Promise<void>;
  onResetSeedData: () => Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  onResetSeedData,
}) => {
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // SEO Social Sharing Upload State
  const [uploadingSocialImg, setUploadingSocialImg] = useState(false);
  const [socialUploadErr, setSocialUploadErr] = useState('');

  // Password Management State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSocialImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSocialImg(true);
    setSocialUploadErr('');
    try {
      const res = await api.adminUploadImage(file, 'seo', 'Social Sharing Image', 'GlowWithSH Store');
      setFormData((prev) => ({ ...prev, socialSharingImage: res.url }));
    } catch (err: any) {
      setSocialUploadErr(err.message || 'Failed to upload social sharing image');
    } finally {
      setUploadingSocialImg(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current master password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.adminChangePassword(currentPassword, newPassword);
      setPasswordMsg(res.message || '✓ Master administrative password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update administrative password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await onSaveSettings(formData);
      setSavedMsg('✓ Store atelier settings and SEO preferences saved successfully!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const ok = window.confirm(
      'WARNING: This will reset all products, stock levels, orders, reviews, and CMS settings back to the initial GlowWithSH atelier seed state. Proceed?'
    );
    if (!ok) return;

    setResetting(true);
    try {
      await onResetSeedData();
      alert('Atelier data has been successfully reset to initial seed state.');
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to reset atelier data.');
    } finally {
      setResetting(false);
    }
  };

  const displayTitle = formData.metaTitle || `${formData.brandName || 'GlowWithSH'} — Luxury Skincare & Beauty Rituals by Shagufi Hussain`;
  const displayDescription =
    formData.metaDescription ||
    'Indulge in botanical skincare formulated by Shagufi Hussain in Delhi. Handcrafted serums, elixir oils, and nourishing creams.';

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E3E5] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#202223]">
            Preferences &amp; SEO
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage search engine listing, social sharing previews, analytics, and atelier store coordinates.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save size={14} />
          <span>{saving ? 'Saving...' : 'Save preferences'}</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
          {savedMsg}
        </div>
      )}

      {/* Shopify Search Engine Optimization (SEO) Card */}
      <div className="bg-white p-6 rounded-xl border border-[#E1E3E5] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E1E3E5] pb-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[#008060]" />
            <h2 className="font-serif text-lg font-bold text-[#202223]">
              Search Engine Optimization (SEO)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500 font-medium">Shopify Search Listing</span>
        </div>

        <p className="text-xs text-zinc-600">
          Control how your luxury skincare atelier appears in Google, Bing, and other search engines.
        </p>

        {/* Live Google Search Result Preview */}
        <div className="bg-[#FAFBFB] p-4 rounded-xl border border-[#E1E3E5] space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Search engine listing preview
          </span>
          <div className="bg-white p-3.5 rounded-lg border border-[#E1E3E5] max-w-xl font-sans text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-1">
              <div className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px] font-bold">
                G
              </div>
              <span className="truncate">https://www.glowwithsh.com</span>
            </div>
            <div className="text-[#1a0dab] hover:underline text-sm sm:text-base font-medium line-clamp-1 leading-snug cursor-pointer">
              {displayTitle}
            </div>
            <div className="text-zinc-600 text-xs mt-1 line-clamp-2 leading-relaxed">
              {displayDescription}
            </div>
          </div>
        </div>

        {/* Homepage Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-800">
              Homepage title
            </label>
            <span
              className={`text-[11px] font-mono ${
                (formData.metaTitle?.length || 0) > 70 ? 'text-red-600 font-semibold' : 'text-zinc-500'
              }`}
            >
              {formData.metaTitle?.length || 0} of 70 characters used
            </span>
          </div>
          <input
            type="text"
            value={formData.metaTitle || ''}
            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
            placeholder="e.g. GlowWithSH — Luxury Skincare & Beauty Rituals by Shagufi Hussain"
            className="w-full px-3 py-2 text-xs bg-white border border-[#D3D5D7] rounded-lg focus:outline-hidden focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
          />
        </div>

        {/* Homepage Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-800">
              Homepage meta description
            </label>
            <span
              className={`text-[11px] font-mono ${
                (formData.metaDescription?.length || 0) > 320 ? 'text-red-600 font-semibold' : 'text-zinc-500'
              }`}
            >
              {formData.metaDescription?.length || 0} of 320 characters used
            </span>
          </div>
          <textarea
            rows={3}
            value={formData.metaDescription || ''}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            placeholder="Indulge in botanical skincare formulated by Shagufi Hussain in Delhi..."
            className="w-full px-3 py-2 text-xs bg-white border border-[#D3D5D7] rounded-lg focus:outline-hidden focus:border-[#008060] focus:ring-1 focus:ring-[#008060] resize-y"
          />
        </div>

        {/* Social Sharing Image (Open Graph) */}
        <div className="pt-2 border-t border-[#E1E3E5] space-y-3">
          <label className="text-xs font-semibold text-zinc-800 block">
            Social sharing image (Open Graph &amp; Twitter Card)
          </label>
          <p className="text-[11px] text-zinc-500">
            This image is shown when your store is shared on WhatsApp, Instagram, Facebook, and Twitter.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            {formData.socialSharingImage ? (
              <div className="relative group w-44 h-24 rounded-lg overflow-hidden border border-[#E1E3E5] bg-zinc-100 shrink-0">
                <img
                  src={formData.socialSharingImage}
                  alt="Social preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, socialSharingImage: '' })}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white text-[10px] px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="w-44 h-24 rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center text-zinc-400 shrink-0 bg-zinc-50">
                <ImageIcon size={22} className="mb-1" />
                <span className="text-[10px]">No image set</span>
              </div>
            )}

            <div className="flex-1 space-y-2 w-full">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D3D5D7] rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer shadow-2xs">
                <UploadCloud size={14} className="text-[#008060]" />
                <span>{uploadingSocialImg ? 'Uploading image...' : 'Upload social sharing image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSocialImageFile}
                  disabled={uploadingSocialImg}
                  className="hidden"
                />
              </label>

              {socialUploadErr && (
                <span className="text-xs text-red-600 block">{socialUploadErr}</span>
              )}

              <div>
                <input
                  type="url"
                  value={formData.socialSharingImage || ''}
                  onChange={(e) => setFormData({ ...formData, socialSharingImage: e.target.value })}
                  placeholder="Or enter image URL: https://..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#D3D5D7] rounded-lg focus:outline-hidden focus:border-[#008060]"
                />
                <MediaLibraryButton className="mt-2" onSelect={(url) => setFormData({ ...formData, socialSharingImage: url })} />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics & Search Verification */}
        <div className="pt-2 border-t border-[#E1E3E5] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Google Analytics ID (GA4)
            </label>
            <input
              type="text"
              value={formData.googleAnalyticsId || ''}
              onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
              placeholder="e.g. G-XXXXXXXXXX"
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[#D3D5D7] rounded-lg focus:outline-hidden focus:border-[#008060]"
            />
            <span className="text-[11px] text-zinc-500 block mt-1">
              Tracks visitor sessions, product views, and conversions.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Google Search Console Tag
            </label>
            <input
              type="text"
              value={formData.googleSearchConsoleTag || ''}
              onChange={(e) => setFormData({ ...formData, googleSearchConsoleTag: e.target.value })}
              placeholder="e.g. google-site-verification=abc..."
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[#D3D5D7] rounded-lg focus:outline-hidden focus:border-[#008060]"
            />
            <span className="text-[11px] text-zinc-500 block mt-1">
              Verifies domain ownership with Google for indexing.
            </span>
          </div>
        </div>

        {/* Direct Sitemap & Robots Links */}
        <div className="pt-2 border-t border-[#E1E3E5] flex flex-wrap items-center gap-4 text-xs">
          <span className="text-zinc-600 font-medium">Store Crawling:</span>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="text-[#008060] hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>View XML Sitemap</span>
            <ExternalLink size={11} />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="text-[#008060] hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>View Robots.txt</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Business Coordinates */}
      <div className="bg-white p-6 rounded-xl border border-[#E1E3E5] shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#202223] flex items-center gap-2">
          <Building2 size={18} className="text-[#008060]" />
          <span>Atelier Physical Location</span>
        </h3>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Official Registered Brand Name
            </label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Founder &amp; Formulator
            </label>
            <input
              type="text"
              value={formData.founder}
              onChange={(e) => setFormData({ ...formData, founder: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Studio Street Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Postal Code (PIN)
            </label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono"
            />
          </div>
        </div>
      </div>

      {/* Contact Channels */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <h3 className="font-serif text-xl text-[#241E1C] flex items-center gap-2">
          <Phone size={18} className="text-[#C4A36A]" />
          <span>Customer Care Communication</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Direct Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              WhatsApp Concierge Line
            </label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
            Support Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
          />
        </div>
      </div>

      {/* Shipping & Delivery Rules */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <h3 className="font-serif text-xl text-[#241E1C] flex items-center gap-2">
          <Truck size={18} className="text-[#C4A36A]" />
          <span>Domestic Shipping Rules (₹ INR)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Complimentary Shipping Threshold (₹)
            </label>
            <input
              type="number"
              min={0}
              value={formData.freeShippingThreshold}
              onChange={(e) =>
                setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2 text-xs font-sans font-semibold bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
            <span className="text-[11px] text-[#665D58] block mt-1">
              Cart subtotals equal to or exceeding this get free delivery.
            </span>
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
              Standard Courier Flat Fee (₹)
            </label>
            <input
              type="number"
              min={0}
              value={formData.standardShippingFee}
              onChange={(e) =>
                setFormData({ ...formData, standardShippingFee: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2 text-xs font-sans font-semibold bg-[#FAF7F3] border border-[#E7DED7] rounded"
            />
            <span className="text-[11px] text-[#665D58] block mt-1">
              Charged on orders below the complimentary threshold.
            </span>
          </div>
        </div>
      </div>

      {/* Security & Administrative Password */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-[#241E1C] flex items-center gap-2">
            <Lock size={18} className="text-[#C4A36A]" />
            <span>Administrative Access &amp; Master Password</span>
          </h3>
          <span className="text-[11px] font-sans text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>Master Auth</span>
          </span>
        </div>

        <p className="text-xs font-sans text-[#665D58] leading-relaxed">
          Update the master administrative password used to sign in to the GlowWithSH management backoffice.
        </p>

        {passwordMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-sans border border-emerald-200 font-medium">
            {passwordMsg}
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-sans border border-red-200 font-medium">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current master password"
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded focus:outline-hidden focus:border-[#C4A36A]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                New Password (min 8 chars) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New strong password"
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded focus:outline-hidden focus:border-[#C4A36A]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded focus:outline-hidden focus:border-[#C4A36A]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-lg text-xs uppercase font-sans font-semibold tracking-wider hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <KeyRound size={14} />
              <span>{passwordLoading ? 'Updating Master Password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database Maintenance & Reset */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-red-200 shadow-xs space-y-4">
        <h3 className="font-serif text-xl text-red-900 flex items-center gap-2">
          <ShieldAlert size={18} className="text-red-700" />
          <span>Catalog Maintenance &amp; Database Reset</span>
        </h3>
        <p className="text-xs font-sans text-[#665D58] leading-relaxed">
          Restore official catalog formulations, categories, journal articles, awards, and clean atelier configuration to official defaults.
        </p>

        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="px-5 py-2.5 bg-red-800 text-white rounded-lg text-xs uppercase font-sans font-semibold tracking-wider hover:bg-red-900 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RotateCcw size={14} />
          <span>{resetting ? 'Resetting Atelier Seed...' : 'Reset to Official Atelier Catalog Seed'}</span>
        </button>
      </div>
    </div>
  );
};
