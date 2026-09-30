import React, { useState } from 'react';
import { Product } from '../../types';
import { Boxes, AlertTriangle, XCircle, CheckCircle2, Search, ArrowUpDown, Edit } from 'lucide-react';

interface AdminInventoryProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number, reason: string) => Promise<void>;
}

export const AdminInventory: React.FC<AdminInventoryProps> = ({ products, onUpdateStock }) => {
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [stockInput, setStockInput] = useState<number>(0);
  const [reasonInput, setReasonInput] = useState('Fresh Atelier Restock');
  const [saving, setSaving] = useState(false);

  const lowStock = products.filter(
    (p) => p.trackInventory && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
  );
  const outOfStock = products.filter((p) => p.trackInventory && p.stockQuantity <= 0);

  const filtered = products.filter((p) => {
    if (filter === 'low') {
      if (!p.trackInventory || p.stockQuantity <= 0 || p.stockQuantity > p.lowStockThreshold) return false;
    } else if (filter === 'out') {
      if (!p.trackInventory || p.stockQuantity > 0) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setStockInput(p.stockQuantity);
    setReasonInput('Fresh Atelier Restock');
  };

  const handleSaveStock = async () => {
    if (!adjustingProduct) return;
    setSaving(true);
    try {
      await onUpdateStock(adjustingProduct.id, Number(stockInput), reasonInput);
      setAdjustingProduct(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
          Inventory &amp; Stock Levels
        </h2>
        <p className="text-xs font-sans text-[#665D58] mt-0.5">
          Real-time tracking of cosmetic units, buffer thresholds, and replenishment auditing.
        </p>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilter('all')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            filter === 'all' ? 'bg-white border-[#241E1C] shadow-sm' : 'bg-white/60 border-[#E7DED7]'
          }`}
        >
          <span className="text-xs uppercase font-sans tracking-wider text-[#665D58] block">
            Total Monitored SKUs
          </span>
          <span className="text-2xl font-bold font-sans text-[#241E1C]">
            {products.length}
          </span>
        </div>

        <div
          onClick={() => setFilter('low')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            filter === 'low' ? 'bg-white border-amber-600 shadow-sm' : 'bg-white/60 border-[#E7DED7]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-sans tracking-wider text-amber-800 font-semibold block">
              Low Stock Warnings
            </span>
            <AlertTriangle size={15} className="text-amber-700" />
          </div>
          <span className="text-2xl font-bold font-sans text-amber-800">
            {lowStock.length}
          </span>
        </div>

        <div
          onClick={() => setFilter('out')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            filter === 'out' ? 'bg-white border-red-600 shadow-sm' : 'bg-white/60 border-[#E7DED7]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-sans tracking-wider text-red-800 font-semibold block">
              Out of Stock
            </span>
            <XCircle size={15} className="text-red-700" />
          </div>
          <span className="text-2xl font-bold font-sans text-red-800">
            {outOfStock.length}
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-[#E7DED7] shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#665D58]" />
          <input
            type="text"
            placeholder="Search SKU or formulation name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded-md focus:outline-none focus:border-[#C4A36A]"
          />
        </div>
        <span className="text-xs font-sans text-[#665D58]">
          Showing {filtered.length} products
        </span>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#E7DED7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#FAF7F3] border-b border-[#E7DED7] text-[#665D58] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Product &amp; SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Available Units</th>
                <th className="px-4 py-3.5">Low Threshold</th>
                <th className="px-4 py-3.5">Health State</th>
                <th className="px-4 py-3.5 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED7]">
              {filtered.map((p) => {
                const isOut = p.trackInventory && p.stockQuantity <= 0;
                const isLow = p.trackInventory && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;

                return (
                  <tr key={p.id} className="hover:bg-[#FAF7F3]/60 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <img
                        src={p.primaryImage}
                        alt={p.name}
                        className="w-10 h-12 object-cover rounded border border-[#E7DED7]"
                      />
                      <div>
                        <span className="font-serif text-sm text-[#241E1C] font-medium block">
                          {p.name}
                        </span>
                        <span className="font-mono text-[#665D58] text-[11px]">
                          {p.sku} • {p.size}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[#665D58]">
                      {p.categoryName}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-sm text-[#241E1C]">
                      {p.stockQuantity}
                    </td>

                    <td className="px-4 py-3.5 text-[#665D58]">
                      {p.lowStockThreshold} units
                    </td>

                    <td className="px-4 py-3.5">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 text-red-800 bg-red-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          <XCircle size={12} />
                          Depleted
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          <AlertTriangle size={12} />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px]">
                          <CheckCircle2 size={12} />
                          Optimal
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenAdjust(p)}
                        className="px-3 py-1.5 bg-[#FAF7F3] border border-[#E7DED7] rounded text-xs font-sans text-[#241E1C] hover:bg-[#E7DED7] transition-colors cursor-pointer font-medium"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl border border-[#E7DED7]">
            <h3 className="font-serif text-xl text-[#241E1C]">
              Adjust Stock: {adjustingProduct.name}
            </h3>
            <p className="text-xs font-sans text-[#665D58]">
              Current available quantity in Delhi atelier: <strong>{adjustingProduct.stockQuantity} units</strong>
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                  New Quantity (Units)
                </label>
                <input
                  type="number"
                  min={0}
                  value={stockInput}
                  onChange={(e) => setStockInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-sans font-bold bg-[#FAF7F3] border border-[#E7DED7] rounded focus:outline-none focus:border-[#C4A36A]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-[#241E1C] mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded"
                >
                  <option value="Fresh Atelier Restock">Fresh Atelier Restock</option>
                  <option value="Physical Inventory Count Correction">Physical Inventory Count Correction</option>
                  <option value="Damaged in Storage">Damaged in Storage</option>
                  <option value="Sample / Press Distribution">Sample / Press Distribution</option>
                  <option value="Return to Atelier">Return to Atelier</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-4 py-2 bg-white border border-[#E7DED7] rounded text-xs font-sans text-[#665D58] hover:text-[#241E1C]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveStock}
                className="px-5 py-2 bg-[#241E1C] text-[#FAF7F3] rounded text-xs uppercase font-sans font-semibold hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors cursor-pointer"
              >
                {saving ? 'Updating...' : 'Confirm Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
