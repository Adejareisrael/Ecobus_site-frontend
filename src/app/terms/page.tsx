export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: July 5, 2026</p>
      <p className="text-slate-600">
        By using the Ecobus Transport website or mobile app, creating an
        account, booking a trip, or submitting a vehicle hire request,
        passengers agree to these terms and to any terminal-specific travel
        instructions provided by Ecobus staff.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Bookings</h2>
        <p className="text-slate-600">
          A booking is confirmed after successful payment verification. Seat
          availability is managed per trip and travel date. Customers are
          responsible for checking route, terminal, travel date, passenger
          details, and seat selections before payment. Promo codes are subject
          to their own validity dates, minimum spend, and usage limits, and may
          be withdrawn or changed at any time.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Vehicle hire and charter</h2>
        <p className="text-slate-600">
          Submitting a vehicle hire request is an enquiry, not a paid booking —
          no payment is collected through the website or app at this stage.
          Ecobus will contact you using the details provided to confirm
          availability, pricing, and trip details. A hire is only confirmed
          once Ecobus and the customer agree on these terms directly; Ecobus is
          not obligated to fulfil a hire request it cannot accommodate.
          Cancellation or changes to a confirmed hire are handled case-by-case
          with Ecobus support.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Accounts</h2>
        <p className="text-slate-600">
          If you create an account, you are responsible for keeping your
          password confidential and for all activity under your account.
          Contact Ecobus support immediately if you suspect unauthorized
          access. Ecobus may suspend or terminate accounts used to attempt
          fraud, abuse the booking or check-in systems, or automate access to
          the site outside normal use.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Tickets and check-in</h2>
        <p className="text-slate-600">
          Passengers must present a valid ticket, booking reference, or QR code
          when requested. Ecobus may verify tickets before boarding and may
          reject duplicate, altered, cancelled, or already checked-in tickets.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Passenger responsibility</h2>
        <p className="text-slate-600">
          Passengers are responsible for arriving before departure, complying
          with reasonable terminal instructions, keeping contact details
          reachable, and ensuring luggage and personal items comply with Ecobus
          operating rules.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Changes and cancellations</h2>
        <p className="text-slate-600">
          Trip changes, cancellations, and refunds are handled under the Ecobus
          refund policy and may depend on route status, payment status, seat
          availability, and time remaining before departure.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Service changes</h2>
        <p className="text-slate-600">
          Ecobus may adjust schedules, vehicles, seats, terminals, or operating
          procedures when necessary for safety, operational, regulatory, or
          weather-related reasons.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Support</h2>
        <p className="text-slate-600">
          For booking support, contact info@ecobustransport.com or WhatsApp
          +234 913 399 4004.
        </p>
      </section>
    </main>
  );
}
