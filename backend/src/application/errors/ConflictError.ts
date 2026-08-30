import { CustomError } from "./CustomError";

export class ConflictError extends CustomError {
    readonly statusCode = 409;
}
