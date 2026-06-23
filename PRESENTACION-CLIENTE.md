# Sage Essence, Sistema de Reservas a Medida

Documento de presentación para Katerina y Felipe. Resumen de lo entregado.

---

## Qué es

Un sistema de reservas **propio de Sage Essence**, hecho a medida, que reemplaza
el botón "Request this clean" de la web por un flujo de reserva real: el cliente
reserva, paga, y queda todo agendado y automatizado.

No depende de plataformas tipo Booking Koala: **no hay mensualidad atada a una
plataforma**, y todo (código, base de datos, cuentas) es propiedad de Sage.

**Está en vivo y funcionando hoy:** https://sage-booking.vercel.app

---

## Lo que hace (punto por punto)

### 1. Reserva online con precio al instante
El cliente elige tipo de limpieza, frecuencia, tamaño de la casa y extras, y ve
un **estimado de precio en vivo**, con descuentos por frecuencia (semanal 20%,
quincenal 15%, mensual 10%). Después carga sus datos y elige día y horario.

### 2. Pago con tarjeta al reservar, y cargo extra después
- Cobra con tarjeta al momento de reservar (procesado por Stripe, seguro).
- **Guarda la tarjeta** para poder hacer un **cargo adicional después**, si la
  limpieza requirió un extra. Esto se hace con un botón desde el panel.

### 3. Agenda automática en Google Calendar
Cada reserva confirmada crea un evento en el **calendario de Sage**, con el
servicio, el cliente, la fecha, y las notas (alergias, extras, contacto).

### 4. Tres emails automáticos
- **Al reservar:** "cómo preparar tu casa" + checklist e instrucciones.
- **2 días antes:** recordatorio.
- **Después de la limpieza:** agradecimiento y pedido de reseña.
Todos con la estética de marca, en inglés, enviados desde
`hello@thesageessence.com`.

### 5. Base de clientes para marketing
Cada reserva guarda al cliente en una base con consentimiento de marketing
(opt-in). Se puede **exportar a CSV** desde el panel para campañas futuras.

### 6. Captura de clientes que no terminan
Si alguien empieza la reserva, deja sus datos y no la termina, el sistema
guarda el lead y **le avisa a Sage por email** para seguimiento manual.

### 7. Panel de administración
Katerina y Felipe entran con contraseña y ven: todas las reservas (filtrables
por estado), botón de cargo extra, lista de clientes que no terminaron, y
export de clientes para marketing.

---

## La marca

Respeta la identidad de Sage Essence: paleta Apothecary, tipografías Cormorant
Garamond y Jost, sin emojis ni guiones largos. Se ve prolijo en celular y
computadora.

---

## Estado actual

| Función | Estado |
|---|---|
| Reservas online | Funcionando |
| Pagos con tarjeta | Funcionando (modo prueba, listo para activar cobros reales) |
| Cargo extra después | Funcionando |
| Google Calendar | Funcionando |
| Emails automáticos | Funcionando (envío real) |
| Base de clientes + export | Funcionando |
| Captura de leads | Funcionando |
| Panel de administración | Funcionando |

El sistema está **publicado y probado de punta a punta**. Los pagos están en
modo de prueba (con tarjetas de testeo) hasta dar el OK para activar cobros
reales: es un cambio de un minuto.

---

## Lo que falta para abrir al público

1. **Activar cobros reales:** pasar Stripe de modo prueba a modo real (cuando
   Sage confirme que el flujo está como lo quiere).
2. **Ajustar los precios:** hoy el cálculo usa valores de referencia; se ajustan
   a la tabla exacta del estimador actual de la web.
3. **Revisar textos y emails:** dar el visto bueno a los mensajes.

---

## Propiedad (cláusula del contrato)

Todo el sistema es de Sage Essence: el código, la base de datos y la
infraestructura. Las cuentas (Supabase, Stripe, Google, Resend, Vercel) se
dejan a nombre de Sage. Sin ataduras a la agencia ni a plataformas de terceros.
