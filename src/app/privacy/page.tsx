export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: July 5, 2026</p>
      <p className="text-slate-600">
        Ecobus Transport collects only the information needed to create,
        manage, verify, and support passenger bookings, vehicle hire requests,
        and the Ecobus mobile app.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Information we collect</h2>
        <p className="text-slate-600">
          We may collect passenger names, phone numbers, email addresses,
          passwords (stored as a one-way hash, never in plain text), booking
          references, selected seats, trip dates, route details, account
          details, promo codes used, payment references, ticket validation and
          check-in activity, and support messages.
        </p>
        <p className="text-slate-600">
          If you request a vehicle hire or charter, we additionally collect
          your pickup location, destination, travel dates, passenger count,
          preferred vehicle type, and any notes you provide.
        </p>
        <p className="text-slate-600">
          Our servers automatically log the IP address of login, signup, and
          password-reset requests to detect and limit abusive or automated
          activity. We do not use this for advertising or tracking.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Device permissions</h2>
        <p className="text-slate-600">
          Ecobus staff use camera access on the ticket-verification and
          check-in screens to scan a passenger&apos;s QR code. This is only
          available to authenticated Ecobus staff accounts, and captured
          images are not stored — only the decoded ticket reference is used
          to look up a booking.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">On-device and local storage</h2>
        <p className="text-slate-600">
          To keep you signed in and let you resume a booking in progress, the
          website stores your session and in-progress booking details in your
          browser&apos;s local storage. In the Ecobus mobile app, a copy of
          your recently viewed tickets (including the QR code) is saved on
          your device so you can still show your ticket at boarding if you
          lose signal. You can clear this at any time by clearing the app or
          browser&apos;s local data.
        </p>
        <p className="text-slate-600">
          When you use the &quot;Share&quot; option on a ticket, Ecobus does
          not send your data anywhere automatically — it opens your device&apos;s
          own share menu so you can choose where to send your ticket details
          yourself (for example WhatsApp, Messages, or email).
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How we use information</h2>
        <p className="text-slate-600">
          We use this information to issue tickets, verify payments, prevent
          duplicate seat bookings, confirm passenger check-in, arrange vehicle
          hire, send booking updates, respond to support requests, prevent
          misuse, and improve our transport services.
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
          We share information only with service providers needed to operate
          the booking service: Paystack (payments), Resend (booking and
          ticket emails), and our database and file storage provider, Supabase.
          Booking records are retained for operational, customer support,
          audit, fraud-prevention, and legal purposes.
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
