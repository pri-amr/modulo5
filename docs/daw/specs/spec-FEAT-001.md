# Spec FEAT-001: Registrar ingreso o egreso de dinero

| Field | Value |
|-------|-------|
| Ticket | FEAT-001 |
| PRD | docs/daw/prd/prd-FEAT-001.md |
| Tier | FEATURE |
| Date | 2026-08-01 |
| Spec loops | 1 |

## Summary

Se construye desde cero el esqueleto de `backend/` (Express + Mongoose, DDD/CQRS) y `frontend/`
(Next.js 16 + Tailwind 4), y sobre ese esqueleto el flujo completo de alta de una transacción
(ingreso o egreso): validación estricta (Zod en backend, Yup en frontend), verificación de
pertenencia de fuente/categoría contra un usuario semilla, recálculo atómico del balance de la
fuente afectada, y un formulario que muestra loading/errores sin perder los datos ingresados. Se
agrega además el tema claro/oscuro global (NFR-04), por ser la primera feature que construye el
layout de la app. Las interfaces de repositorio viven en `domain/repositories/` según ADR-001.
Mitigaciones del threat model (`docs/daw/security/threat-FEAT-001.md`) incorporadas: validación
estricta contra inyección NoSQL, recálculo con `$inc` atómico, límite de payload, timestamps y
manejo de errores centralizado.

## Coverage: PRD → blocks

| Requirement | Covered by |
|---|---|
| FR-01 | Block 3, Block 4, Block 7 |
| FR-02 | Block 3, Block 4, Block 7 |
| FR-03 | Block 3, Block 7 |
| FR-04 | Block 3 |
| FR-05 | Block 3 |
| FR-06 | Block 3 |
| FR-07 | Block 3, Block 7 |
| FR-08 | Block 3, Block 7 |
| FR-09 | Block 3, Block 7 |
| FR-10 | Block 3, Block 7 |
| FR-11 | Block 4, Block 7 |
| FR-12 | Block 3 |
| NFR-01 | Strategy: formulario de un solo paso, sin navegación adicional ni pasos previos — el usuario completa y confirma sin salir de la pantalla del dashboard (Block 7) |
| NFR-02 | Strategy: `CreateTransactionService` verifica pertenencia de fuente y categoría contra el usuario resuelto por el middleware ANTES de cualquier escritura; `ForbiddenError` se mapea a 403 en el controller (Block 3, Block 4) |
| NFR-03 | Strategy: componente `Loader` reutilizable, controlado por el estado `loading` de `useCreateTransaction` (Block 5, Block 7) |
| NFR-04 | Strategy: store Zustand `useThemeStore` con persistencia en `localStorage`, clase `dark`/`light` aplicada en la raíz del layout (Block 6) |

## Dependencies between blocks

- Block 2 depende de Block 1 (necesita la conexión a Mongo y la app base).
- Block 3 depende de Block 2 (necesita las entidades y los modelos Mongoose).
- Block 4 depende de Block 3 (necesita el service y las interfaces de repositorio).
- Block 5 es independiente de los bloques de backend (bootstrap de frontend).
- Block 6 depende de Block 5 (necesita el layout base).
- Block 7 depende de Block 4 (necesita el endpoint) y de Block 6 (el formulario vive dentro del layout con tema).

Orden sugerido: 1 → 2 → 3 → 4 → 5 → 6 → 7. Los bloques 5-6 pueden ejecutarse en paralelo con 1-4 si
hay más de un implementador, pero Block 7 no puede empezar hasta que 4 y 6 estén terminados.

---

## Block 1 — Bootstrap del backend

**Files**
- `backend/package.json` (new)
- `backend/tsconfig.json` (new)
- `backend/src/app.ts` (new) — configuración de Express (middlewares globales, `express.json({ limit: '10kb' })`, montaje de rutas, middleware de errores), sin `listen`
- `backend/src/index.ts` (new) — `listen` + conexión a Mongo
- `backend/src/infrastructure/database/connection.ts` (new) — conexión Mongoose vía `MONGODB_URI` (env var, nunca hardcodeada)
- `backend/src/application/errors/CustomError.ts` (new) — clase base con `statusCode`
- `backend/src/application/errors/ValidationError.ts` (new) — 400
- `backend/src/application/errors/NotFoundError.ts` (new) — 404
- `backend/src/application/errors/ForbiddenError.ts` (new) — 403
- `backend/src/presentation/middlewares/errorHandler.ts` (new) — middleware de errores centralizado
- `backend/src/infrastructure/swagger/swagger.config.ts` (new) — config base de swagger-jsdoc
- `.gitignore` (modified) — agregar `backend/dist/`, `backend/coverage/`, `backend/node_modules/`

