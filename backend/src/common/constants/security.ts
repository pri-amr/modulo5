// Factor de costo de bcrypt exigido por NFR-01 (prd-FEAT-005.md): mínimo 12, para que el hasheo de
// contraseñas cumpla el estándar de seguridad recomendado por OWASP.
export const BCRYPT_COST_FACTOR = 12;
