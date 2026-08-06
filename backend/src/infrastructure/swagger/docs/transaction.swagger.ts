/**
 * @openapi
 * /api/transactions:
 *   post:
 *     summary: Registra un ingreso o egreso de dinero
 *     description: >
 *       Crea una transacción para el usuario resuelto por el middleware de autenticación (stub de
 *       usuario semilla — ver riesgo aceptado R1) y recalcula atómicamente el balance de la fuente
 *       de dinero afectada, solo en la moneda de la transacción.
 *     tags:
 *       - Transactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - moneySourceId
 *               - currency
 *               - categoryId
 *               - date
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [ingreso, egreso]
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               moneySourceId:
 *                 type: string
 *                 description: Debe existir y pertenecer al usuario autenticado.
 *               currency:
 *                 type: string
 *                 enum: [ARS, USD]
 *               categoryId:
 *                 type: string
 *                 description: Debe existir y pertenecer al usuario autenticado.
 *               date:
 *                 type: string
 *                 example: "02-08-2026"
 *                 description: Formato DD-MM-YYYY.
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       '201':
 *         description: Transacción creada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 moneySourceId:
 *                   type: string
 *                 currency:
 *                   type: string
 *                 categoryId:
 *                   type: string
 *                 date:
 *                   type: string
 *                 description:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       '400':
 *         description: Error de validación del body (campo faltante, formato inválido o campo no declarado).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '403':
 *         description: La fuente de dinero o la categoría no existen o no pertenecen al usuario.
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
