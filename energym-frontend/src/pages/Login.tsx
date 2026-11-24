import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { isAxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, MailWarning } from 'lucide-react';

const VERIFY_MESSAGE = 'Debes verificar tu correo para poder ingresar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/users/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      if (response.data.token && response.data.user) {
        login(response.data.token, response.data.user);
        navigate('/');
      }
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Credenciales incorrectas. Verifica tus datos.');
      } else {
        setError('Ocurrió un error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isUnverifiedError = error === VERIFY_MESSAGE;

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between fuenteTilt">
      <Navbar />

      <section className="flex-grow flex items-center justify-center px-4 py-16">
        <form
          onSubmit={handleSubmit}
          className="bg-gris w-full max-w-xl flex flex-col justify-center items-center border border-verde rounded-3xl p-8 md:p-12 shadow-2xl"
        >
          <h1 className="text-2xl md:text-3xl text-center text-white font-bold mb-6 fuenteStar">
            Ingresa tus datos para <span className="text-verde">iniciar sesión</span>
          </h1>

          {error && (
            <div
              className={`border-2 p-4 text-center rounded-2xl mb-6 w-full md:w-4/5 text-sm space-y-1.5 ${
                isUnverifiedError
                  ? 'text-amber-300 border-amber-500/60 bg-amber-500/10'
                  : 'text-red-400 border-red-500/50 bg-red-500/10'
              }`}
            >
              {isUnverifiedError && (
                <div className="flex items-center justify-center gap-1.5 font-bold text-amber-400">
                  <MailWarning className="w-4 h-4 shrink-0" />
                  <span>Cuenta pendiente de verificación</span>
                </div>
              )}
              <p className="font-semibold">{error}</p>
              {isUnverifiedError && (
                <p className="text-xs text-gray-300">
                  Revisa tu bandeja de entrada o carpeta de spam y haz clic en el enlace que te enviamos.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-6 w-full md:w-4/5">
            <div>
              <label htmlFor="email-input" className="block text-white text-sm font-semibold mb-2">
                Correo electrónico:
              </label>
              <input
                id="email-input"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="bg-black/40 border border-verde rounded-3xl text-white py-3 px-6 w-full focus:outline-none focus:ring-2 focus:ring-verde"
              />
            </div>

            <div>
              <label htmlFor="password-input" className="block text-white text-sm font-semibold mb-2">
                Contraseña:
              </label>
              <input
                id="password-input"
                type="password"
                required
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black/40 border border-verde rounded-3xl text-white py-3 px-6 w-full focus:outline-none focus:ring-2 focus:ring-verde"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="text-xl transition ease-in-out font-bold text-white hover:text-verde py-6 uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin text-verde" />}
            <span>{loading ? 'Ingresando...' : 'Iniciar sesión'}</span>
          </button>

          <div className="text-center pt-6 border-t border-verde w-full md:w-4/5">
            <p className="text-verde mb-1">¿Eres nuevo en ENERGYM?</p>
            <Link to="/register" className="text-white hover:underline">
              crea una cuenta <span className="font-bold text-verde">aquí.</span>
            </Link>
          </div>
        </form>
      </section>

      <Footer />
    </div>
  );
}