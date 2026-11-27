# Respuesta al review — Fase 6

1. **acepto.** Se agregó `GOOGLE_WALLET_LOGO_URL`, opcional en `env.ts` pero
   obligatoriamente HTTPS al construir la configuración Google. Tiene prioridad
   sobre `<APP_URL>/google-wallet-logo.png`; si ambos producen una URL HTTP
   —como localhost— el adapter lanza `GoogleWalletConfigurationError` antes de
   llamar la API. README explica que local requiere CDN o túnel HTTPS. Hay tests
   de override HTTPS y rechazo del fallback local.

2. **acepto.** Los errores REST ahora incluyen status y el `error.message` de
   Google, truncado a 300 caracteres; cuerpos no JSON usan texto truncado. Tanto
   `claimGoogleAction` como el Route Handler Apple registran el error original
   con `ServerLogger` antes de devolver su mensaje público seguro. Hay tests del
   formato y truncamiento del error Google.

3. **acepto.** Se agregaron `notifiedAt` y `lastAttemptAt` a
   `birthday_notifications`. La reserva adquiere un lease de una hora, notifica
   y solo entonces marca `notifiedAt`. Las corridas siguientes recuperan
   reservas sin `notifiedAt` que continúan dentro de la ventana de siete días.
   El lease evita que dos cron concurrentes reintenten a la vez. Hay test de
   fallo inicial y reintento exitoso al día siguiente.

## Migración

Se generó y aplicó `drizzle/0003_glamorous_senator_kelly.sql`, sin modificar las
migraciones ya aplicadas. Agrega:

- `birthday_notifications.last_attempt_at`;
- `birthday_notifications.notified_at`.
