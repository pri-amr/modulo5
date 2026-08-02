import mongoose from 'mongoose';

import { TransactionModel } from '../../../infrastructure/models/TransactionModel';
import { startTestDatabase, stopTestDatabase } from '../../helpers/testDatabase';

const buildValidPayload = (): Record<string, unknown> => ({
  userId: new mongoose.Types.ObjectId(),
  type: 'ingreso',
  amount: 100,
  moneySourceId: new mongoose.Types.ObjectId(),
  currency: 'ARS',
  categoryId: new mongoose.Types.ObjectId(),
  date: '02-08-2026',
  description: 'Sueldo de agosto',
});

describe('TransactionModel (validación Mongoose contra Mongo real)', () => {
  beforeAll(async () => {
    process.env.MONGODB_URI = await startTestDatabase();
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('rechaza un documento con type fuera de [ingreso, egreso]', async () => {
    const document = new TransactionModel({ ...buildValidPayload(), type: 'transferencia' });

    await expect(document.validate()).rejects.toThrow();
  });

  it('rechaza un documento con currency fuera de [ARS, USD]', async () => {
    const document = new TransactionModel({ ...buildValidPayload(), currency: 'EUR' });

    await expect(document.validate()).rejects.toThrow();
  });

  it('rechaza un documento con amount <= 0', async () => {
    const document = new TransactionModel({ ...buildValidPayload(), amount: 0 });

    await expect(document.validate()).rejects.toThrow();
  });
});
