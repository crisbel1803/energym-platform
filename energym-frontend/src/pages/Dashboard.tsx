import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore, type StoreProduct } from '../context/StoreContext';
import api from '../services/api';
import { isAxiosError } from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users,
  DollarSign,
  PlusCircle,
  Dumbbell,
  Edit3,
  Trash2,
  Loader2,
  Check,
  X,
  BellRing,
  RefreshCw,
  UserCheck,
  Building2,
  CalendarRange,
  BadgeDollarSign,
  Eye,
  ShoppingBag,
  Heart,
  PackageCheck,
  Award,
  ArrowUpRight,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface BookingItem {
  _id: string;
  status: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Cancelado';
  adminMessage?: string;
  classUpdateNotice?: string;
  paymentMethod: string;
  paymentReference?: string;
  paypalTransactionId?: string;
  createdAt: string;
  gymClass: {
    title: string;
    instructor: string;
    room: string;
    startTime: string;
    endTime: string;
    cost: number;
    description: string;
  };
}

interface DisciplineStat {
  label: string;
  total: number;
  approved: number;
}

interface AdminStatsData {
  totalUsers: number;
  totalActiveClasses: number;
  totalBookings: number;
  approvedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  rejectedBookings: number;
  totalRevenue: number;
  pendingRevenue: number;
  bookingsByMethod: {
    PayPal: number;
    'Pago Móvil': number;
    Transferencia: number;
  };
  bookingsByDiscipline: DisciplineStat[];
}

interface StoreAdminStatsData {
  storeRevenue: number;
  totalOrders: number;
  approvedOrders: number;
  pendingOrders: number;
  bestSeller: {
    name: string;
    unitsSold: number;
    revenue: number;
  } | null;
}

