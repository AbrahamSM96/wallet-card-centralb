import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import sharp from 'sharp'

const sourcePath = join(process.cwd(), 'public', 'brand', 'logo-original.png')
const outputDirectory = join(process.cwd(), 'public', 'brand')

if (!existsSync(sourcePath)) {
  process.stderr.write(
    'Missing public/brand/logo-original.png. Add the original brand logo, then run bun run brand:assets.\n'
  )
  process.exit(1)
}

await mkdir(outputDirectory, { recursive: true })

const googleLogo = await createCircle(660)
await writeFile(join(outputDirectory, 'google-logo.png'), googleLogo)

for (const [name, size] of [
  ['apple-icon.png', 29],
  ['apple-icon@2x.png', 58],
  ['apple-icon@3x.png', 87],
  ['favicon.png', 32],
  ['apple-touch-icon.png', 180],
] as const) {
  await writeFile(join(outputDirectory, name), await createCircle(size))
}

for (const [name, width, height] of [
  ['apple-logo.png', 160, 50],
  ['apple-logo@2x.png', 320, 100],
  ['apple-logo@3x.png', 480, 150],
] as const) {
  const circle = await createCircle(height)
  const canvas = await sharp({
    create: {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      channels: 4,
      height,
      width,
    },
  })
    .composite([{ input: circle, left: 0, top: 0 }])
    .png()
    .toBuffer()
  await writeFile(join(outputDirectory, name), canvas)
}

process.stdout.write('Brand assets generated in public/brand/.\n')

/**
 * Creates a circular masked logo with a two-percent white outer ring.
 *
 * @param size - Square output size in pixels.
 */
async function createCircle(size: number): Promise<Buffer> {
  const ringWidth = Math.max(1, Math.round(size * 0.02))
  const inset = ringWidth
  const innerSize = size - inset * 2
  const circleMask = Buffer.from(
    `<svg width="${innerSize}" height="${innerSize}"><circle cx="${innerSize / 2}" cy="${innerSize / 2}" r="${innerSize / 2}" fill="white"/></svg>`
  )
  const maskedLogo = await sharp(sourcePath)
    .resize(innerSize, innerSize, { fit: 'cover', position: 'center' })
    .composite([{ blend: 'dest-in', input: circleMask }])
    .png()
    .toBuffer()
  const ring = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${(size - ringWidth) / 2}" fill="none" stroke="white" stroke-width="${ringWidth}"/></svg>`
  )
  return sharp({
    create: {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      channels: 4,
      height: size,
      width: size,
    },
  })
    .composite([
      { input: maskedLogo, left: inset, top: inset },
      { input: ring, left: 0, top: 0 },
    ])
    .png()
    .toBuffer()
}
