# Spec FEAT-008: Login con usuario y contraseña (sin passkeys), con el mismo diseño que la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-008 |
| PRD | docs/ddw/prd/prd-FEAT-008.md |
| Tier | FEATURE |
| Date | 2026-08-31 |
| Spec loops | 1 |
| Loops since last human decision | 0 |

## Summary

El backend firma y verifica su propio JWT (`jsonwebtoken`, `TokenService`), independiente del
formato interno de next-auth (ADR-008). El frontend usa next-auth v4 (`CredentialsProvider`,
estrategia `jwt`, 7 días) sólo para la sesión del navegador — su cookie `HttpOnly` decide si
`proxy.ts` (Next.js 16 renombró `middleware.ts` a `proxy.ts`, función exportada `proxy`, runtime
Node.js por defecto — ver fuente citada al usuario) redirige entre `/` y `/login` según haya sesión
y hacia dónde navegue el usuario (FR-10, FR-18). El JWT del backend viaja dentro del token cifrado
de next-auth pero nunca se expone al cliente: se recupera exclusivamente server-side con
`getToken()`, en `proxy.ts` y en el único Route Handler que hoy necesita reenviarlo
(`app/api/transactions/route.ts`, que delega a `TransactionProxyService`). `resolveSeedUser.ts` se
retira: `authenticate.ts` se monta globalmente sobre el router de la API (excepto
`/api/auth/register` y `/api/auth/login`, las dos rutas públicas) y verifica el JWT en cada
petición, cerrando R1 del análisis de amenazas de FEAT-005 y protegiendo por diseño cualquier
endpoint que se agregue después sin depender de que alguien se acuerde de protegerlo ruta por ruta.

**Variables de entorno nuevas, a agregar manualmente** (el entorno de esta sesión no puede editar
archivos `.env*`): `JWT_SECRET` (backend), `NEXTAUTH_SECRET` y `NEXTAUTH_URL` (frontend, esta última
con el origen de Next.js, ej. `http://localhost:3000` en dev).

## Coverage: PRD → blocks

| Requirement | Covered by |
|---|---|
| FR-01 | Block 4 |
| FR-02 | Block 4 |
| FR-03 | Block 4 |
| FR-04 | Block 4 |
| FR-05 | Block 1 |
| FR-06 | Block 1 |
| FR-07 | Block 4 |
| FR-08 | Block 3 |
| FR-09 | Block 4 |
| FR-10 | Block 3 |
| FR-11 | Block 3 |
| FR-12 | Block 5 |
| FR-13 | Block 5 |
| FR-14 | Block 5 |
| FR-15 | Block 5 |
| FR-16 | Block 2, Block 6 |
| FR-17 | Block 2 |
| FR-18 | Block 3 |
| NFR-01 | Strategy: estrategia `jwt` de next-auth con `maxAge` de 7 días genera la cookie de sesión `HttpOnly` automáticamente; `SameSite` por defecto de next-auth es `Lax`, que ya cumple "Lax o más estricto" sin configuración adicional (Block 3) |
| NFR-02 | Strategy: reutiliza `BCRYPT_COST_FACTOR = 12`, ya definido en `common/constants/security.ts` desde FEAT-005 (Block 1) |
| NFR-03 | Strategy: `UserMapper.toResponseDto` ya proyecta únicamente `id`/`name`/`email` (reutilizado de FEAT-005); `LoginUserService` nunca incluye `passwordHash` en la respuesta (Block 1) |

## Dependencies between blocks

Block 2 depende de Block 1 (`TokenService`, `UnauthorizedError`). Block 3 depende de Block 1 (el
`authorize()` de next-auth necesita `POST /api/auth/login` funcionando). Block 4 depende de Block 3
(usa `signIn()`). Block 5 depende de Block 3 (usa `useSession()`, y toca el mismo `layout.tsx`).
Block 6 depende de Block 2 (backend protegido) y de Block 3 (`getToken()` configurado). Orden de
ejecución: 1 → 2 → 3 → 4 → 5 → 6.

