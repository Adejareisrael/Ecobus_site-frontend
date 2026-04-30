import { getTrips } from "@/lib/api";
import { TripResults } from "@/components/TripResults";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}) {
  const params = await searchParams;
  const trips = await getTrips(params);

  const hasFilters = params.from || params.to || params.date;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">

      {/* HEADER */}
      <div className="space-y-3">

        <h1 className="text-2xl sm:text-3xl font-bold">
          Available trips
        </h1>

        <p className="text-sm sm:text-base text-slate-600">
          Compare scheduled departures, prices, and available seats.
        </p>

        {/* SEARCH CONTEXT (IMPORTANT UX FIX) */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-slate-500">

            {params.from && (
              <span className="px-3 py-1 bg-slate-100 rounded-full">
                From: {params.from}
              </span>
            )}

            {params.to && (
              <span className="px-3 py-1 bg-slate-100 rounded-full">
                To: {params.to}
              </span>
            )}

            {params.date && (
              <span className="px-3 py-1 bg-slate-100 rounded-full">
                Date: {params.date}
              </span>
            )}

          </div>
        )}

      </div>

      {/* RESULTS */}
      {trips.length > 0 ? (
        <TripResults trips={trips} />
      ) : (
        <div className="text-center py-16 space-y-3">

          <p className="text-slate-500">
            No trips found for this route.
          </p>

          <p className="text-sm text-slate-400">
            Try changing your search filters.
          </p>

        </div>
      )}

    </div>
  );
}