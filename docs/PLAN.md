# Central Brownies — Wallet Loyalty CRM

Plan de implementación. Autor: Claude (revisor). Ejecutor: opencode.

## 0. Contexto

Panel de lealtad de uso personal para **Central Brownies**. Emite tarjetas de
sellos a **Apple Wallet** y **Google Wallet**. Los sellos viven en el servidor;
el pase solo muestra el estado. La mayoría de los pedidos se entregan a
domicilio, así que **sellar por ID desde el panel** es el flujo principal.

### Reglas de negocio (fijas)

1. **Tarjeta única:** se reparte con un link de reclamo de **un solo uso** (QR o
   WhatsApp). Segundo uso → pantalla "Esta tarjeta ya fue reclamada".
2. **ID corto legible:** `CB-XXXX` (alfabeto sin `0/O/1/I/L`), único.
3. **Sello ligado a pedido:** cada sello de tipo `order` lleva `orderNumber`
   único. Un pedido no se sella dos veces.
4. **Referidos:** cada tarjeta tiene liga `/r/<publicCode>`. El invitado llena
   nombre, correo, celular, cumpleaños y acepta aviso de privacidad → recibe su
   propia tarjeta. Cuando el invitado recibe su **primer sello de tipo
   `order`**, el que invitó gana **+1 sello** (`referral_bonus`), **una sola
   vez por invitado**, en la misma transacción.
5. **Cumpleaños:** cron diario. A quien cumple hoy (zona
   `America/Mexico_City`) se le actualiza el pase con el texto de promoción
   configurado en el panel. Idempotente: máximo un aviso por cliente por año.
6. **Ubicación de la tienda** (relevancia en pantalla de bloqueo):
   Av. Benito Juárez s/n, Constitución, 42060 Pachuca de Soto, Hgo.
   `latitude: 20.116710019053915`, `longitude: -98.74697712947373`.
   Se guarda en `settings`, editable desde el panel, no hardcodeada en la UI.
7. **Segundo dispositivo (Apple):** si un mismo serial se registra en un segundo
   `deviceLibraryIdentifier`, marcar la tarjeta `flagged` y mostrarlo en el
   panel. No anular automáticamente.
8. **Aviso de privacidad** (LFPDPPP): página `/privacidad` + checkbox
   obligatorio en todo formulario público. Guardar `privacyAcceptedAt`.

## 1. Stack y base de configuración

- Next.js 16 (App Router) + React 19 + TypeScript estricto, **bun**.
- Postgres: **Docker en dev**, **Neon en prod**. **Drizzle ORM** con el driver
  **`postgres` (postgres.js)** en ambos entornos (NO `@neondatabase/serverless`:
  no conecta a un Postgres local). Solo cambia `DATABASE_URL`.
- Tailwind v4 + shadcn (como en `cool-invitations`).
- Zod para validar toda entrada (forms, route handlers, env).
- Vitest para tests de dominio.
- Hosting: **Vercel** (sin Render, sin Dockerfile de app). Cron con Vercel Cron.

### 1.1 Lint/format — copiar TAL CUAL de `cool-invitations`

```bash
for f in .oxlintrc.json .oxfmtrc.json tsconfig.json .vscode/settings.json .vscode/extensions.json; do
  mkdir -p "$(dirname "$f")"
  gh api "repos/AbrahamSM96/cool-invitations/contents/$f" -H "Accept: application/vnd.github.raw" > "$f"
done
```

- **No Prettier, no ESLint.** oxlint (type-aware, con `oxlint-tsgolint`) +
  oxfmt + tsgo (`typescript-7`) para typecheck.
- Mismos scripts y devDependencies de lint/format que `cool-invitations`
  (`lint`, `lint:fix`, `typecheck`, `format`, `format:check`, `check`).
- Ajustar en `.oxlintrc.json` / `.oxfmtrc.json` **solo** rutas que difieran
  (p. ej. `sortTailwindcss.stylesheet`). Cualquier otro cambio a reglas se
  justifica en el handoff.
- El código debe pasar las reglas: JSDoc en cada función, return types
  explícitos, `sort-keys`, `sort-destructure-keys`, sin `console`, sin `any`.

### 1.2 Docker — basado en `cms-catalog-cars`, solo la base de datos

Referencia: `gh api repos/AbrahamSM96/cms-catalog-cars/contents/docker-compose.yml -H "Accept: application/vnd.github.raw"`

- `docker-compose.yml` con un único servicio `db`: `postgres:17-alpine`,
  `container_name: central-brownies-db`, puerto host **5433**, volumen
  `pgdata`, healthcheck `pg_isready`. Comentarios explicativos como en el repo
  de referencia.
- **Sin** perfil `app`, **sin** Dockerfile (Vercel no usa contenedores).
- Scripts: `db:up`, `db:down`, `db:logs`, `db:reset`, `db:generate`,
  `db:migrate`, `db:studio`, `db:seed`.
- `drizzle.config.ts` como el de `cool-invitations` (carga `.env.local`/`.env`,
  quita `-pooler.` para migraciones).
- `.env.example` comentado **en español**, estilo `cms-catalog-cars`.

