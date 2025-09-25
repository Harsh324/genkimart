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

type ID = ProductItem['id'] | ProductItem['slug'];

type WishlistEntry = {
	product: ProductItem;
	quantity: number;
};

interface WishlistContextProps {
	items: WishlistEntry[];
	add: (product: ProductItem, quantity?: number) => void;
	remove: (id: ID) => void;
	clear: () => void;
	updateQuantity: (id: ID, quantity: number) => void;
	isLoaded: boolean;
}

const STORAGE_KEY = 'wishlist:v3';
const CHANNEL_NAME = 'wishlist-sync';

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

export const useWishlist = () => {
	const ctx = useContext(WishlistContext);
	if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
	return ctx;
};

// ---- key normalization (ALWAYS compare as string)
const norm = (v: unknown) =>
	v === null || v === undefined ? '' : String(v);

const keyOf = (p: ProductItem | WishlistEntry): string => {
	const hasProduct = (p as any)?.product;
	return hasProduct
		? norm((p as WishlistEntry).product.id ?? (p as WishlistEntry).product.slug)
		: norm((p as ProductItem).id ?? (p as ProductItem).slug);
};

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
	// start empty to avoid hydration mismatches; load after mount
	const [items, setItems] = useState<WishlistEntry[]>([]);
	const [isLoaded, setIsLoaded] = useState(false);

	const broadcast = useCallback((next: WishlistEntry[]) => {
		try {
			if (typeof window === 'undefined') return;
			if ('BroadcastChannel' in window) {
				const bc = new BroadcastChannel(CHANNEL_NAME);
				bc.postMessage({ type: 'WISHLIST_SYNC', payload: JSON.stringify(next) });
				bc.close();
			} else {
				window.dispatchEvent(new CustomEvent('wishlist:sync', { detail: JSON.stringify(next) }));
			}
		} catch {
			/* ignore */
		}
	}, []);

	const persistSet = useCallback((updater: (prev: WishlistEntry[]) => WishlistEntry[]) => {
		setItems(prev => {
			const next = updater(prev);
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			} catch { /* ignore */ }
			broadcast(next);
			return next;
		});
	}, [broadcast]);

	useEffect(() => {
		let bc: BroadcastChannel | null = null;

		const applyFromRaw = (raw: string | null) => {
			try {
				const parsed = raw ? JSON.parse(raw) : [];
				if (Array.isArray(parsed)) setItems(parsed);
			} catch {
				localStorage.removeItem(STORAGE_KEY);
				setItems([]);
			}
		};

		// initial load before flipping isLoaded
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) applyFromRaw(raw);
		} catch {
			localStorage.removeItem(STORAGE_KEY);
		} finally {
			setIsLoaded(true);
		}

		// sync via BroadcastChannel
		try {
			if ('BroadcastChannel' in window) {
				bc = new BroadcastChannel(CHANNEL_NAME);
				bc.onmessage = (e) => {
					if (e?.data?.type === 'WISHLIST_SYNC') {
						applyFromRaw(e.data.payload ?? localStorage.getItem(STORAGE_KEY));
					}
				};
			}
		} catch { /* ignore */ }

		// cross-tab storage sync
		const onStorage = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY) applyFromRaw(e.newValue);
		};
		window.addEventListener('storage', onStorage);

		// same-tab CustomEvent fallback
		const onLocal = (e: Event) => {
			const detail = (e as CustomEvent<string | undefined>).detail ?? null;
			applyFromRaw(detail ?? localStorage.getItem(STORAGE_KEY));
		};
		window.addEventListener('wishlist:sync', onLocal as EventListener);

		return () => {
			if (bc) bc.close();
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('wishlist:sync', onLocal as EventListener);
		};
	}, []);

	// ---- API (all comparisons via string keys)

	const add = useCallback((product: ProductItem, quantity = 1) => {
		const idStr = norm(product.id ?? product.slug);
		persistSet(prev => {
			const idx = prev.findIndex(e => keyOf(e) === idStr);
			if (idx >= 0) {
				const next = [...prev];
				next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
				return next;
			}
			return [...prev, { product, quantity }];
		});
		toast.success('Added to wishlist', { containerId: 'app-toaster' });
	}, [persistSet]);

	const remove = useCallback((id: ID) => {
		const idStr = norm(id);
		persistSet(prev => prev.filter(e => keyOf(e) !== idStr));
		toast.info('Removed from wishlist', { containerId: 'app-toaster' });
	}, [persistSet]);

	const clear = useCallback(() => {
		persistSet(() => []);
		toast.info('Wishlist cleared', { containerId: 'app-toaster' });
	}, [persistSet]);

	const updateQuantity = useCallback((id: ID, quantity: number) => {
		const idStr = norm(id);
		const q = Math.max(1, Math.floor(quantity || 1));
		persistSet(prev =>
			prev.map(e => (keyOf(e) === idStr ? { ...e, quantity: q } : e))
		);
	}, [persistSet]);

	const value = useMemo(() => ({
		items,
		add,
		remove,
		clear,
		updateQuantity,
		isLoaded,
	}), [items, add, remove, clear, updateQuantity, isLoaded]);

	return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
