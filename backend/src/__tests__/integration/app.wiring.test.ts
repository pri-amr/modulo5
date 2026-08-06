import request from 'supertest';

import { ValidationError } from '../../application/errors/ValidationError';
import app, { apiRouter } from '../../app';

describe('app wiring — errorHandler siempre captura rutas montadas después', () => {
  it('un CustomError lanzado en una ruta agregada como lo haría un bloque futuro es capturado por errorHandler, no por el handler por defecto de Express', async () => {
    apiRouter.get('/__future-block-route', () => {
      throw new ValidationError('Campo inválido desde una ruta futura');
    });

    const response = await request(app).get('/__future-block-route');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Campo inválido desde una ruta futura' });
    expect(response.type).toBe('application/json');
    expect(response.text).not.toContain('<pre>');
  });
});
