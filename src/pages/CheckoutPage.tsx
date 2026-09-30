import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';
import { api } from '../services/api';
import { Order } from '../types';
import { ShieldCheck, Truck, ArrowRight, ArrowLeft, MessageSquare, CreditCard, Smartphone } from 'lucide-react';
import { OnlinePaymentModal } from '../components/checkout/OnlinePaymentModal';

interface CheckoutPageProps {
  onBackToCart: () => void;
  onOrderSuccess: (order: Order, whatsappUrl?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToCart,
  onOrderSuccess,
}) => {
  const {
    items,
    subtotal,
    clearCart,
    appliedPromo,
    discountAmount,
    applyDiscount,
    clearDiscount,
  } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Delhi');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online_ready' | 'cod' | 'whatsapp'>('online_ready');
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [pendingWhatsappUrl, setPendingWhatsappUrl] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const FREE_SHIPPING_THRESHOLD = 999;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 99;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = async () => {
    const cleanCode = promoCode.trim().toUpperCase();
    if (!cleanCode) return;
    setIsValidatingPromo(true);
    setPromoError('');
    try {
      const res = await api.validateDiscount(cleanCode, subtotal);
      if (res.minSpend && subtotal < res.minSpend) {
        setPromoError(`Minimum ritual order value of ₹${res.minSpend} required for code ${res.code}.`);
        return;
      }
      let amount = 0;
      if (res.discountType === 'percentage') {
        amount = Math.round((subtotal * res.discountValue) / 100);
      } else {
        amount = Math.min(subtotal, res.discountValue);
      }
      applyDiscount(res.code, amount, res.minSpend || 0);
      setPromoCode('');
      setPromoError('');
    } catch (err: any) {
      if (cleanCode === 'GLOW10') {
        if (subtotal < 999) {
          setPromoError('Minimum ritual order value of ₹999 required for code GLOW10.');
        } else {
          applyDiscount('GLOW10', Math.round(subtotal * 0.1), 999);
          setPromoCode('');
        }
      } else if (cleanCode === 'SHAGUFI') {
        if (subtotal < 999) {
          setPromoError('Minimum ritual order value of ₹999 required for code SHAGUFI.');
        } else {
          applyDiscount('SHAGUFI', Math.round(subtotal * 0.15), 999);
          setPromoCode('');
        }
      } else {
        setPromoError(err.message || 'Invalid or inactive promotional code');
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = fullName.trim();
    const cleanAddress = addressLine1.trim();
    const cleanCity = city.trim();
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const cleanPin = postalCode.replace(/\D/g, '');

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please provide your full recipient name (at least 2 letters).');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address for tracking & invoices.');
      return;
    }

    if (!cleanAddress || cleanAddress.length < 5) {
      setErrorMsg('Please enter a complete street address (flat/house no., building, area).');
      return;
    }

    if (!cleanCity || cleanCity.length < 2) {
      setErrorMsg('Please enter your delivery city.');
      return;
    }

    if (!/^[1-9]\d{5}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit postal PIN code (e.g. 110053).');
      return;
    }

    setLoading(true);

    try {
      const result = await api.submitOrder({
        customer: {
          name: cleanName,
          phone: cleanDigits,
          email: email.trim() || undefined,
          address: `${cleanAddress}${addressLine2.trim() ? ', ' + addressLine2.trim() : ''}`,
          city: cleanCity,
          state: state.trim() || 'Delhi',
          pincode: cleanPin,
          deliveryNotes: deliveryNotes.trim() || undefined,
        },
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
        paymentMethod,
        discountCode: appliedPromo || undefined,
      });

      if (paymentMethod === 'online_ready') {
        setPendingOrder(result.order);
        setPendingWhatsappUrl(result.whatsappUrl);
        setShowPaymentModal(true);
        setLoading(false);
        return;
      }

      // Save order in localStorage so page reloads on /order-confirmation persist
      try {
        localStorage.setItem(
          'glowwithsh_last_order',
          JSON.stringify({ order: result.order, whatsappUrl: result.whatsappUrl })
        );
      } catch (_) {}

      clearCart();
      onOrderSuccess(result.order, result.whatsappUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to place order. Please check delivery details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (details: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    if (!pendingOrder) return;
    try {
      const verifyRes = await api.verifyPayment({
        orderId: pendingOrder.id,
        razorpay_order_id: details.razorpay_order_id,
        razorpay_payment_id: details.razorpay_payment_id,
        razorpay_signature: details.razorpay_signature,
        phone: pendingOrder.phone,
        email: pendingOrder.email,
      });

      try {
        localStorage.setItem(
          'glowwithsh_last_order',
          JSON.stringify({ order: verifyRes.order, whatsappUrl: pendingWhatsappUrl })
        );
      } catch (_) {}

      clearCart();
      setShowPaymentModal(false);
      onOrderSuccess(verifyRes.order, pendingWhatsappUrl);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Payment verification failed');
    }
  };

  const handleSwitchToCod = async () => {
    if (!pendingOrder) return;
    try {
      const switchedRes = await api.switchToCod(pendingOrder.id, {
        phone: pendingOrder.phone,
        email: pendingOrder.email,
      });

      try {
        localStorage.setItem(
          'glowwithsh_last_order',
          JSON.stringify({ order: switchedRes.order, whatsappUrl: pendingWhatsappUrl })
        );
      } catch (_) {}

      clearCart();
      setShowPaymentModal(false);
      onOrderSuccess(switchedRes.order, pendingWhatsappUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to switch to Cash on Delivery');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="font-serif text-2xl text-[#1E1630]">No items in checkout</h2>
        <button
          onClick={onBackToCart}
          className="px-6 py-2.5 glass-btn-primary text-white rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer shadow-sm"
        >
          Return to Cart
        </button>
      </div>
    );
  }

  return (
    <div id="checkout-process-page" className="min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#DDD6F3] pb-5 mb-8">
          <button
            onClick={onBackToCart}
            className="text-xs uppercase font-sans tracking-wider text-[#6B5F82] hover:text-[#7C3AED] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Bag</span>
          </button>
          <span className="font-serif text-2xl font-medium tracking-wide text-[#1E1630]">
            GlowWithSH Atelier Checkout
          </span>
          <div className="w-16" />
        </div>

        {errorMsg && (
          <div className="p-4 mb-6 bg-red-50 text-red-800 rounded-xl text-xs font-sans border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Customer & Address Form */}
          <div className="lg:col-span-7 space-y-8">
            {/* Contact Details */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-serif text-xl text-[#1E1630]">1. Contact Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full px-3.5 py-2.5 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                  Email Address (For order invoices &amp; tracking)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  className="w-full px-3.5 py-2.5 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-serif text-xl text-[#1E1630]">2. Delivery Address (India)</h3>

              <div>
                <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                  House / Flat / Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Flat / House No., Street, Area"
                  className="w-full px-3.5 py-2.5 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                  Apartment, Suite, Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Near landmark, building name"
                  className="w-full px-3.5 py-2.5 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Delhi, Mumbai"
                    className="w-full px-3.5 py-2.5 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full px-3.5 py-2.5 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 110053"
                    className="w-full px-3.5 py-2.5 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Special instructions for the courier delivery partner..."
                  className="w-full px-3.5 py-2 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-[#1E1630]">3. Payment Preference</h3>
                <span className="text-[11px] font-sans text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>100% Encrypted</span>
                </span>
              </div>

              <div className="space-y-3">
                {/* 1. Online Payment (UPI, Cards, NetBanking) */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all relative ${
                    paymentMethod === 'online_ready'
                      ? 'border-[#7C3AED] bg-[#A78BFA]/10 ring-1 ring-[#7C3AED]'
                      : 'border-[#DDD6F3] glass-surface hover:border-[#A78BFA]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'online_ready'}
                    onChange={() => setPaymentMethod('online_ready')}
                    className="mt-1 accent-[#7C3AED]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs uppercase tracking-wider text-[#1E1630] flex items-center gap-1.5">
                        <CreditCard size={14} className="text-[#A78BFA]" />
                        <span>Instant Online Payment (UPI, Cards, NetBanking)</span>
                      </span>
                      <span className="text-[10px] font-sans bg-[#A78BFA]/20 text-[#7C3AED] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                        Fastest Dispatch
                      </span>
                    </div>
                    <p className="text-xs text-[#6B5F82] mt-1">
                      Pay instantly with Google Pay, PhonePe, Paytm, BHIM UPI QR, or Debit/Credit Cards. Zero transaction fees.
                    </p>
                  </div>
                </label>

                {/* 2. Cash on Delivery (COD) */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#7C3AED] bg-[#A78BFA]/10 ring-1 ring-[#7C3AED]'
                      : 'border-[#DDD6F3] glass-surface hover:border-[#A78BFA]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-[#7C3AED]"
                  />
                  <div>
                    <span className="font-semibold text-xs uppercase tracking-wider text-[#1E1630] block">
                      Cash on Delivery (COD)
                    </span>
                    <p className="text-xs text-[#6B5F82] mt-0.5">
                      Pay conveniently in cash or UPI to the courier partner upon package arrival at your doorstep.
                    </p>
                  </div>
                </label>

                {/* 3. WhatsApp Direct Confirmation */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'whatsapp'
                      ? 'border-[#7C3AED] bg-[#A78BFA]/10 ring-1 ring-[#7C3AED]'
                      : 'border-[#DDD6F3] glass-surface hover:border-[#A78BFA]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                    className="mt-1 accent-[#7C3AED]"
                  />
                  <div>
                    <span className="font-semibold text-xs uppercase tracking-wider text-[#1E1630] flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-emerald-700" />
                      Instant WhatsApp Confirmation
                    </span>
                    <p className="text-xs text-[#6B5F82] mt-0.5">
                      Our studio concierge will verify your order on WhatsApp (+91 7303490594) and share direct custom payment details.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-sm space-y-5 sticky top-24">
              <h3 className="font-serif text-xl text-[#1E1630]">Order Items ({items.length})</h3>

              {/* Items preview list */}
              <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-[#DDD6F3]">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs font-sans">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={product.primaryImage}
                        alt={product.name}
                        className="w-12 h-14 object-cover rounded-lg border border-[#DDD6F3] shrink-0"
                      />
                      <div>
                        <p className="font-serif text-sm text-[#1E1630] font-medium leading-snug">
                          {product.name}
                        </p>
                        <span className="text-[#6B5F82]">
                          Qty: {quantity} × {formatINR(product.price)}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-[#1E1630]">
                      {formatINR(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="pt-3 border-t border-[#DDD6F3]">
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
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code (e.g. GLOW10)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl uppercase tracking-wider focus:outline-none focus:border-[#7C3AED] text-[#1E1630]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isValidatingPromo || !promoCode.trim()}
                        className="px-4 py-2 glass-btn-secondary text-[#1E1630] rounded-xl text-xs font-sans font-semibold tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isValidatingPromo ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11px] text-red-600 font-sans">{promoError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="pt-4 border-t border-[#DDD6F3] space-y-2 text-xs font-sans text-[#6B5F82]">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="text-[#1E1630] font-medium">{formatINR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Privilege Courtesy ({appliedPromo})</span>
                    <span>-{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping &amp; Handling</span>
                  <span>{shippingFee === 0 ? 'Complimentary' : formatINR(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Taxes (GST Included)</span>
                  <span>₹0 Extra</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-[#DDD6F3] flex justify-between items-baseline">
                <span className="font-serif text-xl text-[#1E1630]">Total Payable</span>
                <span className="font-sans text-2xl font-semibold text-[#1E1630]">
                  {formatINR(grandTotal)}
                </span>
              </div>

              {/* Place Order CTA */}
              <button
                id="place-order-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-4 glass-btn-primary text-white rounded-xl text-xs uppercase font-sans font-semibold tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'Processing with Atelier...'
                    : paymentMethod === 'online_ready'
                    ? `Proceed to Secure Payment (${formatINR(grandTotal)})`
                    : paymentMethod === 'whatsapp'
                    ? `Verify via WhatsApp (${formatINR(grandTotal)})`
                    : `Confirm Cash on Delivery (${formatINR(grandTotal)})`}
                </span>
                <ArrowRight size={14} />
              </button>

              <div className="pt-2 text-[11px] text-[#6B5F82] font-sans space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Truck size={13} className="text-[#A78BFA]" />
                  <span>Dispatched from Delhi Atelier within 24-48 hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#A78BFA]" />
                  <span>Direct phone &amp; WhatsApp support: +91 7303490594</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {pendingOrder && (
          <OnlinePaymentModal
            isOpen={showPaymentModal}
            order={pendingOrder}
            onClose={() => setShowPaymentModal(false)}
            onPaymentSuccess={handlePaymentSuccess}
            onSwitchToCod={handleSwitchToCod}
          />
        )}
      </div>
    </div>
  );
};
