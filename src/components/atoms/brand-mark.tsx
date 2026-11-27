import { siteConfig } from '@/config/site'

/** Renders the compact Central Brownies wordmark. */
export function BrandMark(): React.JSX.Element {
  return (
    <span className="font-semibold tracking-tight text-stone-900">
      {siteConfig.name}
    </span>
  )
}
