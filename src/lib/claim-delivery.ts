import { siteConfig } from '@/config/site'
import QRCode from 'qrcode'

export type ClaimDelivery = {
  claimUrl: string
  qrDataUrl: string
  whatsappUrl: string
}

/**
 * Normalizes a Mexican phone number to the canonical E.164 representation.
 *
 * @param value - User-entered phone number.
 */
export function normalizeMexicanPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const nationalNumber =
    digits.length === 12 && digits.startsWith('52') ? digits.slice(2) : digits
  return nationalNumber.length === 10 ? `+52${nationalNumber}` : ''
}

/**
 * Formats a canonical Mexican phone for human-readable display.
 *
 * @param value - Canonical or user-entered Mexican phone.
 */
export function formatMexicanPhone(value: string): string {
  const canonical = normalizeMexicanPhone(value)
  if (!canonical) return value
  const national = canonical.slice(3)
  return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
}

/**
 * Builds the one-time claim URL, QR image, and prefilled WhatsApp URL.
 *
 * @param appUrl - Validated public application base URL.
 * @param claimToken - One-time raw claim token.
 * @param phone - Canonical Mexican phone number.
 */
export async function buildClaimDelivery(
  appUrl: string,
  claimToken: string,
  phone: string
): Promise<ClaimDelivery> {
  const claimUrl = `${appUrl.replace(/\/$/, '')}/c/${claimToken}`
  const message = `¡Hola! Tu tarjeta de ${siteConfig.name} está lista: ${claimUrl}`
  const qrDataUrl = await QRCode.toDataURL(claimUrl, {
    margin: 1,
    width: 320,
  })
  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
  return { claimUrl, qrDataUrl, whatsappUrl }
}
