import React, { useEffect, useState } from 'react';
import { formatINR } from '../../utils/format';
import { Order } from '../../types';
import { api } from '../../services/api';
import { Lock, X, AlertCircle, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

interface OnlinePaymentModalProps {
  isOpen: boolean;
  order: Order;
  onClose: () => void;
  onPaymentSuccess: (details: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
  onSwitchToCod: () => Promise<void>;
}

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  isOpen,
  order,
  onClose,
  onPaymentSuccess,
  onSwitchToCod,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gatewayIntent, setGatewayIntent] = useState<{
    orderId: string;
    internalOrderId: string;
    amount: number;
    currency: 'INR';
    keyId: string;
    sandbox: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg('');

    // Load Razorpay standard script if not already present
    if (!document.getElementById('razorpay-sdk-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Initialize server-side Razorpay order intent
    api
      .createPaymentIntent({
        orderId: order.id,
        phone: order.phone,
        email: order.email,
      })
      .then((intent) => {
        if (isMounted) {
          setGatewayIntent(intent);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to initialize payment gateway.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, order.id, order.phone, order.email]);

  if (!isOpen) return null;

  const handleOpenRazorpay = () => {
    if (!gatewayIntent) return;
    setLoading(true);
    setErrorMsg('');

    if (typeof (window as any).Razorpay === 'function') {
      const options = {
        key: gatewayIntent.keyId,
        amount: gatewayIntent.amount,
        currency: gatewayIntent.currency,
        name: 'GlowWithSH',
        description: `Order ${order.id}`,
        order_id: gatewayIntent.orderId,
        prefill: {
          name: order.customerName,
          contact: order.phone,
          email: order.email || '',
        },
        theme: { color: '#7C3AED' },
        handler: async (response: any) => {
          try {
            await onPaymentSuccess({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          } catch (err: any) {
            setErrorMsg(err.message || 'Payment verification failed.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMsg(resp.error?.description || 'Transaction declined by bank or gateway.');
          setLoading(false);
        });
        rzp.open();
      } catch (err: any) {
        setErrorMsg('Could not open Razorpay checkout: ' + err.message);
        setLoading(false);
      }
    } else {
      // If Razorpay external script is unreachable (e.g. adblocker, test mode), inform user
      setErrorMsg(
        'Razorpay checkout script could not be loaded. Please ensure you have internet access or choose Cash on Delivery.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1630]/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg glass-card rounded-3xl shadow-2xl border border-[#DDD6F3] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E1630] via-[#2D1F4E] to-[#3B2571] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA]">
              <Lock size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold block">
                SECURE CHECKOUT • 256-BIT SSL
              </span>
              <h3 className="font-serif text-lg text-white">GlowWithSH Payment Gateway</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/60 hover:text-white p-1 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount Ribbon */}
        <div className="bg-[#F8F5FF] px-6 py-4 border-b border-[#DDD6F3] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-sans text-[#6B5F82] block">Payable Amount</span>
            <span className="font-serif text-2xl font-bold text-[#1E1630]">{formatINR(order.grandTotal)}</span>
          </div>
          <div className="text-right text-[11px] font-sans text-[#6B5F82]">
            <span>Order Ref: </span>
            <strong className="font-mono text-[#1E1630]">{order.id}</strong>
          </div>
        </div>

        {/* Information & Actions */}
        <div className="p-6 space-y-4 font-sans text-sm">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">{errorMsg}</p>
                <button
                  type="button"
                  onClick={onSwitchToCod}
                  className="text-red-900 underline font-semibold cursor-pointer block mt-1 hover:text-red-950"
                >
                  Switch to Cash on Delivery (COD) instead →
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[#DDD6F3] bg-white p-4 text-xs text-[#6B5F82] space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck size={16} />
              <span>Direct Bank &amp; UPI Verification</span>
            </div>
            <p>
              Your payment will be securely processed through official UPI, Cards, NetBanking, and Wallets. The payable
              amount is verified and locked on our servers.
            </p>
            <p className="text-[11px] text-[#6B5F82]/80">
              Closing this window or declining will keep your order in pending status without debiting funds.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleOpenRazorpay}
              disabled={loading || !gatewayIntent}
              className="w-full py-3.5 px-4 glass-btn-primary text-white rounded-xl text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Connecting to Bank Gateway…</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Pay Now ({formatINR(order.grandTotal)})</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSwitchToCod}
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#6B5F82] hover:text-[#1E1630] border border-[#DDD6F3] rounded-xl hover:bg-white transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              Switch this order to Cash on Delivery (COD)
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="bg-[#F8F5FF] px-6 py-3 border-t border-[#DDD6F3] flex items-center justify-center gap-2 text-[11px] font-sans text-[#6B5F82]">
          <CheckCircle2 size={13} className="text-[#7C3AED]" />
          <span>Encrypted Gateway Checkout • Genuine Shagufi Hussain Formulations</span>
        </div>
      </div>
    </div>
  );
};
