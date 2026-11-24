import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import { Discipline } from '../models/Discipline';
import { Instructor } from '../models/Instructor';
import { Room } from '../models/Room';

dotenv.config();

const disciplinesSeed = [
  {
    name: 'Spinning',
    description: 'Ciclismo indoor de alta energía con intervalos de ritmo y resistencia.',
    exerciseType: 'Cardio',
  },
  {
    name: 'Funcional',
    description: 'Entrenamiento por circuitos enfocado en fuerza, agilidad y movimiento real.',
    exerciseType: 'Funcional',
  },
  {
    name: 'Yoga Flow',
    description: 'Secuencias fluidas para mejorar movilidad, equilibrio y respiración.',
    exerciseType: 'Yoga',
  },
  {
    name: 'HIIT',
    description: 'Bloques cortos de máxima intensidad para activar el sistema cardiovascular.',
    exerciseType: 'Cardio',
  },
  {
    name: 'Fuerza Total',
    description: 'Trabajo progresivo de musculatura y acondicionamiento físico general.',
    exerciseType: 'Fuerza',
  },
];

const instructorsSeed = [
  {
    name: 'Amelia',
    contactEmail: 'amelia@energym.com',
    phone: '0414-1000001',
    disciplinesNames: ['Spinning', 'HIIT'],
  },
  {
    name: 'Carlos Mendoza',
    contactEmail: 'carlos.mendoza@energym.com',
    phone: '0414-1000002',
    disciplinesNames: ['Funcional', 'Fuerza Total'],
  },
  {
    name: 'Valeria Rojas',
    contactEmail: 'valeria.rojas@energym.com',
    phone: '0414-1000003',
    disciplinesNames: ['Yoga Flow'],
  },
  {
    name: 'Diego Silva',
    contactEmail: 'diego.silva@energym.com',
    phone: '0414-1000004',
    disciplinesNames: ['HIIT', 'Funcional'],
  },
  {
    name: 'Sofía Herrera',
    contactEmail: 'sofia.herrera@energym.com',
    phone: '0414-1000005',
    disciplinesNames: ['Yoga Flow', 'Fuerza Total'],
  },
];

const roomsSeed = [
  {
    name: 'Sala Principal de Ciclismo y Cardio',
    location: 'Piso 1',
    capacity: 25,
    disciplinesNames: ['Spinning', 'HIIT'],
  },
  {
    name: 'Zona Funcional',
    location: 'Piso 1',
    capacity: 20,
    disciplinesNames: ['Funcional', 'Fuerza Total'],
  },
  {
    name: 'Estudio Zen',
    location: 'Piso 2',
    capacity: 15,
    disciplinesNames: ['Yoga Flow'],
  },
  {
    name: 'Box HIIT',
    location: 'Piso 2',
    capacity: 18,
    disciplinesNames: ['HIIT', 'Funcional'],
  },
  {
    name: 'Salón de Fuerza',
    location: 'Piso 1',
    capacity: 22,
    disciplinesNames: ['Fuerza Total', 'Funcional'],
  },
];

async function seedCatalogs() {
  const mongoUri =
    process.env.MONGO_URI_TEST || process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('No se encontró MONGO_URI_TEST en el archivo .env');
  }

  await mongoose.connect(mongoUri);
  console.log('Conectado a MongoDB. Sembrando catálogos sin imágenes...');

  // 1. Disciplinas (idempotente por name único)
  const disciplineMap = new Map<string, Types.ObjectId>();

  for (const disc of disciplinesSeed) {
    const doc = await Discipline.findOneAndUpdate(
      { name: disc.name },
      { $setOnInsert: disc },
      { new: true, upsert: true }
    );
    disciplineMap.set(disc.name, doc._id as Types.ObjectId);
  }

  // 2. Instructores (con ObjectIds reales de disciplinas)
  for (const inst of instructorsSeed) {
    const disciplineIds = inst.disciplinesNames
      .map((dName) => disciplineMap.get(dName))
      .filter((id): id is Types.ObjectId => Boolean(id));

    await Instructor.findOneAndUpdate(
      { name: inst.name },
      {
        $setOnInsert: {
          name: inst.name,
          contactEmail: inst.contactEmail,
          phone: inst.phone,
          disciplines: disciplineIds,
        },
      },
      { upsert: true }
    );
  }

  // 3. Salones (con ObjectIds reales de disciplinas soportadas)
  for (const room of roomsSeed) {
    const supportedIds = room.disciplinesNames
      .map((dName) => disciplineMap.get(dName))
      .filter((id): id is Types.ObjectId => Boolean(id));

    await Room.findOneAndUpdate(
      { name: room.name },
      {
        $setOnInsert: {
          name: room.name,
          location: room.location,
          capacity: room.capacity,
          supportedDisciplines: supportedIds,
        },
      },
      { upsert: true }
    );
  }

  console.log('¡Listo! 5 disciplinas, 5 instructores y 5 salones cargados sin imágenes.');
  await mongoose.disconnect();
}

seedCatalogs().catch((err) => {
  console.error('Error al ejecutar seedCatalogs:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});