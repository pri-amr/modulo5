import type { NextFunction, Request, Response } from "express";

import { UnauthorizedError } from "../../application/errors/UnauthorizedError";
import { TokenService } from "../../application/services/TokenService";

const BEARER_PREFIX = "Bearer ";

// Instanciado una sola vez al cargar el módulo (mismo patrón que `AuthController`): en producción
// `index.ts` carga `dotenv/config` antes de requerir este módulo, así que `process.env.JWT_SECRET`
// ya está disponible al construirse.
const tokenService = new TokenService();

// Montado globalmente sobre `apiRouter` en `app.ts`, después de `auth.routes.ts` y antes de
// cualquier otro router (cierra R1 de FEAT-005 — ver docs/ddw/security/threat-FEAT-008.md).
export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith(BEARER_PREFIX)) {
            throw new UnauthorizedError("No autenticado");
        }

        const token = header.slice(BEARER_PREFIX.length);
        const userId = tokenService.verify(token);

        req.userId = userId;
        next();
    } catch (error) {
        next(error);
    }
};
