import bcrypt from "bcryptjs";

import { UnauthorizedError } from "../../../application/errors/UnauthorizedError";
import { ValidationError } from "../../../application/errors/ValidationError";
import { LoginUserService } from "../../../application/services/LoginUserService";
import { TokenService } from "../../../application/services/TokenService";
import { BCRYPT_COST_FACTOR } from "../../../common/constants/security";
import type { User } from "../../../domain/entities/User";
import type {
    CreateUserInput,
    IUserRepository
} from "../../../domain/repositories/IUserRepository";

class FakeUserRepository implements IUserRepository {
    readonly store = new Map<string, User>();
    private counter = 0;

    findByEmail(email: string): Promise<User | null> {
        const found = [...this.store.values()].find(
            (user) => user.email === email.toLowerCase()
        );
        return Promise.resolve(found ?? null);
    }

    create(data: CreateUserInput): Promise<User> {
        this.counter += 1;
        const user: User = { id: `user-${this.counter}`, ...data };
        this.store.set(user.id, user);
        return Promise.resolve(user);
    }
}

const seedUser = async (
    userRepository: FakeUserRepository,
    overrides: Partial<{ email: string; password: string; name: string }> = {}
): Promise<{ email: string; password: string }> => {
    const email = overrides.email ?? "ana.perez@example.com";
    const password = overrides.password ?? "contrasenia-segura";
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    await userRepository.create({
        name: overrides.name ?? "Ana Pérez",
        email,
        passwordHash
    });
    return { email, password };
};

describe("LoginUserService", () => {
    it("LoginUserService devuelve el usuario y un token cuando las credenciales son correctas (valida AC-06, AC-17, AC-18)", async () => {
        const userRepository = new FakeUserRepository();
        const tokenService = new TokenService("test-secret-block1");
        const service = new LoginUserService(userRepository, tokenService);
        const { email, password } = await seedUser(userRepository);

        const result = await service.execute({ email, password });

        expect(result.user).toEqual({
            id: expect.any(String),
            name: "Ana Pérez",
            email
        });
        expect(Object.keys(result.user)).toHaveLength(3);
        expect(result.user).not.toHaveProperty("passwordHash");
        expect(typeof result.token).toBe("string");
        expect(tokenService.verify(result.token)).toBe(result.user.id);
    });

    it("LoginUserService lanza UnauthorizedError con mensaje genérico si la clave no coincide (valida AC-07/FR-06)", async () => {
        const userRepository = new FakeUserRepository();
        const tokenService = new TokenService("test-secret-block1");
        const service = new LoginUserService(userRepository, tokenService);
        const { email } = await seedUser(userRepository);

        await expect(
            service.execute({ email, password: "clave-incorrecta" })
        ).rejects.toThrow(new UnauthorizedError("Email o clave incorrectos"));
    });

    it("LoginUserService lanza el mismo UnauthorizedError con el mismo mensaje si el email no existe (valida AC-07/FR-06)", async () => {
        const userRepository = new FakeUserRepository();
        const tokenService = new TokenService("test-secret-block1");
        const service = new LoginUserService(userRepository, tokenService);

        await expect(
            service.execute({
                email: "no-existe@example.com",
                password: "cualquiera"
            })
        ).rejects.toThrow(new UnauthorizedError("Email o clave incorrectos"));
    });

    it("test-block1-loginuserservice-compares-dummy-hash-for-unknown-email", async () => {
        const userRepository = new FakeUserRepository();
        const tokenService = new TokenService("test-secret-block1");
        const service = new LoginUserService(userRepository, tokenService);
        const compareSpy = jest.spyOn(bcrypt, "compare");

        await expect(
            service.execute({
                email: "no-existe@example.com",
                password: "cualquiera"
            })
        ).rejects.toBeInstanceOf(UnauthorizedError);

        expect(compareSpy).toHaveBeenCalledTimes(1);
        expect(compareSpy).toHaveBeenCalledWith(
            "cualquiera",
            expect.any(String)
        );

        compareSpy.mockRestore();
    });

    it("LoginUserService lanza ValidationError si el body no cumple el schema (email inválido)", async () => {
        const userRepository = new FakeUserRepository();
        const tokenService = new TokenService("test-secret-block1");
        const service = new LoginUserService(userRepository, tokenService);

        await expect(
            service.execute({ email: "no-es-un-email", password: "algo" })
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("LoginUserService lanza ValidationError si password está vacía", async () => {
        const userRepository = new FakeUserRepository();
        const tokenService = new TokenService("test-secret-block1");
        const service = new LoginUserService(userRepository, tokenService);

        await expect(
            service.execute({ email: "ana.perez@example.com", password: "" })
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("LoginUserService lanza ValidationError si el body trae campos extra (.strict())", async () => {
        const userRepository = new FakeUserRepository();
        const tokenService = new TokenService("test-secret-block1");
        const service = new LoginUserService(userRepository, tokenService);

        await expect(
            service.execute({
                email: "ana.perez@example.com",
                password: "algo",
                extra: "campo-no-declarado"
            })
        ).rejects.toBeInstanceOf(ValidationError);
    });
});
