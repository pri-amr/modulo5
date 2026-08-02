import mongoose from 'mongoose';

import { seed } from '../../../infrastructure/database/seed';
import { CategoryModel } from '../../../infrastructure/models/CategoryModel';
import { MoneySourceModel } from '../../../infrastructure/models/MoneySourceModel';
import { UserModel } from '../../../infrastructure/models/UserModel';
import { startTestDatabase, stopTestDatabase } from '../../helpers/testDatabase';

describe('seed (idempotencia contra Mongo real)', () => {
  beforeAll(async () => {
    process.env.MONGODB_URI = await startTestDatabase();
    await mongoose.connect(process.env.MONGODB_URI);
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await MoneySourceModel.deleteMany({});
    await CategoryModel.deleteMany({});
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('crea exactamente 1 usuario, 1 fuente de dinero y 1 categoría en una base de test limpia', async () => {
    await seed();

    await expect(UserModel.countDocuments()).resolves.toBe(1);
    await expect(MoneySourceModel.countDocuments()).resolves.toBe(1);
    await expect(CategoryModel.countDocuments()).resolves.toBe(1);
  });

  it('correr el seed dos veces no duplica los documentos', async () => {
    await seed();
    await seed();

    await expect(UserModel.countDocuments()).resolves.toBe(1);
    await expect(MoneySourceModel.countDocuments()).resolves.toBe(1);
    await expect(CategoryModel.countDocuments()).resolves.toBe(1);
  });
});
