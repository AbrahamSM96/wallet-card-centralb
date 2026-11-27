import type { ReactNode } from 'react'

type PageHeaderProps = {
  action?: ReactNode
  description: string
  eyebrow?: string
  title: string
}

/**
 * Renders a consistent mobile-first page heading.
 *
 * @param props - Heading content and optional action.
 * @param props.action - Primary page action.
 * @param props.description - Supporting text.
 * @param props.eyebrow - Optional section label.
 * @param props.title - Page title.
 */
export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm font-semibold text-cacao">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-cacao sm:text-base">
          {description}
        </p>
      </div>
      {action}
    </header>
  )
}
