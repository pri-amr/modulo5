// `JWT_SECRET` debe existir en `process.env` ANTES del `import app` de abajo: `AuthController`
// construye su `TokenService` una única vez al cargar el módulo (mismo patrón que
// `registerUserService`), y TypeScript compila los `import` en el orden textual del archivo (no
// los hoistea como ESM real) — confirmado por experimento, ver reporte del bloque.
process.env.JWT_SECRET = "test-secret-block1-auth-routes";

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

describe("POST /api/auth/login (integración contra Mongo real)", () => {
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

    const registerBody = (): Record<string, unknown> => ({
        name: "Ana Pérez",
        email: "ana.perez@example.com",
        password: "contrasenia-segura",
        confirmPassword: "contrasenia-segura"
    });

    it("test-block1-login-success-returns-user-and-token", async () => {
        await request(app).post("/api/auth/register").send(registerBody());

        const response = await request(app).post("/api/auth/login").send({
            email: "ana.perez@example.com",
            password: "contrasenia-segura"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            user: {
                id: expect.any(String),
                name: "Ana Pérez",
                email: "ana.perez@example.com"
            },
            token: expect.any(String)
        });
    });

    it("test-block1-login-wrong-password-returns-generic-401", async () => {
        await request(app).post("/api/auth/register").send(registerBody());

        const response = await request(app).post("/api/auth/login").send({
            email: "ana.perez@example.com",
            password: "clave-incorrecta"
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Email o clave incorrectos" });
    });

    it("test-block1-login-unknown-email-returns-generic-401", async () => {
        const response = await request(app).post("/api/auth/login").send({
            email: "no-existe@example.com",
            password: "cualquiera"
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Email o clave incorrectos" });
    });

    it("test-block1-login-response-has-exactly-3-user-fields-no-hash", async () => {
        await request(app).post("/api/auth/register").send(registerBody());

        const response = await request(app).post("/api/auth/login").send({
            email: "ana.perez@example.com",
            password: "contrasenia-segura"
        });

        expect(Object.keys(response.body.user)).toHaveLength(3);
        expect(response.body.user).not.toHaveProperty("passwordHash");
        expect(response.body.user).not.toHaveProperty("password");
    });

    it("test-block1-login-invalid-body-returns-400", async () => {
        const invalidEmailResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: "no-es-un-email", password: "algo" });
        expect(invalidEmailResponse.status).toBe(400);

        const missingPasswordResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: "ana.perez@example.com" });
        expect(missingPasswordResponse.status).toBe(400);

        const emptyPasswordResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: "ana.perez@example.com", password: "" });
        expect(emptyPasswordResponse.status).toBe(400);

        const extraFieldResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email: "ana.perez@example.com",
                password: "algo",
                extra: "campo-no-declarado"
            });
        expect(extraFieldResponse.status).toBe(400);
    });
});
