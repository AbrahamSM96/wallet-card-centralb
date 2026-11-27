import { siteConfig } from '@/config/site'
import Image from 'next/image'

/** Renders the compact Central Brownies wordmark. */
export function BrandMark(): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 font-extrabold tracking-tight text-chocolate">
      <Image
        alt=""
        className="rounded-full bg-noche"
        height={38}
        src="/brand/google-logo.png"
        width={38}
      />
      {siteConfig.name}
    </span>
  )
}
