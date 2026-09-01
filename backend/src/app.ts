import cors from "cors";
import express, { type Application, type Router } from "express";

import { swaggerSpec } from "./infrastructure/swagger/swagger.config";
import { authenticate } from "./presentation/middlewares/authenticate";
import { errorHandler } from "./presentation/middlewares/errorHandler";
import { authRoutes } from "./presentation/routes/auth.routes";
import { transactionRoutes } from "./presentation/routes/transaction.routes";

const app: Application = express();

// `apiRouter` se monta sobre `app` una única vez, acá, antes de `errorHandler`.
// Al ser un `Router` mutable, cualquier ruta que un bloque futuro le agregue con
// `apiRouter.use(...)` (sin importar en qué archivo o en qué momento lo haga)
// queda automáticamente antes de `errorHandler` en el stack real de Express: no
// depende del orden en que se edite este archivo. Esto sostiene R5 (nunca stack
// traces al cliente) SIEMPRE QUE las rutas futuras se registren sobre `apiRouter`
// y no directamente sobre `app` (que sigue expuesta para `index.ts` y los tests
// de supertest) — montar rutas sobre `app` vuelve a exponer el bug original.
const apiRouter: Router = express.Router();

app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(apiRouter);

// Montado sobre `apiRouter` (nunca sobre `app` directamente) para que `errorHandler` capture
// cualquier error lanzado dentro de estas rutas — ver comentario arriba (R5).
//
// Orden de registro deliberado (Express evalúa middlewares/rutas en el orden en que se
// registran): `authRoutes` y `/api-docs` primero, sin pasar por `authenticate` (rutas públicas);
// recién después se monta `authenticate` de forma global (sin prefijo de path), así que cualquier
// router agregado a partir de acá queda protegido por diseño sin depender de que alguien recuerde
// agregarle el middleware ruta por ruta (cierra R1 de FEAT-005 — ver
// docs/ddw/security/threat-FEAT-008.md).
apiRouter.use("/api/auth", authRoutes);
apiRouter.get("/api-docs", (_req, res) => {
    res.json(swaggerSpec);
});
apiRouter.use(authenticate);
apiRouter.use("/api/transactions", transactionRoutes);

app.use(errorHandler);

export { apiRouter };
export default app;
