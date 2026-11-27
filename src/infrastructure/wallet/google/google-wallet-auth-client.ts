import { GoogleAuth } from 'google-auth-library'
import { importPKCS8, SignJWT } from 'jose'

import type { GoogleServiceAccount } from './google-wallet-config'

const GOOGLE_WALLET_SCOPE =
  'https://www.googleapis.com/auth/wallet_object.issuer'

type SaveJwtPayload = {
  loyaltyObjects: Array<{
    classId: string
    id: string
  }>
}

/** Reuses Google OAuth credentials and the imported RSA key per process. */
export class GoogleWalletAuthClient {
  static #instance: GoogleWalletAuthClient | null = null

  readonly #auth: GoogleAuth
  readonly #email: string
  readonly #privateKey: Promise<CryptoKey>

  /**
   * Returns the process-wide Google auth singleton.
   *
   * @param serviceAccount - Validated Google service account credentials.
   */
  static for(serviceAccount: GoogleServiceAccount): GoogleWalletAuthClient {
    GoogleWalletAuthClient.#instance ??= new GoogleWalletAuthClient(
      serviceAccount
    )
    return GoogleWalletAuthClient.#instance
  }

  /**
   * Creates the singleton around one service account.
   *
   * @param serviceAccount - Validated Google service account credentials.
   */
  private constructor(serviceAccount: GoogleServiceAccount) {
    this.#auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: [GOOGLE_WALLET_SCOPE],
    })
    this.#email = serviceAccount.client_email
    this.#privateKey = importPKCS8(serviceAccount.private_key, 'RS256')
  }

  /** Returns an OAuth access token for the Wallet Objects REST API. */
  async getAccessToken(): Promise<string> {
    const client = await this.#auth.getClient()
    const accessToken = await client.getAccessToken()
    if (!accessToken.token) {
      throw new Error('Google Wallet OAuth did not return an access token')
    }
    return accessToken.token
  }

  /**
   * Signs the official `savetowallet` JWT for a pre-created object.
   *
   * @param payload - Existing loyalty objects referenced by ID.
   * @param origins - Approved web origins initiating the save.
   */
  async signSaveJwt(
    payload: SaveJwtPayload,
    origins: string[]
  ): Promise<string> {
    return new SignJWT({
      origins,
      payload,
      typ: 'savetowallet',
    })
      .setAudience('google')
      .setIssuedAt()
      .setIssuer(this.#email)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .sign(await this.#privateKey)
  }
}
