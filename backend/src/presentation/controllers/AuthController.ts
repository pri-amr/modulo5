import type { NextFunction, Request, Response } from 'express';

import { RegisterUserService } from '../../application/services/RegisterUserService';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

const registerUserService = new RegisterUserService(new UserRepository());

// La validación del body está delegada íntegramente a `RegisterUserRequestDto` (Zod) dentro de
// `RegisterUserService.execute` — este controller no duplica reglas de validación. Endpoint
// público: no lleva `resolveSeedUser` ni ningún otro middleware de autenticación.
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await registerUserService.execute(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};