## Block 1 — Login en el backend

**Files**
- `backend/src/application/dtos/request/LoginUserRequestDto.ts` (new)
- `backend/src/application/errors/UnauthorizedError.ts` (new)
- `backend/src/application/services/TokenService.ts` (new)
- `backend/src/application/services/LoginUserService.ts` (new)
- `backend/src/common/constants/security.ts` (modified) — agrega `DUMMY_PASSWORD_HASH`
- `backend/src/presentation/controllers/AuthController.ts` (modified) — agrega handler `login`
- `backend/src/presentation/routes/auth.routes.ts` (modified) — agrega `POST /login`
- `backend/src/infrastructure/swagger/docs/auth.swagger.ts` (modified) — agrega la entrada de
  `/login`, mismo formato swagger-jsdoc que `/register` en el mismo archivo
- `backend/package.json` (modified) — agrega `jsonwebtoken` (+ `@types/jsonwebtoken` dev)

**Logic**
- `LoginUserRequestSchema` (Zod, `.strict()`): `email` (trim, formato email), `password`
  (`min(1)` — el login no repite la regla de longitud mínima del registro, sólo exige que no esté
  vacía).
- `DUMMY_PASSWORD_HASH` en `security.ts`: `bcrypt.hashSync("dummy-timing-normalization",
  BCRYPT_COST_FACTOR)`, calculado una sola vez al cargar el módulo — normaliza el tiempo de
  respuesta cuando el email no existe (mitigación R-04, ver docs/ddw/security/threat-FEAT-008.md).
- `TokenService`: constructor recibe opcionalmente el secreto (default: `process.env.JWT_SECRET`,
  inyectable en tests). `sign(userId: string): string` firma con `algorithm: "HS256"` y
  `expiresIn: "7d"`. `verify(token: string): string` verifica con `algorithms: ["HS256"]` fijado
  explícitamente (mitigación R-06: evita confusión de algoritmo) y devuelve `sub`; cualquier fallo
  (firma inválida, vencido, payload sin `sub` de tipo string) lanza `UnauthorizedError`.
- `LoginUserService`: constructor recibe `IUserRepository` y `TokenService` (inyectados, mismo
  patrón que `RegisterUserService` con `IUserRepository`). `execute(dto)`: valida con
  `LoginUserRequestSchema`; normaliza `email` a minúsculas; busca el usuario. Si NO existe: igual
  ejecuta `bcrypt.compare(password, DUMMY_PASSWORD_HASH)` antes de lanzar
  `UnauthorizedError("Email o clave incorrectos")` — normaliza el tiempo de respuesta (R-04). Si
  existe: compara con `user.passwordHash`; si no coincide, lanza el mismo error con el mismo
  mensaje (FR-06); si coincide, firma con `tokenService.sign(user.id)` y devuelve
  `{ user: UserMapper.toResponseDto(user), token }`.
- `AuthController.login`: instancia `LoginUserService` igual que `registerUser` instancia
  `RegisterUserService`; responde `200` con `{ user, token }`; delega errores a `next(error)`.

**API contract**
- Method + path: `POST /api/auth/login`
- Request: `{ email: string, password: string }`
- Response 200: `{ user: { id: string, name: string, email: string }, token: string }`
- Error codes: `400` (Zod), `401` (`UnauthorizedError`, mensaje único "Email o clave incorrectos")
- Auth: ninguna — endpoint público, igual que `/register`

**Input validation**
`email`: trim, formato email, requerido. `password`: string no vacío, requerido. `.strict()`
rechaza campos extra en el body.

**Error handling**
- Body con `email`/`password` ausentes, mal tipados o con campos extra → `ValidationError` (400).
- Email inexistente → `UnauthorizedError` (401), mensaje "Email o clave incorrectos".
- Clave incorrecta → `UnauthorizedError` (401), mismo mensaje "Email o clave incorrectos".

