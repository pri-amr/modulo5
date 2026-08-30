import mongoose from "mongoose";
import request from "supertest";

import app from "../../../app";
import { UserModel } from "../../../infrastructure/models/UserModel";
import { UserRepository } from "../../../infrastructure/repositories/UserRepository";
import {
    startTestDatabase,
    stopTestDatabase
} from "../../helpers/testDatabase";

describe("POST /api/auth/register (integración contra Mongo real)", () => {
    beforeAll(async () => {
        process.env.MONGODB_URI = await startTestDatabase();
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const validBody = (): Record<string, unknown> => ({
        name: "Ana Pérez",
        email: "ana.perez@example.com",
        password: "contrasenia-segura",
        confirmPassword: "contrasenia-segura"
    });

    it("POST /api/auth/register responde 201 con el usuario creado (valida AC-01, integración)", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send(validBody());

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            id: expect.any(String),
            name: "Ana Pérez",
            email: "ana.perez@example.com"
        });
        expect(response.body).not.toHaveProperty("passwordHash");
        expect(response.body).not.toHaveProperty("password");

        const persisted = await UserModel.findOne({
            email: "ana.perez@example.com"
        });
        expect(persisted).not.toBeNull();
        expect(persisted?.passwordHash).not.toBe("contrasenia-segura");
    });

    it("POST /api/auth/register responde 409 si el email ya existe (valida AC-02, integración)", async () => {
        await request(app).post("/api/auth/register").send(validBody());

        const response = await request(app)
            .post("/api/auth/register")
            .send({ ...validBody(), email: "ANA.PEREZ@example.com" });

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual(expect.any(String));
    });

    it("POST /api/auth/register responde 400 ante datos inválidos (valida AC-03 a AC-06, integración)", async () => {
        const invalidEmailResponse = await request(app)
            .post("/api/auth/register")
            .send({ ...validBody(), email: "no-es-un-email" });
        expect(invalidEmailResponse.status).toBe(400);

        const shortPasswordResponse = await request(app)
            .post("/api/auth/register")
            .send({
                ...validBody(),
                password: "corta1",
                confirmPassword: "corta1"
            });
        expect(shortPasswordResponse.status).toBe(400);

        const mismatchedPasswordResponse = await request(app)
            .post("/api/auth/register")
            .send({ ...validBody(), confirmPassword: "otra-distinta" });
        expect(mismatchedPasswordResponse.status).toBe(400);

        const { name: _name, ...bodyWithoutName } = validBody();
        const missingFieldResponse = await request(app)
            .post("/api/auth/register")
            .send(bodyWithoutName);
        expect(missingFieldResponse.status).toBe(400);
    });

    it("POST /api/auth/register responde 500 sin filtrar detalles internos si la persistencia falla (valida AC-07, integración)", async () => {
        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        jest.spyOn(UserRepository.prototype, "create").mockImplementationOnce(
            () =>
                Promise.reject(
                    new Error("Mongo no disponible: detalle interno sensible")
                )
        );

        const response = await request(app)
            .post("/api/auth/register")
            .send(validBody());

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
        expect(JSON.stringify(response.body)).not.toContain(
            "detalle interno sensible"
        );

        consoleErrorSpy.mockRestore();
    });
});
