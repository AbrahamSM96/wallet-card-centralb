import type { WalletCard } from '@/domain/loyalty/wallet-provider'

type ApplePassField = {
  changeMessage?: string
  key: string
  label: string
  value: string
}

export type ApplePassJson = {
  authenticationToken: string
  backgroundColor: string
  barcodes: Array<{
    format: 'PKBarcodeFormatQR'
    message: string
    messageEncoding: 'iso-8859-1'
  }>
  description: string
  foregroundColor: string
  formatVersion: 1
  labelColor: string
  locations: Array<{
    latitude: number
    longitude: number
    relevantText: string
  }>
  logoText: string
  organizationName: string
  passTypeIdentifier: string
  serialNumber: string
  sharingProhibited: true
  storeCard: {
    backFields: ApplePassField[]
    primaryFields: ApplePassField[]
    secondaryFields: ApplePassField[]
  }
  teamIdentifier: string
  voided: boolean
  webServiceURL: string
}

type ApplePassBuilderInput = {
  appUrl: string
  card: WalletCard
  passTypeIdentifier: string
  teamIdentifier: string
}

/** Builds the current Apple Wallet `pass.json` for a store card. */
export class ApplePassBuilder {
  readonly #appUrl: string
  readonly #card: WalletCard
  readonly #passTypeIdentifier: string
  readonly #teamIdentifier: string

  /**
   * Creates a builder from trusted card and issuer data.
   *
   * @param input - Card presentation and Apple identifiers.
   * @param input.appUrl - Public application URL.
   * @param input.card - Trusted wallet card data.
   * @param input.passTypeIdentifier - Registered Apple pass type identifier.
   * @param input.teamIdentifier - Apple Developer team identifier.
   */
  constructor({
    appUrl,
    card,
    passTypeIdentifier,
    teamIdentifier,
  }: ApplePassBuilderInput) {
    this.#appUrl = appUrl.replace(/\/$/, '')
    this.#card = card
    this.#passTypeIdentifier = passTypeIdentifier
    this.#teamIdentifier = teamIdentifier
  }

  /** Builds `pass.json` without deprecated temporal relevance fields. */
  build(): ApplePassJson {
    if (!this.#card.appleAuthToken) {
      throw new Error('Apple authentication token is missing for the card')
    }

    const secondaryFields: ApplePassField[] = [
      {
        changeMessage: 'Nueva promoción: %@',
        key: 'promotion',
        label: 'PREMIO',
        value: this.#card.rewardText,
      },
    ]
    if (this.#card.birthdayPromoActive) {
      secondaryFields.push({
        changeMessage: 'Promoción de cumpleaños: %@',
        key: 'birthday_promotion',
        label: 'CUMPLEAÑOS',
        value: this.#card.birthdayPromoText,
      })
    }

    return {
      authenticationToken: this.#card.appleAuthToken,
      backgroundColor: 'rgb(124, 63, 44)',
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: this.#card.publicCode,
          messageEncoding: 'iso-8859-1',
        },
      ],
      description: `Tarjeta de lealtad de ${this.#card.storeName}`,
      foregroundColor: 'rgb(255, 255, 255)',
      formatVersion: 1,
      labelColor: 'rgb(255, 235, 220)',
      locations: [
        {
          latitude: this.#card.storeLatitude,
          longitude: this.#card.storeLongitude,
          relevantText: this.#card.storeRelevantText,
        },
      ],
      logoText: this.#card.storeName,
      organizationName: this.#card.storeName,
      passTypeIdentifier: this.#passTypeIdentifier,
      serialNumber: this.#card.cardId,
      sharingProhibited: true,
      storeCard: {
        backFields: [
          {
            key: 'referral',
            label: 'INVITA A UN AMIGO',
            value: this.#card.referralUrl,
          },
          {
            key: 'member',
            label: 'CLIENTE',
            value: `${this.#card.accountName} · ${this.#card.publicCode}`,
          },
        ],
        primaryFields: [
          {
            changeMessage: 'Tus sellos ahora son %@.',
            key: 'stamps',
            label: 'SELLOS',
            value: `${this.#card.stampCount}/${this.#card.stampsRequired}`,
          },
        ],
        secondaryFields,
      },
      teamIdentifier: this.#teamIdentifier,
      voided: this.#card.status === 'voided',
      webServiceURL: `${this.#appUrl}/api/apple`,
    }
  }
}
