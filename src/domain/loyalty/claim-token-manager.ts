const TOKEN_BYTES = 32

/** Generates opaque claim tokens and stores only their SHA-256 digests. */
export class ClaimTokenManager {
  readonly #crypto: Crypto

  /**
   * Creates a token manager with an injectable Web Crypto implementation.
   *
   * @param cryptoImplementation - Cryptographic implementation to use.
   */
  constructor(cryptoImplementation: Crypto = globalThis.crypto) {
    this.#crypto = cryptoImplementation
  }

  /** Generates a URL-safe token with 256 bits of entropy. */
  generate(): string {
    const bytes = this.#crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))
    return Buffer.from(bytes).toString('base64url')
  }

  /**
   * Hashes an opaque token for lookup and persistence.
   *
   * @param token - Raw token received from or returned to a client.
   */
  async hash(token: string): Promise<string> {
    const bytes = new TextEncoder().encode(token)
    const digest = await this.#crypto.subtle.digest('SHA-256', bytes)
    return Buffer.from(digest).toString('hex')
  }
}
