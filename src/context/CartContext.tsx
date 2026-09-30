import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalCount: number;
  subtotal: number;
  toastMessage: string | null;
  dismissToast: () => void;
  appliedPromo: string | null;
  discountAmount: number;
  promoMinSpend: number;
  applyDiscount: (code: string, amount: number, minSpend?: number) => void;
  clearDiscount: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'glowwithsh_cart_v1';
const PROMO_STORAGE_KEY = 'glowwithsh_promo_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
    return [];
  });

  const [promoState, setPromoState] = useState<{ code: string | null; amount: number; minSpend: number }>(() => {
    try {
      const saved = localStorage.getItem(PROMO_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load promo from storage', e);
    }
    return { code: null, amount: 0, minSpend: 0 };
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promoState));
    } catch (e) {
      console.error('Failed to save promo to storage', e);
    }
  }, [promoState]);

  // Enforce promo minimum spend dynamically as cart changes
  useEffect(() => {
    if (promoState.code && promoState.minSpend > 0 && subtotal < promoState.minSpend) {
      const removedCode = promoState.code;
      setPromoState({ code: null, amount: 0, minSpend: 0 });
      showToast(`Promo code "${removedCode}" removed: requires minimum order of ₹${promoState.minSpend}.`);
    }
  }, [subtotal, promoState.code, promoState.minSpend]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const applyDiscount = (code: string, amount: number, minSpend = 0) => {
    setPromoState({ code, amount, minSpend });
  };

  const clearDiscount = () => {
    setPromoState({ code: null, amount: 0, minSpend: 0 });
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (quantity <= 0) return;
    const maxStock = product.trackInventory && !product.allowBackorders ? product.stockQuantity : 999;
    
    if (maxStock <= 0) {
      showToast(`"${product.name}" is currently out of stock.`);
      return;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (nextQty > maxStock) {
          showToast(`Adjusted to maximum available stock (${maxStock} units).`);
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: maxStock } : item
          );
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      }

      const initialQty = Math.min(quantity, maxStock);
      if (quantity > maxStock) {
        showToast(`Only ${maxStock} units available for "${product.name}".`);
      } else {
        showToast(`Added ${product.name} to your ritual.`);
      }
      return [...prev, { product, quantity: initialQty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.trackInventory && !item.product.allowBackorders
            ? item.product.stockQuantity
            : 999;
          const cappedQty = Math.min(quantity, maxStock);
          if (quantity > maxStock) {
            showToast(`Maximum ${maxStock} units available for ${item.product.name}`);
          }
          return { ...item, quantity: cappedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    clearDiscount();
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalCount,
        subtotal,
        toastMessage,
        dismissToast: () => setToastMessage(null),
        appliedPromo: promoState.code,
        discountAmount: promoState.amount,
        promoMinSpend: promoState.minSpend,
        applyDiscount,
        clearDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
