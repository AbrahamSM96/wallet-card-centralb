# Review — Fase 1 (Claude)

Verifiqué: `bun run lint` y `bun run test` en verde; configs de oxlint, oxfmt
y tsconfig idénticas a `cool-invitations`. Buen trabajo en general: el porqué
de `@node-rs/argon2` (Vercel corre Node, no Bun) es correcto y la decisión de
no meter Builder/Adapter/Facade todavía también.

Responde cada punto con **acepto** (y lo corriges) o **debato** (con
argumentos). Numera tus respuestas en `docs/reviews/phase-1-response.md`.

## Alta

1. **Los scripts no cierran la conexión.** `scripts/seed.ts` y
   `scripts/admin-create.ts` nunca llaman `end()` del cliente postgres.js
   (`idle_timeout` por defecto es 0), así que el proceso se queda colgado al
   terminar. No lo detectaste porque Docker no estaba arriba. Expón el cliente
   (o un `closeDatabase()`) y ciérralo en un `finally`.
2. **Auth solo en `proxy.ts`.** El proxy es una primera barrera, no la única
   (la CVE-2025-29927 de Next se saltaba el middleware con un header). Agrega
   un `requireAdmin()` en el servidor que verifique la cookie y que el admin
   exista en la DB, y úsalo en `(admin)/admin/layout.tsx` y en todo route
   handler / server action de admin que venga en la Fase 3.
3. **`customers.privacyAcceptedAt` es `notNull`.** En el flujo 1 el admin crea
   al cliente desde el panel _antes_ de que el cliente acepte nada; la
   aceptación ocurre en `/c/[token]` o en `/r/[code]`. Hazlo nullable y que se
   llene en el formulario público.

## Media

4. **`updatedAt` no se actualiza.** Agrega `.$onUpdate(() => new Date())` en
   `cards` y `settings`. El web service de Apple (`passesUpdatedSince`)
   depende de `cards.updatedAt`.
5. **Mensaje de error reflejado desde la query.** `/admin/login?error=...`
   pinta cualquier texto. Alguien puede mandar un link con
   "Tu cuenta fue bloqueada, llama al ...". Usa un código (`invalid`,
   `rate_limited`) y mapea a texto en el servidor.
6. **Contraseña por `argv` en `admin:create`.** Queda en el historial del shell
   y visible en `ps`. Léela de stdin sin eco (o de una env var de un solo uso).
7. **Atomic design no aplicado en `LoginForm`.** El organismo trae `<input>`,
   `<label>` y `<button>` con clases inline. Crea átomos `Input`, `Label`,
   `Button` y una molécula `FormField`; el organismo solo compone. Inicializa
   shadcn ahora (estaba en el plan) para que los átomos envuelvan sus
   primitivas desde el principio, en vez de reescribirlos en la Fase 3.

## Baja

8. **Índices de FK.** Postgres no indexa FKs solo. Agrega índices en
   `stamps.card_id`, `cards.customer_id`, `claim_tokens.card_id` y
   `apple_registrations.device_library_id` (Apple lista seriales por
   dispositivo).
9. **Una tarjeta activa por cliente.** Índice único parcial en
   `cards.customer_id` donde `status <> 'voided'`.
10. **Pool en serverless.** `max: 10` por instancia de Vercel multiplica
    conexiones. Usa `max: 1` en producción junto con la URL `-pooler` de Neon
    (ya tienes `prepare: false`, que es lo correcto para el pooler).
11. **Settings de una fila.** Agrega `CHECK (id = 1)` para que la regla viva en
    la DB y no solo en el seed.
12. **`.gitignore`.** Falta `.vercel` y `.claude/settings.local.json`.
13. **Login sin admin.** Cuando el correo no existe no corres `verify`, lo que
    deja una diferencia de tiempo que revela si el correo existe. Con un solo
    admin el riesgo es bajo; si es barato, verifica contra un hash dummy.

## Al terminar

Regenera la migración (borra la `0000` actual; todavía no se aplicó en ningún
lado), deja `check`, `lint` y `test` en verde y avísame. Cuando Docker esté
arriba corremos `db:up → db:migrate → db:seed → admin:create` de punta a punta.
