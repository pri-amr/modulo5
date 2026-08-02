import { model, Schema, type Document } from 'mongoose';

import type { User } from '../../domain/entities/User';

export interface UserDocument extends Document, Omit<User, 'id'> {}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
  },
  { strict: true },
);

export const UserModel = model<UserDocument>('User', userSchema);
