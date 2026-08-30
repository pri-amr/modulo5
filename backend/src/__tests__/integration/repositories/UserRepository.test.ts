import mongoose from "mongoose";

import { UserRepository } from "../../../infrastructure/repositories/UserRepository";
import {
    startTestDatabase,
    stopTestDatabase
} from "../../helpers/testDatabase";

describe("UserRepository (integración contra Mongo real)", () => {
    const repository = new UserRepository();

    beforeAll(async () => {
        const uri = await startTestDatabase();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    afterEach(async () => {
        await mongoose.connection.collection("users").deleteMany({});
    });

    it("UserRepository.create persiste un usuario y lo devuelve como entidad de dominio (valida FR-01)", async () => {
        const created = await repository.create({
            name: "Usuario de prueba",
            email: "nueva.cuenta@example.com",
            passwordHash: "hashed-password-value"
        });

        expect(created).toEqual({
            id: expect.any(String),
            name: "Usuario de prueba",
            email: "nueva.cuenta@example.com",
            passwordHash: "hashed-password-value"
        });
    });

    it("UserRepository.findByEmail encuentra un usuario existente sin distinguir mayúsculas de minúsculas (valida FR-02)", async () => {
        await repository.create({
            name: "Usuario de prueba",
            email: "busqueda@example.com",
            passwordHash: "hashed-password-value"
        });

        const found = await repository.findByEmail("BUSQUEDA@EXAMPLE.COM");

        expect(found).not.toBeNull();
        expect(found?.email).toBe("busqueda@example.com");
    });

    it("UserRepository.findByEmail devuelve null si no existe ningún usuario con ese email (valida FR-02)", async () => {
        const found = await repository.findByEmail("no.existe@example.com");

        expect(found).toBeNull();
    });
});
