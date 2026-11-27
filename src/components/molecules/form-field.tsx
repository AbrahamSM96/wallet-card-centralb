import { Input, type InputProps } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'

type FormFieldProps = Omit<InputProps, 'id'> & {
  id: string
  label: string
}

/**
 * Pairs an accessible label with a branded form input.
 *
 * @param props - Field properties.
 * @param props.id - Identifier shared by the label and input.
 * @param props.label - Visible field label.
 */
export function FormField({
  id,
  label,
  ...inputProps
}: FormFieldProps): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...inputProps} />
    </div>
  )
}
