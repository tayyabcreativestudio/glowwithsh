import React from 'react';
import { useCart } from '../../context/CartContext';
import { Check, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, dismissToast } = useCart();

  if (!toastMessage) return null;

  return (
    <div
      id="glow-toast-notification"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
      style={{
        background: 'linear-gradient(135deg, #1E1630 0%, #2D1F4E 100%)',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        color: 'white',
      }}
      role="status"
    >
      <div className="w-5 h-5 rounded-full bg-[#A78BFA]/25 flex items-center justify-center text-[#A78BFA]">
        <Check size={13} strokeWidth={2.5} />
      </div>
      <p className="text-sm font-sans font-medium tracking-wide">{toastMessage}</p>
      <button
        onClick={dismissToast}
        className="ml-2 text-white/50 hover:text-white transition-colors p-1"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};
