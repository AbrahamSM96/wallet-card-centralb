import type { CSSProperties } from 'react'

type StampDotProps = {
  filled: boolean
  isPrize: boolean
  position: number
  scale: number
  size: number
}

/**
 * Renders one pending, filled, or prize stamp for the shared strip.
 *
 * @param props - Stamp position and target scale.
 * @param props.filled - Whether the position has been earned.
 * @param props.isPrize - Whether this is the final reward position.
 * @param props.position - One-based position number.
 * @param props.scale - Scale relative to Google hero dimensions.
 * @param props.size - Circle diameter in pixels.
 */
export function StampDot({
  filled,
  isPrize,
  position,
  scale,
  size,
}: StampDotProps): React.JSX.Element {
  const baseStyle: CSSProperties = {
    alignItems: 'center',
    borderRadius: 999,
    display: 'flex',
    height: size,
    justifyContent: 'center',
    position: 'relative',
    width: size,
  }

  if (isPrize) {
    return (
      <div
        style={{
          ...baseStyle,
          background: '#C8894B',
          boxShadow: filled
            ? `0 0 0 ${4 * scale}px rgba(200,137,75,.35)`
            : 'none',
        }}
      >
        <div
          style={{
            border: `${4 * scale}px solid #141110`,
            borderRadius: 6 * scale,
            display: 'flex',
            height: size * 0.43,
            position: 'relative',
            width: size * 0.5,
          }}
        >
          <div
            style={{
              background: '#141110',
              height: size * 0.06,
              left: -4 * scale,
              position: 'absolute',
              top: size * 0.1,
              width: size * 0.5,
            }}
          />
          <div
            style={{
              background: '#141110',
              height: size * 0.43,
              left: size * 0.21,
              position: 'absolute',
              top: -4 * scale,
              width: 4 * scale,
            }}
          />
          {[-1, 1].map((direction) => (
            <div
              key={direction}
              style={{
                border: `${3 * scale}px solid #141110`,
                borderRadius: 999,
                height: size * 0.16,
                position: 'absolute',
                top: -size * 0.18,
                transform: `rotate(${direction * -28}deg)`,
                width: size * 0.18,
                ...(direction < 0
                  ? { left: size * 0.07 }
                  : { right: size * 0.07 }),
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (filled) {
    const points = [
      [0.2, 0.2, '#FFFFFF', 5],
      [0.7, 0.27, '#FFFFFF', 5],
      [0.64, 0.68, '#FFFFFF', 5],
      [0.27, 0.72, '#F6EBDD', 7],
      [0.75, 0.57, '#F6EBDD', 7],
    ] as const
    const cracks = [
      [0.1, 0.05, 25],
      [0.2, 0.1, -30],
      [0.29, 0.06, 32],
    ] as const
    return (
      <div style={{ ...baseStyle, background: '#141110' }}>
        <div
          style={{
            background: '#6E4330',
            borderRadius: 8 * scale,
            display: 'flex',
            height: size * 0.34,
            position: 'relative',
            width: size * 0.48,
          }}
        >
          <div
            style={{
              background: '#4A2C21',
              borderRadius: `${8 * scale}px ${8 * scale}px ${3 * scale}px ${3 * scale}px`,
              height: size * 0.11,
              left: 0,
              position: 'absolute',
              top: 0,
              width: size * 0.48,
            }}
          />
          {cracks.map(([left, top, rotation]) => (
            <div
              key={`${left}-${rotation}`}
              style={{
                background: '#E0A566',
                borderRadius: 999,
                height: 2 * scale,
                left: size * left,
                position: 'absolute',
                top: size * top,
                transform: `rotate(${rotation}deg)`,
                width: size * 0.13,
              }}
            />
          ))}
        </div>
        {points.map(([left, top, color, pointSize]) => (
          <div
            key={`${left}-${top}`}
            style={{
              background: color,
              borderRadius: 999,
              height: pointSize * scale,
              left: size * left,
              position: 'absolute',
              top: size * top,
              width: pointSize * scale,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        ...baseStyle,
        border: `${2 * scale}px dashed #B49C86`,
        color: '#6E5A4A',
        fontFamily: 'Nunito, sans-serif',
        fontSize: 38 * scale,
        fontWeight: 800,
      }}
    >
      {position}
    </div>
  )
}
