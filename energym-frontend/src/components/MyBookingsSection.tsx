import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Calendar, CreditCard, XCircle } from 'lucide-react';

interface BookingItem {
  _id: string;
  status: 'Pendiente' | 'Aprobado' | 'Cancelado' | 'Rechazado';
  paymentMethod: 'PayPal' | 'Transferencia' | 'Pago Móvil';
  paymentReference?: string;
  paypalTransactionId?: string;
  adminMessage?: string;
  gymClass?: {
    _id: string;
    title: string;
    startTime: string;
    room?: string;
    cost?: number;
  };
}

const STATUS_BADGE: Record<BookingItem['status'], string> = {
  Pendiente: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  Aprobado: 'bg-verde/15 text-verde border-verde/40',
  Rechazado: 'bg-red-500/15 text-red-400 border-red-500/40',
  Cancelado: 'bg-gray-700/40 text-gray-400 border-gray-600',
};

export default function MyBookingsSection() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.data.ok) {
        setBookings(res.data.data);
      }
    } catch (error) {
      console.error('Error al cargar historial de reservas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Deseas cancelar esta reserva? El cupo volverá a quedar disponible.')) {
      return;
    }
    try {
      const res = await api.patch(`/bookings/${id}/cancel`);
      if (res.data.ok) {
        fetchMyBookings();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'No se pudo cancelar la reserva');
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-400 py-4">Cargando historial de reservas...</p>;
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
        Aún no tienes reservas registradas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <div
          key={b._id}
          className="bg-black/50 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-lg text-white">
                {b.gymClass?.title || 'Clase Energym'}
              </h4>
              <span
                className={`text-xs px-3 py-0.5 rounded-full border font-bold ${STATUS_BADGE[b.status]}`}
              >
                {b.status}
              </span>
            </div>

            {b.gymClass?.startTime && (
              <p className="text-xs text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-verde" />
                {new Date(b.gymClass.startTime).toLocaleString()}
                {b.gymClass.room ? ` • ${b.gymClass.room}` : ''}
              </p>
            )}

            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-verde" />
              Método: <strong className="text-gray-200">{b.paymentMethod}</strong>
              {b.paymentReference ? ` • Ref: ${b.paymentReference}` : ''}
              {b.paypalTransactionId ? ` • ID: ${b.paypalTransactionId}` : ''}
            </p>

            {b.adminMessage && (
              <p className="text-xs text-amber-300 pt-1">Nota admin: {b.adminMessage}</p>
            )}
          </div>

          {(b.status === 'Pendiente' || b.status === 'Aprobado') && (
            <button
              type="button"
              onClick={() => handleCancel(b._id)}
              className="self-start md:self-center text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <XCircle className="w-4 h-4" /> Cancelar reserva
            </button>
          )}
        </div>
      ))}
    </div>
  );
}