import bcrypt from "bcryptjs";

// Factor de costo de bcrypt exigido por NFR-01 (prd-FEAT-005.md): mínimo 12, para que el hasheo de
// contraseñas cumpla el estándar de seguridad recomendado por OWASP.
export const BCRYPT_COST_FACTOR = 12;

// Hash de relleno calculado una sola vez al cargar el módulo. `LoginUserService` lo compara contra
// la clave recibida también cuando el email no existe, para normalizar el tiempo de respuesta
// frente al camino en el que el email sí existe y se compara contra el hash real (mitigación R-04
// del threat model de FEAT-008: sin esto, un atacante podría inferir por temporización qué emails
// están registrados aunque el mensaje de error sea idéntico en ambos casos).
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
    "dummy-timing-normalization",
    BCRYPT_COST_FACTOR
);
