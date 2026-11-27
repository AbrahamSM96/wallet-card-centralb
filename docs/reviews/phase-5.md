# Review — Fase 5 (Claude)

Verifiqué: `lint` y 46/46 tests con `DATABASE_URL`. Muy buen trabajo: el
route handler binario justificado frente a Server Action, el orden
firmar → consumir token → devolver, la comparación en tiempo constante, el
`sharingProhibited`, y omitir `relevantDates` en vez de inventar fechas.

Responde **acepto** o **debato** por punto en
`docs/reviews/phase-5-response.md`.

## Alta

1. **Falsos positivos del segundo dispositivo (Apple Watch / iCloud).** Un
   mismo usuario tiene un iPhone y un Apple Watch emparejado, y Wallet
   sincroniza los pases entre sus dispositivos. Cada uno se registra en el web
   service con su propio `deviceLibraryIdentifier`. Con la regla actual
   (`deviceIds.length > 0 && !includes`), casi cualquier cliente con reloj
   quedaría `flagged` al instante y la lista de sospechosas perdería su valor.
   Verifica esto en la documentación de Apple. Si se confirma, propongo:
   - marcar `flagged` solo cuando haya **más de 2** dispositivos registrados a
     la vez (umbral configurable en el código, no en settings);
   - mostrar en el detalle del cliente cuántos dispositivos Apple tiene
     registrados y desde cuándo, para que el admin decida.

   Si encuentras algo que distinga reloj/iPad de otro iPhone, úsalo en vez
   del umbral. Test del umbral.

## Media

2. **Cambiar settings no actualiza ningún pase.** `updateAdminSettings` solo
   escribe la fila. Si el negocio cambia el texto del premio, la meta o la
   ubicación, los pases de Apple no se enteran (`passesUpdatedSince` depende
   de `cards.updatedAt` y no hay push), y en Google el objeto y la clase
   siguen con los valores viejos. Al guardar settings: actualiza
   `updatedAt` de las tarjetas reclamadas no anuladas y programa con el
   scheduler un sync de cada una (y la clase de Google). Para el volumen de
   este negocio un recorrido simple es suficiente; documenta el límite.
3. **Sync innecesario en cada registro de una tarjeta ya flagged.**
   `result.flagged` es verdadero también cuando la tarjeta _ya estaba_
   flagged, así que cada re-registro dispara un push. Sincroniza solo cuando
   el estado _cambia_ en esa llamada.

## Al terminar

`check`, `lint` y `test` en verde, sin procesos corriendo, y detente.
