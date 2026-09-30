import React, { useState } from 'react';
import { Instagram, Phone, MessageSquare, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer id="brand-footer" className="glass-footer text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-[#A78BFA]/15">
          {/* Brand Intro Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex flex-col">
              <span className="font-serif text-3xl tracking-widest font-medium text-white">
                GLOW<span className="font-light italic text-[#A78BFA]">with</span>SH
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#C084FC] mt-1 font-sans">
                FOUNDED BY SHAGUFI HUSSAIN
              </span>
            </div>
            <p className="text-sm font-sans text-white/65 leading-relaxed max-w-sm pt-2">
              Thoughtfully curated skincare rituals and beauty essentials created to become part of the way you care for and express yourself.
            </p>
            <div className="pt-2 flex items-center space-x-4">
              <a
                href="https://www.instagram.com/glowwithsh_skinwhitening_/?hl=en"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
                style={{ background: 'rgba(167, 139, 250, 0.2)', border: '1px solid rgba(167, 139, 250, 0.25)' }}
                aria-label="Follow @glowwithsh_skinwhitening_ on Instagram"
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://wa.me/917303490594"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
                style={{ background: 'rgba(167, 139, 250, 0.2)', border: '1px solid rgba(167, 139, 250, 0.25)' }}
                aria-label="Chat with GlowWithSH on WhatsApp"
              >
                <MessageSquare size={17} />
              </a>
              <a
                href="tel:+917303490594"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
                style={{ background: 'rgba(167, 139, 250, 0.2)', border: '1px solid rgba(167, 139, 250, 0.25)' }}
                aria-label="Call GlowWithSH Customer Care"
              >
                <Phone size={17} />
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.15em] font-sans font-semibold text-[#A78BFA]">Explore</h4>
            <ul className="space-y-2 text-sm font-sans text-white/70">
              <li>
                <button onClick={() => onNavigate('/shop')} className="hover:text-white transition-colors cursor-pointer">
                  Shop All Products
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/quiz')} className="hover:text-white transition-colors cursor-pointer text-[#A78BFA] font-medium flex items-center gap-1">
                  <span>✨ Skin Ritual Quiz</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/wishlist')} className="hover:text-white transition-colors cursor-pointer">
                  Saved Wishlist
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/shop?category=creams')} className="hover:text-white transition-colors cursor-pointer">
                  Creams &amp; Butters
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/shop?category=serums')} className="hover:text-white transition-colors cursor-pointer">
                  Serums &amp; Elixirs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors cursor-pointer">
                  Our Story
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/founder')} className="hover:text-white transition-colors cursor-pointer">
                  Meet Shagufi
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/journal')} className="hover:text-white transition-colors cursor-pointer">
                  Glow Journal
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.15em] font-sans font-semibold text-[#A78BFA]">Customer Care</h4>
            <ul className="space-y-2 text-sm font-sans text-white/70">
              <li>
                <button onClick={() => onNavigate('/track-order')} className="hover:text-white transition-colors cursor-pointer text-[#A78BFA] font-medium flex items-center gap-1">
                  <span>🚚 Track Your Order</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer">
                  Contact &amp; Studio
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/policies/shipping')} className="hover:text-white transition-colors cursor-pointer">
                  Shipping &amp; Delivery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/policies/refunds')} className="hover:text-white transition-colors cursor-pointer">
                  Refund &amp; Cancellation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/policies/privacy')} className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/policies/terms')} className="hover:text-white transition-colors cursor-pointer">
                  Terms &amp; Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/policies/disclaimer')} className="hover:text-white transition-colors cursor-pointer">
                  Skincare Disclaimer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/policies/contact')} className="hover:text-white transition-colors cursor-pointer">
                  Seller &amp; Grievance Redressal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/faq')} className="hover:text-white transition-colors cursor-pointer">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.15em] font-sans font-semibold text-[#A78BFA]">The Ritual Letter</h4>
            <p className="text-xs font-sans text-white/65 leading-relaxed">
              Receive quiet beauty reflections, early seasonal batches, and personal notes from Shagufi Hussain.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-[#A78BFA]" style={{ background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                <CheckCircle2 size={16} />
                <span>Thank you. Your email is registered with our studio.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full text-sm text-white px-3.5 py-2.5 rounded-xl focus:outline-none placeholder-white/35"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(167, 139, 250, 0.25)',
                    }}
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 glass-btn-primary rounded-lg text-xs font-sans font-semibold tracking-wider uppercase flex items-center justify-center cursor-pointer"
                    aria-label="Subscribe"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}
            <div className="pt-2 text-[11px] text-white/45 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#A78BFA]" />
              <span>Authentic formulations. Direct from Delhi atelier.</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/45 font-sans gap-4">
          <p>© {new Date().getFullYear()} GlowWithSH. All rights reserved. Founded &amp; Owned by Shagufi Hussain.</p>
          <span>Subhash Vihar, Delhi 110053</span>
        </div>
      </div>
    </footer>
  );
};
