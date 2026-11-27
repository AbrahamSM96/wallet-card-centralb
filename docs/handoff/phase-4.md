# Handoff — Fase 4 (Google Wallet)

## Qué se implementó

- Contrato `WalletProvider` en dominio con `issue`, `update` y `notify`.
- Contrato `WalletSync` para mantener la facade independiente de adapters.
- `GoogleWalletAdapter` con REST de Wallet Objects, OAuth, emisión del link,
  actualizaciones y mensajes.
- `GoogleLoyaltyObjectBuilder` para construir `LoyaltyClass` y
  `LoyaltyObject` con nombres de campos verificados.
- `WalletProviderFactory.for(platform)` como Factory Method.
- `GoogleWalletAuthClient` como Singleton por proceso: reutiliza `GoogleAuth` y
  la llave RSA importada.
- JWT RS256 `savetowallet` para objetos precreados y URL
  `https://pay.google.com/gp/v/save/<jwt>`.
- Claim público de Google en `/c/[token]`, con detección de Android mediante
  user agent.
- El token se valida, después se crea/actualiza Google y se firma el JWT, y solo
  entonces se consume con `claimCard`. Un fallo previo deja el token disponible.
- Sincronización programada post-response para sellos, bonus, canjes,
  anulaciones y reactivaciones.
- Fallos de Google se registran en stderr como eventos estructurados y no
  revierten la transacción de lealtad.
- Variables opcionales y validadas para service account, issuer y class suffix.

## Documentación oficial consultada

Documentación revisada el 26 de noviembre de 2026:

1. **LoyaltyClass REST**
   <https://developers.google.com/wallet/reference/rest/v1/loyaltyclass>
   - Confirma `programName`, `programLogo`, `issuerName`, `reviewStatus`,
     `hexBackgroundColor`, `merchantLocations` y
     `multipleDevicesAndHoldersAllowedStatus`.
2. **LoyaltyObject REST**
   <https://developers.google.com/wallet/reference/rest/v1/loyaltyobject>
   - Confirma `accountName`, `accountId`, `loyaltyPoints`, `barcode`,
     `linksModuleData`, `textModulesData`, `messages`, `merchantLocations` y
     `notifyPreference`.
3. **JWT para Loyalty Cards**
   <https://developers.google.com/wallet/retail/loyalty-cards/use-cases/jwt>
   - Confirma claims `iss`, `aud: google`, `typ: savetowallet`, `iat`,
     `origins` y `payload.loyaltyObjects`, firmados RS256 por la service account.
4. **Emisión web, email y SMS**
   <https://developers.google.com/wallet/retail/loyalty-cards/web>
   - Confirma el formato del link de guardado y el límite seguro aproximado de
     1800 caracteres para URLs con JWT.
5. **Objetos precreados en JWT**
   <https://developers.google.com/wallet/tickets/boarding-passes/use-cases/save-multiple-passes.md.txt>
   - Confirma que un objeto existente puede referenciarse solo con `id` y
     `classId`, reduciendo el JWT. Aunque el ejemplo es FlightObject, documenta
     el formato común del payload de Wallet Objects.
6. **Mensajes y notificaciones**
   <https://developers.google.com/wallet/retail/loyalty-cards/use-cases/trigger-push-notifications.md.txt>
   - Confirma `TEXT_AND_NOTIFY`, máximo de **3 notificaciones en 24 horas** y
     fallback recomendado a `TEXT` al exceder la cuota.
7. **Message / AddMessageRequest / endpoint**
   - <https://developers.google.com/wallet/reference/rest/v1/Message>
   - <https://developers.google.com/wallet/reference/rest/v1/AddMessageRequest>
   - <https://developers.google.com/wallet/reference/rest/v1/loyaltyobject/addmessage>
   - Confirman `messageType`, `header`, `body`, `id` y el cuerpo `{ message }`.
8. **LinksModuleData y Uri**
   - <https://developers.google.com/wallet/reference/rest/v1/LinksModuleData>
   - <https://developers.google.com/wallet/reference/rest/v1/Uri>
   - Confirman `linksModuleData.uris[]` con `uri`, `description` e `id`.
9. **MerchantLocation**
   <https://developers.google.com/wallet/reference/rest/v1/MerchantLocation>
   - Confirma `latitude` y `longitude` y su uso para notificaciones geocercadas.
10. **Varios holders y dispositivos**
    <https://developers.google.com/wallet/reference/rest/v1/MultipleDevicesAndHoldersAllowedStatus>
    - Confirma el comportamiento de `MULTIPLE_HOLDERS`,
      `ONE_USER_ALL_DEVICES` y `ONE_USER_ONE_DEVICE`.

## Ubicaciones: hallazgo actual

`locations`/`LatLongPoint` aparece **deprecado** y la referencia dice que ya no
está soportado para disparar notificaciones geográficas. La API vigente expone
`merchantLocations` —máximo 10 por clase y 10 por objeto— y la guía de
notificaciones cercanas indica usar ese campo.

Por ello el builder no emite `locations`; usa `merchantLocations` tanto en la
clase como en el objeto con las coordenadas editables de settings.

## ¿Un mismo objeto puede guardarse en varias cuentas?

Sí, **si la clase usa `MULTIPLE_HOLDERS`**: la documentación dice que cualquier
número de usuarios y dispositivos puede guardar el mismo objeto. Eso rompería
la intención de tarjeta única del proyecto.

La integración fija `multipleDevicesAndHoldersAllowedStatus` a
`ONE_USER_ALL_DEVICES`. Con esta opción:

- la primera identidad de Google que guarda el objeto se convierte en su único
  holder;
