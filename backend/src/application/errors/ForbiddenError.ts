import { CustomError } from './CustomError';

export class ForbiddenError extends CustomError {
  readonly statusCode = 403;
}
