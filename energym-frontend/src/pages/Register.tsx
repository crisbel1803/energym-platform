import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { isAxiosError } from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, Check, X, MailCheck } from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matchPassword, setMatchPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password);
  const passwordsMatch = password.length > 0 && password === matchPassword;
  const isNameValid = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*$/.test(name.trim());
  const isEmailValid = EMAIL_REGEX.test(email.trim());

  const isFormValid =
    isNameValid &&
    isEmailValid &&
    hasMinLength &&
    hasUpperAndLower &&
    hasNumber &&
    hasSpecialChar &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await api.post('/users/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccessMsg(
        response.data.message ||
          '¡Registro exitoso! Revisa tu correo y haz clic en el enlace de verificación para poder iniciar sesión.'
      );
      setName('');
      setEmail('');
      setPassword('');
      setMatchPassword('');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al registrarse. Intenta con otro correo.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between fuenteTilt">
      <Navbar />

      <section className="flex-grow flex items-center justify-center px-4 py-16">
        <form
          onSubmit={handleSubmit}
          className="bg-gris w-full max-w-xl flex flex-col justify-center items-center border border-verde rounded-3xl p-8 md:p-12 shadow-2xl"
        >
          <h1 className="text-2xl md:text-3xl text-center text-white font-bold mb-6 fuenteStar">
            Llena todos los <span className="text-verde">campos</span>
          </h1>

          {error && (
            <p className="text-red-500 border-2 border-red-500/50 bg-red-500/10 p-3 text-center rounded-2xl mb-6 w-full md:w-4/5 text-sm">
              {error}
            </p>
          )}

          {successMsg && (
            <div className="text-verde border-2 border-verde/60 bg-verde/10 p-4 text-center rounded-2xl mb-6 w-full md:w-4/5 text-sm space-y-2">
              <div className="flex items-center justify-center gap-2 font-bold">
                <MailCheck className="w-5 h-5 shrink-0" />
                <span>Verifica tu correo</span>
              </div>
              <p>{successMsg}</p>
            </div>
          )}

          <div className="flex flex-col w-full md:w-4/5">
            {/* Nombre */}
            <div>
              <label htmlFor="name-input" className="block text-white text-sm font-semibold mb-2">
                Nombre y apellido:
              </label>
              <input
                type="text"
                id="name-input"
                required
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Crisbel Cedeno"
                className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-6 w-full focus:outline-none focus:ring-2 focus:ring-verde"
              />
            </div>
            <p
              className={`text-xs py-3 flex items-center gap-1.5 ${
                name ? (isNameValid ? 'text-verde' : 'text-amber-400') : 'text-gray-300'
              }`}
            >
              {name &&
                (isNameValid ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                ))}
              <span>
                El nombre y apellido deben comenzar con mayúscula.{' '}
                <span className="font-bold">(*)</span>
              </span>
            </p>

            {/* Correo */}
            <div>
              <label htmlFor="email-input" className="block text-white text-sm font-semibold mb-2">
                Correo electrónico:
              </label>
              <input
                type="email"
                id="email-input"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-6 w-full focus:outline-none focus:ring-2 focus:ring-verde"
              />
            </div>
            <p
              className={`text-xs py-3 flex items-center gap-1.5 ${
                email ? (isEmailValid ? 'text-verde' : 'text-amber-400') : 'text-gray-300'
              }`}
            >
              {email &&
                (isEmailValid ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                ))}
              <span>
                Ingresa un correo válido con dominio (ej. nombre@dominio.com).{' '}
                <span className="font-bold">(*)</span>
              </span>
            </p>

            {/* Contraseña */}
            <div>
              <label htmlFor="password-input" className="block text-white text-sm font-semibold mb-2">
                Crear contraseña:
              </label>
              <input
                type="password"
                id="password-input"
                required
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-6 w-full focus:outline-none focus:ring-2 focus:ring-verde"
              />
            </div>
            <div className="text-xs text-gray-300 py-3 space-y-1">
              <p className="font-semibold text-white">La contraseña debe contener:</p>
              <p className={`flex items-center gap-1.5 ${hasNumber ? 'text-verde' : ''}`}>
                {hasNumber ? <Check className="w-3.5 h-3.5" /> : <span>•</span>} Al menos 1 número
              </p>
              <p className={`flex items-center gap-1.5 ${hasUpperAndLower ? 'text-verde' : ''}`}>
                {hasUpperAndLower ? <Check className="w-3.5 h-3.5" /> : <span>•</span>} Mayúscula y
                minúscula
              </p>
              <p className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-verde' : ''}`}>
                {hasSpecialChar ? <Check className="w-3.5 h-3.5" /> : <span>•</span>} Al menos 1
                carácter especial (!@#$...)
              </p>
              <p className={`flex items-center gap-1.5 ${hasMinLength ? 'text-verde' : ''}`}>
                {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <span>•</span>} Al menos 8
                caracteres
              </p>
            </div>

            {/* Repetir contraseña */}
            <div>
              <label htmlFor="match-password" className="block text-white text-sm font-semibold mb-2">
                Repetir contraseña:
              </label>
              <input
                type="password"
                id="match-password"
                required
                autoComplete="off"
                value={matchPassword}
                onChange={(e) => setMatchPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black/40 border border-verde rounded-3xl text-white py-2.5 px-6 w-full focus:outline-none focus:ring-2 focus:ring-verde"
              />
            </div>
            <p
              className={`text-xs py-3 flex items-center gap-1.5 ${
                matchPassword ? (passwordsMatch ? 'text-verde' : 'text-red-400') : 'text-gray-300'
              }`}
            >
              {matchPassword &&
                (passwordsMatch ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                ))}
              <span>
                Las contraseñas deben coincidir. <span className="font-bold">(*)</span>
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="text-xl transition ease-in-out font-bold text-white hover:text-verde py-6 uppercase flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin text-verde" />}
            <span>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</span>
          </button>

          <div className="text-center pt-6 border-t border-verde w-full md:w-4/5">
            <Link to="/login" className="text-white hover:underline">
              Si ya estás registrado, <span className="font-bold text-verde">inicia sesión.</span>
            </Link>
          </div>
        </form>
      </section>

      <Footer />
    </div>
  );
}