**Required tests**
- [ ] `test-block1-login-success-returns-user-and-token` — AC-06, AC-17, AC-18
- [ ] `test-block1-login-wrong-password-returns-generic-401` — AC-07
- [ ] `test-block1-login-unknown-email-returns-generic-401` — AC-07
- [ ] `test-block1-login-response-has-exactly-3-user-fields-no-hash` — AC-18, NFR-03
- [ ] `test-block1-login-invalid-body-returns-400` — sad path, validación Zod
- [ ] `test-block1-tokenservice-verify-rejects-tampered-token` — R-06
- [ ] `test-block1-loginuserservice-compares-dummy-hash-for-unknown-email` — R-04 (espía sobre
      `bcrypt.compare` confirmando que se invoca también cuando el usuario no existe)

**Completion criterion**
`POST /api/auth/login` responde `200` con `{user, token}` para credenciales correctas y `401` con
el mismo mensaje para email inexistente o clave incorrecta; `jsonwebtoken` instalado; swagger
documenta el endpoint.

## Block 2 — Autenticación real en transacciones (cierra R1 de FEAT-005)

**Files**
- `backend/src/presentation/middlewares/authenticate.ts` (new)
- `backend/src/app.ts` (modified) — monta `authenticate` globalmente sobre `apiRouter`, después de
  `auth.routes.ts` y antes de cualquier otro router
- `backend/src/presentation/routes/transaction.routes.ts` (modified) — deja de montar un middleware
  de auth propio; lo hereda de `app.ts`
- `backend/src/presentation/middlewares/resolveSeedUser.ts` (deleted)
- `backend/src/__tests__/integration/middlewares/resolveSeedUser.test.ts` (deleted)
- `backend/src/__tests__/integration/middlewares/authenticate.test.ts` (new)
- `backend/src/__tests__/integration/routes/transaction.routes.test.ts` (modified) — deja de armar
  el contexto con `SEED_USER_NAME`; registra un usuario y firma un token real con `TokenService`
  para mandarlo como header

**Logic**
`authenticate(req, res, next)`: lee `req.headers.authorization`; si no empieza con `"Bearer "` →
`UnauthorizedError("No autenticado")`. Si el formato es correcto, llama a
`tokenService.verify(token)`; si lanza (inválido o vencido), se propaga como `UnauthorizedError` vía
`next(error)`; si resuelve, setea `req.userId = sub` y llama a `next()`.

Decisión de montaje (a pedido del usuario, PLAN): en vez de agregar `authenticate` ruta por ruta,
`app.ts` lo monta una sola vez sobre `apiRouter`. El orden de registro es lo que lo excluye de las
rutas públicas — Express evalúa middlewares/rutas en el orden en que se registran — así que `app.ts`
pasa a registrar, en este orden: `apiRouter.use("/api/auth", authRoutes)` primero (una petición a
`/api/auth/register` o `/api/auth/login` ya encuentra respuesta ahí, nunca llega a `authenticate`);
luego `apiRouter.use(authenticate)` (global, sin prefijo de path); recién después
`apiRouter.use("/api/transactions", transactionRoutes)`. Hoy `app.ts` monta `transactionRoutes`
antes que `authRoutes` — este bloque invierte ese orden como parte del cambio. Cualquier router que
se agregue después de `authenticate` queda protegido automáticamente, sin depender de que alguien
se acuerde de agregarle el middleware. `transaction.routes.ts` deja de importar `authenticate` — ya
no le hace falta, lo hereda de `app.ts`.

**API contract**
Sin endpoint nuevo — modifica el contrato de auth de uno existente.
- Method + path: `POST /api/transactions` (sin cambios de método ni de path)
- Request: sin cambios de body; se agrega el requisito de header `Authorization: Bearer <token>`
- Response: sin cambios en el éxito (201, `TransactionResponseDto`)
- Error codes: `401` nuevo — header ausente, malformado, token inválido o vencido
- Auth: antes ninguna (resuelta por `resolveSeedUser` al usuario semilla); ahora `authenticate`
  exige un JWT válido del usuario real

