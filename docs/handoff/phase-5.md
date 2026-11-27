# Handoff — Fase 5 (Apple Wallet)

## Qué se implementó

- `AppleWalletAdapter` implementa `WalletProvider`.
- `ApplePassBuilder` produce un `pass.json` de tipo `storeCard`.
- `WalletProviderFactory.for('apple')` devuelve el adapter Apple.
- `ApplePassSigningClient` mantiene certificados y assets como Singleton y usa
  `passkit-generator` para manifest, firma PKCS#7 y ZIP `.pkpass`.
- `AppleApnsClient` mantiene la llave `.p8`, el JWT de provider y la sesión
  HTTP/2 como Singleton.
- Token Apple aleatorio por tarjeta, creado lazy con 32 bytes criptográficos y
  conservado durante toda la vida del pase.
- Comparación constante del header `Authorization: ApplePass <token>`.
- Web service PassKit completo: registro, baja, lista de seriales, descarga del
  pase actualizado y logging.
- Caché HTTP de pases con `If-Modified-Since`, `Last-Modified` y 304.
- Detección de exceso de dispositivos: permite iPhone + Watch/iPad y marca
  `flagged` al registrar un tercer device distinto.
- Claim iOS con descarga binaria `.pkpass`; consume el token solo después de
  generar y firmar el paquete correctamente.
- Push APNs vacío después de cambios confirmados en Postgres; el iPhone vuelve
  a pedir el pase y `changeMessage` genera la notificación visible.
- Credenciales Apple opcionales y cargadas lazy.

## Documentación oficial consultada

Documentación revisada el 26 de noviembre de 2026:

1. **Modelo actual de Pass**
   <https://developer.apple.com/documentation/walletpasses/pass>
   - Confirma `formatVersion`, `passTypeIdentifier`, `teamIdentifier`,
     `serialNumber`, `authenticationToken`, `webServiceURL`, `storeCard`,
     `barcodes`, `locations`, `relevantDates`, `voided` y
     `sharingProhibited`.
2. **Crear la fuente y construir un pase**
   - <https://developer.apple.com/documentation/walletpasses/creating-the-source-for-a-pass>
   - <https://developer.apple.com/documentation/walletpasses/building-a-pass>
   - Confirman `pass.json`, imágenes requeridas, manifest y firma.
3. **Contenido de campos y changeMessage**
   <https://developer.apple.com/documentation/walletpasses/passfieldcontent>
   - Confirma que `changeMessage` necesita `%@`, sustituido por el valor nuevo.
4. **Ubicaciones actuales**
   <https://developer.apple.com/documentation/walletpasses/pass/locations-data.dictionary>
   - Confirma que `locations` sigue vigente para relevancia y admite hasta 10.
5. **Fechas relevantes actuales**
   <https://developer.apple.com/documentation/walletpasses/pass/relevantdates-data.dictionary>
   - La referencia actual marca `relevantDate` como deprecado y pide
     `relevantDates` para intervalos de relevancia.
6. **Web service de actualización**
   <https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes>
   - Confirma almacenamiento de devices/passes/registrations, HTTPS, shared
     secrets, push vacío y flujo de actualización.
7. **Endpoints actuales del web service**
   - Registro:
     <https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications>
   - Baja:
     <https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications>
   - Seriales:
     <https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes>
   - Pase actualizado:
     <https://developer.apple.com/documentation/walletpasses/send-an-updated-pass>
   - Log:
     <https://developer.apple.com/documentation/walletpasses/log-a-message>
8. **APNs con token `.p8`**
   <https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns>
   - Confirma ES256, headers `alg`/`kid`, claims `iss`/`iat`, llave `.p8`, y
     renovación antes de una hora.
9. **Request HTTP/2 a APNs**
   <https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns>
   - Confirma POST `/3/device/<token>`, bearer provider token, `apns-topic`,
     HTTP/2 y producción en `api.push.apple.com`.

## pass.json y relevancia

El builder genera:

