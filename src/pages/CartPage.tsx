import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';
import { api } from '../services/api';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';

interface CartPageProps {
  onNavigateToShop: () => void;
  onNavigateToCheckout: () => void;
  onSelectProduct: (slug: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigateToShop,
  onNavigateToCheckout,
  onSelectProduct,
}) => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    clearCart,
    appliedPromo,
    discountAmount,
    applyDiscount,
    clearDiscount,
  } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 999;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 99;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setIsValidatingPromo(true);
    try {
      const res = await api.validateDiscount(code, subtotal);
      if (res.minSpend && subtotal < res.minSpend) {
        setPromoError(`Minimum order value of ₹${res.minSpend} required for code ${res.code}.`);
        return;
      }
      let discount = 0;
      if (res.discountType === 'percentage') {
        discount = Math.round((subtotal * res.discountValue) / 100);
      } else {
        discount = Math.min(subtotal, res.discountValue);
      }
      applyDiscount(res.code, discount, res.minSpend || 0);
      setPromoCode('');
      setPromoError('');
    } catch (err: any) {
      if (code === 'GLOW10') {
        if (subtotal < 999) {
          setPromoError('Minimum ritual order value of ₹999 required for code GLOW10.');
        } else {
          applyDiscount('GLOW10', Math.round(subtotal * 0.1), 999);
          setPromoCode('');
        }
      } else if (code === 'SHAGUFI') {
        if (subtotal < 999) {
          setPromoError('Minimum ritual order value of ₹999 required for code SHAGUFI.');
        } else {
          applyDiscount('SHAGUFI', Math.round(subtotal * 0.15), 999);
          setPromoCode('');
        }
      } else {
        setPromoError(err.message || 'Invalid promotional code. Try GLOW10 or RITUAL100');
      }
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    clearDiscount();
    setPromoCode('');
    setPromoError('');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full glass-surface flex items-center justify-center text-[#6B5F82]">
          <ShoppingBag size={30} strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-3xl text-[#1E1630]">Your Ritual Bag is Empty</h1>
        <p className="text-xs sm:text-sm font-sans text-[#6B5F82] max-w-sm">
          Return to our atelier catalog to discover hand-blended cleansers, brightening creams, and botanical oils.
        </p>
        <button
          onClick={onNavigateToShop}
          className="px-8 py-3.5 glass-btn-primary text-white rounded-xl text-xs uppercase font-sans font-semibold tracking-wider cursor-pointer shadow-sm"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  return (
    <div id="full-cart-page" className="min-h-screen py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#DDD6F3] pb-6 gap-4">
          <div>
            <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#A78BFA] font-semibold">
              YOUR SELECTION
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1630] mt-1">
              Ritual Bag
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-sans text-[#6B5F82] hover:text-[#7C3AED] underline cursor-pointer self-start sm:self-auto transition-colors"
          >
            Clear Bag
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Items Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-[#DDD6F3]">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.primaryImage}
                      alt={product.name}
                      onClick={() => onSelectProduct(product.slug)}
                      className="w-20 h-24 object-cover rounded-xl border border-[#DDD6F3] cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                    />
                    <div>
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#A78BFA]">
                        {product.categoryName}
                      </span>
                      <h3
                        onClick={() => onSelectProduct(product.slug)}
                        className="font-serif text-lg text-[#1E1630] cursor-pointer hover:text-[#7C3AED] transition-colors leading-snug"
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs font-sans text-[#6B5F82] mt-0.5">
                        {product.size} • SKU: {product.sku}
                      </p>
                      <span className="font-sans text-xs text-[#1E1630] block mt-1 sm:hidden">
                        {formatINR(product.price)} each
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                    <div className="flex items-center border border-[#DDD6F3] rounded-xl glass-surface overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-1.5 text-[#6B5F82] hover:text-[#7C3AED] transition-colors cursor-pointer"
                        aria-label="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-xs font-sans font-semibold text-[#1E1630]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="p-1.5 text-[#6B5F82] hover:text-[#7C3AED] transition-colors cursor-pointer"
                        aria-label="Increase"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <span className="font-sans font-semibold text-base text-[#1E1630]">
                        {formatINR(product.price * quantity)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-[#6B5F82] hover:text-red-500 transition-colors p-1 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onNavigateToShop}
              className="text-xs uppercase font-sans tracking-wider text-[#6B5F82] hover:text-[#7C3AED] font-semibold py-2 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <span>← Continue Shopping</span>
            </button>
          </div>

          {/* Order Summary Box */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-sm space-y-5">
              <h3 className="font-serif text-2xl text-[#1E1630]">Order Summary</h3>

              {/* Promo Code Input */}
              <div>
                <label className="block text-xs font-sans text-[#6B5F82] mb-1.5 flex items-center gap-1">
                  <Tag size={12} className="text-[#A78BFA]" />
                  <span>Promo Code (e.g. GLOW10)</span>
                </label>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-sans">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <span className="font-semibold">{appliedPromo}</span>
                      <span>(-{formatINR(discountAmount)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-xs text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] uppercase text-[#1E1630]"
                      />
                      <button
                        type="submit"
                        disabled={isValidatingPromo || !promoCode.trim()}
                        className="px-4 py-2 glass-btn-secondary text-[#1E1630] text-xs font-sans uppercase font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        {isValidatingPromo ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoError && <p className="text-[11px] text-red-500 font-sans">{promoError}</p>}
                  </form>
                )}
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-[#DDD6F3] text-xs font-sans text-[#6B5F82]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1E1630]">{formatINR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Privilege Discount</span>
                    <span>-{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Express Courier Across India</span>
                  <span>{shippingFee === 0 ? 'Complimentary' : formatINR(shippingFee)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-[#DDD6F3] flex justify-between items-baseline">
                <span className="font-serif text-lg text-[#1E1630]">Total</span>
                <span className="font-sans text-2xl font-semibold text-[#1E1630]">
                  {formatINR(grandTotal)}
                </span>
              </div>

              <button
                id="cart-proceed-checkout-btn"
                onClick={onNavigateToCheckout}
                className="w-full py-3.5 glass-btn-primary text-white rounded-xl text-xs uppercase font-sans font-semibold tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </button>

              <div className="pt-2 text-[11px] text-[#6B5F82] font-sans flex items-center gap-1.5 justify-center">
                <ShieldCheck size={14} className="text-[#A78BFA]" />
                <span>Cash on Delivery &amp; WhatsApp verification ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
