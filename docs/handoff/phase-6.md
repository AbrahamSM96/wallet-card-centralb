# Handoff — Fase 6 (Público y cron)

## Qué se implementó

- `/r/[code]` valida formato, existencia y tarjeta vigente antes de mostrar el
  formulario.
- Registro público de referido con nombre, correo, celular, cumpleaños y
  aceptación obligatoria del aviso de privacidad.
- Honeypot y rate limit de mejor esfuerzo por IP + código de referido.
- Alta transaccional mediante `LoyaltyService.registerReferral` y redirect al
  claim token recién emitido.
- `/c/[token]` consulta si falta aceptación de privacidad; Apple y Google la
  exigen y la guardan dentro de la misma transacción que consume el token.
- `/privacidad` con borrador LFPDPPP para Central Brownies.
- Cron diario de cumpleaños con zona `America/Mexico_City`, reserva anual
  idempotente, regla de 29 de febrero, notificación y limpieza de promoción.
- `vercel.json` con `0 15 * * *`.
- README completo de setup, variables y salida a producción.
- Migración incremental `drizzle/0002_volatile_pepper_potts.sql` para
  `birthday_notifications.cleared_at`.
- Migración de revisión `drizzle/0003_glamorous_senator_kelly.sql` para
  `last_attempt_at` y `notified_at`.

## Flujo de referido

La página convierte el código a mayúsculas y exige `CB-XXXX` con el alfabeto
legible. Si la tarjeta no existe o está anulada, muestra “Invitación no
disponible” sin revelar más información.

La Server Action valida todo con Zod. El honeypot `website` debe permanecer
vacío y `privacyAccepted` debe valer `on`. El rate limiter reutiliza la ventana
de 5 intentos cada 15 minutos por IP/código; es de mejor esfuerzo por instancia
serverless y evita añadir Redis para el volumen actual.

Errores de email o teléfono duplicado se traducen a:

> El teléfono o correo ya está registrado.

Después del commit se redirige a `/c/<token>`; el token no aparece en ninguna
tabla en texto claro.

## Privacidad durante claim

`getClaimContext` indica si el cliente aún no aceptó el aviso. Los formularios
Apple y Google muestran entonces el checkbox obligatorio con link a
`/privacidad`.

La aceptación no se guarda en una acción separada. `claimCard` bloquea token y
tarjeta, valida expiración/uso, guarda `privacyAcceptedAt`, marca plataforma y
consume el token dentro de la misma transacción. Un POST manipulado sin
consentimiento recibe error y no consume el token.

## Aviso de privacidad — revisión obligatoria

> **ATENCIÓN DEL USUARIO:** `/privacidad` es un borrador informativo y **no
> constituye asesoría legal**. Antes de publicar debe revisarse con una persona
> profesional y completar todos los textos `[COMPLETAR]`, especialmente nombre
> legal del responsable, correo ARCO y correo general de contacto.

El borrador incluye domicilio, datos recabados, programa de lealtad, emisión de
wallets, cumpleaños, referidos, proveedores tecnológicos, derechos ARCO,
revocación y cambios al aviso.

## Cron de cumpleaños

### Autenticación

`GET /api/cron/birthdays` exige:

```text
Authorization: Bearer <CRON_SECRET>
```

La comparación usa `timingSafeEqual`; secreto ausente, header ausente o valor
incorrecto devuelven 401. `CRON_SECRET` es opcional al arrancar para que el resto
de la app funcione, pero obligatorio para ejecutar el cron.

### Zona horaria

La fecha se calcula con `Intl.DateTimeFormat` y
`America/Mexico_City`, nunca con la zona del servidor. México eliminó el horario
estacional en la mayor parte del país desde octubre de 2022; Pachuca no está en
la franja fronteriza y permanece UTC-6. Por eso `15:00 UTC` equivale a `09:00`
todo el año.

Fuentes de verificación:

- <https://www.timeanddate.com/news/time/mexico-abolishes-dst-2022.html>
- <https://www.timeanddate.com/time/zone/mexico/mexico-city>

La segunda fuente confirma explícitamente que 2023–2029 no tienen cambios y
mantienen UTC-6.

### 29 de febrero