- identidad de issuer, team, pass type y serial;
- `storeCard` con progreso de sellos, promoción y datos del cliente;
- QR con `CB-XXXX`;
- liga de referido en back fields;
- `webServiceURL = <APP_URL>/api/apple`;
- `authenticationToken` estable de la tarjeta;
- `locations` con coordenadas y texto editable de settings;
- `sharingProhibited: true`;
- `voided` según el estado de la tarjeta.

Apple mantiene `locations` vigente —a diferencia de Google—, así que se usa.
`relevantDate` está deprecado y `relevantDates` es el reemplazo actual. Una
store card de sellos no tiene un intervalo temporal real, por lo que el builder
omite ambos campos en vez de inventar fechas. Si en el futuro hay promociones
temporales, deberán modelarse con `relevantDates`.

Los campos `stamps` y `promotion` incluyen `changeMessage`:

- `Tus sellos ahora son %@.`
- `Nueva promoción: %@`

## Web service implementado

Base: `<APP_URL>/api/apple/v1`.

| Método y ruta                                                       | Comportamiento                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `POST /devices/{device}/registrations/{type}/{serial}`              | Valida ApplePass, guarda push token; 201 nuevo, 200 existente                        |
| `DELETE /devices/{device}/registrations/{type}/{serial}`            | Valida ApplePass y elimina registro                                                  |
| `GET /devices/{device}/registrations/{type}?passesUpdatedSince=...` | Devuelve `serialNumbers` + `lastUpdated`, o 204                                      |
| `GET /passes/{type}/{serial}`                                       | Valida ApplePass, respeta If-Modified-Since y devuelve pkpass + Last-Modified, o 304 |
| `POST /log`                                                         | Valida y registra mensajes del cliente Wallet                                        |

La lista de seriales no usa token del pase: el device library identifier es el
shared secret de ese endpoint, como especifica Apple. Los demás endpoints del
pase comparan el token en tiempo constante.

## Descarga desde `/c/[token]`

La página detecta iPhone/iPad/iPod y muestra “Agregar a Apple Wallet”. Se usa un
Route Handler `POST /c/[token]/apple`, no Server Action, porque una Server Action
devuelve valores serializados dentro del Flight stream; un Route Handler puede
devolver un `Response` binario con:

- `Content-Type: application/vnd.apple.pkpass`
- `Content-Disposition: attachment; filename=...pkpass`

Orden de la operación:

1. Validar el claim token sin consumirlo.
2. Generar y firmar el `.pkpass`.
3. Consumir el token y marcar plataforma Apple.
4. Devolver el archivo.

Si configuración, certificados o firma fallan, el paso 3 no se ejecuta.

## APNs y tolerancia a fallos

Después de cada commit, el scheduler basado en `after()` ejecuta
`WalletSyncService`. Para Apple, el adapter consulta push tokens registrados y
envía `{}` por HTTP/2 con:

- `authorization: bearer <provider JWT>`;
- `apns-topic: <passTypeIdentifier>`;
- prioridad 5;
- path `/3/device/<pushToken>`.

El push no contiene datos; solo hace que Wallet consulte seriales y descargue el
pase actualizado. Un error APNs se captura y registra por la facade, sin revertir
el sello, canje, flag o cambio ya confirmado.

## Segundo dispositivo

`registerAppleDevice` bloquea la tarjeta, lista devices ya registrados y hace
upsert del nuevo registro. Apple documenta registrations muchos-a-muchos y no
envía tipo/modelo del device. La guía de Apple Watch confirma que muchos pases
del iPhone también aparecen en el reloj:

<https://support.apple.com/guide/watch/set-up-cards-and-passes-apd16914b6d1/watchos>

No existe una señal fiable para distinguir Watch/iPad de otro iPhone. Se aplica
el umbral constante `APPLE_DEVICE_FLAG_THRESHOLD = 2`: los dos primeros devices
se consideran el conjunto normal de un usuario y el tercero distinto provoca:

