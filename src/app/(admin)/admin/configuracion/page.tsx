import { SettingsTemplate } from '@/components/templates/settings-template'
import { requireAdmin } from '@/infrastructure/auth/require-admin'
import { getAdminSettings } from '@/infrastructure/db/admin-dashboard'
import { notFound } from 'next/navigation'

/** Renders editable loyalty and store settings. */
export default async function SettingsPage(): Promise<React.JSX.Element> {
  await requireAdmin()
  const settings = await getAdminSettings()
  if (!settings) notFound()
  return <SettingsTemplate settings={settings} />
}
