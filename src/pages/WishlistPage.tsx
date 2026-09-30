import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface WishlistPageProps {
  onNavigateToShop: () => void;
  onSelectProduct: (slug: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onNavigateToShop,
  onSelectProduct,
}) => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addedAll, setAddedAll] = React.useState(false);

  const handleAddAll = () => {
    wishlist.forEach((p) => {
      addToCart(p, 1);
    });
    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2500);
  };

  return (
    <div className="min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DDD6F3] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A78BFA]/15 text-[#7C3AED] text-[11px] font-sans font-semibold tracking-widest uppercase mb-2">
              <Heart size={12} className="fill-[#7C3AED]" />
              <span>Saved Formulas</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1630]">
              Your Personal Wishlist ({wishlist.length})
            </h1>
            <p className="text-xs font-sans text-[#6B5F82] mt-1">
              Curate your desired botanical formulas and assemble your dream daily ritual.
            </p>
          </div>

          {wishlist.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddAll}
                className="px-5 py-2.5 glass-btn-primary text-white text-xs uppercase font-sans font-semibold tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                {addedAll ? (
                  <>
                    <Check size={14} />
                    <span>All Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={14} />
                    <span>Add All to Bag</span>
                  </>
                )}
              </button>

              <button
                onClick={clearWishlist}
                className="px-4 py-2.5 bg-white text-[#6B5F82] hover:text-red-600 border border-[#DDD6F3] rounded-xl text-xs font-sans font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Clear wishlist"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {wishlist.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-3xl max-w-lg mx-auto space-y-4 border border-[#DDD6F3]">
            <div className="w-16 h-16 rounded-full bg-[#A78BFA]/15 text-[#7C3AED] flex items-center justify-center mx-auto">
              <Heart size={28} />
            </div>
            <h3 className="font-serif text-2xl text-[#1E1630]">Your Wishlist is Empty</h3>
            <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
              Explore our boutique catalog of bespoke formulations and tap the heart icon on any formula to save it for later.
            </p>
            <button
              onClick={onNavigateToShop}
              className="px-7 py-3 glass-btn-primary text-white text-xs uppercase font-sans font-semibold tracking-wider rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Sparkles size={14} />
              <span>Explore Formulations</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((prod) => (
              <div
                key={prod.id}
                className="group glass-card rounded-2xl p-4 border border-[#DDD6F3] flex flex-col justify-between hover:shadow-md transition-all space-y-3"
              >
                {/* Image & Click */}
                <div
                  onClick={() => onSelectProduct(prod.slug)}
                  className="aspect-square rounded-xl overflow-hidden bg-[#FAF7F3] cursor-pointer relative"
                >
                  <img
                    src={prod.primaryImage}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(prod.id);
                    }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-red-500 flex items-center justify-center shadow-xs cursor-pointer"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Details */}
                <div onClick={() => onSelectProduct(prod.slug)} className="cursor-pointer space-y-1">
                  <span className="text-[10px] uppercase font-sans tracking-wider text-[#A78BFA] font-semibold">
                    {prod.categoryName}
                  </span>
                  <h3 className="font-serif text-sm font-semibold text-[#1E1630] line-clamp-1">
                    {prod.name}
                  </h3>
                  <p className="text-xs font-sans text-[#6B5F82] line-clamp-2">
                    {prod.shortDescription}
                  </p>
                </div>

                {/* Price & Add to Bag */}
                <div className="pt-2 border-t border-[#DDD6F3] flex items-center justify-between">
                  <span className="font-serif text-base font-semibold text-[#1E1630]">
                    {formatINR(prod.price)}
                  </span>
                  <button
                    onClick={() => addToCart(prod, 1)}
                    className="px-3 py-1.5 glass-btn-primary text-white text-[11px] uppercase font-sans font-semibold tracking-wider rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag size={12} />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
