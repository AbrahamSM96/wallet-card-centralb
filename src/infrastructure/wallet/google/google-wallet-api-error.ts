const MAX_GOOGLE_ERROR_LENGTH = 300

/** Represents a diagnostic Google Wallet REST failure. */
export class GoogleWalletApiError extends Error {
  readonly status: number

  /**
   * Creates an API error with status and a safely truncated detail.
   *
   * @param status - HTTP response status.
   * @param detail - Google response detail.
   */
  constructor(status: number, detail: string) {
    super(
      `Google Wallet API ${status}: ${detail.slice(0, MAX_GOOGLE_ERROR_LENGTH)}`
    )
    this.name = 'GoogleWalletApiError'
    this.status = status
  }
}

/**
 * Extracts Google's nested error.message or falls back to response text.
 *
 * @param status - HTTP response status.
 * @param responseText - Raw Google response body.
 */
export function createGoogleWalletApiError(
  status: number,
  responseText: string
): GoogleWalletApiError {
  let detail = responseText.trim() || 'Unknown Google Wallet error'
  try {
    const parsed = JSON.parse(responseText) as {
      error?: { message?: unknown }
    }
    if (typeof parsed.error?.message === 'string') {
      detail = parsed.error.message
    }
  } catch {
    // Non-JSON bodies remain useful after truncation.
  }
  return new GoogleWalletApiError(status, detail)
}
