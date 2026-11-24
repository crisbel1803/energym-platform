import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { isAxiosError } from 'axios';
import {
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserCheck,
  Trash2,
  Eye,
  X,
  RefreshCw,
  Loader2,
  Users,
} from 'lucide-react';

interface UserBookingDetail {
  _id: string;
  status: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Cancelado';
  paymentMethod: string;
  paymentReference?: string;
  paypalTransactionId?: string;
  createdAt: string;
  gymClass?: {
    title?: string;
    discipline?: string;
    instructor?: string;
    room?: string;
    startTime?: string;
    cost?: number;
  } | null;
}

interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'CLIENT';
  isVerified: boolean;
  createdAt: string;
  bookingStats: {
    total: number;
    approved: number;
    pending: number;
    cancelled: number;
    rejected: number;
    approvedAmount: number;
    pendingAmount: number;
  };
  bookings: UserBookingDetail[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CLIENT'>('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');

  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get('/users/admin/all');
      if (res.data.ok && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
        setSelectedUser((prev) =>
          prev ? res.data.data.find((u: AdminUserRow) => u._id === prev._id) || null : null
        );
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setFeedback({ type: 'error', text: 'No se pudieron cargar los usuarios.' });
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  const handleVerifyUser = async (userId: string) => {
    setFeedback(null);
    setActionLoadingId(userId);
    try {
      const res = await api.patch(`/users/admin/${userId}/verify`);
      if (res.data.ok) {
        setFeedback({ type: 'success', text: res.data.message || 'Usuario verificado.' });
        await fetchUsers(false);
      }
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'No se pudo verificar el usuario.'
        : 'Error al verificar usuario.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (target: AdminUserRow) => {
    const nextRole = target.role === 'ADMIN' ? 'CLIENT' : 'ADMIN';
    if (
      !window.confirm(
        `¿Cambiar el rol de ${target.name} (${target.email}) de ${target.role} a ${nextRole}?`
      )
    ) {
      return;
    }

    setFeedback(null);
    setActionLoadingId(target._id);
    try {
      const res = await api.patch(`/users/admin/${target._id}/role`, { role: nextRole });
      if (res.data.ok) {
        setFeedback({ type: 'success', text: res.data.message || 'Rol actualizado.' });
        await fetchUsers(false);
      }
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'No se pudo cambiar el rol.'
        : 'Error al actualizar rol.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (target: AdminUserRow) => {
    if (
      !window.confirm(
        `¿Eliminar permanentemente a ${target.name} (${target.email})? Se liberarán sus cupos activos y se borrarán sus reservas.`
      )
    ) {
      return;
    }

    setFeedback(null);
    setActionLoadingId(target._id);
    try {
      const res = await api.delete(`/users/admin/${target._id}`);
      if (res.data.ok) {
        setFeedback({ type: 'success', text: res.data.message || 'Usuario eliminado.' });
        if (selectedUser?._id === target._id) {
          setSelectedUser(null);
        }
        await fetchUsers(false);
      }
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'No se pudo eliminar el usuario.'
        : 'Error al eliminar usuario.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (verifiedFilter === 'VERIFIED' && !u.isVerified) return false;
      if (verifiedFilter === 'UNVERIFIED' && u.isVerified) return false;

      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm, roleFilter, verifiedFilter]);

  const summary = useMemo(() => {
    const total = users.length;
    const verified = users.filter((u) => u.isVerified).length;
    const unverified = total - verified;
    const approvedBookings = users.reduce((acc, u) => acc + u.bookingStats.approved, 0);
    const pendingBookings = users.reduce((acc, u) => acc + u.bookingStats.pending, 0);
    return { total, verified, unverified, approvedBookings, pendingBookings };
  }, [users]);

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-700 pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold fuenteStar text-verde">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-300 text-sm md:text-base mt-2">
              Consulta afiliados, estado de verificación de correo, historial de reservas y permisos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchUsers(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-verde/15 hover:bg-verde/25 text-verde border border-verde/50 px-4 py-2.5 rounded-2xl text-sm font-bold transition cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar lista</span>
          </button>
        </div>

        {/* Resumen superior */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/50 border border-verde/30 rounded-2xl p-5">
            <div className="flex items-center justify-between text-gray-400 text-xs uppercase mb-2">
              <span>Total Usuarios</span>
              <Users className="w-4 h-4 text-verde" />
            </div>
            <p className="text-3xl font-extrabold text-white">{summary.total}</p>
            <span className="text-xs text-verde">
              {summary.verified} verificados • {summary.unverified} sin verificar
            </span>
          </div>

          <div className="bg-black/50 border border-verde/30 rounded-2xl p-5">
            <span className="text-gray-400 text-xs uppercase block mb-2">Correos Verificados</span>
            <p className="text-3xl font-extrabold text-verde">{summary.verified}</p>
            <span className="text-xs text-gray-400">Listos para iniciar sesión</span>
          </div>

          <div className="bg-black/50 border border-verde/30 rounded-2xl p-5">
            <span className="text-gray-400 text-xs uppercase block mb-2">Sin Verificar</span>
            <p className="text-3xl font-extrabold text-amber-400">{summary.unverified}</p>
            <span className="text-xs text-gray-400">Pendientes de enlace o validación</span>
          </div>

          <div className="bg-black/50 border border-verde/30 rounded-2xl p-5">
            <span className="text-gray-400 text-xs uppercase block mb-2">Reservas (Aprob / Pend)</span>
            <p className="text-3xl font-extrabold text-white">
              {summary.approvedBookings} / {summary.pendingBookings}
            </p>
            <span className="text-xs text-gray-400">Aprobadas vs. en revisión</span>
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-verde/15 border-verde text-verde'
                : 'bg-red-500/15 border-red-500 text-red-300'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-current opacity-80 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-black/50 border border-gray-800 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono..."
              className="w-full bg-gris border border-gray-700 focus:border-verde rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'CLIENT')}
            className="bg-gris border border-gray-700 focus:border-verde rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
          >
            <option value="ALL">Todos los roles</option>
            <option value="CLIENT">Solo CLIENT</option>
            <option value="ADMIN">Solo ADMIN</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) =>
              setVerifiedFilter(e.target.value as 'ALL' | 'VERIFIED' | 'UNVERIFIED')
            }
            className="bg-gris border border-gray-700 focus:border-verde rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
          >
            <option value="ALL">Todos los estados de correo</option>
            <option value="VERIFIED">Verificados</option>
            <option value="UNVERIFIED">Sin verificar</option>
          </select>
        </div>

        {/* Tabla de usuarios */}
        {loading ? (
          <div className="bg-black/50 border border-gray-800 rounded-3xl p-12 text-center text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-verde" />
            <span>Cargando usuarios y reservas...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-black/50 border border-gray-800 rounded-3xl p-12 text-center text-gray-400">
            No se encontraron usuarios con los filtros seleccionados.
          </div>
        ) : (
          <div className="bg-black/50 border border-verde/30 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/60 text-xs uppercase text-gray-400">
                    <th className="py-4 px-4">Usuario</th>
                    <th className="py-4 px-4">Rol</th>
                    <th className="py-4 px-4">Verificación</th>
                    <th className="py-4 px-4">Reservas (Aprob / Pend / Canc / Rech)</th>
                    <th className="py-4 px-4">Monto Aprobado</th>
                    <th className="py-4 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {filteredUsers.map((u) => {
                    const busy = actionLoadingId === u._id;
                    return (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-4">
                          <p className="font-bold text-white capitalize">{u.name}</p>
                          <p className="text-xs text-verde">{u.email}</p>
                          <p className="text-xs text-gray-400">
                            {u.phone ? `Tel: ${u.phone}` : 'Sin teléfono'} • Registro:{' '}
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/50'
                                : 'bg-verde/10 text-verde border-verde/40'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-verde">
                              <CheckCircle2 className="w-4 h-4" /> Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                              <XCircle className="w-4 h-4" /> No verificado
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                            <span className="px-2 py-0.5 rounded bg-verde/15 text-verde border border-verde/40">
                              Aprob: {u.bookingStats.approved}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40">
                              Pend: {u.bookingStats.pending}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-gray-700/50 text-gray-300 border border-gray-600">
                              Canc: {u.bookingStats.cancelled}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/40">
                              Rech: {u.bookingStats.rejected}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Total historial: {u.bookingStats.total}
                          </p>
                        </td>

                        <td className="py-4 px-4 font-bold text-white">
                          ${u.bookingStats.approvedAmount.toFixed(2)}
                          {u.bookingStats.pendingAmount > 0 && (
                            <span className="block text-[11px] font-normal text-amber-300">
                              +${u.bookingStats.pendingAmount.toFixed(2)} pend.
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="p-2 rounded-xl bg-black/60 hover:bg-verde/20 text-verde border border-verde/40 transition cursor-pointer"
                              title="Ver historial de reservas"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {!u.isVerified && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleVerifyUser(u._id)}
                                className="p-2 rounded-xl bg-verde/15 hover:bg-verde text-verde hover:text-black border border-verde/50 transition cursor-pointer disabled:opacity-40"
                                title="Verificar correo manualmente"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleToggleRole(u)}
                              className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/40 transition cursor-pointer disabled:opacity-40"
                              title={`Cambiar a ${u.role === 'ADMIN' ? 'CLIENT' : 'ADMIN'}`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDeleteUser(u)}
                              className="p-2 rounded-xl bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/40 transition cursor-pointer disabled:opacity-40"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Historial de Reservas del Usuario */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-gris border border-verde rounded-3xl max-w-2xl w-full p-6 md:p-8 relative text-white shadow-2xl max-h-[88vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-verde cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold fuenteStar text-verde capitalize">
              {selectedUser.name}
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              {selectedUser.email} • Rol: <strong>{selectedUser.role}</strong> •{' '}
              {selectedUser.isVerified ? 'Correo verificado' : 'Correo no verificado'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-center text-xs">
              <div className="bg-black/50 p-3 rounded-xl border border-verde/30">
                <p className="text-verde font-extrabold text-lg">
                  {selectedUser.bookingStats.approved}
                </p>
                <p className="text-gray-400">Aprobadas</p>
              </div>
              <div className="bg-black/50 p-3 rounded-xl border border-amber-500/30">
                <p className="text-amber-400 font-extrabold text-lg">
                  {selectedUser.bookingStats.pending}
                </p>
                <p className="text-gray-400">Pendientes</p>
              </div>
              <div className="bg-black/50 p-3 rounded-xl border border-gray-700">
                <p className="text-gray-200 font-extrabold text-lg">
                  {selectedUser.bookingStats.cancelled}
                </p>
                <p className="text-gray-400">Canceladas</p>
              </div>
              <div className="bg-black/50 p-3 rounded-xl border border-red-500/30">
                <p className="text-red-400 font-extrabold text-lg">
                  {selectedUser.bookingStats.rejected}
                </p>
                <p className="text-gray-400">Rechazadas</p>
              </div>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wider text-verde mb-3">
              Detalle de Reservas ({selectedUser.bookings.length})
            </h3>

            {selectedUser.bookings.length === 0 ? (
              <p className="text-sm text-gray-400 bg-black/40 p-5 rounded-2xl text-center">
                Este usuario aún no tiene reservas registradas.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedUser.bookings.map((b) => (
                  <div
                    key={b._id}
                    className="bg-black/50 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white text-sm uppercase">
                        {b.gymClass?.title || 'Clase eliminada o no disponible'}
                      </p>
                      <p className="text-gray-400">
                        Método: <strong className="text-gray-200">{b.paymentMethod}</strong> •
                        Monto: <strong className="text-verde">${b.gymClass?.cost ?? 0} USD</strong>
                      </p>
                      {(b.paymentReference || b.paypalTransactionId) && (
                        <p className="text-gray-400 mt-0.5">
                          {b.paymentReference ? `Ref: ${b.paymentReference}` : ''}
                          {b.paypalTransactionId ? `PayPal ID: ${b.paypalTransactionId}` : ''}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full font-bold bg-black/70 border border-gray-700 self-start sm:self-center">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}