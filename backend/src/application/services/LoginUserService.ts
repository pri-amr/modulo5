import bcrypt from "bcryptjs";
import type { ZodError } from "zod";

import { DUMMY_PASSWORD_HASH } from "../../common/constants/security";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import { LoginUserRequestSchema } from "../dtos/request/LoginUserRequestDto";
import type { LoginUserResponseDto } from "../dtos/response/LoginUserResponseDto";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { ValidationError } from "../errors/ValidationError";
import { UserMapper } from "../helpers/mappers/UserMapper";
import type { TokenService } from "./TokenService";

const INVALID_CREDENTIALS_MESSAGE = "Email o clave incorrectos";

const buildValidationMessage = (error: ZodError): string =>
    error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

export class LoginUserService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly tokenService: TokenService
    ) {}

    async execute(dto: unknown): Promise<LoginUserResponseDto> {
        const parsed = LoginUserRequestSchema.safeParse(dto);
        if (!parsed.success) {
            throw new ValidationError(buildValidationMessage(parsed.error));
        }

        const email = parsed.data.email.toLowerCase();
        const { password } = parsed.data;

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Corre igual `bcrypt.compare` contra un hash de relleno para que el tiempo de
            // respuesta sea equivalente al del email que sí existe (mitigación R-04).
            await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
            throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );
        if (!passwordMatches) {
            throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
        }

        const token = this.tokenService.sign(user.id);
        return { user: UserMapper.toResponseDto(user), token };
    }
}
