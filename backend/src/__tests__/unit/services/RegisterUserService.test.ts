import bcrypt from "bcryptjs";

import { ConflictError } from "../../../application/errors/ConflictError";
import { ValidationError } from "../../../application/errors/ValidationError";
import { RegisterUserService } from "../../../application/services/RegisterUserService";
import { BCRYPT_COST_FACTOR } from "../../../common/constants/security";
import type { User } from "../../../domain/entities/User";
import type {
    CreateUserInput,
    IUserRepository
} from "../../../domain/repositories/IUserRepository";

class FakeUserRepository implements IUserRepository {
    readonly store = new Map<string, User>();
    private counter = 0;
    readonly createCalls: CreateUserInput[] = [];

    findByEmail(email: string): Promise<User | null> {
        const found = [...this.store.values()].find(
            (user) => user.email === email.toLowerCase()
        );
        return Promise.resolve(found ?? null);
    }

    create(data: CreateUserInput): Promise<User> {
        this.counter += 1;
        this.createCalls.push(data);
        const user: User = { id: `user-${this.counter}`, ...data };
        this.store.set(user.id, user);
        return Promise.resolve(user);
    }
}

const validDto = {
    name: "Ana Pérez",
    email: "ana.perez@example.com",
    password: "contrasenia-segura",
    confirmPassword: "contrasenia-segura"
};

describe("RegisterUserService", () => {
    it("RegisterUserService crea la cuenta con datos válidos y devuelve el DTO sin passwordHash (valida AC-01)", async () => {
        const userRepository = new FakeUserRepository();
        const service = new RegisterUserService(userRepository);

        const result = await service.execute(validDto);

        expect(result).toEqual({
            id: expect.any(String),
            name: "Ana Pérez",
            email: "ana.perez@example.com"
        });
        expect(result).not.toHaveProperty("passwordHash");
    });

    it("RegisterUserService hashea la contraseña con bcrypt cost 12 antes de persistirla (valida NFR-01)", async () => {
        const userRepository = new FakeUserRepository();
        const service = new RegisterUserService(userRepository);

        await service.execute(validDto);

        expect(userRepository.createCalls).toHaveLength(1);
        const { passwordHash } = userRepository.createCalls[0];
        expect(passwordHash).not.toBe(validDto.password);

        const rounds = bcrypt.getRounds(passwordHash);
        expect(rounds).toBe(BCRYPT_COST_FACTOR);
        await expect(
            bcrypt.compare(validDto.password, passwordHash)
        ).resolves.toBe(true);
    });

    it("RegisterUserService lanza un error de conflicto si el email ya está registrado (valida AC-02)", async () => {
        const userRepository = new FakeUserRepository();
        const service = new RegisterUserService(userRepository);
        await service.execute(validDto);

        await expect(
            service.execute({
                ...validDto,
                email: validDto.email.toUpperCase()
            })
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it("RegisterUserService lanza un error de validación si el email tiene formato inválido (valida AC-03)", async () => {
        const userRepository = new FakeUserRepository();
        const service = new RegisterUserService(userRepository);

        await expect(
            service.execute({ ...validDto, email: "no-es-un-email" })
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("RegisterUserService lanza un error de validación si la contraseña tiene menos de 8 caracteres (valida AC-04)", async () => {
        const userRepository = new FakeUserRepository();
        const service = new RegisterUserService(userRepository);

        await expect(
            service.execute({
                ...validDto,
                password: "corta1",
                confirmPassword: "corta1"
            })
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("RegisterUserService lanza un error de validación si confirmPassword no coincide con password (valida AC-05)", async () => {
        const userRepository = new FakeUserRepository();
        const service = new RegisterUserService(userRepository);

        await expect(
            service.execute({
                ...validDto,
                confirmPassword: "otra-contrasenia-distinta"
            })
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it.each(["name", "email", "password", "confirmPassword"])(
        "RegisterUserService lanza un error de validación si falta algún campo obligatorio (valida AC-06)",
        async (field) => {
            const userRepository = new FakeUserRepository();
            const service = new RegisterUserService(userRepository);
            const incompleteDto: Record<string, unknown> = { ...validDto };
            delete incompleteDto[field];

            await expect(service.execute(incompleteDto)).rejects.toBeInstanceOf(
                ValidationError
            );
        }
    );
});