**Error handling**
- Header `Authorization` ausente → `UnauthorizedError` (401).
- Header presente pero sin el prefijo `Bearer ` → `UnauthorizedError` (401).
- Token con firma inválida → `UnauthorizedError` (401).
- Token vencido (más de 7 días) → `UnauthorizedError` (401), mismo tratamiento que inválido.

**Required tests**
- [ ] `test-block2-authenticate-sets-userid-with-valid-token` — AC-14
- [ ] `test-block2-authenticate-returns-401-missing-header` — AC-15
- [ ] `test-block2-authenticate-returns-401-malformed-header` — AC-15, sad path
- [ ] `test-block2-authenticate-returns-401-invalid-token` — AC-15
- [ ] `test-block2-authenticate-returns-401-expired-token` — AC-15
- [ ] `test-block2-createtransaction-uses-authenticated-userid-not-seed` — AC-14, cierra R1 de
      FEAT-005
- [ ] `test-block2-authenticate-does-not-block-register-and-login` — confirma que el montaje
      global no protege `/api/auth/register` ni `/api/auth/login`

**Completion criterion**
`POST /api/transactions` rechaza con `401` cualquier petición sin token válido, y crea la
transacción asociada al usuario del token cuando es válido; `resolveSeedUser.ts` y su test ya no
existen en el repo.

## Block 3 — Núcleo de sesión (next-auth)

**Files**
- `frontend/src/lib/auth.ts` (new)
- `frontend/src/models/next-auth.d.ts` (new) — augmenta los tipos de `next-auth`/`next-auth/jwt`
  para el campo `backendToken`, sin usar `any`
- `frontend/src/app/api/auth/[...nextauth]/route.ts` (new)
- `frontend/src/proxy.ts` (new) — Next.js 16 renombró `middleware.ts` a `proxy.ts` (función
  exportada `proxy`, no `middleware`); vive junto a `app/`, mismo nivel que hoy tendría
  `middleware.ts`
- `frontend/src/components/AuthSessionProvider.tsx` (new)
- `frontend/src/app/layout.tsx` (modified) — envuelve `children` con `AuthSessionProvider`
- `frontend/src/__tests__/app/layout.test.tsx` (modified) — mockea `next-auth/react`
- `frontend/src/models/Auth.types.ts` (modified) — agrega `LoginUserRequestDto`,
  `LoginUserResponseDto`
- `frontend/src/services/AuthService.ts` (modified) — agrega `loginUser`
- `frontend/package.json` (modified) — agrega `next-auth`

**Logic**
- `AuthService.loginUser(dto, signal?)`: `POST /api/auth/login` vía `axiosClient`, devuelve
  `LoginUserResponseDto`; mismo patrón de mapeo de error que `registerUser`, mensaje por defecto
  "No se pudo iniciar sesión. Intentá nuevamente." para errores de red.
- `lib/auth.ts` (`authOptions`): `CredentialsProvider` cuyo `authorize()` llama a
  `AuthService.loginUser`; si falla, devuelve `null` (next-auth lo traduce en `result.error` en el
  cliente). `session.strategy = "jwt"`, `session.maxAge = 60 * 60 * 24 * 7`. Callback `jwt`: si hay
  `user` (login recién ocurrido), guarda `token.backendToken = user.backendToken`. Callback
  `session`: **no** agrega `backendToken` al objeto que devuelve — es la corrección de ADR-008.
  `pages.signIn = "/login"`.
- `route.ts`: `const handler = NextAuth(authOptions); export { handler as GET, handler as POST };`
  — sin lógica propia.
