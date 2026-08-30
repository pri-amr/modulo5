import { model, Schema, Types, type Document } from "mongoose";

import type { Category } from "../../domain/entities/Category";

export interface CategoryDocument
    extends Document, Omit<Category, "id" | "userId"> {
    userId: Types.ObjectId;
}

const categorySchema = new Schema<CategoryDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        name: { type: String, required: true }
    },
    { strict: true }
);

export const CategoryModel = model<CategoryDocument>(
    "Category",
    categorySchema
);
