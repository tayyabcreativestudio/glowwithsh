import { z } from 'zod';

export const phoneRegex = /^[6-9]\d{9}$/;
export const pincodeRegex = /^[1-9]\d{5}$/;

export function normalizeIndianPhone(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

export const orderCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .trim()
    .transform(normalizeIndianPhone)
    .refine((val) => phoneRegex.test(val), {
      message: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.',
    }),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().trim().min(5, 'Delivery address must be at least 5 characters').max(300),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100).default('Delhi'),
  pincode: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => pincodeRegex.test(val), {
      message: 'Please enter a valid 6-digit Indian PIN code.',
    }),
  deliveryNotes: z.string().trim().max(500).optional().default(''),
});

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(10, 'Maximum allowed quantity per item is 10'),
});

export const orderSubmissionSchema = z.object({
  customer: orderCustomerSchema,
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item').max(50),
  paymentMethod: z.enum(['cod', 'whatsapp', 'online_ready']).default('cod'),
  discountCode: z.string().trim().max(50).optional(),
});

export const paymentIntentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
}).refine((data) => Boolean(data.phone || data.email), {
  message: 'Phone number or email is required to verify the order.',
});

export const paymentVerifySchema = z.object({
  orderId: z.string().min(1, 'Internal Order ID is required'),
  razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Razorpay payment ID is required'),
  razorpay_signature: z.string().min(1, 'Razorpay signature is required'),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
}).refine((data) => Boolean(data.phone || data.email), {
  message: 'Phone number or email is required to verify the order.',
});

export const adminLoginSchema = z
  .object({
    username: z.string().trim().optional(),
    email: z.string().trim().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => Boolean(data.username || data.email), {
    message: 'Either username or email is required',
  });

export const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const reviewSubmissionSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().trim().max(200).optional(),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().min(5, 'Review must be at least 5 characters').max(2000),
});

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, '').slice(-10))
    .refine((val) => phoneRegex.test(val), {
      message: 'Please enter a valid 10-digit Indian mobile number.',
    }),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  subject: z.string().trim().max(200).optional().default('Storefront Message'),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(2000),
});

export const newsletterSubscriptionSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(254),
});

export const discountMutationSchema = z.object({
  code: z.string().trim().min(2).max(50).transform((s) => s.toUpperCase()),
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  discountValue: z.coerce.number().positive('Discount value must be positive'),
  minSpend: z.coerce.number().nonnegative().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().default(true),
});

export const productMutationSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(200),
  sku: z.string().trim().max(50).optional(),
  categoryId: z.string().optional(),
  price: z.coerce.number().positive('Price must be greater than zero'),
  compareAtPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().positive().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().default(50),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(10),
  trackInventory: z.boolean().default(true),
  allowBackorders: z.boolean().default(false),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  newProduct: z.boolean().default(false),
  limitedEdition: z.boolean().default(false),
  visible: z.boolean().default(true),
  primaryImage: z.string().url().optional().or(z.string().startsWith('/')),
  mediaGallery: z.array(z.string()).optional(),
  shortDescription: z.string().max(500).optional().default(''),
  description: z.string().max(5000).optional().default(''),
  ingredients: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  howToUse: z.string().optional().default(''),
  skinType: z.string().optional().default('All Skin Types'),
  productType: z.string().optional().default('Skincare Essential'),
  size: z.string().optional().default('50 ml'),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
});
