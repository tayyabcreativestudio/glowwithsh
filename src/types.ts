export type ProductStatus = 'published' | 'draft' | 'archived';
export type BadgeType = 'NEW' | 'BESTSELLER' | 'LIMITED' | 'FEATURED' | 'SALE' | '';

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  collectionId?: string;
  shortDescription: string;
  description: string;
  sourceDescription?: string; // Original raw catalog notes
  benefits: string[];
  ingredients: string[];
  howToUse: string;
  skinType: string;
  productType: string;
  size: string;
  weight?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  status: ProductStatus;
  featured: boolean;
  bestSeller: boolean;
  newProduct: boolean;
  limitedEdition: boolean;
  visible: boolean;
  primaryImage: string;
  mediaGallery: string[];
  video?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  featured: boolean;
  productIds: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded'
  | 'Payment Failed';

export type PaymentStatus = 'pending_cod' | 'paid' | 'manual_verification' | 'pending_online' | 'failed' | 'refunded';

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountAmount?: number;
  couponCode?: string;
  deliveryFee: number;
  grandTotal: number;
  paymentMethod: 'cod' | 'whatsapp' | 'online_ready';
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paymentGateway?: string;
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistory[];
  source: 'web' | 'admin' | 'whatsapp';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  trackingNumber?: string;
  courierPartner?: string;
  courierTrackingUrl?: string;
  estimatedDeliveryDate?: string;
  dispatchDate?: string;
  currentLocation?: string;
  razorpayOrderId?: string;
  stockReserved?: boolean;
  stockRestored?: boolean;
  refundId?: string;
  refundAmount?: number;
  refundStatus?: string;
  orderConfirmationEmail?: {
    status: 'sent' | 'failed' | 'skipped';
    attemptedAt: string;
    providerId?: string;
    error?: string;
  };
  taxSummary?: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    rate: number;
    isInterstate: boolean;
    hsn: string;
  };
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  newStock: number;
  change: number;
  reason: string;
  adjustedBy: string;
  timestamp: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft';
  publishedAt: string;
  readTime: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  relatedProductIds?: string[];
}

export interface Award {
  id: string;
  title: string;
  organization: string;
  year: string;
  description: string;
  image?: string;
  externalLink?: string;
  verified: boolean;
  published: boolean;
}

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  postUrl: string;
  likes?: number;
}

export interface InstagramSettings {
  handle: string;
  profileUrl: string;
  enabled: boolean;
  mode: 'curated' | 'api';
  curatedPosts: InstagramPost[];
}

export interface FounderCMS {
  founderName: string;
  headline: string;
  quote: string;
  story: string;
  image: string;
  additionalImages: string[];
  signatureTitle: string;
}

export interface HomepageCMS {
  announcementBar: {
    enabled: boolean;
    text: string;
    linkText?: string;
    linkUrl?: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    videoUrl: string;
    mobileVideoUrl?: string;
    posterImage: string;
    autoplay: boolean;
    overlayOpacity: number;
  };
  editorialStatement: {
    headline: string;
    text: string;
    image?: string;
  };
  sectionVisibility: {
    hero: boolean;
    featured: boolean;
    statement: boolean;
    categories: boolean;
    founder: boolean;
    awards: boolean;
    bestSellers: boolean;
    instagram: boolean;
    journal: boolean;
  };
}

export interface SiteSettings {
  brandName: string;
  founder: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  businessHours: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  currency: string;
  currencySymbol: string;
  whatsappNotificationNumber: string;
  adminPassword?: string;
  adminPasswordHash?: string;
  adminTokenVersion?: number;
  gstin?: string;
  legalBusinessName?: string;
  grievanceOfficerName?: string;
  grievanceOfficerEmail?: string;
  // Storewide SEO & Social Sharing (Shopify Preferences)
  metaTitle?: string;
  metaDescription?: string;
  socialSharingImage?: string;
  googleAnalyticsId?: string;
  googleSearchConsoleTag?: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'resolved' | 'spam';
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  reviewText: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount?: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  altText: string;
  category: 'products' | 'editorial' | 'founder' | 'awards' | 'social';
  sizeBytes?: number;
  dimensions?: string;
  uploadedAt: string;
}

export type AdminRole = 'Super Admin' | 'Manager' | 'Editor' | 'Support';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  username?: string;
  passwordHash?: string;
  tokenVersion?: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  timestamp: string;
}
