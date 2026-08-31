# Threat model FEAT-008: Login con usuario y contraseña (sin passkeys)

| Field | Value |
|-------|-------|
| Ticket | FEAT-008 |
| Spec | docs/ddw/specs/spec-FEAT-008.md |
| Tier | FEATURE |
| Date | 2026-08-31 |

## Components

| Component | Source in the spec |
|---|---|
| `backend/src/application/services/LoginUserService.ts` | Block 1 |
| `backend/src/application/services/TokenService.ts` | Block 1 |
| `backend/src/presentation/controllers/AuthController.ts` (handler `login`) | Block 1 |
| `backend/src/presentation/middlewares/authenticate.ts` | Block 2 |
| `frontend/src/lib/auth.ts` (authOptions de next-auth) | Block 3 |
| `frontend/src/proxy.ts` | Block 3 |
| `frontend/src/components/LoginForm.tsx` + `frontend/src/hooks/useLoginUser.ts` | Block 4 |
| `frontend/src/components/SessionControls.tsx` + `LogoutButton.tsx` + `useLogout.ts` | Block 5 |
| `frontend/src/app/api/transactions/route.ts` + `frontend/src/services/TransactionProxyService.ts` | Block 6 |

## Trust boundaries

- **Navegador → servidor Next.js** (internet público): el formulario de login, `signIn()` de
  next-auth, la navegación a `/`. El navegador nunca sostiene el JWT del backend, sólo la cookie
  cifrada `HttpOnly` de next-auth.
- **Servidor Next.js → backend Express** (red del servidor, no del navegador): `authorize()` de
  `lib/auth.ts` llamando a `POST /api/auth/login`, y `TransactionProxyService` llamando a
  `POST /api/transactions` con `Authorization: Bearer`. Este es el cruce donde vive el JWT del
  backend; nunca cruza hacia el navegador.
- **`proxy.ts` (runtime Node.js — Next.js 16 renombró `middleware.ts` a `proxy.ts` y lo corrió de
  Edge a Node por defecto) → páginas/Route Handlers de Next.js**: decide si redirige entre `/` y
  `/login` según haya sesión, pero no es el límite de seguridad real de la API — ver Elevation of
  Privilege de `authenticate.ts` abajo.
- **Backend Express → MongoDB**: la consulta por email y la lectura de `passwordHash` cruzan hacia
  el almacén persistente.

## STRIDE analysis

### `backend/src/application/services/LoginUserService.ts`
- **Spoofing:** un atacante con el email y la clave correctos de otra cuenta se autentica como esa
  cuenta — es el comportamiento esperado del login, mitigado únicamente por la fortaleza de la
  clave del usuario (fuera de control de este componente).
- **Tampering:** el body llega validado por `LoginUserRequestSchema` (Zod, `.strict()`); un payload
  con campos extra o mal tipados se rechaza antes de tocar la base.
- **Repudiation:** hoy no se registra el intento de login (éxito o fallo) en ningún log de
  aplicación — no hay traza de quién intentó autenticarse ni cuándo. No es un requisito del PRD y
  no lo agrego por mi cuenta, pero lo dejo nombrado: no hay forma de reconstruir después un
  incidente de fuerza bruta a partir de logs propios de esta feature.
- **Information Disclosure:** el mensaje "Email o clave incorrectos" es idéntico para email
  inexistente y clave incorrecta (FR-06 del PRD) — no revela cuáles emails están registrados. Pero
  el *tiempo* de respuesta sí difiere: si el email no existe, el servicio retorna sin llamar a
  `bcrypt.compare`; si existe, sí lo hace (~100ms con factor 12). Un atacante que mida la latencia
  puede inferir qué emails están registrados aunque el mensaje sea igual → **R-04**.
- **Denial of Service:** `bcrypt.compare` es deliberadamente lento; sin límite de intentos (R-01,
  ya declarado en el PRD como fuera de alcance), múltiples peticiones concurrentes con emails
  válidos agotan CPU. El límite de payload de `express.json({limit:"10kb"})` ya acotado a nivel de
  `app.ts` mitiga el vector de payloads grandes, no el de volumen de intentos.