**Logic**
Esqueleto mínimo de Express en TypeScript. `errorHandler` captura cualquier `CustomError` y responde
`{ error: message }` con el `statusCode` correspondiente; para errores no controlados responde 500
genérico y loguea el detalle completo solo en el servidor (mitigación R5 del threat model — nunca
stack traces al cliente).

**Error handling**
- Error no controlado en cualquier ruta → `errorHandler` responde 500 con mensaje genérico, loguea el detalle en servidor.
- `CustomError` (o subclase) lanzado en cualquier capa → `errorHandler` responde con su `statusCode` y su mensaje.
- Fallo de conexión a Mongo en el arranque → `index.ts` loguea el error y termina el proceso con código de salida distinto de 0 (fail securely: no arranca en un estado inconsistente).

**Required tests**
- [ ] `errorHandler` devuelve el `statusCode` y el mensaje de un `CustomError` lanzado — valida el manejo de errores centralizado (soporta FR-11)
- [ ] `errorHandler` devuelve 500 genérico (sin detalle interno) ante un error no controlado — valida R5
- [ ] Si la conexión a Mongo falla en el arranque, `index.ts` loguea el error y el proceso termina con código de salida distinto de 0 (no queda escuchando en un estado inconsistente)

**Completion criterion**
`backend/src/index.ts` levanta el servidor, conecta a una base Mongo de test, y un endpoint de prueba
que lanza cada tipo de `CustomError` responde con el `statusCode` esperado; los tres tests de este
bloque pasan.

---

## Block 2 — Modelos de dominio y datos semilla

**Files**
- `backend/src/domain/entities/User.ts` (new) — interfaz pura: `id`, `name`
- `backend/src/domain/entities/MoneySource.ts` (new) — interfaz pura: `id`, `userId`, `name`, `virtual: boolean`, `amountARS: number`, `amountUSD: number`
- `backend/src/domain/entities/Category.ts` (new) — interfaz pura: `id`, `userId`, `name`
- `backend/src/domain/entities/Transaction.ts` (new) — interfaz pura: `id`, `userId`, `type: 'ingreso' | 'egreso'`, `amount: number`, `moneySourceId`, `currency: 'ARS' | 'USD'`, `categoryId`, `date: string`, `description: string`, `createdAt`, `updatedAt`
- `backend/src/infrastructure/models/UserModel.ts` (new) — schema Mongoose
- `backend/src/infrastructure/models/MoneySourceModel.ts` (new) — schema Mongoose
- `backend/src/infrastructure/models/CategoryModel.ts` (new) — schema Mongoose
- `backend/src/infrastructure/models/TransactionModel.ts` (new) — schema Mongoose, `{ timestamps: true }` (mitigación R6)
- `backend/src/infrastructure/database/seed.ts` (new) — script de seed (1 usuario, 1 fuente de dinero, 1 categoría)
- `backend/package.json` (modified) — script `"seed": "ts-node src/infrastructure/database/seed.ts"`

**Data model**

| Entity | Field | Type | Constraints |
|---|---|---|---|
| User | name | string | required |
| MoneySource | userId | ObjectId (ref User) | required, index |
| MoneySource | name | string | required |
| MoneySource | virtual | boolean | required |
| MoneySource | amountARS | number | required, default 0 |
| MoneySource | amountUSD | number | required, default 0 |
| Category | userId | ObjectId (ref User) | required, index |
| Category | name | string | required |
| Transaction | userId | ObjectId (ref User) | required, index |
| Transaction | type | string enum `['ingreso','egreso']` | required |
| Transaction | amount | number | required, min 0.01 |
| Transaction | moneySourceId | ObjectId (ref MoneySource) | required, index |
| Transaction | currency | string enum `['ARS','USD']` | required |
| Transaction | categoryId | ObjectId (ref Category) | required, index |
| Transaction | date | string (`DD-MM-YYYY`) | required |
| Transaction | description | string | required, maxlength 500 |
| Transaction | createdAt / updatedAt | Date | automático (`timestamps: true`) |

Todos los schemas Mongoose se declaran con `strict: true` (mitigación R2 — rechaza campos no
declarados en el schema, cierra el vector de inyección de operadores Mongo vía campos extra).

