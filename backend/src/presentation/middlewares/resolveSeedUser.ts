import type { NextFunction, Request, Response } from 'express';

import { NotFoundError } from '../../application/errors/NotFoundError';
import { SEED_USER_NAME } from '../../infrastructure/database/seed';
import { UserModel } from '../../infrastructure/models/UserModel';

// Stub de autenticación (riesgo aceptado R1 del threat model): resuelve `req.userId` al usuario
// semilla creado por `infrastructure/database/seed.ts`, usando el mismo criterio de búsqueda
// (SEED_USER_NAME, reexportado desde `seed.ts` para no duplicar el nombre hardcodeado en dos
// lugares). No verifica pertenencia de recursos — eso es responsabilidad exclusiva de
// `CreateTransactionService`. Se reemplaza por autenticación real en otro ticket sin tocar el
// service, que ya recibe `userId` como parámetro explícito.
export const resolveSeedUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const seedUser = await UserModel.findOne({ name: SEED_USER_NAME });

    if (!seedUser) {
      throw new NotFoundError('Usuario semilla no encontrado');
    }

    req.userId = seedUser._id.toString();
    next();
  } catch (error) {
    next(error);
  }
};
