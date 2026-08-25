import type { NextFunction, Request, Response } from 'express';

import { CustomError } from '../../application/errors/CustomError';

 
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Detalle completo solo en logs del servidor (mitigación R5) — nunca al cliente.
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