**Error handling**
- Falla la validación de un schema Mongoose (tipo/enum inválido) → se propaga como error, capturado por el `errorHandler` del Block 1.
- El script de seed corriendo dos veces no debe duplicar datos → verifica existencia previa por nombre antes de insertar.

**Required tests**
- [ ] El seed crea exactamente 1 usuario, 1 fuente de dinero y 1 categoría en una base de test limpia
- [ ] Correr el seed dos veces no duplica los documentos
- [ ] `TransactionModel` rechaza un documento con `type` fuera de `['ingreso','egreso']`
- [ ] `TransactionModel` rechaza un documento con `currency` fuera de `['ARS','USD']`
- [ ] `TransactionModel` rechaza un documento con `amount <= 0`

**Completion criterion**
Los 5 tests pasan contra una base Mongo de test; el seed es idempotente.

---

## Block 3 — Application layer de Transaction

**Files**
- `backend/src/domain/repositories/ITransactionRepository.ts` (new) — interfaz pura (ADR-001): `create`, `findById`
- `backend/src/domain/repositories/IMoneySourceRepository.ts` (new) — interfaz pura: `findById`, `incrementAmount(id, currency, delta)`
- `backend/src/domain/repositories/ICategoryRepository.ts` (new) — interfaz pura: `findById`
- `backend/src/application/dtos/request/CreateTransactionRequestDto.ts` (new) — schema Zod
- `backend/src/application/dtos/response/TransactionResponseDto.ts` (new) — tipo de respuesta
- `backend/src/application/helpers/mappers/TransactionMapper.ts` (new) — entidad → `TransactionResponseDto`
- `backend/src/application/services/CreateTransactionService.ts` (new)

**Logic**
`CreateTransactionRequestDto` (Zod, `.strict()`) valida: `type` (`'ingreso'|'egreso'`), `amount`
(número, `> 0`), `moneySourceId` (string no vacío), `currency` (`'ARS'|'USD'`), `categoryId` (string
no vacío), `date` (string, regex `DD-MM-YYYY`), `description` (string, 1–500 caracteres). Rechaza
cualquier clave no declarada (mitigación R2).

`CreateTransactionService.execute(userId, dto)`:
1. Valida `dto` contra el schema Zod → si falla, `ValidationError` (400) con el detalle de qué campo falta o es inválido (cubre AC-04, AC-05, AC-06, AC-09).
2. Busca `MoneySource` por `dto.moneySourceId` vía `IMoneySourceRepository.findById`. Si no existe o `moneySource.userId !== userId` → `ForbiddenError` (403) (cubre AC-07, NFR-02).
3. Busca `Category` por `dto.categoryId` vía `ICategoryRepository.findById`. Si no existe o `category.userId !== userId` → `ForbiddenError` (403) (cubre AC-07, NFR-02).
4. Crea la transacción vía `ITransactionRepository.create` con `userId` resuelto por el caller (nunca tomado del body).
5. Recalcula el balance: `IMoneySourceRepository.incrementAmount(moneySourceId, currency, delta)` donde `delta = +amount` si `type === 'ingreso'`, `-amount` si `type === 'egreso'`. La implementación de este método en infrastructure usa `$inc` atómico (mitigación R3) y **solo** toca el campo de la moneda de la transacción, dejando el de la otra moneda sin cambios (cubre AC-01, AC-02, AC-03, FR-12).
6. Devuelve la transacción mapeada con `TransactionMapper`.

Si el paso 4 tiene éxito pero el paso 5 falla, el servicio revierte la transacción creada (evita que
quede una transacción sin su recálculo de balance aplicado).

**Input validation**
- `type`: enum `['ingreso','egreso']`, requerido.
- `amount`: número, requerido, estrictamente mayor a 0 (rechaza 0 y negativos).
- `moneySourceId`: string no vacío, requerido; debe existir y pertenecer al usuario.
- `currency`: enum `['ARS','USD']`, requerido.
- `categoryId`: string no vacío, requerido; debe existir y pertenecer al usuario.
- `date`: string, requerido, formato exacto `DD-MM-YYYY` (regex `^\d{2}-\d{2}-\d{4}$`, más validación de fecha real).
- `description`: string, requerido, 1 a 500 caracteres.
- Objeto completo: `.strict()` — cualquier campo no listado arriba rechaza la petición completa.