- `proxy.ts` (runtime Node.js, el que usa Next.js 16 por defecto para este archivo — no Edge):
  `getToken({ req, secret: process.env.NEXTAUTH_SECRET })`. Con `pathname === "/login"`: si hay
  token, `NextResponse.redirect(new URL("/", req.url))` (FR-18/AC-19); si no hay, deja pasar. Con
  `pathname === "/"`: si no hay token, `NextResponse.redirect(new URL("/login", req.url))` (FR-10);
  si hay, deja pasar. `export const config = { matcher: ["/", "/login"] }` — no toca `/register`
  (evita el loop de redirección, R4 del PRD) ni ninguna ruta de `/api/*` (esas se protegen solas del
  lado del backend, o gestionan su propio 401 como `app/api/transactions/route.ts`).
- `AuthSessionProvider.tsx`: envuelve `children` con `<SessionProvider>` de `next-auth/react`.
- `layout.test.tsx`: mockea `next-auth/react` (o el fetch a `/api/auth/session`) para que
  `RootLayout` siga renderizando sin red real.

**API contract**
Este bloque no define un endpoint propio: `route.ts` reexporta las rutas internas que next-auth
gestiona bajo `/api/auth/*`. Se documentan para trazabilidad, sin lógica propia sobre ellas:
- Method + path: `POST /api/auth/callback/credentials` (invocado por `signIn("credentials", ...)`)
- Request: `{ email: string, password: string }`, gestionado internamente por next-auth
- Response: `Set-Cookie` con la sesión cifrada si `authorize()` devuelve un usuario; sin cuerpo
  propio relevante
- Error codes: sin `401`/`400` explícito — `authorize()` devolviendo `null` se traduce en
  `result.error` del lado del cliente (consumido en Block 4)
- Auth: ninguna — es el propio mecanismo de autenticación

**Data model**
No aplica: `next-auth.d.ts` sólo amplía tipos de una librería de terceros para agregar el campo
`backendToken` al `JWT`/`User` de next-auth — no define ningún `nullable`, `unique`, `default` ni
otro constraint de persistencia, porque no persiste nada por sí mismo.

**Error handling**
- `authorize()` recibe credenciales inválidas o `AuthService.loginUser` lanza → devuelve `null`,
  next-auth lo traduce en `signIn()` como `result.error` (consumido en Block 4).
- `getToken()` no encuentra cookie, o la cookie no descifra (vencida o manipulada, en ambos casos
  `jose` rechaza la operación y `getToken()` devuelve `null`) → tratado igual que "sin sesión" tanto
  en `proxy.ts` como en cualquier Route Handler que lo consulte.

**Required tests**
- [ ] `test-block3-session-object-excludes-backend-token` — mitigación R-03
- [ ] `test-block3-proxy-redirects-missing-token-from-home` — AC-09
- [ ] `test-block3-proxy-allows-valid-token-on-home` — AC-08
- [ ] `test-block3-proxy-redirects-invalid-token-from-home` — AC-10
- [ ] `test-block3-proxy-redirects-authenticated-user-away-from-login` — AC-19, FR-18
- [ ] `test-block3-proxy-allows-unauthenticated-user-on-login` — sad path inverso, confirma que
      `/login` sigue accesible sin sesión
- [ ] `test-block3-authservice-loginuser-posts-credentials` — cobertura de `AuthService.loginUser`
- [ ] `test-block3-rootlayout-renders-with-sessionprovider-mocked` — actualiza el gap detectado por
      el impact-scanner
- [ ] `test-block3-authoptions-session-strategy-jwt-7-days` — AC-16 (verifica `session.strategy ===
      "jwt"` y `session.maxAge === 60*60*24*7` en `authOptions`; `HttpOnly`/`Secure`/`SameSite` son
      el comportamiento por defecto de next-auth para una sesión `jwt`, no una configuración propia
      de este spec — se documenta acá en vez de reimplementarse)

