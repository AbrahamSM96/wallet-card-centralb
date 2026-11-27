import type { LoyaltyLogger } from '@/domain/loyalty/wallet-provider'

/** Writes structured server failures without exposing them to the user. */
export class ServerLogger implements LoyaltyLogger {
  readonly #write: (value: string) => boolean

  /** Creates a logger backed by the server error stream. */
  constructor() {
    this.#write = process.stderr.write.bind(process.stderr)
  }

  /**
   * Records one recoverable server-side failure.
   *
   * @param message - Stable event message.
   * @param error - Original failure.
   */
  error(message: string, error: unknown): void {
    const detail = error instanceof Error ? error.message : 'Unknown error'
    this.#write(`${JSON.stringify({ detail, message })}\n`)
  }
}
