import type { UserResponseDto } from "./UserResponseDto";

export interface LoginUserResponseDto {
    user: UserResponseDto;
    token: string;
}
