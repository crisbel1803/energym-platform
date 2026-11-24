import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GymCalendar from '../components/GymCalendar';
import api from '../services/api';
import {
  X,
  Clock,
  MapPin,
  DollarSign,
  Flame,
  Layers,
  Award,
  UserCheck,
  Dumbbell,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Zap,
  Activity,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface ClassEventProps {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    instructor: string;
    description: string;
    capacity: number;
    price: number;
    room: string;
  };
}

interface DisciplineItem {
  _id: string;
  name: string;
}

interface InstructorItem {
  _id: string;
  name: string;
  photoUrl?: string;
  disciplines?: (string | DisciplineItem)[];
}

const DISCIPLINE_CATEGORIES = [
  {
    id: 'card-class-1',
    title: 'Combate y Defensa',
    subtitle: 'Boxeo, Defensa Personal y Fit Combat',
    tag: 'Alta Intensidad',
    bgImage: '/images/CombateyDefensa-bg.png',
    alt: 'Clase de combate y defensa personal en ENERGYM Fitness Club con entrenamiento de alta intensidad',
  },
  {
    id: 'card-class-2',
    title: 'Flexibilidad y Control',
    subtitle: 'Pilates, Stretching y Yoga',
    tag: 'Cuerpo y Mente',
    bgImage: '/images/FlexibilidadyControl-bg.png',
    alt: 'Sesión de yoga, pilates y stretching para flexibilidad y control corporal en ENERGYM',
  },
  {
    id: 'card-class-3',
    title: 'Cardio de Impacto',
    subtitle: 'Spinning, Xtreme Bike y Training Bike',
    tag: 'Resistencia',
    bgImage: '/images/CardiodeImpacto-bg.png',
    alt: 'Entrenamiento cardiovascular en bicicleta indoor, spinning y xtreme bike en ENERGYM',
  },
  {
    id: 'card-class-4',
    title: 'Ritmo y Energía',
    subtitle: 'Baile, Zumba y Step',
    tag: 'Dinámico',
    bgImage: '/images/RitmoyEnergia-bg.png',
    alt: 'Clases grupales dinámicas de baile, zumba y step en ENERGYM Fitness Club',
  },
];

