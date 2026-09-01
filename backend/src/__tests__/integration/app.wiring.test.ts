process.env.JWT_SECRET = "test-secret-block2-app-wiring";

import request from "supertest";

import app, { apiRouter } from "../../app";
import { ValidationError } from "../../application/errors/ValidationError";
import { TokenService } from "../../application/services/TokenService";

describe("app wiring — errorHandler siempre captura rutas montadas después", () => {
    it("un CustomError lanzado en una ruta agregada como lo haría un bloque futuro es capturado por errorHandler, no por el handler por defecto de Express", async () => {
        apiRouter.get("/__future-block-route", () => {
            throw new ValidationError("Campo inválido desde una ruta futura");
        });

        // Cualquier ruta agregada a `apiRouter` cae después de `authenticate` (Block 2, montado
        // globalmente en `app.ts`) — necesita un token válido para llegar a este handler y probar
        // lo que este test realmente verifica: que `errorHandler` la captura igual.
        const token = new TokenService().sign("wiring-test-user");

        const response = await request(app)
            .get("/__future-block-route")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Campo inválido desde una ruta futura"
        });
        expect(response.type).toBe("application/json");
        expect(response.text).not.toContain("<pre>");
    });
});
