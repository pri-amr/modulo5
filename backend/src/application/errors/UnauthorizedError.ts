import { CustomError } from "./CustomError";

export class UnauthorizedError extends CustomError {
    readonly statusCode = 401;
}
