import { Types } from 'mongoose';

import type { Category } from '../../domain/entities/Category';
import type { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { CategoryModel, type CategoryDocument } from '../models/CategoryModel';

const toEntity = (document: CategoryDocument): Category => ({
  id: document._id.toString(),
  userId: document.userId.toString(),
  name: document.name,
});

export class CategoryRepository implements ICategoryRepository {
  async findById(id: string): Promise<Category | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const document = await CategoryModel.findById(id);
    return document ? toEntity(document) : null;
  }
}