- **Elevation of Privilege:** el JWT emitido sólo lleva `sub` (id de usuario) y `exp` — sin campo de
  rol ni permiso, no hay nada que escalar dentro del token mismo.

### `backend/src/application/services/TokenService.ts`
- **Spoofing:** si `JWT_SECRET` se filtra (repo, logs, variable de entorno mal manejada), cualquiera
  puede forjar un token válido para cualquier `sub` → **R-02**.
- **Tampering:** `jsonwebtoken.verify()` rechaza cualquier token cuya firma no coincida; un payload
  alterado sin resignar es indetectable como válido y se descarta.
- **Repudiation:** N/A — este componente no autoriza acciones de usuario, sólo firma/verifica.
- **Information Disclosure:** el payload del JWT (`sub`, `exp`) no es sensible en sí mismo si el
  token se filtra — no lleva email ni clave —, pero sí permite impersonar a ese `sub` mientras no
  venza (ver R-05, limitación aceptada).
- **Denial of Service:** N/A, operación local sin I/O de red.
- **Elevation of Privilege:** si `verify()` no fija explícitamente el algoritmo esperado,
  `jsonwebtoken` acepta el algoritmo que declare el propio token — un atacante podría intentar un
  token con `alg: none` o forzar una confusión de algoritmo → **R-06**.

### `backend/src/presentation/middlewares/authenticate.ts`
- **Spoofing:** sin `Authorization` header, o con un token que no verifica, se rechaza con 401 —
  no hay ningún valor por defecto que autentique a nadie (a diferencia de `resolveSeedUser.ts`, que
  siempre resolvía al usuario semilla).
- **Tampering:** delega la verificación de integridad del token a `TokenService.verify()`; este
  middleware no interpreta el payload por su cuenta.
- **Repudiation:** no registra el resultado de cada verificación (éxito o 401) — mismo hueco que
  `LoginUserService`, ver R-07.
- **Information Disclosure:** el 401 no distingue en su respuesta si el problema fue el header
  ausente, el formato o la firma — no filtra detalle interno del motivo del rechazo.
- **Denial of Service:** `TokenService.verify()` es una operación local (descifrado HMAC), sin
  I/O de red — costo marginal por petición.
- **Elevation of Privilege — la nota central de este componente:** `proxy.ts` del frontend protege
  la *navegación* a `/` y `/login`, pero **el límite de seguridad real es este middleware**:
  cualquier cliente (el navegador, `curl`, otra herramienta) que le pegue directo a
  `POST /api/transactions` sin pasar por Next.js no evita nada, porque `authenticate.ts` exige el
  JWT válido independientemente de cómo llegó la petición. Se monta globalmente sobre `apiRouter`
  (excepto `/api/auth/register` y `/api/auth/login`), así que cualquier ruta que se agregue después
  queda protegida sin depender de que alguien la registre explícitamente. Esto es exactamente lo que
  pide RNF-10 del PRD del producto (el backend verifica la pertenencia por sí mismo) y lo que
  corrige el retiro de `resolveSeedUser.ts` (R1 del análisis de amenazas de FEAT-005, que dejaba
  pasar a cualquiera como el usuario semilla sin verificar nada).

### `frontend/src/lib/auth.ts` (authOptions de next-auth)
- **Spoofing:** `authorize()` delega la verificación real a `LoginUserService` vía
  `AuthService.loginUser` — este archivo no reimplementa ninguna lógica de credenciales.
- **Tampering:** la cookie de sesión de next-auth está cifrada (JWE) con `NEXTAUTH_SECRET`; alterarla
  sin la clave la invalida en el próximo `getToken()`.
- **Repudiation:** N/A — configuración declarativa, no ejecuta ninguna acción de usuario por sí
  misma más allá de delegar a `AuthService.loginUser`.
