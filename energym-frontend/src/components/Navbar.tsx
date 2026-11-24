import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  Calendar,
  ShoppingBag,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Dumbbell,
  Receipt,
  Users,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Calendar;
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  // Cierra automáticamente el menú móvil al navegar a otra ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems: NavItem[] = [];

  if (isAuthenticated) {
    navItems.push({
      to: '/perfil',
      label: isAdmin ? 'Panel Admin' : 'Mi Perfil',
      icon: isAdmin ? ShieldCheck : LayoutDashboard,
    });
  }

  navItems.push({
    to: '/disciplinas',
    label: 'Disciplinas',
    icon: Dumbbell,
  });

  navItems.push({
    to: isAdmin ? '/admin/calendario' : '/clases',
    label: isAdmin ? 'Horario' : 'Clases',
    icon: Calendar,
  });

  if (isAdmin) {
    navItems.push({
      to: '/admin/bookings',
      label: 'Reservas',
      icon: Receipt,
    });
    navItems.push({
      to: '/admin/usuarios',
      label: 'Usuarios',
      icon: Users,
    });
    navItems.push({
      to: '/admin/tienda',
      label: 'Inventario',
      icon: ShoppingBag,
    });
  } else {
    navItems.push({
      to: '/tienda',
      label: 'Tienda Fit',
      icon: ShoppingBag,
    });
    if (isAuthenticated) {
      navItems.push({
        to: '/carrito',
        label: `Carrito (${cartCount})`,
        icon: ShoppingBag,
      });
    }
  }

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <nav className="bg-black/95 backdrop-blur-md border-b border-verde/30 sticky top-0 z-50 fuenteTilt">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/images/logo-navbar.png"
              alt="ENERGYM Fitness Club"
              className="h-11 md:h-14 w-auto object-contain"
            />
          </Link>

          {/* Pestañas compactas en escritorio */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-2.5 lg:px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    active
                      ? 'bg-verde text-black border-verde shadow-sm shadow-verde/25'
                      : 'text-gray-200 border-transparent hover:border-verde/50 hover:text-verde hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full bg-black shrink-0"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Controles de usuario / sesión (Escritorio) y botón hamburguesa (Móvil) */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-white bg-gris px-3 py-1.5 rounded-full border border-verde/60">
                  <User className="w-3.5 h-3.5 text-verde shrink-0" />
                  <span className="font-bold capitalize max-w-[110px] truncate">
                    {user?.name || 'Atleta'}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase ${
                      isAdmin
                        ? 'bg-verde text-black'
                        : 'bg-black/60 text-verde border border-verde/40'
                    }`}
                  >
                    {user?.role || 'CLIENT'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  aria-label="Cerrar Sesión"
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-full transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                    isActive('/login')
                      ? 'bg-verde text-black border-verde'
                      : 'text-white border-transparent hover:border-verde/50 hover:text-verde'
                  }`}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-verde hover:bg-verde/85 text-black font-bold text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap transition"
                >
                  Únete
                </Link>
              </div>
            )}

            {/* Botón hamburguesa en móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="md:hidden p-2 rounded-xl bg-gris border border-verde/40 text-verde hover:bg-verde/15 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable responsivo (Móvil) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gris/95 border-t border-verde/30 px-4 py-4 space-y-3 shadow-2xl">
          {isAuthenticated && (
            <div className="flex items-center justify-between bg-black/60 border border-verde/30 rounded-2xl px-3.5 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 text-verde shrink-0" />
                <span className="text-xs font-bold text-white capitalize truncate">
                  {user?.name || 'Atleta'}
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 ${
                  isAdmin
                    ? 'bg-verde text-black'
                    : 'bg-verde/15 text-verde border border-verde/40'
                }`}
              >
                {user?.role || 'CLIENT'}
              </span>
            </div>
          )}

          <div className="flex flex-col space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition border ${
                    active
                      ? 'bg-verde text-black border-verde'
                      : 'bg-black/40 text-gray-200 border-gray-800 hover:border-verde/50 hover:text-verde'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      active
                        ? 'bg-black/20 text-black font-extrabold'
                        : 'text-gray-500'
                    }`}
                  >
                    {active ? 'Activa' : 'Ir'}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-800">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/40 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold text-center border transition ${
                    isActive('/login')
                      ? 'bg-verde text-black border-verde'
                      : 'bg-black/50 text-white border-gray-700 hover:border-verde'
                  }`}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-center bg-verde hover:bg-verde/85 text-black transition"
                >
                  Únete
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}