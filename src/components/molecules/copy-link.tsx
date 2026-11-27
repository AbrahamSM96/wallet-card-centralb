'use client'

import { Button } from '@/components/atoms/button'
import { useState } from 'react'

type CopyLinkProps = {
  value: string
}

/**
 * Copies a one-time claim URL to the clipboard.
 *
 * @param props - Claim URL value.
 * @param props.value - URL to copy.
 */
export function CopyLink({ value }: CopyLinkProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  /** Copies the URL and updates transient feedback. */
  async function copy(): Promise<void> {
    await navigator.clipboard.writeText(value)
    setCopied(true)
  }

  /** Starts the asynchronous clipboard operation from a void event handler. */
  function handleCopy(): void {
    void copy()
  }

  return (
    <Button type="button" variant="outline" onClick={handleCopy}>
      {copied ? 'Copiado' : 'Copiar link'}
    </Button>
  )
}
