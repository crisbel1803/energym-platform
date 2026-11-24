import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useStore } from '../context/StoreContext';
import api from '../services/api';
import { isAxiosError } from 'axios';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Building,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

export default function CartCheckout() {
  const {
    cart,
    cartTotal,
    updateCartQuantity,
    removeCartItem,
    refreshUserStoreData,
    refreshProducts,
  } = useStore();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'Pago Móvil' | 'Transferencia' | 'PayPal'>(
    'Pago Móvil'
  );
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const paypalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = 'Carrito y Pago | Tienda Fit ENERGYM';
  }, []);

  // Cargar SDK oficial de PayPal cuando se selecciona PayPal y hay artículos en el carrito
  useEffect(() => {
    if (paymentMethod !== 'PayPal' || cart.length === 0) {
      return;
    }

    if (!PAYPAL_CLIENT_ID) {
      setSdkError('Falta configurar VITE_PAYPAL_CLIENT_ID en el entorno del frontend.');
      setSdkReady(false);
      return;
    }

    setSdkError(null);

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-energym-paypal-sdk="true"]'
    );

    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    if (existingScript) {
      const onLoad = () => setSdkReady(true);
      const onErr = () => setSdkError('No se pudo cargar el SDK de PayPal.');
      existingScript.addEventListener('load', onLoad);
      existingScript.addEventListener('error', onErr);
      return () => {
        existingScript.removeEventListener('load', onLoad);
        existingScript.removeEventListener('error', onErr);
      };
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      PAYPAL_CLIENT_ID
    )}&currency=USD&intent=capture`;
    script.async = true;
    script.dataset.energymPaypalSdk = 'true';
    script.onload = () => setSdkReady(true);
    script.onerror = () => setSdkError('No se pudo cargar el SDK de PayPal.');
    document.body.appendChild(script);
  }, [paymentMethod, cart.length]);

 // Renderizar botones oficiales de PayPal (cuenta PayPal + tarjeta)
  useEffect(() => {
    const paypalButtons = window.paypal?.Buttons;

    if (
      paymentMethod !== 'PayPal' ||
      !sdkReady ||
      !paypalButtons ||
      !paypalContainerRef.current ||
      cart.length === 0
    ) {
      return;
    }

    const container = paypalContainerRef.current;
    container.innerHTML = '';

    let buttonsInstance: ReturnType<typeof paypalButtons> | null = null;
    let cancelled = false;

    try {
      buttonsInstance = paypalButtons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
        },
        createOrder: async () => {
          setMessage(null);
          setSubmitting(true);
          try {
            const res = await api.post('/store/orders/paypal/create');
            if (!res.data?.ok || !res.data?.id) {
              throw new Error(res.data?.message || 'No se pudo iniciar la orden en PayPal.');
            }
            return String(res.data.id);
          } catch (err) {
            const msg = isAxiosError(err)
              ? err.response?.data?.message || 'No se pudo iniciar el pago en PayPal.'
              : err instanceof Error
              ? err.message
              : 'Error al iniciar PayPal.';
            setMessage({ type: 'error', text: msg });
            throw err;
          } finally {
            setSubmitting(false);
          }
        },
        onApprove: async (data) => {
          setMessage(null);
          setSubmitting(true);
          try {
            const res = await api.post('/store/orders/paypal/capture', {
              paypalOrderId: data.orderID,
            });
            if (res.data?.ok) {
              await Promise.all([refreshUserStoreData(), refreshProducts(false)]);
              setMessage({
                type: 'success',
                text:
                  res.data.message ||
                  '¡Pago con PayPal recibido! Tu pedido está Pendiente de preparación.',
              });
            } else {
              setMessage({
                type: 'error',
                text: res.data?.message || 'No se pudo completar la captura del pago.',
              });
            }
          } catch (err) {
            const msg = isAxiosError(err)
              ? err.response?.data?.message || 'Error al confirmar el pago en PayPal.'
              : 'Error inesperado al capturar el pago.';
            setMessage({ type: 'error', text: msg });
          } finally {
            setSubmitting(false);
          }
        },
        onCancel: () => {
          setSubmitting(false);
          setMessage({
            type: 'error',
            text: 'Cancelaste el proceso de pago en PayPal.',
          });
        },
        onError: (err) => {
          console.error('Error en widget de PayPal:', err);
          setSubmitting(false);
          setMessage({
            type: 'error',
            text: 'Ocurrió un error con PayPal. Verifica tu conexión o intenta de nuevo.',
          });
        },
      });

      if (!cancelled) {
        void buttonsInstance.render(container);
      }
    } catch (err) {
      console.error('Error al inicializar PayPal Buttons:', err);
      setSdkError('No se pudieron mostrar los botones de PayPal.');
    }

    return () => {
      cancelled = true;
      if (buttonsInstance?.close) {
        void buttonsInstance.close().catch(() => {});
      }
      container.innerHTML = '';
    };
  }, [paymentMethod, sdkReady, cart.length, cartTotal, refreshUserStoreData, refreshProducts]);

  const handleManualCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentReference', paymentReference.trim());
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await api.post('/store/orders/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.ok) {
        setPaymentReference('');
        setReceiptFile(null);
        await Promise.all([refreshUserStoreData(), refreshProducts(false)]);
        setMessage({
          type: 'success',
          text: res.data.message || 'Pedido creado en estado Pendiente.',
        });
      }
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Error al procesar el pago.'
        : 'Error inesperado.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-10 sm:py-14 grow">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold fuenteStar text-verde">
              Mi Carrito y Pago
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Revisa tus artículos, ajusta cantidades y completa tu compra en USD.
            </p>
          </div>

          <Link
            to="/tienda"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-verde hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Seguir comprando
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-between gap-3 ${
              message.type === 'success'
                ? 'bg-verde/15 border-verde text-verde'
                : 'bg-red-500/15 border-red-500 text-red-300'
            }`}
          >
            <span className="flex items-center gap-2">
              {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {message.text}
            </span>
            {message.type === 'success' && (
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="px-3.5 py-1.5 rounded-xl bg-verde text-black font-extrabold text-xs cursor-pointer"
              >
                Ver mis pedidos en Perfil
              </button>
            )}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-black/50 border border-gray-800 rounded-3xl p-12 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-verde/50 mx-auto" />
            <p className="text-lg font-bold text-gray-200">Tu carrito está vacío.</p>
            <p className="text-xs text-gray-400">
              Explora la Tienda Fit para agregar ropa deportiva, suplementos o accesorios.
            </p>
            <Link
              to="/tienda"
              className="inline-block bg-verde hover:bg-verde/85 text-black font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition"
            >
              Ir a la Tienda Fit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Ítems del carrito */}
            <div className="lg:col-span-7 space-y-4">
              {cart.map((item) => {
                const prod = item.product;
                const subtotal = Number(prod.price) * Number(item.quantity);
                return (
                  <div
                    key={`${prod._id}-${item.size}`}
                    className="bg-black/60 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {prod.photoUrl ? (
                        <img
                          src={`${API_BASE}${prod.photoUrl}`}
                          alt={prod.name}
                          className="w-20 h-20 rounded-xl object-cover border border-gray-800 shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gris flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-7 h-7 text-verde/40" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <h2 className="font-bold text-base sm:text-lg text-white fuenteStar">
                          {prod.name}
                        </h2>
                        <p className="text-xs text-gray-300">
                          Color: <strong className="text-verde">{prod.color}</strong> • Talla:{' '}
                          <strong className="text-white">{item.size}</strong>
                        </p>
                        <p className="text-xs text-gray-400">
                          Precio unitario: ${Number(prod.price).toFixed(2)} USD (Stock: {prod.stock})
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                      <span className="text-lg font-extrabold text-verde">
                        ${subtotal.toFixed(2)} USD
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() => updateCartQuantity(prod._id, item.size, item.quantity - 1)}
                          className="p-1.5 rounded-lg bg-gris border border-gray-700 hover:border-verde disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-sm font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={item.quantity >= prod.stock}
                          onClick={() => updateCartQuantity(prod._id, item.size, item.quantity + 1)}
                          className="p-1.5 rounded-lg bg-gris border border-gray-700 hover:border-verde disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCartItem(prod._id, item.size)}
                          className="p-1.5 rounded-lg bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/40 transition cursor-pointer ml-1"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen y Métodos de Pago */}
            <div className="lg:col-span-5 bg-black/65 border border-verde/40 rounded-3xl p-6 space-y-5 shadow-2xl">
              <h2 className="text-xl font-bold fuenteStar text-white border-b border-gray-800 pb-3">
                Resumen y <span className="text-verde">Método de Pago</span>
              </h2>

              <div className="flex items-center justify-between text-base sm:text-lg font-extrabold">
                <span className="text-gray-300">Monto Total:</span>
                <span className="text-2xl text-verde">${cartTotal.toFixed(2)} USD</span>
              </div>

              {/* Selector de método */}
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Pago Móvil');
                    setMessage(null);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'Pago Móvil'
                      ? 'bg-verde text-black border-verde'
                      : 'bg-gris text-gray-200 border-gray-700 hover:border-verde'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Pago Móvil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Transferencia');
                    setMessage(null);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'Transferencia'
                      ? 'bg-verde text-black border-verde'
                      : 'bg-gris text-gray-200 border-gray-700 hover:border-verde'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Transferencia</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('PayPal');
                    setMessage(null);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'PayPal'
                      ? 'bg-verde text-black border-verde'
                      : 'bg-gris text-gray-200 border-gray-700 hover:border-verde'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>PayPal</span>
                </button>
              </div>

              {paymentMethod !== 'PayPal' ? (
                <form onSubmit={handleManualCheckout} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                      Número de Referencia
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Ej. 00984512"
                      className="w-full bg-gris border border-gray-700 focus:border-verde rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-gray-300 mb-1.5">
                      <Upload className="w-3.5 h-3.5 text-verde" />
                      <span>Captura de Comprobante (opcional si hay referencia)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-verde/15 file:text-verde file:font-bold hover:file:bg-verde/25 cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-verde hover:bg-verde/85 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
                  >
                    {submitting ? 'Procesando pedido...' : `Pagar $${cartTotal.toFixed(2)} USD`}
                  </button>
                </form>
              ) : (
                <div className="space-y-3 bg-gris/70 border border-gray-800 rounded-2xl p-4 text-xs">
                  <p className="text-gray-300 leading-relaxed">
                    El pago por <strong className="text-verde">PayPal</strong> se marca como recibido
                    automáticamente y el pedido queda en estado{' '}
                    <strong className="text-amber-300">Pendiente</strong> para preparación y retiro.
                  </p>

                  {submitting && (
                    <div className="flex items-center justify-center gap-2 text-verde font-semibold py-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando pago con PayPal...</span>
                    </div>
                  )}

                  {sdkError ? (
                    <p className="text-red-400 font-semibold">{sdkError}</p>
                  ) : !sdkReady ? (
                    <div className="flex items-center justify-center gap-2 text-gray-400 py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-verde" />
                      <span>Cargando opciones de PayPal...</span>
                    </div>
                  ) : (
                    <div ref={paypalContainerRef} className="min-h-[110px] pt-1" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}