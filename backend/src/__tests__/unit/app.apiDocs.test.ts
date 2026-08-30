import request from "supertest";

import app from "../../app";

describe("GET /api-docs", () => {
    it("devuelve el spec de OpenAPI generado por swagger-jsdoc", async () => {
        const response = await request(app).get("/api-docs");

        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe("3.0.0");
        expect(response.body.info.title).toBe("Finanzas personales API");
    });
});
