export type RegisterUserRequestDto = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export type UserResponseDto = {
    id: string;
    name: string;
    email: string;
};
