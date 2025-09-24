'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

interface CartItem {
    id: number;
    image: string;
    title: string;
    price: number;
    quantity: number;
    active: boolean; // kept for compatibility
}

type AddOpts = { silent?: boolean };

interface CartContextProps {
    cartItems: CartItem[];
    addToCart: (item: CartItem, opts?: AddOpts) => void;
    removeFromCart: (id: number, opts?: AddOpts) => void;
    updateItemQuantity: (id: number, quantity: number) => void;
    isCartLoaded: boolean;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartLoaded, setIsCartLoaded] = useState(false);

    // Hydrate (silent)
    useEffect(() => {
        const stored = localStorage.getItem('cart');
        if (stored) {
            try { setCartItems(JSON.parse(stored)); }
            catch { localStorage.removeItem('cart'); }
        }
        setIsCartLoaded(true);
    }, []);

    // Persist
    useEffect(() => {
        if (isCartLoaded) localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems, isCartLoaded]);

    const addToCart = (item: CartItem, opts?: AddOpts) => {
        setCartItems(prev => {
            // dedupe by title+image, increase qty
            const ix = prev.findIndex(i => i.title === item.title && i.image === item.image && i.active === true);
            if (ix >= 0) {
                const copy = [...prev];
                copy[ix] = { ...copy[ix], quantity: copy[ix].quantity + (item.quantity || 1) };
                return copy;
            }
            return [...prev, { ...item, active: true }];
        });
        if (isCartLoaded && !opts?.silent) {
            toast.success('Added to Cart!', { containerId: 'app-toaster' });
        }
    };

    const removeFromCart = (id: number, opts?: AddOpts) => {
        setCartItems(prev => prev.filter(i => i.id !== id));
        if (isCartLoaded && !opts?.silent) {
            toast.info('Removed from Cart', { containerId: 'app-toaster' });
        }
    };

    const updateItemQuantity = (id: number, quantity: number) => {
        setCartItems(prev =>
            prev.map(i => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i))
        );
    };

    const value = useMemo(
        () => ({ cartItems, addToCart, removeFromCart, updateItemQuantity, isCartLoaded }),
        [cartItems, isCartLoaded]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
