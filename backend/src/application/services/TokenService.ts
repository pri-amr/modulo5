import jwt from "jsonwebtoken";

import { UnauthorizedError } from "../errors/UnauthorizedError";

const TOKEN_ALGORITHM = "HS256";
const TOKEN_EXPIRATION = "7d";

export class TokenService {
    // El secreto es inyectable para tests; en producción `index.ts` carga `dotenv/config` antes de
    // requerir este módulo, así que `process.env.JWT_SECRET` ya está disponible al construirse.
    constructor(private readonly secret: string = process.env.JWT_SECRET ?? "") {}

    sign(userId: string): string {
        return jwt.sign({}, this.secret, {
            subject: userId,
            algorithm: TOKEN_ALGORITHM,
            expiresIn: TOKEN_EXPIRATION
        });
    }

    // `algorithms` fijado explícitamente (no confiar en el `alg` que declare el propio token)
    // mitiga la confusión de algoritmo (R-06 del threat model de FEAT-008).
    verify(token: string): string {
        try {
            const payload = jwt.verify(token, this.secret, {
                algorithms: [TOKEN_ALGORITHM]
            });

            if (typeof payload === "string" || typeof payload.sub !== "string") {
                throw new Error("El token no tiene un subject válido");
            }

            return payload.sub;
        } catch {
            throw new UnauthorizedError("Token inválido o vencido");
        }
    }
}
