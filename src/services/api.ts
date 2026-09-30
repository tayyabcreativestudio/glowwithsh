import {
  Product,
  Category,
  Collection,
  Order,
  InventoryAdjustment,
  BlogPost,
  Award,
  InstagramSettings,
  FounderCMS,
  HomepageCMS,
  SiteSettings,
  ContactInquiry,
  Review,
  DiscountCode,
  MediaItem,
  AdminUser,
  ActivityLog,
} from '../types';

// Keep local development and a single-origin deployment simple, while allowing
// a dedicated API subdomain in production (for example https://api.example.com/api).
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export const api = {
  // Public Storefront
  async getProducts(params?: {
    category?: string;
    collection?: string;
    search?: string;
    sort?: string;
    includeDrafts?: boolean;
    featured?: boolean;
    bestSeller?: boolean;
  }): Promise<{ products: Product[]; total: number; count: number }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.collection) query.set('collection', params.collection);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.includeDrafts) query.set('includeDrafts', 'true');
    if (params?.featured) query.set('featured', 'true');
    if (params?.bestSeller) query.set('bestSeller', 'true');

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  async getProduct(slugOrId: string): Promise<{ product: Product; related: Product[] }> {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slugOrId)}`);
    if (!res.ok) throw new Error('Failed to load product');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  async getCollections(): Promise<Collection[]> {
    const res = await fetch(`${API_BASE}/collections`);
    if (!res.ok) throw new Error('Failed to load collections');
    return res.json();
  },

  async getHomepageCMS(): Promise<HomepageCMS> {
    const res = await fetch(`${API_BASE}/homepage`);
    if (!res.ok) throw new Error('Failed to load homepage configuration');
    return res.json();
  },

  async getFounderCMS(): Promise<FounderCMS> {
    const res = await fetch(`${API_BASE}/founder`);
    if (!res.ok) throw new Error('Failed to load founder details');
    return res.json();
  },

  async getAwards(all = false): Promise<Award[]> {
    const res = await fetch(`${API_BASE}/awards?all=${all}`);
    if (!res.ok) throw new Error('Failed to load awards');
    return res.json();
  },

  async getSocialSettings(): Promise<InstagramSettings> {
    const res = await fetch(`${API_BASE}/social`);
    if (!res.ok) throw new Error('Failed to load social settings');
    return res.json();
  },

  async getSiteSettings(): Promise<SiteSettings> {
    const res = await fetch(`${API_BASE}/site-settings`);
    if (!res.ok) throw new Error('Failed to load site settings');
    return res.json();
  },

  async getBlogPosts(includeDrafts = false): Promise<BlogPost[]> {
    const res = await fetch(`${API_BASE}/blog?includeDrafts=${includeDrafts}`);
    if (!res.ok) throw new Error('Failed to load journal articles');
    return res.json();
  },

  async getBlogPost(slugOrId: string): Promise<{ post: BlogPost; relatedProducts: Product[] }> {
    const res = await fetch(`${API_BASE}/blog/${encodeURIComponent(slugOrId)}`);
    if (!res.ok) throw new Error('Failed to load article');
    return res.json();
  },

  async getReviews(productId?: string, all = false): Promise<Review[]> {
    const query = new URLSearchParams();
    if (productId) query.set('productId', productId);
    if (all) query.set('all', 'true');
    const res = await fetch(`${API_BASE}/reviews?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load reviews');
    return res.json();
  },

  async submitReview(data: Partial<Review>): Promise<{ success: boolean; message: string; review: Review }> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit review');
    }
    return res.json();
  },

  async submitContact(data: { name: string; phone: string; email?: string; subject?: string; message: string }) {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send contact inquiry');
    }
    return res.json();
  },

  async subscribeNewsletter(email: string): Promise<{ success: boolean; alreadySubscribed: boolean }> {
    const res = await fetch(`${API_BASE}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register email');
    }
    return res.json();
  },

  async validateDiscount(
    code: string,
    subtotal = 0
  ): Promise<{ code: string; discountType: string; discountValue: number; minSpend?: number }> {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) throw new Error('Please enter a promotional code');

    const res = await fetch(`${API_BASE}/discounts/validate/${encodeURIComponent(clean)}?subtotal=${subtotal}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Invalid or inactive promotional code');
    }
    return res.json();
  },

  async lookupOrder(orderId: string, identity: { phone?: string; email?: string } = {}): Promise<{ success: boolean; order: Order; whatsappUrl: string }> {
    const query = new URLSearchParams();
    if (identity.phone) query.set('phone', identity.phone);
    if (identity.email) query.set('email', identity.email);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/orders/lookup/${encodeURIComponent(orderId)}${suffix}`);
    if (!res.ok) throw new Error('Order not found or verification expired');
    return res.json();
  },

  async trackOrder(query: { orderId: string; phone?: string; email?: string; query?: string }): Promise<{ success: boolean; orders: Order[]; order?: Order; total: number }> {
    const params = new URLSearchParams();
    params.set('orderId', query.orderId || query.query || '');
    if (query.phone) params.set('phone', query.phone);
    if (query.email) params.set('email', query.email);

    const res = await fetch(`${API_BASE}/orders/track?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'No matching order found for this tracking query');
    }
    return res.json();
  },

  async submitOrder(orderData: {
    customer: {
      name: string;
      phone: string;
      email?: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      deliveryNotes?: string;
    };
    items: { productId: string; quantity: number }[];
    paymentMethod: 'cod' | 'whatsapp' | 'online_ready';
    discountCode?: string;
  }): Promise<{ success: boolean; order: Order; whatsappUrl: string }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to process order');
    }
    return res.json();
  },

  async createPaymentIntent(details: {
    orderId: string;
    phone?: string;
    email?: string;
  }): Promise<{ success: boolean; orderId: string; internalOrderId: string; amount: number; currency: 'INR'; keyId: string; sandbox: boolean }> {
    const res = await fetch(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initialize payment intent');
    }
    return res.json();
  },

  async verifyPayment(details: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    phone?: string;
    email?: string;
  }): Promise<{ success: boolean; order: Order; verified?: boolean; alreadyPaid?: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Payment verification failed');
    }
    return res.json();
  },

  async switchToCod(orderId: string, identity: { phone?: string; email?: string }): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/switch-to-cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identity),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Unable to switch order to COD');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // Admin API Endpoints
  // ----------------------------------------------------
  async adminLogin(email: string, password: string): Promise<{ success: boolean; user: AdminUser }> {
    const res = await fetch(`${API_BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Login failed');
    }
    const data = await res.json();
    return data;
  },

  async adminLogout(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
  },

  async adminCheckAuth(): Promise<{ success: boolean; user: AdminUser }> {
    const res = await fetch(`${API_BASE}/admin/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error('Unauthenticated');
    return res.json();
  },

  async adminChangePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update administrative password');
    }
    return res.json();
  },

  async adminCreateProduct(productData: Partial<Product>): Promise<{ success: boolean; product: Product; warning?: string }> {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  async adminUpdateProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean; product: Product }> {
    const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async adminDeleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  async adminCreateCategory(data: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create collection');
    }
    return res.json();
  },

  async adminUpdateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update collection');
    }
    return res.json();
  },

  async adminDeleteCategory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete collection');
    return res.json();
  },

  async adminBulkProducts(productIds: string[], action: string, value?: string): Promise<{ success: boolean; updatedCount: number }> {
    const res = await fetch(`${API_BASE}/admin/products/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productIds, action, value }),
    });
    if (!res.ok) throw new Error('Failed bulk action');
    return res.json();
  },

  async adminGetOrders(status?: string, search?: string): Promise<{ total: number; orders: Order[] }> {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.set('status', status);
    if (search) query.set('search', search);

    const res = await fetch(`${API_BASE}/orders?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async adminUpdateOrder(
    id: string,
    data: {
      orderStatus?: string;
      paymentStatus?: string;
      note?: string;
      trackingNumber?: string;
      courierPartner?: string;
      courierTrackingUrl?: string;
      estimatedDeliveryDate?: string;
      dispatchDate?: string;
      currentLocation?: string;
    }
  ): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },

  async adminGetInventoryAdjustments(): Promise<InventoryAdjustment[]> {
    const res = await fetch(`${API_BASE}/admin/inventory/adjustments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load inventory log');
    return res.json();
  },

  async adminAdjustStock(productId: string, newStock: number, reason: string): Promise<{ success: boolean; product: Product; adjustment: InventoryAdjustment }> {
    const res = await fetch(`${API_BASE}/admin/inventory/adjust`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, newStock, reason }),
    });
    if (!res.ok) throw new Error('Failed to adjust stock');
    return res.json();
  },

  async adminCreateBlog(data: Partial<BlogPost>): Promise<BlogPost> {
    const res = await fetch(`${API_BASE}/admin/blog`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create article');
    return res.json();
  },

  async adminUpdateBlog(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    const res = await fetch(`${API_BASE}/admin/blog/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update article');
    return res.json();
  },

  async adminDeleteBlog(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/blog/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete article');
    return res.json();
  },

  async adminUpdateHomepage(data: Partial<HomepageCMS>): Promise<{ success: boolean; homepageCMS: HomepageCMS }> {
    const res = await fetch(`${API_BASE}/admin/homepage`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update homepage');
    return res.json();
  },

  async adminUpdateFounder(data: Partial<FounderCMS>): Promise<{ success: boolean; founderCMS: FounderCMS }> {
    const res = await fetch(`${API_BASE}/admin/founder`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update founder details');
    return res.json();
  },

  async adminCreateAward(data: Partial<Award>): Promise<Award> {
    const res = await fetch(`${API_BASE}/admin/awards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create award');
    return res.json();
  },

  async adminUpdateAward(id: string, data: Partial<Award>): Promise<Award> {
    const res = await fetch(`${API_BASE}/admin/awards/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update award');
    return res.json();
  },

  async adminDeleteAward(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/awards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete award');
    return res.json();
  },

  async adminUpdateSocial(data: Partial<InstagramSettings>): Promise<InstagramSettings> {
    const res = await fetch(`${API_BASE}/admin/social`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update social settings');
    return res.json();
  },

  async adminUpdateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch(`${API_BASE}/admin/site-settings`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async adminGetContacts(): Promise<ContactInquiry[]> {
    const res = await fetch(`${API_BASE}/admin/contacts`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load contacts');
    return res.json();
  },

  async adminUpdateContact(id: string, status: string): Promise<ContactInquiry> {
    const res = await fetch(`${API_BASE}/admin/contacts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update inquiry');
    return res.json();
  },

  async adminDeleteContact(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/contacts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete inquiry');
    return res.json();
  },

  async adminUpdateReview(id: string, status: string): Promise<Review> {
    const res = await fetch(`${API_BASE}/admin/reviews/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update review status');
    return res.json();
  },

  async adminDeleteReview(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/reviews/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete review');
    return res.json();
  },

  async adminGetDiscounts(): Promise<DiscountCode[]> {
    const res = await fetch(`${API_BASE}/admin/discounts`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load discounts');
    return res.json();
  },

  async adminCreateDiscount(data: Partial<DiscountCode>): Promise<DiscountCode> {
    const res = await fetch(`${API_BASE}/admin/discounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create discount code');
    return res.json();
  },

  async adminUpdateDiscount(id: string, data: Partial<DiscountCode>): Promise<DiscountCode> {
    const res = await fetch(`${API_BASE}/admin/discounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update discount code');
    return res.json();
  },

  async adminDeleteDiscount(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/discounts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete discount code');
    return res.json();
  },

  async adminGetMedia(): Promise<MediaItem[]> {
    const res = await fetch(`${API_BASE}/admin/media`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load media');
    return res.json();
  },

  async adminAddMedia(item: { title: string; url: string; altText?: string; category?: string }): Promise<MediaItem> {
    const res = await fetch(`${API_BASE}/admin/media`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to add media');
    return res.json();
  },

  async adminUploadImage(
    file: File,
    category = 'products',
    title?: string,
    altText?: string
  ): Promise<{ success: boolean; url: string; filename: string; size: number; mediaItem: MediaItem }> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file from disk'));
      reader.readAsDataURL(file);
    });

    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        filename: file.name,
        data: base64Data,
        category,
        title: title || file.name,
        altText: altText || title || file.name,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload image');
    }
    return res.json();
  },

  async adminUploadVideo(file: File): Promise<{ success: boolean; url: string; filename: string; size: number; mediaItem: MediaItem }> {
    const res = await fetch(`${API_BASE}/admin/upload-video`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
      },
      body: file,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload video');
    }
    return res.json();
  },

  async adminDeleteMedia(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete media');
    return res.json();
  },

  async adminGetActivityLogs(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/admin/activity-logs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  async adminSuggestSeo(input: { name: string; description: string; currentTitle?: string; currentDescription?: string; category?: string }): Promise<{ title: string; description: string; focusKeyword: string; suggestions: string[] }> {
    const res = await fetch(`${API_BASE}/admin/seo/suggest`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(input) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate SEO suggestions');
    }
    const payload = await res.json();
    return payload.suggestion;
  },

  async adminResetDatabase(): Promise<{ success: boolean; count: number; message: string }> {
    const res = await fetch(`${API_BASE}/admin/reset-database`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  },
};
