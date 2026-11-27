'use client'

import { updateSettingsAction } from '@/app/(admin)/admin/actions'
import { Alert } from '@/components/atoms/alert'
import { SubmitButton } from '@/components/atoms/submit-button'
import { FormField } from '@/components/molecules/form-field'
import { TextAreaField } from '@/components/molecules/text-area-field'
import type { AdminSettings } from '@/infrastructure/db/admin-dashboard'
import { useActionState } from 'react'

type SettingsFormProps = {
  settings: AdminSettings
}

/**
 * Edits loyalty goals, messages, and store coordinates.
 *
 * @param props - Persisted settings.
 * @param props.settings - Current settings values.
 */
export function SettingsForm({
  settings,
}: SettingsFormProps): React.JSX.Element {
  const [state, formAction] = useActionState(updateSettingsAction, {})

  return (
    <form
      action={formAction}
      className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 sm:p-7"
    >
      <FormField
        defaultValue={settings.storeName}
        id="storeName"
        label="Nombre de la tienda"
        name="storeName"
        required
      />
      <FormField
        defaultValue={settings.stampsRequired}
        id="stampsRequired"
        label="Sellos para premio"
        max={100}
        min={1}
        name="stampsRequired"
        required
        type="number"
      />
      <TextAreaField
        defaultValue={settings.rewardText}
        id="rewardText"
        label="Texto del premio"
        name="rewardText"
        required
      />
      <TextAreaField
        defaultValue={settings.birthdayPromoText}
        id="birthdayPromoText"
        label="Promoción de cumpleaños"
        name="birthdayPromoText"
        required
      />
      <FormField
        defaultValue={settings.storeLatitude}
        id="storeLatitude"
        label="Latitud"
        name="storeLatitude"
        required
        step="any"
        type="number"
      />
      <FormField
        defaultValue={settings.storeLongitude}
        id="storeLongitude"
        label="Longitud"
        name="storeLongitude"
        required
        step="any"
        type="number"
      />
      <div className="sm:col-span-2">
        <TextAreaField
          defaultValue={settings.storeRelevantText}
          id="storeRelevantText"
          label="Texto relevante cerca de la tienda"
          name="storeRelevantText"
          required
        />
      </div>
      <div className="space-y-3 sm:col-span-2">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}
        <SubmitButton>Guardar configuración</SubmitButton>
      </div>
    </form>
  )
}