### 1.3 CI

`.github/workflows/ci.yml` basado en el de `cms-catalog-cars`: bun 1.3.x,
caché de bun, `bun install --frozen-lockfile`, `lint`, `format:check`, `test`.
Sin workflow de deploy (Vercel despliega solo desde Git).

Build de Vercel: `drizzle-kit migrate && next build` (script `vercel-build`).

## 2. Arquitectura

### 2.1 Carpetas (Atomic Design + capas)

```
src/
  app/                      # rutas (delgadas: validan, llaman al dominio, renderizan templates)
    (admin)/admin/...       # panel protegido
    (public)/c/[token]      # reclamo de tarjeta
    (public)/r/[code]       # formulario de referido
    (public)/privacidad
    api/
      apple/v1/...          # PassKit web service
      cron/birthdays
  components/
    ui/                     # primitivas shadcn (ignoradas por lint)
    atoms/                  # Button, Input, Badge, StampDot, Logo...
    molecules/              # FormField, StampProgress, CustomerSearch, CopyLink...
    organisms/              # CustomerTable, StampCardPreview, ReferralForm, StampDialog...
    templates/              # AdminShell, PublicShell, ClaimLayout
  domain/                   # reglas de negocio puras, sin Next ni DB directos
    loyalty/
    referrals/
    birthdays/
  infrastructure/
    db/                     # schema.ts, client.ts, repositories/
    wallet/
      apple/
      google/
    notifications/
  config/
    site.ts                 # marca: nombre "Central Brownies", colores, textos
    env.ts                  # validación Zod de env (falla al arrancar si falta algo)
```

Regla: **un componente por archivo** (`react/no-multi-comp`). Las páginas de
`app/` componen **templates/organisms**; no meten lógica de negocio.

### 2.2 Patrones de diseño — usar solo donde aportan

Aplica estos; si decides no usar alguno o usar otro, justifícalo en el
handoff. **No metas patrones sin necesidad.**

| Patrón                   | Dónde                                                                                                                               | Por qué                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Singleton**            | `infrastructure/db/client.ts`; clientes de Apple (certificados cargados una vez), APNs (sesión HTTP/2) y Google (auth)              | Evitar múltiples pools/conexiones en hot reload y en serverless |
| **Builder**              | `ApplePassBuilder` (pass.json: campos, colores, `locations`, `backFields`, barcode) y `GoogleLoyaltyObjectBuilder`                  | Objetos grandes con muchos campos opcionales                    |
| **Adapter**              | `AppleWalletAdapter` y `GoogleWalletAdapter` implementan una interfaz común `WalletProvider` (`issue`, `update`, `notify`)          | Dos APIs externas muy distintas detrás de un contrato propio    |
| **Factory Method**       | `WalletProviderFactory.for(platform)` devuelve el adapter correcto                                                                  | El dominio no conoce plataformas concretas                      |
| **Facade**               | `LoyaltyService` (`addStamp`, `redeemReward`, `issueCard`, `claimCard`) orquesta repositorios + regla de referidos + push a wallets | Un solo punto de entrada para el panel y los route handlers     |
| **Decorator** (opcional) | Envolver `WalletProvider` con logging/reintentos                                                                                    | Solo si hace falta reintentar pushes fallidos                   |

El dominio depende de **interfaces** (repositorios, `WalletProvider`), no de
Drizzle ni de las APIs. Eso permite testear `LoyaltyService` con fakes.

### 2.3 Esquema de base de datos (Drizzle)

- `admins`: id, email (unique), passwordHash, createdAt
- `settings` (una fila): stampsRequired (default 10), rewardText,
  birthdayPromoText, storeName, storeLatitude, storeLongitude,
  storeRelevantText, updatedAt
- `customers`: id (uuid), name, email (unique, nullable), phone (unique),
  birthday (date), privacyAcceptedAt, createdAt
- `cards`: id (uuid), publicCode (unique `CB-XXXX`), customerId (fk),
  status (`active` | `flagged` | `voided`), platform (`apple` | `google` |
  null), stampCount (int, cache del ledger), appleAuthToken, claimedAt,
  createdAt, updatedAt
- `claim_tokens`: id, cardId (fk), tokenHash (unique, guardar solo hash),
  expiresAt, usedAt
- `stamps` (ledger): id, cardId (fk), source (`order` | `referral_bonus` |
  `manual`), orderNumber (unique, nullable), note, createdByAdminId,
  createdAt
- `redemptions`: id, cardId, stampsUsed, createdByAdminId, createdAt
- `referrals`: id, referrerCardId (fk), referredCustomerId (fk, **unique**),
  rewardedAt (nullable), createdAt
- `apple_registrations`: id, cardId, deviceLibraryId, pushToken, createdAt;
  unique (deviceLibraryId, cardId)
- `birthday_notifications`: id, customerId, year; unique (customerId, year)

`addStamp` corre en **una transacción**: insertar sello → actualizar
`stampCount` → si es el primer `order` del cliente y tiene `referrals` sin
`rewardedAt`, insertar `referral_bonus` al referidor y marcar `rewardedAt`.
El push a wallets va **después** del commit.

