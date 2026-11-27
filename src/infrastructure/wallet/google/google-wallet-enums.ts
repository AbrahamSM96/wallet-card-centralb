export const GOOGLE_OBJECT_STATES = [
  'STATE_UNSPECIFIED',
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'INACTIVE',
] as const

export const GOOGLE_BARCODE_TYPES = [
  'BARCODE_TYPE_UNSPECIFIED',
  'AZTEC',
  'CODE_39',
  'CODE_128',
  'CODABAR',
  'DATA_MATRIX',
  'EAN_8',
  'EAN_13',
  'ITF_14',
  'PDF_417',
  'QR_CODE',
  'UPC_A',
  'TEXT_ONLY',
] as const

export const GOOGLE_REVIEW_STATUSES = [
  'REVIEW_STATUS_UNSPECIFIED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'DRAFT',
] as const

export const GOOGLE_MULTIPLE_HOLDER_STATUSES = [
  'STATUS_UNSPECIFIED',
  'MULTIPLE_HOLDERS',
  'ONE_USER_ALL_DEVICES',
  'ONE_USER_ONE_DEVICE',
] as const

export const GOOGLE_MESSAGE_TYPES = [
  'MESSAGE_TYPE_UNSPECIFIED',
  'TEXT',
  'EXPIRATION_NOTIFICATION',
  'TEXT_AND_NOTIFY',
] as const

export const GOOGLE_NOTIFICATION_SETTINGS = [
  'NOTIFICATION_SETTINGS_FOR_UPDATES_UNSPECIFIED',
  'NOTIFY_ON_UPDATE',
] as const

export const googleWalletEnum = {
  activeState: 'ACTIVE',
  inactiveState: 'INACTIVE',
  multipleHolderStatus: 'ONE_USER_ALL_DEVICES',
  notifyMessage: 'TEXT_AND_NOTIFY',
  qrCode: 'QR_CODE',
  reviewStatus: 'UNDER_REVIEW',
  textMessage: 'TEXT',
} as const

/**
 * Selects a supported message type under Google's daily notification quota.
 *
 * @param recentNotificationCount - Notifications sent in the prior 24 hours.
 */
export function selectGoogleMessageType(
  recentNotificationCount: number
): 'TEXT' | 'TEXT_AND_NOTIFY' {
  return recentNotificationCount >= 3
    ? googleWalletEnum.textMessage
    : googleWalletEnum.notifyMessage
}
