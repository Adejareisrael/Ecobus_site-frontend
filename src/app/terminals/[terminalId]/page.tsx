import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getDbTerminalById, getDbTrips } from "@/lib/server-data";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TerminalDetailsPage({
  params,
}: {
  params: Promise<{ terminalId: string }>;
}) {
  const { terminalId } = await params;
  const [terminal, departures] = await Promise.all([
    getDbTerminalById(terminalId),
    getDbTrips({ from: terminalId }),
  ]);

  if (!terminal) notFound();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-ecobus-red">{terminal.city}, {terminal.state}</p>
        <h1 className="text-3xl font-bold">{terminal.name}</h1>
        <p className="text-slate-600">
          Terminal details, boarding information, and available departures.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <MapPin className="h-5 w-5 text-ecobus-red" />
          <p className="mt-3 text-xs text-slate-500">Address</p>
          <p className="font-medium">{terminal.address || `${terminal.city}, ${terminal.state}`}</p>
        </Card>

        <Card className="p-5">
          <Phone className="h-5 w-5 text-ecobus-purple" />
          <p className="mt-3 text-xs text-slate-500">Contact</p>
          <p className="font-medium">{terminal.phone || "+234 913 399 4004"}</p>
        </Card>

        <Card className="p-5">
          <Clock className="h-5 w-5 text-slate-700" />
          <p className="mt-3 text-xs text-slate-500">Opening hours</p>
          <p className="font-medium">{terminal.hours || "6:00 AM - 6:00 PM"}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Facilities</h2>
            <p className="text-sm text-slate-500">What passengers can expect at this terminal.</p>
          </div>
          {terminal.mapUrl && (
            <a href={terminal.mapUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost">Open map</Button>
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(terminal.facilities?.length ? terminal.facilities : ["Waiting area", "Ticket support"]).map((facility) => (
            <span key={facility} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {facility}
            </span>
          ))}
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold">Departures from this terminal</h2>
          <Link href={`/search?from=${terminal.id}`} className="text-sm font-medium text-ecobus-red">
            View all
          </Link>
        </div>

        {departures.length === 0 ? (
          <Card className="p-6 text-slate-500">No active departures from this terminal yet.</Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {departures.map((trip) => (
              <Card key={trip.id} className="p-5">
                <p className="font-semibold">{trip.routeLabel}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {trip.departureTime} to {trip.arrivalTime} · {trip.busType}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-bold text-ecobus-red">{formatNaira(trip.price)}</p>
                  <Link href={`/seats/${trip.id}`}>
                    <Button className="gap-2">
                      Book <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
