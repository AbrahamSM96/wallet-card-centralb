import { siteConfig } from '@/config/site'
import type { WalletCard } from '@/domain/loyalty/wallet-provider'

import { googleWalletEnum } from './google-wallet-enums'

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
  heroImage: {
    contentDescription: {
      defaultValue: {
        language: 'es-MX'
        value: string
      }
    }
    sourceUri: { uri: string }
  }
  linksModuleData: {
    uris: Array<{
      description: string
      id: string
      uri: string
    }>
  }
  loyaltyPoints: {
    balance: { string: string }
    label: string
  }
  merchantLocations: Array<{
    latitude: number
    longitude: number
  }>
  secondaryLoyaltyPoints: {
    balance: { string: string }
    label: string
  }
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
  stripBaseUrl: string
}

/** Builds Google LoyaltyClass and LoyaltyObject resources from domain data. */
export class GoogleLoyaltyObjectBuilder {
  readonly #card: WalletCard
  readonly #classId: string
  readonly #issuerId: string
  readonly #logoUrl: string
  readonly #stripBaseUrl: string

  /**
   * Creates a builder for one wallet card.
   *
   * @param input - IDs, application URL, and card presentation data.
   * @param input.card - Domain wallet card data.
   * @param input.classId - Fully-qualified Google class ID.
   * @param input.issuerId - Google Wallet issuer ID.
   * @param input.logoUrl - Public HTTPS logo URL.
   * @param input.stripBaseUrl - Public application URL for the stamp strip.
   */
  constructor({
    card,
    classId,
    issuerId,
    logoUrl,
    stripBaseUrl,
  }: GoogleLoyaltyObjectBuilderInput) {
    this.#card = card
    this.#classId = classId
    this.#issuerId = issuerId
    this.#logoUrl = logoUrl
    this.#stripBaseUrl = stripBaseUrl.replace(/\/$/, '')
  }

  /** Builds the shared loyalty class using supported current fields. */
  buildClass(): GoogleLoyaltyClass {
    return {
      countryCode: 'MX',
      hexBackgroundColor: '#141110',
      id: this.#classId,
      issuerName: siteConfig.name,
      merchantLocations: [this.#merchantLocation()],
      multipleDevicesAndHoldersAllowedStatus:
        googleWalletEnum.multipleHolderStatus,
      programLogo: {
        contentDescription: {
          defaultValue: {
            language: 'es-MX',
            value: `Logo de ${siteConfig.name}`,
          },
        },
        sourceUri: { uri: this.#logoUrl },
      },
      programName: siteConfig.name,
      reviewStatus: googleWalletEnum.reviewStatus,
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
        type: googleWalletEnum.qrCode,
        value: this.#card.publicCode,
      },
      classId: this.#classId,
      heroImage: {
        contentDescription: {
          defaultValue: {
            language: 'es-MX',
            value: `Progreso: ${this.#card.stampCount} de ${this.#card.stampsRequired} sellos`,
          },
        },
        sourceUri: {
          uri: `${this.#stripBaseUrl}/api/wallet/strip?stamps=${this.#card.stampCount}&goal=${this.#card.stampsRequired}`,
        },
      },
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
        balance: {
          string: `${this.#card.stampCount} de ${this.#card.stampsRequired}`,
        },
        label: 'Sellos',
      },
      merchantLocations: [this.#merchantLocation()],
      secondaryLoyaltyPoints:
        this.#card.stampCount >= this.#card.stampsRequired
          ? { balance: { string: 'Listo' }, label: 'Premio' }
          : {
              balance: {
                string: String(
                  this.#card.stampsRequired - this.#card.stampCount
                ),
              },
              label: 'Te faltan',
            },
      state:
        this.#card.status === 'voided'
          ? googleWalletEnum.inactiveState
          : googleWalletEnum.activeState,
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
