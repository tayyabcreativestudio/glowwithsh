import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Menu, X, Sparkles, UserCheck, Truck, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate, onOpenSearch }) => {
  const { totalCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Shop', path: '/shop' },
    { label: 'Ritual Quiz', path: '/quiz', badge: '✨' },
    { label: 'Track Order', path: '/track-order' },
    { label: 'Our Story', path: '/about' },
    { label: 'Founder', path: '/founder' },
    { label: 'Journal', path: '/journal' },
    { label: 'Awards', path: '/awards' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <>
      <header
        id="main-header"
        className={`sticky top-0 z-40 w-full transition-all duration-500 ${
          isScrolled
            ? 'glass-header-scrolled py-3.5'
            : 'glass-header py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Brand Wordmark */}
          <div className="flex items-center">
            <button
              id="brand-logo-btn"
              onClick={() => handleLinkClick('/')}
              className="text-left group cursor-pointer focus:outline-none"
              aria-label="GlowWithSH Home"
            >
              <div className="flex flex-col">
                <span className="font-serif text-2xl sm:text-3xl tracking-[0.12em] font-medium text-[#1E1630] group-hover:text-[#7C3AED] transition-colors leading-none">
                  GLOW<span className="font-light italic gradient-text">with</span>SH
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#6B5F82] mt-1 font-sans">
                  BY SHAGUFI HUSSAIN
                </span>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 lg:space-x-9" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleLinkClick(item.path)}
                  className={`text-[13px] tracking-[0.08em] uppercase font-sans font-medium transition-colors cursor-pointer relative py-1 ${
                    isActive
                      ? 'text-[#7C3AED] font-semibold'
                      : 'text-[#6B5F82] hover:text-[#7C3AED]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions (Search, Admin Portal, Cart, Mobile Menu) */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Icon */}
            <button
              id="nav-search-button"
              onClick={onOpenSearch}
              className="p-2 text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer"
              aria-label="Open search dialog"
            >
              <Search size={19} strokeWidth={1.75} />
            </button>

            {/* Wishlist Icon */}
            <button
              id="nav-wishlist-button"
              onClick={() => handleLinkClick('/wishlist')}
              className="relative p-2 text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer hidden sm:flex items-center"
              aria-label={`Wishlist containing ${wishlistCount} items`}
              title="Saved Rituals & Formulations"
            >
              <Heart size={19} strokeWidth={1.75} className={wishlistCount > 0 ? 'fill-[#A78BFA] text-[#7C3AED]' : ''} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#7C3AED] text-white text-[10px] font-sans font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Admin shortcut button */}
            <button
              id="nav-admin-portal-button"
              onClick={() => handleLinkClick('/admin')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-sans font-medium text-[#6B5F82] hover:text-[#7C3AED] glass-btn-secondary rounded-lg transition-all"
              title="Admin CMS & Orders Management"
            >
              <UserCheck size={13} className="text-[#A78BFA]" />
              <span>Admin</span>
            </button>

            {/* Cart Icon & Live Count */}
            <button
              id="nav-cart-button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer flex items-center"
              aria-label={`Cart containing ${totalCount} items`}
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              {totalCount > 0 && (
                <span
                  id="nav-cart-badge"
                  className="absolute -top-1 -right-1 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white text-[10px] font-sans font-semibold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#F8F5FF]"
                >
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="fixed inset-0 z-50 flex flex-col justify-between p-6 md:hidden animate-in fade-in duration-200"
          style={{
            background: 'rgba(248, 245, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-[#DDD6F3]">
              <div className="flex flex-col">
                <span className="font-serif text-2xl tracking-wider font-medium text-[#1E1630]">
                  GLOW<span className="font-light italic gradient-text">with</span>SH
                </span>
                <span className="text-[8px] uppercase tracking-[0.25em] text-[#6B5F82]">
                  BY SHAGUFI HUSSAIN
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-[#1E1630] hover:text-[#7C3AED]"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col space-y-4 py-8" aria-label="Mobile Navigation Links">
              {navLinks.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleLinkClick(item.path)}
                  className="text-left font-serif text-2xl text-[#1E1630] hover:text-[#7C3AED] transition-colors py-1 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-[#DDD6F3]/60 space-y-1">
                <button
                  onClick={() => handleLinkClick('/wishlist')}
                  className="flex items-center gap-2 text-sm uppercase tracking-wider font-sans text-[#6B5F82] hover:text-[#7C3AED] py-2 cursor-pointer"
                >
                  <Heart size={16} className="text-[#A78BFA]" />
                  <span>Saved Rituals ({wishlistCount})</span>
                </button>
                <button
                  onClick={() => handleLinkClick('/admin')}
                  className="flex items-center gap-2 text-sm uppercase tracking-wider font-sans text-[#6B5F82] hover:text-[#7C3AED] py-2 cursor-pointer"
                >
                  <UserCheck size={16} className="text-[#A78BFA]" />
                  <span>Admin Dashboard</span>
                </button>
              </div>
            </nav>
          </div>

          <div className="pt-6 border-t border-[#DDD6F3] text-xs text-[#6B5F82] space-y-2">
            <p className="font-serif italic text-[#1E1630] text-sm">"Your Glow, Your Ritual."</p>
            <p>E Block, Subhash Vihar, Delhi 110053</p>
            <p>WhatsApp Care: +91 7303490594</p>
          </div>
        </div>
      )}
    </>
  );
};
