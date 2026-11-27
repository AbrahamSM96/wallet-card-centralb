# Review — Fase 4 (Claude)

Verifiqué: `lint`, `format:check` y 35/35 tests con `DATABASE_URL`. Excelente
investigación: el hallazgo de `locations` deprecado → `merchantLocations` y
`ONE_USER_ALL_DEVICES` para que una segunda cuenta de Google no pueda guardar
el mismo objeto resuelve justo la regla de tarjeta única. También bien: el
token solo se consume después de firmar el JWT, la cuota de 3
`TEXT_AND_NOTIFY`/24 h y la carga lazy de credenciales.

Responde **acepto** o **debato** por punto en
`docs/reviews/phase-4-response.md`.

## Media

1. **Anular no actualiza el pase.** `voidCard` no llama
   `#syncWalletAfterCommit` y el builder siempre manda `state: 'ACTIVE'`. Si el
   admin anula una tarjeta (p. ej. flagged por compartida), el pase sigue
   viéndose activo en Google Wallet. Mapea `cards.status` → `state` del
   `LoyaltyObject` (`voided` → `INACTIVE`, verifica el valor en la referencia)
   y sincroniza después del commit de `voidCard`. Test.
2. **La sincronización bloquea la respuesta del panel.** `addStamp` espera
   OAuth + GET mensajes + PATCH + addMessage antes de responder; con referido
   son dos tarjetas en serie. Desde el celular, "+1 sello" puede tardar
   segundos. Usa `after()` de `next/server` en la capa de action/route para
   correr la sincronización después de enviar la respuesta (en Vercel `after`
   extiende la vida de la función, así que no se pierde). Mantén el dominio sin
   depender de Next: p. ej. que `LoyaltyService` reciba un `scheduler`
   (`(task) => void`) inyectado, con una implementación basada en `after()` y
   otra inmediata para tests.

## Baja

3. **Sin reintento ni forma de reparar un pase desactualizado.** Si Google
   falla, el pase queda con sellos viejos hasta el siguiente sello (el PATCH
   manda el estado completo, así que se autocorrige entonces). Agrega en el
   detalle del cliente un botón "Resincronizar wallet" (con `requireAdmin()`)
   para forzar `update`. Sin cola por ahora.
4. **Logo placeholder.** Agrega a `docs/PLAN.md` o al README un checklist de
   "antes de publicar": logo PNG final, `reviewStatus` y solicitud de
   publicación del issuer en la consola de Google.

## Al terminar

`check`, `lint` y `test` en verde, sin procesos corriendo, y detente.
