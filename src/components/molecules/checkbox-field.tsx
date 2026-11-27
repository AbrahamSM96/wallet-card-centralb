import { Checkbox } from '@/components/atoms/checkbox'
import { Label } from '@/components/atoms/label'

type CheckboxFieldProps = {
  description?: string
  id: string
  label: string
  name: string
}

/**
 * Pairs a checkbox with its label and optional explanation.
 *
 * @param props - Checkbox field content.
 * @param props.description - Supporting text.
 * @param props.id - Checkbox identifier.
 * @param props.label - Visible checkbox label.
 * @param props.name - Submitted field name.
 */
export function CheckboxField({
  description,
  id,
  label,
  name,
}: CheckboxFieldProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} name={name} />
      <div>
        <Label htmlFor={id}>{label}</Label>
        {description ? (
          <p className="mt-1 text-xs text-stone-600">{description}</p>
        ) : null}
      </div>
    </div>
  )
}
