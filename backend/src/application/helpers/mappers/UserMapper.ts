import type { User } from "../../../domain/entities/User";
import type { UserResponseDto } from "../../dtos/response/UserResponseDto";

export const UserMapper = {
    toResponseDto: (user: User): UserResponseDto => ({
        id: user.id,
        name: user.name,
        email: user.email
    })
};
