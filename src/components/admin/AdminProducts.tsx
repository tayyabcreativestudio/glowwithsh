import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../types';
import { formatINR } from '../../utils/format';
import {
  Search,
  Plus,
  Copy,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  ArrowUpDown,
  Filter,
  Check,
  Package,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  onAddNew: () => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleStatus: (product: Product) => void;
}

type TabType = 'all' | 'published' | 'draft' | 'archived';

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  onAddNew,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'title_asc' | 'title_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('title_asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: products.length,
      published: products.filter((p) => p.status === 'published').length,
      draft: products.filter((p) => p.status === 'draft').length,
      archived: products.filter((p) => p.status === 'archived').length,
    };
  }, [products]);

  // Filter & sort
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      // Tab filter
      if (activeTab !== 'all' && p.status !== activeTab) return false;

      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

      // Inventory filter
      if (inventoryFilter === 'in_stock') {
        if (p.trackInventory && p.stockQuantity <= 0) return false;
      } else if (inventoryFilter === 'low_stock') {
        if (!p.trackInventory || p.stockQuantity <= 0 || p.stockQuantity > p.lowStockThreshold) return false;
      } else if (inventoryFilter === 'out_of_stock') {
        if (!p.trackInventory || p.stockQuantity > 0) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          (p.skinType && p.skinType.toLowerCase().includes(q))
        );
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'title_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'title_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_asc') return a.stockQuantity - b.stockQuantity;
      if (sortBy === 'stock_desc') return b.stockQuantity - a.stockQuantity;
      return 0;
    });

    return list;
  }, [products, activeTab, selectedCategory, inventoryFilter, search, sortBy]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'CompareAtPrice', 'Stock', 'Status', 'SEO_Title', 'SEO_Description'];
    const rows = filteredProducts.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${p.categoryName}"`,
      p.price,
      p.compareAtPrice || '',
      p.stockQuantity,
      p.status,
      `"${(p.seoTitle || '').replace(/"/g, '""')}"`,
      `"${(p.seoDescription || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `glowwithsh_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#202223]">Products</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
              {products.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your skincare formulas, catalog media, pricing, inventory levels, and SEO listings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white border border-[#D3D5D7] text-[#202223] rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Export products to CSV"
          >
            <Download size={13} className="text-zinc-600" />
            <span>Export</span>
          </button>

          <button
            onClick={() => alert('Import CSV: You can update catalog data directly or upload via CSV.')}
            className="px-3 py-1.5 bg-white border border-[#D3D5D7] text-[#202223] rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Import products from CSV"
          >
            <Upload size={13} className="text-zinc-600" />
            <span>Import</span>
          </button>

          <button
            onClick={onAddNew}
            className="px-4 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-semibold tracking-wide transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Add product</span>
          </button>
        </div>
      </div>

      {/* Main Shopify Card */}
      <div className="bg-white rounded-xl border border-[#E1E3E5] shadow-xs overflow-hidden">
        {/* Shopify Polaris Tabs Header */}
        <div className="border-b border-[#E1E3E5] px-4 pt-2 flex items-center gap-2 overflow-x-auto">
          {(
            [
              { key: 'all', label: 'All', count: tabCounts.all },
              { key: 'published', label: 'Active', count: tabCounts.published },
              { key: 'draft', label: 'Draft', count: tabCounts.draft },
              { key: 'archived', label: 'Archived', count: tabCounts.archived },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedIds([]);
                }}
                className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-[#008060] text-[#008060] font-semibold'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 bg-zinc-50/60 border-b border-[#E1E3E5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-[#D3D5D7] rounded-lg focus:outline-hidden focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-zinc-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-white border border-[#D3D5D7] rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-hidden focus:border-[#008060]"
              >
                <option value="all">All collections</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Inventory Status Filter */}
            <select
              value={inventoryFilter}
              onChange={(e) => setInventoryFilter(e.target.value as any)}
              className="text-xs bg-white border border-[#D3D5D7] rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-hidden focus:border-[#008060]"
            >
              <option value="all">All inventory</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-1">
              <ArrowUpDown size={13} className="text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-white border border-[#D3D5D7] rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-hidden focus:border-[#008060]"
              >
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="stock_asc">Inventory (Low to High)</option>
                <option value="stock_desc">Inventory (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (when products are selected) */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
            <span className="font-semibold">
              {selectedIds.length} of {filteredProducts.length} product{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  selectedIds.forEach((id) => {
                    const p = products.find((item) => item.id === id);
                    if (p && p.status !== 'published') onToggleStatus(p);
                  });
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 bg-white border border-emerald-300 rounded font-medium text-emerald-800 hover:bg-emerald-100/60"
              >
                Set as Active
              </button>
              <button
                onClick={() => {
                  selectedIds.forEach((id) => {
                    const p = products.find((item) => item.id === id);
                    if (p && p.status !== 'archived') onToggleStatus(p);
                  });
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 bg-white border border-emerald-300 rounded font-medium text-emerald-800 hover:bg-emerald-100/60"
              >
                Archive
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${selectedIds.length} selected products?`)) {
                    selectedIds.forEach((id) => onDelete(id));
                    setSelectedIds([]);
                  }
                }}
                className="px-2.5 py-1 bg-red-100 border border-red-300 rounded font-medium text-red-800 hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Polaris Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Package size={24} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">No products found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== 'all' || inventoryFilter !== 'all'
                ? 'Try changing the filters or search query to find products.'
                : 'Get started by creating your first luxury skincare formulation.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(search || selectedCategory !== 'all' || inventoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('all');
                    setInventoryFilter('all');
                  }}
                  className="px-3 py-1.5 bg-white border border-[#D3D5D7] rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Clear filters
                </button>
              )}
              <button
                onClick={onAddNew}
                className="px-3.5 py-1.5 bg-[#008060] text-white rounded-lg text-xs font-semibold hover:bg-[#006e52]"
              >
                Add product
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFBFB] border-b border-[#E1E3E5] text-zinc-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 text-[#008060] focus:ring-[#008060] cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Inventory</th>
                  <th className="px-3 py-3">Collection</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E3E5]">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.trackInventory && p.stockQuantity <= 0;
                  const isLowStock =
                    p.trackInventory && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#F9FAFA] transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded border-zinc-300 text-[#008060] focus:ring-[#008060] cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail & Title */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primaryImage}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-lg border border-[#E1E3E5] bg-zinc-50 shrink-0"
                          />
                          <div className="min-w-0">
                            <button
                              onClick={() => onEdit(p)}
                              className="font-medium text-[#202223] hover:text-[#008060] hover:underline text-left block truncate font-sans text-xs"
                            >
                              {p.name}
                            </button>
                            <span className="text-[11px] text-zinc-500 font-mono block">
                              SKU: {p.sku || 'No SKU'} • {p.size || 'Standard'}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {p.bestSeller && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                  Bestseller
                                </span>
                              )}
                              {p.newProduct && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => onToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                            p.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : p.status === 'draft'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === 'published'
                                ? 'bg-emerald-600'
                                : p.status === 'draft'
                                ? 'bg-amber-600'
                                : 'bg-zinc-500'
                            }`}
                          />
                          <span className="capitalize">{p.status === 'published' ? 'Active' : p.status}</span>
                        </button>
                      </td>

                      {/* Inventory */}
                      <td className="px-3 py-3">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            <XCircle size={11} />
                            0 in stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            <AlertTriangle size={11} />
                            {p.stockQuantity} in stock (Low)
                          </span>
                        ) : (
                          <span className="text-zinc-700 font-medium text-[11px]">
                            {p.trackInventory ? `${p.stockQuantity} in stock` : 'Not tracked'}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3 text-zinc-600 font-medium">
                        {p.categoryName || 'Unassigned'}
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3">
                        <span className="font-semibold text-zinc-900 block">
                          {formatINR(p.price)}
                        </span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="text-[10px] text-zinc-400 line-through block">
                            {formatINR(p.compareAtPrice)}
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEdit(p)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                            title="Edit Product"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => onDuplicate(p)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${p.name}?`)) {
                                onDelete(p.id);
                              }
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

