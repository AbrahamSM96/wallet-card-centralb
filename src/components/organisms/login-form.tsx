import { Button } from '@/components/atoms/button'
import { FormField } from '@/components/molecules/form-field'

type LoginFormProps = {
  error?: string
}

/**
 * Renders the admin credential form.
 *
 * @param props - Form state rendered for the visitor.
 * @param props.error - Optional authentication error.
 */
export function LoginForm({ error }: LoginFormProps): React.JSX.Element {
  return (
    <form
      action="/api/auth/login"
      className="space-y-5 rounded-[24px] border border-cacao/20 bg-white p-8 shadow-sm"
      method="post"
    >
      <FormField
        autoComplete="email"
        id="email"
        label="Correo"
        name="email"
        required
        type="email"
      />
      <FormField
        autoComplete="current-password"
        id="password"
        label="Contraseña"
        name="password"
        required
        type="password"
      />
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="w-full rounded-lg bg-noche px-4 py-2.5 font-medium text-white hover:bg-chocolate"
        type="submit"
      >
        Entrar
      </Button>
    </form>
  )
}