En años bisiestos se felicita el 29 de febrero. En años no bisiestos se observa
el cumpleaños el 28 de febrero. La regla es pura y tiene tests para ambos casos.

### Idempotencia

Antes de contactar wallets, el cron inserta `(customerId, year)`. La reserva
incluye `lastAttemptAt` como lease de una hora: dos invocaciones concurrentes no
notifican a la vez. Después del éxito se guarda `notifiedAt`.

Si wallet falla, la fila permanece sin `notifiedAt`. Corridas posteriores
vuelven a adquirir el lease y reintentan mientras la promoción siga dentro de
los siete días. Así se conserva la reserva única sin convertir un fallo externo
en una pérdida definitiva de la felicitación.

Se procesan únicamente tarjetas con plataforma elegida y estado distinto de
`voided`.

### Ventana visible y limpieza

La promoción permanece visible **7 días calendario contando el cumpleaños como
día 1**. Es una ventana suficiente para que el cliente vea/use el beneficio sin
dejar contenido de cumpleaños permanente durante todo el año.

- Apple: se agrega un secondary field con `changeMessage`; el push hace que el
  dispositivo descargue el pase.
- Google: se agrega `birthday_promotion` y un mensaje `TEXT_AND_NOTIFY` sujeto a
  la cuota existente.
- Al expirar: el cron sincroniza primero un objeto/pase sin el módulo y solo
  después guarda `clearedAt`. Si el sync falla, queda pendiente y se reintenta al
  día siguiente sin repetir la felicitación.

### ¿Por qué el cron espera?

El Route Handler espera reservas, updates y mensajes dentro del request en vez
de usar `after()`. El volumen es personal y pequeño, Vercel puede registrar el
resultado real (`notified`, `cleared`, `failed`) y una ejecución fallida queda
visible. `after()` haría responder 200 antes de conocer el resultado. Si el
volumen crece, este recorrido secuencial deberá migrar a una cola durable con
batches y reintentos.

## Atomic Design público

- Átomos existentes para inputs, checkbox, alertas y submit.
- `PrivacyConsentField` como molécula reutilizada por referido y claims.
- `ReferralRegistrationForm` como organismo con honeypot.
- Templates para registro, invitación no disponible, claim no disponible y
  aviso de privacidad.
- Las páginas solo validan/cargan y componen templates.

## README y producción

`README.md` documenta:

- Postgres local en 5434;
- migrate, seed y `admin:create` con `ADMIN_PASSWORD`;
- variables base, cron, Google y Apple;
- checklist Vercel, Neon y wallets;
- advertencia legal del aviso de privacidad.
- `GOOGLE_WALLET_LOGO_URL` debe ser HTTPS pública; localhost requiere túnel o
  CDN porque Google descarga la imagen desde sus servidores.

## Diagnóstico de wallets

Los errores Google conservan status y `error.message` oficial hasta 300
caracteres. Las acciones públicas registran el error completo y devuelven texto
genérico al usuario. Esto permite diagnosticar en logs de Vercel sin filtrar
detalles internos a la UI.

## Tests

- Conversión de fecha en `America/Mexico_City` alrededor de medianoche.
- 29 de febrero en año bisiesto y no bisiesto.
- Ventana visible de siete días y expiración.
- Reserva antes de notificar e idempotencia al ejecutar dos veces.
- Reintento de reserva sin `notifiedAt` dentro de la ventana visible.
- 401 del Route Handler sin `CRON_SECRET` y comparación Bearer.
- Registro por referido exige privacidad y honeypot vacío.
- Claim exige y persiste privacidad sin consumir anticipadamente.

## Validación

- `bun run check` — verde.
- `bun run lint` — verde.
- `bun run test` — verde: 61 tests; 2 integraciones omitidas sin DB.
- Suite con `DATABASE_URL` — 63/63 tests.
- `bun run build` — verde.
- Migraciones `0002` y `0003` aplicadas correctamente en Postgres local.

## Pendientes antes de uso real

- Completar y revisar legalmente `/privacidad`.
- Crear cuentas/credenciales reales de Apple y Google y ejecutar pruebas en
  wallets reales.
- Configurar `CRON_SECRET` en Vercel.
- Sustituir assets placeholder y obtener aprobaciones/publicación de wallets.
