export function Footer() {
  const whatsappNumber = "2349133994004";

  const whatsappMessage = "Hi Ecobus Support, I need help with my booking.";

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10">

        <div className="grid gap-8 md:grid-cols-3">

          {/* BRAND */}
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ecobus
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Scheduled intercity travel made simple across Nigeria.
            </p>
          </div>

          {/* LINKS */}
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Quick Links</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li>
                <a href="/search" className="hover:text-ecobus-red">
                  Book a trip
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-ecobus-purple">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-ecobus-red">
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Support</p>

            <p className="mt-3 text-slate-500">
              Need help with bookings or payments?
            </p>

            {/* WHATSAPP CTA */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-white font-medium hover:bg-green-600 transition"
            >
              💬 Chat on WhatsApp
            </a>

            <p className="mt-3 text-xs text-slate-400">
              Fastest response time (usually under 5 mins)
            </p>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-10 border-t pt-6 text-xs text-slate-500 flex flex-col gap-2 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Ecobus. All rights reserved.</p>
          <p>Built for intercity travel in Nigeria 🚍</p>
        </div>

      </div>
    </footer>
  );
}