import mongoose from 'mongoose';

import { InvariantError } from '../../../application/errors/InvariantError';
import { MoneySourceRepository } from '../../../infrastructure/repositories/MoneySourceRepository';
import { MoneySourceModel } from '../../../infrastructure/models/MoneySourceModel';
import { startTestDatabase, stopTestDatabase } from '../../helpers/testDatabase';

describe('MoneySourceRepository (integración contra Mongo real)', () => {
  const repository = new MoneySourceRepository();

  beforeAll(async () => {
    const uri = await startTestDatabase();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  afterEach(async () => {
    await MoneySourceModel.deleteMany({});
  });

  describe('findById', () => {
    it('devuelve null si el id no tiene formato de ObjectId válido', async () => {
      await expect(repository.findById('esto-no-es-un-object-id')).resolves.toBeNull();
    });

    it('devuelve null si el id tiene formato válido pero no corresponde a ninguna fuente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(repository.findById(nonExistentId)).resolves.toBeNull();
    });
  });

  describe('incrementAmount', () => {
    it('lanza InvariantError si el id no tiene formato de ObjectId válido', async () => {
      await expect(
        repository.incrementAmount('esto-no-es-un-object-id', 'ARS', 100),
      ).rejects.toThrow(InvariantError);
    });

    it('lanza InvariantError si el id tiene formato válido pero no corresponde a ninguna fuente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(repository.incrementAmount(nonExistentId, 'ARS', 100)).rejects.toThrow(
        InvariantError,
      );
    });
  });
});
