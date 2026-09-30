import React, { useState } from 'react';
import { Review, Product } from '../../types';
import { formatDate } from '../../utils/format';
import { Star, CheckCircle2, XCircle, Trash2, Filter } from 'lucide-react';

interface AdminReviewsProps {
  reviews: Review[];
  products: Product[];
  onModerateReview: (reviewId: string, status: 'approved' | 'hidden') => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
}

export const AdminReviews: React.FC<AdminReviewsProps> = ({
  reviews,
  products,
  onModerateReview,
  onDeleteReview,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');

  const filtered = reviews.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getProductName = (productId: string, defaultName: string) => {
    const p = products.find((prod) => prod.id === productId);
    return p ? p.name : defaultName || 'Unknown Formulation';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
            Customer Reviews Moderation ({reviews.length})
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Screen incoming verified customer reviews before publication on product detail pages.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'hidden'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer capitalize ${
                filter === st
                  ? 'bg-[#241E1C] text-[#FAF7F3] font-semibold'
                  : 'bg-white text-[#241E1C] border border-[#E7DED7] hover:bg-[#FAF7F3]'
              }`}
            >
              {st} ({reviews.filter((r) => (st === 'all' ? true : r.status === st)).length})
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-[#E7DED7] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Star size={24} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">
              {filter !== 'all' ? 'No reviews match your filter' : 'No customer reviews yet'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {filter !== 'all'
                ? 'Try resetting the moderation filter.'
                : 'Customer reviews submitted on product formulation pages will appear here for atelier moderation.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#FAF7F3] border-b border-[#E7DED7] text-[#665D58] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Reviewer &amp; Date</th>
                  <th className="px-4 py-3.5">Formulation</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-4 py-3.5">Commentary</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DED7]">
                {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAF7F3]/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-[#241E1C] block">{r.customerName}</span>
                    <span className="text-[11px] text-[#665D58]">{formatDate(r.createdAt)}</span>
                  </td>

                  <td className="px-4 py-3.5 font-medium text-[#241E1C]">
                    {getProductName(r.productId, r.productName)}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center text-[#C4A36A]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < r.rating ? 'fill-current' : 'text-zinc-300'}
                        />
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 max-w-xs text-[#665D58] leading-relaxed">
                    <span className="line-clamp-2">{r.reviewText}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${
                        r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'hidden'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      {r.status !== 'approved' && (
                        <button
                          onClick={() => onModerateReview(r.id, 'approved')}
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[11px] font-sans hover:bg-emerald-800"
                        >
                          Approve
                        </button>
                      )}
                      {r.status !== 'hidden' && (
                        <button
                          onClick={() => onModerateReview(r.id, 'hidden')}
                          className="px-2.5 py-1 bg-amber-700 text-white rounded text-[11px] font-sans hover:bg-amber-800"
                        >
                          Hide
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this review permanently?')) {
                            onDeleteReview(r.id);
                          }
                        }}
                        className="p-1 text-[#665D58] hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
};
