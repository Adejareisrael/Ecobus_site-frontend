export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-slate-600">
        By booking with Ecobus, passengers agree to provide accurate passenger
        details, arrive before departure, and present a valid ticket at the
        terminal.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Bookings</h2>
        <p className="text-slate-600">
          A booking is confirmed after successful payment verification. Seat
          availability is managed per trip and travel date.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Passenger responsibility</h2>
        <p className="text-slate-600">
          Passengers are responsible for arriving on time and ensuring that
          their name, phone number, and route details are correct before
          payment.
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
