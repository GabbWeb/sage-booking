# Manual de uso, plataforma de reservas Sage Essence

Guia para la dueña y el equipo de Sage Essence. Explica como funciona el sitio,
como entra una reserva, y como usar el panel de administracion para verlas y
gestionarlas. No se necesita ningun conocimiento tecnico.

Sitio en vivo: **https://thesageessence.com**

---

## 1. Que es la plataforma

Es el sistema de reservas a medida de Sage Essence. Tiene dos partes:

- **La parte publica** (lo que ven los clientes): la pagina principal de marca y
  el formulario de reserva.
- **El panel de administracion** (solo para ustedes): donde ven las reservas que
  van entrando, los clientes y los contactos.

Todo vive en el mismo dominio:

| Direccion | Que es | Quien entra |
| --- | --- | --- |
| `thesageessence.com` | Pagina principal (landing de marca) | Publico |
| `thesageessence.com/booking` | Formulario de reserva | Publico |
| `thesageessence.com/login` | Acceso al panel | Solo ustedes |
| `thesageessence.com/admin` | Panel de administracion | Solo ustedes |

---

## 2. El recorrido del cliente

Asi vive un cliente la experiencia, de principio a fin:

1. **Llega a la pagina principal** y ve la propuesta de marca: limpieza no toxica
   para Austin, beneficios, reseñas, antes y despues.
2. **Calcula su estimacion** en la seccion de presupuesto: elige el tipo de
   limpieza, cuenta recamaras y baños, y la frecuencia. Ve un rango de precio al
   instante.
3. **Deja sus datos** (nombre, email, telefono, codigo postal, sensibilidades) y
   toca "Request this clean".
4. **Pasa al formulario de reserva** ya con todo precargado. Solo le falta
   **elegir fecha y hora**.
5. **Confirma y paga** (si los pagos estan activos, va a la pantalla segura de
   pago). Al terminar ve una pagina de confirmacion.
6. **Recibe los emails automaticos** segun corresponda (ver seccion 5).

Cada reserva que se completa aparece en el panel de inmediato.

---

## 3. Entrar al panel de administracion

1. Abran **https://thesageessence.com/login**
2. Escriban la **contraseña de administracion** (la que definieron con la
   agencia) y confirmen.
3. Entran al panel. Quedan con la sesion iniciada en ese navegador.
4. Para salir, usen **"Sign out"** arriba a la derecha.

Recomendaciones de seguridad:

- No compartan la contraseña por chat ni la dejen anotada a la vista.
- Si entran desde una computadora ajena, cierren sesion al terminar.
- Si quieren cambiar la contraseña, pidanlo a la agencia (es un ajuste rapido).

---

## 4. Usar el panel: las tres secciones

Cuando entran, el panel muestra tres bloques, de arriba hacia abajo.

### 4.1 Bookings (Reservas)

Es la lista de todas las reservas, la mas reciente arriba. De cada una ven:

- **Tipo de limpieza y frecuencia** (por ejemplo "Deep clean, Weekly").
- **Fecha y hora**, o "Date to confirm" si todavia no eligio fecha.
- **Recamaras y baños** (bd, ba).
- **Estado** de la reserva (ver mas abajo).
- **Precio**: el rango estimado, o el monto pagado si ya se cobro.
- **Extras** que pidio el cliente, si los hay.

**Filtrar por estado:** arriba de la lista hay botones para ver solo las
reservas en cierto estado: `all`, `pending`, `confirmed`, `completed`,
`cancelled`. Toquen uno para filtrar; `all` muestra todas.

**Que significa cada estado:**

- **pending** (pendiente): la reserva entro pero todavia no se confirmo el pago.
- **confirmed** (confirmada): el pago se completo. La reserva queda agendada.
- **completed** (completada): el servicio ya se realizo.
- **cancelled** (cancelada): la reserva se anulo.

Los estados se actualizan solos segun el pago. Si necesitan cambiarlos a mano
desde el panel, se puede agregar esa opcion, avisen a la agencia.

**Agregar un cargo extra a una reserva:** dentro de cada reserva hay un campo
para cobrar un adicional (por ejemplo "inside the fridge") con su monto en USD.
Sirve para cobrarle al cliente un servicio extra **usando la tarjeta que ya
dejo**, sin pedirsela de nuevo. Escriban el concepto y el monto, y confirmen.
(Requiere los pagos activos. Ver seccion 5.)

