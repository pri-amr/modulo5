process.env.JWT_SECRET = "test-secret-block2-authenticate";

import express, {
    type Application,
    type Request,
    type Response
} from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";

import app from "../../../app";
import { TokenService } from "../../../application/services/TokenService";
import { UserModel } from "../../../infrastructure/models/UserModel";
import { authenticate } from "../../../presentation/middlewares/authenticate";
import { errorHandler } from "../../../presentation/middlewares/errorHandler";
import {
    startTestDatabase,
    stopTestDatabase
} from "../../helpers/testDatabase";

const buildTestApp = (): Application => {
    const testApp = express();

    testApp.get(
        "/protected",
        authenticate,
        (req: Request, res: Response) => {
            res.status(200).json({ userId: req.userId });
        }
    );

    testApp.use(errorHandler);

    return testApp;
};

describe("authenticate (middleware, app mínima)", () => {
    const tokenService = new TokenService();

    it("test-block2-authenticate-sets-userid-with-valid-token", async () => {
        const token = tokenService.sign("user-123");

        const response = await request(buildTestApp())
            .get("/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ userId: "user-123" });
    });

    it("test-block2-authenticate-returns-401-missing-header", async () => {
        const response = await request(buildTestApp()).get("/protected");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "No autenticado" });
    });

    it("test-block2-authenticate-returns-401-malformed-header", async () => {
        const response = await request(buildTestApp())
            .get("/protected")
            .set("Authorization", "Token abc123");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "No autenticado" });
    });

    it("test-block2-authenticate-returns-401-invalid-token", async () => {
        const response = await request(buildTestApp())
            .get("/protected")
            .set("Authorization", "Bearer token-invalido");

        expect(response.status).toBe(401);
    });

    it("test-block2-authenticate-returns-401-expired-token", async () => {
        const expiredToken = jwt.sign({}, process.env.JWT_SECRET as string, {
            subject: "user-123",
            algorithm: "HS256",
            expiresIn: "-1s"
        });

        const response = await request(buildTestApp())
            .get("/protected")
            .set("Authorization", `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
    });
});

describe("authenticate (montado globalmente en app.ts, no bloquea rutas públicas)", () => {
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

    it("test-block2-authenticate-does-not-block-register-and-login", async () => {
        const registerResponse = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Ana Pérez",
                email: "ana.perez@example.com",
                password: "contrasenia-segura",
                confirmPassword: "contrasenia-segura"
            });

        expect(registerResponse.status).toBe(201);

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email: "ana.perez@example.com",
                password: "contrasenia-segura"
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.token).toEqual(expect.any(String));
    });
});
