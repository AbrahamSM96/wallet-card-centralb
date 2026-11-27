import type { WalletCard } from '@/domain/loyalty/wallet-provider'

export type GoogleLoyaltyClass = {
  countryCode: 'MX'
  hexBackgroundColor: string
  id: string
  issuerName: string
  merchantLocations: Array<{
    latitude: number
    longitude: number
  }>
  multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES'
  programLogo: {
    contentDescription: {
      defaultValue: {
        language: 'es-MX'
        value: string
      }
    }
    sourceUri: { uri: string }
  }
  programName: string
  reviewStatus: 'UNDER_REVIEW'
}

export type GoogleLoyaltyObject = {
  accountId: string
  accountName: string
  barcode: {
    type: 'QR_CODE'
    value: string
  }
  classId: string
  id: string
  linksModuleData: {
    uris: Array<{
      description: string
      id: string
      uri: string
    }>
  }
  loyaltyPoints: {
    balance: { int: number }
    label: string
  }
  merchantLocations: Array<{
    latitude: number
    longitude: number
  }>
  state: 'ACTIVE' | 'INACTIVE'
  textModulesData: Array<{
    body: string
    header: string
    id: string
  }>
}

type GoogleLoyaltyObjectBuilderInput = {
  card: WalletCard
  classId: string
  issuerId: string
  logoUrl: string
}

/** Builds Google LoyaltyClass and LoyaltyObject resources from domain data. */
export class GoogleLoyaltyObjectBuilder {
  readonly #card: WalletCard
  readonly #classId: string
  readonly #issuerId: string
  readonly #logoUrl: string

  /**
   * Creates a builder for one wallet card.
   *
   * @param input - IDs, application URL, and card presentation data.
   * @param input.card - Domain wallet card data.
   * @param input.classId - Fully-qualified Google class ID.
   * @param input.issuerId - Google Wallet issuer ID.
   * @param input.logoUrl - Public HTTPS logo URL.
   */
  constructor({
    card,
    classId,
    issuerId,
    logoUrl,
  }: GoogleLoyaltyObjectBuilderInput) {
    this.#card = card
    this.#classId = classId
    this.#issuerId = issuerId
    this.#logoUrl = logoUrl
  }

  /** Builds the shared loyalty class using supported current fields. */
  buildClass(): GoogleLoyaltyClass {
    return {
      countryCode: 'MX',
      hexBackgroundColor: '#7c3f2c',
      id: this.#classId,
      issuerName: this.#card.storeName,
      merchantLocations: [this.#merchantLocation()],
      multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
      programLogo: {
        contentDescription: {
          defaultValue: {
            language: 'es-MX',
            value: `Logo de ${this.#card.storeName}`,
          },
        },
        sourceUri: { uri: this.#logoUrl },
      },
      programName: this.#card.storeName,
      reviewStatus: 'UNDER_REVIEW',
    }
  }

  /** Builds one loyalty object with stamps, referral link, and location. */
  buildObject(): GoogleLoyaltyObject {
    const textModulesData: GoogleLoyaltyObject['textModulesData'] = [
      {
        body: this.#card.rewardText,
        header: `Premio al llegar a ${this.#card.stampsRequired} sellos`,
        id: 'reward',
      },
    ]
    if (this.#card.birthdayPromoActive) {
      textModulesData.push({
        body: this.#card.birthdayPromoText,
        header: '¡Feliz cumpleaños!',
        id: 'birthday_promotion',
      })
    }

    return {
      accountId: this.#card.publicCode,
      accountName: this.#card.accountName,
      barcode: {
        type: 'QR_CODE',
        value: this.#card.publicCode,
      },
      classId: this.#classId,
      id: this.objectId(),
      linksModuleData: {
        uris: [
          {
            description: 'Invitar a un amigo',
            id: 'referral_link',
            uri: this.#card.referralUrl,
          },
        ],
      },
      loyaltyPoints: {
        balance: { int: this.#card.stampCount },
        label: 'Sellos',
      },
      merchantLocations: [this.#merchantLocation()],
      state: this.#card.status === 'voided' ? 'INACTIVE' : 'ACTIVE',
      textModulesData,
    }
  }

  /** Returns the stable issuer-qualified object ID for this card. */
  objectId(): string {
    return `${this.#issuerId}.${this.#card.cardId}`
  }

  /** Builds one supported MerchantLocation entry. */
  #merchantLocation(): { latitude: number; longitude: number } {
    return {
      latitude: this.#card.storeLatitude,
      longitude: this.#card.storeLongitude,
    }
  }
}