interface StoreOrderItem {
  _id: string;
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
  paypalTransactionId?: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Cancelado';
  adminNotes?: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, updateUser, logout } = useAuth();
  const { wishlist, toggleWishlistItem, refreshUserStoreData, refreshProducts } = useStore();
  const isAdmin = user?.role === 'ADMIN';

  // Estados de edición de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Estado para las reservas reales del usuario
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Estado para historial de compras de Tienda Fit del usuario
  const [myOrders, setMyOrders] = useState<StoreOrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Estado para métricas reales en tiempo real del Admin
  const [adminStats, setAdminStats] = useState<AdminStatsData | null>(null);
  const [storeStats, setStoreStats] = useState<StoreAdminStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
  }, [user]);

  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.data.ok) {
        setBookings(res.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar historial de reservas:', error);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await api.get('/store/orders/my-orders');
      if (res.data.ok && Array.isArray(res.data.data)) {
        setMyOrders(res.data.data);
      }
    } catch (error) {
      console.error('Error al cargar historial de compras:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchAdminStats = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoadingStats(true);
    try {
      const [statsRes, storeStatsRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/store/admin/stats').catch(() => null),
      ]);

      if (statsRes.data.ok && statsRes.data.data) {
        setAdminStats(statsRes.data.data);
        setLastUpdated(
          new Date(statsRes.data.updatedAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      }

      if (storeStatsRes?.data?.ok && storeStatsRes.data.data) {
        setStoreStats(storeStatsRes.data.data);
      }
    } catch (error) {
      console.error('Error al obtener métricas del panel:', error);
    } finally {
      if (showSpinner) setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      fetchMyBookings();
      fetchMyOrders();
    } else {
      setLoadingBookings(false);
      setLoadingOrders(false);
      fetchAdminStats(true);

      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchAdminStats(false);
        }
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchMyBookings, fetchMyOrders, fetchAdminStats]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('¿Deseas cancelar esta reserva? El cupo volverá a quedar disponible.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await api.patch(`/bookings/${bookingId}/cancel`);
      if (res.data.ok) {
        await fetchMyBookings();
      }
    } catch (err) {
      if (isAxiosError(err)) {
        alert(err.response?.data?.message || 'No se pudo cancelar la reserva.');
      } else {
        alert('Ocurrió un error al cancelar la reserva.');
      }
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('¿Deseas cancelar este pedido? Se devolverá el stock al inventario.')) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const res = await api.patch(`/store/orders/${orderId}/cancel`);
      if (res.data.ok) {
        await Promise.all([fetchMyOrders(), refreshUserStoreData(), refreshProducts(false)]);
      }
    } catch (err) {
      if (isAxiosError(err)) {
        alert(err.response?.data?.message || 'No se pudo cancelar el pedido.');
      } else {
        alert('Ocurrió un error al cancelar el pedido.');
      }
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Validaciones de nueva contraseña
  const isChangingPass = newPassword.length > 0;
  const passValid =
    !isChangingPass ||
    (newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(newPassword) &&
      newPassword === confirmPassword);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (isChangingPass && !passValid) {
      setProfileMsg({
        type: 'error',
        text: 'La nueva contraseña no cumple los requisitos o no coincide.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      };
      if (isChangingPass) {
        payload.password = newPassword;
      }

      const response = await api.put('/users/profile', payload);

      if (response.data.user) {
        updateUser(response.data.user);
      }

      setNewPassword('');
      setConfirmPassword('');
      setProfileMsg({ type: 'success', text: '¡Información actualizada correctamente!' });

      setTimeout(() => {
        setProfileMsg(null);
        setIsEditing(false);
      }, 2000);
    } catch (err) {
      if (isAxiosError(err)) {
        setProfileMsg({
          type: 'error',
          text: err.response?.data?.message || 'Error al actualizar datos.',
        });
      } else {
        setProfileMsg({ type: 'error', text: 'Ocurrió un error inesperado.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas eliminar tu cuenta en ENERGYM? Esta acción es permanente.'
      )
    ) {
      return;
    }
    try {
      await api.delete('/users/profile');
      logout();
    } catch {
      alert('No se pudo eliminar la cuenta en este momento.');
    }
  };

  const getStatusBadge = (status: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Cancelado') => {
    switch (status) {
      case 'Aprobado':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-verde/15 text-verde border border-verde">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aprobado</span>
          </span>
        );
      case 'Pendiente':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pendiente</span>
          </span>
        );
      case 'Rechazado':
      case 'Cancelado':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500">
            <XCircle className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        );
    }
  };

  const statusChartData = {
    labels: ['Aprobadas', 'Pendientes', 'Canceladas', 'Rechazadas'],
    datasets: [
      {
        label: 'Reservas',
        data: [
          adminStats?.approvedBookings ?? 0,
          adminStats?.pendingBookings ?? 0,
          adminStats?.cancelledBookings ?? 0,
          adminStats?.rejectedBookings ?? 0,
        ],
        backgroundColor: ['#22c55e', '#f59e0b', '#64748b', '#ef4444'],
        borderColor: '#111827',
        borderWidth: 2,
      },
    ],
  };

  const methodChartData = {
    labels: ['PayPal', 'Pago Móvil', 'Transferencia'],
    datasets: [
      {
        label: 'Cantidad de reservas',
        data: [
          adminStats?.bookingsByMethod.PayPal ?? 0,
          adminStats?.bookingsByMethod['Pago Móvil'] ?? 0,
          adminStats?.bookingsByMethod.Transferencia ?? 0,
        ],
        backgroundColor: ['#3b82f6', '#22c55e', '#a855f7'],
        borderRadius: 8,
      },
    ],
  };

  const disciplineChartData = {
    labels: (adminStats?.bookingsByDiscipline ?? []).map((d) => d.label),
    datasets: [
      {
        label: 'Reservas totales',
        data: (adminStats?.bookingsByDiscipline ?? []).map((d) => d.total),
        backgroundColor: '#22c55e',
        borderRadius: 8,
      },
      {
        label: 'Aprobadas',
        data: (adminStats?.bookingsByDiscipline ?? []).map((d) => d.approved),
        backgroundColor: '#10b981',
        borderRadius: 8,
      },
    ],
  };

  const operationGroups = [
    {
      title: 'Catálogos y Espacios',
      subtitle: 'Base operativa del gimnasio',
      items: [
        {
          to: '/admin/disciplinas',
          title: 'Disciplinas',
          desc: 'Registrar, editar o eliminar disciplinas del sistema',
          badge: 'Catálogo',
          icon: Dumbbell,
        },
        {
          to: '/admin/instructores',
          title: 'Instructores',
          desc: 'Gestionar staff, perfiles y especialidades',
          badge: 'Staff',
          icon: UserCheck,
        },
        {
          to: '/admin/salones',
          title: 'Salones',
          desc: 'Configurar espacios, ubicaciones y capacidades',
          badge: 'Espacios',
          icon: Building2,
        },
      ],
    },
    {
      title: 'Agenda, Pagos y Vista Pública',
      subtitle: 'Flujo de clases y reservas',
      items: [
        {
          to: '/admin/calendario',
          title: 'Gestionar Horario',
          desc: 'Programar clases usando los catálogos',
          badge: 'Agenda',
          icon: CalendarRange,
          highlight: true,
        },
        {
          to: '/admin/bookings',
          title: 'Reservas y Pagos',
          desc: 'Revisar comprobantes, aprobar o rechazar cupos',
          badge: 'Finanzas',
          icon: BadgeDollarSign,
          highlight: true,
        },
        {
          to: '/clases',
          title: 'Vista de Clases',
          desc: 'Ver la programación pública de horarios',
          badge: 'Público',
          icon: Eye,
        },
      ],
    },
    {
      title: 'Afiliados y Comercio',
      subtitle: 'Comunidad e inventario',
      items: [
        {
          to: '/admin/usuarios',
          title: 'Usuarios',
          desc: 'Ver afiliados, verificación, roles e historial de reservas',
          badge: 'Comunidad',
          icon: Users,
        },
        {
          to: '/admin/tienda',
          title: 'Inventario Tienda',
          desc: 'Stock, precios, productos, pagos y pedidos',
          badge: 'Tienda',
          icon: ShoppingBag,
          highlight: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold fuenteStar text-verde mb-3">
            {isAdmin ? 'Panel de Administración' : 'Mi Perfil'}
          </h1>
          <p className="text-lg md:text-xl text-white border-b border-gray-600 pb-6">
            Estimad@,{' '}
            <span className="capitalize font-bold text-verde">{user?.name || 'Atleta'}</span>,{' '}
            {isAdmin
              ? 'tienes el control total sobre disciplinas, instructores, salones, horarios, reservas, afiliados e inventario.'
              : 'aquí puedes ver y editar tu información personal y revisar tus clases reservadas, deseos y compras.'}
          </p>
        </div>

        {!isAdmin ? (
          <div className="space-y-12">
            {/* Datos y edición de perfil */}
            <div className="bg-black/40 border border-verde/40 rounded-3xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-verde font-bold text-lg">Nombre de usuario:</p>
                  <p className="capitalize text-gray-200 text-base mt-1">
                    {user?.name || 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-verde font-bold text-lg">Correo Electrónico:</p>
                  <p className="text-gray-200 text-base mt-1">{user?.email}</p>
                </div>
                <div>
                  <p className="text-verde font-bold text-lg">Teléfono:</p>
                  <p className="text-gray-200 text-base mt-1">
                    {user?.phone ? (
                      user.phone
                    ) : (
                      <span className="text-gray-500 italic">Sin registrar</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setProfileMsg(null);
                    }}
                    className="bg-verde hover:bg-verde/80 text-black font-bold py-2.5 px-6 rounded-3xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditing ? 'Cancelar edición' : 'Editar usuario'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600 font-bold py-2.5 px-6 rounded-3xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar cuenta</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/clases"
                    className="border-2 border-verde text-white hover:bg-verde hover:text-black font-bold py-2.5 px-5 rounded-3xl transition flex items-center gap-2 text-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Reservar Clase</span>
                  </Link>
                  <Link
                    to="/tienda"
                    className="bg-verde/15 hover:bg-verde text-verde hover:text-black border border-verde font-bold py-2.5 px-5 rounded-3xl transition flex items-center gap-2 text-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Ir a Tienda Fit</span>
                  </Link>
                </div>
              </div>

              {isEditing && (
                <form
                  onSubmit={handleSaveProfile}
                  className="mt-8 bg-gris border border-verde rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-4"
                >
                  <h2 className="text-2xl text-center text-white font-bold fuenteStar mb-4">
                    Editar <span className="text-verde">Información</span>
                  </h2>

                  {profileMsg && (
                    <p
                      className={`text-center text-sm font-bold p-3 rounded-2xl border ${
                        profileMsg.type === 'success'
                          ? 'text-verde bg-verde/10 border-verde'
                          : 'text-red-400 bg-red-500/10 border-red-500'
                      }`}
                    >
                      {profileMsg.text}
                    </p>
                  )}

                  <div>
                    <label className="block text-white text-sm font-semibold mb-1.5">
                      Nombre y apellido:
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-5 w-full focus:outline-none focus:ring-2 focus:ring-verde"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-1.5">
                      Correo Electrónico:
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-5 w-full focus:outline-none focus:ring-2 focus:ring-verde"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-1.5">
                      Teléfono:
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Ej: 0414-1234567"
                      className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-5 w-full focus:outline-none focus:ring-2 focus:ring-verde"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-3">
                      Deja los campos de contraseña en blanco si no deseas cambiarla.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white text-sm font-semibold mb-1.5">
                          Nuevo password:
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-5 w-full focus:outline-none focus:ring-2 focus:ring-verde"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-semibold mb-1.5">
                          Repetir password:
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-5 w-full focus:outline-none focus:ring-2 focus:ring-verde"
                        />
                      </div>
                    </div>

                    {isChangingPass && (
                      <p
                        className={`text-xs mt-2 flex items-center gap-1.5 ${
                          passValid ? 'text-verde' : 'text-amber-400'
                        }`}
                      >
                        {passValid ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        <span>
                          Mínimo 8 caracteres, mayúscula, minúscula, número, símbolo y coincidencia.
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      type="submit"
                      disabled={saving || (isChangingPass && !passValid)}
                      className="bg-verde hover:bg-verde/80 text-black font-bold py-2.5 px-8 rounded-3xl uppercase tracking-wider cursor-pointer transition inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{saving ? 'Guardando...' : 'Guardar cambios'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Mis Clases Reservadas */}
            <div>
              <h2 className="text-3xl font-bold fuenteStar text-white mb-6">
                Mis Clases <span className="text-verde">Reservadas</span>
              </h2>

              {loadingBookings ? (
                <div className="text-center py-12 text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-verde" />
                  <span>Cargando tus reservas...</span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-black/30 border border-gray-800 rounded-3xl p-8 text-center space-y-4">
                  <p className="text-gray-400">Aún no tienes clases reservadas.</p>
                  <Link
                    to="/clases"
                    className="inline-block bg-verde text-black font-bold py-2.5 px-6 rounded-2xl text-sm transition"
                  >
                    Ver Horario y Reservar
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b) => (
                    <div
                      key={b._id}
                      className="bg-black/50 border border-gray-800 hover:border-verde/50 rounded-2xl p-6 transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-white uppercase">
                              {b.gymClass?.title || 'Clase Energym'}
                            </h3>
                            {getStatusBadge(b.status)}
                          </div>
                          <p className="text-sm text-gray-300">
                            Instructor:{' '}
                            <span className="text-verde font-semibold">
                              {b.gymClass?.instructor || 'Instructor asignado'}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-5 text-xs text-gray-400 pt-2">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-verde" />
                              <span>
                                {b.gymClass?.startTime
                                  ? new Date(b.gymClass.startTime).toLocaleDateString()
                                  : 'Fecha por definir'}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-verde" />
                              <span>
                                {b.gymClass?.startTime && b.gymClass?.endTime
                                  ? `${new Date(b.gymClass.startTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })} - ${new Date(b.gymClass.endTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}`
                                  : 'Horario regular'}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-verde" />
                              <span>{b.gymClass?.room || 'Salón Principal'}</span>
                            </span>
                          </div>
                          {(b.paymentReference || b.paypalTransactionId) && (
                            <p className="text-xs text-gray-400 pt-1">
                              {b.paymentReference ? `Referencia: ${b.paymentReference}` : ''}
                              {b.paypalTransactionId ? `ID PayPal: ${b.paypalTransactionId}` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                          <span className="text-2xl font-extrabold text-verde">
                            ${b.gymClass?.cost || 0} USD
                          </span>
                          <span className="text-xs text-gray-500">Pago: {b.paymentMethod}</span>

                          {(b.status === 'Pendiente' || b.status === 'Aprobado') && (
                            <button
                              type="button"
                              disabled={cancellingId === b._id}
                              onClick={() => handleCancelBooking(b._id)}
                              className="mt-1 text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-4 py-1.5 rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              {cancellingId === b._id ? 'Cancelando...' : 'Cancelar reserva'}
                            </button>
                          )}
                        </div>
                      </div>

                      {b.classUpdateNotice && (
                        <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-sm text-amber-200 flex items-start gap-3">
                          <BellRing className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-300">
                              Aviso de actualización de clase:
                            </p>
                            <p>{b.classUpdateNotice}</p>
                          </div>
                        </div>
                      )}

                      {b.status === 'Rechazado' && b.adminMessage && (
                        <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-sm text-red-300 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-red-400">Observación de Administración:</p>
                            <p>{b.adminMessage}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mi Lista de Deseos */}
            <div>
              <h2 className="text-3xl font-bold fuenteStar text-white mb-6">
                Mi Lista de <span className="text-verde">Deseos</span>
              </h2>

              {wishlist.length === 0 ? (
                <div className="bg-black/30 border border-gray-800 rounded-3xl p-8 text-center space-y-3">
                  <p className="text-gray-400 text-sm">
                    Aún no tienes artículos guardados en tu lista de deseos.
                  </p>
                  <Link
                    to="/tienda"
                    className="inline-block bg-verde text-black font-bold py-2 px-5 rounded-2xl text-xs uppercase tracking-wider transition"
                  >
                    Explorar Tienda Fit
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((item: StoreProduct) => (
                    <div
                      key={item._id}
                      className="bg-black/50 border border-gray-800 hover:border-verde/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base text-white fuenteStar">{item.name}</h3>
                          <span className="text-verde font-extrabold text-base shrink-0">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Color: <strong className="text-verde">{item.color}</strong> • Stock:{' '}
                          {item.stock}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800 text-xs">
                        <Link
                          to="/tienda"
                          className="text-verde hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Ir a la tienda
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleWishlistItem(item._id)}
                          className="text-red-400 hover:text-red-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" /> Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial de Compras (Tienda Fit) */}
            <div>
              <h2 className="text-3xl font-bold fuenteStar text-white mb-6">
                Historial de <span className="text-verde">Compras</span>
              </h2>

              {loadingOrders ? (
                <div className="text-center py-10 text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-verde" />
                  <span>Cargando tus pedidos...</span>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="bg-black/30 border border-gray-800 rounded-3xl p-8 text-center space-y-3">
                  <p className="text-gray-400 text-sm">
                    Aún no has realizado compras en la Tienda Fit.
                  </p>
                  <Link
                    to="/tienda"
                    className="inline-block bg-verde text-black font-bold py-2 px-5 rounded-2xl text-xs uppercase tracking-wider transition"
                  >
                    Ir a la Tienda Fit
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((ord) => (
                    <div
                      key={ord._id}
                      className="bg-black/50 border border-gray-800 hover:border-verde/50 rounded-2xl p-6 transition space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-extrabold text-sm text-gray-300">
                              Pedido #{ord._id.slice(-6).toUpperCase()}
                            </span>
                            {getStatusBadge(ord.status)}
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                ord.paymentReceived
                                  ? 'bg-verde/15 text-verde border-verde/40'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {ord.paymentReceived ? 'Pago recibido' : 'Pago pendiente verificar'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Fecha: {new Date(ord.createdAt).toLocaleDateString()} • Método:{' '}
                            <strong className="text-gray-200">{ord.paymentMethod}</strong>
                            {ord.paymentReference ? ` • Ref: ${ord.paymentReference}` : ''}
                            {ord.paypalTransactionId ? ` • PayPal: ${ord.paypalTransactionId}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center md:flex-col md:items-end justify-between gap-2">
                          <span className="text-2xl font-extrabold text-verde">
                            ${Number(ord.totalAmount).toFixed(2)} USD
                          </span>

                          {(ord.status === 'Pendiente' || ord.status === 'Aprobado') && (
                            <button
                              type="button"
                              disabled={cancellingOrderId === ord._id}
                              onClick={() => handleCancelOrder(ord._id)}
                              className="text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-4 py-1.5 rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              {cancellingOrderId === ord._id ? 'Cancelando...' : 'Cancelar pedido'}
                            </button>
                          )}
                        </div>
                      </div>

                      {ord.status === 'Aprobado' && (
                        <div className="p-3.5 rounded-2xl bg-verde/10 border border-verde/40 text-xs text-verde flex items-center gap-2 font-semibold">
                          <PackageCheck className="w-4 h-4 shrink-0" />
                          <span>¡Tu pedido está aprobado y listo para retirar en ENERGYM!</span>
                        </div>
                      )}

                      <ul className="text-xs text-gray-300 bg-black/40 rounded-xl p-3.5 space-y-1 border border-gray-800/80">
                        {ord.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between gap-2">
                            <span>
                              {it.nameSnapshot} ({it.colorSnapshot} • Talla {it.sizeSnapshot}) x
                              {it.quantity}
                            </span>
                            <span className="font-bold text-verde">
                              ${(Number(it.unitPrice) * Number(it.quantity)).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {ord.adminNotes && (
                        <p className="text-xs text-gray-300 bg-black/40 p-3 rounded-xl border border-gray-800">
                          <strong className="text-verde">Nota de administración:</strong>{' '}
                          {ord.adminNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Barra de actualización en tiempo real */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 border border-gray-800 px-5 py-3 rounded-2xl text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-verde animate-pulse" />
                <span>Métricas en tiempo real desde la base de datos</span>
                {lastUpdated && (
                  <span className="text-gray-400">• Última lectura: {lastUpdated}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchAdminStats(true)}
                disabled={loadingStats}
                className="inline-flex items-center gap-1.5 bg-verde/15 hover:bg-verde/25 text-verde border border-verde/50 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                <span>{loadingStats ? 'Actualizando...' : 'Actualizar ahora'}</span>
              </button>
            </div>

            {/* Tarjetas de métricas reales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-black/50 p-6 rounded-2xl border border-verde/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Ingresos Aprobados</span>
                  <DollarSign className="w-5 h-5 text-verde" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  ${(adminStats?.totalRevenue ?? 0).toFixed(2)}
                </p>
                <span className="text-xs text-verde">
                  Pendiente por confirmar: ${(adminStats?.pendingRevenue ?? 0).toFixed(2)}
                </span>
              </div>

              <div className="bg-black/50 p-6 rounded-2xl border border-verde/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Usuarios Registrados</span>
                  <Users className="w-5 h-5 text-verde" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  {adminStats?.totalUsers ?? 0}
                </p>
                <span className="text-xs text-gray-400">Cuentas en el sistema</span>
              </div>

              <div className="bg-black/50 p-6 rounded-2xl border border-verde/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Reservas Totales</span>
                  <Calendar className="w-5 h-5 text-verde" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  {adminStats?.totalBookings ?? 0}
                </p>
                <span className="text-xs text-verde">
                  {adminStats?.approvedBookings ?? 0} aprobadas • {adminStats?.pendingBookings ?? 0}{' '}
                  pendientes
                </span>
              </div>

              <div className="bg-black/50 p-6 rounded-2xl border border-verde/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Clases Activas</span>
                  <Dumbbell className="w-5 h-5 text-verde" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  {adminStats?.totalActiveClasses ?? 0}
                </p>
                <span className="text-xs text-gray-400">Programadas en calendario</span>
              </div>
            </div>

            {/* Métricas de Tienda Fit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/50 p-6 rounded-2xl border border-verde/35">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Ingresos Tienda Fit</span>
                  <ShoppingBag className="w-5 h-5 text-verde" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  ${(storeStats?.storeRevenue ?? 0).toFixed(2)}
                </p>
                <span className="text-xs text-verde">Órdenes aprobadas en USD</span>
              </div>

              <div className="bg-black/50 p-6 rounded-2xl border border-verde/35">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Pedidos de Tienda</span>
                  <PackageCheck className="w-5 h-5 text-verde" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  {storeStats?.totalOrders ?? 0}
                </p>
                <span className="text-xs text-gray-400">
                  {storeStats?.approvedOrders ?? 0} aprobados • {storeStats?.pendingOrders ?? 0}{' '}
                  pendientes
                </span>
              </div>

              <div className="bg-black/50 p-6 rounded-2xl border border-verde/35">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Producto Más Vendido</span>
                  <Award className="w-5 h-5 text-verde" />
                </div>
                <p className="text-lg font-extrabold text-verde truncate">
                  {storeStats?.bestSeller?.name || 'Sin ventas aprobadas aún'}
                </p>
                <span className="text-xs text-gray-400">
                  {storeStats?.bestSeller
                    ? `${storeStats.bestSeller.unitsSold} und. vendidas`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Gráficos con Chart.js */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-black/50 p-6 rounded-3xl border border-verde/30">
                <h3 className="text-lg font-bold text-verde mb-4">Estado de Reservas</h3>
                <div className="h-64 flex items-center justify-center">
                  <Doughnut
                    data={statusChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { color: '#e5e7eb' },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-black/50 p-6 rounded-3xl border border-verde/30">
                <h3 className="text-lg font-bold text-verde mb-4">Reservas por Método de Pago</h3>
                <div className="h-64">
                  <Bar
                    data={methodChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        x: {
                          ticks: { color: '#e5e7eb' },
                          grid: { color: 'rgba(255,255,255,0.06)' },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: { color: '#e5e7eb', stepSize: 1 },
                          grid: { color: 'rgba(255,255,255,0.06)' },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-black/50 p-6 rounded-3xl border border-verde/30">
              <h3 className="text-lg font-bold text-verde mb-4">Reservas por Disciplina</h3>
              {(adminStats?.bookingsByDiscipline.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                  Aún no hay reservas registradas por disciplina.
                </p>
              ) : (
                <div className="h-72">
                  <Bar
                    data={disciplineChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: '#e5e7eb' },
                        },
                      },
                      scales: {
                        x: {
                          ticks: { color: '#e5e7eb' },
                          grid: { color: 'rgba(255,255,255,0.06)' },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: { color: '#e5e7eb', stepSize: 1 },
                          grid: { color: 'rgba(255,255,255,0.06)' },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>

            {/* SECCIÓN DE CONTROL DE OPERACIONES ACTUALIZADA */}
            <div className="bg-black/50 p-6 md:p-8 rounded-3xl border border-verde/40 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold fuenteStar text-white">
                    Control de <span className="text-verde">Operaciones</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Acceso directo a todos los módulos administrativos de Energym
                  </p>
                </div>
              </div>

              {operationGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-verde">
                      {group.title}
                    </h3>
                    <span className="text-xs text-gray-500">{group.subtitle}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`group relative p-5 rounded-2xl bg-gris border transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 ${
                            item.highlight
                              ? 'border-verde/50 hover:border-verde hover:bg-verde/10 shadow-lg shadow-verde/5'
                              : 'border-gray-800 hover:border-verde hover:bg-verde/10'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-black/60 border border-verde/30 group-hover:border-verde flex items-center justify-center text-verde transition">
                                <IconComponent className="w-5 h-5" />
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/50 text-gray-300 border border-gray-700 group-hover:border-verde/40 group-hover:text-verde transition">
                                  {item.badge}
                                </span>
                                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-verde group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                              </div>
                            </div>

                            <p className="font-bold text-lg text-verde fuenteStar">{item.title}</p>
                            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}