- **Information Disclosure — el hallazgo que originó ADR-008:** el callback `session()` es el único
  punto donde el JWT del backend podría filtrarse hacia `useSession()`/`getSession()` del lado del
  cliente si alguien lo agrega ahí por error en un cambio futuro. Mitigado por diseño (no se incluye
  hoy) pero es una regresión fácil de introducir sin darse cuenta → mitigación: un test que afirme
  explícitamente que la sesión servida al cliente NO contiene `backendToken` (ver spec, Block 3).
- **Denial of Service:** N/A — configuración declarativa sin I/O propio más allá de delegar a
  `AuthService.loginUser`.
- **Elevation of Privilege:** N/A — el token firmado sólo lleva `sub`, sin campo de rol que este
  archivo pudiera propagar mal.

### `frontend/src/proxy.ts`
- **Spoofing:** decide únicamente si redirige entre `/` y `/login` según haya sesión (FR-10, FR-18);
  no toma ninguna decisión de autorización sobre datos (ver nota en `authenticate.ts` arriba) — su
  bypass no expone nada que `authenticate.ts` no proteja ya del lado del backend.
- **Tampering:** delega la verificación de integridad de la cookie a `getToken()` (next-auth); no
  interpreta el payload por su cuenta.
- **Repudiation:** N/A — no ejecuta ninguna acción de usuario, sólo redirige o deja pasar.
- **Information Disclosure:** N/A — no expone ningún dato en la respuesta de redirect.
- **Denial of Service:** corre en el runtime Node.js (Next.js 16 movió `proxy.ts` de Edge a Node
  por defecto) en cada petición a `/` o `/login`; es una verificación criptográfica local
  (`getToken()` descifra la cookie), sin llamada de red — costo marginal.
- **Elevation of Privilege:** N/A — su bypass no eleva ningún privilegio, porque no es el límite de
  seguridad real (ver nota en `authenticate.ts`). Que ahora también decida el redirect desde
  `/login` (FR-18) no cambia esto: sigue sin tomar ninguna decisión sobre datos.

### `backend/src/presentation/controllers/AuthController.ts` (handler `login`)
- **Spoofing:** delega íntegro a `LoginUserService` — no reimplementa ninguna verificación propia
  que pudiera quedar desalineada con la de `login`.
- **Tampering:** no manipula el body ni la respuesta; los pasa entre `req` y el servicio sin
  transformación propia.
- **Repudiation:** ídem `LoginUserService` — no registra el intento (ver nota de esa sección).
- **Information Disclosure:** responde exactamente lo que `LoginUserService.execute()` devuelve
  (`{ user, token }`); no agrega ningún campo extra ni loguea el body de la petición (que incluiría
  la clave en texto plano).
- **Denial of Service:** N/A propio — hereda el perfil de `LoginUserService`.
- **Elevation of Privilege:** N/A — es un endpoint público, no distingue roles.

### `frontend/src/app/api/transactions/route.ts` + `frontend/src/services/TransactionProxyService.ts`
- **Spoofing:** sin token válido (`getToken()` devuelve `null` o sin `backendToken`), responde 401
  sin llamar a Express — evita gastar una petición saliente con una sesión inválida.
- **Tampering:** el body de la petición del navegador se valida igual que hoy dentro de
  `CreateTransactionService` (Zod, ya existente); este proxy no le agrega ni le saca validación.
- **Repudiation:** N/A — no es este componente el que decide qué se persiste; sólo reenvía.
- **Information Disclosure:** el Route Handler reenvía únicamente el body de negocio de la
  respuesta de Express (`TransactionResponseDto`) — nunca headers ni el token, ni siquiera en caso
  de error (el mapeo de error debe extraer sólo el mensaje, no el objeto completo de Express, que
  podría incluir detalles internos).
- **Denial of Service:** cada petición autenticada del navegador dispara una petición saliente
  Next.js→Express; un cliente que spamee `/api/transactions` amplifica tráfico interno. Mismo
  vector que ya existía indirectamente (no es nuevo de este ticket) y no tiene mitigación propia
  hoy — heredado, no introducido.
- **Elevation of Privilege:** N/A — el `sub` del token reenviado es el mismo que verificó
  `authenticate.ts` del lado del backend; este componente no puede sustituirlo.

