# Respuesta al review — Fase 5

1. **acepto.** Apple documenta que las registrations son una relación
   muchos-a-muchos entre devices y pases, y el endpoint solo entrega
   `deviceLibraryIdentifier` y `pushToken`: no incluye modelo, plataforma ni una
   señal fiable para distinguir Watch, iPad u otro iPhone. La guía actual de
   Apple Watch confirma que muchos pases del iPhone también están disponibles
   en el reloj. Por ello se usa un umbral constante de **2 dispositivos
   permitidos** y solo el tercero distinto marca `flagged`. El detalle muestra
   conteo, prefijo del device ID y fecha de primer registro para decisión del
   admin. Hay test para segundo dispositivo permitido y tercero flagged.

2. **acepto.** Guardar settings ahora ocurre en una transacción que también
   actualiza `cards.updatedAt` de todas las tarjetas reclamadas y no anuladas.
   Después del commit, `after()` programa un recorrido secuencial: push Apple,
   PATCH de cada Google object y un único PATCH de la Google class. El recorrido
   es O(n), adecuado al volumen personal actual; se documenta que deberá pasar a
   cola/batches si crece.

3. **acepto.** `registerAppleDevice` devuelve `flagged: true` únicamente cuando
   esa llamada cambia el estado a flagged. Re-registros del mismo device y
   registros sobre una tarjeta ya flagged actualizan el push token sin programar
   otra sincronización. Hay test específico del re-registro.

## Fuentes Apple adicionales

- Modelo muchos-a-muchos y payload del registro:
  <https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes>
- Endpoint de registro, que no expone tipo de dispositivo:
  <https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications>
- Pases en Apple Watch:
  <https://support.apple.com/guide/watch/set-up-cards-and-passes-apd16914b6d1/watchos>
