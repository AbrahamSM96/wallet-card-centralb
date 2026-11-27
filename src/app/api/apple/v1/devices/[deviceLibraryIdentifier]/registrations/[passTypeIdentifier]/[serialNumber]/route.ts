import { loyaltyService } from '@/infrastructure/loyalty-service'
import { getAppleWalletConfig } from '@/infrastructure/wallet/apple/apple-wallet-config'
import {
  appleUnauthorizedResponse,
  isApplePassAuthorized,
} from '@/infrastructure/wallet/apple/apple-web-service-auth'
import {
  getApplePassRecord,
  removeAppleRegistration,
} from '@/infrastructure/wallet/apple/apple-web-service-repository'
import { z } from 'zod'

const pathSchema = z.object({
  deviceLibraryIdentifier: z.string().min(1).max(256),
  passTypeIdentifier: z.string().min(1).max(256),
  serialNumber: z.uuid(),
})

const registrationSchema = z.object({
  pushToken: z.string().min(1).max(512),
})

type RegistrationRouteContext = {
  params: Promise<{
    deviceLibraryIdentifier: string
    passTypeIdentifier: string
    serialNumber: string
  }>
}

/**
 * Registers an Apple device for pass updates.
 *
 * @param request - Wallet registration request.
 * @param context - Dynamic Apple registration route values.
 */
export async function POST(
  request: Request,
  context: RegistrationRouteContext
): Promise<Response> {
  const parsedPath = pathSchema.safeParse(await context.params)
  const parsedBody = registrationSchema.safeParse(await request.json())
  if (!parsedPath.success || !parsedBody.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const config = getAppleWalletConfig()
  if (parsedPath.data.passTypeIdentifier !== config.passTypeIdentifier) {
    return new Response(null, { status: 404 })
  }
  const card = await getApplePassRecord(parsedPath.data.serialNumber)
  if (!card) return new Response(null, { status: 404 })
  if (
    !isApplePassAuthorized(
      request.headers.get('authorization'),
      card.appleAuthToken
    )
  ) {
    return appleUnauthorizedResponse()
  }

  const result = await loyaltyService.registerAppleDevice({
    cardId: card.id,
    deviceLibraryId: parsedPath.data.deviceLibraryIdentifier,
    pushToken: parsedBody.data.pushToken,
  })
  return new Response(null, { status: result.created ? 201 : 200 })
}

/**
 * Unregisters an Apple device from pass updates.
 *
 * @param request - Wallet unregistration request.
 * @param context - Dynamic Apple registration route values.
 */
export async function DELETE(
  request: Request,
  context: RegistrationRouteContext
): Promise<Response> {
  const parsedPath = pathSchema.safeParse(await context.params)
  if (!parsedPath.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const config = getAppleWalletConfig()
  if (parsedPath.data.passTypeIdentifier !== config.passTypeIdentifier) {
    return new Response(null, { status: 404 })
  }
  const card = await getApplePassRecord(parsedPath.data.serialNumber)
  if (!card) return new Response(null, { status: 404 })
  if (
    !isApplePassAuthorized(
      request.headers.get('authorization'),
      card.appleAuthToken
    )
  ) {
    return appleUnauthorizedResponse()
  }

  await removeAppleRegistration(
    card.id,
    parsedPath.data.deviceLibraryIdentifier
  )
  return new Response(null, { status: 200 })
}
