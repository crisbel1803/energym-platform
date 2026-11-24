import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import {
  Search,
  Filter,
  Dumbbell,
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface Discipline {
  _id: string;
  name: string;
  description: string;
  exerciseType: string;
  photoUrl?: string;
}

export default function DisciplinesCatalog() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    document.title = 'Disciplinas y Entrenamiento Grupal | ENERGYM Fitness Club';

    const metaDescriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescriptionTag?.getAttribute('content') ?? null;
    const seoDescription =
      'Explora el catálogo completo de disciplinas de ENERGYM Fitness Club: fuerza, cardio, yoga, funcional, baile y más. Filtra por categoría y reserva tu clase.';

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
    const fetchDisciplines = async () => {
      try {
        const res = await api.get('/gym/disciplines');
        if (res.data.ok) {
          setDisciplines(res.data.data);
        }
      } catch (error) {
        console.error('Error al cargar disciplinas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDisciplines();
  }, []);

  // Extrae automáticamente los tipos únicos registrados + opciones base
  const categories = useMemo(() => {
    const base = ['Fuerza', 'Cardio', 'Yoga', 'Funcional', 'Baile'];
    const dynamic = disciplines.map((d) => d.exerciseType).filter(Boolean);
    return Array.from(new Set([...base, ...dynamic]));
  }, [disciplines]);

  const filteredDisciplines = useMemo(() => {
    return disciplines.filter((d) => {
      const matchesType =
        selectedType === 'todos' ||
        d.exerciseType?.toLowerCase() === selectedType.toLowerCase();
      const matchesSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [disciplines, selectedType, searchTerm]);

  const hasActiveFilters = selectedType !== 'todos' || searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt overflow-x-clip selection:bg-verde selection:text-black">
      <Navbar />

      <main className="relative max-w-6xl w-full mx-auto px-4 py-10 sm:py-14 grow">
        {/* Elementos gráficos de fondo sutiles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[320px] sm:w-[540px] h-[200px] rounded-full bg-verde/10 blur-3xl animate-pulse"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-15 [background-image:radial-gradient(rgba(0,194,79,0.45)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        {/* Encabezado */}
        <header className="relative z-10 text-center mb-8 sm:mb-10 space-y-3">
          <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-widest bg-verde/10 text-verde border border-verde/35 px-4 py-1.5 rounded-full font-bold shadow-sm shadow-verde/10">
            <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
            <span>Catálogo Energym</span>
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold fuenteStar leading-tight">
            <span className="text-verde">Nuestras</span> Disciplinas
          </h1>

          <p className="text-gray-300 max-w-2xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
            Explora todas nuestras clases, filtra por tipo de entrenamiento y encuentra la rutina ideal para tus objetivos de fuerza, resistencia, movilidad o ritmo.
          </p>
        </header>

        {/* Panel de Filtros */}
        <section
          aria-label="Filtros de disciplinas"
          className="relative z-10 bg-black/65 backdrop-blur-sm border border-gray-800 hover:border-verde/40 transition-colors duration-300 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl mb-8 sm:mb-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buscador por nombre */}
            <div>
              <label
                htmlFor="filtro-busqueda"
                className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-2"
              >
                <Search className="w-3.5 h-3.5 text-verde shrink-0" />
                <span>Buscar disciplina</span>
              </label>
              <input
                id="filtro-busqueda"
                type="text"
                placeholder="Ej. Spinning, Yoga, Funcional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gris border border-gray-700 focus:border-verde rounded-2xl w-full py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-verde/50 transition"
              />
            </div>

            {/* Filtro por Categoría / Tipo de Ejercicio */}
            <div>
              <label
                htmlFor="filtro-categoria"
                className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-2"
              >
                <Filter className="w-3.5 h-3.5 text-verde shrink-0" />
                <span>Filtrar por Categoría</span>
              </label>
              <select
                id="filtro-categoria"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gris border border-gray-700 focus:border-verde rounded-2xl w-full py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-verde/50 transition cursor-pointer"
              >
                <option value="todos">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pills rápidos de categorías */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-gray-800/80">
            <button
              type="button"
              onClick={() => setSelectedType('todos')}
              className={`text-xs px-3.5 sm:px-4 py-1.5 rounded-full font-bold transition-all duration-200 active:scale-[0.97] cursor-pointer ${
                selectedType === 'todos'
                  ? 'bg-verde text-black shadow-sm shadow-verde/30'
                  : 'bg-gris text-gray-300 hover:border-verde hover:text-verde border border-gray-700'
              }`}
            >
              Todas ({disciplines.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedType(cat)}
                className={`text-xs px-3.5 sm:px-4 py-1.5 rounded-full font-bold transition-all duration-200 active:scale-[0.97] cursor-pointer ${
                  selectedType.toLowerCase() === cat.toLowerCase()
                    ? 'bg-verde text-black shadow-sm shadow-verde/30'
                    : 'bg-gris text-gray-300 hover:border-verde hover:text-verde border border-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType('todos');
                  setSearchTerm('');
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-verde hover:underline px-2 py-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {!loading && (
            <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between">
              <span>
                Mostrando <strong className="text-verde">{filteredDisciplines.length}</strong> de{' '}
                <strong className="text-gray-200">{disciplines.length}</strong> disciplinas disponibles
              </span>
            </div>
          )}
        </section>

        {/* Grid de Resultados */}
        <section aria-label="Listado de disciplinas" className="relative z-10">
          {loading ? (
            <div className="bg-black/40 border border-gray-800 rounded-3xl text-center py-16 px-4 space-y-3">
              <Dumbbell className="w-10 h-10 text-verde animate-bounce mx-auto" />
              <p className="text-gray-300 text-sm font-semibold">Cargando disciplinas...</p>
            </div>
          ) : filteredDisciplines.length === 0 ? (
            <div className="bg-black/40 border border-gray-800 rounded-2xl sm:rounded-3xl text-center py-14 px-4 space-y-3">
              <Dumbbell className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-base sm:text-lg font-semibold text-gray-300">
                No hay disciplinas que coincidan con tu búsqueda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedType('todos');
                  setSearchTerm('');
                }}
                className="mt-2 inline-flex items-center gap-2 text-xs font-bold bg-verde hover:bg-verde/85 text-black px-5 py-2.5 rounded-full transition-all duration-200 active:scale-[0.97] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredDisciplines.map((d) => (
                <article
                  key={d._id}
                  className="group bg-black/65 border border-gray-800 hover:border-verde rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-verde/10 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div>
                    {d.photoUrl ? (
                      <div className="relative h-44 sm:h-48 overflow-hidden">
                        <img
                          src={`${API_BASE}${d.photoUrl}`}
                          alt={`Disciplina ${d.name} (${d.exerciseType}) en ENERGYM Fitness Club`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20"
                        />
                        <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-verde border border-verde/45 text-xs font-bold px-3 py-1 rounded-full shadow">
                          {d.exerciseType}
                        </span>
                      </div>
                    ) : (
                      <div className="h-44 sm:h-48 bg-gradient-to-br from-gray-900 via-black to-gris flex items-center justify-center relative overflow-hidden">
                        <div
                          aria-hidden="true"
                          className="absolute w-28 h-28 rounded-full bg-verde/10 blur-2xl group-hover:bg-verde/20 transition-colors"
                        />
                        <Dumbbell className="relative w-12 h-12 text-verde/50 group-hover:scale-110 group-hover:text-verde transition-all duration-300" />
                        <span className="absolute top-3 right-3 bg-verde/10 text-verde border border-verde/30 text-xs font-bold px-3 py-1 rounded-full">
                          {d.exerciseType}
                        </span>
                      </div>
                    )}

                    <div className="p-5 sm:p-6 space-y-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-verde fuenteStar group-hover:text-white transition-colors">
                        {d.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        {d.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2">
                    <Link
                      to="/clases"
                      className="group/btn relative overflow-hidden w-full inline-flex items-center justify-center gap-2 font-bold text-xs sm:text-sm border-2 border-verde bg-black/50 hover:bg-verde text-white hover:text-black py-2.5 px-6 rounded-2xl transition-all duration-300 active:scale-[0.98]"
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Ver en Horario</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1 shrink-0" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* SECCIÓN CTA LLAMATIVA */}
        <section
          aria-labelledby="catalog-cta-heading"
          className="relative z-10 mt-12 sm:mt-16"
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-verde/50 bg-gradient-to-r from-black via-gris to-black p-6 sm:p-8 md:p-10 shadow-2xl shadow-verde/10">
            {/* Elementos gráficos de ritmo y energía */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-14 w-56 h-56 rounded-full bg-verde/15 blur-3xl animate-pulse"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-14 -bottom-14 w-56 h-56 rounded-full bg-verde/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none hidden md:flex absolute right-8 top-6 items-end gap-1.5 opacity-30"
            >
              <span className="w-2 h-5 rounded-full bg-verde animate-pulse" />
              <span className="w-2 h-9 rounded-full bg-verde animate-pulse [animation-delay:150ms]" />
              <span className="w-2 h-6 rounded-full bg-verde animate-pulse [animation-delay:300ms]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-3 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-verde bg-verde/10 border border-verde/30 px-3.5 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span>¿Listo para entrenar?</span>
                </span>

                <h2
                  id="catalog-cta-heading"
                  className="text-2xl sm:text-3xl font-extrabold fuenteStar text-white leading-tight"
                >
                  Encuentra tu clase ideal y <span className="text-verde">reserva tu cupo hoy</span>
                </h2>

                <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                  Revisa los horarios semanales disponibles, elige el salón y el instructor de tu preferencia y asegura tu lugar al instante.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-300 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-verde shrink-0" />
                    <span>Confirmación rápida de cupo</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-verde shrink-0" />
                    <span>Múltiples estilos y niveles</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0 w-full lg:w-auto">
                <Link
                  to="/clases"
                  className="group relative overflow-hidden bg-verde hover:bg-verde/90 text-black font-extrabold py-3.5 px-6 sm:px-7 rounded-2xl transition-all duration-300 shadow-lg shadow-verde/30 hover:shadow-xl hover:shadow-verde/50 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs md:text-sm tracking-wider inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span className="relative z-10">Ver Horarios Disponibles</span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </Link>

                <Link
                  to="/register"
                  className="border border-verde/70 hover:border-verde bg-black/60 hover:bg-verde/15 text-white hover:text-verde font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs md:text-sm tracking-wider text-center w-full sm:w-auto"
                >
                  Unirme a ENERGYM
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}