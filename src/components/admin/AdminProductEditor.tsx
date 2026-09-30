import React, { useState, useRef } from 'react';
import { Product, Category } from '../../types';
import { api } from '../../services/api';
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  Upload,
  Globe,
  Star,
  CheckCircle2,
  Sparkles,
  Search,
  ExternalLink,
  Layers,
  DollarSign,
  Package,
  FileText,
  Tag,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface AdminProductEditorProps {
  product: Product | null; // null means new product
  categories: Category[];
  existingProducts: Product[];
  onSave: (productData: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

export const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
  product,
  categories,
  existingProducts,
  onSave,
  onCancel,
}) => {
  // Main details
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || 'cat-creams');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [description, setDescription] = useState(product?.description || '');
  const [size, setSize] = useState(product?.size || '50 ml');
  const [skinType, setSkinType] = useState(product?.skinType || 'All skin types');
  const [productType, setProductType] = useState(product?.productType || 'Rich Face Cream');
  const [howToUse, setHowToUse] = useState(product?.howToUse || '');

  // Pricing & Shopify Margin/Profit Calculator
  const [price, setPrice] = useState<number>(product?.price ?? 999);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(product?.compareAtPrice);
  const [costPrice, setCostPrice] = useState<number | undefined>(product?.costPrice);

  // Inventory
  const [trackInventory, setTrackInventory] = useState(product ? product.trackInventory : true);
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity ?? 50);
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold ?? 10);
  const [allowBackorders, setAllowBackorders] = useState(product?.allowBackorders ?? false);

  // Status & Badges
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>(product?.status || 'published');
  const [bestSeller, setBestSeller] = useState(product?.bestSeller || false);
  const [newProduct, setNewProduct] = useState(product?.newProduct || false);
  const [limitedEdition, setLimitedEdition] = useState(product?.limitedEdition || false);
  const [featured, setFeatured] = useState(product?.featured || false);

  // Benefits & Ingredients
  const [benefitsInput, setBenefitsInput] = useState(product?.benefits?.join(', ') || '');
  const [ingredientsInput, setIngredientsInput] = useState(product?.ingredients?.join(', ') || '');

  // Media
  const [mediaGallery, setMediaGallery] = useState<string[]>(
    product?.mediaGallery || (product ? [product.primaryImage] : ['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop'])
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shopify-style Search Engine Listing (SEO)
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription || '');
  const [isEditingSeo, setIsEditingSeo] = useState(Boolean(product?.seoTitle || product?.seoDescription));
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [seoAssistantNote, setSeoAssistantNote] = useState('');

  // Saving state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate slug & SKU if creating new
  const handleNameChange = (val: string) => {
    setName(val);
    if (!product) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);

      const generatedSku = `GW-${val.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      if (!sku) setSku(generatedSku);

      if (!seoTitle) {
        setSeoTitle(`${val} | GlowWithSH by Shagufi Hussain`);
      }
    }
  };

  // Check for duplicate name warning
  const isDuplicateName = existingProducts.some(
    (p) => p.id !== product?.id && p.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  // Margin & Profit calculations (Shopify feature)
  const parsedPrice = Number(price) || 0;
  const parsedCost = Number(costPrice) || 0;
  const profit = parsedCost > 0 ? parsedPrice - parsedCost : 0;
  const marginPercentage = parsedPrice > 0 && parsedCost > 0 ? Math.round(((parsedPrice - parsedCost) / parsedPrice) * 100) : 0;

  const generateSeoSuggestion = async () => {
    if (name.trim().length < 2 || (shortDescription || description).trim().length < 20) {
      setSeoAssistantNote('Add a product name and at least a short description first.');
      return;
    }
    setIsGeneratingSeo(true);
    setSeoAssistantNote('');
    try {
      const suggestion = await api.adminSuggestSeo({ name, description: shortDescription || description, currentTitle: seoTitle, currentDescription: seoDescription, category: categories.find((item) => item.id === categoryId)?.name });
      setSeoTitle(suggestion.title);
      setSeoDescription(suggestion.description);
      setIsEditingSeo(true);
      setSeoAssistantNote(`Suggested focus: ${suggestion.focusKeyword}${suggestion.suggestions.length ? ` · ${suggestion.suggestions[0]}` : ''}`);
    } catch (error: any) {
      setSeoAssistantNote(error.message || 'SEO suggestion could not be generated.');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  // File Upload Handlers (Shopify media experience)
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError('');

    try {
      const uploadPromises = Array.from(files).map((file) => api.adminUploadImage(file, 'products'));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.url);
      setMediaGallery((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image file(s).');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleAddUrlImage = () => {
    if (newImageUrl.trim()) {
      setMediaGallery((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleSetPrimaryMedia = (index: number) => {
    setMediaGallery((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
  };

  const handleRemoveMedia = (index: number) => {
    setMediaGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }
    if (parsedPrice <= 0) {
      setErrorMsg('Price must be greater than 0.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const selectedCat = categories.find((c) => c.id === categoryId);

      const computedSeoTitle = (seoTitle || `${name.trim()} | GlowWithSH by Shagufi Hussain`).trim();
      const computedSeoDescription = (seoDescription || shortDescription.trim() || description.trim()).slice(0, 320);

      const payload: Partial<Product> = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sku.trim() || `GW-${Date.now().toString().slice(-4)}`,
        categoryId,
        categoryName: selectedCat ? selectedCat.name : 'Skincare',
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        price: parsedPrice,
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        trackInventory,
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
        allowBackorders,
        status,
        size,
        skinType,
        productType,
        howToUse,
        benefits: benefitsInput ? benefitsInput.split(',').map((s) => s.trim()).filter(Boolean) : [],
        ingredients: ingredientsInput ? ingredientsInput.split(',').map((s) => s.trim()).filter(Boolean) : [],
        primaryImage: mediaGallery[0] || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop',
        mediaGallery: mediaGallery.length > 0 ? mediaGallery : ['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop'],
        bestSeller,
        newProduct,
        limitedEdition,
        featured,
        visible: status === 'published',
        seoTitle: computedSeoTitle,
        seoDescription: computedSeoDescription,
      };

      await onSave(payload);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product formulation.');
    } finally {
      setSaving(false);
    }
  };

  const previewDisplayTitle = seoTitle || (name ? `${name} | GlowWithSH by Shagufi Hussain` : 'Product Title — GlowWithSH');
  const previewDisplayDescription =
    seoDescription ||
    shortDescription ||
    description ||
    'Discover botanical formulations crafted with intention. Pure extracts for mindful skincare rituals by GlowWithSH.';
  const previewDisplaySlug = slug || 'product-handle';

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Top Shopify-Style Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#F6F6F7]/95 backdrop-blur-md py-4 border-b border-[#E1E3E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-[#5C5F62] hover:text-[#202223] rounded-lg hover:bg-white border border-transparent hover:border-[#E1E3E5] transition-all cursor-pointer"
            title="Back to products list"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans font-bold text-xl sm:text-2xl text-[#202223]">
                {product ? product.name : 'Add product'}
              </h2>
              <span
                className={`text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  status === 'published'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : status === 'draft'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {status === 'published' ? 'Active' : status}
              </span>
            </div>
            <span className="text-xs font-sans text-[#6D7175]">
              {product ? `SKU: ${product.sku} • ID: ${product.id}` : 'Create a new product listing in your catalog'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-[#C9CCCF] rounded-lg text-xs font-sans font-semibold text-[#202223] hover:bg-[#F6F6F7] shadow-xs cursor-pointer transition-colors"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#202223] hover:bg-[#008060] text-white rounded-lg text-xs font-sans font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save product'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs font-sans border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isDuplicateName && (
        <div className="p-4 bg-amber-50 text-amber-900 rounded-xl text-xs font-sans border border-amber-200 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-700 shrink-0" />
          <span>Notice: A product with this title already exists in the catalog.</span>
        </div>
      )}

      {/* Main 2-Column Shopify Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Title, Description, Media, Pricing, Inventory, SEO */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Title & Description Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-sans font-semibold text-[#202223] mb-1.5">
                Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Golden Facewash 100ml"
                className="w-full px-3.5 py-2.5 text-sm font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all text-[#202223]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#202223] mb-1.5">
                Short Description (Catalog Summary)
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief 1-2 sentence highlight shown on collection cards"
                className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] transition-all text-[#202223]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#202223] mb-1.5">
                Description &amp; Formulation Story
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe texture, skin feel, key botanicals, and ritual guidance..."
                className="w-full px-3.5 py-2.5 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] transition-all text-[#202223] leading-relaxed"
              />
            </div>
          </div>

          {/* 2. Media Upload Card (Shopify File Drag & Drop + URL) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans font-semibold text-base text-[#202223]">Media</h3>
                <p className="text-xs font-sans text-[#6D7175]">
                  Upload high-resolution formulation photos. The first image will be your primary storefront cover.
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-[#6D7175]">
                {mediaGallery.length} {mediaGallery.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-[#008060] bg-emerald-50/50'
                  : 'border-[#C9CCCF] bg-[#FAFBFB] hover:bg-[#F6F6F7]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white border border-[#E1E3E5] flex items-center justify-center text-[#5C5F62] shadow-xs">
                  {isUploading ? <Loader2 size={22} className="animate-spin text-[#008060]" /> : <Upload size={22} />}
                </div>
                <div className="text-xs font-sans">
                  <span className="font-semibold text-[#008060] hover:underline">Click to upload files</span> or drag and drop
                </div>
                <p className="text-[11px] font-sans text-[#6D7175]">
                  PNG, JPG, WEBP, or GIF up to 25MB each
                </p>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-red-600 font-sans">{uploadError}</p>
            )}

            {/* Add from URL alternative */}
            <div className="pt-2 border-t border-[#E1E3E5] flex items-center gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste external image URL (e.g. Unsplash or CDN)..."
                className="flex-1 px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
              />
              <button
                type="button"
                onClick={handleAddUrlImage}
                className="px-4 py-2 bg-white border border-[#C9CCCF] rounded-lg text-xs font-sans font-semibold text-[#202223] hover:bg-[#F6F6F7] cursor-pointer shrink-0"
              >
                Add URL
              </button>
            </div>

            {/* Media Gallery Thumbnails Grid */}
            {mediaGallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3">
                {mediaGallery.map((url, idx) => (
                  <div
                    key={idx}
                    className={`group relative aspect-square rounded-xl overflow-hidden border transition-all ${
                      idx === 0
                        ? 'border-[#008060] ring-2 ring-[#008060]/20'
                        : 'border-[#E1E3E5] hover:border-[#202223]'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Product media ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 bg-[#008060] text-white text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <Star size={10} fill="currentColor" />
                        <span>Primary</span>
                      </div>
                    )}

                    {/* Hover Overlay with Action Buttons */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryMedia(idx)}
                          className="p-1.5 bg-white text-[#202223] hover:text-[#008060] rounded-md shadow-xs cursor-pointer"
                          title="Set as primary cover"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded-md shadow-xs cursor-pointer"
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Pricing Card (Shopify Style with Live Profit & Margin) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-5">
            <h3 className="font-sans font-semibold text-base text-[#202223]">Pricing</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#6D7175]">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Compare-at price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#6D7175]">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={compareAtPrice ?? ''}
                    onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 1225"
                    className="w-full pl-7 pr-3 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Cost per item (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#6D7175]">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={costPrice ?? ''}
                    onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Customers won't see this"
                    className="w-full pl-7 pr-3 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                  />
                </div>
              </div>
            </div>

            {/* Shopify Live Profit & Margin Indicator */}
            {parsedCost > 0 && (
              <div className="p-4 bg-[#F6F6F7] rounded-xl border border-[#E1E3E5] flex items-center justify-between text-xs font-sans">
                <div>
                  <span className="text-[#6D7175]">Margin: </span>
                  <span className="font-semibold text-emerald-700">{marginPercentage}%</span>
                </div>
                <div>
                  <span className="text-[#6D7175]">Estimated Profit: </span>
                  <span className="font-semibold text-emerald-700">₹{profit} per item</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Inventory Card (Shopify Style) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-5">
            <h3 className="font-sans font-semibold text-base text-[#202223]">Inventory</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. GWSH-GFW-100"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Barcode / Batch Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8901234567890"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#E1E3E5] space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="w-4 h-4 rounded text-[#202223] focus:ring-[#202223]"
                />
                <span className="text-xs font-sans font-medium text-[#202223]">
                  Track quantity in inventory
                </span>
              </label>

              {trackInventory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                      Available Stock Quantity
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                      Low Stock Threshold Warning
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBackorders}
                  onChange={(e) => setAllowBackorders(e.target.checked)}
                  className="w-4 h-4 rounded text-[#202223] focus:ring-[#202223]"
                />
                <span className="text-xs font-sans font-medium text-[#202223]">
                  Continue selling when out of stock (allow backorders)
                </span>
              </label>
            </div>
          </div>

          {/* 5. Physical Product & Ritual Specifications */}
          <div className="bg-white p-6 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-4">
            <h3 className="font-sans font-semibold text-base text-[#202223]">Specifications &amp; Ritual</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Net Content / Size
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 100 g, 50 ml"
                  className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg text-[#202223]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Target Skin Type
                </label>
                <input
                  type="text"
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  placeholder="e.g. Normal to Dry, Sensitive"
                  className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg text-[#202223]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Product Type
                </label>
                <input
                  type="text"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="e.g. Night Cream, Elixir"
                  className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg text-[#202223]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                How To Use (Application Instructions)
              </label>
              <textarea
                rows={2}
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="Step-by-step application guidance..."
                className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg text-[#202223]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Formulation Benefits (Comma-separated)
                </label>
                <input
                  type="text"
                  value={benefitsInput}
                  onChange={(e) => setBenefitsInput(e.target.value)}
                  placeholder="e.g. Deep hydration, Skin barrier repair, Luminous glow"
                  className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg text-[#202223]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                  Botanical Ingredients (Comma-separated)
                </label>
                <input
                  type="text"
                  value={ingredientsInput}
                  onChange={(e) => setIngredientsInput(e.target.value)}
                  placeholder="e.g. Squalane, Saffron Stigma, Niacinamide"
                  className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg text-[#202223]"
                />
              </div>
            </div>
          </div>

          {/* 6. Search Engine Listing (Shopify SEO Card) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans font-semibold text-base text-[#202223]">Search engine listing</h3>
                <p className="text-xs font-sans text-[#6D7175]">
                  Add a title and description to see how this product might appear in a Google search engine listing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingSeo(!isEditingSeo)}
                className="text-xs font-sans font-semibold text-[#008060] hover:underline cursor-pointer"
              >
                {isEditingSeo ? 'Collapse' : 'Edit website SEO'}
              </button>
            </div>

            {/* Google Live SERP Preview Box */}
            <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#DADCE0] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#202124]">
                <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-white text-[8px] font-bold">
                  G
                </div>
                <span className="text-[11px] font-sans text-[#4D5156]">
                  glowwithsh.com › products › <span className="text-[#202124]">{previewDisplaySlug}</span>
                </span>
              </div>
              <h4 className="font-sans text-base text-[#1A0DAB] hover:underline cursor-pointer leading-snug line-clamp-1 font-medium">
                {previewDisplayTitle}
              </h4>
              <p className="text-xs font-sans text-[#4D5156] line-clamp-2 leading-relaxed">
                {previewDisplayDescription}
              </p>
            </div>

            {/* Editable SEO Fields */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E1E3E5]">
              <button type="button" onClick={generateSeoSuggestion} disabled={isGeneratingSeo} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#202223] text-white text-xs font-semibold disabled:opacity-60">
                {isGeneratingSeo ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {isGeneratingSeo ? 'Generating…' : 'Suggest SEO with Gemini'}
              </button>
              <span className="text-[11px] text-[#6D7175]">Suggestions only — review before saving.</span>
              {seoAssistantNote && <p className="basis-full text-xs text-[#4B5563]">{seoAssistantNote}</p>}
            </div>
            {isEditingSeo && (
              <div className="space-y-4 pt-2 border-t border-[#E1E3E5]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-sans font-semibold text-[#202223]">
                      Page title
                    </label>
                    <span className={`text-[11px] font-mono ${seoTitle.length > 70 ? 'text-red-600 font-bold' : 'text-[#6D7175]'}`}>
                      {seoTitle.length} of 70 characters used
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={`${name || 'Product'} | GlowWithSH by Shagufi Hussain`}
                    className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-sans font-semibold text-[#202223]">
                      Meta description
                    </label>
                    <span className={`text-[11px] font-mono ${seoDescription.length > 320 ? 'text-red-600 font-bold' : 'text-[#6D7175]'}`}>
                      {seoDescription.length} of 320 characters used
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Enter an informative snippet to attract customers from search engines..."
                    className="w-full px-3.5 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                    URL handle (Slug)
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-[#F6F6F7] border border-r-0 border-[#C9CCCF] rounded-l-lg text-xs font-mono text-[#6D7175]">
                      https://www.glowwithsh.com/product/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-[#C9CCCF] rounded-r-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Status, Publishing, Organization, Tags */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-3">
            <h3 className="font-sans font-semibold text-sm text-[#202223]">Status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs font-sans font-semibold bg-white border border-[#C9CCCF] rounded-lg text-[#202223] focus:outline-none focus:border-[#202223]"
            >
              <option value="published">Active (Available on Storefront)</option>
              <option value="draft">Draft (Hidden from customers)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Publishing & Channels Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-3">
            <h3 className="font-sans font-semibold text-sm text-[#202223]">Publishing</h3>
            <div className="space-y-2 text-xs font-sans text-[#202223]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe size={14} className="text-[#008060]" />
                  <span>Online Store</span>
                </span>
                <span className="text-emerald-700 font-medium">Visible</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#008060]" />
                  <span>WhatsApp Concierge</span>
                </span>
                <span className="text-emerald-700 font-medium">Direct Order</span>
              </div>
            </div>

            {product && (
              <div className="pt-2 border-t border-[#E1E3E5]">
                <a
                  href={`/product/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#008060] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>View on live storefront</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* Product Organization Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-4">
            <h3 className="font-sans font-semibold text-sm text-[#202223]">Product organization</h3>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-sans bg-white border border-[#C9CCCF] rounded-lg text-[#202223]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#202223] mb-1">
                Vendor
              </label>
              <input
                type="text"
                readOnly
                value="GlowWithSH by Shagufi Hussain"
                className="w-full px-3 py-2 text-xs font-sans bg-[#F6F6F7] border border-[#C9CCCF] rounded-lg text-[#6D7175]"
              />
            </div>
          </div>

          {/* Badges & Tags Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E1E3E5] shadow-xs space-y-3">
            <h3 className="font-sans font-semibold text-sm text-[#202223]">Badges &amp; Tags</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-sans text-[#202223] cursor-pointer">
                <input
                  type="checkbox"
                  checked={bestSeller}
                  onChange={(e) => setBestSeller(e.target.checked)}
                  className="w-4 h-4 rounded text-[#202223]"
                />
                <span>Bestseller Formulation</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-sans text-[#202223] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newProduct}
                  onChange={(e) => setNewProduct(e.target.checked)}
                  className="w-4 h-4 rounded text-[#202223]"
                />
                <span>New Arrival</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-sans text-[#202223] cursor-pointer">
                <input
                  type="checkbox"
                  checked={limitedEdition}
                  onChange={(e) => setLimitedEdition(e.target.checked)}
                  className="w-4 h-4 rounded text-[#202223]"
                />
                <span>Limited Edition Batch</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-sans text-[#202223] cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#202223]"
                />
                <span>Feature on Homepage Catalog</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
