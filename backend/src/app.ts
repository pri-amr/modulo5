import cors from 'cors';
import express, { type Application, type Router } from 'express';

import { errorHandler } from './presentation/middlewares/errorHandler';

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
app.use(express.json({ limit: '10kb' }));
app.use(apiRouter);

app.use(errorHandler);

export { apiRouter };
export default app;
