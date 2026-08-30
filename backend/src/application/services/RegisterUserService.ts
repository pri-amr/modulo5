import bcrypt from "bcryptjs";
import type { ZodError } from "zod";

import { BCRYPT_COST_FACTOR } from "../../common/constants/security";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import { RegisterUserRequestSchema } from "../dtos/request/RegisterUserRequestDto";
import type { UserResponseDto } from "../dtos/response/UserResponseDto";
import { ConflictError } from "../errors/ConflictError";
import { ValidationError } from "../errors/ValidationError";
import { UserMapper } from "../helpers/mappers/UserMapper";

const buildValidationMessage = (error: ZodError): string =>
    error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

export class RegisterUserService {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(dto: unknown): Promise<UserResponseDto> {
        const parsed = RegisterUserRequestSchema.safeParse(dto);
        if (!parsed.success) {
            throw new ValidationError(buildValidationMessage(parsed.error));
        }

        const { name, password } = parsed.data;
        const email = parsed.data.email.toLowerCase();

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new ConflictError(
                "Ya existe una cuenta registrada con ese email"
            );
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

        const user = await this.userRepository.create({
            name,
            email,
            passwordHash
        });

        return UserMapper.toResponseDto(user);
    }
}