## 3. Wallets

**Verifica contra la documentación oficial actual antes de implementar.** No
inventes nombres de campos.

### Apple Wallet

- Librería `passkit-generator`. Pass type `storeCard`.
- Env: `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, certificados (signer cert, key,
  passphrase, WWDR) en base64; APNs con `.p8` (`APPLE_APNS_KEY_ID`,
  `APPLE_APNS_KEY`).
- `locations` desde `settings`; `backFields` con la liga de referidos;
  `changeMessage` en el campo de sellos y en el de promoción (eso dispara la
  notificación al actualizar).
- PassKit web service: register / unregister device, list serials, get latest
  pass, log. Autenticación con `appleAuthToken` por tarjeta.
- Si faltan las credenciales, el adapter lanza un error de configuración claro
  y el resto de la app funciona.

### Google Wallet

- REST de Wallet Objects con service account (`google-auth-library`).
- `loyaltyClass` (una) + `loyaltyObject` por tarjeta. Link "Save to Google
  Wallet" con JWT firmado.
- `linksModuleData` con la liga de referidos. Mensajes con notificación para
  cumpleaños y sellos (respeta el límite de notificaciones de Google).
- Ubicación: confirma en docs si el campo de ubicaciones sigue soportado; si
  está deprecado, documéntalo en el handoff y no lo implementes.

## 4. Flujos

1. **Alta desde panel:** crear cliente → se crea tarjeta + claim token →
   panel muestra QR y botón "Enviar por WhatsApp" (`wa.me` con texto
   prellenado y el link).
2. **Reclamo `/c/[token]`:** token válido y sin usar → detectar plataforma
   (UA) y ofrecer Apple / Google → al emitir el pase, marcar `usedAt` y
   `platform`. Token usado → "Esta tarjeta ya fue reclamada".
3. **Sellar:** panel → buscar por nombre, teléfono o `CB-XXXX` → "+1 sello"
   con `orderNumber` obligatorio → `LoyaltyService.addStamp`.
4. **Canjear:** al llegar a `stampsRequired`, botón "Canjear premio" →
   `redemptions` y reinicio del conteo.
5. **Referido `/r/[code]`:** formulario → cliente + tarjeta + `referrals` →
   redirige a su claim.
6. **Cumpleaños:** `GET /api/cron/birthdays`, protegido con `CRON_SECRET`
   (header `Authorization: Bearer`), en `vercel.json` diario a las 15:00 UTC
   (9:00 en Pachuca).
7. **Auth del panel:** un admin, contraseña con `Bun.password`/argon2, sesión
   en cookie httpOnly firmada (`jose`), middleware/proxy protege `/admin`.
   Script `admin:create` para crear el admin. Rate-limit básico en login.

## 5. Fases

Trabaja **una fase a la vez**. Al terminar cada fase: `bun run check`,
`bun run lint` y `bun run test` en verde, y escribe
`docs/handoff/phase-N.md` con: qué hiciste, decisiones y su porqué, patrones
usados y dónde, desviaciones del plan y pendientes. Luego **detente** y avisa.
Claude revisa y te manda comentarios; puedes debatirlos con argumentos.

- **Fase 1 — Base:** `git init`, scaffolding Next + bun, configs de lint/format
  copiadas, Docker db, Drizzle + esquema completo + primera migración, `env.ts`,
  `config/site.ts`, estructura de carpetas atómicas, auth del admin, layout
  del panel, CI. Seed con settings por defecto (incluye coordenadas).
- **Fase 2 — Dominio:** repositorios, `LoyaltyService` (facade), regla de
  referidos, generador `CB-XXXX`, claim tokens, tests de dominio con fakes.
- **Fase 3 — Panel:** clientes (alta, búsqueda, detalle), sellar, canjear,
  referidos, tarjetas `flagged`, settings, QR + WhatsApp.
- **Fase 4 — Google Wallet:** adapter + builder + factory, claim para Google,
  push en `addStamp`.
- **Fase 5 — Apple Wallet:** adapter + builder, web service, APNs,
  detección de segundo dispositivo.
- **Fase 6 — Público + cron:** `/r/[code]`, `/privacidad`, cron de cumpleaños.

## 6. Convenciones

- Código, nombres y comentarios en **inglés**; textos de UI en **español**.
- No commits sin que el usuario lo pida.
- Secretos solo en `.env`/Vercel; nunca en el repo ni en `NEXT_PUBLIC_*`.
- Mantener dependencias al mínimo; justifica cada dependencia nueva.

## 7. Checklist antes de publicar Google Wallet

- [ ] Regenerar `public/brand/google-logo.png` desde el logo PNG final de Central
      Brownies siguiendo las brand guidelines de Google Wallet.
- [ ] Verificar que la `LoyaltyClass` esté en `UNDER_REVIEW` y haya sido aprobada
      en Google Pay & Wallet Console.
- [ ] Solicitar y obtener acceso de publicación para el issuer; hasta entonces
      los pases permanecen en Demo Mode con la marca `[TEST ONLY]`.
- [ ] Configurar en Vercel la service account, issuer ID y class suffix de
      producción.
