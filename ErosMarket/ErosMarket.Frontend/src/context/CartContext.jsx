import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const stored = localStorage.getItem('eros_cart');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    const persist = (newItems) => {
        localStorage.setItem('eros_cart', JSON.stringify(newItems));
        setItems(newItems);
    };

    const addToCart = (product) => {
        const existing = items.find(i => i.product.id === product.id);
        if (existing) {
            persist(items.map(i =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            persist([...items, { product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId) => persist(items.filter(i => i.product.id !== productId));

    const updateQuantity = (productId, delta) => {
        persist(items.map(i =>
            i.product.id === productId
                ? { ...i, quantity: Math.max(1, i.quantity + delta) }
                : i
        ));
    };

    const totalCount = items.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, totalCount, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
