import { getTerminals, getTrips } from "@/lib/api";
import { SearchForm } from "@/components/SearchForm";
import { TripResults } from "@/components/TripResults";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    date?: string;
    returnDate?: string;
    tripType?: string;
  }>;
}) {
  const params = await searchParams;
  const isRoundTrip = params.tripType === "round-trip";
  const [trips, returnTrips, terminals] = await Promise.all([
    getTrips(params),
    isRoundTrip && params.from && params.to
      ? getTrips({ from: params.to, to: params.from, date: params.returnDate })
      : Promise.resolve([]),
    getTerminals(),
  ]);

  const hasFilters = params.from || params.to || params.date || params.returnDate;
  const terminalName = (id?: string) => {
    const terminal = terminals.find((item) => item.id === id);
    return terminal ? `${terminal.city} - ${terminal.name}` : id;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">

      <div className="space-y-3">

        <h1 className="text-2xl sm:text-3xl font-bold">
          Available trips
        </h1>

        <p className="text-sm sm:text-base text-slate-600">
          Compare scheduled departures, prices, and available seats.
        </p>

        {hasFilters && (
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-slate-500">

            {params.from && (
              <span className="px-3 py-1 bg-slate-100 rounded-full">
                From: {terminalName(params.from)}
              </span>
            )}

            {params.to && (
              <span className="px-3 py-1 bg-slate-100 rounded-full">
                To: {terminalName(params.to)}
              </span>
            )}

            {params.date && (
              <span className="px-3 py-1 bg-slate-100 rounded-full">
                Date: {params.date}
              </span>
            )}

            {isRoundTrip && params.returnDate && (
              <span className="px-3 py-1 bg-slate-100 rounded-full">
                Return: {params.returnDate}
              </span>
            )}

          </div>
        )}

      </div>

      <SearchForm
        terminals={terminals}
        initialFrom={params.from}
        initialTo={params.to}
        initialDate={params.date}
        initialReturnDate={params.returnDate}
        initialTripType={params.tripType}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Outbound trips</h2>
        <TripResults trips={trips} searchParams={params} />
      </section>

      {isRoundTrip && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Return trips</h2>
          <p className="text-sm text-slate-500">
            Choose a return departure after confirming your outbound trip, or book both legs separately for now.
          </p>
          <TripResults
            trips={returnTrips}
            searchParams={{
              from: params.to,
              to: params.from,
              date: params.returnDate,
            }}
          />
        </section>
      )}

    </div>
  );
}
