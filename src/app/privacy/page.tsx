export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: June 2, 2026</p>
      <p className="text-slate-600">
        Ecobus Transport collects only the information needed to create,
        manage, verify, and support passenger bookings.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Information we collect</h2>
        <p className="text-slate-600">
          We may collect passenger names, phone numbers, email addresses,
          booking references, selected seats, trip dates, route details,
          account details, payment references, ticket validation activity, and
          support messages.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How we use information</h2>
        <p className="text-slate-600">
          We use this information to issue tickets, verify payments, prevent
          duplicate seat bookings, confirm passenger check-in, send booking
          updates, respond to support requests, prevent misuse, and improve our
          transport services.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Payments</h2>
        <p className="text-slate-600">
          Card and transfer processing is handled by Paystack or another
          approved payment provider. Ecobus stores payment references, amounts,
          status, and timestamps. We do not store full card details.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Sharing and retention</h2>
        <p className="text-slate-600">
          We share information only with service providers needed to operate the
          booking service, including payment, messaging, hosting, analytics, and
          support tools. Booking records are retained for operational, customer
          support, audit, fraud-prevention, and legal purposes.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Your choices</h2>
        <p className="text-slate-600">
          Customers may request correction of account information, booking
          support, or review of stored contact details by contacting Ecobus
          support.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="text-slate-600">
          For privacy requests, email info@ecobustransport.com or WhatsApp
          +234 913 399 4004.
        </p>
      </section>
    </main>
  );
}
