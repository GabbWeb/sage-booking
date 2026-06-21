import { buildEmail, EMAIL_TYPES } from "@/lib/emails/templates";
import type { EmailData } from "@/lib/emails/types";

// Indice de preview de los 3 emails. Muestra el asunto y un render real de cada
// plantilla en un iframe. Pagina de desarrollo, no enlazada desde el sitio.

const SAMPLE: EmailData = {
  firstName: "Jane",
  serviceLabel: "Deep clean",
  scheduledDateText: "Tuesday, June 24 at 10:00 AM",
  reviewUrl: "https://g.page/r/sage-essence/review",
};

const LABELS: Record<string, string> = {
  prep: "Email 1, immediate: how to prepare",
  reminder_2days: "Email 2, two days before: reminder",
  thankyou: "Email 3, after the clean: thank you and review",
};

export default function EmailPreviewIndex() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence, dev
        </p>
        <h1 className="mt-2 text-4xl text-ink">Email previews</h1>
        <p className="mt-3 text-sm leading-relaxed text-sage-deep">
          Sample renders of the three automated emails. These do not send
          anything. Final wiring happens in Phase 4 with Resend.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {EMAIL_TYPES.map((type) => {
          const email = buildEmail(type, SAMPLE);
          return (
            <section key={type}>
              <h2 className="text-xl text-ink">{LABELS[type]}</h2>
              <p className="mt-1 text-sm text-sage-deep">
                Subject: <span className="text-ink">{email.subject}</span>
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-sage/30">
                <iframe
                  title={`${type} preview`}
                  src={`/dev/emails/${type}`}
                  className="h-[640px] w-full bg-white"
                />
              </div>
              <a
                href={`/dev/emails/${type}`}
                className="mt-2 inline-block text-sm uppercase tracking-widest text-sage-deep hover:text-ink"
              >
                Open full size
              </a>
            </section>
          );
        })}
      </div>
    </main>
  );
}
