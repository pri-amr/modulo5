import mongoose from 'mongoose';

import { connectDB } from '../../infrastructure/database/connection';
import { startTestDatabase, stopTestDatabase } from '../helpers/testDatabase';

describe('connectDB (integración contra Mongo real)', () => {
  const originalUri = process.env.MONGODB_URI;

  afterEach(async () => {
    process.env.MONGODB_URI = originalUri;
    await stopTestDatabase();
  });

  it('conecta correctamente a una base Mongo de test real', async () => {
    process.env.MONGODB_URI = await startTestDatabase();

    await connectDB();

    expect(mongoose.connection.readyState).toBe(1);
  });

  it('propaga el error si la URI de conexión es inválida, sin dejar la conexión establecida', async () => {
    process.env.MONGODB_URI = 'esto-no-es-una-uri-de-mongo-valida';

    await expect(connectDB()).rejects.toThrow();
    expect(mongoose.connection.readyState).not.toBe(1);
  });

  it('lanza un error explícito si MONGODB_URI no está definida', async () => {
    delete process.env.MONGODB_URI;

    await expect(connectDB()).rejects.toThrow('MONGODB_URI environment variable is not defined');
  });
});
