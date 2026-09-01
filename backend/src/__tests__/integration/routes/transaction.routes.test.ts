process.env.JWT_SECRET = "test-secret-block2-transaction-routes";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import request from "supertest";

import app from "../../../app";
import { TokenService } from "../../../application/services/TokenService";
import { BCRYPT_COST_FACTOR } from "../../../common/constants/security";
import { CategoryModel } from "../../../infrastructure/models/CategoryModel";
import { MoneySourceModel } from "../../../infrastructure/models/MoneySourceModel";
import { TransactionModel } from "../../../infrastructure/models/TransactionModel";
import { UserModel } from "../../../infrastructure/models/UserModel";
import {
    startTestDatabase,
    stopTestDatabase
} from "../../helpers/testDatabase";

describe("POST /api/transactions (integración contra Mongo real)", () => {
    const tokenService = new TokenService();

    let moneySourceId: string;
    let categoryId: string;
    let otherMoneySourceId: string;
    let authUserId: string;
    let authToken: string;

    beforeAll(async () => {
        process.env.MONGODB_URI = await startTestDatabase();
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
        await MoneySourceModel.deleteMany({});
        await CategoryModel.deleteMany({});
        await TransactionModel.deleteMany({});

        const passwordHash = await bcrypt.hash(
            "contrasenia-segura",
            BCRYPT_COST_FACTOR
        );
        const authUser = await UserModel.create({
            name: "Usuario Autenticado",
            email: "usuario.autenticado@example.com",
            passwordHash
        });
        authUserId = authUser._id.toString();
        authToken = tokenService.sign(authUserId);

        const otherUser = await UserModel.create({
            name: "Otro usuario",
            email: "otro.usuario@example.com",
            passwordHash: "fixed-test-password-hash"
        });

        const moneySource = await MoneySourceModel.create({
            userId: authUser._id,
            name: "Efectivo",
            virtual: false,
            amountARS: 1000,
            amountUSD: 100
        });
        moneySourceId = moneySource._id.toString();

        const category = await CategoryModel.create({
            userId: authUser._id,
            name: "General"
        });
        categoryId = category._id.toString();

        const otherMoneySource = await MoneySourceModel.create({
            userId: otherUser._id,
            name: "Cuenta ajena",
            virtual: false,
            amountARS: 500,
            amountUSD: 50
        });
        otherMoneySourceId = otherMoneySource._id.toString();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const validEgresoBody = (): Record<string, unknown> => ({
        type: "egreso",
        amount: 200,
        moneySourceId,
        currency: "ARS",
        categoryId,
        date: "02-08-2026",
        description: "Supermercado"
    });

    const authHeader = (): string => `Bearer ${authToken}`;

    it("body válido de egreso → 201, balance de la fuente actualizado en Mongo", async () => {
        const response = await request(app)
            .post("/api/transactions")
            .set("Authorization", authHeader())
            .send(validEgresoBody());

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            type: "egreso",
            amount: 200,
            moneySourceId,
            currency: "ARS",
            categoryId,
            date: "02-08-2026",
            description: "Supermercado"
        });
        expect(response.body.id).toEqual(expect.any(String));
        expect(response.body.createdAt).toEqual(expect.any(String));

        const updatedSource = await MoneySourceModel.findById(moneySourceId);
        expect(updatedSource?.amountARS).toBe(800);
        expect(updatedSource?.amountUSD).toBe(100);
    });

    it("body válido de ingreso → 201, balance de la fuente actualizado en Mongo", async () => {
        const response = await request(app)
            .post("/api/transactions")
            .set("Authorization", authHeader())
            .send({
                type: "ingreso",
                amount: 300,
                moneySourceId,
                currency: "USD",
                categoryId,
                date: "02-08-2026",
                description: "Sueldo"
            });

        expect(response.status).toBe(201);

        const updatedSource = await MoneySourceModel.findById(moneySourceId);
        expect(updatedSource?.amountUSD).toBe(400);
        expect(updatedSource?.amountARS).toBe(1000);
    });

    it("sin amount → 400", async () => {
        const { amount: _amount, ...bodyWithoutAmount } = validEgresoBody();

        const response = await request(app)
            .post("/api/transactions")
            .set("Authorization", authHeader())
            .send(bodyWithoutAmount);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual(expect.any(String));
    });

    it("moneySourceId de otro usuario → 403", async () => {
        const response = await request(app)
            .post("/api/transactions")
            .set("Authorization", authHeader())
            .send({ ...validEgresoBody(), moneySourceId: otherMoneySourceId });

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual(expect.any(String));
    });

    it("campo extra no declarado → 400", async () => {
        const response = await request(app)
            .post("/api/transactions")
            .set("Authorization", authHeader())
            .send({ ...validEgresoBody(), extraField: "no declarado" });

        expect(response.status).toBe(400);
    });

    it("error no controlado del repositorio → 500 genérico sin detalle interno", async () => {
        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        jest.spyOn(TransactionModel, "create").mockImplementationOnce(() =>
            Promise.reject(
                new Error("Mongo no disponible: detalle interno sensible")
            )
        );

        const response = await request(app)
            .post("/api/transactions")
            .set("Authorization", authHeader())
            .send(validEgresoBody());

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
        expect(JSON.stringify(response.body)).not.toContain(
            "detalle interno sensible"
        );

        consoleErrorSpy.mockRestore();
    });

    it("test-block2-createtransaction-uses-authenticated-userid-not-seed", async () => {
        const response = await request(app)
            .post("/api/transactions")
            .set("Authorization", authHeader())
            .send(validEgresoBody());

        expect(response.status).toBe(201);

        const persisted = await TransactionModel.findById(response.body.id);
        expect(persisted?.userId.toString()).toBe(authUserId);
    });
});
