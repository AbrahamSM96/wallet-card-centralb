import { StampStrip } from '@/components/brand/stamp-strip'

type StampStripPreviewProps = {
  goal: number
  stamps: number
}

/**
 * Shows the same Satori-compatible strip component used by both wallets.
 *
 * @param props - Current loyalty progress.
 * @param props.goal - Configured reward goal.
 * @param props.stamps - Current stamp count.
 */
export function StampStripPreview({
  goal,
  stamps,
}: StampStripPreviewProps): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-[344px] overflow-hidden rounded-[20px] shadow-sm">
      <StampStrip goal={goal} height={112} stamps={stamps} width={344} />
    </div>
  )
}
