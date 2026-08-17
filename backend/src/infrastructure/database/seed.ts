import mongoose from 'mongoose';

import { connectDB } from './connection';
import { CategoryModel } from '../models/CategoryModel';
import { MoneySourceModel } from '../models/MoneySourceModel';
import { UserModel } from '../models/UserModel';

export const SEED_USER_NAME = 'Usuario Demo';
const SEED_MONEY_SOURCE_NAME = 'Efectivo';
const SEED_CATEGORY_NAME = 'General';

// `_id` fijos y deterministicos: sin un endpoint GET para listar fuentes de dinero/categorías,
// el frontend (frontend/src/data/transactionSeedOptions.ts) necesita conocer de antemano el
// `_id` real de estos documentos semilla para poder enviarlos como moneySourceId/categoryId
// válidos contra `Types.ObjectId.isValid` + `findById` (ver CreateTransactionService).
export const SEED_MONEY_SOURCE_ID = '000000000000000000000001';
export const SEED_CATEGORY_ID = '000000000000000000000002';

export const seed = async (): Promise<void> => {
  let user = await UserModel.findOne({ name: SEED_USER_NAME });

  if (!user) {
    user = await UserModel.create({ name: SEED_USER_NAME });
  }

  const existingMoneySource = await MoneySourceModel.findOne({ _id: SEED_MONEY_SOURCE_ID });

  if (!existingMoneySource) {
    await MoneySourceModel.create({
      _id: new mongoose.Types.ObjectId(SEED_MONEY_SOURCE_ID),
      userId: user._id,
      name: SEED_MONEY_SOURCE_NAME,
      virtual: false,
      amountARS: 0,
      amountUSD: 0,
    });
  }

  const existingCategory = await CategoryModel.findOne({ _id: SEED_CATEGORY_ID });

  if (!existingCategory) {
    await CategoryModel.create({
      _id: new mongoose.Types.ObjectId(SEED_CATEGORY_ID),
      userId: user._id,
      name: SEED_CATEGORY_NAME,
    });
  }
};

const runSeedAsScript = async (): Promise<void> => {
  await connectDB();
  await seed();
  await mongoose.disconnect();
};

if (require.main === module) {
  runSeedAsScript().catch((error: unknown) => {
    console.error('Error corriendo el seed:', error);
    process.exit(1);
  });
}
