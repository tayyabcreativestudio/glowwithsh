import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { api } from './services/api';
import {
  Product,
  Category,
  HomepageCMS,
  FounderCMS,
  Award,
  InstagramSettings,
  BlogPost,
  Review,
  Order,
  ContactInquiry,
  SiteSettings,
  OrderStatus,
  StorePage as StorePageRecord,
} from './types';

// Storefront Core Components & Pages (Synchronous for fast first render)
import { AnnouncementBar } from './components/common/AnnouncementBar';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { SearchOverlay } from './components/common/SearchOverlay';
import { CartDrawer } from './components/common/CartDrawer';
import { Toast } from './components/common/Toast';
import { WhatsAppConcierge } from './components/common/WhatsAppConcierge';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StorePage } from './pages/StorePage';

// Code-split secondary pages for optimal lightweight bundle size
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const FounderPage = lazy(() => import('./pages/FounderPage').then((m) => ({ default: m.FounderPage })));
const AwardsPage = lazy(() => import('./pages/AwardsPage').then((m) => ({ default: m.AwardsPage })));
const JournalPage = lazy(() => import('./pages/JournalPage').then((m) => ({ default: m.JournalPage })));
const JournalArticlePage = lazy(() => import('./pages/JournalArticlePage').then((m) => ({ default: m.JournalArticlePage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PolicyPage = lazy(() => import('./pages/PolicyPage').then((m) => ({ default: m.PolicyPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const SkinQuizPage = lazy(() => import('./pages/SkinQuizPage').then((m) => ({ default: m.SkinQuizPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));

// Lazy-loaded Admin Suite (Completely detached from initial customer bundle)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminLogin = lazy(() => import('./components/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboardHome = lazy(() => import('./components/admin/AdminDashboardHome').then((m) => ({ default: m.AdminDashboardHome })));
const AdminProducts = lazy(() => import('./components/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminProductEditor = lazy(() => import('./components/admin/AdminProductEditor').then((m) => ({ default: m.AdminProductEditor })));
const AdminInventory = lazy(() => import('./components/admin/AdminInventory').then((m) => ({ default: m.AdminInventory })));
const AdminOrders = lazy(() => import('./components/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminDiscounts = lazy(() => import('./components/admin/AdminDiscounts').then((m) => ({ default: m.AdminDiscounts })));
const AdminCollections = lazy(() => import('./components/admin/AdminCollections').then((m) => ({ default: m.AdminCollections })));
const AdminBlog = lazy(() => import('./components/admin/AdminBlog').then((m) => ({ default: m.AdminBlog })));
const AdminCMSHomepage = lazy(() => import('./components/admin/AdminCMSHomepage').then((m) => ({ default: m.AdminCMSHomepage })));
const AdminCMSFounder = lazy(() => import('./components/admin/AdminCMSFounder').then((m) => ({ default: m.AdminCMSFounder })));
const AdminCMSAwards = lazy(() => import('./components/admin/AdminCMSAwards').then((m) => ({ default: m.AdminCMSAwards })));
const AdminCMSSocial = lazy(() => import('./components/admin/AdminCMSSocial').then((m) => ({ default: m.AdminCMSSocial })));
const AdminReviews = lazy(() => import('./components/admin/AdminReviews').then((m) => ({ default: m.AdminReviews })));
const AdminContacts = lazy(() => import('./components/admin/AdminContacts').then((m) => ({ default: m.AdminContacts })));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminPages = lazy(() => import('./components/admin/AdminPages').then((m) => ({ default: m.AdminPages })));
const AdminMedia = lazy(() => import('./components/admin/AdminMedia').then((m) => ({ default: m.AdminMedia })));

const AtelierPageFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
    <div className="w-8 h-8 rounded-full border-2 border-[#A78BFA] border-t-transparent animate-spin" />
    <span className="text-[10px] uppercase tracking-[0.25em] text-[#6B5F82] font-sans">
      Loading Atelier...
    </span>
  </div>
);

type AppRoute =
  | { view: 'home' }
  | { view: 'shop'; categoryId?: string }
  | { view: 'product'; slug: string }
  | { view: 'about' }
  | { view: 'founder' }
  | { view: 'awards' }
  | { view: 'journal' }
  | { view: 'article'; slug: string }
  | { view: 'contact' }
  | { view: 'cart' }
  | { view: 'checkout' }
  | { view: 'order-confirmation'; order?: Order; orderId?: string }
  | { view: 'track-order'; orderId?: string; phone?: string }
  | { view: 'quiz' }
  | { view: 'wishlist' }
  | { view: 'policies'; tab?: 'shipping' | 'refunds' | 'privacy' | 'terms' | 'faq' | 'disclaimer' | 'contact' }
  | { view: 'store-page'; slug: string }
  | { view: 'admin-login' }
  | { view: 'admin'; tab: string; editProductId?: string }
  | { view: '404' };

export function isAdminDomainOrPort(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.port === '5174' ||
    window.location.hostname.startsWith('admin.') ||
    window.location.hostname === 'admin.localhost'
  );
}

export function getStorefrontUrl(path = '/'): string {
  if (typeof window === 'undefined') return `http://localhost:5173${path}`;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:5173${path}`;
  }
  const mainHost = hostname.replace(/^admin\./, '');
  return `https://${mainHost}${path}`;
}

function parseLocationToRoute(pathname: string, search: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const query = new URLSearchParams(search);

  // If on Admin Port / Subdomain:
  if (isAdminDomainOrPort()) {
    if (cleanPath === '/' || cleanPath === '/home' || cleanPath === '/shop') {
      return { view: 'admin', tab: 'dashboard' };
    }
  }

  // Keep the customer storefront separate from the private admin portal.
  if (!isAdminDomainOrPort() && (cleanPath.startsWith('/admin') || cleanPath === '/admin-login')) {
    return { view: '404' };
  }

  if (cleanPath === '/' || cleanPath === '/home') {
    return { view: 'home' };
  }
  if (cleanPath.startsWith('/product/')) {
    const slug = cleanPath.replace('/product/', '').trim();
    if (slug) return { view: 'product', slug };
  }
  if (cleanPath.startsWith('/shop/category/')) {
    const categoryId = cleanPath.replace('/shop/category/', '').trim();
    return { view: 'shop', categoryId };
  }
  if (cleanPath === '/shop') {
    const categoryId = query.get('category') || undefined;
    return { view: 'shop', categoryId };
  }
  if (cleanPath === '/track-order' || cleanPath === '/track' || cleanPath === '/order-tracking') {
    const orderId = query.get('orderId') || query.get('order') || undefined;
    const phone = query.get('phone') || undefined;
    return { view: 'track-order', orderId, phone };
  }
  if (cleanPath === '/quiz' || cleanPath === '/skin-quiz' || cleanPath === '/consultation') {
    return { view: 'quiz' };
  }
  if (cleanPath === '/wishlist' || cleanPath === '/saved') {
    return { view: 'wishlist' };
  }
  if (cleanPath.startsWith('/journal/')) {
    const slug = cleanPath.replace('/journal/', '').trim();
    if (slug) return { view: 'article', slug };
  }
  if (cleanPath === '/journal' || cleanPath === '/blog') {
    return { view: 'journal' };
  }
  if (cleanPath === '/about') return { view: 'about' };
  if (cleanPath === '/founder') return { view: 'founder' };
  if (cleanPath === '/awards') return { view: 'awards' };
  if (cleanPath === '/contact') return { view: 'contact' };
  if (cleanPath === '/cart') return { view: 'cart' };
  if (cleanPath === '/checkout') return { view: 'checkout' };
  if (cleanPath === '/order-confirmation') {
    const orderId = query.get('orderId') || undefined;
    return { view: 'order-confirmation', orderId };
  }
  if (cleanPath === '/admin-login') return { view: 'admin-login' };
  if (cleanPath.startsWith('/admin')) {
    const pathParts = cleanPath.split('/');
    const tabMatch = pathParts[2] || query.get('tab') || 'dashboard';
    const encodedProductId = tabMatch === 'product-edit' ? pathParts[3] : undefined;
    const editProductId = encodedProductId ? decodeURIComponent(encodedProductId) : undefined;
    return { view: 'admin', tab: tabMatch, editProductId };
  }
  if (cleanPath.startsWith('/policies')) {
    const tabMatch = (cleanPath.split('/')[2] || query.get('tab') || 'shipping') as any;
    return { view: 'policies', tab: tabMatch };
  }
  if (cleanPath.length > 1 && !cleanPath.slice(1).includes('/')) {
    return { view: 'store-page', slug: cleanPath.slice(1) };
  }
  return { view: '404' };
}

function routeToPath(route: AppRoute): string {
  switch (route.view) {
    case 'home':
      return '/';
    case 'shop':
      return route.categoryId ? `/shop/category/${route.categoryId}` : '/shop';
    case 'product':
      return `/product/${route.slug}`;
    case 'track-order': {
      const q = new URLSearchParams();
      if (route.orderId) q.set('orderId', route.orderId);
      if (route.phone) q.set('phone', route.phone);
      const s = q.toString();
      return s ? `/track-order?${s}` : '/track-order';
    }
    case 'quiz':
      return '/quiz';
    case 'wishlist':
      return '/wishlist';
    case 'about':
      return '/about';
    case 'founder':
      return '/founder';
    case 'awards':
      return '/awards';
    case 'journal':
      return '/journal';
    case 'article':
      return `/journal/${route.slug}`;
    case 'contact':
      return '/contact';
    case 'cart':
      return '/cart';
    case 'checkout':
      return '/checkout';
    case 'order-confirmation': {
      const targetId = route.order?.id || route.orderId;
      return targetId ? `/order-confirmation?orderId=${encodeURIComponent(targetId)}` : '/order-confirmation';
    }
    case 'policies':
      return `/policies/${route.tab || 'shipping'}`;
    case 'store-page':
      return `/${route.slug}`;
    case 'admin-login':
      return '/admin-login';
    case 'admin':
      return route.tab === 'product-edit' && route.editProductId
        ? `/admin/product-edit/${encodeURIComponent(route.editProductId)}`
        : `/admin/${route.tab || 'dashboard'}`;
    case '404':
      return '/404';
  }
}

export const AppContent: React.FC = () => {
  const { isCartOpen, setIsCartOpen } = useCart();
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Navigation State with deep link parsing on initial load
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined'
      ? parseLocationToRoute(window.location.pathname, window.location.search)
      : { view: 'home' }
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'warning' } | null>(null);

  // App Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homepageCMS, setHomepageCMS] = useState<HomepageCMS | null>(null);
  const [founderCMS, setFounderCMS] = useState<FounderCMS | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [socialSettings, setSocialSettings] = useState<InstagramSettings | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [storePages, setStorePages] = useState<StorePageRecord[]>([]);

  // Admin-specific data
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  // Synchronize browser history with popstate
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseLocationToRoute(window.location.pathname, window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Toast trigger
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'success') => {
    setToast({ message, type });
  }, []);

  // Fetch initial storefront data
  const refreshAllData = useCallback(async () => {
    try {
      const [
        prodsData,
        catsData,
        homeData,
        founderData,
        awardsData,
        socialData,
        postsData,
        settingsData,
        pagesData,
      ] = await Promise.all([
        api.getProducts({ includeDrafts: true }),
        api.getCategories(),
        api.getHomepageCMS(),
        api.getFounderCMS(),
        api.getAwards(true),
        api.getSocialSettings(),
        api.getBlogPosts(true),
        api.getSiteSettings(),
        api.getPages(),
      ]);

      setProducts(prodsData.products || []);
      setCategories(catsData || []);
      setHomepageCMS(homeData);
      setFounderCMS(founderData);
      setAwards(awardsData || []);
      setSocialSettings(socialData);
      setPosts(postsData || []);
      setSiteSettings(settingsData);
      setStorePages(pagesData || []);
    } catch (err) {
      console.error('Failed to load atelier data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch admin operational records if authenticated
  const refreshAdminData = useCallback(async () => {
    if (!adminToken) return;
    try {
      const [ordersRes, reviewsData, contactsData] = await Promise.all([
        api.adminGetOrders(),
        api.getReviews(undefined, true),
        api.adminGetContacts(),
      ]);
      setOrders(ordersRes.orders || []);
      setReviews(reviewsData || []);
      setContacts(contactsData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, [adminToken]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  useEffect(() => {
    if (!isAdminDomainOrPort()) return;
    api.adminCheckAuth().then(() => setAdminToken('cookie')).catch(() => setAdminToken(null));
  }, []);

  // Synchronize document title with current storefront or admin view
  useEffect(() => {
    let pageTitle = 'GlowWithSH — Luxury Skincare & Beauty Rituals by Shagufi Hussain';
    switch (route.view) {
      case 'home':
        pageTitle = 'GlowWithSH — Luxury Skincare & Beauty Rituals by Shagufi Hussain';
        break;
      case 'shop':
        pageTitle = route.categoryId
          ? `${route.categoryId.charAt(0).toUpperCase() + route.categoryId.slice(1)} Collection | GlowWithSH`
          : 'The Formulations Catalog | GlowWithSH';
        break;
      case 'product': {
        const prod = products.find((p) => p.slug === route.slug);
        pageTitle = prod ? `${prod.name} | GlowWithSH Atelier` : 'Formulation Details | GlowWithSH';
        break;
      }
      case 'cart':
        pageTitle = 'Your Ritual Bag (Cart) | GlowWithSH';
        break;
      case 'checkout':
        pageTitle = 'Secure Atelier Checkout | GlowWithSH';
        break;
      case 'order-confirmation':
        pageTitle = 'Order Confirmed | GlowWithSH';
        break;
      case 'track-order':
        pageTitle = 'Live Shipment & Order Tracking | GlowWithSH';
        break;
      case 'quiz':
        pageTitle = 'Find Your Glow Ritual — Skin Quiz | GlowWithSH';
        break;
      case 'wishlist':
        pageTitle = 'Your Saved Rituals & Wishlist | GlowWithSH';
        break;
      case 'about':
        pageTitle = 'Our Heritage & Philosophy | GlowWithSH';
        break;
      case 'founder':
        pageTitle = 'Shagufi Hussain — Founder & Formulator | GlowWithSH';
        break;
      case 'awards':
        pageTitle = 'Verified Accolades & Recognition | GlowWithSH';
        break;
      case 'journal':
        pageTitle = 'The Atelier Journal & Ritual Guides | GlowWithSH';
        break;
      case 'article': {
        const post = posts.find((p) => p.slug === route.slug);
        pageTitle = post ? `${post.title} | GlowWithSH Journal` : 'Journal Article | GlowWithSH';
        break;
      }
      case 'contact':
        pageTitle = 'Concierge & Atelier Inquiries | GlowWithSH';
        break;
      case 'policies':
        pageTitle = `${(route.tab || 'shipping').toUpperCase()} Policy | GlowWithSH`;
        break;
      case 'admin-login':
        pageTitle = 'Atelier Admin Access | GlowWithSH';
        break;
      case 'admin':
        pageTitle = `Admin Console (${(route.tab || 'dashboard').toUpperCase()}) | GlowWithSH`;
        break;
      case '404':
        pageTitle = 'Page Not Found | GlowWithSH';
        break;
    }
    document.title = pageTitle;
  }, [route, products, posts]);

  useEffect(() => {
    if (adminToken) {
      refreshAdminData();
    }
  }, [adminToken, refreshAdminData]);

  // Navigate with browser history state sync and smooth scroll
  const navigate = (newRoute: AppRoute, replace = false) => {
    setRoute(newRoute);
    if (typeof window !== 'undefined') {
      const targetPath = routeToPath(newRoute);
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({}, '', targetPath);
        } else {
          window.history.pushState({}, '', targetPath);
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigatePath = (path: string) => {
    const [pathname, search = ''] = path.split('?');
    const targetRoute = parseLocationToRoute(pathname, search ? `?${search}` : '');
    navigate(targetRoute);
  };

  // Handlers for Products
  const handleSaveProduct = async (productData: Partial<Product>, productId?: string) => {
    try {
      const targetProductId = productId || productData.id;
      if (targetProductId) {
        await api.adminUpdateProduct(targetProductId, productData);
        showToast('Formulation updated successfully');
      } else {
        await api.adminCreateProduct(productData);
        showToast('New formulation created successfully');
      }
      await refreshAllData();
      navigate({ view: 'admin', tab: 'products' });
    } catch (err: any) {
      alert(err.message || 'Failed to save formulation');
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const duplicatePayload: Partial<Product> = {
        ...product,
        id: undefined,
        name: `${product.name} (Copy)`,
        slug: `${product.slug}-copy-${Date.now().toString().slice(-4)}`,
        sku: `GWSH-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      await api.adminCreateProduct(duplicatePayload);
      showToast(`Duplicated ${product.name}`);
      await refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate formulation');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.adminDeleteProduct(productId);
      showToast('Product removed from catalog');
      await refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'published' ? 'draft' : 'published';
      await api.adminUpdateProduct(product.id, { status: newStatus, visible: newStatus === 'published' });
      showToast(`Product set to ${newStatus}`);
      await refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number, reason: string) => {
    try {
      await api.adminAdjustStock(productId, newStock, reason);
      showToast(`Stock updated: ${reason}`);
      await refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  // Handlers for Orders
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    note?: string,
    trackingData?: {
      trackingNumber?: string;
      courierPartner?: string;
      courierTrackingUrl?: string;
      estimatedDeliveryDate?: string;
      dispatchDate?: string;
      currentLocation?: string;
    }
  ) => {
    try {
      await api.adminUpdateOrder(orderId, {
        orderStatus: status,
        note,
        ...trackingData,
      });
      showToast(`Order status updated to ${status}`);
      await refreshAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Handlers for Categories
  const handleSaveCategory = async (catData: Partial<Category> & { productIds?: string[] }) => {
    try {
      if (catData.id) {
        await api.adminUpdateCategory(catData.id, catData);
        showToast('Collection updated');
      } else {
        await api.adminCreateCategory(catData);
        showToast('Collection created');
      }
      await refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to save collection');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await api.adminDeleteCategory(catId);
      showToast('Collection removed');
      await refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove collection');
    }
  };

  // Handlers for Blog
  const handleSavePost = async (postData: Partial<BlogPost>) => {
    try {
      if (postData.id) {
        await api.adminUpdateBlog(postData.id, postData);
        showToast('Journal article updated');
      } else {
        await api.adminCreateBlog(postData);
        showToast('Journal article published');
      }
      await refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to save post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.adminDeleteBlog(postId);
      showToast('Article deleted');
      await refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  // Handlers for CMS
  const handleSaveHomepageCMS = async (cms: HomepageCMS) => {
    await api.adminUpdateHomepage(cms);
    setHomepageCMS(cms);
    showToast('Homepage CMS updated');
  };

  const handleSaveFounderCMS = async (data: any) => {
    await api.adminUpdateFounder(data);
    setFounderCMS(data);
    showToast('Founder profile updated');
  };

  const handleSaveAward = async (awardData: any) => {
    if (awardData.id) {
      await api.adminUpdateAward(awardData.id, awardData);
      showToast('Accolade updated');
    } else {
      await api.adminCreateAward(awardData);
      showToast('Accolade added');
    }
    const updatedAwards = await api.getAwards(true);
    setAwards(updatedAwards);
  };

  const handleDeleteAward = async (awardId: string) => {
    await api.adminDeleteAward(awardId);
    showToast('Accolade removed');
    const updatedAwards = await api.getAwards(true);
    setAwards(updatedAwards);
  };

  const handleSaveSocialCMS = async (data: any) => {
    await api.adminUpdateSocial(data);
    const updated = await api.getSocialSettings();
    setSocialSettings(updated);
    showToast('Instagram curation saved');
  };

  // Handlers for Reviews
  const handleModerateReview = async (reviewId: string, status: 'approved' | 'hidden') => {
    await api.adminUpdateReview(reviewId, status);
    showToast(`Review status: ${status}`);
    await refreshAdminData();
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.adminDeleteReview(reviewId);
      showToast('Review removed');
      await refreshAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  // Handlers for Contacts
  const handleUpdateContactStatus = async (contactId: string, status: string) => {
    await api.adminUpdateContact(contactId, status);
    showToast(`Inquiry marked as ${status}`);
    await refreshAdminData();
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await api.adminDeleteContact(contactId);
      showToast('Inquiry removed');
      await refreshAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete inquiry');
    }
  };

  // Handlers for Settings & Reset
  const handleSaveSettings = async (settings: SiteSettings) => {
    await api.adminUpdateSiteSettings(settings);
    setSiteSettings(settings);
    showToast('Atelier settings updated');
  };

  const handleResetSeedData = async () => {
    await api.adminResetDatabase();
    await refreshAllData();
    await refreshAdminData();
  };

  // Admin Auth Handlers
  const handleLoginAdmin = () => {
    setAdminToken('cookie');
    navigate({ view: 'admin', tab: 'dashboard' });
    showToast('Welcome back to the GlowWithSH atelier console');
  };

  const handleLogoutAdmin = () => {
    api.adminLogout().catch(() => undefined);
    setAdminToken(null);
    navigate({ view: 'home' });
    showToast('Logged out of atelier admin');
  };

  // Top Level Views: Admin Portal
  if (route.view === 'admin-login') {
    return (
      <Suspense fallback={<AtelierPageFallback />}>
        <AdminLogin
          onLoginSuccess={handleLoginAdmin}
          onCancel={() => navigate({ view: 'home' })}
        />
      </Suspense>
    );
  }

  if (route.view === 'admin') {
    if (!adminToken) {
      return (
        <Suspense fallback={<AtelierPageFallback />}>
          <AdminLogin
            onLoginSuccess={handleLoginAdmin}
            onCancel={() => navigate({ view: 'home' })}
          />
        </Suspense>
      );
    }

    const currentTab = route.tab || 'dashboard';
    const productBeingEdited = route.editProductId
      ? products.find((product) => product.id === route.editProductId)
      : undefined;

    return (
      <Suspense fallback={<AtelierPageFallback />}>
        <AdminLayout
          currentTab={currentTab}
          onSelectTab={(tab) => navigate({ view: 'admin', tab })}
          onViewStorefront={() => { window.location.href = getStorefrontUrl('/'); }}
          onLogout={handleLogoutAdmin}
          pendingReviewsCount={reviews.filter((r) => r.status === 'pending').length}
          newOrdersCount={orders.filter((o) => o.orderStatus === 'New').length}
          unreadContactsCount={contacts.filter((c) => c.status === 'unread').length}
        >
        {currentTab === 'dashboard' && (
          <AdminDashboardHome
            products={products}
            orders={orders}
            onNavigateTab={(tab) => navigate({ view: 'admin', tab })}
            onEditProduct={(p) => navigate({ view: 'admin', tab: 'product-edit', editProductId: p.id })}
          />
        )}

        {currentTab === 'products' && (
          <AdminProducts
            products={products}
            categories={categories}
            onAddNew={() => navigate({ view: 'admin', tab: 'product-new' })}
            onEdit={(p) => navigate({ view: 'admin', tab: 'product-edit', editProductId: p.id })}
            onDuplicate={handleDuplicateProduct}
            onDelete={handleDeleteProduct}
            onToggleStatus={handleToggleProductStatus}
          />
        )}

        {currentTab === 'product-new' && (
          <AdminProductEditor
            product={null}
            categories={categories}
            existingProducts={products}
            onSave={handleSaveProduct}
            onCancel={() => navigate({ view: 'admin', tab: 'products' })}
          />
        )}

        {currentTab === 'product-edit' && productBeingEdited && (
          <AdminProductEditor
            product={productBeingEdited}
            categories={categories}
            existingProducts={products}
            onSave={(productData) => handleSaveProduct(productData, productBeingEdited.id)}
            onCancel={() => navigate({ view: 'admin', tab: 'products' })}
          />
        )}

        {currentTab === 'product-edit' && !productBeingEdited && (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="font-serif text-2xl text-[#2A211F]">Product not found</h2>
            <p className="mt-2 text-sm text-[#6B5F5B]">
              This edit link is incomplete or the product has been removed.
            </p>
            <button
              type="button"
              onClick={() => navigate({ view: 'admin', tab: 'products' })}
              className="mt-5 rounded-lg bg-[#2A211F] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white"
            >
              Return to products
            </button>
          </div>
        )}

        {currentTab === 'inventory' && (
          <AdminInventory
            products={products}
            onUpdateStock={handleUpdateStock}
          />
        )}

        {currentTab === 'orders' && (
          <AdminOrders
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {currentTab === 'discounts' && (
          <AdminDiscounts />
        )}

        {currentTab === 'categories' && (
          <AdminCollections
            categories={categories}
            products={products}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {currentTab === 'blog' && (
          <AdminBlog
            posts={posts}
            onSavePost={handleSavePost}
            onDeletePost={handleDeletePost}
          />
        )}

        {currentTab === 'pages' && (
          <AdminPages onChanged={refreshAllData} />
        )}

        {currentTab === 'media' && <AdminMedia />}

        {currentTab === 'cms-homepage' && homepageCMS && (
          <AdminCMSHomepage
            cms={homepageCMS}
            onSave={handleSaveHomepageCMS}
          />
        )}

        {currentTab === 'cms-founder' && founderCMS && (
          <AdminCMSFounder
            founder={founderCMS as any}
            onSave={handleSaveFounderCMS}
          />
        )}

        {currentTab === 'cms-awards' && (
          <AdminCMSAwards
            awards={awards as any}
            onSaveAward={handleSaveAward}
            onDeleteAward={handleDeleteAward}
          />
        )}

        {currentTab === 'cms-social' && socialSettings && (
          <AdminCMSSocial
            social={{
              instagramHandle: socialSettings.handle,
              instagramUrl: socialSettings.profileUrl,
              posts: socialSettings.curatedPosts || [],
            }}
            onSave={async (data) => {
              await handleSaveSocialCMS({
                handle: data.instagramHandle,
                profileUrl: data.instagramUrl,
                curatedPosts: data.posts,
              });
            }}
          />
        )}

        {currentTab === 'reviews' && (
          <AdminReviews
            reviews={reviews}
            products={products}
            onModerateReview={handleModerateReview}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {currentTab === 'contacts' && (
          <AdminContacts
            contacts={contacts as any}
            onUpdateStatus={(id, st) => handleUpdateContactStatus(id, st)}
            onDeleteContact={handleDeleteContact}
          />
        )}

        {currentTab === 'settings' && siteSettings && (
          <AdminSettings
            settings={siteSettings}
            onSaveSettings={handleSaveSettings}
            onResetSeedData={handleResetSeedData}
          />
        )}
      </AdminLayout>
    </Suspense>
    );
  }

  // Storefront Render: Customer Journey
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5FF] text-[#1E1630]">
      {/* Top Announcement */}
      {homepageCMS?.announcementBar && (
        <AnnouncementBar
          text={homepageCMS.announcementBar.text}
          enabled={homepageCMS.announcementBar.enabled}
          linkText={homepageCMS.announcementBar.linkText}
          onActionClick={() => {
            if (homepageCMS.announcementBar.linkUrl) {
              handleNavigatePath(homepageCMS.announcementBar.linkUrl);
            } else {
              navigate({ view: 'shop' });
            }
          }}
        />
      )}

      {/* Global Header */}
      <Header
        currentPath={route.view === 'home' ? '/' : route.view === 'store-page' ? `/${route.slug}` : `/${route.view}`}
        onNavigate={handleNavigatePath}
        onOpenSearch={() => setIsSearchOpen(true)}
        pages={storePages.map(({ title, slug }) => ({ title, slug }))}
      />

      {/* Page Body */}
      <main className="flex-1">
        <Suspense fallback={<AtelierPageFallback />}>
        {route.view === 'home' && homepageCMS && founderCMS && (
          <HomePage
            products={products}
            categories={categories}
            homepageCMS={homepageCMS}
            founderCMS={founderCMS}
            awards={awards}
            socialSettings={
              socialSettings || {
                handle: '@glowwithsh_skinwhitening_',
                profileUrl: 'https://www.instagram.com/glowwithsh_skinwhitening_/?hl=en',
                enabled: true,
                mode: 'curated',
                curatedPosts: [],
              }
            }
            blogPosts={posts}
            onNavigate={handleNavigatePath}
            onSelectProduct={(slug: string) => navigate({ view: 'product', slug })}
            onSelectCategory={(catSlug: string) => navigate({ view: 'shop', categoryId: catSlug })}
            onSelectArticle={(slug: string) => navigate({ view: 'article', slug })}
          />
        )}

        {route.view === 'shop' && (
          <ShopPage
            products={products}
            categories={categories}
            initialCategory={route.categoryId}
            onSelectProduct={(slug) => navigate({ view: 'product', slug })}
          />
        )}

        {route.view === 'product' && (() => {
          if (loading && products.length === 0) {
            return (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#A78BFA] border-t-transparent animate-spin" />
              </div>
            );
          }
          const currentProduct = products.find((p) => p.slug === route.slug);
          if (!currentProduct) {
            return <NotFoundPage onBackToShop={() => navigate({ view: 'shop' })} />;
          }
          const related = products.filter((p) => p.id !== currentProduct.id).slice(0, 4);
          return (
            <ProductDetailPage
              product={currentProduct}
              relatedProducts={related}
              onSelectProduct={(slug: string) => navigate({ view: 'product', slug })}
              onNavigateToCheckout={() => navigate({ view: 'checkout' })}
              onBackToShop={() => navigate({ view: 'shop' })}
            />
          );
        })()}

        {route.view === 'about' && (
          <AboutPage
            onNavigateToShop={() => navigate({ view: 'shop' })}
            onNavigateToFounder={() => navigate({ view: 'founder' })}
          />
        )}

        {route.view === 'founder' && founderCMS && (
          <FounderPage
            cms={founderCMS}
            onNavigateToShop={() => navigate({ view: 'shop' })}
            onNavigateToContact={() => navigate({ view: 'contact' })}
          />
        )}

        {route.view === 'awards' && (
          <AwardsPage
            awards={awards}
            onNavigateToShop={() => navigate({ view: 'shop' })}
          />
        )}

        {route.view === 'journal' && (
          <JournalPage
            posts={posts}
            onSelectArticle={(slug) => navigate({ view: 'article', slug })}
          />
        )}

        {route.view === 'article' && (() => {
          if (loading && posts.length === 0) {
            return (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#A78BFA] border-t-transparent animate-spin" />
              </div>
            );
          }
          const currentPost = posts.find((p) => p.slug === route.slug);
          if (!currentPost) {
            return <NotFoundPage onBackToShop={() => navigate({ view: 'shop' })} />;
          }
          return (
            <JournalArticlePage
              post={currentPost}
              allProducts={products}
              onBack={() => navigate({ view: 'journal' })}
              onSelectProduct={(slug: string) => navigate({ view: 'product', slug })}
            />
          );
        })()}

        {route.view === 'contact' && (
          <ContactPage />
        )}

        {route.view === 'cart' && (
          <CartPage
            onNavigateToShop={() => navigate({ view: 'shop' })}
            onNavigateToCheckout={() => navigate({ view: 'checkout' })}
            onSelectProduct={(slug) => navigate({ view: 'product', slug })}
          />
        )}

        {route.view === 'checkout' && (
          <CheckoutPage
            onBackToCart={() => navigate({ view: 'cart' })}
            onOrderSuccess={(order) => navigate({ view: 'order-confirmation', order, orderId: order.id })}
          />
        )}

        {route.view === 'order-confirmation' && (
          <OrderConfirmationPage
            order={route.order}
            orderId={route.orderId}
            onContinueShopping={() => navigate({ view: 'shop' })}
            onNavigateToTrack={(orderId) => navigate({ view: 'track-order', orderId })}
          />
        )}

        {route.view === 'track-order' && (
          <TrackOrderPage
            initialOrderId={route.orderId}
            onNavigateToShop={() => navigate({ view: 'shop' })}
            onSelectProduct={(slug: string) => navigate({ view: 'product', slug })}
          />
        )}

        {route.view === 'quiz' && (
          <SkinQuizPage
            allProducts={products}
            onNavigateToShop={() => navigate({ view: 'shop' })}
            onSelectProduct={(slug: string) => navigate({ view: 'product', slug })}
          />
        )}

        {route.view === 'wishlist' && (
          <WishlistPage
            onNavigateToShop={() => navigate({ view: 'shop' })}
            onSelectProduct={(slug: string) => navigate({ view: 'product', slug })}
          />
        )}

        {route.view === 'policies' && (
          <PolicyPage initialTab={route.tab} />
        )}

        {route.view === 'store-page' && (() => {
          if (loading) return <AtelierPageFallback />;
          const page = storePages.find((item) => item.slug === route.slug);
          return page ? <StorePage page={page} onNavigateToShop={() => navigate({ view: 'shop' })} /> : <NotFoundPage onBackToShop={() => navigate({ view: 'shop' })} />;
        })()}

        {route.view === '404' && (
          <NotFoundPage onBackToShop={() => navigate({ view: 'shop' })} />
        )}
        </Suspense>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigatePath} />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onCheckout={() => {
          closeCart();
          navigate({ view: 'checkout' });
        }}
        onNavigateToShop={() => {
          closeCart();
          navigate({ view: 'shop' });
        }}
        onSelectProduct={(slug: string) => {
          closeCart();
          navigate({ view: 'product', slug });
        }}
      />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={(product) => {
          setIsSearchOpen(false);
          navigate({ view: 'product', slug: product.slug });
        }}
      />

      {/* Luxury WhatsApp & Order Concierge */}
      <WhatsAppConcierge onNavigate={handleNavigatePath} />

      {/* Global Toast */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <AppContent />
      </WishlistProvider>
    </CartProvider>
  );
}
