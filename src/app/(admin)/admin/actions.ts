'use server'

import { env } from '@/config/env'
import { requireAdmin } from '@/infrastructure/auth/require-admin'
import {
  getCustomerPhone,
  getCustomerPhoneByCardId,
  updateAdminSettings,
} from '@/infrastructure/db/admin-dashboard'
import { loyaltyService } from '@/infrastructure/loyalty-service'
import { scheduleSettingsWalletSync } from '@/infrastructure/wallet/settings-wallet-sync'
import { WalletSyncService } from '@/infrastructure/wallet/wallet-sync-service'
import {
  buildClaimDelivery,
  type ClaimDelivery,
  normalizeMexicanPhone,
} from '@/lib/claim-delivery'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { toSpanishActionError } from './action-errors'

const CLAIM_DURATION_MS = 7 * 24 * 60 * 60 * 1000

const customerSchema = z.object({
  birthday: z.iso.date(),
  email: z.union([z.literal(''), z.email()]).transform(emptyStringToNull),
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .transform(normalizeMexicanPhone)
    .pipe(z.string().regex(/^\+52\d{10}$/)),
})

const stampSchema = z.object({
  cardId: z.uuid(),
  customerId: z.uuid(),
  note: z.string().trim().max(250).optional(),
  orderNumber: z.string().trim().min(1).max(80),
})

const cardIdSchema = z.object({
  cardId: z.uuid(),
  customerId: z.uuid(),
})

const customerIdSchema = z.object({
  customerId: z.uuid(),
})

const reissueSchema = z.object({
  cardId: z.uuid(),
  customerId: z.uuid(),
  resetClaim: z.enum(['on']).optional(),
})

const settingsSchema = z.object({
  birthdayPromoText: z.string().trim().min(1).max(500),
  rewardText: z.string().trim().min(1).max(500),
  stampsRequired: z.coerce.number().int().min(1).max(100),
  storeLatitude: z.coerce.number().min(-90).max(90),
  storeLongitude: z.coerce.number().min(-180).max(180),
  storeName: z.string().trim().min(1).max(120),
  storeRelevantText: z.string().trim().min(1).max(500),
})

export type FormActionState = {
  claimDelivery?: ClaimDelivery
  error?: string
  success?: string
}

/**
 * Creates a customer, active card, and one-time claim delivery.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted customer form input.
 */
