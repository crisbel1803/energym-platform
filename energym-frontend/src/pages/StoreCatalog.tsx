import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useStore, type StoreProduct } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ShoppingCart,
  Heart,
  Sparkles,
  Package,
  Check,
  Lock,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function StoreCatalog() {
  const { products, loadingProducts, addToCart, toggleWishlistItem, isInWishlist, cartCount } =
    useStore();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Tienda Fit | Suplementos, Ropa Deportiva y Accesorios ENERGYM';
  }, []);

  const categories = useMemo(() => {
    const base = ['Ropa Deportiva', 'Suplementos', 'Accesorios', 'Hidratación'];
    const dynamic = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...base, ...dynamic]));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'todas' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchTerm, selectedCategory]);

  const requireAuthPrompt = (actionLabel: string) => {
    setFeedback({
      type: 'info',
      text: `Inicia sesión o regístrate para ${actionLabel}, guardar tu lista de deseos y comprar en la Tienda Fit.`,
    });
  };

  const handleAdd = async (prod: StoreProduct) => {
    if (!isAuthenticated) {
      requireAuthPrompt('añadir productos al carrito');
      return;
    }
    if (prod.stock <= 0) return;

    const chosenSize = selectedSizes[prod._id] || prod.sizes?.[0] || 'Única';
    const qty = Math.min(Math.max(1, selectedQuantities[prod._id] || 1), prod.stock);

    setBusyId(prod._id);
    const res = await addToCart(prod._id, chosenSize, qty);
    setBusyId(null);
    setFeedback({ type: res.ok ? 'success' : 'error', text: res.message });
  };

  const handleWishlist = async (prod: StoreProduct) => {
    if (!isAuthenticated) {
      requireAuthPrompt('guardar en tu lista de deseos');
      return;
    }
    setBusyId(prod._id);
    const res = await toggleWishlistItem(prod._id);
    setBusyId(null);
    setFeedback({ type: res.ok ? 'success' : 'error', text: res.message });
  };

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt overflow-x-clip">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 py-10 sm:py-14 grow">
        {/* Encabezado */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-gray-800 pb-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest bg-verde/10 text-verde border border-verde/35 px-3.5 py-1 rounded-full font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Tienda Fit ENERGYM
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold fuenteStar text-white">
              Equípate con <span className="text-verde">Energía</span>
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm max-w-2xl">
              Ropa deportiva por color y talla, suplementos y accesorios de entrenamiento. Precios en USD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/tienda"
                className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-black/60 hover:bg-verde/15 text-verde border border-verde/50 transition"
              >
                Gestionar Catálogo y Pedidos
              </Link>
            )}

            <button
              type="button"
              onClick={() => (isAuthenticated ? navigate('/carrito') : requireAuthPrompt('ver tu carrito'))}
              className="group inline-flex items-center gap-2 bg-verde hover:bg-verde/90 text-black font-extrabold px-5 py-2.5 rounded-2xl text-xs sm:text-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-lg shadow-verde/20"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Ver Carrito ({cartCount})</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </header>

        {/* Aviso si no está logueado o feedback de acción */}
        {!isAuthenticated && (
          <div className="mb-6 bg-black/60 border border-verde/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-gray-200">
              <Lock className="w-4 h-4 text-verde shrink-0" />
              <span>
                Estás navegando como invitado. Para añadir al carrito, guardar favoritos o comprar,{' '}
                <strong className="text-verde">inicia sesión en tu cuenta</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-xl bg-verde text-black font-bold hover:bg-verde/85 transition"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-xl border border-verde/60 text-white hover:border-verde font-bold transition"
              >
                Registrarse
              </Link>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 ${
              feedback.type === 'success'
                ? 'bg-verde/15 border-verde text-verde'
                : feedback.type === 'error'
                ? 'bg-red-500/15 border-red-500 text-red-300'
                : 'bg-amber-500/15 border-amber-500/50 text-amber-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Filtros */}
        <section className="bg-black/60 border border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, color, categoría..."
                className="w-full bg-gris border border-gray-700 focus:border-verde rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-verde shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gris border border-gray-700 focus:border-verde rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none transition cursor-pointer"
              >
                <option value="todas">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800/80">
            <button
              type="button"
              onClick={() => setSelectedCategory('todas')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                selectedCategory === 'todas'
                  ? 'bg-verde text-black'
                  : 'bg-gris text-gray-300 border border-gray-700 hover:border-verde'
              }`}
            >
              Todos ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-verde text-black'
                    : 'bg-gris text-gray-300 border border-gray-700 hover:border-verde'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Catálogo */}
      {loadingProducts ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando productos...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-black/40 border border-gray-800 rounded-3xl p-12 text-center text-gray-400 text-sm">
          No hay productos disponibles con esos filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {filteredProducts.map((prod) => {
            const wished = isInWishlist(prod._id);
            const outOfStock = prod.stock <= 0;
            const chosenSize = selectedSizes[prod._id] || prod.sizes?.[0] || 'Única';
            const chosenQty = Math.min(
              Math.max(1, selectedQuantities[prod._id] || 1),
              Math.max(1, prod.stock)
            );
            const busy = busyId === prod._id;

            return (
              <article
                key={prod._id}
                className="group bg-black/70 border border-gray-800 hover:border-verde rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
              >
                <div>
                  {/* Imagen compacta */}
                  <div className="relative h-36 bg-gray-900 overflow-hidden">
                    {prod.photoUrl ? (
                      <img
                        src={`${API_BASE}${prod.photoUrl}`}
                        alt={`${prod.name} color ${prod.color}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-9 h-9 text-verde/40" />
                      </div>
                    )}

                    <span className="absolute top-2 left-2 bg-black/85 text-verde border border-verde/40 text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight max-w-[72%] truncate">
                      {prod.category}
                    </span>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleWishlist(prod)}
                      aria-label={wished ? 'Quitar de lista de deseos' : 'Guardar en lista de deseos'}
                      className={`absolute top-2 right-2 p-1.5 rounded-full border backdrop-blur-sm transition cursor-pointer ${
                        wished
                          ? 'bg-verde text-black border-verde'
                          : 'bg-black/80 text-white border-gray-700 hover:border-verde hover:text-verde'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${wished ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Contenido delgado y organizado */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <h2
                        title={prod.name}
                        className="text-sm font-bold text-white fuenteStar leading-snug line-clamp-2"
                      >
                        {prod.name}
                      </h2>
                      <span className="text-sm font-extrabold text-verde shrink-0">
                        ${prod.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span
                        title={prod.color}
                        className="px-2 py-0.5 rounded-full bg-gris border border-gray-700/90 text-gray-200 font-semibold truncate max-w-[62%]"
                      >
                        {prod.color}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                          outOfStock
                            ? 'bg-red-500/15 text-red-400 border-red-500/40'
                            : 'bg-verde/10 text-verde border-verde/30'
                        }`}
                      >
                        {outOfStock ? 'Agotado' : `Disp: ${prod.stock}`}
                      </span>
                    </div>

                    <p
                      title={prod.description}
                      className="text-[11px] text-gray-300 leading-snug line-clamp-2 min-h-[2.1rem]"
                    >
                      {prod.description}
                    </p>

                    {!outOfStock && (
                      <div className="pt-1 grid grid-cols-2 gap-1.5 text-[10px]">
                        <div>
                          <label className="block text-gray-400 font-bold uppercase mb-0.5">
                            Talla
                          </label>
                          <select
                            value={chosenSize}
                            onChange={(e) =>
                              setSelectedSizes((prev) => ({ ...prev, [prod._id]: e.target.value }))
                            }
                            className="w-full bg-gris border border-gray-700 focus:border-verde rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                          >
                            {(prod.sizes && prod.sizes.length > 0 ? prod.sizes : ['Única']).map(
                              (sz) => (
                                <option key={sz} value={sz}>
                                  {sz}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-400 font-bold uppercase mb-0.5">
                            Cant.
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={prod.stock}
                            value={chosenQty}
                            onChange={(e) => {
                              const val = Math.min(
                                prod.stock,
                                Math.max(1, Number(e.target.value) || 1)
                              );
                              setSelectedQuantities((prev) => ({ ...prev, [prod._id]: val }));
                            }}
                            className="w-full bg-gris border border-gray-700 focus:border-verde rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de acción compacto */}
                <div className="px-3 pb-3 pt-1">
                  <button
                    type="button"
                    disabled={outOfStock || busy}
                    onClick={() => handleAdd(prod)}
                    className="w-full py-2 px-3 rounded-xl font-bold text-[11px] uppercase tracking-wide bg-verde hover:bg-verde/85 text-black transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {outOfStock ? (
                      <span>Sin stock</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{busy ? 'Añadiendo...' : 'Añadir'}</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </main>

      <Footer />
    </div>
  );
}