### `frontend/src/components/LoginForm.tsx` + `frontend/src/hooks/useLoginUser.ts`
- **Spoofing:** no verifica identidad por sí mismo — delega íntegro en `signIn("credentials", ...)`
  de next-auth, que a su vez llama a `lib/auth.ts`.
- **Tampering:** ninguna diferencia de riesgo respecto de `RegisterForm.tsx`/`useRegisterUser.ts`,
  mismo patrón ya en producción (`dev`).
- **Repudiation:** N/A — no persiste ni registra nada por sí mismo.
- **Information Disclosure:** `sanitizeInput` no aplica al email/clave de login (no se persisten ni
  se renderizan de vuelta), consistente con que el login no escribe datos nuevos; el campo `password`
  nunca queda en el DOM más allá del input controlado (`type="password"`).
- **Denial of Service:** N/A — sin límite propio de reintentos del lado del cliente; el límite (o su
  ausencia) es responsabilidad del backend (R-01).
- **Elevation of Privilege:** N/A — no distingue roles ni permisos.

### `frontend/src/components/SessionControls.tsx` + `LogoutButton.tsx` + `useLogout.ts`
- **Spoofing:** el botón sólo se renderiza `WHILE` hay sesión (`useSession()` de next-auth, no un
  estado propio) — no hay forma de que aparezca sin sesión real ni de que dispare un logout de otra
  cuenta.
- **Tampering:** N/A — no manipula ningún dato, sólo invoca `signOut()`.
- **Repudiation:** `signOut()` limpia la cookie del lado del navegador; no hay registro de que el
  usuario cerró sesión, consistente con que tampoco se registra el login (ver nota de
  `LoginUserService` arriba).
- **Information Disclosure:** N/A — no expone ningún dato adicional; `useSession()` ya excluye
  `backendToken` (ver `lib/auth.ts`).
- **Denial of Service:** N/A — sin I/O propio más allá de la llamada a `signOut()` de next-auth.
- **Elevation of Privilege:** N/A — cerrar sesión sólo reduce privilegios, nunca los aumenta.

## Data classification

| Data | Class | At rest | In transit |
|---|---|---|---|
| `password` (clave en texto plano, sólo en el body de la petición) | Credentials | No se persiste nunca | Depende de TLS en el despliegue (fuera de alcance de este ticket; en dev corre sobre HTTP plano) |
| `passwordHash` | Credentials | bcrypt, factor ≥ 12 (ya implementado en FEAT-005, no lo toca este ticket) | Nunca sale del backend — no forma parte de `UserResponseDto` |
| `email` | PII | Sin cifrado a nivel de columna en MongoDB (preexistente desde FEAT-005; fuera de alcance corregirlo acá) | Depende de TLS en el despliegue |
| JWT del backend (`Authorization: Bearer`) | Credentials | Sin estado, nunca persiste — vive sólo en la cookie cifrada de next-auth (server-side) durante su vigencia de 7 días | Viaja como header, nunca como cookie del navegador; nunca se serializa hacia el cliente (ADR-008) |
| Cookie de sesión de next-auth | Credentials | Cifrada (JWE) con `NEXTAUTH_SECRET`, marcada `HttpOnly`; `Secure` si `NEXTAUTH_URL` usa `https://` | Depende de TLS en el despliegue |

## Risks and mitigations

