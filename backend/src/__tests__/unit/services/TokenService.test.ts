import jwt from "jsonwebtoken";

import { UnauthorizedError } from "../../../application/errors/UnauthorizedError";
import { TokenService } from "../../../application/services/TokenService";

describe("TokenService", () => {
    const secret = "test-secret-block1";

    it("TokenService firma y verifica un token válido devolviendo el userId original (valida AC-06)", () => {
        const tokenService = new TokenService(secret);

        const token = tokenService.sign("user-1");
        const userId = tokenService.verify(token);

        expect(userId).toBe("user-1");
    });

    it("TokenService.sign firma con el algoritmo HS256 explícito (valida R-06)", () => {
        const tokenService = new TokenService(secret);

        const token = tokenService.sign("user-1");
        const decoded = jwt.decode(token, { complete: true });

        expect(decoded?.header.alg).toBe("HS256");
    });

    it("test-block1-tokenservice-verify-rejects-tampered-token", () => {
        const tokenService = new TokenService(secret);
        const token = tokenService.sign("user-1");
        const tamperedToken = `${token.slice(0, -2)}xx`;

        expect(() => tokenService.verify(tamperedToken)).toThrow(
            UnauthorizedError
        );
    });

    it("TokenService.verify rechaza un token firmado con un secreto distinto", () => {
        const tokenService = new TokenService(secret);
        const otherService = new TokenService("otro-secreto-distinto");
        const token = otherService.sign("user-1");

        expect(() => tokenService.verify(token)).toThrow(UnauthorizedError);
    });

    it("TokenService.verify rechaza un token firmado con un algoritmo distinto a HS256 (valida R-06)", () => {
        const tokenService = new TokenService(secret);
        const noneAlgToken = jwt.sign({}, secret, {
            subject: "user-1",
            algorithm: "HS384"
        });

        expect(() => tokenService.verify(noneAlgToken)).toThrow(
            UnauthorizedError
        );
    });

    it("TokenService.verify rechaza un token vencido", () => {
        const tokenService = new TokenService(secret);
        const expiredToken = jwt.sign({}, secret, {
            subject: "user-1",
            algorithm: "HS256",
            expiresIn: "-1s"
        });

        expect(() => tokenService.verify(expiredToken)).toThrow(
            UnauthorizedError
        );
    });

    it("TokenService usa process.env.JWT_SECRET como secreto por defecto cuando no se inyecta ninguno", () => {
        const originalSecret = process.env.JWT_SECRET;
        process.env.JWT_SECRET = "secreto-de-entorno";

        const defaultService = new TokenService();
        const token = defaultService.sign("user-env");

        expect(defaultService.verify(token)).toBe("user-env");

        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    });
});
