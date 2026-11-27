import { BrandMark } from '@/components/atoms/brand-mark'

/** Renders the Central Brownies LFPDPPP privacy notice draft. */
export function PrivacyNoticeTemplate(): React.JSX.Element {
  return (
    <main className="bg-crema px-5 py-10 text-chocolate">
      <article className="mx-auto max-w-3xl rounded-[24px] border border-cacao/20 bg-white p-6 sm:p-10">
        <BrandMark />
        <h1 className="mt-6 text-3xl font-semibold">Aviso de privacidad</h1>
        <p className="mt-4 text-sm text-cacao">
          Última actualización: 26 de noviembre de 2026.
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Responsable</h2>
          <p>
            <strong>[COMPLETAR: nombre legal de la persona responsable]</strong>
            , responsable del tratamiento de sus datos personales para Central
            Brownies, con domicilio en Av. Benito Juárez s/n, Constitución,
            42060 Pachuca de Soto, Hgo.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Datos recabados</h2>
          <p>
            Recabamos nombre, correo electrónico, número celular, fecha de
            nacimiento, aceptación de este aviso, información de la tarjeta de
            lealtad, sellos, canjes y relaciones de referido. Los proveedores de
            wallet pueden procesar identificadores técnicos necesarios para
            instalar y actualizar el pase.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Finalidades</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Administrar el programa de lealtad, sellos y premios.</li>
            <li>Emitir y actualizar la tarjeta en Apple o Google Wallet.</li>
            <li>Enviar promociones relacionadas con su cumpleaños.</li>
            <li>Gestionar invitaciones y beneficios por referidos.</li>
            <li>Atender aclaraciones sobre su cuenta y tarjeta.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Transferencias y encargados</h2>
          <p>
            Los datos podrán ser tratados por proveedores tecnológicos que
            prestan servicios de hospedaje, base de datos y wallets digitales,
            únicamente para operar las finalidades descritas y conforme a sus
            términos aplicables. No vendemos sus datos personales.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Derechos ARCO</h2>
          <p>
            Puede solicitar acceso, rectificación, cancelación u oposición al
            tratamiento de sus datos, así como revocar su consentimiento,
            escribiendo a <strong>[COMPLETAR: correo de contacto ARCO]</strong>.
            La solicitud deberá incluir nombre, medio de respuesta, descripción
            del derecho que desea ejercer y elementos que permitan localizar sus
            datos.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Cambios al aviso</h2>
          <p>
            Las modificaciones a este aviso se publicarán en esta misma página.
            Para dudas, escriba a{' '}
            <strong>[COMPLETAR: correo general de contacto]</strong>.
          </p>
        </section>
      </article>
    </main>
  )
}
