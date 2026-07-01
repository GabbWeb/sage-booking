import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Sage Essence",
  description:
    "How Sage Essence LLC collects, uses, and protects your information, including text message consent.",
  alternates: { canonical: "/privacy" },
};

// Fecha de vigencia. Actualizar si cambia la politica.
const EFFECTIVE = "June 30, 2026";

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl text-ink">{heading}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-sage-deep">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence
        </p>
        <h1 className="mt-3 text-5xl leading-tight text-ink">Privacy Policy</h1>
        <p className="mt-3 text-sm uppercase tracking-widest text-sage">
          Effective {EFFECTIVE}
        </p>
      </header>

      <div className="mt-10">
        <p className="text-[15px] leading-relaxed text-sage-deep">
          Sage Essence LLC (&quot;Sage Essence,&quot; &quot;we,&quot;
          &quot;us&quot;) provides non-toxic home cleaning services in Austin,
          Texas. This policy explains what information we collect, how we use it,
          and the choices you have.
        </p>

        <Section heading="Information we collect">
          <p>
            When you request an estimate or book a cleaning, we collect the
            details you provide: your name, email address, phone number, service
            address and home details (such as number of rooms), any allergies or
            product preferences, and your booking selections.
          </p>
        </Section>

        <Section heading="How we use your information">
          <p>We use your information to:</p>
          <ul className="list-disc pl-5">
            <li>Provide, schedule, and confirm your cleaning service.</li>
            <li>
              Communicate with you about your booking by email, phone, and text
              message.
            </li>
            <li>Process payments for your service.</li>
            <li>Respond to your questions and improve our service.</li>
          </ul>
        </Section>

        <Section heading="Text messaging (SMS) consent">
          <p>
            When you provide your phone number and agree to receive text
            messages, we may send you service related messages such as booking
            confirmations, appointment reminders, and alerts when your cleaner is
            on the way. Message frequency varies. Message and data rates may
            apply. You can opt out at any time by replying STOP, and reply HELP
            for help.
          </p>
          <p>
            No mobile information will be shared with third parties or affiliates
            for marketing or promotional purposes. Text messaging opt-in data and
            consent will not be shared with any third parties. We share
            information only with the service providers described below, and only
            as needed to operate our service.
          </p>
        </Section>

        <Section heading="How we share information">
          <p>
            We do not sell your personal information, and no mobile information
            will be shared with third parties or affiliates for marketing or
            promotional purposes. We share information only with trusted service
            providers that help us operate, and only as needed to provide our
            service: payment processing (Stripe), text messaging (Twilio), email
            delivery (Resend), and scheduling (Google Calendar). We may also
            disclose information if required by law.
          </p>
        </Section>

        <Section heading="Data retention">
          <p>
            We keep your information for as long as needed to provide our service
            and to meet legal and accounting requirements, after which it is
            deleted or anonymized.
          </p>
        </Section>

        <Section heading="Your choices">
          <p>
            You can opt out of text messages by replying STOP. To access, update,
            or delete your information, or to ask a question about this policy,
            contact us at hello@thesageessence.com.
          </p>
        </Section>

        <Section heading="Contact us">
          <p>
            Sage Essence LLC, Austin, Texas. Email: hello@thesageessence.com.
          </p>
        </Section>

        <div className="mt-12 border-t border-sage/20 pt-6 text-center text-sm">
          <Link href="/terms" className="text-sage-deep underline hover:text-ink">
            Terms of Service
          </Link>
          <span className="mx-3 text-sage">·</span>
          <Link href="/" className="text-sage-deep underline hover:text-ink">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
