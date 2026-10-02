import React, { useState } from 'react';
import { Category, Product } from '../../types';
import { Plus, Edit, Trash2, Layers, Image as ImageIcon } from 'lucide-react';
import { MediaLibraryButton } from './MediaLibraryButton';

interface AdminCollectionsProps {
  categories: Category[];
  products: Product[];
  onSaveCategory: (cat: Partial<Category> & { productIds?: string[] }) => Promise<void>;
  onDeleteCategory: (catId: string) => Promise<void>;
}

export const AdminCollections: React.FC<AdminCollectionsProps> = ({
  categories,
  products,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingCat(null);
    setIsNew(true);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop');
    setSelectedProductIds([]);
    setProductQuery('');
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat);
    setIsNew(false);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.image || '');
    setSelectedProductIds(products.filter((product) => product.categoryId === cat.id).map((product) => product.id));
    setProductQuery('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveCategory({
        id: editingCat?.id,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        image: imageUrl,
        productIds: selectedProductIds,
      });
      setEditingCat(null);
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
            Product Categories ({categories.length})
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Build storefront categories and assign any saved product, including drafts and out-of-stock items.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-5 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-lg text-xs uppercase font-sans font-semibold tracking-wider hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>New Category</span>
        </button>
      </div>

      {/* Grid of collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((c) => {
          const productCount = products.filter((p) => p.categoryId === c.id).length;

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-[#E7DED7] overflow-hidden shadow-xs flex flex-col justify-between group hover:border-[#C4A36A] transition-colors"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-[#F1EBE5]">
                  {c.image && (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <span className="absolute top-3 right-3 bg-[#241E1C]/80 backdrop-blur-xs text-white text-[10px] font-sans font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {productCount} Products
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-serif text-xl text-[#241E1C]">{c.name}</h3>
                  <span className="font-mono text-[11px] text-[#B98D80] block">
                    /{c.slug}
                  </span>
                  <p className="text-xs font-sans text-[#665D58] line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-[#E7DED7] bg-[#FAF7F3] flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="text-xs font-sans font-semibold text-[#241E1C] hover:text-[#C4A36A] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit size={13} />
                  <span>Edit Category</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete collection "${c.name}"?`)) {
                      onDeleteCategory(c.id);
                    }
                  }}
                  className="text-xs font-sans text-[#8F3E3E] hover:text-red-700 p-1 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {(editingCat || isNew) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-4 shadow-xl border border-[#E7DED7]"
          >
            <h3 className="font-serif text-2xl text-[#241E1C]">
              {isNew ? 'Create Product Category' : `Edit: ${editingCat?.name}`}
            </h3>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (isNew) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Description / Ritual Narrative
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                Category Cover Photo
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input type="url" required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="min-w-0 flex-1 px-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded" />
                <MediaLibraryButton onSelect={setImageUrl} />
              </div>
              {imageUrl && <img src={imageUrl} alt="Category preview" className="mt-2 h-24 w-36 rounded-lg object-cover" />}
            </div>

            <section className="rounded-xl border border-[#E7DED7] bg-[#FAF7F3] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><h4 className="text-sm font-semibold text-[#241E1C]">Products in this category</h4><p className="text-[11px] text-[#665D58]">Draft and out-of-stock products can be assigned now and published later.</p></div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#665D58]">{selectedProductIds.length} selected</span>
              </div>
              <input type="search" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search saved products…" className="mb-3 w-full rounded-lg border border-[#E7DED7] bg-white px-3 py-2 text-xs" />
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {products.filter((product) => product.name.toLowerCase().includes(productQuery.toLowerCase()) || product.sku.toLowerCase().includes(productQuery.toLowerCase())).map((product) => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2.5 hover:bg-[#F4EEE8]">
                    <input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={(event) => setSelectedProductIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} className="accent-[#241E1C]" />
                    {product.primaryImage && <img src={product.primaryImage} alt="" className="h-10 w-10 rounded-md object-cover" />}
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-[#241E1C]">{product.name}</span><span className="text-[10px] text-[#665D58]">{product.sku} · {product.status}{product.trackInventory && product.stockQuantity <= 0 ? ' · out of stock' : ''}</span></span>
                  </label>
                ))}
                {products.length === 0 && <p className="py-4 text-center text-xs text-[#665D58]">No saved products yet.</p>}
              </div>
            </section>

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingCat(null);
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
                {saving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
