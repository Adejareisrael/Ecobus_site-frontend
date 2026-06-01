export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-slate-600">
        Ecobus collects booking details, passenger contact information, payment
        references, and trip activity needed to provide transport booking
        services.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How we use data</h2>
        <p className="text-slate-600">
          We use customer information to issue tickets, verify payments,
          support passengers, prevent duplicate seat bookings, and contact
          customers about their trips.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Payments</h2>
        <p className="text-slate-600">
          Card and transfer processing is handled by Paystack. Ecobus stores
          payment references and status, not full card details.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="text-slate-600">
          For privacy requests, contact info@ecobustransport.com.
        </p>
      </section>
    </main>
  );
}
