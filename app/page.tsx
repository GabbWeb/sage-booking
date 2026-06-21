import BookingForm from "@/components/BookingForm";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col px-5 py-14 sm:py-20">
      <header className="mb-10 text-center">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence
        </p>
        <h1 className="mt-3 text-5xl leading-tight text-ink sm:text-6xl">
          Book your clean
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-sage-deep">
          Non toxic, considered cleaning for Austin homes. Tell us about your
          space and we will send a tailored estimate.
        </p>
      </header>

      <section className="rounded-2xl border border-sage/20 bg-paper p-6 shadow-sm sm:p-9">
        <BookingForm />
      </section>

      <footer className="mt-10 text-center text-xs uppercase tracking-widest text-sage">
        Sage Essence LLC, Austin TX
      </footer>
    </main>
  );
}