**Error handling**
- Campo faltante o con formato inválido → `ValidationError` (400), mensaje indica el/los campo(s) afectado(s) (AC-04, AC-05, AC-06, AC-09).
- Fuente de dinero inexistente o de otro usuario → `ForbiddenError` (403) (AC-07).
- Categoría inexistente o de otro usuario → `ForbiddenError` (403) (AC-07).
- Falla el recálculo del balance después de crear la transacción → se revierte la creación y se propaga un error 500 (fail securely: no se deja una transacción sin su efecto en el balance).

**Required tests**
- [ ] Crea un egreso válido → balance de la fuente en esa moneda disminuye exactamente el monto, la otra moneda no cambia (AC-01, AC-03)
- [ ] Crea un ingreso válido → balance de la fuente en esa moneda aumenta exactamente el monto, la otra moneda no cambia (AC-02, AC-03)
- [ ] Rechaza sin `amount` → `ValidationError` (AC-04)
- [ ] Rechaza `amount <= 0` → `ValidationError` (AC-05)
- [ ] Rechaza sin `moneySourceId`, `currency`, `categoryId`, `date` o `description` (uno por caso) → `ValidationError` (AC-06)
- [ ] Rechaza `date` en formato distinto a `DD-MM-YYYY` → `ValidationError` (AC-09)
- [ ] Rechaza `moneySourceId` de otro usuario → `ForbiddenError` 403 (AC-07)
- [ ] Rechaza `categoryId` de otro usuario → `ForbiddenError` 403 (AC-07)
- [ ] Rechaza un campo extra no declarado en el DTO → `ValidationError` (R2)
- [ ] Si `IMoneySourceRepository.incrementAmount` falla después de crear la transacción, el servicio revierte la transacción creada y propaga el error (no queda una transacción sin su recálculo aplicado)

**Completion criterion**
Los 10 tests unitarios de `CreateTransactionService` pasan contra repositorios en memoria (fakes),
sin tocar Mongo.

---

## Block 4 — Infraestructura y presentación de Transaction

**Files**
- `backend/src/infrastructure/repositories/TransactionRepository.ts` (new) — implementa `ITransactionRepository` contra `TransactionModel`
- `backend/src/infrastructure/repositories/MoneySourceRepository.ts` (new) — implementa `IMoneySourceRepository`; `incrementAmount` usa `findOneAndUpdate` con `$inc`
- `backend/src/infrastructure/repositories/CategoryRepository.ts` (new) — implementa `ICategoryRepository`
- `backend/src/presentation/middlewares/resolveSeedUser.ts` (new) — resuelve `req.userId` al id del usuario semilla (stub de autenticación; **no** hace verificación de pertenencia — eso es responsabilidad de `CreateTransactionService`)
- `backend/src/presentation/controllers/TransactionController.ts` (new)
- `backend/src/presentation/routes/transaction.routes.ts` (new) — `POST /api/transactions`
- `backend/src/infrastructure/swagger/docs/transaction.swagger.ts` (new) — doc del endpoint
- `backend/src/app.ts` (modified) — monta `transaction.routes.ts` bajo `/api/transactions`

**API contract**
- **Method + path:** `POST /api/transactions`
- **Request body:**
  ```
  {
    type: 'ingreso' | 'egreso',
    amount: number,
    moneySourceId: string,
    currency: 'ARS' | 'USD',
    categoryId: string,
    date: string, // DD-MM-YYYY
    description: string
  }
  ```
- **Response 201:**
  ```
  {
    id: string,
    type: string,
    amount: number,
    moneySourceId: string,
    currency: string,
    categoryId: string,
    date: string,
    description: string,
    createdAt: string
  }
  ```
- **Error codes:** `400` (validación, `ValidationError`), `403` (pertenencia, `ForbiddenError`), `500` (error de servidor, mensaje genérico)
- **Auth:** `resolveSeedUser` resuelve `req.userId` (usuario semilla — ver Riesgo aceptado R1 en `docs/daw/security/threat-FEAT-001.md`); se reemplaza por auth real en el ticket de autenticación sin tocar `CreateTransactionService`, que ya recibe `userId` como parámetro explícito.

**Input validation**
Delegada íntegramente al `CreateTransactionRequestDto` (Zod) del Block 3 — el controller no
duplica validación, solo pasa `req.body` al service.

**Error handling**
- `ValidationError` del service → controller responde 400 con `{ error: message }`.
- `ForbiddenError` del service → controller responde 403 con `{ error: message }`.
- Cualquier otro error → propagado al `errorHandler` global (Block 1) → 500 genérico.
- Ante cualquier error, el body de la request original nunca se persiste ni se devuelve modificado — el frontend (Block 7) es responsable de no perder los datos ingresados por el usuario (FR-11, AC-08).

