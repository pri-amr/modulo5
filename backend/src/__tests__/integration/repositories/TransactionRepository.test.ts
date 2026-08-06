import mongoose from 'mongoose';

import { TransactionRepository } from '../../../infrastructure/repositories/TransactionRepository';
import { TransactionModel } from '../../../infrastructure/models/TransactionModel';
import { startTestDatabase, stopTestDatabase } from '../../helpers/testDatabase';

describe('TransactionRepository.deleteById (integración contra Mongo real)', () => {
  const repository = new TransactionRepository();

  beforeAll(async () => {
    const uri = await startTestDatabase();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  afterEach(async () => {
    await TransactionModel.deleteMany({});
  });

  it('elimina de Mongo la transacción existente cuyo id es válido', async () => {
    const created = await TransactionModel.create({
      userId: new mongoose.Types.ObjectId(),
      type: 'egreso',
      amount: 100,
      moneySourceId: new mongoose.Types.ObjectId(),
      currency: 'ARS',
      categoryId: new mongoose.Types.ObjectId(),
      date: '01-01-2026',
      description: 'Transacción a eliminar',
    });

    await repository.deleteById(created._id.toString());

    await expect(TransactionModel.findById(created._id)).resolves.toBeNull();
  });

  it('no lanza y no elimina nada si el id no tiene formato de ObjectId válido', async () => {
    await expect(repository.deleteById('esto-no-es-un-object-id')).resolves.toBeUndefined();
  });

  it('no lanza si el id tiene formato válido pero no corresponde a ningún documento', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    await expect(repository.deleteById(nonExistentId)).resolves.toBeUndefined();
  });
});
