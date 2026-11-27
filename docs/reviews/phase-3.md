# Review — Fase 3 (Claude)

Probé el panel en Chrome contra el Postgres local:

| Flujo                                                    | Resultado         |
| -------------------------------------------------------- | ----------------- |
| Login → dashboard con conteos                            | ✅                |
| Alta de cliente → `CB-4BH3`, QR, copiar link, WhatsApp   | ✅                |
| Búsqueda por `cb-4bh3` (minúsculas)                      | ✅                |
| Búsqueda por `771 555 0199` (como lo teclea una persona) | ❌ sin resultados |
| Sello con `#1001` → 1 de 10                              | ✅                |
| Repetir `1001` → "Este pedido ya tiene sello."           | ✅                |
| Canje deshabilitado antes de la meta                     | ✅                |

`requireAdmin()` en cada action, validación Zod, el token que solo vive en la
respuesta y la separación de queries de lectura en `admin-dashboard.ts` están
muy bien. El "1 Issue" del overlay de Next es un hydration mismatch causado por
una extensión del navegador (`data-lt-installed`), no por la app.

No pude verificar el layout a 390 px (la ventana de Chrome no bajó de ~1350).
Revisa tú una captura a 390 px de `/admin/clientes/[id]` y menciónala en tu
respuesta.

Responde **acepto** o **debato** por punto en
`docs/reviews/phase-3-response.md`.

## Alta

1. **Buscar por teléfono no funciona como se usa.** Guardas `+527715550199` y
   haces `ilike '%771 555 0199%'`. El negocio va a teclear el número con
   espacios o guiones. Si la búsqueda tiene ≥ 4 dígitos, compara también
   contra los dígitos (`regexp_replace` o quitando no-dígitos del input y
   buscando en `phone`). Agrega un test.

## Media

2. **No hay acciones para tarjetas `flagged` ni anuladas.** La lista existe,
   pero el admin no puede hacer nada con ella, y un cliente sin tarjeta
   vigente (p. ej. "C … Sin tarjeta") se queda así para siempre. Agrega en el
   detalle:
   - "Marcar como revisada" (`flagged` → `active`)
   - "Anular tarjeta" (→ `voided`)
   - "Emitir tarjeta nueva" cuando no hay vigente (usa `issueCard` y muestra
     el `ClaimDeliveryCard`)

   Todo por `LoyaltyService` (facade), con `requireAdmin()`.

3. **Escapa `%` y `_` en la búsqueda.** Hoy `_` hace match con cualquier
   carácter y `%` con todo. Escápalos antes de armar el patrón.

## Baja

4. **Texto fijo en WhatsApp.** `buildClaimDelivery` tiene "Central Brownies"
   escrito a mano; usa `siteConfig.name`.
5. **Plural.** "La tarjeta tiene 1 sellos" → usa singular/plural.
6. **Teléfono en pantalla.** Muestra `771 555 0199` en lugar de
   `+527715550199` (guarda el canónico, formatea al mostrar).
7. **Parámetro muerto.** `revalidateCustomerPaths(_cardId)` no usa el
   argumento; quítalo o úsalo.
8. **Dev server huérfano.** Quedó un `next dev` corriendo en :3000 después
   de tu fase. Al terminar, detén los procesos que levantes.

## Al terminar

`check`, `lint` y `test` en verde, y detente.
