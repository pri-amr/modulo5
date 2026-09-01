/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra una nueva cuenta de usuario con email y contraseña
 *     description: >
 *       Crea una cuenta de usuario nueva. Endpoint público, sin autenticación previa. Valida que el
 *       email no esté ya registrado (sin distinguir mayúsculas de minúsculas), que el email tenga
 *       formato válido, que la contraseña tenga al menos 8 caracteres y que coincida con su
 *       confirmación. La contraseña se hashea con bcrypt (cost 12) antes de persistirse.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 description: Debe coincidir exactamente con password.
 *     responses:
 *       '201':
 *         description: Cuenta creada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       '400':
 *         description: >
 *           Error de validación del body (campo faltante, email con formato inválido, contraseña
 *           corta, confirmPassword no coincide, o campo no declarado).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '409':
 *         description: Ya existe una cuenta registrada con ese email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '500':
 *         description: Error interno del servidor (mensaje genérico, sin detalle interno).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Autentica una cuenta existente con email y contraseña
 *     description: >
 *       Verifica la clave ingresada contra el hash almacenado de la cuenta cuyo email coincide
 *       (bcrypt, cost 12). Responde el mismo mensaje de error tanto si el email no corresponde a
 *       ninguna cuenta como si la clave no coincide, para no revelar qué emails están registrados.
 *       Endpoint público, sin autenticación previa.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Credenciales correctas. Devuelve el usuario y un JWT firmado por el backend.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                 token:
 *                   type: string
 *       '400':
 *         description: Error de validación del body (campo faltante, email con formato inválido, o campo no declarado).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '401':
 *         description: Email inexistente o clave incorrecta. Mismo mensaje genérico en ambos casos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '500':
 *         description: Error interno del servidor (mensaje genérico, sin detalle interno).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export {};
