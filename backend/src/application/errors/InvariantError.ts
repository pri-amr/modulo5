// Deliberadamente NO extiende `CustomError`: `errorHandler` expone el mensaje de cualquier
// `CustomError` al cliente, y este error representa un fallo interno/inesperado (no un error de
// input o pertenencia del usuario) — debe caer en la rama genérica del `errorHandler` (500 con
// mensaje genérico, detalle completo solo en logs, mitigación R5).
export class InvariantError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
