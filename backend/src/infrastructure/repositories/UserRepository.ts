import type { User } from '../../domain/entities/User';
import type { CreateUserInput, IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserModel, type UserDocument } from '../models/UserModel';

const toEntity = (document: UserDocument): User => ({
  id: document._id.toString(),
  name: document.name,
  email: document.email,
  passwordHash: document.passwordHash,
});

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const document = await UserModel.findOne({ email: email.toLowerCase() });
    return document ? toEntity(document) : null;
  }

  async create(data: CreateUserInput): Promise<User> {
    const document = await UserModel.create(data);
    return toEntity(document);
  }
}
