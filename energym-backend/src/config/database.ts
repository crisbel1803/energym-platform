import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI_TEST;
        
        if (!mongoUri) {
            throw new Error("❌ La variable MONGO_URI_TEST no está definida en el archivo .env");
        }

        await mongoose.connect(mongoUri);
        console.log('🚀 Conexión exitosa a la base de datos de Energym');
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
        process.exit(1);
    }
};