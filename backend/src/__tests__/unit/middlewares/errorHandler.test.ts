import express, {
    type Application,
    type NextFunction,
    type Request,
    type Response
} from "express";
import request from "supertest";

import { ForbiddenError } from "../../../application/errors/ForbiddenError";
import { NotFoundError } from "../../../application/errors/NotFoundError";
import { ValidationError } from "../../../application/errors/ValidationError";
import { errorHandler } from "../../../presentation/middlewares/errorHandler";

const buildTestApp = (): Application => {
    const app = express();

    app.get(
        "/validation",
        (_req: Request, _res: Response, next: NextFunction) => {
            next(new ValidationError("El campo amount es requerido"));
        }
    );

    app.get(
        "/forbidden",
        (_req: Request, _res: Response, next: NextFunction) => {
            next(new ForbiddenError("No pertenece al usuario"));
        }
    );

    app.get(
        "/not-found",
        (_req: Request, _res: Response, next: NextFunction) => {
            next(new NotFoundError("Recurso no encontrado"));
        }
    );

    app.get("/uncontrolled", () => {
        throw new Error(
            "Detalle interno sensible: query de Mongo, stack trace, etc."
        );
    });

    app.use(errorHandler);

    return app;
};

describe("errorHandler", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it("devuelve el statusCode y el mensaje de un CustomError lanzado (ValidationError)", async () => {
        const app = buildTestApp();

        const response = await request(app).get("/validation");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "El campo amount es requerido"
        });
    });

    it("devuelve el statusCode y el mensaje de un CustomError lanzado (ForbiddenError)", async () => {
        const app = buildTestApp();

        const response = await request(app).get("/forbidden");

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: "No pertenece al usuario" });
    });

    it("devuelve el statusCode y el mensaje de un CustomError lanzado (NotFoundError)", async () => {
        const app = buildTestApp();

        const response = await request(app).get("/not-found");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Recurso no encontrado" });
    });

    it("devuelve 500 genérico, sin detalle interno, ante un error no controlado", async () => {
        const app = buildTestApp();

        const response = await request(app).get("/uncontrolled");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
        expect(JSON.stringify(response.body)).not.toContain(
            "Detalle interno sensible"
        );
        expect(JSON.stringify(response.body)).not.toContain("stack");
    });

    it("loguea el detalle completo del error no controlado solo en el servidor", async () => {
        const app = buildTestApp();

        await request(app).get("/uncontrolled");

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
});
