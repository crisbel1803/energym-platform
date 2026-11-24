import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const hasRequested = useRef(false);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu correo electrónico...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('El enlace de verificación no es válido.');
      return;
    }

    if (hasRequested.current) return;
    hasRequested.current = true;

    const verify = async () => {
      try {
        const res = await api.get(`/users/verify-email?token=${encodeURIComponent(token)}`);
        setStatus('success');
        setMessage(res.data.message || '¡Correo verificado exitosamente! Ya puedes iniciar sesión.');
      } catch (err) {
        setStatus('error');
        if (isAxiosError(err)) {
          setMessage(err.response?.data?.message || 'No se pudo verificar el correo.');
        } else {
          setMessage('Ocurrió un error al verificar el correo.');
        }
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between fuenteTilt">
      <Navbar />

      <main className="grow flex items-center justify-center px-4 py-16">
        <div className="bg-gris border border-verde rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl">
          {status === 'loading' && (
            <Loader2 className="w-12 h-12 text-verde animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-12 h-12 text-verde mx-auto" />
          )}
          {status === 'error' && (
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          )}

          <h1 className="text-2xl font-bold fuenteStar text-white">
            Verificación de <span className="text-verde">Correo</span>
          </h1>

          <p className="text-sm text-gray-200 leading-relaxed">{message}</p>

          <Link
            to="/login"
            className="inline-block bg-verde hover:bg-verde/80 text-black font-bold py-2.5 px-7 rounded-3xl transition text-sm uppercase tracking-wider"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}