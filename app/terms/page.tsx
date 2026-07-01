import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Sage Essence",
  description:
    "The terms that govern booking and receiving cleaning services from Sage Essence LLC.",
  alternates: { canonical: "/terms" },
};

// Fecha de vigencia. Actualizar si cambian los terminos.
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

export default function TermsOfService() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence
        </p>
        <h1 className="mt-3 text-5xl leading-tight text-ink">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm uppercase tracking-widest text-sage">
          Effective {EFFECTIVE}
        </p>
      </header>

      <div className="mt-10">
        <p className="text-[15px] leading-relaxed text-sage-deep">
          These terms govern your use of the Sage Essence LLC website and the
          cleaning services you book with us. By booking a service, you agree to
          these terms.
        </p>

        <Section heading="Our services">
          <p>
            Sage Essence provides non-toxic residential cleaning in Austin,
            Texas. Service details, rooms, and add-ons are selected at the time
            of booking.
          </p>
        </Section>

        <Section heading="Booking and scheduling">
          <p>
            When you book, you choose a preferred date and time. We will confirm
            with you before the visit. Time slots are subject to availability.
            You can reschedule using the link provided in your confirmation.
          </p>
        </Section>

        <Section heading="Pricing and payment">
          <p>
            The price shown at booking is an estimate based on the information
            you provide and covers the estimated time for your home. If a clean
            runs longer due to the home&apos;s condition, extra time is billed at
            $60 per hour. Payment is completed through a secure link we send you.
          </p>
        </Section>

        <Section heading="Cancellations and rescheduling">
          <p>
            Please let us know as soon as possible if you need to cancel or
            reschedule. We ask for reasonable notice so we can offer the slot to
            another customer.
          </p>
        </Section>

        <Section heading="Messaging">
          <p>
            By providing your phone number, you may receive service related text
            messages and calls about your booking. Message frequency varies, and
            message and data rates may apply. Reply STOP to opt out and HELP for
            help. See our{" "}
            <Link
              href="/privacy"
              className="text-sage-deep underline hover:text-ink"
            >
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </Section>

        <Section heading="Limitation of liability">
          <p>
            We take care in every home we clean. To the extent permitted by law,
            our liability for any claim related to our service is limited to the
            amount you paid for that service. Please secure valuables and let us
            know of anything that needs special care.
          </p>
        </Section>

        <Section heading="Governing law">
          <p>These terms are governed by the laws of the State of Texas.</p>
        </Section>

        <Section heading="Contact us">
          <p>
            Sage Essence LLC, Austin, Texas. Email: hello@thesageessence.com.
          </p>
        </Section>

        <div className="mt-12 border-t border-sage/20 pt-6 text-center text-sm">
          <Link
            href="/privacy"
            className="text-sage-deep underline hover:text-ink"
          >
            Privacy Policy
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
