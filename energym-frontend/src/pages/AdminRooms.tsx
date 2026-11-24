import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { PlusCircle, Trash2, Edit3, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface DisciplineItem {
  _id: string;
  name: string;
}

interface RoomItem {
  _id: string;
  name: string;
  location?: string;
  capacity: number;
  photoUrl?: string;
  supportedDisciplines?: (string | DisciplineItem)[];
}

export default function AdminRooms() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: 20,
    supportedDisciplines: [] as string[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [roomsRes, discRes] = await Promise.all([
        api.get('/gym/rooms'),
        api.get('/gym/disciplines'),
      ]);
      if (roomsRes.data.ok) setRooms(roomsRes.data.data);
      if (discRes.data.ok) setDisciplines(discRes.data.data);
    } catch (error) {
      console.error('Error al cargar salones o disciplinas', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleDiscipline = (id: string) => {
    setForm((prev) => {
      const exists = prev.supportedDisciplines.includes(id);
      return {
        ...prev,
        supportedDisciplines: exists
          ? prev.supportedDisciplines.filter((item) => item !== id)
          : [...prev.supportedDisciplines, id],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('location', form.location);
      formData.append('capacity', String(form.capacity));
      formData.append('supportedDisciplines', JSON.stringify(form.supportedDisciplines));

      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      if (isEditing && currentId) {
        await api.put(`/gym/rooms/${currentId}`, formData);
        alert('Salón actualizado con éxito');
      } else {
        await api.post('/gym/rooms', formData);
        alert('Salón creado con éxito');
      }

      setIsOpen(false);
      setIsEditing(false);
      setCurrentId(null);
      setForm({ name: '', location: '', capacity: 20, supportedDisciplines: [] });
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el salón');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este salón?')) return;
    try {
      await api.delete(`/gym/rooms/${id}`);
      fetchData();
    } catch {
      alert('Error al eliminar');
    }
  };

  const openCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setForm({ name: '', location: '', capacity: 20, supportedDisciplines: [] });
    setSelectedFile(null);
    setIsOpen(true);
  };

  const openEdit = (room: RoomItem) => {
    setIsEditing(true);
    setCurrentId(room._id);
    const mappedIds = Array.isArray(room.supportedDisciplines)
      ? room.supportedDisciplines.map((d) => (typeof d === 'string' ? d : d._id))
      : [];
    setForm({
      name: room.name || '',
      location: room.location || '',
      capacity: room.capacity ?? 20,
      supportedDisciplines: mappedIds,
    });
    setSelectedFile(null);
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt">
      <Navbar />
      <main className="max-w-6xl w-full mx-auto px-4 py-10 grow">
        <div className="flex justify-between items-center mb-8 bg-black/40 p-6 rounded-3xl border border-gray-800">
          <h1 className="text-3xl font-bold fuenteStar text-verde">Gestión de Salones</h1>
          <button
            onClick={openCreate}
            className="bg-verde text-black font-bold py-2.5 px-6 rounded-3xl flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" /> Nuevo Salón
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="bg-black/50 border border-gray-800 p-6 rounded-3xl space-y-3"
            >
              {room.photoUrl && (
                <img
                  src={`${API_BASE}${room.photoUrl}`}
                  alt={room.name}
                  className="w-full h-36 object-cover rounded-2xl mb-2"
                />
              )}
              <h3 className="text-xl font-bold text-verde fuenteStar">{room.name}</h3>
              {room.location && (
                <p className="text-xs text-gray-300">Ubicación: {room.location}</p>
              )}
              <p className="text-xs bg-verde/10 text-verde px-3 py-1 rounded-full inline-block font-bold">
                Capacidad: {room.capacity} personas
              </p>
              {Array.isArray(room.supportedDisciplines) && room.supportedDisciplines.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {room.supportedDisciplines.map((disc, idx) => {
                    const label = typeof disc === 'string' ? disc : disc.name;
                    return (
                      <span
                        key={typeof disc === 'string' ? `${disc}-${idx}` : disc._id}
                        className="text-xs bg-white/10 text-gray-200 px-2.5 py-0.5 rounded-full"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button
                  onClick={() => openEdit(room)}
                  className="flex-1 bg-blue-600/20 text-blue-400 py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(room._id)}
                  className="flex-1 bg-red-600/20 text-red-400 py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-black border border-verde rounded-3xl max-w-md w-full p-6 space-y-4 text-white relative max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 cursor-pointer"
            >
              <X />
            </button>
            <h2 className="text-xl font-bold fuenteStar text-verde text-center">
              {isEditing ? 'Editar Salón' : 'Nuevo Salón'}
            </h2>

            <div>
              <label className="block text-xs mb-1">Nombre del Salón:</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs mb-1">Ubicación:</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs mb-1">Capacidad:</label>
              <input
                type="number"
                min={1}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm"
              />
            </div>

            {disciplines.length > 0 && (
              <div>
                <label className="block text-xs mb-1">Disciplinas soportadas:</label>
                <div className="flex flex-wrap gap-2 bg-gris border border-verde/50 rounded-2xl p-3">
                  {disciplines.map((d) => {
                    const checked = form.supportedDisciplines.includes(d._id);
                    return (
                      <button
                        type="button"
                        key={d._id}
                        onClick={() => toggleDiscipline(d._id)}
                        className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition ${
                          checked
                            ? 'bg-verde text-black border-verde font-bold'
                            : 'bg-black/40 text-gray-300 border-gray-700'
                        }`}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs mb-1">Foto o Imagen Local:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm text-white file:mr-4 file:py-1 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-verde file:text-black hover:file:bg-verde/80 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-verde text-black font-bold py-3 rounded-2xl cursor-pointer"
            >
              Guardar
            </button>
          </form>
        </div>
      )}
      <Footer />
    </div>
  );
}