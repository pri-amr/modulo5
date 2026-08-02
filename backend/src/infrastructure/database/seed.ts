import mongoose from 'mongoose';

import { connectDB } from './connection';
import { CategoryModel } from '../models/CategoryModel';
import { MoneySourceModel } from '../models/MoneySourceModel';
import { UserModel } from '../models/UserModel';

const SEED_USER_NAME = 'Usuario Demo';
const SEED_MONEY_SOURCE_NAME = 'Efectivo';
const SEED_CATEGORY_NAME = 'General';

export const seed = async (): Promise<void> => {
  let user = await UserModel.findOne({ name: SEED_USER_NAME });

  if (!user) {
    user = await UserModel.create({ name: SEED_USER_NAME });
  }

  const existingMoneySource = await MoneySourceModel.findOne({
    userId: user._id,
    name: SEED_MONEY_SOURCE_NAME,
  });

  if (!existingMoneySource) {
    await MoneySourceModel.create({
      userId: user._id,
      name: SEED_MONEY_SOURCE_NAME,
      virtual: false,
      amountARS: 0,
      amountUSD: 0,
    });
  }

  const existingCategory = await CategoryModel.findOne({
    userId: user._id,
    name: SEED_CATEGORY_NAME,
  });

  if (!existingCategory) {
    await CategoryModel.create({ userId: user._id, name: SEED_CATEGORY_NAME });
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
