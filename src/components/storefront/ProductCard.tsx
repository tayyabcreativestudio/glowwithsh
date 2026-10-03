import React, { useState } from 'react';
import { Heart, Plus, Check } from 'lucide-react';
import { Product } from '../../types';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/format';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { analyticsItem, trackCommerce } from '../../utils/analytics';
import { responsiveImage } from '../../utils/responsiveImage';

interface ProductCardProps {
  product: Product;
  onClick: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [isHovered, setIsHovered] = useState(false);
  const [addedEffect, setAddedEffect] = useState(false);
  const select = () => { trackCommerce('select_item', [analyticsItem(product)]); onClick(product.slug); };

  const hasSecondaryImage = product.mediaGallery && product.mediaGallery.length > 1;
  const secondaryImage = hasSecondaryImage ? product.mediaGallery[1] : product.primaryImage;
  const illustrative = (isHovered && hasSecondaryImage ? secondaryImage : product.primaryImage).includes('images.unsplash.com');

  // Determine badge
  let badgeText = '';
  if (product.bestSeller || product.newProduct || product.limitedEdition) badgeText = 'FEATURED';
  else if (product.compareAtPrice && product.compareAtPrice > product.price) badgeText = 'SALE';
  else if (product.featured) badgeText = 'FEATURED';

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.trackInventory && product.stockQuantity <= 0 && !product.allowBackorders) return;
    addToCart(product, 1);
    setAddedEffect(true);
    setTimeout(() => setAddedEffect(false), 1200);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isOutOfStock = product.trackInventory && product.stockQuantity <= 0 && !product.allowBackorders;
  const isLowStock = product.trackInventory && product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={select}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col justify-between glass-card glass-card-hover rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
    >
      {/* Media Container */}
      <div className="relative w-full aspect-4/5 overflow-hidden bg-[#EDE8F5]/40">
        <img
          {...responsiveImage(isHovered && hasSecondaryImage ? secondaryImage : product.primaryImage, '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw')}
          width="640" height="800"
          alt={illustrative ? `Illustrative stock photo for ${product.name}` : product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-700 ease-out"
        />
        {illustrative && <span className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-[10px] text-[#1E1630]">Illustrative stock photo</span>}

        {/* Top Badges & Wishlist */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
          <div className="flex flex-col gap-1.5">
            {badgeText && <Badge type={badgeText} />}
            {discountPercent && (
              <span className="inline-flex items-center text-[9px] font-sans font-semibold bg-[#1E1630]/85 text-white px-2 py-0.5 rounded-full tracking-wider">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <button
            onClick={handleWishlistToggle}
            aria-label="Toggle wishlist"
            className="pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm"
            style={{
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(167,139,250,0.2)',
            }}
          >
            <Heart
              size={15}
              className={isWishlisted ? 'fill-[#A78BFA] text-[#6D28D9]' : 'text-[#1E1630]'}
            />
          </button>
        </div>

        {/* Stock Alert Pill if low/out */}
        {isOutOfStock ? (
          <div className="absolute bottom-3 left-3 bg-[#1E1630]/90 text-white text-[10px] font-sans uppercase tracking-wider px-2.5 py-1 rounded-lg">
            Sold Out
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-3 left-3 bg-[#6D28D9] text-white text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 rounded-lg">
            Few left
          </div>
        ) : null}

        {/* Quick Add overlay button */}
        {!isOutOfStock && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleQuickAdd}
              aria-label={`Quick add ${product.name}`}
              className="px-3.5 py-2 glass-btn-primary text-xs font-sans font-medium uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {addedEffect ? (
                <>
                  <Check size={13} />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus size={13} />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Information Container */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-2">
        <div>
          <span className="text-[10px] uppercase font-sans tracking-[0.15em] text-[#6D28D9] font-medium">
            {product.categoryName}
          </span>
          <h3 className="font-serif text-base sm:text-lg text-[#1E1630] group-hover:text-[#7C3AED] transition-colors font-medium leading-snug line-clamp-2 mt-0.5">
            <a href={`/product/${product.slug}`} onClick={event => { event.preventDefault(); event.stopPropagation(); select(); }}>{product.name}</a>
          </h3>
          <p className="text-xs font-sans text-[#6B5F82] line-clamp-1 mt-1">
            {product.shortDescription}
          </p>
        </div>

        <div className="pt-2 border-t border-[#DDD6F3]/60 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-semibold text-base text-[#1E1630]">
              {formatINR(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs line-through text-[#6B5F82] font-sans">
                {formatINR(product.compareAtPrice)}
              </span>
            )}
          </div>
          <span className="text-[11px] font-sans text-[#6B5F82]">
            {product.size}
          </span>
        </div>
      </div>
    </div>
  );
};
