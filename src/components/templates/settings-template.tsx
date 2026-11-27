import { PageHeader } from '@/components/molecules/page-header'
import { SettingsForm } from '@/components/organisms/settings-form'
import type { AdminSettings } from '@/infrastructure/db/admin-dashboard'

type SettingsTemplateProps = {
  settings: AdminSettings
}

/**
 * Composes editable loyalty and store settings.
 *
 * @param props - Persisted settings.
 * @param props.settings - Settings values.
 */
export function SettingsTemplate({
  settings,
}: SettingsTemplateProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Actualiza meta, textos promocionales y ubicación de la tienda."
        title="Configuración"
      />
      <SettingsForm settings={settings} />
    </div>
  )
}
