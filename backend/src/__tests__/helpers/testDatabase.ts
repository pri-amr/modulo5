import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let memoryServer: MongoMemoryServer | undefined;

export const startTestDatabase = async (): Promise<string> => {
  memoryServer = await MongoMemoryServer.create();
  return memoryServer.getUri();
};

export const stopTestDatabase = async (): Promise<void> => {
  await mongoose.disconnect();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
};
