export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="text-sm text-slate-500">Last updated: July 26, 2026</p>
      <p className="text-slate-600">
        No payment is collected online — fares are paid in cash at the
        terminal at check-in. Refunds and trip changes are reviewed by Ecobus
        support based on the trip status, reservation status, whether a fare
        has already been paid at the terminal, and time remaining before
        departure.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Refund requests</h2>
        <p className="text-slate-600">
          Customers should contact support with their booking reference, phone
          number, and reason for the request. Cancelling an unpaid reservation
          requires no refund, since no payment was taken online. If a fare has
          already been paid in cash at the terminal, approved refunds are
          issued in cash or as travel credit at that terminal.
        </p>
        <p className="text-slate-600">
          Contact support before using the &quot;Delete ticket&quot; button on
          your dashboard if you may need a refund. Deleting a ticket
          permanently removes the booking record, so support can no longer
          look it up, verify it, or process a refund against it once it has
          been deleted.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Before departure</h2>
        <p className="text-slate-600">
          Requests made before departure may qualify for a refund, route change,
          or rescheduling review. Approval is not automatic and depends on
          operational conditions and whether the ticket has already been used or
          checked in.
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
        <h2 className="text-xl font-semibold">Payment reversals</h2>
        <p className="text-slate-600">
          Since fares are paid in person at the terminal rather than online,
          approved refunds for fares already paid are issued in cash or as
          travel credit directly at the terminal where the payment was made,
          not through a bank or online payment channel.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Incorrect details</h2>
        <p className="text-slate-600">
          If a customer enters incorrect passenger details, phone number, email,
          route, date, or terminal, they should contact support immediately.
          Ecobus will review corrections before departure where possible.
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
