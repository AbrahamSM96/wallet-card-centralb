# Respuesta al review — Fase 2

1. **acepto.** El bonus ya no usa directamente la tarjeta histórica del
   referidor. Si está anulada, busca y bloquea su tarjeta vigente por
   `customerId`; si existe, el bonus se acredita ahí. Si no existe, el sello del
   referido continúa, el referral se resuelve y se guarda
   `rewardSkippedReason = no_active_referrer_card`. Hay tests para ambos casos.

2. **acepto.** `DrizzleCardRepository.create` traduce la constraint
   `cards_customer_active_unique` al error de dominio
   `CUSTOMER_HAS_ACTIVE_CARD`. Un test unitario simula exactamente la violación
   `23505` de Postgres.

3. **acepto.** Se agregó `reissueClaimToken`: invalida todos los tokens
   pendientes de la tarjeta y crea uno nuevo en la misma transacción. Solo
   limpia `claimedAt` y `platform` cuando recibe `resetClaim: true`. Los tokens
   invalidados se distinguen de los usados y son rechazados con
   `CLAIM_TOKEN_INVALIDATED`.

4. **acepto.** El argumento del remanente es mejor que mi lectura literal de
   “reinicio”: un bonus es valor ya ganado y no debe desaparecer. El canje ahora
   registra `stampsUsed = stampsRequired` y deja
   `stampCount = stampCount - stampsRequired`. El test usa 12 sellos con meta 10
   y verifica un remanente de 2.

5. **acepto.** Se agregó `normalizeOrderNumber` como única función canónica:
   recorta espacios, elimina un `#` inicial y convierte a mayúsculas. El mismo
   resultado se usa para validar duplicados y para insertar en el ledger. Un
   test comprueba que `#a-12` colisiona con `A-12`.

6. **acepto.** `LoyaltyService` ahora expone `registerCustomer` y
   `registerReferral`. Ambas crean cliente, tarjeta y claim token dentro de una
   sola transacción; la segunda también valida/bloquea la tarjeta vigente del
   referidor y crea `referrals` antes del commit. Hay tests de ambas operaciones.

7. **acepto.** `isUniqueViolation` ahora inspecciona el error actual y recorre
   hasta ocho niveles de `cause`, buscando el par `code = 23505` y
   `constraint_name`. El test unitario de tarjetas reproduce la forma real de
   Drizzle —un error `Failed query` cuyo `cause` contiene el error postgres.js—.
   También se agregó un test de integración opcional para un pedido duplicado:
   corre cuando existe `DATABASE_URL` y verifica `DUPLICATE_ORDER`; sin base
   configurada se omite para mantener CI independiente de Postgres.

## Migración

No se modificó la migración aplicada `0000`. Se generó y aplicó
`drizzle/0001_sudden_lake.sql`, que agrega:

- `claim_tokens.invalidated_at`;
- `referrals.reward_skipped_reason`.
