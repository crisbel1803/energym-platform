/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GymCalendar from '../components/GymCalendar';
import api from '../services/api';
import { PlusCircle, X, Trash2, Edit3 } from 'lucide-react';

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

interface DisciplineOption {
  _id: string;
  name: string;
  exerciseType: string;
  description?: string;
}

const BASE_CLASS_DESCRIPTION = 'Entrenamiento guiado por instructores profesionales.';

// Convierte una fecha a formato local "YYYY-MM-DDTHH:mm" para datetime-local
function toLocalDateTimeInput(input?: string | Date): string {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

// Valida que la fecha/hora sea igual o posterior al momento exacto actual
function isFromNowOnward(target: Date, now: Date = new Date()): boolean {
  return !Number.isNaN(target.getTime()) && target.getTime() >= now.getTime();
}

function buildClassDescription(disciplineDesc?: string): string {
  const cleanDesc = disciplineDesc?.trim();
  return cleanDesc ? `${BASE_CLASS_DESCRIPTION} ${cleanDesc}` : BASE_CLASS_DESCRIPTION;
}

export default function AdminCalendar() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClassEventProps | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para los catálogos de la BD
  const [disciplinesList, setDisciplinesList] = useState<DisciplineOption[]>([]);
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);

  const [newClassData, setNewClassData] = useState({
    title: '',
    instructor: '',
    description: BASE_CLASS_DESCRIPTION,
    capacity: 20,
    price: 10,
    room: '',
    startDate: '',
  });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.ok) setEvents(res.data.events);
    } catch {
      // Sin backend activo
    }
  }, []);

  // Cargar eventos y catálogos (Disciplinas, Instructores, Salones) al montar
  useEffect(() => {
    fetchEvents();
    const fetchCatalogs = async () => {
      try {
        const [discRes, instRes, roomRes] = await Promise.all([
          api.get('/gym/disciplines'),
          api.get('/gym/instructors'),
          api.get('/gym/rooms'),
        ]);
        if (discRes.data.ok) setDisciplinesList(discRes.data.data);
        if (instRes.data.ok) setInstructorsList(instRes.data.data);
        if (roomRes.data.ok) setRoomsList(roomRes.data.data);
      } catch (error) {
        console.error('Error al cargar catálogos', error);
      }
    };
    fetchCatalogs();
  }, [fetchEvents]);

  const handleDisciplineChange = (disciplineName: string) => {
    const matched = disciplinesList.find((d) => d.name === disciplineName);
    setNewClassData((prev) => ({
      ...prev,
      title: disciplineName,
      description: buildClassDescription(matched?.description),
    }));
  };

  const handleDateClick = (arg: { dateStr: string }) => {
    setIsEditing(false);
    const clickedDate = new Date(arg.dateStr);
    const now = new Date();
    const safeStart = isFromNowOnward(clickedDate, now) ? clickedDate : now;

    setNewClassData({
      title: '',
      instructor: '',
      description: BASE_CLASS_DESCRIPTION,
      capacity: 20,
      price: 10,
      room: '',
      startDate: toLocalDateTimeInput(safeStart),
    });
    setIsCreateModalOpen(true);
  };

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

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDateObj = new Date(newClassData.startDate);

    if (!isFromNowOnward(startDateObj)) {
      alert('Solo puedes programar o mover clases a partir del momento exacto actual.');
      return;
    }

    const matchedDiscipline = disciplinesList.find((d) => d.name === newClassData.title);
    const combinedDescription = buildClassDescription(matchedDiscipline?.description);

    try {
      const payload = {
        title: newClassData.title,
        description: combinedDescription,
        discipline: newClassData.title,
        instructor: newClassData.instructor,
        room: newClassData.room,
        startDate: startDateObj.toISOString(),
        maxCapacity: Number(newClassData.capacity),
        cost: Number(newClassData.price),
        level: 'Todos los niveles',
      };

      if (isEditing && selectedEvent) {
        await api.put(`/classes/${selectedEvent.id}`, payload);
        alert('¡Clase actualizada exitosamente (duración: 1 hora)!');
      } else {
        await api.post('/classes', payload);
        alert('¡Clase programada exitosamente (duración: 1 hora)!');
      }

      setIsCreateModalOpen(false);
      setIsDetailModalOpen(false);
      setIsEditing(false);
      fetchEvents();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Error al guardar la clase en el servidor.');
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedEvent) return;
    if (!window.confirm(`¿Estás segura de eliminar la clase "${selectedEvent.title}"?`)) return;

    try {
      await api.delete(`/classes/${selectedEvent.id}`);
      alert('Clase eliminada correctamente.');
      setIsDetailModalOpen(false);
      fetchEvents();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Error al eliminar la clase.');
    }
  };

  const openEditModal = () => {
    if (!selectedEvent) return;
    const currentEventStart = new Date(selectedEvent.start);
    const now = new Date();
    const safeStart = isFromNowOnward(currentEventStart, now) ? currentEventStart : now;
    const matched = disciplinesList.find((d) => d.name === selectedEvent.title);

    setIsEditing(true);
    setNewClassData({
      title: selectedEvent.title,
      instructor: selectedEvent.extendedProps.instructor,
      description: matched?.description
        ? buildClassDescription(matched.description)
        : selectedEvent.extendedProps.description || BASE_CLASS_DESCRIPTION,
      capacity: selectedEvent.extendedProps.capacity,
      price: selectedEvent.extendedProps.price,
      room: selectedEvent.extendedProps.room,
      startDate: toLocalDateTimeInput(safeStart),
    });
    setIsDetailModalOpen(false);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gris text-white fuenteTilt flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 py-10 grow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-black/40 p-6 rounded-3xl border border-gray-800">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold fuenteStar text-verde">
              Gestión de Horario (Admin)
            </h1>
            <p className="text-gray-300 text-sm mt-1">
              Todas las clases duran exactamente 60 minutos y se programan o editan desde el momento actual en adelante.
            </p>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setNewClassData((prev) => ({
                ...prev,
                title: '',
                description: BASE_CLASS_DESCRIPTION,
                startDate: toLocalDateTimeInput(new Date()),
              }));
              setIsCreateModalOpen(true);
            }}
            className="bg-verde hover:bg-verde/80 text-black font-bold py-3 px-6 rounded-3xl flex items-center gap-2 transition shadow-lg shadow-verde/20 cursor-pointer uppercase text-sm tracking-wider"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Nueva Clase</span>
          </button>
        </div>

        <GymCalendar
          events={events}
          editable={true}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      </main>

      {/* MODAL CREAR / EDITAR CLASE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveClass}
            className="bg-black border border-verde rounded-3xl max-w-md w-full p-6 relative space-y-4 text-white"
          >
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-verde cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold fuenteStar text-verde text-center uppercase">
              {isEditing ? 'Editar Clase' : 'Programar Nueva Clase'}
            </h2>

            {/* Selector de Disciplina */}
            <div>
              <label className="block text-xs font-semibold mb-1">Disciplina / Clase:</label>
              <select
                required
                value={newClassData.title}
                onChange={(e) => handleDisciplineChange(e.target.value)}
                className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm focus:outline-none text-white"
              >
                <option value="">Selecciona una disciplina</option>
                {disciplinesList.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name} ({d.exerciseType})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Instructor */}
            <div>
              <label className="block text-xs font-semibold mb-1">Instructor:</label>
              <select
                required
                value={newClassData.instructor}
                onChange={(e) => setNewClassData({ ...newClassData, instructor: e.target.value })}
                className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm focus:outline-none text-white"
              >
                <option value="">Selecciona un instructor</option>
                {instructorsList.map((i: any) => (
                  <option key={i._id} value={i.name}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Salón */}
            <div>
              <label className="block text-xs font-semibold mb-1">Salón:</label>
              <select
                required
                value={newClassData.room}
                onChange={(e) => setNewClassData({ ...newClassData, room: e.target.value })}
                className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm focus:outline-none text-white"
              >
                <option value="">Selecciona un salón</option>
                {roomsList.map((r: any) => (
                  <option key={r._id} value={r.name}>
                    {r.name} (Capacidad: {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Precio ($ USD):</label>
                <input
                  type="number"
                  value={newClassData.price}
                  onChange={(e) => setNewClassData({ ...newClassData, price: Number(e.target.value) })}
                  className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Cupos Máximos:</label>
                <input
                  type="number"
                  value={newClassData.capacity}
                  onChange={(e) =>
                    setNewClassData({ ...newClassData, capacity: Number(e.target.value) })
                  }
                  className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm focus:outline-none text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Fecha y Hora de Inicio:</label>
              <input
                type="datetime-local"
                required
                min={toLocalDateTimeInput(new Date())}
                value={newClassData.startDate}
                onChange={(e) => setNewClassData({ ...newClassData, startDate: e.target.value })}
                className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm focus:outline-none text-white"
              />
              <p className="text-[11px] text-verde mt-1">
                Duración automática: 60 minutos (1 hora exacta).
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-verde hover:bg-verde/80 text-black font-bold py-3 rounded-2xl uppercase tracking-wider text-sm transition mt-4 cursor-pointer"
            >
              {isEditing ? 'Guardar Cambios' : 'Guardar y Programar Clase'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL DETALLES / GESTIÓN DE CLASE EXISTENTE */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4">
          <div className="bg-black border border-verde rounded-3xl max-w-md w-full p-6 relative space-y-4 text-white">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-verde cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold fuenteStar text-verde text-center uppercase">
              {selectedEvent.title}
            </h2>

            <div className="space-y-2 text-sm bg-gris/40 p-4 rounded-2xl border border-gray-800">
              <p className="text-gray-300">
                Instructor/a:{' '}
                <span className="text-white font-semibold">
                  {selectedEvent.extendedProps.instructor}
                </span>
              </p>
              <p className="text-gray-300">
                Salón:{' '}
                <span className="text-white font-semibold">{selectedEvent.extendedProps.room}</span>
              </p>
              <p className="text-gray-300">
                Descripción:{' '}
                <span className="text-white">{selectedEvent.extendedProps.description}</span>
              </p>
              <p className="text-verde font-bold pt-2 border-t border-gray-700">
                Precio: ${selectedEvent.extendedProps.price} USD | Cupos:{' '}
                {selectedEvent.extendedProps.capacity} | Duración: 1h
              </p>
            </div>

            {/* BOTONES DE EDICIÓN Y ELIMINACIÓN PARA ADMIN */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={openEditModal}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={handleDeleteClass}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}