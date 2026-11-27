import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { StampStrip } from '@/components/brand/stamp-strip'
import { ImageResponse } from 'next/og'

const nunitoExtraBold = readFileSync(
  join(process.cwd(), 'public', 'brand', 'nunito-800.ttf')
)

/**
 * Creates the canonical ImageResponse used by HTTP and Apple package renders.
 *
 * @param stamps - Current stamp count.
 * @param goal - Configured reward goal.
 * @param width - Output width in pixels.
 * @param height - Output height in pixels.
 */
export function createStampStripImage(
  stamps: number,
  goal: number,
  width: number,
  height: number
): ImageResponse {
  return new ImageResponse(
    <StampStrip goal={goal} height={height} stamps={stamps} width={width} />,
    {
      fonts: [
        {
          data: nunitoExtraBold,
          name: 'Nunito',
          style: 'normal',
          weight: 800,
        },
      ],
      height,
      width,
    }
  )
}

/**
 * Renders the shared Satori strip to PNG bytes for HTTP and Apple packages.
 *
 * @param stamps - Current stamp count.
 * @param goal - Configured reward goal.
 * @param width - Output width in pixels.
 * @param height - Output height in pixels.
 */
export async function renderStampStripPng(
  stamps: number,
  goal: number,
  width: number,
  height: number
): Promise<Buffer> {
  const response = createStampStripImage(stamps, goal, width, height)
  return Buffer.from(await response.arrayBuffer())
}
