jest.mock('../../infrastructure/database/connection');
jest.mock('../../app', () => ({
  __esModule: true,
  default: { listen: jest.fn() },
}));

import app from '../../app';
import { connectDB } from '../../infrastructure/database/connection';

describe('startServer', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(((): never => undefined as never) as never);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('loguea el error y termina el proceso con código de salida distinto de 0 si falla la conexión a Mongo', async () => {
    const connectionError = new Error('Mongo connection refused');
    (connectDB as jest.Mock).mockRejectedValueOnce(connectionError);

    const { startServer } = await import('../../index');
    await startServer();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to start the server:', connectionError);
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(processExitSpy.mock.calls[0][0]).not.toBe(0);
    expect(app.listen).not.toHaveBeenCalled();
  });

  it('levanta el servidor sin loguear error ni terminar el proceso si la conexión a Mongo es exitosa', async () => {
    (connectDB as jest.Mock).mockResolvedValueOnce(undefined);

    const { startServer } = await import('../../index');
    await startServer();

    expect(app.listen).toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('loguea el puerto una vez que el servidor queda efectivamente escuchando', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    (connectDB as jest.Mock).mockResolvedValueOnce(undefined);
    (app.listen as jest.Mock).mockImplementationOnce(
      (_port: number | string, onListening: () => void) => {
        onListening();
        return app;
      },
    );

    const { startServer } = await import('../../index');
    await startServer();

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Server listening on port'));

    consoleLogSpy.mockRestore();
  });
});

describe('carga de variables de entorno', () => {
  const originalUri = process.env.MONGODB_URI;

  afterEach(() => {
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
  });

  it('carga MONGODB_URI desde .env al importar el entry point', async () => {
    delete process.env.MONGODB_URI;
    jest.resetModules();

    await import('../../index');

    expect(process.env.MONGODB_URI).toBeDefined();
  });
});
