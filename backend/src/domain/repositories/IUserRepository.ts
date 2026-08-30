import type { User } from "../entities/User";

export interface CreateUserInput {
    name: string;
    email: string;
    passwordHash: string;
}

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    create(data: CreateUserInput): Promise<User>;
}
