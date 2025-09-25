'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { toast } from 'react-toastify';
import type { ProductItem } from '@/types/content';

// ---------- Types
type ID = ProductItem['id'] | ProductItem['slug'];

type CartEntry = {
  product: ProductItem;
  quantity: number;
  active?: boolean; // kept for compatibility; not used for logic
};

type AddOpts = { silent?: boolean };

interface CartContextProps {
  // New API (mirrors WishlistContext)
  items: CartEntry[];
  add: (product: ProductItem, quantity?: number, opts?: AddOpts) => void;
  remove: (id: ID, opts?: AddOpts) => void;
  clear: (opts?: AddOpts) => void;
  updateQuantity: (id: ID, quantity: number) => void;
  isLoaded: boolean;

  // Legacy-compatible API (to avoid breaking existing code)
  cartItems: CartEntry[];
  addToCart: (item: CartEntry | { product: ProductItem; quantity?: number; active?: boolean }, opts?: AddOpts) => void;
  removeFromCart: (id: number | string, opts?: AddOpts) => void;
  updateItemQuantity: (id: number | string, quantity: number) => void;
  isCartLoaded: boolean;
}

// ---------- Storage / Channel
const STORAGE_KEY = 'cart:v3';
const LEGACY_KEY = 'cart'; // migrate from old key if present
const CHANNEL_NAME = 'cart-sync';

// ---------- Utils
const norm = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const keyOf = (p: ProductItem | CartEntry): string => {
  const hasProduct = (p as any)?.product;
  return hasProduct
    ? norm((p as CartEntry).product.id ?? (p as CartEntry).product.slug)
    : norm((p as ProductItem).id ?? (p as ProductItem).slug);
};

// ---------- Context
const CartContext = createContext<CartContextProps | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

// ---------- Provider
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  // Start empty to avoid SSR hydration mismatch
  const [items, setItems] = useState<CartEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const broadcast = useCallback((next: CartEntry[]) => {
    try {
      if (typeof window === 'undefined') return;
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage({ type: 'CART_SYNC', payload: JSON.stringify(next) });
        bc.close();
      } else {
        window.dispatchEvent(new CustomEvent('cart:sync', { detail: JSON.stringify(next) }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistSet = useCallback(
    (updater: (prev: CartEntry[]) => CartEntry[]) => {
      setItems(prev => {
        const next = updater(prev);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        broadcast(next);
        return next;
      });
    },
    [broadcast]
  );

  // Initial load + cross-tab / cross-tree sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;

    // Migrate legacy array of {id,image,title,price,quantity,active}
    const migrateLegacy = (raw: string) => {
      try {
        const legacy = JSON.parse(raw) as Array<{
          id: number | string;
          image: string;
          title: string;
          price: number;
          quantity: number;
          active?: boolean;
        }>;
        if (!Array.isArray(legacy)) return null;
        const migrated: CartEntry[] = legacy.map(l => ({
          product: {
            id: l.id as any,
            slug: String(l.id), // best-effort; adjust if you had real slugs
            image: l.image as any,
            title: l.title as any,
            price: l.price as any,
          } as unknown as ProductItem,
            quantity: Math.max(1, Number(l.quantity) || 1),
            active: l.active ?? true,
        }));
        return migrated;
      } catch {
        return null;
      }
    };

    const applyFromRaw = (raw: string | null) => {
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          setItems(parsed);
          return true;
        }
      } catch {
        /* ignore */
      }
      return false;
    };

    try {
      // Prefer new key
      const rawNew = localStorage.getItem(STORAGE_KEY);
      const ok = applyFromRaw(rawNew);

      if (!ok) {
        // Try legacy and migrate
        const rawOld = localStorage.getItem(LEGACY_KEY);
        const migrated = rawOld ? migrateLegacy(rawOld) : null;
        if (migrated) {
          setItems(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          localStorage.removeItem(LEGACY_KEY);
        } else {
          // ensure clean state if bad data
          localStorage.removeItem(STORAGE_KEY);
          setItems([]);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
    } finally {
      setIsLoaded(true);
    }

    // BroadcastChannel
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = (e) => {
          if (e?.data?.type === 'CART_SYNC') {
            const payload = e.data.payload ?? localStorage.getItem(STORAGE_KEY);
            try {
              const parsed = payload ? JSON.parse(payload) : [];
              if (Array.isArray(parsed)) setItems(parsed);
            } catch {
              /* ignore bad payload */
            }
          }
        };
      }
    } catch {
      /* ignore */
    }

    // storage event (cross-tab)
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEY) {
        try {
          const parsed = ev.newValue ? JSON.parse(ev.newValue) : [];
          if (Array.isArray(parsed)) setItems(parsed);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);

    // same-tab fallback event
    const onLocal = (e: Event) => {
      const detail = (e as CustomEvent<string | undefined>).detail ?? null;
      const raw = detail ?? localStorage.getItem(STORAGE_KEY);
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('cart:sync', onLocal as EventListener);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cart:sync', onLocal as EventListener);
    };
  }, []);

  // ---------- API (new)
  const add = useCallback((product: ProductItem, quantity = 1, opts?: AddOpts) => {
    const idStr = norm(product.id ?? product.slug);
    persistSet(prev => {
      const idx = prev.findIndex(e => keyOf(e) === idStr);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + Math.max(1, Math.floor(quantity || 1)) };
        return next;
      }
      return [...prev, { product, quantity: Math.max(1, Math.floor(quantity || 1)), active: true }];
    });
    if (isLoaded && !opts?.silent) toast.success('Added to cart', { containerId: 'app-toaster' });
  }, [persistSet, isLoaded]);

  const remove = useCallback((id: ID, opts?: AddOpts) => {
    const idStr = norm(id);
    persistSet(prev => prev.filter(e => keyOf(e) !== idStr));
    if (isLoaded && !opts?.silent) toast.info('Removed from cart', { containerId: 'app-toaster' });
  }, [persistSet, isLoaded]);

  const clear = useCallback((opts?: AddOpts) => {
    persistSet(() => []);
    if (isLoaded && !opts?.silent) toast.info('Cart cleared', { containerId: 'app-toaster' });
  }, [persistSet, isLoaded]);

  const updateQuantity = useCallback((id: ID, quantity: number) => {
    const idStr = norm(id);
    const q = Math.max(1, Math.floor(quantity || 1));
    persistSet(prev =>
      prev.map(e => (keyOf(e) === idStr ? { ...e, quantity: q } : e))
    );
  }, [persistSet]);

  // ---------- Legacy-compatible wrappers
  const addToCart = useCallback((
    input: CartEntry | { product: ProductItem; quantity?: number; active?: boolean },
    opts?: AddOpts
  ) => {
    // Accept either shape: addToCart({ product, quantity }) OR addToCart(entry)
    const product = (input as CartEntry).product ?? (input as any).product;
    const quantity = (input as CartEntry).quantity ?? (input as any).quantity ?? 1;
    add(product, quantity, opts);
  }, [add]);

  const removeFromCart = useCallback((id: number | string, opts?: AddOpts) => {
    remove(id as ID, opts);
  }, [remove]);

  const updateItemQuantity = useCallback((id: number | string, quantity: number) => {
    updateQuantity(id as ID, quantity);
  }, [updateQuantity]);

  // ---------- Value
  const value = useMemo<CartContextProps>(() => ({
    // new
    items,
    add,
    remove,
    clear,
    updateQuantity,
    isLoaded,
    // legacy
    cartItems: items,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    isCartLoaded: isLoaded,
  }), [items, add, remove, clear, updateQuantity, isLoaded, addToCart, removeFromCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