export async function createCustomerAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireAdmin()
  const parsed = customerSchema.safeParse({
    birthday: formData.get('birthday'),
    email: formData.get('email'),
    name: formData.get('name'),
    phone: formData.get('phone'),
  })
  if (!parsed.success) return { error: 'Revisa los datos del cliente.' }

  try {
    const result = await loyaltyService.registerCustomer({
      birthday: parsed.data.birthday,
      claimExpiresAt: claimExpiration(),
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      privacyAcceptedAt: null,
    })
    const claimDelivery = await buildClaimDelivery(
      env.APP_URL,
      result.claimToken,
      parsed.data.phone
    )
    revalidatePath('/admin/clientes')
    revalidatePath('/admin')
    return {
      claimDelivery,
      success: `Cliente creado con tarjeta ${result.card.publicCode}.`,
    }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/**
 * Adds an order stamp to a card.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted stamp form input.
 */
export async function addStampAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const admin = await requireAdmin()
  const parsed = stampSchema.safeParse({
    cardId: formData.get('cardId'),
    customerId: formData.get('customerId'),
    note: optionalString(formData.get('note')),
    orderNumber: formData.get('orderNumber'),
  })
  if (!parsed.success) return { error: 'Ingresa un número de pedido válido.' }

  try {
    const result = await loyaltyService.addStamp({
      adminId: admin.id,
      cardId: parsed.data.cardId,
      note: parsed.data.note,
      orderNumber: parsed.data.orderNumber,
      source: 'order',
    })
    revalidateCustomerPaths(parsed.data.customerId)
    return {
      success: `Sello agregado. La tarjeta tiene ${stampCountLabel(result.stampCount)}.`,
    }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/**
 * Redeems the configured stamp goal while retaining any remainder.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted redemption form input.
 */
export async function redeemRewardAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const admin = await requireAdmin()
  const parsed = cardIdSchema.safeParse({
    cardId: formData.get('cardId'),
    customerId: formData.get('customerId'),
  })
  if (!parsed.success) return { error: 'La tarjeta no es válida.' }

  try {
    const result = await loyaltyService.redeemReward({
      adminId: admin.id,
      cardId: parsed.data.cardId,
    })
    revalidateCustomerPaths(parsed.data.customerId)
    return { success: `Premio canjeado por ${result.stampsUsed} sellos.` }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/**
 * Rotates a card claim token and returns the raw replacement once.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted token reissue form input.
 */
export async function reissueClaimTokenAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireAdmin()
  const parsed = reissueSchema.safeParse({
    cardId: formData.get('cardId'),
    customerId: formData.get('customerId'),
    resetClaim: optionalString(formData.get('resetClaim')),
  })
  if (!parsed.success) return { error: 'La tarjeta no es válida.' }

  try {
    const phone = await getCustomerPhoneByCardId(parsed.data.cardId)
    if (!phone) return { error: 'No encontramos el teléfono del cliente.' }

    const claimToken = await loyaltyService.reissueClaimToken({
      cardId: parsed.data.cardId,
      claimExpiresAt: claimExpiration(),
      resetClaim: parsed.data.resetClaim === 'on',
    })
    const claimDelivery = await buildClaimDelivery(
      env.APP_URL,
      claimToken,
      phone
    )
    revalidateCustomerPaths(parsed.data.customerId)
    return { claimDelivery, success: 'Nuevo link generado.' }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/**
 * Restores a flagged card to active after administrator review.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted card identifiers.
 */
export async function markCardReviewedAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireAdmin()
  const parsed = cardIdSchema.safeParse({
    cardId: formData.get('cardId'),
    customerId: formData.get('customerId'),
  })
  if (!parsed.success) return { error: 'La tarjeta no es válida.' }

  try {
    await loyaltyService.markCardReviewed(parsed.data.cardId)
    revalidateCustomerPaths(parsed.data.customerId)
    revalidatePath('/admin/tarjetas-flagged')
    return { success: 'Tarjeta marcada como revisada.' }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/**
 * Voids a card and its pending claim links.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted card identifiers.
 */
export async function voidCardAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireAdmin()
  const parsed = cardIdSchema.safeParse({
    cardId: formData.get('cardId'),
    customerId: formData.get('customerId'),
  })
  if (!parsed.success) return { error: 'La tarjeta no es válida.' }

  try {
    await loyaltyService.voidCard(parsed.data.cardId)
    revalidateCustomerPaths(parsed.data.customerId)
    return { success: 'Tarjeta anulada.' }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/**
 * Issues a replacement card when the customer has no current card.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted customer identifier.
 */
export async function issueReplacementCardAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireAdmin()
  const parsed = customerIdSchema.safeParse({
    customerId: formData.get('customerId'),
  })
  if (!parsed.success) return { error: 'El cliente no es válido.' }

  try {
    const phone = await getCustomerPhone(parsed.data.customerId)
    if (!phone) return { error: 'No encontramos el teléfono del cliente.' }
    const result = await loyaltyService.issueCard({
      claimExpiresAt: claimExpiration(),
      customerId: parsed.data.customerId,
    })
    const claimDelivery = await buildClaimDelivery(
      env.APP_URL,
      result.claimToken,
      phone
    )
    revalidateCustomerPaths(parsed.data.customerId)
    return {
      claimDelivery,
      success: `Nueva tarjeta ${result.card.publicCode} emitida.`,
    }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/**
 * Forces the current wallet object to reconcile with database state.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted card identifiers.
 */
export async function resyncWalletAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireAdmin()
  const parsed = cardIdSchema.safeParse({
    cardId: formData.get('cardId'),
    customerId: formData.get('customerId'),
  })
  if (!parsed.success) return { error: 'La tarjeta no es válida.' }

  try {
    await new WalletSyncService().update(parsed.data.cardId)
    revalidateCustomerPaths(parsed.data.customerId)
    return { success: 'Wallet resincronizada.' }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/**
 * Updates loyalty goals, texts, and store location.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted settings form input.
 */
export async function updateSettingsAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireAdmin()
  const parsed = settingsSchema.safeParse({
    birthdayPromoText: formData.get('birthdayPromoText'),
    rewardText: formData.get('rewardText'),
    stampsRequired: formData.get('stampsRequired'),
    storeLatitude: formData.get('storeLatitude'),
    storeLongitude: formData.get('storeLongitude'),
    storeName: formData.get('storeName'),
    storeRelevantText: formData.get('storeRelevantText'),
  })
  if (!parsed.success) return { error: 'Revisa la configuración.' }

  try {
    const walletCards = await updateAdminSettings(parsed.data)
    await scheduleSettingsWalletSync(walletCards)
    revalidatePath('/admin/configuracion')
    return { success: 'Configuración guardada.' }
  } catch (error) {
    return { error: toSpanishActionError(error) }
  }
}

/** Returns a claim-token expiration seven days from now. */
function claimExpiration(): Date {
  return new Date(Date.now() + CLAIM_DURATION_MS)
}

/**
 * Converts an empty optional form value to null.
 *
 * @param value - Validated string value.
 */
function emptyStringToNull(value: string): string | null {
  return value === '' ? null : value
}

/**
 * Converts an optional FormData entry into a string or undefined.
 *
 * @param value - Raw FormData entry.
 */
function optionalString(value: FormDataEntryValue | null): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/**
 * Revalidates panel views affected by a card mutation.
 *
 * @param customerId - Customer whose detail page changed.
 */
function revalidateCustomerPaths(customerId: string): void {
  revalidatePath('/admin/clientes')
  revalidatePath(`/admin/clientes/${customerId}`)
  revalidatePath('/admin')
}

/**
 * Formats a stamp count with correct Spanish singular or plural.
 *
 * @param count - Stamp count.
 */
function stampCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'sello' : 'sellos'}`
}