**Completion criterion**
`proxy.ts` protege `/` en los 3 casos (sin token, con token válido, con token vencido) y redirige
desde `/login` a `/` cuando ya hay sesión (FR-18/AC-19); la sesión servida al cliente no contiene el
JWT del backend; `layout.test.tsx` pasa con el mock de next-auth.

## Block 4 — Pantalla de login

**Files**
- `frontend/src/components/LoginForm.tsx` (new)
- `frontend/src/hooks/useLoginUser.ts` (new)
- `frontend/src/app/login/page.tsx` (modified) — reemplaza el placeholder
- `frontend/src/__tests__/app/login.page.test.tsx` (modified) — reescribe para el `LoginForm` real
  (hoy afirma "sin formulario funcional")
- `frontend/src/__tests__/components/LoginForm.test.tsx` (new)
- `frontend/src/__tests__/hooks/useLoginUser.test.ts` (new)

**Logic**
- `useLoginUser`: mismo patrón que `useRegisterUser` — `values` (`email`, `password`),
  `fieldErrors`, `loading`, `error`, `setFieldValue`, `submit`. Validación yup: `email` requerido +
  formato; `password` requerido (sin mínimo de longitud — el login no repite la regla de alta).
  `submit()`: valida; si pasa, `loading = true` y llama a `signIn("credentials", {redirect: false,
  email, password})` de `next-auth/react`; si `result?.error`, setea `error` = "Email o clave
  incorrectos" (FR-06/AC-07); si éxito, `router.push("/")` (FR-09/AC-06). `signIn()` no acepta
  `AbortSignal` — se documenta como la única diferencia frente a `useRegisterUser`; se mantiene un
  `isMountedRef` para no setear estado tras desmontar.
- `LoginForm.tsx`: mismo patrón visual que `RegisterForm.tsx` — `FormField` "Email" +
  `FormField` "Clave" (`labelSize="base"`, inputs `text-lg`, `rounded-[1rem]`, espaciado
  `space-y-[13px]`), banner `role="alert"` en error, `Loader`, botón "Iniciar sesión" centrado
  (`mx-auto`, `rounded-[1rem]`).
- `login/page.tsx`: `AuthLayout` + título "Iniciar sesión" + `LoginForm` (dynamic import, mismo
  patrón que `RegisterPage`).

**Input validation**
`email`: requerido, formato de email (yup, del lado del cliente, antes de llamar a `signIn()`).
`password`: requerido, sin mínimo de longitud (a diferencia del registro: el login no vuelve a
validar la complejidad de una clave que ya existe, sólo que no esté vacía).

**Error handling**
- Campo `email` vacío o con formato inválido → mensaje de validación bajo el campo, no se llama a
  `signIn()`.
- Campo `password` vacío → mensaje de validación bajo el campo, no se llama a `signIn()`.
- `signIn()` devuelve `result.error` (credenciales incorrectas) → banner de alerta "Email o clave
  incorrectos", formulario habilitado para reintentar, sin redirigir.

**Required tests**
- [ ] `test-block4-loginform-renders-email-and-password-fields` — AC-01
- [ ] `test-block4-loginpage-hides-icon-panel-below-640` — AC-02 (vía `AuthLayout`, reusado)
- [ ] `test-block4-loginpage-reuses-authlayout-icon-panel` — AC-03 (SVG inline heredado de
      `AuthLayout`, sin librería nueva)
- [ ] `test-block4-useloginuser-shows-invalid-email-error` — AC-04
- [ ] `test-block4-useloginuser-shows-missing-password-error` — AC-04
- [ ] `test-block4-useloginuser-disables-submit-while-loading` — AC-05
- [ ] `test-block4-useloginuser-success-redirects-to-home` — AC-06
- [ ] `test-block4-useloginuser-signin-error-shows-generic-message` — AC-07
- [ ] `test-block4-loginpage-renders-loginform` — reemplaza el test del placeholder actual

**Completion criterion**
`/login` renderiza el formulario real con el mismo layout que `/register` (AC-01, AC-02, AC-03);
login exitoso redirige a `/`; login fallido muestra el banner sin redirigir.

