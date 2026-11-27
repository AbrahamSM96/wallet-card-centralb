# Handoff — Fase 1 (Base)

## Qué se implementó

- Se inicializó Git sin crear commits.
- Se creó el scaffold de Next.js 16 con App Router, React 19, TypeScript
  estricto, Bun y Tailwind CSS v4.
- Se copiaron sin cambios desde `cool-invitations`:
  `.oxlintrc.json`, `.oxfmtrc.json`, `tsconfig.json`,
  `.vscode/settings.json` y `.vscode/extensions.json`.
- Se conservaron los scripts y dependencias de lint/format del proyecto de
  referencia: oxlint type-aware, `oxlint-tsgolint`, oxfmt y `typescript-7`.
- Se agregó Docker Compose con un único servicio `db`, Postgres 17 Alpine,
  puerto local 5434, volumen persistente y healthcheck.
- Se configuró Drizzle con `postgres` (postgres.js), conexión directa para
  migraciones de Neon y scripts de ciclo de vida de la base de datos.
- Se implementó el esquema completo de las diez tablas, enums, claves foráneas
  y restricciones únicas descritas en el plan.
- Se generó la primera migración en `drizzle/0000_loose_hex.sql`.
- Se agregó un seed idempotente para la fila única de `settings`, incluyendo
  las coordenadas de Pachuca definidas en el plan.
- Se agregó validación estricta de `DATABASE_URL`, `SESSION_SECRET` y
  `NODE_ENV` mediante Zod en `src/config/env.ts`.
- Se agregó la configuración de marca en `src/config/site.ts`.
- Se creó la estructura de Atomic Design y las capas de dominio e
  infraestructura previstas, dejando vacíos los módulos que pertenecen a
  fases posteriores.
- Se implementó autenticación del admin con Argon2id, sesión JWT firmada en
  cookie `httpOnly`, protección mediante `proxy.ts`, cierre de sesión y rate
  limit básico por dirección/correo.
- El layout protegido vuelve a validar la sesión y la existencia del admin en
  el servidor, sin depender exclusivamente del proxy.
- Se agregó `admin:create`, que crea un admin o rota su contraseña si el correo
  ya existe.
- Se implementó un layout inicial protegido del panel y una pantalla de login.
- Se agregó CI con Bun 1.3.14, caché, instalación congelada, lint, formato y
  tests.
- Se agregó `vercel-build` con migraciones antes de `next build`.

## Decisiones y por qué

### Argon2 compatible con Vercel

Se usa `@node-rs/argon2` en lugar de llamar directamente a `Bun.password`.
Ambos usan Argon2id, pero las funciones serverless de Vercel ejecutan Next.js
en Node y no exponen la API global de Bun. La librería elegida conserva el
algoritmo requerido y funciona tanto al ejecutar scripts con Bun como al servir
la ruta de login en Node. Es una dependencia nativa precompilada y evita
implementar criptografía propia.

### Sesión firmada sin estado

La sesión contiene únicamente el `adminId`, expira a las ocho horas y se firma
con HS256 usando un secreto obligatorio de al menos 32 caracteres. Esto evita
una tabla adicional de sesiones para el único admin y permite verificar el
acceso desde el proxy antes de llegar a las páginas protegidas.

### Rate limit de mejor esfuerzo

El límite de cinco intentos por ventana de quince minutos se conserva en una
instancia global reutilizada durante hot reload y en invocaciones calientes.
Es suficiente para el rate-limit básico solicitado y no añade Redis en esta
fase. En serverless no constituye un límite global entre instancias; si el
riesgo o el tráfico crecen, debe reemplazarse por un store compartido.

### Esquema fiel y ledger preparado

`stamps.createdByAdminId` es nullable porque un sello `referral_bonus` se crea
automáticamente, sin admin. `orderNumber` sigue siendo nullable pero único:
Postgres admite varios `NULL` y rechaza repetir cualquier pedido real. Se añadió
un `id` entero fijo a `settings` para poder representar y actualizar de forma
determinista la única fila indicada por el plan.

### Next.js actualizado dentro de la misma major

El scaffold comenzó con 16.4.3, igual que la referencia disponible, pero el
build detectó una vulnerabilidad conocida y se detuvo. Se actualizó a 16.4.6,
el parche seguro actual de Next 16, sin cambiar arquitectura ni APIs.

## Patrones usados

- **Singleton:** `src/infrastructure/db/client.ts` conserva una sola instancia
  de postgres.js en `globalThis` durante desarrollo y reutiliza el módulo en
  producción. Evita crear pools adicionales con hot reload o dentro de una
  instancia serverless.
- **Singleton de infraestructura:** el rate limiter también se conserva en
  `globalThis` para no reiniciar el contador en cada hot reload.
- **Atomic Design:** `BrandMark`, `Button`, `Input` y `Label` son átomos;
  `FormField` es una molécula; `LoginForm` es un organismo; y
  `AdminShell`/`PublicShell` son templates. Los átomos de formulario envuelven
  primitivas shadcn para conservar una frontera propia de la aplicación.

No se implementaron Builder, Adapter, Factory Method, Facade ni Decorator. Sus
casos de uso aparecen en las fases de dominio y wallets; agregarlos ahora sería
estructura sin comportamiento y violaría la regla de usar patrones solo cuando
aportan.

## Desviaciones y limitaciones

- No se cambió ninguna regla de lint/format ni ruta dentro de las configuraciones
  copiadas; `sortTailwindcss.stylesheet` ya apunta a la ubicación usada.
- Docker se usa exclusivamente para Postgres y no existe Dockerfile ni servicio
  de aplicación.
- `docker compose config --quiet` pasó, pero no fue posible levantar el
  contenedor porque el daemon de Docker no estaba activo en la máquina de
  ejecución. Por ello no se ejecutaron la migración ni el seed contra una base
  real durante este handoff.
- El login rate limit es local a cada instancia, como se explica arriba.

## Validación realizada

- `bun run check` — verde.
- `bun run lint` — verde.
- `bun run test` — verde (3 tests del rate limiter).
- `bun run format:check` — verde.
- `bun run build` — verde con Next.js 16.4.6.
- `docker compose config --quiet` — verde.
- `bun run db:generate` — generó correctamente la migración inicial.

## Pendientes para fases posteriores

- Ejecutar `bun run db:up`, `bun run db:migrate` y `bun run db:seed` cuando el
  daemon de Docker esté disponible.
- Implementar repositorios, generación de códigos/tokens y `LoyaltyService` en
  la Fase 2.
- Sustituir el rate limiter local por uno compartido únicamente si el perfil de
  despliegue lo requiere.