function getRandomInstructors(list: InstructorItem[], count = 4): InstructorItem[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export default function Home() {
  const [events, setEvents] = useState<ClassEventProps[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ClassEventProps | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [featuredInstructors, setFeaturedInstructors] = useState<InstructorItem[]>([]);

  useEffect(() => {
    document.title = 'ENERGYM Fitness Club | Clases Grupales, Horarios y Reserva Online';

    const metaDescriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescriptionTag?.getAttribute('content') ?? null;
    const seoDescription =
      'Entrena en ENERGYM Fitness Club: consulta horarios semanales, reserva tus clases de combate, yoga, spinning y baile al instante y entrena con coaches profesionales.';

    if (metaDescriptionTag) {
      metaDescriptionTag.setAttribute('content', seoDescription);
    } else {
      const createdMeta = document.createElement('meta');
      createdMeta.name = 'description';
      createdMeta.content = seoDescription;
      document.head.appendChild(createdMeta);
    }

    return () => {
      if (metaDescriptionTag && previousDescription !== null) {
        metaDescriptionTag.setAttribute('content', previousDescription);
      }
    };
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        if (res.data.ok && res.data.events.length > 0) {
          setEvents(res.data.events);
        }
      } catch (error) {
        console.error('Error al cargar clases en el home:', error);
      }
    };

    const fetchRandomInstructors = async () => {
      try {
        const res = await api.get('/gym/instructors');
        if (res.data.ok && Array.isArray(res.data.data)) {
          setFeaturedInstructors(getRandomInstructors(res.data.data, 4));
        }
      } catch (error) {
        console.error('Error al cargar instructores en el home:', error);
      }
    };

    fetchClasses();
    fetchRandomInstructors();
  }, []);

  const handleEventClick = (info: {
    event: {
      id: string;
      title: string;
      startStr: string;
      endStr: string;
      extendedProps: Record<string, unknown>;
    };
  }) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      extendedProps: info.event.extendedProps as ClassEventProps['extendedProps'],
    });
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white fuenteTilt flex flex-col justify-between overflow-x-clip selection:bg-verde selection:text-black">
      <Navbar />

      <main className="grow">
        {/* HERO SECTION */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden py-14 sm:py-20 md:py-24 px-4 text-center bg-gradient-to-b from-gris via-black to-black border-b border-verde/20"
        >
          {/* Patrón geométrico de retícula energética */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(0,194,79,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,194,79,0.16)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"
          />

          {/* Halos ambientales animados */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] sm:w-[520px] h-[220px] sm:h-[280px] rounded-full bg-verde/15 blur-3xl animate-pulse"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none hidden sm:block absolute top-12 left-10 w-24 h-24 rounded-full border border-verde/20 animate-ping [animation-duration:4s]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none hidden sm:block absolute bottom-12 right-12 w-32 h-32 rounded-full border border-verde/15 animate-pulse"
          />

          {/* Línea SVG decorativa de pulso energético */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
            className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-10 sm:h-14 text-verde/25"
          >
            <path
              d="M0,45 L380,45 L410,20 L435,68 L465,12 L495,58 L520,45 L1200,45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>

          <div className="relative z-10 max-w-4xl mx-auto space-y-5 sm:space-y-6">
            <span className="inline-flex items-center gap-2 bg-verde/10 text-verde border border-verde/35 px-3.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest uppercase shadow-sm shadow-verde/15">
              <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span>ENERGYM Fitness Club ⚡</span>
            </span>

            <h1
              id="hero-heading"
              className="text-3xl sm:text-5xl md:text-6xl font-extrabold fuenteStar text-white leading-tight tracking-tight px-1"
            >
              Lleva tu rendimiento al <span className="text-verde">siguiente nivel</span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2">
              Explora nuestra programación semanal, descubre disciplinas de alta intensidad y asegura tu espacio al instante con coaches especializados.
            </p>

            {/* Indicadores visuales rápidos */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs text-gray-300">
              <span className="inline-flex items-center gap-1.5 bg-black/60 border border-gray-800 px-3 py-1 rounded-full">
                <Zap className="w-3.5 h-3.5 text-verde" />
                <span>Reserva en segundos</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-black/60 border border-gray-800 px-3 py-1 rounded-full">
                <Activity className="w-3.5 h-3.5 text-verde" />
                <span>Sesiones de 60 min</span>
              </span>
            </div>

            <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              <Link
                to="/clases"
                className="group relative overflow-hidden bg-verde hover:bg-verde/90 text-black font-bold py-3.5 px-7 sm:px-8 rounded-3xl transition-all duration-300 shadow-lg shadow-verde/25 hover:shadow-xl hover:shadow-verde/40 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs sm:text-sm tracking-wider inline-flex items-center justify-center gap-2"
              >
                <span className="relative z-10">Ver Horarios</span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                />
              </Link>

              <Link
                to="/disciplinas"
                className="group border-2 border-verde hover:bg-verde hover:text-black text-white font-bold py-3.5 px-7 sm:px-8 rounded-3xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs sm:text-sm tracking-wider inline-flex items-center justify-center gap-2"
              >
                <span>Ver Disciplinas</span>
              </Link>
              <Link
                to="/tienda"
                className="group border border-verde/70 hover:border-verde bg-black/70 hover:bg-verde/15 text-verde font-bold py-3.5 px-7 sm:px-8 rounded-3xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs sm:text-sm tracking-wider inline-flex items-center justify-center gap-2"
              >
                <Dumbbell className="w-4 h-4 shrink-0" />
                <span>Tienda Fit</span>
              </Link>
            </div>
          </div>
        </section>

        {/* MOTIVACIÓN, VARIEDAD Y GUÍA PRO */}
        <section
          aria-labelledby="pilares-heading"
          className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16"
        >
          <div className="text-center mb-10 sm:mb-12 space-y-2.5">
            <div className="inline-flex items-center gap-2 text-verde text-xs font-bold uppercase tracking-widest">
              <span className="w-6 h-0.5 bg-verde/60 rounded-full" />
              <span>Experiencia ENERGYM</span>
              <span className="w-6 h-0.5 bg-verde/60 rounded-full" />
            </div>
            <h2
              id="pilares-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold fuenteStar text-white"
            >
              Entrena con <span className="text-verde">Propósito</span>
            </h2>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
              Todo lo que necesitas para mantenerte constante, disfrutar cada sesión y avanzar a tu ritmo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <article className="group relative overflow-hidden bg-gris/80 border border-gray-800 hover:border-verde/70 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-verde/10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full bg-verde/10 blur-xl group-hover:bg-verde/20 transition-colors"
              />
              <div className="relative w-14 h-14 mx-auto rounded-2xl bg-verde/15 text-verde border border-verde/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-verde group-hover:text-black">
                <Flame className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold fuenteStar text-verde uppercase">
                Motivación
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Un espacio vibrante y una comunidad que te impulsa a dar lo mejor de ti en cada entrenamiento.
              </p>
              <div className="pt-1 flex justify-center gap-1">
                <span className="w-8 h-1 rounded-full bg-verde/50 group-hover:w-12 group-hover:bg-verde transition-all duration-300" />
              </div>
            </article>

            <article className="group relative overflow-hidden bg-gris/80 border border-gray-800 hover:border-verde/70 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-verde/10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full bg-verde/10 blur-xl group-hover:bg-verde/20 transition-colors"
              />
              <div className="relative w-14 h-14 mx-auto rounded-2xl bg-verde/15 text-verde border border-verde/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-verde group-hover:text-black">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold fuenteStar text-verde uppercase">
                Variedad
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Amplia selección de clases grupales para combinar fuerza, cardio, movilidad y ritmo sin aburrirte.
              </p>
              <div className="pt-1 flex justify-center gap-1">
                <span className="w-8 h-1 rounded-full bg-verde/50 group-hover:w-12 group-hover:bg-verde transition-all duration-300" />
              </div>
            </article>

            <article className="group relative overflow-hidden bg-gris/80 border border-gray-800 hover:border-verde/70 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-verde/10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full bg-verde/10 blur-xl group-hover:bg-verde/20 transition-colors"
              />
              <div className="relative w-14 h-14 mx-auto rounded-2xl bg-verde/15 text-verde border border-verde/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-verde group-hover:text-black">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold fuenteStar text-verde uppercase">
                Guía Pro
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Coaches preparados que cuidan tu postura, ajustan la exigencia y te acompañan en cada meta.
              </p>
              <div className="pt-1 flex justify-center gap-1">
                <span className="w-8 h-1 rounded-full bg-verde/50 group-hover:w-12 group-hover:bg-verde transition-all duration-300" />
              </div>
            </article>
          </div>
        </section>

        {/* DISCIPLINAS (4 TARJETAS CON FONDO COMPLETO) */}
        <section
          aria-labelledby="disciplinas-heading"
          className="relative overflow-hidden bg-gris/50 border-y border-verde/15 py-12 sm:py-16 px-4"
        >
          {/* Patrón de puntos decorativo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(0,194,79,0.5)_1px,transparent_1px)] [background-size:20px_20px]"
          />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 space-y-2.5">
              <div className="inline-flex items-center gap-2 text-verde text-xs font-bold uppercase tracking-widest">
                <span className="w-6 h-0.5 bg-verde/60 rounded-full" />
                <span>Entrenamiento Grupal</span>
                <span className="w-6 h-0.5 bg-verde/60 rounded-full" />
              </div>
              <h2
                id="disciplinas-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold fuenteStar text-white"
              >
                Nuestras <span className="text-verde">Disciplinas</span>
              </h2>
              <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto">
                Descubre estilos de entrenamiento para cada objetivo y filtra todo el catálogo
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {DISCIPLINE_CATEGORIES.map((cat) => (
                <article
                  key={cat.id}
                  id={cat.id}
                  className="group relative overflow-hidden transition-all ease-out cardreveal flex flex-col justify-between items-center min-h-72 sm:min-h-88 text-center p-5 sm:p-6 bg-gray-900 border border-gray-800 hover:border-verde rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-verde/15 hover:-translate-y-1.5 hover:scale-[1.02] duration-300"
                >
                  {/* Imagen de fondo completa */}
                  <img
                    src={cat.bgImage}
                    alt={cat.alt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Degradado de contraste para legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30 pointer-events-none" />

                  <span className="relative z-10 text-[11px] uppercase tracking-wider bg-black/75 border border-verde/50 text-verde px-3.5 py-1 rounded-full font-bold shadow transition-transform duration-300 group-hover:scale-105">
                    {cat.tag}
                  </span>

                  <div className="relative z-10 my-4 space-y-1.5 sm:space-y-2">
                    <h3 className="uppercase font-extrabold text-lg sm:text-xl text-white fuenteStar drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] group-hover:text-verde transition-colors duration-300">
                      {cat.title}
                    </h3>
                    <p className="text-gray-100 font-semibold text-xs sm:text-sm md:text-base py-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                      {cat.subtitle}
                    </p>
                  </div>

                  <Link
                    to="/disciplinas"
                    className="group/btn relative z-10 overflow-hidden transition-all duration-300 ease-out font-bold border-2 border-verde bg-black/70 hover:bg-verde hover:text-black text-white py-2.5 px-6 sm:px-7 rounded-3xl mt-auto shadow-lg active:scale-[0.97] inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm w-full sm:w-auto"
                  >
                    <span>Ver disciplinas</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* INSTRUCTORES (4 ALEATORIOS EN CADA RECARGA) */}
        <section
          aria-labelledby="instructores-heading"
          className="max-w-7xl mx-auto px-4 py-12 sm:py-16"
        >
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 sm:mb-10 gap-3 sm:gap-4">
            <div className="text-center md:text-left">
              <h2
                id="instructores-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold fuenteStar text-white"
              >
                Nuestros <span className="text-verde">Instructores</span>
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1">
                Conoce parte de nuestro equipo en cada visita
              </p>
            </div>
            <Link
              to="/clases"
              className="group text-xs sm:text-sm font-bold text-verde hover:text-verde/85 inline-flex items-center gap-1.5 bg-verde/10 border border-verde/30 px-4 py-2 rounded-full transition"
            >
              <span>Ver clases disponibles</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {featuredInstructors.length === 0 ? (
            <div className="bg-gris/60 border border-gray-800 rounded-2xl sm:rounded-3xl p-8 text-center text-gray-400 text-sm">
              Aún no hay instructores registrados para mostrar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {featuredInstructors.map((inst) => (
                <article
                  key={inst._id}
                  className="group bg-gris/80 border border-gray-800 hover:border-verde rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-verde/10 transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
                >
                  {inst.photoUrl ? (
                    <div className="relative overflow-hidden h-48 sm:h-52">
                      <img
                        src={`${API_BASE}${inst.photoUrl}`}
                        alt={`Instructor ${inst.name} en ENERGYM Fitness Club`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-gris via-transparent to-transparent opacity-80"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 sm:h-52 bg-black/60 flex items-center justify-center">
                      <UserCheck className="w-14 h-14 text-verde/40 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  )}

                  <div className="p-4 sm:p-5 space-y-2 grow flex flex-col justify-between">
                    <h3 className="text-lg sm:text-xl font-bold text-verde fuenteStar">
                      {inst.name}
                    </h3>
                    {Array.isArray(inst.disciplines) && inst.disciplines.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {inst.disciplines.map((disc, idx) => {
                          const label = typeof disc === 'string' ? disc : disc.name;
                          return (
                            <span
                              key={typeof disc === 'string' ? `${disc}-${idx}` : disc._id}
                              className="text-xs bg-verde/10 text-verde border border-verde/20 px-2.5 py-0.5 rounded-full font-semibold"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-verde" /> Coach Energym
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* SECCIÓN CTA DE ALTO IMPACTO */}
        <section
          aria-labelledby="cta-heading"
          className="max-w-7xl mx-auto px-4 pb-6 sm:pb-8"
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-verde/50 bg-gradient-to-r from-gris via-black to-gris p-6 sm:p-8 md:p-12 shadow-2xl shadow-verde/10">
            {/* Elementos gráficos decorativos */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(135deg,rgba(0,194,79,0.22)_1px,transparent_1px)] [background-size:24px_24px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-verde/15 blur-3xl animate-pulse"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -bottom-16 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-verde/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none hidden md:flex absolute right-8 top-6 items-center gap-1.5 opacity-30"
            >
              <span className="w-2 h-6 rounded-full bg-verde animate-pulse" />
              <span className="w-2 h-10 rounded-full bg-verde animate-pulse [animation-delay:200ms]" />
              <span className="w-2 h-4 rounded-full bg-verde animate-pulse [animation-delay:400ms]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
              <div className="max-w-2xl space-y-3 sm:space-y-4 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-verde bg-verde/10 border border-verde/30 px-3.5 py-1 rounded-full">
                  <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Cupos limitados por clase</span>
                </span>

                <h2
                  id="cta-heading"
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold fuenteStar text-white leading-tight"
                >
                  Asegura tu cupo hoy y <span className="text-verde">transforma tu rutina</span>
                </h2>

                <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                  Elige el horario que mejor se adapte a tu día, confirma tu reserva de forma rápida y entrena con el respaldo de todo el equipo de ENERGYM.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs text-gray-300 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-verde shrink-0" />
                    <span>Reserva inmediata y segura</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-verde shrink-0" />
                    <span>Clases grupales de 60 minutos</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 sm:gap-3.5 shrink-0 w-full lg:w-auto">
                <Link
                  to="/clases"
                  className="group relative overflow-hidden bg-verde hover:bg-verde/90 text-black font-extrabold py-3.5 sm:py-4 px-6 sm:px-7 rounded-2xl transition-all duration-300 shadow-lg shadow-verde/30 hover:shadow-xl hover:shadow-verde/50 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs md:text-sm tracking-wider inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span className="relative z-10">Reservar Clase Ahora</span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </Link>

                <Link
                  to="/register"
                  className="border border-verde/70 hover:border-verde bg-black/60 hover:bg-verde/15 text-white hover:text-verde font-bold py-3.5 sm:py-4 px-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs md:text-sm tracking-wider text-center w-full sm:w-auto"
                >
                  Crear Cuenta
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN CTA TIENDA FIT */}
        <section
          aria-labelledby="tienda-cta-heading"
          className="max-w-7xl mx-auto px-4 py-10 sm:py-14"
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-verde/45 bg-gradient-to-br from-gris via-black to-gris p-6 sm:p-8 md:p-12 shadow-2xl shadow-verde/10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -bottom-14 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-verde/15 blur-3xl"
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
              <div className="max-w-2xl space-y-3 sm:space-y-4 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-verde bg-verde/10 border border-verde/30 px-3.5 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Equipamiento y Nutrición</span>
                </span>

                <h2
                  id="tienda-cta-heading"
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold fuenteStar text-white leading-tight"
                >
                  Equípate para rendir más en <span className="text-verde">Tienda Fit</span>
                </h2>

                <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                  Encuentra ropa deportiva, suplementos, accesorios de entrenamiento e hidratación con retiro en sede y opciones de pago fáciles en USD.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 pt-1 text-[11px] sm:text-xs font-semibold text-gray-200">
                  <span className="bg-black/65 border border-gray-800 px-3 py-1 rounded-full">
                    Ropa Deportiva
                  </span>
                  <span className="bg-black/65 border border-gray-800 px-3 py-1 rounded-full">
                    Suplementos
                  </span>
                  <span className="bg-black/65 border border-gray-800 px-3 py-1 rounded-full">
                    Accesorios e Hidratación
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 sm:gap-3.5 shrink-0 w-full lg:w-auto">
                <Link
                  to="/tienda"
                  className="group relative overflow-hidden bg-verde hover:bg-verde/90 text-black font-extrabold py-3.5 sm:py-4 px-6 sm:px-7 rounded-2xl transition-all duration-300 shadow-lg shadow-verde/30 hover:shadow-xl hover:shadow-verde/50 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs md:text-sm tracking-wider inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span className="relative z-10">Ir a la Tienda Fit</span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </Link>

                <Link
                  to="/carrito"
                  className="border border-verde/70 hover:border-verde bg-black/60 hover:bg-verde/15 text-white hover:text-verde font-bold py-3.5 sm:py-4 px-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs md:text-sm tracking-wider text-center w-full sm:w-auto"
                >
                  Ver Carrito
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CALENDAR SECTION (SIN CAMBIOS EN SU LÓGICA) */}
        <section
          aria-labelledby="calendario-heading"
          className="max-w-7xl mx-auto px-4 py-12 sm:py-16 border-t border-verde/15"
        >
          <div className="text-center mb-8 sm:mb-10 space-y-2">
            <h2
              id="calendario-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold fuenteStar text-verde"
            >
              Calendario de Disponibilidad
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm max-w-xl mx-auto">
              Explora las clases de la semana, haz clic en cualquiera y conoce su información.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl sm:rounded-3xl">
            <GymCalendar events={events} onEventClick={handleEventClick} />
          </div>
        </section>
      </main>

      {/* Modal de Detalles de Clase */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-gris border border-verde rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-8 relative text-white shadow-2xl space-y-4">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              aria-label="Cerrar detalles de la clase"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-400 hover:text-verde cursor-pointer transition"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold fuenteStar text-center text-verde uppercase pr-6">
              {selectedEvent.title}
            </h2>
            <p className="text-center text-gray-300 text-xs sm:text-sm">
              Instructor/a:{' '}
              <span className="text-white font-semibold">
                {selectedEvent.extendedProps.instructor}
              </span>
            </p>

            <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-gray-800 text-xs sm:text-sm">
              <p className="text-gray-300">{selectedEvent.extendedProps.description}</p>

              <div className="flex items-center gap-2 text-gray-300 pt-2 border-t border-gray-700">
                <Clock className="w-4 h-4 text-verde shrink-0" />
                <span>
                  {new Date(selectedEvent.start).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(selectedEvent.end).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-verde shrink-0" />
                <span>Salón: {selectedEvent.extendedProps.room}</span>
              </div>

              <div className="flex items-center gap-2 text-verde font-bold">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>
                  ${selectedEvent.extendedProps.price} USD | Cupos:{' '}
                  {selectedEvent.extendedProps.capacity}
                </span>
              </div>
            </div>

            <Link
              to="/clases"
              className="group block w-full text-center bg-verde hover:bg-verde/85 text-black font-bold py-3 px-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] uppercase tracking-wider text-xs sm:text-sm"
            >
              Ir a Reservar
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}