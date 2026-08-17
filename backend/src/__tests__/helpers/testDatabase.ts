import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let memoryServer: MongoMemoryServer | undefined;

export const startTestDatabase = async (): Promise<string> => {
  // `launchTimeout` sube el default de 10000ms: en máquinas lentas `mongod` puede
  // tardar más en arrancar aun con el binario ya cacheado localmente.
  memoryServer = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  return memoryServer.getUri();
};

export const stopTestDatabase = async (): Promise<void> => {
  await mongoose.disconnect();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
};
