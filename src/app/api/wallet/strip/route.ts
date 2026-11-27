import { stampStripSearchParamsSchema } from '@/domain/loyalty/stamp-strip-params'
import { createStampStripImage } from '@/infrastructure/wallet/stamp-strip-image'

export const runtime = 'nodejs'

/**
 * Returns the immutable Google-sized loyalty stamp strip.
 *
 * @param request - Public strip image request.
 */
export function GET(request: Request): Response {
  const url = new URL(request.url)
  const parsed = stampStripSearchParamsSchema.safeParse({
    goal: url.searchParams.get('goal'),
    stamps: url.searchParams.get('stamps'),
  })
  if (!parsed.success) {
    return Response.json({ error: 'Invalid strip parameters' }, { status: 400 })
  }

  const response = createStampStripImage(
    parsed.data.stamps,
    parsed.data.goal,
    1032,
    336
  )
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return response
}
