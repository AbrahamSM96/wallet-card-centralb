import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PKPass } from 'passkit-generator'

import type { ApplePassJson } from './apple-pass-builder'
import type { AppleWalletConfig } from './apple-wallet-config'

/** Reuses parsed Apple pass certificates and static assets per process. */
export class ApplePassSigningClient {
  static #instance: ApplePassSigningClient | null = null

  readonly #certificates: {
    signerCert: Buffer
    signerKey: Buffer
    signerKeyPassphrase?: string
    wwdr: Buffer
  }
  readonly #assets: {
    icon: Buffer
    icon2x: Buffer
    logo: Buffer
    logo2x: Buffer
  }

  /**
   * Returns the process-wide signing client singleton.
   *
   * @param config - Validated Apple Wallet configuration.
   */
  static for(config: AppleWalletConfig): ApplePassSigningClient {
    ApplePassSigningClient.#instance ??= new ApplePassSigningClient(config)
    return ApplePassSigningClient.#instance
  }

  /**
   * Loads certificates and required pass images once.
   *
   * @param config - Validated Apple Wallet configuration.
   */
  private constructor(config: AppleWalletConfig) {
    this.#certificates = {
      signerCert: config.passCertificate,
      signerKey: config.passKey,
      signerKeyPassphrase: config.passKeyPassphrase,
      wwdr: config.wwdrCertificate,
    }
    this.#assets = {
      icon: readFileSync(join(process.cwd(), 'public', 'apple-icon.png')),
      icon2x: readFileSync(join(process.cwd(), 'public', 'apple-icon@2x.png')),
      logo: readFileSync(join(process.cwd(), 'public', 'apple-logo.png')),
      logo2x: readFileSync(join(process.cwd(), 'public', 'apple-logo@2x.png')),
    }
  }

  /**
   * Signs a pass package and returns distributable `.pkpass` bytes.
   *
   * @param passJson - Validated pass metadata from the builder.
   */
  sign(passJson: ApplePassJson): Buffer {
    const pass = new PKPass(
      {
        'icon.png': this.#assets.icon,
        'icon@2x.png': this.#assets.icon2x,
        'logo.png': this.#assets.logo,
        'logo@2x.png': this.#assets.logo2x,
        'pass.json': Buffer.from(JSON.stringify(passJson)),
      },
      this.#certificates
    )
    return pass.getAsBuffer()
  }
}
