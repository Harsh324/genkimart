'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

interface WishlistItem {
    id: number;
    image: string;
    title: string;
    price: number;
    quantity: number;
}

type AddOpts = { silent?: boolean };

interface WishlistContextProps {
    wishlistItems: WishlistItem[];
    addToWishlist: (item: WishlistItem, opts?: AddOpts) => void;
    removeFromWishlist: (id: number, opts?: AddOpts) => void;
    clearWishlist: (opts?: AddOpts) => void;
    updateItemQuantity: (id: number, quantity: number) => void;
    isWishlistLoaded: boolean;
}

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

export const useWishlist = (): WishlistContextProps => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
    return ctx;
};

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isWishlistLoaded, setIsWishlistLoaded] = useState(false);

    // Hydrate (silent)
    useEffect(() => {
        const stored = localStorage.getItem('wishlist');
        if (stored) {
            try { setWishlistItems(JSON.parse(stored)); }
            catch { localStorage.removeItem('wishlist'); }
        }
        setIsWishlistLoaded(true);
    }, []);

    // Persist
    useEffect(() => {
        if (isWishlistLoaded) localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems, isWishlistLoaded]);

    const addToWishlist = (item: WishlistItem, opts?: AddOpts) => {
        setWishlistItems(prev => {
            const exists = prev.some(i => i.title === item.title && i.image === item.image);
            if (exists) return prev;
            return [...prev, item];
        });
        if (isWishlistLoaded && !opts?.silent) {
            toast.success('Added to Wishlist!', { containerId: 'app-toaster' });
        }
    };

    const removeFromWishlist = (id: number, opts?: AddOpts) => {
        setWishlistItems(prev => prev.filter(i => i.id !== id));
        if (isWishlistLoaded && !opts?.silent) {
            toast.info('Removed from Wishlist', { containerId: 'app-toaster' });
        }
    };

    const clearWishlist = (opts?: AddOpts) => {
        setWishlistItems([]);
        if (isWishlistLoaded && !opts?.silent) {
            toast.info('Wishlist cleared', { containerId: 'app-toaster' });
        }
    };

    const updateItemQuantity = (id: number, quantity: number) => {
        setWishlistItems(prev =>
            prev.map(i => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i))
        );
    };

    const value = useMemo(
        () => ({
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            clearWishlist,
            updateItemQuantity,
            isWishlistLoaded,
        }),
        [wishlistItems, isWishlistLoaded]
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
