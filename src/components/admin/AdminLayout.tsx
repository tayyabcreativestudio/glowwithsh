import React, { useState } from 'react';
import { BrandMark } from '../common/BrandMark';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  FileText,
  Sparkles,
  UserCheck,
  Award,
  Instagram,
  Settings,
  Star,
  Mail,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Boxes,
  Percent,
  Search,
  Bell,
  Eye,
  Store,
  SlidersHorizontal,
  FilePlus2,
  Images,
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onViewStorefront: () => void;
  onLogout: () => void;
  pendingReviewsCount?: number;
  newOrdersCount?: number;
  unreadContactsCount?: number;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onViewStorefront,
  onLogout,
  pendingReviewsCount = 0,
  newOrdersCount = 0,
  unreadContactsCount = 0,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [omnibarSearch, setOmnibarSearch] = useState('');

  const totalNotifications = newOrdersCount + pendingReviewsCount + unreadContactsCount;

  const coreMenu = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: newOrdersCount },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'discounts', label: 'Discounts', icon: Percent },
  ];

  const salesChannels = [
    { id: 'cms-homepage', label: 'Themes & Homepage', icon: Sparkles },
    { id: 'pages', label: 'Pages', icon: FilePlus2 },
    { id: 'media', label: 'Media library', icon: Images },
    { id: 'blog', label: 'Blog Posts', icon: FileText },
    { id: 'cms-founder', label: 'Founder Story', icon: UserCheck },
    { id: 'cms-awards', label: 'Verified Awards', icon: Award },
    { id: 'cms-social', label: 'Instagram Feed', icon: Instagram },
  ];

  const communityApps = [
    { id: 'reviews', label: 'Product Reviews', icon: Star, badge: pendingReviewsCount },
    { id: 'contacts', label: 'Inquiries & Inbox', icon: Mail, badge: unreadContactsCount },
  ];

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const handleOmnibarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!omnibarSearch.trim()) return;
    onSelectTab('products');
  };

  return (
    <div id="glowwithsh-shopify-admin" className="min-h-screen bg-[#F6F6F7] flex flex-col font-sans text-[#202223] antialiased">
      {/* Top Shopify Omnibar Header */}
      <header className="h-14 bg-[#1A1A1A] border-b border-[#2C2C2C] text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0">
        {/* Left: Mobile Toggle & Brand / Store Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-[#2C2C2C] rounded-md transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <BrandMark className="w-8 h-8" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-semibold tracking-wide text-zinc-100">
                  GlowWithSH
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-sans tracking-wide">
                Luxury Atelier Admin
              </span>
            </div>
          </div>
        </div>

        {/* Center: Shopify Omnibar Search */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
          <form onSubmit={handleOmnibarSubmit} className="w-full relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products, orders, customers (Ctrl + K)..."
              value={omnibarSearch}
              onChange={(e) => setOmnibarSearch(e.target.value)}
              className="w-full pl-9 pr-14 py-1.5 text-xs bg-[#2B2B2B] text-zinc-100 placeholder-zinc-400 rounded-lg border border-[#3E3E3E] focus:outline-hidden focus:border-[#C4A36A] focus:bg-[#323232] transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-[#383838] text-zinc-400 px-1.5 py-0.5 rounded border border-[#484848]">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Right: Quick actions & profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Online Store Button */}
          <button
            onClick={onViewStorefront}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 hover:text-white bg-[#2B2B2B] hover:bg-[#343434] border border-[#3E3E3E] transition-colors cursor-pointer"
            title="Open online storefront in customer mode"
          >
            <Eye size={14} className="text-[#C4A36A]" />
            <span className="hidden sm:inline">Online Store</span>
            <ExternalLink size={12} className="text-zinc-400" />
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => onSelectTab(newOrdersCount > 0 ? 'orders' : 'reviews')}
              className="p-2 text-zinc-300 hover:text-white hover:bg-[#2B2B2B] rounded-lg transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell size={17} />
              {totalNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-[#1A1A1A] font-bold text-[9px] rounded-full flex items-center justify-center">
                  {totalNotifications}
                </span>
              )}
            </button>
          </div>

          <div className="h-6 w-px bg-[#2C2C2C] mx-1 hidden sm:block" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-[#332A27] border border-[#4E3E39] text-[#C4A36A] font-semibold text-xs flex items-center justify-center font-serif">
              SH
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium text-zinc-200 leading-tight">Shagufi Hussain</span>
              <span className="text-[10px] text-zinc-400 leading-tight">Super Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Shopify Polaris Dark Slate) */}
        <aside className="hidden lg:flex w-60 bg-[#1A1A1A] text-zinc-300 flex-col justify-between shrink-0 border-r border-[#2C2C2C] select-none">
          <div className="overflow-y-auto p-3 space-y-5">
            {/* Core Store Operations */}
            <div className="space-y-0.5">
              {coreMenu.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id || (item.id === 'products' && (currentTab === 'product-new' || currentTab === 'product-edit'));
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#2B2B2B] text-white font-semibold shadow-xs'
                        : 'text-zinc-300 hover:bg-[#252525] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-[#C4A36A]' : 'text-zinc-400'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#C4A36A] text-[#1A1A1A]">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Sales Channels Header */}
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Sales Channels</span>
                <span className="text-[9px] text-[#C4A36A] font-semibold">Web</span>
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Store size={13} className="text-[#C4A36A]" />
                  <span>Online Store</span>
                </div>
                <div className="pl-3 space-y-0.5">
                  {salesChannels.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#2B2B2B] text-white font-semibold'
                            : 'text-zinc-300 hover:bg-[#252525] hover:text-white'
                        }`}
                      >
                        <Icon size={14} className={isActive ? 'text-[#C4A36A]' : 'text-zinc-400'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Apps & Moderation */}
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Apps &amp; Community
              </div>
              <div className="mt-1 space-y-0.5">
                {communityApps.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#2B2B2B] text-white font-semibold'
                          : 'text-zinc-300 hover:bg-[#252525] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? 'text-[#C4A36A]' : 'text-zinc-400'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-400 text-zinc-900">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Settings & Log Out */}
          <div className="p-3 border-t border-[#2C2C2C] space-y-1 bg-[#161616]">
            <button
              onClick={() => handleSelect('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-[#2B2B2B] text-white font-semibold'
                  : 'text-zinc-300 hover:bg-[#252525] hover:text-white'
              }`}
            >
              <Settings size={16} className={currentTab === 'settings' ? 'text-[#C4A36A]' : 'text-zinc-400'} />
              <span>Settings &amp; SEO</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-red-400 hover:bg-[#252525] transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto bg-[#F6F6F7] p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex lg:hidden">
          <div className="w-72 bg-[#1A1A1A] text-zinc-200 h-full flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#2C2C2C]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#C4A36A] text-[#1A1A1A] font-serif font-black text-xs flex items-center justify-center">
                    SH
                  </div>
                  <span className="font-serif text-lg font-bold text-white">GlowWithSH</span>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 px-3">Main</span>
                  {coreMenu.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left ${
                          isActive ? 'bg-[#2B2B2B] text-white font-semibold' : 'text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C4A36A] text-[#1A1A1A] font-bold">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 px-3">Online Store</span>
                  {salesChannels.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left ${
                          isActive ? 'bg-[#2B2B2B] text-white font-semibold' : 'text-zinc-300'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 px-3">Apps</span>
                  {communityApps.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left ${
                          isActive ? 'bg-[#2B2B2B] text-white font-semibold' : 'text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-bold">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2C2C2C] space-y-1">
              <button
                onClick={() => handleSelect('settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white"
              >
                <Settings size={16} />
                <span>Settings &amp; SEO</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

