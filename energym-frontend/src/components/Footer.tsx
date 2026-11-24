import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const isActive = (path: string) => location.pathname === path;

  const quickLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/disciplinas', label: 'Disciplinas' },
    { to: isAdmin ? '/admin/calendario' : '/clases', label: isAdmin ? 'Gestionar Horario' : 'Horario Semanal' },
    { to: '/tienda', label: isAdmin ? 'Inventario Tienda' : 'Tienda Fit' },
    ...(isAuthenticated
      ? [{ to: '/perfil', label: isAdmin ? 'Panel Admin' : 'Mi Perfil' }]
      : [{ to: '/login', label: 'Iniciar Sesión' }]),
  ];

  return (
    <footer
      aria-label="Pie de página de ENERGYM Fitness Club"
      className="relative overflow-hidden bg-black border-t border-verde/30 text-white pt-12 pb-8 fuenteTilt"
    >
      {/* Halo sutil decorativo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[360px] h-[140px] rounded-full bg-verde/10 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-gray-800/90 items-start">
          {/* Marca y propuesta */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-3">
            <Link to="/" className="inline-flex items-center group">
              <img
                src="/images/logo-footer.png"
                alt="ENERGYM Fitness Club"
                loading="lazy"
                className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <p className="text-gray-300 text-sm max-w-sm leading-relaxed">
              ¡Tu clase, tu ritmo, tu energía! Tu espacio para moverte en grupo, entrenar con coaches preparados y reservar al instante.
            </p>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-verde bg-verde/10 border border-verde/25 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Clases grupales • Reserva online</span>
            </div>
          </div>

          {/* Navegación rápida */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-verde mb-3.5 fuenteStar">
              Explorar
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm font-semibold">
              {quickLinks.map((item) => {
                const active = isActive(item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`group inline-flex items-center gap-1 transition-colors duration-200 ${
                        active
                          ? 'text-verde font-bold'
                          : 'text-gray-300 hover:text-verde'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Respaldo y derechos */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end text-center md:text-right space-y-2.5">
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-300 bg-gris/80 border border-gray-800 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-verde shrink-0" />
              <span>Gestión de cupos y pagos</span>
            </div>

            <div className="text-xs text-gray-400 space-y-1 pt-1">
              <p className="font-semibold text-gray-200">
                © {new Date().getFullYear()} ENERGYM Fitness Club.
              </p>
              <p className="text-verde font-medium">Todos los derechos reservados.</p>
            </div>
          </div>
        </div>

        {/* Barra inferior compacta */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
          <span>Entrenamiento grupal • Disciplinas, horarios y reservas</span>
          <span>Hecho con energía para la comunidad ENERGYM</span>
        </div>
      </div>
    </footer>
  );
}