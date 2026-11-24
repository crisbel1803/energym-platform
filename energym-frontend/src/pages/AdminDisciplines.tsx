import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { PlusCircle, Trash2, Edit3, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AdminDisciplines() {
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    exerciseType: 'Fuerza',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDisciplines = useCallback(async () => {
    try {
      const res = await api.get('/gym/disciplines');
      if (res.data.ok) setDisciplines(res.data.data);
    } catch (error) {
      console.error('Error al cargar disciplinas', error);
    }
  }, []);

  useEffect(() => {
    fetchDisciplines();
  }, [fetchDisciplines]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description);
        formData.append('exerciseType', form.exerciseType);
        
        // Si seleccionó un archivo local, lo adjuntamos con la clave 'photo' (igual que en multer)
        if (selectedFile) {
        formData.append('photo', selectedFile);
        }

        // Axios detecta automáticamente el FormData y configura el header multipart/form-data
        if (isEditing && currentId) {
        await api.put(`/gym/disciplines/${currentId}`, formData);
        alert('Disciplina actualizada con éxito');
        } else {
        await api.post('/gym/disciplines', formData);
        alert('Disciplina creada con éxito');
        }

        setIsOpen(false);
        setIsEditing(false);
        setForm({ name: '', description: '', exerciseType: 'Fuerza' });
        setSelectedFile(null);
        fetchDisciplines();
    } catch (error) {
        console.error(error);
        alert('Error al guardar la disciplina');
    }
    };  

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar esta disciplina?')) return;
    try {
      await api.delete(`/gym/disciplines/${id}`);
      fetchDisciplines();
    } catch {
      alert('Error al eliminar');
    }
  };

  const openEdit = (d: any) => {
    setIsEditing(true);
    setCurrentId(d._id);
    setForm({ name: d.name, description: d.description, exerciseType: d.exerciseType });
    setSelectedFile(null);
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gris text-white flex flex-col justify-between fuenteTilt">
      <Navbar />
      <main className="max-w-6xl w-full mx-auto px-4 py-10 grow">
        <div className="flex justify-between items-center mb-8 bg-black/40 p-6 rounded-3xl border border-gray-800">
          <h1 className="text-3xl font-bold fuenteStar text-verde">Gestión de Disciplinas</h1>
          <button 
           onClick={() => {
            setIsEditing(false);
            setCurrentId(null);
            setForm({ name: '', description: '', exerciseType: 'Fuerza' });
            setSelectedFile(null);
            setIsOpen(true);
            }}
            className="bg-verde text-black font-bold py-2.5 px-6 rounded-3xl flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" /> Nueva Disciplina
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {disciplines.map(d => (
            <div key={d._id} className="bg-black/50 border border-gray-800 p-6 rounded-3xl space-y-3">
            {d.photoUrl && (
            <img 
                src={`${API_BASE}${d.photoUrl}`} // Cambia el puerto por el de tu backend si es diferente
                alt={d.name} 
                className="w-full h-32 object-cover rounded-2xl mb-2" 
            />
            )}
            <h3 className="text-xl font-bold text-verde fuenteStar">{d.name}</h3>
              <p className="text-xs bg-verde/10 text-verde px-3 py-1 rounded-full inline-block font-bold">{d.exerciseType}</p>
              <p className="text-sm text-gray-300">{d.description}</p>
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button onClick={() => openEdit(d)} className="flex-1 bg-blue-600/20 text-blue-400 py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"><Edit3 className="w-4 h-4"/> Editar</button>
                <button onClick={() => handleDelete(d._id)} className="flex-1 bg-red-600/20 text-red-400 py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"><Trash2 className="w-4 h-4"/> Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4">
          <form onSubmit={handleSubmit} className="bg-black border border-verde rounded-3xl max-w-md w-full p-6 space-y-4 text-white relative">
            <button type="button" onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400"><X/></button>
            <h2 className="text-xl font-bold fuenteStar text-verde text-center">{isEditing ? 'Editar Disciplina' : 'Nueva Disciplina'}</h2>
            <div>
              <label className="block text-xs mb-1">Nombre:</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm" />
            </div>
            <div>
              <label className="block text-xs mb-1">Tipo de Ejercicio:</label>
              <select value={form.exerciseType} onChange={e => setForm({...form, exerciseType: e.target.value})} className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm text-white">
                <option value="Fuerza">Fuerza</option>
                <option value="Cardio">Cardio</option>
                <option value="Yoga">Yoga</option>
                <option value="Funcional">Funcional</option>
                <option value="Baile">Baile</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Descripción:</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm" />
            </div>
            <div>
                <label className="block text-xs mb-1">Foto o Imagen Local:</label>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                    }
                    }} 
                    className="bg-gris border border-verde rounded-2xl w-full py-2 px-4 text-sm text-white file:mr-4 file:py-1 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-verde file:text-black hover:file:bg-verde/80 cursor-pointer" 
                />
            </div>
            <button type="submit" className="w-full bg-verde text-black font-bold py-3 rounded-2xl cursor-pointer">Guardar</button>
          </form>
        </div>
      )}
      <Footer />
    </div>
  );
}