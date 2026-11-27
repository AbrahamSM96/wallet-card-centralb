'use client'

import { Button } from '@/components/atoms/button'
import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

type SubmitButtonProps = {
  children: ReactNode
  disabled?: boolean
  pendingLabel?: string
  variant?: 'default' | 'ghost' | 'outline'
}

/**
 * Disables a form submit button while its action is pending.
 *
 * @param props - Button labels and variant.
 * @param props.children - Idle label.
 * @param props.disabled - Whether submission is unavailable.
 * @param props.pendingLabel - Label displayed during submission.
 * @param props.variant - shadcn button variant.
 */
export function SubmitButton({
  children,
  disabled = false,
  pendingLabel = 'Guardando…',
  variant = 'default',
}: SubmitButtonProps): React.JSX.Element {
  const { pending } = useFormStatus()
  return (
    <Button disabled={disabled || pending} type="submit" variant={variant}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
