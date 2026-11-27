import { Label } from '@/components/atoms/label'
import { Textarea, type TextareaProps } from '@/components/atoms/textarea'

type TextAreaFieldProps = Omit<TextareaProps, 'id'> & {
  id: string
  label: string
}

/**
 * Pairs an accessible label with a branded textarea.
 *
 * @param props - Field properties.
 * @param props.id - Identifier shared by label and textarea.
 * @param props.label - Visible field label.
 */
export function TextAreaField({
  id,
  label,
  ...textareaProps
}: TextAreaFieldProps): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} {...textareaProps} />
    </div>
  )
}
