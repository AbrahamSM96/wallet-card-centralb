import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { renderStampStripPng } from '@/infrastructure/wallet/stamp-strip-image'
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
    icon3x: Buffer
    logo: Buffer
    logo2x: Buffer
    logo3x: Buffer
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
      icon: readFileSync(
        join(process.cwd(), 'public', 'brand', 'apple-icon.png')
      ),
      icon2x: readFileSync(
        join(process.cwd(), 'public', 'brand', 'apple-icon@2x.png')
      ),
      icon3x: readFileSync(
        join(process.cwd(), 'public', 'brand', 'apple-icon@3x.png')
      ),
      logo: readFileSync(
        join(process.cwd(), 'public', 'brand', 'apple-logo.png')
      ),
      logo2x: readFileSync(
        join(process.cwd(), 'public', 'brand', 'apple-logo@2x.png')
      ),
      logo3x: readFileSync(
        join(process.cwd(), 'public', 'brand', 'apple-logo@3x.png')
      ),
    }
  }

  /**
   * Signs a pass package and returns distributable `.pkpass` bytes.
   *
   * @param passJson - Validated pass metadata from the builder.
   */
  async sign(passJson: ApplePassJson): Promise<Buffer> {
    const stampsField = passJson.storeCard.headerFields.find(
      (field) => field.key === 'stamps'
    )
    const [stampsText, goalText] = String(stampsField?.value ?? '0/10').split(
      '/'
    )
    const stamps = Number(stampsText)
    const goal = Number(goalText)
    const [strip, strip2x, strip3x] = await Promise.all([
      renderStampStripPng(stamps, goal, 375, 123),
      renderStampStripPng(stamps, goal, 750, 246),
      renderStampStripPng(stamps, goal, 1125, 369),
    ])
    const pass = new PKPass(
      {
        'icon.png': this.#assets.icon,
        'icon@2x.png': this.#assets.icon2x,
        'icon@3x.png': this.#assets.icon3x,
        'logo.png': this.#assets.logo,
        'logo@2x.png': this.#assets.logo2x,
        'logo@3x.png': this.#assets.logo3x,
        'pass.json': Buffer.from(JSON.stringify(passJson)),
        'strip.png': strip,
        'strip@2x.png': strip2x,
        'strip@3x.png': strip3x,
      },
      this.#certificates
    )
    return pass.getAsBuffer()
  }
}
