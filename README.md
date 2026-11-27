# Central Brownies — Wallet Loyalty CRM

Panel mobile-first para administrar una tarjeta de sellos en Apple Wallet y
Google Wallet.

## Requisitos

- Bun 1.3.x
- Docker Desktop o Docker Engine con Compose
- Node-compatible runtime para Next.js 16 en producción

## Desarrollo local

```bash
bun install
cp .env.example .env.local
bun run db:up
bun run db:migrate
bun run db:seed
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
bun run admin:create admin@example.com
unset ADMIN_PASSWORD
bun run dev
```

Postgres se publica en `localhost:5434`; la URL local es:

```text
postgres://central_brownies:central_brownies@localhost:5434/central_brownies
```

Comandos útiles:

```bash
bun run db:logs
bun run db:studio
bun run db:down
bun run check
bun run lint
bun run test
```

`db:reset` elimina el volumen local y todos sus datos.

## Variables de entorno

### Aplicación

| Variable         | Uso                                                            |
| ---------------- | -------------------------------------------------------------- |
| `APP_URL`        | URL pública para claims, referidos, assets y web service Apple |
| `DATABASE_URL`   | Postgres local o URL de Neon                                   |
| `SESSION_SECRET` | Firma de sesiones admin; mínimo 32 caracteres                  |
| `CRON_SECRET`    | Bearer token del cron; mínimo 32 caracteres                    |

### Google Wallet — opcionales

| Variable                               | Uso                                        |
| -------------------------------------- | ------------------------------------------ |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_BASE64` | JSON completo de service account en base64 |
| `GOOGLE_WALLET_ISSUER_ID`              | Issuer ID de Google Wallet                 |
| `GOOGLE_WALLET_CLASS_SUFFIX`           | Sufijo estable de LoyaltyClass             |
| `GOOGLE_WALLET_LOGO_URL`               | URL HTTPS pública del logo                 |

Sin estas variables, el panel y Apple siguen funcionando; solo falla la emisión
Google con un error de configuración claro.

Google no puede descargar imágenes desde `localhost` ni por HTTP. En desarrollo
configura `GOOGLE_WALLET_LOGO_URL` con un CDN o un túnel HTTPS público; en Vercel
puede apuntar a `https://tu-dominio/google-wallet-logo.png`.

### Apple Wallet — opcionales

| Variable                    | Uso                                  |
| --------------------------- | ------------------------------------ |
| `APPLE_PASS_CERT_BASE64`    | Certificado firmante PEM en base64   |
| `APPLE_PASS_KEY_BASE64`     | Llave privada firmante PEM en base64 |
| `APPLE_PASS_KEY_PASSPHRASE` | Passphrase de la llave, si existe    |
| `APPLE_WWDR_CERT_BASE64`    | Certificado WWDR PEM en base64       |
| `APPLE_TEAM_ID`             | Team ID del Apple Developer Program  |
| `APPLE_PASS_TYPE_ID`        | Pass Type Identifier y topic APNs    |
| `APPLE_APNS_KEY_ID`         | Key ID de APNs                       |
| `APPLE_APNS_KEY_BASE64`     | Llave `.p8` de APNs en base64        |

Sin este grupo, el resto de la aplicación continúa disponible.

## Cron de cumpleaños

`vercel.json` ejecuta diariamente:

```text
GET /api/cron/birthdays
Authorization: Bearer <CRON_SECRET>
```

Horario: `0 15 * * *`, equivalente a 09:00 en Pachuca/Mexico City (UTC-6 sin
horario estacional). El cron espera las notificaciones dentro del request para
reportar el resultado; el volumen actual es pequeño.

## Producción

### Vercel

- [ ] Conectar el repositorio sin configurar Dockerfile.
- [ ] Build command: `bun run vercel-build`.
- [ ] Configurar `APP_URL`, `SESSION_SECRET` y `CRON_SECRET`.
- [ ] Confirmar que Vercel Cron lea `vercel.json`.
- [ ] Ejecutar `admin:create` contra producción desde un entorno seguro.

### Neon

- [ ] Crear base de producción y guardar su URL pooler en `DATABASE_URL`.
- [ ] Permitir que `drizzle-kit migrate` use la URL directa derivada por config.
- [ ] Aplicar y respaldar migraciones antes de operar el panel.

### Google Wallet

- [ ] Crear issuer y autorizar la service account.
- [ ] Sustituir `public/google-wallet-logo.png` por el logo PNG final.
- [ ] Configurar `GOOGLE_WALLET_LOGO_URL` con una URL HTTPS pública verificable.
- [ ] Revisar y aprobar la LoyaltyClass.
- [ ] Solicitar acceso de publicación; Demo Mode muestra `[TEST ONLY]`.
- [ ] Probar guardado, updates, links, ubicación y cuota de mensajes.

### Apple Wallet

- [ ] Contratar Apple Developer Program y registrar Pass Type ID.
- [ ] Crear certificado de firma, descargar WWDR y generar llave APNs `.p8`.
- [ ] Sustituir los cuatro PNG Apple por assets finales a sus dimensiones.
- [ ] Confirmar que `APP_URL` usa HTTPS y el web service es accesible.
- [ ] Probar instalación, registro iPhone/Watch, actualización, caché y APNs en
      dispositivos reales; el simulador no registra push de pases.
- [ ] Vigilar expiración y rotación de certificados/llaves.

## Aviso de privacidad

`/privacidad` contiene un borrador LFPDPPP con campos `[COMPLETAR]`. Antes de
publicar, el responsable debe completar correo, identidad legal y revisar el
texto con asesoría profesional. El contenido del repositorio no constituye
asesoría legal.
