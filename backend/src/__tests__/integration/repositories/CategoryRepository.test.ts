import mongoose from "mongoose";

import { CategoryRepository } from "../../../infrastructure/repositories/CategoryRepository";
import {
    startTestDatabase,
    stopTestDatabase
} from "../../helpers/testDatabase";

describe("CategoryRepository.findById (integración contra Mongo real)", () => {
    const repository = new CategoryRepository();

    beforeAll(async () => {
        const uri = await startTestDatabase();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    it("devuelve null si el id no tiene formato de ObjectId válido", async () => {
        await expect(
            repository.findById("esto-no-es-un-object-id")
        ).resolves.toBeNull();
    });

    it("devuelve null si el id tiene formato válido pero no corresponde a ninguna categoría", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();

        await expect(repository.findById(nonExistentId)).resolves.toBeNull();
    });
});
