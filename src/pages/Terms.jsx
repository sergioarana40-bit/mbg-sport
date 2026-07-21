import { FileText, MapPin, Mail, Phone } from 'lucide-react'

// Términos y condiciones del servicio de mantenimiento (documento del cliente).
const SECTIONS = [
  {
    title: '1. Evaluación y cotización',
    paragraphs: [
      'Para poder brindar una cotización adecuada del servicio de mantenimiento preventivo o correctivo, es indispensable realizar previamente una revisión técnica de los equipos, la cual tiene un costo.',
      'Los precios de mano de obra cotizados tienen una vigencia de 5 días naturales a partir de la fecha de emisión de la cotización.',
      'Los precios de refacciones están sujetos a cambio sin previo aviso. Por esta razón, es estrictamente necesario confirmar la cotización actualizada antes de realizar cualquier pago. Pagos realizados sin confirmación pueden no reflejar el costo real al momento del pedido y podrían requerir ajustes adicionales.',
    ],
  },
  {
    title: '2. Pagos y condiciones comerciales',
    paragraphs: [
      'No se ofrece crédito para servicios ni refacciones. Todos los pagos deberán realizarse conforme a las condiciones indicadas.',
      'El costo correspondiente a la mano de obra deberá ser liquidado en su totalidad una vez concluido el servicio, sin excepción.',
      'En caso de requerirse refacciones para llevar a cabo la reparación, éstas deberán pagarse en su totalidad al momento de realizar el pedido.',
    ],
  },
  {
    title: '3. Refacciones',
    paragraphs: [
      'El tiempo estimado de entrega de las refacciones es el que se especifique en la cotización una vez realizado el pago, y está sujeto a disponibilidad del proveedor e incidentes que puedan afectar al envío de las mismas.',
      'En caso de necesitar únicamente las refacciones, estas se entregarán en alguna de nuestras sucursales (Toluca, Zinacantepec) dentro del horario comercial.',
      'No se aceptan cambios ni devoluciones en refacciones, ya que se solicitan específicamente para cada equipo y cliente.',
    ],
  },
  {
    title: '4. Garantía y funcionamiento',
    paragraphs: [
      'No se otorga garantía sobre los servicios ni refacciones, debido a que el uso de los equipos varía considerablemente entre usuarios; el mal uso puede provocar daños prematuros ajenos a nuestro control, así como reparaciones o intervenciones realizadas por personal ajeno a nuestra empresa.',
      'Una vez finalizado el servicio, se confirmará el funcionamiento correcto de los equipos atendidos, en presencia del cliente o del personal responsable. Cualquier falla posterior será evaluada como un nuevo servicio.',
      'Se considera funcionamiento correcto cuando el equipo puede hacer uso de las funciones sin ruidos o vibraciones excesivas que impidan el uso normal del mismo.',
      'El desgaste normal de los equipos puede provocar ligeros daños a plásticos y partes de hule al ser manipulados; esto no afectaría el funcionamiento y se considera desgaste normal por tiempo, especialmente en equipos de gimnasio o aquellos expuestos a condiciones atmosféricas.',
      'Debido al desgaste normal de los equipos, es normal que existan ruidos ya sea por vibraciones u holguras en las piezas móviles generadas por el desgaste normal del equipo, y no afectan su funcionamiento.',
    ],
  },
]

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600/15 text-brand-500">
          <FileText className="h-6 w-6" strokeWidth={1.7} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Términos y condiciones
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Servicio de mantenimiento de equipos de gimnasio
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-fg-muted">
        A continuación, se detallan los términos y condiciones aplicables a los servicios de
        mantenimiento preventivo y/o correctivo ofrecidos por nuestro equipo técnico:
      </p>

      <div className="mt-6 space-y-5">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <h2 className="font-display text-lg font-bold text-fg">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((text, i) => (
                <p key={i} className="text-sm leading-relaxed text-fg-muted">
                  {text}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 rounded-2xl border border-brand-600/30 bg-brand-600/10 p-5 text-sm font-semibold leading-relaxed text-fg">
        Al contratar nuestros servicios, el cliente declara haber leído y aceptado los términos y
        condiciones aquí expuestos.
      </p>

      <div className="mt-10 border-t border-line pt-6 text-center">
        <p className="font-display text-lg font-bold uppercase tracking-wide text-fg">
          ¡Gracias por su preferencia!
        </p>
        <ul className="mx-auto mt-4 inline-flex flex-col items-center gap-2 text-sm text-fg-muted">
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
            Aztecas #203, Plaza Zamarrero, Zinacantepec
          </li>
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-brand-500" />
            <a
              href="mailto:mbgmantenimiento.gym@gmail.com"
              className="transition hover:text-fg"
            >
              mbgmantenimiento.gym@gmail.com
            </a>
          </li>
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-brand-500" />
            <a href="tel:7227910584" className="transition hover:text-fg">
              722 791 0584
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
