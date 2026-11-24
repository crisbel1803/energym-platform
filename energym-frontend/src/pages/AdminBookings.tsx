import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { Check, X, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface AdminBookingItem {
  _id: string;
  status: 'Pendiente' | 'Aprobado' | 'Cancelado' | 'Rechazado';
  paymentMethod: 'PayPal' | 'Transferencia' | 'Pago Móvil';
  paymentReference?: string;
  paymentReceiptUrl?: string;
  paypalTransactionId?: string;
  adminMessage?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  gymClass?: {
    title: string;
    cost: number;
    startTime: string;
    room?: string;
  };
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAllBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings/admin/all');
      if (res.data.ok) {
        setBookings(res.data.data);
      }
    } catch (error) {
      console.error('Error al cargar reservas del administrador:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  const handleStatusChange = async (id: string, status: 'Aprobado' | 'Rechazado') => {
    const adminMessage =
      status === 'Rechazado'
        ? window.prompt('Motivo del rechazo (opcional):') || 'Comprobante no verificado'
        : undefined;

    setUpdatingId(id);
    try {
      const res = await api.patch(`/bookings/${id}/status`, {
        status,
        adminMessage,
      });
      if (res.data.ok) {
        await fetchAllBookings();
      }
    } catch (err) {
      if (isAxiosError(err)) {
        alert(err.response?.data?.message || 'Error al actualizar estado');
      } else {
        alert('Error al actualizar el estado de la reserva');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleBookings =
    filterStatus === 'todos' ? bookings : bookings.filter((b) => b.status === filterStatus);

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-10 grow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-black/40 p-6 rounded-3xl border border-gray-800">
          <h1 className="text-3xl font-bold fuenteStar text-verde">
            Gestión de Reservas y Pagos
          </h1>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gris border border-verde rounded-2xl py-2 px-4 text-sm text-white cursor-pointer"
          >
            <option value="todos">Todas las reservas ({bookings.length})</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Aprobado">Aprobadas</option>
            <option value="Rechazado">Rechazadas</option>
            <option value="Cancelado">Canceladas</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-verde" />
            <span>Cargando reservas y pagos...</span>
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="bg-black/40 border border-gray-800 rounded-3xl p-8 text-center text-gray-400 text-sm">
            No hay reservas para mostrar en este filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleBookings.map((b) => (
              <div
                key={b._id}
                className="bg-black/50 border border-gray-800 hover:border-verde/40 rounded-3xl p-6 flex flex-col lg:flex-row justify-between gap-6 transition"
              >
                <div className="space-y-1.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-verde fuenteStar">
                      {b.gymClass?.title || 'Clase Energym'}
                    </h3>
                    <span className="text-xs px-3 py-0.5 rounded-full bg-white/10 text-gray-200 font-bold">
                      {b.status}
                    </span>
                  </div>

                  <p className="text-gray-300">
                    Usuario: <strong>{b.user?.name || 'Usuario'}</strong> ({b.user?.email})
                  </p>

                  <p className="text-gray-300">
                    Método: <strong className="text-verde">{b.paymentMethod}</strong>
                    {typeof b.gymClass?.cost === 'number' ? ` • $${b.gymClass.cost} USD` : ''}
                    {b.paymentReference ? ` • Ref: ${b.paymentReference}` : ''}
                    {b.paypalTransactionId ? ` • PayPal ID: ${b.paypalTransactionId}` : ''}
                  </p>

                  {b.gymClass?.startTime && (
                    <p className="text-xs text-gray-400">
                      Fecha de clase: {new Date(b.gymClass.startTime).toLocaleString()}
                      {b.gymClass.room ? ` • ${b.gymClass.room}` : ''}
                    </p>
                  )}

                  {b.paymentReceiptUrl && (
                    <a
                      href={`${API_BASE}${b.paymentReceiptUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-verde hover:underline pt-1"
                    >
                      Ver comprobante de pago <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {b.adminMessage && (
                    <p className="text-xs text-amber-300 pt-1">Nota: {b.adminMessage}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end lg:self-center">
                  {b.status === 'Pendiente' ? (
                    <>
                      <button
                        type="button"
                        disabled={updatingId === b._id}
                        onClick={() => handleStatusChange(b._id, 'Aprobado')}
                        className="bg-verde/20 hover:bg-verde/30 text-verde border border-verde/40 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === b._id}
                        onClick={() => handleStatusChange(b._id, 'Rechazado')}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Rechazar
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-white/5 border border-gray-700 px-3.5 py-2 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-verde" />
                      Estado finalizado ({b.status})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}