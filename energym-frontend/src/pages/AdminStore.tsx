import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { isAxiosError } from 'axios';
import type { StoreProduct } from '../context/StoreContext';
import {
  Plus,
  Trash2,
  Edit3,
  DollarSign,
  ShoppingBag,
  Award,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface StoreAdminStats {
  storeRevenue: number;
  totalOrders: number;
  approvedOrders: number;
  pendingOrders: number;
  bestSeller: { name: string; unitsSold: number; revenue: number } | null;
}

interface AdminOrderItem {
  _id: string;
  user?: { name?: string; email?: string; phone?: string };
  items: {
    nameSnapshot: string;
    colorSnapshot: string;
    sizeSnapshot: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  paymentMethod: 'PayPal' | 'Pago Móvil' | 'Transferencia';
  paymentReceived: boolean;
  paymentReference?: string;
  receiptUrl?: string;
  paypalTransactionId?: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Cancelado';
  adminNotes?: string;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AdminStore() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [stats, setStats] = useState<StoreAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Formulario de producto (crear / editar)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Ropa Deportiva');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [sizesText, setSizesText] = useState('S, M, L, XL');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes, statRes] = await Promise.all([
        api.get('/store/products?all=true'),
        api.get('/store/admin/orders'),
        api.get('/store/admin/stats'),
      ]);
      if (prodRes.data.ok) setProducts(prodRes.data.data || []);
      if (ordRes.data.ok) setOrders(ordRes.data.data || []);
      if (statRes.data.ok) setStats(statRes.data.data || null);
    } catch (error) {
      console.error('Error al cargar administración de tienda:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Administración Tienda Fit | ENERGYM';
    loadAll();
  }, [loadAll]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setCategory('Ropa Deportiva');
    setColor('');
    setPrice('');
    setStock('1');
    setSizesText('S, M, L, XL');
    setPhotoFile(null);
  };

  const handleEditClick = (p: StoreProduct) => {
    setEditingId(p._id);
    setName(p.name);
    setDescription(p.description);
    setCategory(p.category);
    setColor(p.color);
    setPrice(String(p.price));
    setStock(String(p.stock));
    setSizesText((p.sizes || ['Única']).join(', '));
    setPhotoFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSavingProduct(true);

    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description.trim());
      fd.append('category', category.trim());
      fd.append('color', color.trim());
      fd.append('price', price);
      fd.append('stock', stock);
      fd.append('sizes', sizesText);
      if (photoFile) {
        fd.append('photo', photoFile);
      }

      if (editingId) {
        const res = await api.put(`/store/products/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFeedback(res.data.message || 'Producto actualizado.');
      } else {
        const res = await api.post('/store/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFeedback(res.data.message || 'Producto creado.');
      }

      resetForm();
      await loadAll();
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Error al guardar producto.'
        : 'Error inesperado.';
      setFeedback(msg);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Eliminar este producto del catálogo?')) return;
    try {
      await api.delete(`/store/products/${id}`);
      setFeedback('Producto eliminado.');
      await loadAll();
    } catch {
      setFeedback('No se pudo eliminar el producto.');
    }
  };

  const handleOrderUpdate = async (
    orderId: string,
    payload: { status?: AdminOrderItem['status']; paymentReceived?: boolean }
  ) => {
    try {
      const res = await api.patch(`/store/admin/orders/${orderId}`, payload);
      setFeedback(res.data.message || 'Pedido actualizado.');
      await loadAll();
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'No se pudo actualizar el pedido.'
        : 'Error al actualizar pedido.';
      setFeedback(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 py-10 space-y-10 grow">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold fuenteStar text-verde">
              Gestión de Tienda Fit y Pedidos
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Controla stock, tallas/colores por artículo, verificación de pagos y preparación de pedidos.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAll}
            className="inline-flex items-center gap-2 bg-verde/15 hover:bg-verde/25 text-verde border border-verde/50 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {feedback && (
          <div className="bg-verde/15 border border-verde text-verde rounded-2xl p-4 text-xs sm:text-sm font-bold">
            {feedback}
          </div>
        )}

        {/* Métricas de tienda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-black/55 border border-verde/35 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Ingresos Aprobados Tienda</span>
              <DollarSign className="w-4 h-4 text-verde" />
            </div>
            <p className="text-3xl font-extrabold text-white">
              ${(stats?.storeRevenue ?? 0).toFixed(2)}
            </p>
            <span className="text-xs text-verde">Órdenes aprobadas</span>
          </div>

          <div className="bg-black/55 border border-verde/35 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Pedidos Realizados</span>
              <ShoppingBag className="w-4 h-4 text-verde" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stats?.totalOrders ?? 0}</p>
            <span className="text-xs text-gray-400">
              {stats?.approvedOrders ?? 0} aprobados • {stats?.pendingOrders ?? 0} pendientes
            </span>
          </div>

          <div className="bg-black/55 border border-verde/35 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Producto Más Vendido</span>
              <Award className="w-4 h-4 text-verde" />
            </div>
            <p className="text-lg font-extrabold text-verde truncate">
              {stats?.bestSeller?.name || 'Sin ventas aprobadas aún'}
            </p>
            <span className="text-xs text-gray-400">
              {stats?.bestSeller ? `${stats.bestSeller.unitsSold} und. vendidas` : '—'}
            </span>
          </div>
        </div>

        {/* Formulario CRUD Producto */}
        <form
          onSubmit={handleProductSubmit}
          className="bg-black/60 border border-verde/40 rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold fuenteStar text-white">
              {editingId ? 'Editar Producto / Stock' : 'Nuevo Producto en Catálogo'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre (ej. Suéter Oversize)"
              className="bg-gris border border-gray-700 focus:border-verde rounded-xl px-3.5 py-2.5 text-white"
            />
            <input
              type="text"
              required
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Color (ej. Negro — 1 artículo por color)"
              className="bg-gris border border-gray-700 focus:border-verde rounded-xl px-3.5 py-2.5 text-white"
            />
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Categoría (Ropa Deportiva, Suplementos...)"
              className="bg-gris border border-gray-700 focus:border-verde rounded-xl px-3.5 py-2.5 text-white"
            />
            <input
              type="text"
              value={sizesText}
              onChange={(e) => setSizesText(e.target.value)}
              placeholder="Tallas (ej. S, M, L, XL o Única)"
              className="bg-gris border border-gray-700 focus:border-verde rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Precio USD (ej. 25.00)"
              className="bg-gris border border-gray-700 focus:border-verde rounded-xl px-3.5 py-2.5 text-white"
            />
            <input
              type="number"
              min="0"
              step="1"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Stock disponible (ej. 5)"
              className="bg-gris border border-gray-700 focus:border-verde rounded-xl px-3.5 py-2.5 text-white"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-verde/15 file:text-verde file:font-bold cursor-pointer"
            />
          </div>

          <textarea
            rows={2}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción del producto..."
            className="w-full bg-gris border border-gray-700 focus:border-verde rounded-xl px-3.5 py-2.5 text-xs text-white"
          />

          <button
            type="submit"
            disabled={savingProduct}
            className="inline-flex items-center gap-2 bg-verde hover:bg-verde/85 text-black font-extrabold px-6 py-2.5 rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {savingProduct
                ? 'Guardando...'
                : editingId
                ? 'Guardar Cambios'
                : 'Agregar Producto'}
            </span>
          </button>
        </form>

        {/* Inventario actual */}
        <section className="bg-black/55 border border-gray-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-bold fuenteStar text-verde">
            Inventario y Catálogo ({products.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase">
                  <th className="py-3 px-3">Producto</th>
                  <th className="py-3 px-3">Categoría / Color</th>
                  <th className="py-3 px-3">Tallas</th>
                  <th className="py-3 px-3">Precio USD</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {products.map((p) => (
                  <tr key={p._id}>
                    <td className="py-3 px-3 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-3 text-gray-300">
                      {p.category} • <span className="text-verde font-bold">{p.color}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-300">{(p.sizes || []).join(', ')}</td>
                    <td className="py-3 px-3 font-bold text-verde">${p.price.toFixed(2)}</td>
                    <td className="py-3 px-3 font-extrabold">{p.stock}</td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(p)}
                        className="p-2 rounded-lg bg-verde/15 text-verde hover:bg-verde hover:text-black transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p._id)}
                        className="p-2 rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pedidos y Verificación de Pagos */}
        <section className="bg-black/55 border border-verde/30 rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-bold fuenteStar text-white">
            Pedidos y <span className="text-verde">Verificación de Pagos</span> ({orders.length})
          </h2>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord._id}
                className="bg-gris/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-white">
                      {ord.user?.name || 'Cliente'} ({ord.user?.email || '—'})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-black/70 border border-verde/40 text-verde">
                      Estado: {ord.status}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold border ${
                        ord.paymentReceived
                          ? 'bg-verde/15 text-verde border-verde/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {ord.paymentReceived ? 'Pago Recibido' : 'Pago Pendiente Verificar'}
                    </span>
                  </div>

                  <p className="text-gray-300">
                    Método: <strong>{ord.paymentMethod}</strong> • Total:{' '}
                    <strong className="text-verde">${ord.totalAmount.toFixed(2)} USD</strong>
                    {ord.paymentReference ? ` • Ref: ${ord.paymentReference}` : ''}
                    {ord.paypalTransactionId ? ` • PayPal: ${ord.paypalTransactionId}` : ''}
                  </p>

                  {ord.receiptUrl && (
                    <a
                      href={`${API_BASE}${ord.receiptUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-verde underline font-semibold"
                    >
                      Ver comprobante adjunto
                    </a>
                  )}

                  <ul className="text-gray-400 list-disc list-inside pt-1">
                    {ord.items.map((it, i) => (
                      <li key={i}>
                        {it.nameSnapshot} ({it.colorSnapshot} • Talla {it.sizeSnapshot}) x
                        {it.quantity} — ${(it.unitPrice * it.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!ord.paymentReceived && (
                    <button
                      type="button"
                      onClick={() => handleOrderUpdate(ord._id, { paymentReceived: true })}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-verde/20 hover:bg-verde text-verde hover:text-black border border-verde/50 font-bold transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar Pago Recibido</span>
                    </button>
                  )}

                  <select
                    value={ord.status}
                    onChange={(e) =>
                      handleOrderUpdate(ord._id, {
                        status: e.target.value as AdminOrderItem['status'],
                      })
                    }
                    className="bg-black border border-gray-700 focus:border-verde rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    <option value="Pendiente">Pendiente (Preparando)</option>
                    <option value="Aprobado">Aprobado (Listo para retirar)</option>
                    <option value="Rechazado">Rechazado (Devuelve stock)</option>
                    <option value="Cancelado">Cancelado (Devuelve stock)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}