export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* LEFT SIDE (BRANDING) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-ecobus-red to-ecobus-purple text-white p-12">

        <div className="max-w-md space-y-6">

          {/* BRAND */}
          <div>
            <h1 className="text-5xl font-bold tracking-tight">
              Ecobus
            </h1>

            <p className="mt-2 text-white/80">
              Smart intercity travel across Nigeria
            </p>
          </div>

          {/* VALUE PROPS */}
          <div className="space-y-3 text-white/90 text-sm">

            <p>✔ Book scheduled bus trips instantly</p>
            <p>✔ Choose your preferred seat</p>
            <p>✔ Secure and fast checkout</p>
            <p>✔ Real-time trip availability</p>

          </div>

          {/* FOOTER NOTE */}
          <p className="text-xs text-white/60 pt-4">
            Trusted by thousands of travelers nationwide
          </p>

        </div>

      </div>

      {/* RIGHT SIDE (FORM) */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">

        <div className="w-full max-w-md space-y-6">

          {/* MOBILE BRAND HEADER */}
          <div className="lg:hidden text-center">
            <h1 className="text-3xl font-bold text-ecobus-red">
              Ecobus
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Intercity travel made simple
            </p>
          </div>

          {/* FORM CONTAINER */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border">
            {children}
          </div>

        </div>

      </div>

    </div>
  );
}