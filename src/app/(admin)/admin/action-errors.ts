import { LoyaltyError } from '@/domain/loyalty/errors'

const DOMAIN_ERROR_MESSAGES = {
  CARD_NOT_FOUND: 'No encontramos la tarjeta.',
  CARD_VOIDED: 'La tarjeta está anulada.',
  CLAIM_TOKEN_EXPIRED: 'El link de reclamo expiró.',
  CLAIM_TOKEN_INVALID: 'El link de reclamo no es válido.',
  CLAIM_TOKEN_INVALIDATED: 'El link de reclamo fue reemplazado.',
  CLAIM_TOKEN_USED: 'Esta tarjeta ya fue reclamada.',
  CUSTOMER_ALREADY_EXISTS: 'El teléfono o correo ya está registrado.',
  CUSTOMER_HAS_ACTIVE_CARD: 'El cliente ya tiene una tarjeta activa.',
  DUPLICATE_ORDER: 'Este pedido ya tiene sello.',
  INSUFFICIENT_STAMPS: 'La tarjeta todavía no alcanza la meta.',
  INVALID_STAMP: 'Los datos del sello no son válidos.',
  PRIVACY_ACCEPTANCE_REQUIRED: 'Debes aceptar el aviso de privacidad.',
  PUBLIC_CODE_CONFLICT: 'No pudimos generar el código. Intenta de nuevo.',
  PUBLIC_CODE_EXHAUSTED: 'No pudimos generar el código. Intenta de nuevo.',
  REFERRER_CARD_NOT_FOUND: 'La tarjeta del referidor no está activa.',
  SETTINGS_NOT_FOUND: 'No encontramos la configuración del programa.',
} as const

/**
 * Converts expected domain failures into safe Spanish UI messages.
 *
 * @param error - Unknown application failure.
 */
export function toSpanishActionError(error: unknown): string {
  if (
    error instanceof Error &&
    error.name === 'GoogleWalletConfigurationError'
  ) {
    return 'Google Wallet todavía no está configurado.'
  }
  if (error instanceof LoyaltyError) {
    return DOMAIN_ERROR_MESSAGES[error.code]
  }
  return 'Ocurrió un error. Intenta de nuevo.'
}
