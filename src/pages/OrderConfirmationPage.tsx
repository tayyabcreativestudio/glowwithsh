import React from 'react';
import { Order } from '../types';
import { formatINR, formatDate } from '../utils/format';
import { CheckCircle2, MessageSquare, ArrowRight, Copy, AlertCircle, ShoppingBag, Truck, FileText } from 'lucide-react';
import { api } from '../services/api';
import { InvoiceModal } from '../components/common/InvoiceModal';

interface OrderConfirmationPageProps {
  order?: Order | null;
  orderId?: string | null;
  onContinueShopping: () => void;
  onNavigateToTrack?: (orderId: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order: initialOrder,
  orderId: propOrderId,
  onContinueShopping,
  onNavigateToTrack,
}) => {
  const [order, setOrder] = React.useState<Order | null>(initialOrder || null);
  const [whatsappUrl, setWhatsappUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(!initialOrder);
  const [copied, setCopied] = React.useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);

  React.useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setLoading(false);
      try {
        const cachedRaw = localStorage.getItem('glowwithsh_last_order');
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed.order?.id === initialOrder.id && parsed.whatsappUrl) {
            setWhatsappUrl(parsed.whatsappUrl);
          }
        }
      } catch (e) {
        // ignore
      }
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetOrderId = propOrderId || urlParams.get('orderId');

    // Attempt recovery from localStorage first
    try {
      const cachedRaw = localStorage.getItem('glowwithsh_last_order');
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (parsed.order && (!targetOrderId || parsed.order.id === targetOrderId)) {
          setOrder(parsed.order);
          setWhatsappUrl(parsed.whatsappUrl || null);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    if (targetOrderId) {
      setLoading(true);
      api
        .lookupOrder(targetOrderId)
        .then((res) => {
          if (res.order) {
            setOrder(res.order);
            setWhatsappUrl(res.whatsappUrl);
          }
        })
        .catch((err) => {
          console.warn('Failed to lookup order:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [initialOrder, propOrderId]);

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#A78BFA] border-t-transparent animate-spin" />
        <span className="text-xs uppercase tracking-widest text-[#6B5F82] font-sans">
          Loading order details...
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#A78BFA]/15 text-[#7C3AED] flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-serif text-2xl text-[#1E1630] mb-2">No Active Order Found</h2>
        <p className="text-sm font-sans text-[#6B5F82] max-w-md mb-6 leading-relaxed">
          We could not locate this order session. If you just placed an order, return to order tracking and use the order ID shown after checkout with your 10-digit mobile number.
        </p>
        <button
          onClick={onContinueShopping}
          className="px-6 py-3.5 glass-btn-primary text-white rounded-xl text-xs uppercase tracking-widest font-sans font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <ShoppingBag size={14} />
          <span>Return to Boutique</span>
        </button>
      </div>
    );
  }

  const defaultWhatsappMessage = encodeURIComponent(
    `Hello GlowWithSH! I just placed order ${order.id} for ${formatINR(order.grandTotal)}. Name: ${order.customerName}. Please confirm dispatch status!`
  );
  const activeWhatsAppLink =
    whatsappUrl || `https://wa.me/917303490594?text=${defaultWhatsappMessage}`;

  return (
    <div id="order-confirmation-screen" className="min-h-screen py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Success Banner */}
        <div className="glass-card p-8 sm:p-12 rounded-3xl shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <span className="text-xs uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold block">
            ORDER CONFIRMED
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1630]">
            Thank you for your ritual, {order.customerName.split(' ')[0]}
          </h1>

          <p className="text-sm font-sans text-[#6B5F82] max-w-md mx-auto leading-relaxed">
            Your order has been registered with our Delhi atelier. A confirmation note and courier tracking will be sent to your contact details.
          </p>

          {/* Order Reference & Payment Status Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <div className="inline-flex items-center gap-3 glass-surface border border-[#DDD6F3] px-4 py-2 rounded-xl font-mono text-xs text-[#1E1630]">
              <span>Order Reference: <strong>{order.id}</strong></span>
              <button
                onClick={copyOrderNumber}
                className="text-[#6B5F82] hover:text-[#7C3AED] p-1 cursor-pointer transition-colors"
                title="Copy Order ID"
              >
                <Copy size={13} />
              </button>
              {copied && <span className="text-[10px] text-emerald-700 font-sans font-semibold">Copied!</span>}
            </div>

            {order.paymentStatus === 'paid' ? (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-sans text-emerald-800 font-semibold">
                <CheckCircle2 size={13} className="text-emerald-700" />
                <span>PAID ONLINE {order.paymentId ? `• Ref: ${order.paymentId}` : ''}</span>
              </div>
            ) : order.paymentMethod === 'cod' ? (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs font-sans text-amber-800 font-medium">
                <span>PAYMENT: CASH ON DELIVERY (PENDING)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-xl text-xs font-sans text-sky-800 font-medium">
                <span>PAYMENT: WHATSAPP CONCIERGE</span>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                if (onNavigateToTrack) {
                  onNavigateToTrack(order.id);
                } else {
                  window.location.href = `/track-order?orderId=${encodeURIComponent(order.id)}`;
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white rounded-xl text-xs uppercase font-sans font-semibold tracking-wider shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              <Truck size={15} />
              <span>Track Live Shipment</span>
            </button>

            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-[#F8F5FF] text-[#1E1630] border border-[#DDD6F3] rounded-xl text-xs uppercase font-sans font-semibold tracking-wider shadow-xs transition-all cursor-pointer"
            >
              <FileText size={15} className="text-[#7C3AED]" />
              <span>Tax Invoice</span>
            </button>

            <a
              href={activeWhatsAppLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#FAF8FF] hover:bg-white text-[#1E1630] border border-[#DDD6F3] rounded-xl text-xs uppercase font-sans font-semibold tracking-wider shadow-xs transition-all"
            >
              <MessageSquare size={15} className="text-emerald-600" />
              <span>WhatsApp Dispatch Note</span>
            </a>
          </div>
        </div>

        {/* Order Details Breakdown */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#DDD6F3] pb-4">
            <h3 className="font-serif text-xl text-[#1E1630]">Summary &amp; Delivery</h3>
            <span className="text-xs font-sans text-[#6B5F82]">
              Placed on {formatDate(order.createdAt)}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-3 divide-y divide-[#DDD6F3]">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4 text-xs font-sans">
                <div className="flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-14 object-cover rounded-lg border border-[#DDD6F3]"
                    />
                  )}
                  <div>
                    <h4 className="font-serif text-sm text-[#1E1630] font-medium leading-snug">
                      {item.name}
                    </h4>
                    <span className="text-[#6B5F82]">
                      Qty: {item.quantity} • SKU: {item.sku}
                    </span>
                  </div>
                </div>
                <span className="font-semibold text-sm text-[#1E1630]">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="pt-4 border-t border-[#DDD6F3] space-y-1.5 text-xs font-sans text-[#6B5F82]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-[#1E1630] font-medium">{formatINR(order.subtotal)}</span>
            </div>
            {((order.discountAmount ?? order.discount) > 0) && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span>-{formatINR(order.discountAmount ?? order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping (Express Courier)</span>
              <span>{order.deliveryFee === 0 ? 'Complimentary' : formatINR(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-serif text-lg text-[#1E1630] pt-2 border-t border-[#DDD6F3]">
              <span>Total Amount</span>
              <span className="font-sans font-semibold text-xl">{formatINR(order.grandTotal)}</span>
            </div>
          </div>

          {/* Shipping Address & Status */}
          <div className="pt-4 border-t border-[#DDD6F3] grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
            <div>
              <span className="font-semibold text-[#1E1630] uppercase tracking-wider block mb-1">
                Destination Address
              </span>
              <p className="text-[#6B5F82] leading-relaxed">
                {order.customerName}
                <br />
                {order.address}
                <br />
                {order.city}, {order.state} - {order.pincode}
                <br />
                Contact: {order.phone}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#1E1630] uppercase tracking-wider block mb-1">
                Fulfillment &amp; Payment
              </span>
              <p className="text-[#6B5F82] leading-relaxed">
                Status: <strong className="capitalize text-[#1E1630]">{order.orderStatus}</strong>
                <br />
                Payment Method:{' '}
                <strong className="uppercase text-[#1E1630]">
                  {order.paymentMethod === 'online_ready'
                    ? 'Online Payment (UPI/Cards)'
                    : order.paymentMethod === 'whatsapp'
                    ? 'WhatsApp Concierge'
                    : 'Cash on Delivery'}
                </strong>
                <br />
                Payment Status:{' '}
                <strong className="capitalize text-[#1E1630]">
                  {order.paymentStatus === 'paid' ? 'Paid / Verified' : order.paymentStatus}
                </strong>
                {order.paymentId && (
                  <>
                    <br />
                    Transaction ID:{' '}
                    <strong className="font-mono text-[11px] text-[#1E1630]">{order.paymentId}</strong>
                  </>
                )}
                <br />
                Estimated Arrival: <strong>2–5 Business Days</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Continue Shopping CTA */}
        <div className="text-center pt-2">
          <button
            onClick={onContinueShopping}
            className="px-8 py-3.5 glass-btn-secondary text-[#1E1630] rounded-xl text-xs uppercase tracking-widest font-sans font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Continue Exploring Catalog</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {order && (
        <InvoiceModal
          order={order}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </div>
  );
};