## Block 5 — Controles de sesión en el header

**Files**
- `frontend/src/components/SessionControls.tsx` (new)
- `frontend/src/components/LogoutButton.tsx` (new)
- `frontend/src/hooks/useLogout.ts` (new)
- `frontend/src/components/ThemeToggle.tsx` (modified) — quita `fixed right-4 top-4 z-50` de
  `TOGGLE_BUTTON_CLASSNAME`
- `frontend/src/app/layout.tsx` (modified, mismo archivo que Block 3) — cambia `<ThemeToggle />`
  standalone por `<SessionControls />`
- `frontend/src/__tests__/components/ThemeToggle.test.tsx` (modified) — actualiza los 2
  `toHaveClass` que hoy esperan las clases de posicionamiento fijo
- `frontend/src/__tests__/components/SessionControls.test.tsx` (new)
- `frontend/src/__tests__/components/LogoutButton.test.tsx` (new)

**Logic**
- `useLogout()`: `logout = useCallback(() => signOut({ callbackUrl: "/login" }), [])`.
- `LogoutButton.tsx`: `rounded-[1rem] border border-error bg-surface px-3 py-2 text-error
  hover:bg-error hover:text-white`; `onClick` llama a `useLogout().logout`; texto "Cerrar sesión".
- `SessionControls.tsx`: `useSession()` de next-auth; contenedor
  `fixed right-4 top-4 z-50 flex items-center gap-2` que renderiza `LogoutButton` sólo si hay
  sesión, seguido siempre de `ThemeToggle`.
- `ThemeToggle.tsx`: `TOGGLE_BUTTON_CLASSNAME` pierde las clases de posicionamiento fijo, que ahora
  las provee el contenedor.
- `layout.tsx`: reemplaza `<ThemeToggle />` por `<SessionControls />`.

**Error handling**
- `useSession()` en estado `loading` (todavía no resolvió) → `SessionControls` no renderiza
  `LogoutButton` hasta que el estado sea `authenticated` o `unauthenticated` (evita un parpadeo del
  botón).
- `signOut()` falla de red → next-auth igual limpia la cookie local y redirige a `/login`
  (comportamiento de la librería, no requiere manejo propio).

**Required tests**
- [ ] `test-block5-sessioncontrols-shows-logout-when-authenticated` — AC-11
- [ ] `test-block5-sessioncontrols-hides-logout-when-unauthenticated` — AC-11
- [ ] `test-block5-sessioncontrols-hides-logout-during-session-loading-error` — AC-11, sad path
- [ ] `test-block5-sessioncontrols-keeps-themetoggle-position-without-session` — AC-13
- [ ] `test-block5-logoutbutton-rest-state-has-error-colors` — AC-12
- [ ] `test-block5-logoutbutton-hover-inverts-colors` — AC-12
- [ ] `test-block5-logoutbutton-click-calls-signout-with-login-callback` — AC-13
- [ ] `test-block5-logoutbutton-signout-network-error-still-redirects` — AC-13, sad path
- [ ] `test-block5-themetoggle-no-longer-owns-fixed-positioning` — actualiza el gap detectado por
      el impact-scanner

**Completion criterion**
Con sesión, aparecen ambos controles agrupados en la esquina superior derecha; sin sesión, sólo el
toggle, en la misma posición que hoy; click en "Cerrar sesión" limpia la sesión y redirige a
`/login`.

## Block 6 — Transacciones autenticadas sin exponer el token (ADR-008)

**Files**
- `frontend/src/app/api/transactions/route.ts` (new)
- `frontend/src/services/TransactionProxyService.ts` (new) — primera línea `import "server-only";`
- `frontend/src/lib/internalApiClient.ts` (new)
- `frontend/src/services/TransactionService.ts` (modified) — usa `internalApiClient` en vez de
  `axiosClient`/`axios` pelado para este endpoint
