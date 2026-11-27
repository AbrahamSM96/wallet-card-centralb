import { redirect } from 'next/navigation'

/** Redirects the application root to the admin panel. */
export default function HomePage(): never {
  redirect('/admin')
}
