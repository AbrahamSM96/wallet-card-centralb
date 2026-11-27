# Handoff — Fase 3 (Panel)

## Qué se implementó

- Panel administrativo mobile-first con navegación horizontal y acciones
  táctiles grandes.
- Dashboard con total de clientes, tarjetas vigentes, tarjetas flagged y acceso
  directo a búsqueda/sellado.
- Alta de clientes mediante `LoyaltyService.registerCustomer`.
- Búsqueda por nombre, teléfono o código `CB-XXXX`.
- Detalle del cliente con tarjeta vigente, progreso, meta, remanente, historial
  de sellos e historial de canjes.
- Sellado por pedido con `orderNumber` obligatorio y mensajes de dominio en
  español.
- Canje mostrando meta, consumo y remanente conservado.
- Entrega del claim token recién emitido mediante QR, copia de link y WhatsApp.
- Reemisión explícita de claim tokens desde el detalle, con opción de reiniciar
  el estado de reclamo.
- Lista de referidos con estado pendiente, entregado u omitido.
- Lista de tarjetas `flagged` con acceso al cliente.
- Acciones para revisar tarjetas `flagged`, anular tarjetas e invalidar sus
  tokens, y emitir reposiciones cuando no existe una tarjeta vigente.
- Edición de meta, textos promocionales, nombre, coordenadas y texto relevante
  de la tienda.
- Placeholder público de `/c/[token]` sin consumir el token; la emisión real de
  Google Wallet corresponde a la Fase 4.
- `APP_URL` validada con Zod y documentada en `.env.example`.

## Seguridad y validación

Todas las Server Actions llaman `requireAdmin()` antes de leer o validar la
entrada:

- `createCustomerAction`
- `addStampAction`
- `redeemRewardAction`
- `reissueClaimTokenAction`
- `markCardReviewedAction`
- `voidCardAction`
- `issueReplacementCardAction`
- `updateSettingsAction`

Después, cada acción valida sus `FormData` con Zod. Las páginas protegidas
también llaman `requireAdmin()` antes de consultar datos, además del guard del
layout y del proxy. No se agregaron route handlers administrativos.

Los errores esperados del dominio se convierten a textos seguros en
`action-errors.ts`. Ejemplos:

- `DUPLICATE_ORDER` → “Este pedido ya tiene sello.”
- `CUSTOMER_ALREADY_EXISTS` → “El teléfono o correo ya está registrado.”
- `INSUFFICIENT_STAMPS` → “La tarjeta todavía no alcanza la meta.”

Los errores inesperados no exponen mensajes de Postgres ni detalles internos.

## Decisiones y su porqué

### El token crudo vive solo en la respuesta de la acción

Después del alta o reemisión, la Server Action devuelve el link, QR y URL de
WhatsApp a `useActionState`. El token no se guarda en cookies, query params,
localStorage ni columnas adicionales. Al salir o recargar se pierde; para
obtener otro debe ejecutarse `reissueClaimToken`, que invalida el anterior.

### Teléfono canónico

Los celulares se guardan como `+52` seguido de diez dígitos. Esto evita
duplicados por formato y permite construir `wa.me` sin ambigüedad. El mensaje
incluye la URL creada desde `APP_URL`, una variable exclusivamente de servidor.

### Server Actions en vez de endpoints administrativos

Los formularios necesitan mutaciones secuenciales, estado pendiente y una
respuesta pequeña para la UI. Server Actions permiten esas propiedades y
revalidan la vista en el mismo roundtrip. Cada acción sigue tratándose como una
frontera pública: autentica y valida por sí misma.

### Lecturas específicas del panel

`admin-dashboard.ts` contiene queries de lectura orientadas a cada vista, sin
forzar al dominio a conocer tablas o modelos de presentación. Las mutaciones de
lealtad siguen pasando por `LoyaltyService`; solo la edición de la fila única de
settings usa una operación de infraestructura directa.

## Atomic Design

- **Primitivas shadcn:** button, input, label, textarea y checkbox en
  `components/ui`.
- **Átomos:** `Button`, `Input`, `Textarea`, `Checkbox`, `Badge`, `Alert`,
  `ActionLink`, `NavLink` y `SubmitButton`.
- **Moléculas:** `FormField`, `TextAreaField`, `CheckboxField`, `PageHeader`,
  `CustomerSearch`, `StampProgress`, `CopyLink` y `StatCard`.
- **Organismos:** formularios, entrega del claim, tablas/listas, resumen de
  tarjeta, historial y dashboard.
- **Templates:** uno por cada vista del panel y uno para el placeholder público.

Las páginas se limitan a autenticar, validar params, cargar datos y componer un
template. Los organismos no importan Drizzle ni acceden directamente a la base.

## Lista de rutas

| Ruta                      | Función                                        |
| ------------------------- | ---------------------------------------------- |
| `/admin`                  | Dashboard móvil                                |
| `/admin/clientes`         | Búsqueda y lista de clientes                   |
| `/admin/clientes/nuevo`   | Alta + QR + WhatsApp                           |
| `/admin/clientes/[id]`    | Detalle, sellar, canjear, reemitir e historial |
| `/admin/referidos`        | Lista y resultado de referidos                 |
| `/admin/tarjetas-flagged` | Tarjetas que requieren revisión                |
| `/admin/configuracion`    | Meta, textos y ubicación                       |
| `/c/[token]`              | Placeholder público de reclamo                 |

## Patrones usados

- **Facade:** todas las mutaciones de tarjetas, sellos, canjes y tokens pasan
  por `LoyaltyService`.
- **Repository / Unit of Work:** se conservan como frontera transaccional de las
  reglas de dominio.
- **Presentation Model:** las queries del panel devuelven shapes mínimos para
  cada template, evitando pasar filas completas a Client Components.

No se adelantaron Adapter, Builder ni Factory de wallets.

## Dependencias

- `qrcode`: genera el QR en el servidor para que el cliente no reciba lógica de
  codificación adicional.
- `@types/qrcode`: tipos de desarrollo.

No se agregaron otras dependencias.

## Validación

- `bun run check` — verde.
- `bun run test` — verde; incluye tests de normalización telefónica y traducción
  segura de errores.
- Suite local — 27 tests; 2 integraciones se omiten sin `DATABASE_URL`.
- Suite con `DATABASE_URL` — 29/29 tests, incluidos búsqueda telefónica y
  constraints reales.
- `bun run build` — verde con todas las rutas dinámicas.
- Smoke test de queries del panel contra Postgres — verde: dashboard, clientes,
  referidos, flagged y settings.
- Captura del detalle a 390 × 844 px en
  `docs/reviews/screenshots/phase-3-customer-detail-390.png`.

## Pendientes

- La página de claim no consume el token ni genera un pase todavía; eso se
  implementa con Google Wallet en la Fase 4.
- La detección que marca tarjetas `flagged` llegará con el web service de Apple
  en la Fase 5; esta fase implementa su vista administrativa.
- El formulario público de referidos y privacidad corresponden a la Fase 6.
