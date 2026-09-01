import type { NextFunction, Request, Response } from "express";

import { LoginUserService } from "../../application/services/LoginUserService";
import { RegisterUserService } from "../../application/services/RegisterUserService";
import { TokenService } from "../../application/services/TokenService";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";

const registerUserService = new RegisterUserService(new UserRepository());
const loginUserService = new LoginUserService(
    new UserRepository(),
    new TokenService()
);

// La validación del body está delegada íntegramente a `RegisterUserRequestDto` (Zod) dentro de
// `RegisterUserService.execute` — este controller no duplica reglas de validación. Endpoint
// público: no lleva `resolveSeedUser` ni ningún otro middleware de autenticación.
export const registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await registerUserService.execute(req.body);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

// La validación del body está delegada íntegramente a `LoginUserRequestDto` (Zod) dentro de
// `LoginUserService.execute` — este controller no duplica reglas de validación. Endpoint público:
// no lleva `authenticate` (Block 2) ni ningún otro middleware de autenticación.
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await loginUserService.execute(req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
