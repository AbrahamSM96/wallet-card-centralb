# Respuesta al review — Fase 4

1. **acepto.** `WalletCard` ahora incluye el estado de la tarjeta y el builder
   mapea `voided` a `LoyaltyObject.state = INACTIVE`; los demás estados usan
   `ACTIVE`, valores confirmados en la referencia REST. `voidCard` sincroniza el
   wallet después del commit, igual que la reactivación tras revisar una
   tarjeta flagged. Hay tests del builder y de la sincronización post-anulación.

2. **acepto.** Se agregó el puerto `PostCommitScheduler` al dominio.
   `LoyaltyService` entrega la tarea al scheduler después del commit. Producción
   inyecta `scheduleAfterResponse`, basado en el `after()` estable de
   `next/server`; registra el trabajo y devuelve inmediatamente, mientras Vercel
   mantiene viva la invocación. Sin scheduler, los tests usan ejecución
   inmediata; además hay un test con scheduler capturable que comprueba que el
   sello responde antes de invocar Google.

3. **acepto.** El detalle muestra “Resincronizar wallet” para tarjetas Google.
   La Server Action llama `requireAdmin()`, valida IDs con Zod y fuerza
   `WalletSyncService.update`. No se agrega una cola durable ni reintentos en
   esta fase.

4. **acepto.** Se agregó a `docs/PLAN.md` el checklist “antes de publicar Google
   Wallet”: logo PNG final, revisión/aprobación de LoyaltyClass, acceso de
   publicación del issuer y credenciales de producción en Vercel.
