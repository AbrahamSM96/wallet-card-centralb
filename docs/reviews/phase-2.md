# Review — Fase 2 (Claude)

Verifiqué: `lint` y `test` en verde (10 tests). Además corrí un smoke test
contra el Postgres local con los repositorios reales:

| Caso                                         | Resultado                         |
| -------------------------------------------- | --------------------------------- |
| `issueCard` genera `CB-XXXX`                 | ✅                                |
| Reclamar dos veces                           | ✅ `CLAIM_TOKEN_USED`             |
| Primer pedido del referido → +1 al referidor | ✅                                |
| Segundo pedido → sin bono                    | ✅                                |
| Pedido duplicado                             | ✅ `DUPLICATE_ORDER`              |
| Mismo pedido en 2 tarjetas a la vez          | ✅ uno ok, otro `DUPLICATE_ORDER` |
| Segunda tarjeta activa para el mismo cliente | ❌ error crudo de Postgres        |

Muy buen trabajo con el `FOR UPDATE`, la traducción por nombre de constraint y
el rejection sampling. Responde **acepto** o **debato** por punto en
`docs/reviews/phase-2-response.md`.

## Alta

1. **Un referidor con tarjeta anulada bloquea los sellos del referido.**
   `addStamp` llama `requireMutableCard` sobre la tarjeta del referidor; si
   está `voided`, lanza `CARD_VOIDED` y **se revierte el sello del referido**.
   Un cliente que no hizo nada mal no puede recibir su sello por culpa de otro.
   Propuesta: resolver la tarjeta **activa actual** del cliente referidor (si
   anularon su tarjeta y le dieron otra, el bono va a la nueva). Si no tiene
   ninguna activa, marcar el referido como resuelto sin bono (p. ej.
   `rewardedAt` + `rewardSkippedReason`, o un estado) y continuar con el sello.
   Test para ambos casos.

## Media

2. **Segunda tarjeta activa → error crudo.** El índice
   `cards_customer_active_unique` funciona, pero el error sale como
   `Failed query: insert into "cards"...`. Tradúcelo a
   `CUSTOMER_HAS_ACTIVE_CARD` en `DrizzleCardRepository.create`, igual que
   haces con `cards_public_code_unique`.
3. **No hay forma de reenviar el link de reclamo.** Si el cliente abre el link
   y la descarga del pase falla o la cancela, el token queda usado y la tarjeta
   ya no se puede reclamar; y `issueCard` no sirve porque el índice parcial
   impide otra tarjeta activa. Agrega `reissueClaimToken(cardId)`: invalida los
   tokens pendientes de esa tarjeta, crea uno nuevo y limpia `claimedAt` /
   `platform` solo si el admin lo pide (`resetClaim: true`). Lo va a necesitar
   el panel en la Fase 3.
4. **Canje sin remanente.** Lo debato contigo: el plan dice "reinicio del
   conteo", pero lo escribí pensando en el caso normal. Con los bonos de
   referido es fácil tener 12 sellos con meta de 10, y borrar 2 sellos ganados
   se siente como quitarle algo al cliente. Propongo
   `stampsUsed = stampsRequired` y `stampCount -= stampsRequired`. Si tienes un
   argumento para el reinicio completo, dímelo.

   **Decisión del usuario (final): opción A.** Se canjean exactamente
   `stampsRequired` (10) y el remanente (p. ej. 2) se conserva para el
   siguiente premio. No hace falta debatir este punto.

## Baja

5. **Normalizar `orderNumber`.** Hoy solo haces `trim()`, así que `#123`,
   `123` y `a-12` / `A-12` cuentan como pedidos distintos. Normaliza (mayúsculas
   y sin `#` inicial) en una sola función del dominio, usada tanto en la
   validación como en el insert.
6. **Alta de cliente fuera de la facade.** `issueCard` recibe un `customerId`
   ya creado. Para la Fase 3 y la 6, mete en `LoyaltyService` las operaciones
   `registerCustomer` y `registerReferral` (cliente + tarjeta + token +
   `referrals` en **una** transacción), para que los route handlers no armen
   la transacción por su cuenta.

## Fuera de alcance (no hacer ahora)

- Push a wallets tras commit: correcto dejarlo para las Fases 4 y 5.

## Al terminar

`check`, `lint` y `test` en verde, tests nuevos para 1, 2, 3 y 4, y detente.
Si 1, 3 o 6 requieren cambiar el esquema, genera una migración nueva (la `0000`
ya está aplicada en local, no la borres).

## Segunda ronda (Claude)

Verifiqué contra Postgres real: 1, 3, 4, 5 y 6 funcionan (bono a la tarjeta
nueva, `no_active_referrer_card`, `CLAIM_TOKEN_INVALIDATED`, `#x-1` = `X-1`,
canje 10 con remanente 2). Gracias por aceptar el punto 4 con argumento.

7. **Alta — `isUniqueViolation` nunca detecta nada en runtime.** Drizzle
   envuelve el error de postgres.js: el objeto lanzado tiene `code: undefined`
   y el `23505` + `constraint_name` vienen en `error.cause`. Lo comprobé
   insertando un `orderNumber` duplicado. Consecuencias:
   - `CUSTOMER_HAS_ACTIVE_CARD` sale como `Failed query: insert into "cards"...`.
   - `DUPLICATE_ORDER` por constraint y `PUBLIC_CODE_CONFLICT` (y su retry)
     son código muerto.
   - Mi prueba de carrera "pasó" solo porque `max: 1` serializa las
     transacciones dentro del proceso; entre dos instancias de Vercel sí
     llegaría a la constraint y reventaría con error crudo.

   Arreglo: que `isUniqueViolation` recorra la cadena `cause` (con límite de
   profundidad). Corrige el test de `drizzle-card-repository` para que
   simule la forma real (error envolvente con `cause`), y agrega un test de
   integración opcional (se salta si no hay `DATABASE_URL`) que inserte un
   pedido duplicado y espere `DUPLICATE_ORDER`.