**Required tests**
- [ ] `POST /api/transactions` con body válido de egreso → 201, balance de la fuente actualizado en Mongo (integración)
- [ ] `POST /api/transactions` con body válido de ingreso → 201, balance de la fuente actualizado en Mongo (integración)
- [ ] `POST /api/transactions` sin `amount` → 400
- [ ] `POST /api/transactions` con `moneySourceId` de otro usuario → 403
- [ ] `POST /api/transactions` con un campo extra no declarado → 400
- [ ] Un error no controlado del repositorio (p. ej. Mongo no disponible) → 500 con mensaje genérico, sin detalle interno en el body

**Completion criterion**
Los 6 tests de integración pasan contra una base Mongo de test; el endpoint está documentado en
swagger y accesible en `/api-docs`.

---

## Block 5 — Bootstrap del frontend

**Files**
- `frontend/package.json` (new)
- `frontend/tsconfig.json` (new)
- `frontend/next.config.ts` (new)
- `frontend/tailwind.config.ts` (new)
- `frontend/src/app/layout.tsx` (new) — layout raíz, solo routing
- `frontend/src/app/page.tsx` (new) — página que renderiza el formulario (Block 7 la completa)
- `frontend/src/lib/axiosClient.ts` (new) — instancia de axios (`baseURL` desde env var)
- `frontend/src/components/Loader.tsx` (new) — UI pura: círculo animado, color `#376BCB`, giro continuo mientras `visible=true`
- `.gitignore` (modified) — agregar `frontend/.next/`, `frontend/node_modules/`

**Logic**
Esqueleto mínimo de Next.js con Tailwind configurado. `Loader` es un componente puro sin lógica,
recibe `visible: boolean` por props.

**Error handling**
N/A — bloque de scaffolding, sin lógica de negocio ni input de usuario.

**Required tests**
- [ ] `Loader` renderiza el spinner cuando `visible=true` y no renderiza nada cuando `visible=false`

**Completion criterion**
`pnpm dev` levanta la app en modo desarrollo sin errores; el test de `Loader` pasa.

---

## Block 6 — Tema claro/oscuro

**Files**
- `frontend/src/contexts/useThemeStore.ts` (new) — store Zustand: `theme: 'light'|'dark'`, `toggleTheme()`, persistido en `localStorage`
- `frontend/src/components/ThemeToggle.tsx` (new) — UI pura, consume `useThemeStore`
- `frontend/src/app/layout.tsx` (modified) — aplica la clase `theme` en el elemento raíz

**Logic**
`useThemeStore` inicializa `theme` en `'dark'` si no hay valor guardado en `localStorage` (AC-11).
`toggleTheme()` alterna el valor y lo persiste. El layout raíz aplica `className={theme}` de forma
que Tailwind (`darkMode: 'class'`) recolorea toda la interfaz (AC-12).

**Input validation**
N/A — no hay input de usuario más allá del click del toggle.

**Error handling**
- `localStorage` no disponible (SSR) → el store usa `'dark'` como valor inicial hasta hidratarse en cliente, sin lanzar error.

**Required tests**
- [ ] Sin preferencia guardada, `useThemeStore` inicializa en `'dark'` (AC-11)
- [ ] `toggleTheme()` cambia el valor de `'dark'` a `'light'` y viceversa, y lo persiste en `localStorage` (AC-12)
- [ ] El elemento raíz del layout refleja la clase del tema actual
- [ ] Si `localStorage` no está disponible (contexto SSR), `useThemeStore` inicializa en `'dark'` sin lanzar error

**Completion criterion**
Los 4 tests pasan; al cargar la app sin preferencia previa se ve en modo oscuro.

---

## Block 7 — Formulario de transacción

**Files**
- `frontend/src/models/Transaction.types.ts` (new) — tipos puros (request/response)
- `frontend/src/services/TransactionService.ts` (new) — `createTransaction(dto, signal)` vía axios, soporta `AbortSignal`
- `frontend/src/utils/sanitizeInput.ts` (new) — sanitiza `description` (recorta espacios, escapa HTML) antes de enviar, además de la validación de Yup
- `frontend/src/hooks/useCreateTransaction.ts` (new) — orquestación: estado del formulario, `loading`, `error`, llama a `TransactionService`, cancela el fetch al desmontar
- `frontend/src/components/TransactionForm.tsx` (new) — UI pura: campos tipo, monto, fuente, moneda, categoría, fecha, descripción; usa `Loader` mientras `loading`
- `frontend/src/app/page.tsx` (modified) — renderiza `TransactionForm`

