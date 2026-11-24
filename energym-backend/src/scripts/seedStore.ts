import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Product } from '../models/Product';

dotenv.config();

const sampleProducts = [
  // Ropa Deportiva (cada color como artículo independiente)
  {
    name: 'Suéter Oversize Energym',
    description: 'Corte oversize de algodón transpirable ideal para calentamiento y entrenamiento funcional.',
    category: 'Ropa Deportiva',
    color: 'Negro',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 24.0,
    stock: 8,
    isActive: true,
  },
  {
    name: 'Suéter Oversize Energym',
    description: 'Corte oversize de algodón transpirable ideal para calentamiento y entrenamiento funcional.',
    category: 'Ropa Deportiva',
    color: 'Verde Neón',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 24.0,
    stock: 6,
    isActive: true,
  },
  {
    name: 'Suéter Oversize Energym',
    description: 'Corte oversize de algodón transpirable ideal para calentamiento y entrenamiento funcional.',
    category: 'Ropa Deportiva',
    color: 'Gris Carbón',
    sizes: ['M', 'L', 'XL'],
    price: 24.0,
    stock: 5,
    isActive: true,
  },
  {
    name: 'Franela Dry-Fit Pro',
    description: 'Tela ligera de secado rápido diseñada para sesiones de alta intensidad y cardio.',
    category: 'Ropa Deportiva',
    color: 'Negro',
    sizes: ['S', 'M', 'L'],
    price: 18.0,
    stock: 10,
    isActive: true,
  },
  {
    name: 'Franela Dry-Fit Pro',
    description: 'Tela ligera de secado rápido diseñada para sesiones de alta intensidad y cardio.',
    category: 'Ropa Deportiva',
    color: 'Verde Esmeralda',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 18.0,
    stock: 7,
    isActive: true,
  },
  {
    name: 'Legging Cintura Alta Sculpt',
    description: 'Compresión cómoda y elasticidad en 4 direcciones para movilidad total en sala o yoga.',
    category: 'Ropa Deportiva',
    color: 'Negro',
    sizes: ['XS', 'S', 'M', 'L'],
    price: 26.0,
    stock: 9,
    isActive: true,
  },
  {
    name: 'Legging Cintura Alta Sculpt',
    description: 'Compresión cómoda y elasticidad en 4 direcciones para movilidad total en sala o yoga.',
    category: 'Ropa Deportiva',
    color: 'Vino',
    sizes: ['S', 'M', 'L'],
    price: 26.0,
    stock: 6,
    isActive: true,
  },
  {
    name: 'Short Deportivo Flex',
    description: 'Short ligero con cintura elástica para levantamiento, funcional o entrenamiento al aire libre.',
    category: 'Ropa Deportiva',
    color: 'Negro',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 16.0,
    stock: 12,
    isActive: true,
  },
  {
    name: 'Short Deportivo Flex',
    description: 'Short ligero con cintura elástica para levantamiento, funcional o entrenamiento al aire libre.',
    category: 'Ropa Deportiva',
    color: 'Verde Oliva',
    sizes: ['M', 'L', 'XL'],
    price: 16.0,
    stock: 5,
    isActive: true,
  },
  {
    name: 'Top Deportivo Racerback',
    description: 'Soporte medio con espalda deportiva y tejido suave para sesiones grupales.',
    category: 'Ropa Deportiva',
    color: 'Blanco',
    sizes: ['XS', 'S', 'M', 'L'],
    price: 19.0,
    stock: 8,
    isActive: true,
  },
  {
    name: 'Top Deportivo Racerback',
    description: 'Soporte medio con espalda deportiva y tejido suave para sesiones grupales.',
    category: 'Ropa Deportiva',
    color: 'Verde Neón',
    sizes: ['S', 'M', 'L'],
    price: 19.0,
    stock: 7,
    isActive: true,
  },
  {
    name: 'Joggers Training Fit',
    description: 'Pantalón deportivo entallado en tobillo con bolsillos con cierre para el gimnasio.',
    category: 'Ropa Deportiva',
    color: 'Negro',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 28.0,
    stock: 6,
    isActive: true,
  },

  // Suplementos
  {
    name: 'Whey Protein Isolate 2lb',
    description: 'Proteína de suero aislada de rápida absorción para recuperación muscular post-entreno.',
    category: 'Suplementos',
    color: 'Chocolate',
    sizes: ['2 lb'],
    price: 38.0,
    stock: 10,
    isActive: true,
  },
  {
    name: 'Whey Protein Isolate 2lb',
    description: 'Proteína de suero aislada de rápida absorción para recuperación muscular post-entreno.',
    category: 'Suplementos',
    color: 'Vainilla',
    sizes: ['2 lb'],
    price: 38.0,
    stock: 8,
    isActive: true,
  },
  {
    name: 'Creatina Monohidratada Micronizada',
    description: 'Creatina pura sin sabor para apoyar fuerza, potencia y rendimiento en series intensas.',
    category: 'Suplementos',
    color: 'Sin Sabor',
    sizes: ['300 g'],
    price: 22.0,
    stock: 14,
    isActive: true,
  },
  {
    name: 'Pre-Entreno Energy Rush',
    description: 'Fórmula pre-entrenamiento con cafeína anhidra, beta-alanina y electrolitos.',
    category: 'Suplementos',
    color: 'Ponche de Frutas',
    sizes: ['30 Servicios'],
    price: 27.0,
    stock: 9,
    isActive: true,
  },
  {
    name: 'BCAA + Glutamina Recovery',
    description: 'Aminoácidos ramificados y glutamina para reducir fatiga durante entrenamientos largos.',
    category: 'Suplementos',
    color: 'Lima Limón',
    sizes: ['30 Servicios'],
    price: 25.0,
    stock: 11,
    isActive: true,
  },
  {
    name: 'Multivitamínico Daily Athlete',
    description: 'Complejo vitamínico y mineral diario formulado para personas activas.',
    category: 'Suplementos',
    color: '60 Cápsulas',
    sizes: ['60 Cápsulas'],
    price: 15.0,
    stock: 15,
    isActive: true,
  },

  // Accesorios
  {
    name: 'Guantes de Entrenamiento Grip',
    description: 'Palma acolchada antideslizante y muñequera ajustable para pesas y barra.',
    category: 'Accesorios',
    color: 'Negro',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 14.0,
    stock: 12,
    isActive: true,
  },
  {
    name: 'Straps de Levantamiento Pro',
    description: 'Bandas de algodón reforzado para mejorar el agarre en peso muerto, remos y dominadas.',
    category: 'Accesorios',
    color: 'Verde y Negro',
    sizes: ['Única'],
    price: 12.0,
    stock: 16,
    isActive: true,
  },
  {
    name: 'Cinturón Lumbar de Entrenamiento',
    description: 'Soporte firme para zona baja de la espalda en levantamientos pesados.',
    category: 'Accesorios',
    color: 'Negro',
    sizes: ['S', 'M', 'L'],
    price: 29.0,
    stock: 7,
    isActive: true,
  },
  {
    name: 'Cuerda para Saltar Speed Rope',
    description: 'Cable ligero con rodamientos suaves para cardio, coordinación y dobleunders.',
    category: 'Accesorios',
    color: 'Negro',
    sizes: ['Ajustable'],
    price: 11.0,
    stock: 13,
    isActive: true,
  },
  {
    name: 'Banda de Resistencia Tela',
    description: 'Banda elástica de tela antideslizante para activación de glúteo y tren inferior.',
    category: 'Accesorios',
    color: 'Verde',
    sizes: ['Media', 'Fuerte'],
    price: 10.0,
    stock: 18,
    isActive: true,
  },

  // Hidratación
  {
    name: 'Shaker Deportivo 700ml',
    description: 'Vaso mezclador libre de BPA con rejilla interna y tapa anti-derrames.',
    category: 'Hidratación',
    color: 'Negro / Verde',
    sizes: ['700 ml'],
    price: 9.0,
    stock: 20,
    isActive: true,
  },
  {
    name: 'Botellón Térmico Acero 1L',
    description: 'Botella de acero inoxidable de doble pared para mantener el agua fría durante toda la clase.',
    category: 'Hidratación',
    color: 'Plateado / Negro',
    sizes: ['1 Litro'],
    price: 21.0,
    stock: 10,
    isActive: true,
  },
];

async function runSeedStore() {
  try {
    await connectDB();

    let createdCount = 0;
    for (const item of sampleProducts) {
      const exists = await Product.findOne({
        name: item.name,
        color: item.color,
      });

      if (!exists) {
        await Product.create(item);
        createdCount++;
      }
    }

    console.log(
      `✅ Seed de Tienda Fit completado. Nuevos artículos insertados: ${createdCount} (Total en catálogo base: ${sampleProducts.length}).`
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar el seed de la tienda:', error);
    process.exit(1);
  }
}

runSeedStore();