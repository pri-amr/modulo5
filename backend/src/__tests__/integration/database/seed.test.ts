import mongoose from 'mongoose';

import {
  seed,
  SEED_CATEGORY_ID,
  SEED_MONEY_SOURCE_ID,
  SEED_USER_NAME,
} from '../../../infrastructure/database/seed';
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

  it('crea la fuente de dinero y la categoría semilla con _id fijos y determinísticos', async () => {
    await seed();

    const moneySource = await MoneySourceModel.findById(SEED_MONEY_SOURCE_ID);
    const category = await CategoryModel.findById(SEED_CATEGORY_ID);

    expect(moneySource).not.toBeNull();
    expect(moneySource?._id.toString()).toBe(SEED_MONEY_SOURCE_ID);
    expect(category).not.toBeNull();
    expect(category?._id.toString()).toBe(SEED_CATEGORY_ID);
  });

  it('correr el seed dos veces conserva el mismo _id fijo (no lo regenera)', async () => {
    await seed();
    await seed();

    await expect(MoneySourceModel.findById(SEED_MONEY_SOURCE_ID)).resolves.not.toBeNull();
    await expect(CategoryModel.findById(SEED_CATEGORY_ID)).resolves.not.toBeNull();
    await expect(MoneySourceModel.countDocuments()).resolves.toBe(1);
    await expect(CategoryModel.countDocuments()).resolves.toBe(1);
  });

  it('seed crea el usuario semilla con email y passwordHash válidos, sin disparar el error de validación de los nuevos campos requeridos', async () => {
    await seed();

    const seedUser = await UserModel.findOne({ name: SEED_USER_NAME });

    expect(seedUser).not.toBeNull();
    expect(typeof seedUser?.email).toBe('string');
    expect(seedUser?.email?.length).toBeGreaterThan(0);
    expect(typeof seedUser?.passwordHash).toBe('string');
    expect(seedUser?.passwordHash?.length).toBeGreaterThan(0);
  });
});