- `frontend/src/__tests__/services/TransactionProxyService.test.ts` (new)
- `frontend/src/__tests__/app/api/transactions.route.test.ts` (new)

**Logic**
- `lib/internalApiClient.ts`: `axios.create({})` (sin `baseURL`), instancia nombrada — resuelve
  rutas relativas contra el propio origen de Next.js, igual que `axiosClient.ts` centraliza la
  configuración hacia Express.
- `TransactionProxyService.createTransaction(token: string, dto: CreateTransactionRequestDto):
  Promise<TransactionResponseDto>`: server-only (`import "server-only"` impide que se incluya en un
  bundle de cliente), llama a Express con `axiosClient.post("/api/transactions", dto, { headers: {
  Authorization: \`Bearer ${token}\` } })`; mapea el error de Express a un `Error` con sólo el
  mensaje (nunca el objeto completo de la respuesta).
- `route.ts` (runtime Node, sin `export const runtime = "edge"`): `getToken({req, secret:
  process.env.NEXTAUTH_SECRET})` — vive acá porque necesita el `NextRequest`, no en el service. Sin
  `token?.backendToken` → `NextResponse.json({error: "No autenticado"}, {status: 401})`, sin llamar
  a Express. Con token, delega a `TransactionProxyService.createTransaction` y devuelve
  `NextResponse.json(result, {status: 201})`; en error, sólo el mensaje mapeado, nunca headers ni
  el token, ni siquiera en el path de error.
- `TransactionService.ts`: cambia el cliente usado para pegarle a la ruta relativa
  `/api/transactions` — ahora es la ruta propia de Next.js (Block 6), no Express directamente.

**API contract**
- Method + path: `POST /api/transactions` (ruta de Next.js)
- Request: mismo shape que `CreateTransactionRequestDto`
- Response 201: `TransactionResponseDto`
- Error codes: `401` sin sesión válida, `400` si Express rechaza el body o una regla de negocio
- Auth: sesión de next-auth (`getToken()`), reenviada como `Authorization: Bearer` a Express

**Error handling**
- Sin `token.backendToken` (sin sesión válida) → `401` sin llamar a Express.
- Express responde con un error (validación, regla de negocio) → se reenvía sólo el mensaje,
  mapeado a `400`, nunca el objeto completo de la respuesta de Express.

**Required tests**
- [ ] `test-block6-route-returns-401-without-session` — defensa en profundidad además de AC-15
- [ ] `test-block6-route-forwards-valid-session-to-backend` — flujo feliz
- [ ] `test-block6-route-maps-backend-error-to-400` — sad path, cierra el bullet de Error handling
- [ ] `test-block6-route-response-never-includes-token-or-headers` — mitigación explícita del
      análisis de amenazas (docs/ddw/security/threat-FEAT-008.md)
- [ ] `test-block6-transactionproxyservice-attaches-bearer-header` — AC-14
- [ ] `test-block6-transactionservice-calls-internal-route-not-express` — confirma el cambio de
      destino

**Completion criterion**
Crear una transacción desde el formulario llega a Express con el token correcto sin que el
navegador lo haya visto en ningún momento; sin sesión válida, la ruta de Next.js responde `401` sin
llegar a llamar a Express.

## Final verification

Flujo completo: registrarse → loguearse → la sesión persiste al refrescar `/` → crear una
transacción queda atribuida al usuario real (no al semilla) → cerrar sesión → `/` vuelve a
redirigir a `/login`. Backend: `pnpm test`, `tsc --noEmit`, `pnpm lint` limpios; cobertura ≥ 80% en
los archivos nuevos/modificados. Frontend: mismos tres comandos limpios; `resolveSeedUser.ts` y su
test ya no existen. SAST sin hallazgos nuevos sobre `jsonwebtoken`/`next-auth`. Las 3 variables de
entorno nuevas (`JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) documentadas para que el usuario
las agregue manualmente antes de correr la app.
