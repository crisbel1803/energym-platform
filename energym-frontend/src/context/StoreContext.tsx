import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { isAxiosError } from 'axios';

export interface StoreProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  sizes: string[];
  color: string;
  photoUrl?: string;
  isActive: boolean;
}

export interface CartEntry {
  product: StoreProduct;
  size: string;
  quantity: number;
}

interface StoreContextValue {
  products: StoreProduct[];
  cart: CartEntry[];
  wishlist: StoreProduct[];
  cartCount: number;
  cartTotal: number;
  loadingProducts: boolean;
  refreshProducts: (includeAll?: boolean) => Promise<void>;
  refreshUserStoreData: () => Promise<void>;
  addToCart: (productId: string, size?: string, quantity?: number) => Promise<{ ok: boolean; message: string }>;
  updateCartQuantity: (productId: string, size: string, quantity: number) => Promise<{ ok: boolean; message?: string }>;
  removeCartItem: (productId: string, size?: string) => Promise<void>;
  toggleWishlistItem: (productId: string) => Promise<{ ok: boolean; message: string }>;
  isInWishlist: (productId: string) => boolean;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [wishlist, setWishlist] = useState<StoreProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const refreshProducts = useCallback(async (includeAll = false) => {
    setLoadingProducts(true);
    try {
      const res = await api.get(`/store/products${includeAll ? '?all=true' : ''}`);
      if (res.data.ok && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error('Error al cargar productos de la tienda:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const refreshUserStoreData = useCallback(async () => {
    if (!isAuthenticated) {
      setCart([]);
      setWishlist([]);
      return;
    }
    try {
      const res = await api.get('/store/user-data');
      if (res.data.ok && res.data.data) {
        setCart(Array.isArray(res.data.data.cart) ? res.data.data.cart : []);
        setWishlist(Array.isArray(res.data.data.wishlist) ? res.data.data.wishlist : []);
      }
    } catch (error) {
      console.error('Error al sincronizar carrito y lista de deseos:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
        try {
        const res = await api.get('/store/products');
        if (active && res.data.ok && Array.isArray(res.data.data)) {
            setProducts(res.data.data);
        }
        } catch (error) {
        console.error('Error al cargar productos de la tienda:', error);
        } finally {
        if (active) setLoadingProducts(false);
        }
    };
    void loadCatalog();
    return () => {
        active = false;
    };
    }, []);

    useEffect(() => {
    let active = true;
    const syncUserStore = async () => {
        if (!isAuthenticated) {
        if (active) {
            setCart([]);
            setWishlist([]);
        }
        return;
        }
        try {
        const res = await api.get('/store/user-data');
        if (active && res.data.ok && res.data.data) {
            setCart(Array.isArray(res.data.data.cart) ? res.data.data.cart : []);
            setWishlist(Array.isArray(res.data.data.wishlist) ? res.data.data.wishlist : []);
        }
        } catch (error) {
        console.error('Error al sincronizar carrito y lista de deseos:', error);
        }
    };
    void syncUserStore();
    return () => {
        active = false;
    };
    }, [isAuthenticated]);

  const addToCart = async (productId: string, size?: string, quantity = 1) => {
    try {
      const res = await api.post('/store/cart', { productId, size, quantity });
      if (res.data.ok) {
        setCart(Array.isArray(res.data.data) ? res.data.data : []);
        return { ok: true, message: res.data.message || 'Añadido al carrito.' };
      }
      return { ok: false, message: res.data.message || 'No se pudo añadir al carrito.' };
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Error al añadir al carrito.'
        : 'Error de conexión.';
      return { ok: false, message: msg };
    }
  };

  const updateCartQuantity = async (productId: string, size: string, quantity: number) => {
    try {
      const res = await api.patch('/store/cart', { productId, size, quantity });
      if (res.data.ok) {
        setCart(Array.isArray(res.data.data) ? res.data.data : []);
        return { ok: true };
      }
      return { ok: false, message: res.data.message };
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'No se pudo actualizar la cantidad.'
        : 'Error al actualizar carrito.';
      return { ok: false, message: msg };
    }
  };

  const removeCartItem = async (productId: string, size?: string) => {
    try {
      const query = size ? `?size=${encodeURIComponent(size)}` : '';
      const res = await api.delete(`/store/cart/${productId}${query}`);
      if (res.data.ok) {
        setCart(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (error) {
      console.error('Error al quitar del carrito:', error);
    }
  };

  const toggleWishlistItem = async (productId: string) => {
    try {
      const res = await api.post('/store/wishlist/toggle', { productId });
      if (res.data.ok) {
        setWishlist(Array.isArray(res.data.data) ? res.data.data : []);
        return { ok: true, message: res.data.message || 'Lista de deseos actualizada.' };
      }
      return { ok: false, message: res.data.message || 'No se pudo actualizar.' };
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Error en lista de deseos.'
        : 'Error de conexión.';
      return { ok: false, message: msg };
    }
  };

  const isInWishlist = (productId: string) =>
    wishlist.some((item) => String(item._id) === String(productId));

  const cartCount = cart.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const cartTotal = cart.reduce(
    (acc, item) => acc + Number(item.product?.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        wishlist,
        cartCount,
        cartTotal,
        loadingProducts,
        refreshProducts,
        refreshUserStoreData,
        addToCart,
        updateCartQuantity,
        removeCartItem,
        toggleWishlistItem,
        isInWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider');
  return ctx;
}