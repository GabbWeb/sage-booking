// Datos que necesitan las plantillas de email. Se arman desde una reserva +
// su cliente. Mantener plano y serializable.

export type EmailType = "prep" | "reminder_2days" | "thankyou";

export type EmailData = {
  firstName: string;
  serviceLabel: string; // "Deep clean", etc.
  scheduledDateText?: string; // ej. "Tuesday, June 24 at 10:00 AM"
  estimateLow?: number;
  estimateHigh?: number;
  reviewUrl?: string; // link a la resena de Google (Fase 4)
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};
