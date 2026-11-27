import { StampDot } from '@/components/brand/stamp-dot'

export type StampStripProps = {
  goal: number
  height: number
  stamps: number
  width: number
}

/**
 * Renders the deterministic loyalty strip for Satori and the web preview.
 *
 * @param props - Stamp state and target dimensions.
 * @param props.goal - Configured reward goal.
 * @param props.height - Target image height.
 * @param props.stamps - Current stamp count.
 * @param props.width - Target image width.
 */
export function StampStrip({
  goal,
  height,
  stamps,
  width,
}: StampStripProps): React.JSX.Element {
  const columns = Math.ceil(goal / 2)
  const rows = [
    Array.from({ length: Math.min(columns, goal) }, (_, index) => index + 1),
    Array.from(
      { length: Math.max(0, goal - columns) },
      (_, index) => columns + index + 1
    ),
  ]
  const scale = height / 336
  const gap = 24 * scale
  const availableWidth = width - 140 * scale - gap * (columns - 1)
  const stampSize = Math.min(112 * scale, availableWidth / columns)
  const cornerPoints = [
    [24, 25, 8],
    [52, 46, 5],
    [80, 18, 4],
    [950, 28, 8],
    [985, 58, 5],
    [920, 315, 7],
    [42, 304, 6],
  ]

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#F6EBDD',
        display: 'flex',
        flexDirection: 'column',
        height,
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        width,
      }}
    >
      <div
        style={{
          bottom: 0,
          display: 'flex',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      >
        {cornerPoints.map(([left, top, size]) => (
          <div
            key={`${left}-${top}`}
            style={{
              background: 'rgba(20,17,16,.12)',
              borderRadius: 999,
              height: size * scale,
              left: left * scale,
              position: 'absolute',
              top: top * scale,
              width: size * scale,
            }}
          />
        ))}
      </div>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 18 * scale,
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {rows.map((row) => (
          <div
            key={`row-${row[0] ?? 'empty'}`}
            style={{
              display: 'flex',
              gap,
              justifyContent: 'center',
            }}
          >
            {row.map((position) => (
              <StampDot
                filled={position <= Math.min(stamps, goal)}
                isPrize={position === goal}
                key={position}
                position={position}
                scale={scale}
                size={stampSize}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
