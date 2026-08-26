import mongoose from 'mongoose';

import { UserModel } from '../../../infrastructure/models/UserModel';
import { startTestDatabase, stopTestDatabase } from '../../helpers/testDatabase';

const buildValidPayload = (): Record<string, unknown> => ({
  name: 'Usuario de prueba',
  email: 'usuario@example.com',
  passwordHash: 'hashed-password-value',
});

describe('UserModel (validación Mongoose contra Mongo real)', () => {
  beforeAll(async () => {
    process.env.MONGODB_URI = await startTestDatabase();
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  it('UserModel requiere email: un User sin email dispara un error de validación de Mongoose', async () => {
    const { email: _email, ...payloadWithoutEmail } = buildValidPayload();
    const document = new UserModel(payloadWithoutEmail);

    await expect(document.validate()).rejects.toThrow();
  });

  it('UserModel requiere passwordHash: un User sin passwordHash dispara un error de validación', async () => {
    const { passwordHash: _passwordHash, ...payloadWithoutPasswordHash } = buildValidPayload();
    const document = new UserModel(payloadWithoutPasswordHash);

    await expect(document.validate()).rejects.toThrow();
  });

  it('UserModel rechaza un segundo usuario con el mismo email: el índice único dispara un error de Mongo (código 11000)', async () => {
    await UserModel.create(buildValidPayload());
    await UserModel.syncIndexes();

    await expect(
      UserModel.create({ ...buildValidPayload(), name: 'Otro nombre' }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('UserModel normaliza el email a minúsculas al guardar', async () => {
    const created = await UserModel.create({
      ...buildValidPayload(),
      email: 'USUARIO@EXAMPLE.COM',
    });

    expect(created.email).toBe('usuario@example.com');
  });
});
