export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="text-slate-600">
        Refunds and trip changes are reviewed by Ecobus support based on the
        trip status, payment status, and time remaining before departure.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Refund requests</h2>
        <p className="text-slate-600">
          Customers should contact support with their booking reference, phone
          number, and reason for the request. Approved refunds are processed
          through the original payment channel where possible.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Missed trips</h2>
        <p className="text-slate-600">
          Missed departures may not qualify for refunds. Contact support as
          early as possible if travel plans change.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="text-slate-600">
          Email info@ecobustransport.com or WhatsApp +234 913 399 4004.
        </p>
      </section>
    </main>
  );
}
