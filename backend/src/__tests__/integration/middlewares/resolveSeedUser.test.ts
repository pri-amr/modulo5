import express, { type Application, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import request from 'supertest';

import { UserModel } from '../../../infrastructure/models/UserModel';
import { errorHandler } from '../../../presentation/middlewares/errorHandler';
import { resolveSeedUser } from '../../../presentation/middlewares/resolveSeedUser';
import { startTestDatabase, stopTestDatabase } from '../../helpers/testDatabase';

const buildTestApp = (): Application => {
  const app = express();

  app.get('/protected', resolveSeedUser, (req: Request, res: Response) => {
    res.status(200).json({ userId: req.userId });
  });

  app.use(errorHandler);

  return app;
};

describe('resolveSeedUser (integración contra Mongo real)', () => {
  beforeAll(async () => {
    const uri = await startTestDatabase();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
    jest.restoreAllMocks();
  });

  it('responde 404 si el usuario semilla no existe en la base', async () => {
    const app = buildTestApp();

    const response = await request(app).get('/protected');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Usuario semilla no encontrado' });
  });

  it('propaga al errorHandler (500 genérico) si la consulta a Mongo falla de forma inesperada', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce(new Error('Mongo no disponible'));
    const app = buildTestApp();

    const response = await request(app).get('/protected');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });

    consoleErrorSpy.mockRestore();
  });
});
