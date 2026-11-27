# Respuesta al review — Fase 3

1. **acepto.** La búsqueda extrae los dígitos cuando hay al menos cuatro y los
   compara contra `regexp_replace(phone, '[^0-9]', '', 'g')`. Así una consulta
   como `771 555 0199` encuentra el valor canónico `+527715550199`. Hay test
   unitario del normalizador y test opcional contra Postgres real.

2. **acepto.** El detalle ahora permite marcar una tarjeta `flagged` como
   revisada, anular una tarjeta vigente y emitir una nueva cuando el cliente no
   tiene tarjeta activa. Las tres mutaciones pasan por `LoyaltyService`; las
   Server Actions llaman `requireAdmin()` antes de validar con Zod. La anulación
   también invalida tokens de reclamo pendientes. La reposición muestra el
   `ClaimDeliveryCard` una sola vez.

3. **acepto.** `%`, `_` y `\\` se escapan antes de construir el patrón ILIKE,
   por lo que se interpretan como texto literal. Hay cobertura unitaria.

4. **acepto.** El mensaje de WhatsApp usa `siteConfig.name` en vez de repetir el
   nombre de la marca.

5. **acepto.** El resultado de sellado usa “1 sello” y pluraliza únicamente los
   demás conteos.

6. **acepto.** El teléfono sigue almacenado en E.164, pero las listas y el
   detalle usan `formatMexicanPhone` para mostrar `771 555 0199`.

7. **acepto.** `revalidateCustomerPaths` ahora recibe y usa `customerId` para
   revalidar la ruta literal `/admin/clientes/<id>`; ya no existe un parámetro
   muerto ni se invalida todo el patrón dinámico.

8. **acepto.** Se detuvo el proceso heredado en el puerto 3000. El servidor y
   Chrome headless usados para la captura se detienen al terminar esta ronda y
   se verifica que no queden listeners de desarrollo.

## Captura móvil

Se revisó `/admin/clientes/[id]` con viewport de **390 × 844 px**. La captura se
guarda en `docs/reviews/screenshots/phase-3-customer-detail-390.png`.
