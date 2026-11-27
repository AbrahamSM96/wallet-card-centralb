# Review — Fase 6 (Claude)

Verifiqué: `lint`, `format:check` y 58/58 tests con `DATABASE_URL`. Bien
resuelto: la privacidad guardada en la misma transacción que consume el token,
la reserva idempotente, la regla del 29 de febrero y la justificación de no
usar `after()` en el cron.

**Primera prueba contra Google Wallet real.** El usuario ya configuró issuer,
class suffix y service account. Resultados:

| Paso                              | Resultado                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| OAuth con la service account      | ✅                                                                                               |
| `GET issuer` → "Central Brownies" | ✅ (cuenta vinculada)                                                                            |
| `GET loyaltyClass`                | 404 esperado (aún no existe)                                                                     |
| `POST loyaltyClass`               | ❌ 400 `Image cannot be loaded. Invalid image URL: http://localhost:3000/google-wallet-logo.png` |

El usuario decidió hacer la prueba real ya desplegado en Vercel. Aun así hay
que dejar el código listo para eso.

Responde **acepto** o **debato** por punto en
`docs/reviews/phase-6-response.md`.

## Alta

1. **El logo de Google debe ser una URL https pública.** Google descarga
   `programLogo` desde sus servidores, así que `localhost` o `http` nunca
   funcionan. Haz que `getGoogleWalletConfig` falle con un
   `GoogleWalletConfigurationError` claro si la URL del logo no es `https`, y
   agrega una env opcional `GOOGLE_WALLET_LOGO_URL` que tenga prioridad sobre
   `APP_URL + /google-wallet-logo.png`. Documenta en el README que en local se
   necesita esa env o un túnel. Test.

## Media

2. **Los errores de Google se pierden.** Tuve que interceptar `fetch` para
   ver la causa:
   - `#request` lanza `Google Wallet API request failed with 400` sin el
     `error.message` que devuelve Google. Inclúyelo (recortado, ~300
     caracteres; no trae secretos) y el `status`.
   - `claimGoogleAction` (y la descarga de Apple) convierten el error en un
     mensaje genérico **sin registrarlo**. Registra con `ServerLogger` antes
     de devolver el mensaje público. Sin esto, en Vercel no habría forma de
     diagnosticar un claim fallido.
3. **Un cumpleaños que falla al notificar no se reintenta.** La reserva
   `(customerId, year)` se inserta antes de notificar (correcto para no
   duplicar), pero si la wallet falla solo se cuenta `failed` y el cliente
   nunca recibe su felicitación ese año. Agrega `notifiedAt` a
   `birthday_notifications`: reserva → notifica → marca `notifiedAt`. En
   corridas siguientes, reintenta las reservas sin `notifiedAt` que sigan
   dentro de la ventana de 7 días. Migración nueva y test.

## Al terminar

`check`, `lint` y `test` en verde, sin procesos corriendo, y detente.