- otra cuenta de Google no puede verlo ni guardarlo;
- el mismo usuario sí puede usarlo en varios dispositivos.

`ONE_USER_ONE_DEVICE` existe, pero está reservado a partners seleccionados y
requiere contactar soporte; además sería más restrictivo que la regla del
negocio.

## Clase y objeto

### LoyaltyClass

- ID: `<issuerId>.<classSuffix>`.
- `reviewStatus: UNDER_REVIEW`.
- Nombre, logo, color y país `MX`.
- `ONE_USER_ALL_DEVICES`.
- `merchantLocations` desde settings.

La clase se consulta primero y se inserta solo si Google responde 404.

### LoyaltyObject

- ID estable: `<issuerId>.<card UUID>`.
- `accountName` con el nombre del cliente y `accountId` con `CB-XXXX`.
- QR con `barcode.type: QR_CODE` y el código público como valor.
- `loyaltyPoints.balance.int` con el número de sellos.
- Texto del premio y meta en `textModulesData`.
- Liga de referido en `linksModuleData.uris`.
- `merchantLocations` vigente, no `locations` deprecado.

## Notificaciones y límites

Las actualizaciones ordinarias de sellos usan PATCH con
`notifyPreference: DO_NOT_NOTIFY`. Los mensajes `TEXT_AND_NOTIFY` se reservan
para bonus de referido y canje para no agotar la cuota.

Antes de agregar un mensaje, el adapter lee los mensajes del objeto y cuenta
los `TEXT_AND_NOTIFY` propios de las últimas 24 horas. Al llegar a tres envía
`TEXT` sin push, como recomienda Google. También conserva un máximo de diez
mensajes, que es el límite del recurso.

## Transacción y tolerancia a fallos

`addStamp`, `redeemReward` y `voidCard` confirman primero Postgres. Solo después
registran trabajo mediante el scheduler de dominio. Producción inyecta una
implementación sobre `after()` de Next.js: la respuesta móvil termina sin
esperar OAuth/REST, y Vercel extiende la vida de la función para completar la
tarea. Los tests usan ejecución inmediata o un scheduler capturable.

Cada fallo externo se captura y registra; nunca vuelve a lanzar hacia la
operación que ya hizo commit. En un primer pedido con referido se actualizan por
separado la tarjeta del invitado y la del referidor, y esta última recibe el
mensaje de bonus.

Una tarjeta anulada se reconstruye con `state: INACTIVE` y se sincroniza después
del commit. Al marcar una flagged como revisada vuelve a `ACTIVE` y también se
sincroniza.

## Credenciales

Variables opcionales:

- `GOOGLE_WALLET_SERVICE_ACCOUNT_BASE64`
- `GOOGLE_WALLET_ISSUER_ID`
- `GOOGLE_WALLET_CLASS_SUFFIX`

El JSON base64 se vuelve a validar con Zod al usar el adapter y debe contener
`client_email` y `private_key`. Si falta o es inválido, se lanza
`GoogleWalletConfigurationError`. La configuración se carga de forma lazy:
dashboard, panel, Postgres y tests de dominio funcionan sin credenciales.

## Patrones

- **Adapter:** `GoogleWalletAdapter` implementa `WalletProvider`.
- **Builder:** `GoogleLoyaltyObjectBuilder` centraliza recursos grandes y sus
  campos opcionales.
- **Factory Method:** `WalletProviderFactory.for(platform)` selecciona adapter.
- **Singleton:** `GoogleWalletAuthClient.for(serviceAccount)` reutiliza OAuth y
  llave RSA.
- **Facade:** `LoyaltyService` sigue coordinando reglas y dispara sincronización
  post-commit sin conocer Google.
- **Scheduler:** `PostCommitScheduler` desacopla dominio de Next; producción usa
  `after()` y tests pueden ejecutar o capturar tareas.

No se agregó Decorator: todavía no hay política de reintentos ni cola durable.

## Tests

- Builder: campos exactos, referral link, puntos, `merchantLocations`, y
  ausencia de `locations`.
- JWT: genera una llave RSA de prueba, firma RS256 y verifica claims/firma con
  la llave pública.
- Factory: Google, Apple aún no implementado y error claro sin configuración.
- Dominio: un fallo de sincronización Google no revierte el sello confirmado.
- Dominio: anular dispara sincronización y un scheduler diferido no bloquea la
  respuesta de la mutación.
- Tests previos de dominio, panel y constraints permanecen verdes.

## Dependencias

- `google-auth-library`: obtiene y reutiliza tokens OAuth para el scope oficial
  `wallet_object.issuer`.
- `jose` ya existía y se reutiliza para firmar/verificar JWT RS256.

## Validación

- `bun run check` — verde.
- `bun run lint` — verde.
- `bun run test` — verde: 36 tests; 2 integraciones omitidas sin DB.
- Suite con `DATABASE_URL` — 38/38 tests.
- `bun run build` — verde.
- No hubo llamadas a la API de Google Wallet por falta de cuenta/issuer.

## Limitaciones y pendientes

- El usuario todavía no tiene una cuenta de Google Wallet/issuer. **No fue
  posible probar contra la API real**, aprobar la clase ni guardar un pase en
  una cuenta real. La implementación se validó contra contratos oficiales y
  con mocks/criptografía real local.
- `public/google-wallet-logo.png` es un placeholder de color de marca; antes de
  publicar debe sustituirse por el logo PNG definitivo según las brand
  guidelines de Google.
- El panel ofrece resincronización manual, pero no existe todavía cola durable
  ni política automática de reintentos.
- No se implementó Apple Wallet; la Factory devuelve un error explícito hasta
  la Fase 5.
