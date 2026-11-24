import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ClasesSchedule from './pages/ClasesSchedule';
import AdminCalendar from './pages/AdminCalendar';
import PrivateRoute from './components/PrivateRoute';
import AdminDisciplines from './pages/AdminDisciplines';
import AdminInstructors from './pages/AdminInstructors';
import AdminRooms from './pages/AdminRooms';
import DisciplinesCatalog from './pages/DisciplinesCatalog';
import AdminBookings from './pages/AdminBookings';
import AdminUsers from './pages/AdminUsers';
import StoreCatalog from './pages/StoreCatalog';
import CartCheckout from './pages/CartCheckout';
import AdminStore from './pages/AdminStore';

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verificar-correo" element={<VerifyEmail />} />
          <Route path="/clases" element={<ClasesSchedule />} />
          <Route path="/disciplinas" element={<DisciplinesCatalog />} />
          <Route path="/tienda" element={<StoreCatalog />} />

          {/* Perfil / Carrito / Panel de Usuario autenticado */}
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/carrito"
            element={
              <PrivateRoute>
                <CartCheckout />
              </PrivateRoute>
            }
          />

          {/* Rutas protegidas solo para ADMIN */}
          <Route
            path="/admin/calendario"
            element={
              <PrivateRoute adminOnly>
                <AdminCalendar />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <PrivateRoute adminOnly>
                <AdminBookings />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/disciplinas"
            element={
              <PrivateRoute adminOnly>
                <AdminDisciplines />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/instructores"
            element={
              <PrivateRoute adminOnly>
                <AdminInstructors />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/salones"
            element={
              <PrivateRoute adminOnly>
                <AdminRooms />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <PrivateRoute adminOnly>
                <AdminUsers />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/tienda"
            element={
              <PrivateRoute adminOnly>
                <AdminStore />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </StoreProvider>
  );
}