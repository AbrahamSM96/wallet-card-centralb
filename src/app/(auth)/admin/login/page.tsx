import { LoginForm } from '@/components/organisms/login-form'
import { PublicShell } from '@/components/templates/public-shell'

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}

/**
 * Renders the public administrator login page.
 *
 * @param props - Route properties supplied by Next.js.
 * @param props.searchParams - Asynchronously resolved query parameters.
 */
export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.JSX.Element> {
  const { error: errorCode } = await searchParams
  const error = loginErrorMessage(errorCode)

  return (
    <PublicShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold">Panel de administración</h1>
        <p className="mt-2 text-sm text-stone-600">
          Ingresa tus credenciales para continuar.
        </p>
      </div>
      <LoginForm error={error} />
    </PublicShell>
  )
}

/**
 * Maps trusted login error codes to user-facing Spanish text.
 *
 * @param code - Error code received from the login route.
 */
function loginErrorMessage(code: string | undefined): string | undefined {
  if (code === 'invalid') return 'Correo o contraseña incorrectos.'
  if (code === 'rate_limited') {
    return 'Demasiados intentos. Intenta más tarde.'
  }
  return undefined
}
