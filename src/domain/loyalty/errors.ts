export type LoyaltyErrorCode =
  | 'CARD_NOT_FOUND'
  | 'CARD_VOIDED'
  | 'CLAIM_TOKEN_EXPIRED'
  | 'CLAIM_TOKEN_INVALID'
  | 'CLAIM_TOKEN_INVALIDATED'
  | 'CLAIM_TOKEN_USED'
  | 'CUSTOMER_ALREADY_EXISTS'
  | 'CUSTOMER_HAS_ACTIVE_CARD'
  | 'DUPLICATE_ORDER'
  | 'INSUFFICIENT_STAMPS'
  | 'INVALID_STAMP'
  | 'PRIVACY_ACCEPTANCE_REQUIRED'
  | 'PUBLIC_CODE_CONFLICT'
  | 'PUBLIC_CODE_EXHAUSTED'
  | 'REFERRER_CARD_NOT_FOUND'
  | 'SETTINGS_NOT_FOUND'

/** Identifies an expected loyalty-domain failure with a stable code. */
export class LoyaltyError extends Error {
  /**
   * Creates a domain error suitable for translation at an application edge.
   *
   * @param code - Stable machine-readable failure code.
   * @param message - Internal human-readable explanation.
   */
  constructor(
    readonly code: LoyaltyErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'LoyaltyError'
  }
}
