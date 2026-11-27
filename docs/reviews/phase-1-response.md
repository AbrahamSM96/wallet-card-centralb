# Respuesta al review — Fase 1

1. **acepto.** Se expuso `closeDatabase()` en el cliente de infraestructura y
   ambos scripts cierran postgres.js dentro de un `finally`, también cuando una
   consulta falla.

2. **acepto.** Se agregó `requireAdmin()`, que verifica la firma y expiración de
   la cookie y después confirma que el admin siga existiendo en Postgres. El
   layout protegido lo ejecuta en el servidor. Los handlers y server actions de
   administración de la Fase 3 deberán usar la misma guarda.

3. **acepto.** `customers.privacyAcceptedAt` ahora es nullable. Los flujos
   públicos de reclamo y referido serán responsables de registrar la
   aceptación.

4. **acepto.** `cards.updatedAt` y `settings.updatedAt` usan
   `.$onUpdate(() => new Date())`, además de su valor inicial en `defaultNow()`.

5. **acepto.** La ruta solo redirige con los códigos estables `invalid` y
   `rate_limited`. La página traduce únicamente esos valores a textos definidos
   por la aplicación e ignora cualquier otro contenido de la query.

6. **acepto.** `admin:create` ya no recibe la contraseña por `argv`; la lee de
   la variable efímera `ADMIN_PASSWORD`. El único argumento posicional es el
   correo. Así la contraseña no aparece en `ps` ni como argumento del proceso.

7. **acepto.** Se inicializó shadcn con `components.json`, sus estilos y las
   primitivas `components/ui`. Se agregaron los átomos `Button`, `Input` y
   `Label`, y la molécula `FormField`. `LoginForm` ahora solo compone esos
   elementos; `AdminShell` también usa el átomo `Button`.

8. **debato.** Acepto y agregué los índices que faltaban para
   `stamps.card_id`, `cards.customer_id` y `claim_tokens.card_id`. No agregué
   otro índice para `apple_registrations.device_library_id` porque ya existe el
   índice único compuesto
   `apple_registration_device_card_unique(device_library_id, card_id)`. Por la
   regla del prefijo izquierdo de los B-tree de Postgres, ese índice ya sirve
   para listar por `device_library_id`; duplicarlo aumentaría escritura y
   almacenamiento sin mejorar esa consulta.

9. **acepto.** Se agregó el índice único parcial sobre `cards.customer_id` con
   la condición `status <> 'voided'`, por lo que un cliente puede conservar
   historial de tarjetas anuladas pero solo una tarjeta vigente.

10. **acepto.** El cliente postgres.js usa `max: 1` en todos los entornos y
    mantiene `prepare: false`, evitando multiplicar conexiones por instancia
    serverless.

11. **acepto.** `settings` incluye ahora el constraint
    `settings_single_row_check` con `CHECK (id = 1)`.

12. **acepto.** Se agregaron `.vercel/` y `.claude/settings.local.json` a
    `.gitignore`.

13. **acepto.** El login ejecuta siempre una verificación Argon2id. Cuando no
    existe el correo usa un hash dummy con los mismos parámetros, reduciendo la
    diferencia temporal observable sin introducir una cuenta ficticia.

## Migración

Se eliminó la migración inicial no aplicada y se regeneró desde cero como
`drizzle/0000_loose_hex.sql`, incluyendo nulabilidad, constraints e índices de
esta revisión.
