import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'

type CustomerSearchProps = {
  defaultValue: string
}

/**
 * Searches by customer identity or public card code with a GET form.
 *
 * @param props - Current search state.
 * @param props.defaultValue - Query shown in the input.
 */
export function CustomerSearch({
  defaultValue,
}: CustomerSearchProps): React.JSX.Element {
  return (
    <form className="flex gap-2" method="get">
      <Input
        aria-label="Buscar clientes"
        className="h-11 flex-1"
        defaultValue={defaultValue}
        name="q"
        placeholder="Nombre, teléfono o CB-XXXX"
        type="search"
      />
      <Button className="h-11" type="submit">
        Buscar
      </Button>
    </form>
  )
}
