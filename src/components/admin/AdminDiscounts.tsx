import React, { useState, useEffect } from 'react';
import { DiscountCode } from '../../types';
import { api } from '../../services/api';
import { formatINR } from '../../utils/format';
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, Tag, Copy, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minSpend: string;
    active: boolean;
  }>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minSpend: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.adminGetDiscounts();
      setDiscounts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch discounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleOpenCreate = () => {
    setEditingDiscount(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      minSpend: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DiscountCode) => {
    setEditingDiscount(d);
    setFormData({
      code: d.code,
      discountType: d.discountType,
      discountValue: d.discountValue,
      minSpend: d.minSpend ? String(d.minSpend) : '',
      active: d.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert('Promo code is required');
      return;
    }
    if (formData.discountValue <= 0) {
      alert('Discount value must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<DiscountCode> = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minSpend: formData.minSpend ? Number(formData.minSpend) : undefined,
        active: formData.active,
      };

      if (editingDiscount) {
        await api.adminUpdateDiscount(editingDiscount.id, payload);
      } else {
        await api.adminCreateDiscount(payload);
      }

      setIsModalOpen(false);
      await fetchDiscounts();
    } catch (err: any) {
      alert(err.message || 'Failed to save discount code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (d: DiscountCode) => {
    try {
      await api.adminUpdateDiscount(d.id, { active: !d.active });
      await fetchDiscounts();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle discount state');
    }
  };

  const handleDelete = async (d: DiscountCode) => {
    if (!confirm(`Are you sure you want to permanently delete code "${d.code}"?`)) {
      return;
    }
    try {
      await api.adminDeleteDiscount(d.id);
      await fetchDiscounts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete discount');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
            Promotions &amp; Privileges ({discounts.length})
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Configure promotional discount codes, spend thresholds, and seasonal customer privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiscounts}
            className="p-2.5 bg-white border border-[#E7DED7] rounded-lg text-[#665D58] hover:text-[#241E1C] hover:bg-[#FAF7F3] transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-lg text-xs uppercase font-sans font-semibold tracking-wider hover:bg-[#362D2A] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E7DED7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#FAF7F3] border-b border-[#E7DED7] text-[#665D58] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Promo Code</th>
                <th className="px-4 py-3.5">Privilege Type</th>
                <th className="px-4 py-3.5">Discount Value</th>
                <th className="px-4 py-3.5">Minimum Spend</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED7]">
              {loading && discounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#665D58]">
                    <div className="w-6 h-6 border-2 border-[#C4A36A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading promotional privileges...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#665D58]">
                    No promotional codes configured yet. Click "Create Promo Code" to add one.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-[#FAF7F3]/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-[#FAF7F3] px-2.5 py-1 rounded border border-[#E7DED7] font-semibold text-[#241E1C]">
                          {d.code}
                        </span>
                        <button
                          onClick={() => copyCode(d.code)}
                          className="text-[#665D58] hover:text-[#241E1C] p-1 cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy size={12} />
                        </button>
                        {copiedCode === d.code && (
                          <span className="text-[10px] text-emerald-700">Copied</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 capitalize text-[#241E1C]">
                      {d.discountType === 'percentage' ? 'Percentage Off (%)' : 'Fixed Flat Off (₹)'}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-[#241E1C]">
                      {d.discountType === 'percentage' ? `${d.discountValue}%` : formatINR(d.discountValue)}
                    </td>

                    <td className="px-4 py-3.5 text-[#665D58]">
                      {d.minSpend ? formatINR(d.minSpend) : <span className="text-zinc-400">None</span>}
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleActive(d)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider cursor-pointer ${
                          d.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        {d.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{d.active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1.5 text-[#665D58] hover:text-[#241E1C] hover:bg-[#FAF7F3] rounded cursor-pointer"
                          title="Edit discount"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                          title="Delete discount"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E7DED7] shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E7DED7] pb-3">
              <h3 className="font-serif text-lg text-[#241E1C] flex items-center gap-2">
                <Tag size={16} className="text-[#C4A36A]" />
                <span>{editingDiscount ? 'Edit Privilege Code' : 'New Privilege Code'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#665D58] hover:text-[#241E1C] p-1 cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#665D58] mb-1 font-medium uppercase tracking-wider text-[10px]">
                  Promo Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GLOW15"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded-lg focus:outline-none focus:border-[#241E1C] uppercase font-mono font-bold text-[#241E1C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#665D58] mb-1 font-medium uppercase tracking-wider text-[10px]">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded-lg focus:outline-none focus:border-[#241E1C] text-[#241E1C]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#665D58] mb-1 font-medium uppercase tracking-wider text-[10px]">
                    Value * {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? '100' : '100000'}
                    required
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded-lg focus:outline-none focus:border-[#241E1C] text-[#241E1C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#665D58] mb-1 font-medium uppercase tracking-wider text-[10px]">
                  Minimum Spend (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Optional (e.g. 999)"
                  value={formData.minSpend}
                  onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F3] border border-[#E7DED7] rounded-lg focus:outline-none focus:border-[#241E1C] text-[#241E1C]"
                />
                <span className="text-[10px] text-[#665D58] mt-1 block">
                  Order subtotal required to qualify for this privilege.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="active-toggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-[#241E1C] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="active-toggle" className="text-xs text-[#241E1C] cursor-pointer">
                  Activate promo code immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DED7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E7DED7] text-[#665D58] rounded-lg hover:bg-[#FAF7F3] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#241E1C] text-[#FAF7F3] rounded-lg font-semibold hover:bg-[#362D2A] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingDiscount ? 'Update Code' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