| ID | Risk | STRIDE | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-01 | Sin límite de intentos, el endpoint de login queda expuesto a fuerza bruta/credential stuffing | S | H | H | Declarado fuera de alcance en el PRD (ticket propio pendiente). Mitigado parcialmente por bcrypt factor ≥ 12 (encarece cada intento) y el mensaje genérico (no confirma qué emails existen) — ver R-04 para el resto |
| R-02 | Filtración de `JWT_SECRET` permite forjar tokens válidos para cualquier usuario | S/E | L | Critical | `JWT_SECRET` vive sólo en la variable de entorno del backend, nunca en el repo ni en logs; `TokenService` lo lee de `process.env` y falla al arrancar si no está seteado (documentado en el spec como precondición de despliegue) |
| R-03 | Regresión futura que agregue `backendToken` al callback `session()` de next-auth, exponiéndolo al cliente | I | M | High | Test explícito (Block 3 del spec) que verifica que la sesión servida al cliente no contiene `backendToken`; documentado en ADR-008 como la decisión que este test protege |
| R-04 | Diferencia de tiempo de respuesta entre email inexistente (falla inmediata) y clave incorrecta (corre bcrypt.compare) permite inferir qué emails están registrados, pese al mensaje genérico | I | M | Medium | `LoginUserService` ejecuta `bcrypt.compare` contra un hash fijo de relleno también cuando el email no existe, antes de responder el mismo error genérico — normaliza el tiempo de respuesta en ambos casos. Se agrega al spec del Block 1 |
| R-05 | El JWT del backend es sin estado: cerrar sesión borra la cookie de next-auth pero no invalida el JWT en sí, que sigue siendo válido hasta su expiración natural si fue capturado por otra vía | T/E | L | Medium | Aceptado — ver Accepted Risks |
| R-06 | `jsonwebtoken.verify()` sin fijar el algoritmo esperado abre la puerta a confusión de algoritmo | E | L | High | `TokenService` fija explícitamente `algorithm: "HS256"` al firmar y `algorithms: ["HS256"]` al verificar — se agrega al spec del Block 1 |
| R-07 | Sin registro de intentos de login (éxito/fallo), no hay forma de reconstruir un incidente de fuerza bruta después de ocurrido | R | M | Low | No forma parte de ningún FR del PRD; no se agrega por iniciativa propia. Queda nombrado para que el ticket de rate-limiting (que sí depende de saber cuántos intentos hubo) lo retome |

## Accepted risks

### R-01
- **Accepted by:** usuario (aprobó el PRD de FEAT-008, que declara la falta de rate-limiting
  explícitamente en su sección de Riesgos y en Out of Scope)
- **Justification:** requiere una decisión de diseño propia (limitador en memoria vs. con
  almacenamiento compartido, umbrales, bloqueo temporal vs. permanente) que amerita su propio
  ticket en vez de resolverse de apuro dentro de éste.
- **Review conditions:** antes de que la aplicación salga de un contexto de curso/desarrollo hacia
  usuarios reales, o inmediatamente si se observan intentos de fuerza bruta en producción.

### R-05
- **Accepted by:** usuario (aprobó el PRD de FEAT-008, que declara esta limitación explícitamente
  en Risks and Mitigations y en las Consequences de ADR-008)
- **Justification:** no existe almacén de sesiones (Redis u otro) en el stack del proyecto; agregar
  uno sólo para poder revocar un JWT en logout es desproporcionado para el alcance de este ticket.
  El requisito funcional (FR-15: cerrar sesión y volver a `/login`) se cumple igual, porque la
  cookie de next-auth sí se invalida y es la que decide el acceso a `/`.
- **Review conditions:** revisar si el stack incorpora un almacén de sesiones por otro motivo, o si
  se reporta un token comprometido que necesite revocación activa.

## Supply chain

Dos dependencias nuevas, ambas justificadas en ADR-008:
- `jsonwebtoken` (backend): librería estándar para firmar/verificar JWT, ampliamente auditada.
  Se instala en su versión estable más reciente disponible al momento de CODE.
- `next-auth` v4 (frontend): ya declarada en `AGENTS.md` → Stack desde antes de este ticket, nunca
  instalada hasta ahora. Maneja su propio cifrado de cookie (JWE) con `NEXTAUTH_SECRET`.

Ambas quedan cubiertas por el SAST del proyecto al cierre de CODE, igual que cualquier otra
dependencia agregada en tickets anteriores (bcryptjs, zod).

## Availability

No hay un vector de disponibilidad nuevo más allá de los ya nombrados en R-01 (fuerza bruta contra
bcrypt) y el DoS heredado del proxy de transacciones (STRIDE de
`app/api/transactions/route.ts` arriba) — ninguno introduce una superficie que no exista ya de
forma equivalente en el resto de la aplicación (todo endpoint público que valida contra Mongo tiene
el mismo perfil).