### 4.2 Abandoned leads (Contactos que no terminaron)

Es oro para recuperar ventas. Aca aparecen las personas que **empezaron** una
reserva y **dejaron su contacto**, pero no la terminaron. De cada una ven nombre,
email, telefono y en que paso quedaron.

Que hacer con esto: llamenlos o escribanles para ayudarlos a completar la
reserva. Muchas veces solo les falto un empujon.

### 4.3 Customers (Clientes)

- Muestra **cuantos clientes** hay en total y **cuantos aceptaron** recibir
  comunicaciones de marketing.
- El boton **"Export CSV"** descarga la lista completa de clientes en un archivo
  que se abre con Excel o Google Sheets. Util para campañas de email o respaldo.

---

## 5. Lo que pasa de forma automatica

La plataforma trabaja sola en tres frentes. Segun la etapa de activacion, pueden
estar todos encendidos o irse encendiendo de a poco.

### Pagos (Stripe)
Cuando los pagos estan activos, al reservar el cliente va a una pantalla de pago
segura. El dinero llega a la cuenta de Stripe de Sage Essence. Los cargos extra
del panel tambien salen por aca.

### Calendario (Google Calendar)
Cada reserva confirmada puede crear un evento automatico en el calendario de
Google de Sage Essence, asi el equipo ve la agenda sin copiar nada a mano.

### Emails automaticos (Resend)
El sistema envia correos de marca solos:

- **Preparacion:** apenas se reserva, con que esperar y como dejar el espacio.
- **Recordatorio:** un dia antes del servicio.
- **Agradecimiento:** despues del servicio.

No tienen que hacer nada: se mandan en el momento justo.

---

## 6. Tareas comunes, paso a paso

**Ver las reservas del dia o de la semana**
1. Entren a `/login` y abran el panel.
2. En "Bookings", miren la fecha de cada reserva. Pueden filtrar por `confirmed`
   para ver solo las que ya estan pagas y agendadas.

**Recuperar un cliente que no termino**
1. Vayan a "Abandoned leads".
2. Tomen el telefono o email y contactenlo para cerrar la reserva.

**Cobrar un extra a una reserva existente**
1. En "Bookings", ubiquen la reserva.
2. En su campo de cargo extra, escriban el concepto y el monto en USD, y
   confirmen.

**Descargar la lista de clientes**
1. En "Customers", toquen "Export CSV".
2. Abran el archivo con Excel o Google Sheets.

**Salir del panel**
1. Toquen "Sign out" arriba a la derecha.

---

## 7. Preguntas frecuentes

**No me deja entrar al panel.**
Revisen la contraseña. Si la olvidaron, la agencia la restablece en minutos.

**Una reserva dice "Demo mode" o "saved locally".**
Significa que la base de datos definitiva todavia no esta conectada y la reserva
quedo guardada de forma temporal. Avisen a la agencia para terminar de activar la
base de datos (Supabase).

**El cliente no recibio el email.**
Pidan que revise spam o promociones. Si pasa seguido, avisen a la agencia para
revisar el envio.

**Quiero cambiar un precio, un texto o una foto del sitio.**
Esos cambios los hace la agencia. Mandar el detalle de que quieren cambiar.

**El preview al compartir el link se ve viejo.**
WhatsApp y las redes guardan la imagen un tiempo. Se actualiza solo en unas horas.

---

## 8. Para que las aparezcan en Google (importante)

El sitio ya esta optimizado para buscadores, pero dos pasos los tienen que hacer
ustedes (son gratis) y son los que mas ayudan a aparecer organicamente:

1. **Google Business Profile** (perfil de empresa): es lo numero uno para
   busquedas locales de Austin. Carguen nombre, telefono, zona de servicio,
   fotos y la web `thesageessence.com`. Se hace en business.google.com.
2. **Google Search Console:** verifiquen el dominio y envien el mapa del sitio
   (`thesageessence.com/sitemap.xml`). Acelera que Google las indexe. Se hace en
   search.google.com/search-console.

Si quieren, la agencia las acompaña en estos dos pasos.

---

## 9. Soporte

Ante cualquier duda, error, o cambio que quieran en el sitio, contacten a la
agencia con el detalle. Mientras mas claro el pedido (que pantalla, que querian
hacer, que paso), mas rapido se resuelve.

Sage Essence LLC, Austin TX.