- estado → `flagged`;
- nunca cambia a `voided`;
- sincronización post-response;
- el panel existente la muestra para revisión.

El detalle muestra cuántos devices Apple están registrados y desde qué fecha.
Registrar otra vez el mismo device solo actualiza su push token y devuelve 200.
Una tarjeta ya flagged no vuelve a programar pushes por cada re-registro.

## Propagación de settings

Actualizar settings también toca `updatedAt` de tarjetas reclamadas y no
anuladas en la misma transacción. Después del commit se programa:

- push vacío para cada tarjeta Apple;
- PATCH de cada Google LoyaltyObject;
- un único PATCH de la Google LoyaltyClass compartida.

El recorrido es secuencial y O(n). Es suficiente para el volumen personal del
negocio; si crece a cientos/miles de tarjetas debe sustituirse por cola durable,
batches y control de cuota.

## Credenciales

Variables opcionales:

- `APPLE_PASS_CERT_BASE64`
- `APPLE_PASS_KEY_BASE64`
- `APPLE_PASS_KEY_PASSPHRASE`
- `APPLE_WWDR_CERT_BASE64`
- `APPLE_TEAM_ID`
- `APPLE_PASS_TYPE_ID`
- `APPLE_APNS_KEY_ID`
- `APPLE_APNS_KEY_BASE64`

Se validan en `env.ts` como opcionales y se decodifican/validan al usar Apple.
Si falta alguna obligatoria, `AppleWalletConfigurationError` explica que Apple
Wallet no está configurado; panel, Google y dominio siguen funcionando.

## Patrones

- **Adapter:** `AppleWalletAdapter implements WalletProvider`.
- **Builder:** `ApplePassBuilder` arma el diccionario grande de `pass.json`.
- **Factory Method:** Apple queda registrado en `WalletProviderFactory`.
- **Singleton:** `ApplePassSigningClient` y `AppleApnsClient` cargan una vez
  certificados, assets, llave `.p8`, JWT y sesión HTTP/2.
- **Facade / Unit of Work:** registro de device y flag ocurren dentro de la
  transacción; firma y APNs quedan fuera.

## Tests

- Builder `storeCard`, ubicación, `changeMessage`, relevancia y `voided`.
- Firma `.pkpass` con CA y certificado signer generados por OpenSSL en el test.
- Auth web service: token válido y token inválido producen respuesta 401.
- Segundo device se permite; el tercero marca `flagged` y sincroniza.
- Re-registro no dispara sync y settings actualiza objetos/clase una vez.
- Fallo APNs no revierte un sello confirmado.
- Factory devuelve adapters Google y Apple.
- Suite completa anterior sigue verde.

## Dependencia

- `passkit-generator`: genera manifest, firma PKCS#7 y empaqueta `.pkpass`; se
  mantuvo la librería pedida porque evita reimplementar el formato criptográfico
  y soporta buffers adecuados para Vercel.

## Validación

- `bun run check` — verde.
- `bun run lint` — verde.
- `bun run test` — verde: 46 tests; 2 integraciones omitidas sin DB.
- Suite con `DATABASE_URL` — 48/48 tests.
- `bun run build` — verde con los cinco endpoints Apple y claim binario.
- No hubo llamadas a APNs ni instalación real por falta de cuenta Apple.

## Nota sobre scheduler fuera de Next

El singleton `loyaltyService` de infraestructura usa `after()` y está destinado
a Server Actions/Route Handlers. Cualquier script o proceso fuera de un request
de Next debe construir `LoyaltyService` inyectando un scheduler inmediato, como
los tests; no debe importar ese composition root.

## Limitaciones

- El usuario no tiene cuenta de Apple Developer, Pass Type ID ni certificados
  reales. **No fue posible instalar un pase en un iPhone, registrar un device ni
  probar APNs real.** La firma se validó con certificados generados en tests y
  los contratos se implementaron contra documentación oficial actual.
- Los PNG Apple son placeholders de color de marca y deben sustituirse por
  assets finales antes de publicar.
