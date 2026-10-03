import React, { useCallback } from 'react';
import { useDialogFocus } from '../../utils/useDialogFocus';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/format';

interface CartDrawerProps {
  onCheckout: () => void;
  onNavigateToShop: () => void;
  onSelectProduct: (slug: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onCheckout,
  onNavigateToShop,
  onSelectProduct,
}) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalCount,
    shippingSettings,
  } = useCart();
  const close = useCallback(() => setIsCartOpen(false), [setIsCartOpen]);
  useDialogFocus(isCartOpen, 'cart-drawer-panel', close);

  if (!isCartOpen) return null;

  const FREE_SHIPPING_THRESHOLD = shippingSettings.freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = FREE_SHIPPING_THRESHOLD > 0 ? Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)) : 100;

  return (
    <div
      id="cart-drawer-overlay"
      className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200"
      style={{
        background: 'rgba(30, 22, 48, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        id="cart-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your shopping bag"
        className="w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        style={{
          background: 'rgba(248, 245, 255, 0.97)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(167, 139, 250, 0.2)',
        }}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#DDD6F3] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag size={19} className="text-[#1E1630]" />
            <h3 className="font-serif text-xl font-medium text-[#1E1630]">Your Ritual Bag</h3>
            <span className="text-xs font-sans text-[#6B5F82] px-2 py-0.5 rounded-full glass-badge">
              {totalCount}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-[#6B5F82] hover:text-[#7C3AED] rounded-lg hover:bg-[#EDE8F5] transition-colors cursor-pointer"
            aria-label="Close bag"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-5 py-3 border-b border-[#DDD6F3] text-xs font-sans" style={{ background: 'rgba(237, 232, 245, 0.5)' }}>
          {remainingForFreeShipping > 0 ? (
            <p className="text-[#6B5F82] mb-1.5">
              Add <span className="font-semibold text-[#1E1630]">{formatINR(remainingForFreeShipping)}</span> more for complimentary express delivery across India.
            </p>
          ) : (
            <p className="font-semibold flex items-center gap-1.5 mb-1.5 text-[#7C3AED]">
              <ShieldCheck size={14} className="text-[#A78BFA]" />
              You qualify for complimentary express delivery!
            </p>
          )}
          <div className="w-full h-1.5 bg-[#DDD6F3] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${freeShippingProgress}%`,
                background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
              }}
            />
          </div>
        </div>

        {/* Item List or Empty State */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EDE8F5] flex items-center justify-center text-[#6B5F82]">
                <ShoppingBag size={28} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-serif text-2xl text-[#1E1630]">Your bag is quiet</p>
                <p className="text-xs font-sans text-[#6B5F82] max-w-xs mt-1">
                  Discover pure botanical cleansers, nourishing night creams, and targeted serums for your skin.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigateToShop();
                  }}
                  className="w-full py-3 glass-btn-primary text-xs uppercase tracking-widest font-sans font-semibold rounded-xl cursor-pointer"
                >
                  Explore Catalog
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    window.location.href = '/track-order';
                  }}
                  className="w-full py-2.5 bg-white hover:bg-[#F8F5FF] text-[#1E1630] border border-[#DDD6F3] text-xs font-sans font-medium rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Truck size={14} className="text-[#7C3AED]" />
                  <span>Track An Existing Order</span>
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    window.location.href = '/quiz';
                  }}
                  className="w-full py-2 bg-transparent text-[#7C3AED] hover:underline text-xs font-sans font-medium flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Not sure what to choose? Take Skin Quiz</span>
                </button>
              </div>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex space-x-3.5 pb-4 border-b border-[#DDD6F3]/80 group"
              >
                <img
                  src={product.primaryImage}
                  alt={product.name}
                  onClick={() => {
                    setIsCartOpen(false);
                    onSelectProduct(product.slug);
                  }}
                  className="w-18 h-20 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                  style={{ border: '1px solid rgba(167, 139, 250, 0.2)' }}
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4
                        onClick={() => {
                          setIsCartOpen(false);
                          onSelectProduct(product.slug);
                        }}
                        className="font-serif text-base font-medium text-[#1E1630] cursor-pointer hover:text-[#7C3AED] transition-colors line-clamp-2 leading-snug"
                      >
                        {product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="text-[#6B5F82] hover:text-red-500 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <span className="text-[11px] font-sans text-[#6B5F82] block mt-0.5">
                      {product.size} • SKU: {product.sku}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center rounded-xl glass-card overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-1.5 text-[#6B5F82] hover:text-[#7C3AED] cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2.5 text-xs font-sans font-semibold text-[#1E1630]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={Boolean(product.trackInventory && !product.allowBackorders && quantity >= product.stockQuantity)}
                        className="p-1.5 text-[#6B5F82] hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title={product.trackInventory && !product.allowBackorders && quantity >= product.stockQuantity ? 'Maximum available stock reached' : 'Increase quantity'}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-sans font-semibold text-sm text-[#1E1630]">
                        {formatINR(product.price * quantity)}
                      </span>
                      {quantity > 1 && (
                        <span className="block text-[10px] text-[#6B5F82]">
                          {formatINR(product.price)} each
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer with Checkout Button */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#DDD6F3] space-y-3">
            <div className="flex items-center justify-between text-sm font-sans">
              <span className="text-[#6B5F82]">Estimated Subtotal</span>
              <span className="font-semibold text-base text-[#1E1630] font-serif">
                {formatINR(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-[#6B5F82] font-sans">
              Taxes calculated at checkout. Express courier &amp; WhatsApp confirmation ready.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigateToShop();
                }}
                className="py-3 px-4 glass-btn-secondary text-[#1E1630] text-xs uppercase tracking-widest font-sans font-semibold rounded-xl text-center cursor-pointer"
              >
                Continue Shopping
              </button>
              <button
                id="cart-drawer-checkout-btn"
                onClick={() => {
                  setIsCartOpen(false);
                  onCheckout();
                }}
                className="py-3 px-4 glass-btn-primary text-xs uppercase tracking-widest font-sans font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Checkout</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
