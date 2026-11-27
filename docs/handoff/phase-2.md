# Handoff — Fase 2 (Dominio)

## Qué se implementó

- Se cambió el puerto local por defecto de Postgres de 5433 a 5434 en
  `docker-compose.yml` y `.env.example`, porque 5433 está ocupado por otro
  proyecto del usuario.
- Se definieron tipos de dominio y errores estables para tarjetas, sellos,
  referidos, canjes y claim tokens.
- Se definieron interfaces separadas para los repositorios de tarjetas, sellos,
  referidos, canjes, settings y claim tokens.
- Se implementaron todos esos repositorios con Drizzle y postgres.js bajo
  `src/infrastructure/db/repositories/`.
- Se implementó `DrizzleLoyaltyUnitOfWork`, que entrega repositorios ligados a
  la misma transacción de Postgres.
- Se agregó `src/infrastructure/loyalty-service.ts` como composition root de la
  facade lista para los handlers de fases posteriores.
- Se implementó `LoyaltyService` como facade con:
  - `addStamp`, incluyendo rechazo global de pedidos duplicados;
  - bonus de referido únicamente con el primer sello `order` del cliente;
  - `redeemReward`, con registro del canje y conservación del remanente;
  - `issueCard`, con tarjeta y claim token creados en una transacción; y
  - `claimCard`, con validación de token, expiración, uso único y estado de la
    tarjeta.
- Se agregaron `registerCustomer` y `registerReferral`, que crean cliente,
  tarjeta, token y referido —cuando aplica— dentro de una sola transacción.
- Se agregó `reissueClaimToken`, que invalida tokens pendientes y solo limpia el
  estado de claim cuando el admin envía `resetClaim: true`.
- Se implementó el generador criptográfico de códigos `CB-XXXX`, usando un
  alfabeto sin `0`, `O`, `1`, `I` ni `L`.
- Se implementaron claim tokens opacos de 256 bits. Solo se persiste su hash
  SHA-256; el token crudo se devuelve una vez al emisor.
- Se agregaron fakes de todos los puertos, trece tests de `LoyaltyService` y un
  test del adapter Drizzle, que se suman a los tres tests del rate limiter.

## Decisiones y su porqué

### Repositorios pequeños por agregado

El dominio no importa Drizzle, postgres.js, Next.js ni el schema. Cada interfaz
expone únicamente las consultas que necesita la facade. Esto evita convertir un
repositorio genérico en una API de persistencia paralela y permite que los tests
usen fakes mínimos.

### Unit of Work como frontera transaccional

`LoyaltyUnitOfWork.runInTransaction` entrega todos los repositorios sobre el
mismo executor. Así, insertar el sello, actualizar `stampCount`, insertar el
`referral_bonus` y marcar el referido se confirman juntos o se revierten juntos.
También se bloquea primero la tarjeta con `FOR UPDATE`, por lo que dos sellos
simultáneos para la misma tarjeta no pueden otorgar dos veces el primer-order
bonus.

La restricción única de `stamps.orderNumber` sigue siendo la última defensa para
pedidos iguales concurrentes en tarjetas distintas. El adapter traduce esa
violación de Postgres al error de dominio `DUPLICATE_ORDER`. La detección
recorre la cadena `cause`, porque Drizzle envuelve el error `23505` de
postgres.js dentro de su error `Failed query`.

### Colisiones de códigos

La aleatoriedad usa `crypto.getRandomValues` con rejection sampling, evitando
sesgo de módulo. `issueCard` comprueba la disponibilidad y reintenta hasta 20
veces en transacciones independientes. La restricción única de la base sigue
siendo la autoridad ante una carrera; el repositorio traduce ese conflicto para
activar el mismo retry.

### Tokens separados de los códigos públicos

`publicCode` sirve para búsqueda y referidos, no como secreto. El claim usa un
token aleatorio independiente. El SHA-256 permite buscarlo sin guardar la
credencial reutilizable en caso de una lectura accidental de la base.

### Canje con remanente

`stampsUsed` registra exactamente `stampsRequired` y el contador resta ese
umbral. Esto evita eliminar sellos legítimos obtenidos por referidos cuando una
tarjeta supera la meta antes de canjear.

## Patrones usados

- **Facade:** `LoyaltyService` es el único punto de entrada a las operaciones
  principales del dominio.
- **Repository:** interfaces de dominio desacoplan reglas y persistencia; las
  implementaciones Drizzle viven en infraestructura.
- **Unit of Work:** agrupa repositorios en una sola transacción para mantener
  ledger, contador y referido consistentes.
- **Dependency Injection:** generador de códigos, gestor de tokens y unidad de
  trabajo se reciben en el constructor, permitiendo fakes deterministas.

No se agregaron Builder, Adapter de wallets, Factory Method ni Decorator porque
sus casos de uso empiezan en las fases de Google y Apple Wallet.

## Cobertura de tests

- Pedido duplicado rechazado sin modificar el contador.
- Un sello manual no activa el bonus.
- El primer sello `order` activa exactamente un bonus.
- Pedidos posteriores no vuelven a activar el bonus.
- El canje consume la meta y conserva los sellos excedentes.
- Un claim token usado es rechazado.
- Un claim token expirado es rechazado.
- La emisión guarda solo el hash del token y devuelve `CB-XXXX`.
- Una colisión de `publicCode` se reintenta con otro código.
- Un referidor con tarjeta anulada recibe el bonus en su tarjeta vigente.
- Sin tarjeta vigente del referidor, el sello continúa y queda razón de omisión.
- La reemisión invalida tokens pendientes y respeta `resetClaim`.
- El alta normal y por referido se completa en una sola transacción.

Los tests de dominio usan fakes deliberadamente: son deterministas, validan las
reglas sin infraestructura y corren en CI, donde no se levanta Postgres. No se
añadió un suite de integración obligatorio porque contradiría el CI unitario de
la Fase 1; los repositorios concretos quedan verificados por typecheck y la base
local permanece disponible para pruebas manuales de los flujos de la Fase 3.

Además se ejecutó un smoke test contra el Postgres local ya levantado: abrió una
transacción mediante `DrizzleLoyaltyUnitOfWork`, leyó `settings` con el
repositorio concreto y cerró correctamente la conexión.

La segunda ronda agregó un test de integración opcional que inserta dos sellos
con el mismo pedido contra Postgres real y verifica `DUPLICATE_ORDER`. Se omite
sin `DATABASE_URL`; ejecutado con `.env.local`, pasó correctamente.

## Desviaciones y pendientes

- El push a wallets después del commit no se implementa todavía porque los
  providers y sus adapters corresponden a las Fases 4 y 5.
- Los flujos del panel y público conectarán sus formularios con
  `registerCustomer` y `registerReferral` en las Fases 3 y 6.
- Los route handlers y server actions del panel deberán construir o recibir la
  facade y seguir usando `requireAdmin()`.
- La revisión agregó `claim_tokens.invalidated_at` y
  `referrals.reward_skipped_reason`; la migración incremental es
  `drizzle/0001_sudden_lake.sql` y se validó contra Postgres local.