**Logic**
`TransactionForm` es controlado por `useCreateTransaction`, que:
1. Mantiene el estado de los campos del formulario.
2. Valida con un schema Yup equivalente al Zod del backend (mismos campos y formatos) antes de enviar — si falla, muestra el error por campo sin llamar al service (AC-04, AC-05, AC-06, AC-09).
3. Sanitiza `description` con `sanitizeInput` antes de armar el DTO (cumple "Sanitizar inputs incluso cuando Yup ya valida la forma" de `AGENTS.md`).
4. Llama a `TransactionService.createTransaction`, con `AbortController` cancelado en el cleanup del efecto (cumple "Nunca hacer fetch sin cancelación").
5. Mientras la request está en curso, `loading=true` → `TransactionForm` muestra `Loader` (NFR-03, AC-10).
6. Si la respuesta es exitosa, limpia el formulario y muestra confirmación.
7. Si la respuesta falla (400, 403, 500), **no limpia los campos** — muestra el mensaje de error devuelto por el backend, conservando todo lo que el usuario ya escribió (FR-11, AC-08).

**Input validation**
Mismas reglas que el Block 3, replicadas en Yup: `type` (enum), `amount` (número > 0), `moneySourceId`/`categoryId` (requeridos, viene de un select con las opciones semilla), `currency` (enum), `date` (formato `DD-MM-YYYY`, input tipo date o máscara), `description` (1–500 caracteres, sanitizada).

**Error handling**
- Validación de Yup falla → error se muestra debajo del campo correspondiente, no se llama al service (AC-04, AC-05, AC-06, AC-09).
- Service responde 400/403/500 → `error` del hook se setea con el mensaje, el formulario conserva los valores ingresados (AC-08).
- El componente se desmonta mientras la request está en curso → `AbortController.abort()` en el cleanup, sin actualizar estado de un componente desmontado.

**Required tests**
- [ ] Completar el formulario de egreso con datos válidos y confirmar → llama a `TransactionService` con el DTO correcto (AC-01)
- [ ] Completar el formulario de ingreso con datos válidos y confirmar → llama a `TransactionService` con el DTO correcto (AC-02)
- [ ] Enviar sin monto → error de validación visible, no se llama al service (AC-04)
- [ ] Enviar con monto `<= 0` → error de validación visible (AC-05)
- [ ] Enviar sin fuente/moneda/categoría/fecha/descripción (uno por caso) → error de validación visible (AC-06)
- [ ] Enviar con fecha en formato distinto a `DD-MM-YYYY` → error de validación visible (AC-09)
- [ ] El service devuelve 403 → el hook expone el error y el formulario conserva los datos ingresados (AC-07, AC-08)
- [ ] El service devuelve 500 → el hook expone el error y el formulario conserva los datos ingresados (AC-08)
- [ ] Mientras la request está en curso, `Loader` está visible; al finalizar, deja de estarlo (AC-10)
- [ ] `sanitizeInput` remueve/escapa contenido HTML de la descripción antes de armar el DTO
- [ ] Si el componente se desmonta mientras la request está en curso, se invoca `AbortController.abort()` y no se actualiza estado sobre un componente ya desmontado

**Completion criterion**
Los 11 tests pasan; probado manualmente en el navegador: completar y confirmar un ingreso y un
egreso reduce/aumenta el balance visible de la fuente (verificable vía la API), y un error del
backend no borra el formulario.

---

## Final verification

- Los 12 FR y las 4 NFR del PRD tienen al menos un bloque que los cubre (tabla de Coverage).
- Las 12 AC tienen al menos un test que las valida, repartido entre Block 3, Block 4, Block 6 y Block 7.
- Las 6 mitigaciones del threat model están implementadas: Zod estricto (Block 3), `$inc` atómico (Block 3/4), verificación de pertenencia antes de escribir (Block 3), error handler centralizado (Block 1/4), timestamps (Block 2), límite de payload (Block 1).
- `pnpm test` (backend y frontend) pasa completo; `pnpm build` de ambos sin errores de tipos.
- Manual: seed corrido, crear un ingreso y un egreso desde el formulario, confirmar que el balance de la fuente cambia en la moneda correcta y no en la otra.
