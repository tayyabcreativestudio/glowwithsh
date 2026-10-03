import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { formatINR } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Badge } from '../components/common/Badge';
import { ProductCard } from '../components/storefront/ProductCard';
import { api } from '../services/api';
import { analyticsItem, trackCommerce } from '../utils/analytics';
import {
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  CheckCircle2,
  Share2,
  Check,
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  relatedProducts: Product[];
  onSelectProduct: (slug: string) => void;
  onNavigateToCheckout: () => void;
  onBackToShop: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  relatedProducts,
  onSelectProduct,
  onNavigateToCheckout,
  onBackToShop,
}) => {
  const { addToCart, setIsCartOpen, shippingSettings } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [selectedImage, setSelectedImage] = useState(product.primaryImage);
  const [quantity, setQuantity] = useState(1);
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    description: true,
    benefits: true,
    ingredients: false,
    howToUse: false,
    shipping: false,
  });

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    trackCommerce('view_item', [analyticsItem(product)], product.price);
    setSelectedImage(product.primaryImage);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch verified reviews for this product
    api.getReviews(product.id)
      .then((data) => setReviews(data))
      .catch(() => setReviews([]));
  }, [product]);

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onNavigateToCheckout();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewText) return;
    try {
      await api.submitReview({
        productId: product.id,
        productName: product.name,
        customerName: reviewName,
        rating: reviewRating,
        reviewText,
      });
      setReviewSubmitted(true);
      setReviewName('');
      setReviewText('');
    } catch (e) {
      console.error(e);
    }
  };

  const mediaList =
    product.mediaGallery && product.mediaGallery.length > 0
      ? product.mediaGallery
      : [product.primaryImage];

  const isOutOfStock =
    product.trackInventory && product.stockQuantity <= 0 && !product.allowBackorders;
  const isLowStock =
    product.trackInventory &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= product.lowStockThreshold;

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <div id="product-detail-page" className="min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Bar */}
        <nav className="flex items-center space-x-2 text-xs font-sans text-[#6B5F82] mb-8">
          <button onClick={onBackToShop} className="hover:text-[#7C3AED] transition-colors cursor-pointer">
            Catalog
          </button>
          <span>/</span>
          <span className="text-[#6B5F82]">{product.categoryName}</span>
          <span>/</span>
          <span className="text-[#1E1630] font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Top Product Hero: Media & Purchasing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-20">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnail Rail */}
            {mediaList.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[580px] shrink-0">
                {mediaList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border transition-all cursor-pointer shrink-0 ${
                      selectedImage === img
                        ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]'
                        : 'border-[#DDD6F3] opacity-70 hover:opacity-100 hover:border-[#A78BFA]'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 relative aspect-4/5 rounded-2xl overflow-hidden glass-card shadow-sm">
              <img
                src={selectedImage}
                alt={selectedImage.includes('images.unsplash.com') ? `Illustrative stock photo for ${product.name}` : product.name}
                className="w-full h-full object-cover object-center"
              />
              {selectedImage.includes('images.unsplash.com') && <p className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-[#1E1630]">Illustrative stock photo. Contact the store for product packaging photos.</p>}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {(product.featured || product.bestSeller || product.newProduct || product.limitedEdition) && <Badge type="FEATURED" />}
                {discountPercent && (
                  <span className="bg-[#1E1630]/85 text-white text-[10px] font-sans uppercase font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Buying Information */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold">
                {product.categoryName}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1630] font-normal mt-1 leading-tight">
                {product.name}
              </h1>
              <span className="text-xs font-sans text-[#6B5F82] block mt-1">
                SKU: {product.sku} • {product.size}
              </span>
            </div>

            {/* Price Row */}
            <div className="pt-2 border-t border-[#DDD6F3]/60 flex items-baseline gap-3">
              <span className="font-sans text-3xl font-semibold text-[#1E1630]">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg line-through text-[#6B5F82] font-sans">
                  {formatINR(product.compareAtPrice)}
                </span>
              )}
              <span className="text-xs font-sans text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Taxes Included
              </span>
            </div>

            {/* Short Descriptor */}
            <p className="font-sans text-sm text-[#6B5F82] leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Inventory Status */}
            <div className="text-xs font-sans">
              {isOutOfStock ? (
                <span className="text-[#8F3E3E] font-semibold">Currently Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-[#7C3AED] font-medium">
                  Limited batch remaining ({product.stockQuantity} units left)
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={13} />
                  In Stock &amp; Ready for Express Dispatch
                </span>
              )}
            </div>

            {/* Quantity Selector and Actions */}
            {!isOutOfStock && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-sans text-[#6B5F82] uppercase tracking-wider">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-[#DDD6F3] rounded-xl glass-surface overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="p-2 text-[#6B5F82] hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 text-sm font-sans font-semibold text-[#1E1630]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        const maxStock = (product.trackInventory && !product.allowBackorders) ? product.stockQuantity : 999;
                        if (quantity < maxStock) {
                          setQuantity(quantity + 1);
                        }
                      }}
                      disabled={Boolean(product.trackInventory && !product.allowBackorders && quantity >= product.stockQuantity)}
                      className="p-2 text-[#6B5F82] hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    id="pdp-add-to-cart-btn"
                    onClick={handleAddToCart}
                    className="py-3.5 px-6 glass-btn-secondary text-[#1E1630] text-xs uppercase tracking-widest font-sans font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag size={16} className="text-[#7C3AED]" />
                    <span>Add to Bag</span>
                  </button>

                  <button
                    id="pdp-buy-now-btn"
                    onClick={handleBuyNow}
                    className="py-3.5 px-6 glass-btn-primary text-white text-xs uppercase tracking-widest font-sans font-semibold rounded-xl text-center cursor-pointer shadow-md"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            )}

            {/* Utility actions: Wishlist & Share */}
            <div className="flex items-center justify-between pt-3 border-t border-[#DDD6F3]/60 text-xs font-sans text-[#6B5F82]">
              <button
                onClick={() => toggleWishlist(product)}
                className="flex items-center gap-1.5 hover:text-[#7C3AED] transition-colors cursor-pointer"
              >
                <Heart size={15} className={isWishlisted ? 'fill-[#7C3AED] text-[#7C3AED]' : ''} />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 hover:text-[#7C3AED] transition-colors cursor-pointer"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                <span>{copiedLink ? 'Link Copied' : 'Share Formula'}</span>
              </button>
            </div>

            {/* Trust Badges Strip */}
            <div className="glass-surface p-4 rounded-2xl border border-[#DDD6F3] space-y-2 text-xs font-sans text-[#6B5F82]">
              <div className="flex items-center gap-2 text-[#1E1630]">
                <Truck size={15} className="text-[#A78BFA]" />
                <span>Free shipping from {formatINR(shippingSettings.freeShippingThreshold)}; shipping is confirmed at checkout.</span>
              </div>
              <div className="flex items-center gap-2 text-[#1E1630]">
                <ShieldCheck size={15} className="text-[#A78BFA]" />
                <a href="/contact" className="underline">Questions about this product? Contact the store.</a>
              </div>
            </div>

            <section className="space-y-2 text-sm leading-relaxed text-[#554C68]">
              <h2 className="font-serif text-xl text-[#1E1630]">Before ordering</h2>
              <p>Review the product details and directions. <a href="/contact" className="underline">Contact the store</a> if you need clarification before choosing this product.</p>
            </section>
            {/* Accordion Tabs */}
            <div className="divide-y divide-[#DDD6F3] border-t border-b border-[#DDD6F3] pt-2">
              {/* Description */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('description')}
                  className="w-full flex items-center justify-between font-serif text-lg text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer text-left"
                >
                  <span>Description &amp; Ritual</span>
                  {openAccordions.description ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openAccordions.description && (
                  <div className="pt-2 text-sm font-sans text-[#6B5F82] leading-relaxed">
                    {product.description}
                  </div>
                )}
              </div>

              {/* Benefits */}
              {product.benefits && product.benefits.length > 0 && (
                <div className="py-3">
                  <button
                    onClick={() => toggleAccordion('benefits')}
                    className="w-full flex items-center justify-between font-serif text-lg text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer text-left"
                  >
                    <span>Key Skin Benefits</span>
                    {openAccordions.benefits ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openAccordions.benefits && (
                    <ul className="pt-2 space-y-1.5 text-sm font-sans text-[#6B5F82]">
                      {product.benefits.map((b, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Ingredients */}
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="py-3">
                  <button
                    onClick={() => toggleAccordion('ingredients')}
                    className="w-full flex items-center justify-between font-serif text-lg text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer text-left"
                  >
                    <span>Ingredients Profile</span>
                    {openAccordions.ingredients ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openAccordions.ingredients && (
                    <div className="pt-2 text-xs font-sans text-[#6B5F82] leading-relaxed">
                      {product.ingredients.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* How to Use */}
              {product.howToUse && (
                <div className="py-3">
                  <button
                    onClick={() => toggleAccordion('howToUse')}
                    className="w-full flex items-center justify-between font-serif text-lg text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer text-left"
                  >
                    <span>How to Use</span>
                    {openAccordions.howToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openAccordions.howToUse && (
                    <div className="pt-2 text-sm font-sans text-[#6B5F82] leading-relaxed">
                      {product.howToUse}
                    </div>
                  )}
                </div>
              )}

              {/* Shipping & Delivery */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between font-serif text-lg text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer text-left"
                >
                  <span>Shipping &amp; Courier Policy</span>
                  {openAccordions.shipping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openAccordions.shipping && (
                  <div className="pt-2 text-xs font-sans text-[#6B5F82] space-y-1.5 leading-relaxed">
                    <p>Check delivery terms before ordering. Contact the store for questions about your address or dispatch timing.</p>
                    <p><a href="/policies/shipping" className="underline">Shipping information</a> · <a href="/policies/refunds" className="underline">Returns and refunds</a> · <a href="/track-order" className="underline">Track an order</a></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section id="product-reviews" className="py-12 border-t border-[#DDD6F3]">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold">
                  AUTHENTIC EXPERIENCES
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#1E1630] mt-0.5">
                  Verified Customer Thoughts
                </h3>
              </div>
              <button
                onClick={() => setIsWritingReview(!isWritingReview)}
                className="px-4 py-2 glass-btn-secondary text-[#1E1630] rounded-xl text-xs uppercase font-sans font-semibold tracking-wider transition-all cursor-pointer self-start sm:self-auto"
              >
                {isWritingReview ? 'Cancel' : 'Write a Review'}
              </button>
            </div>

            {/* Write a Review Form */}
            {isWritingReview && (
              <form
                onSubmit={handleReviewSubmit}
                className="glass-card p-6 rounded-2xl space-y-4 shadow-sm"
              >
                <h4 className="font-serif text-lg text-[#1E1630]">Share your ritual experience</h4>
                <p className="text-xs font-sans text-[#6B5F82]">
                  Submitted reviews are moderated before publication. A verified purchase badge appears only when the store has confirmed the purchase.
                </p>

                {reviewSubmitted ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-sans flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Thank you. Your review has been submitted for verification.</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans text-[#6B5F82] mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl text-[#1E1630] focus:outline-none focus:border-[#7C3AED]"
                          placeholder="e.g. Priya S."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-sans text-[#6B5F82] mb-1">Rating</label>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl text-[#1E1630] focus:outline-none focus:border-[#7C3AED]"
                        >
                          <option value={5}>5 Stars - Exceeded Expectations</option>
                          <option value={4}>4 Stars - Very Satisfied</option>
                          <option value={3}>3 Stars - Good</option>
                          <option value={2}>2 Stars - Fair</option>
                          <option value={1}>1 Star - Needs Improvement</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-sans text-[#6B5F82] mb-1">Your Review</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl text-[#1E1630] focus:outline-none focus:border-[#7C3AED]"
                        placeholder="Describe texture, skin feel, fragrance, and your daily experience..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 glass-btn-primary text-white rounded-xl text-xs font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      Submit for Moderation
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Reviews List or Graceful Empty Notice */}
            {reviews.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-center py-10 space-y-2">
                <p className="font-serif text-lg text-[#1E1630]">No approved reviews yet for this product</p>
                <p className="text-xs font-sans text-[#6B5F82]">
                  Be the first to share your experience with {product.name}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="glass-card p-5 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-semibold text-sm text-[#1E1630]">
                          {rev.customerName}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-[#A78BFA]">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={13} className="fill-[#A78BFA]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
                      {rev.reviewText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Complete the Routine / Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="pt-16 border-t border-[#DDD6F3]">
            <div className="mb-8">
              <span className="text-xs uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold">
                HARMONIOUS PAIRINGS
              </span>
              <h3 className="font-serif text-3xl text-[#1E1630] mt-1">
                Complete the Routine
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  onClick={onSelectProduct}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
