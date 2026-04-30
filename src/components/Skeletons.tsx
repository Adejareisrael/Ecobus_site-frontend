export function TripCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* LEFT SIDE */}
        <div className="space-y-3">

          <div className="h-3 w-24 rounded bg-slate-200" />

          <div className="h-5 w-48 rounded bg-slate-200" />

          <div className="h-3 w-36 rounded bg-slate-200" />

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-2 md:text-right">

          <div className="h-6 w-24 rounded bg-slate-200 ml-auto" />

          <div className="h-3 w-16 rounded bg-slate-200 ml-auto" />

        </div>

      </div>

      {/* BUTTON AREA */}
      <div className="mt-6">
        <div className="h-10 w-32 rounded bg-slate-200" />
      </div>

    </div>
  );
}