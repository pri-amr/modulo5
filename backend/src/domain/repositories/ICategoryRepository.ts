import type { Category } from "../entities/Category";

export interface ICategoryRepository {
    findById(id: string): Promise<Category | null>;
}
