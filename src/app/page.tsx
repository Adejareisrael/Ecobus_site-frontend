import Link from "next/link";
import { getTerminals } from "@/lib/api";
import { SearchForm } from "@/components/SearchForm";
import { Card } from "@/components/ui/Card";

export default async function HomePage() {
  const terminals = await getTerminals();

  const popularRoutes = [
    "Lagos (Jibowu) → Benin",
    "Lagos (Jibowu) → Abuja",
    "Benin → Lagos (Jibowu)",
    "Abuja → Port Harcourt",
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-14">

      {/* HERO */}
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">

        <div className="space-y-6">

          <div className="space-y-5">

            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
              Book scheduled bus trips with{" "}
              <span className="text-ecobus-red">Ecobus</span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-slate-600 leading-7">
              Search fixed routes, compare departures, choose your seat, and complete your booking in a few simple steps.
            </p>

          </div>

          <SearchForm terminals={terminals} />

        </div>

        {/* HERO CARD */}
        <Card className="p-0 overflow-hidden">

          <div className="h-full rounded-2xl bg-gradient-to-br from-ecobus-red to-ecobus-purple p-8 text-white min-h-[280px] flex flex-col justify-center">

            <p className="text-xs uppercase tracking-widest text-ecobus-light">
              Travel smarter
            </p>

            <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-snug">
              Comfort, reliability, and seat-based booking.
            </h2>

            <p className="mt-3 text-sm sm:text-base text-ecobus-light max-w-md">
              Designed for scheduled intercity travel between terminals, not ride-hailing.
            </p>

          </div>

        </Card>

      </section>

      {/* POPULAR ROUTES */}
      <section className="space-y-6">

        <div className="flex items-end justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">
            Popular routes
          </h2>

          <Link href="/search" className="text-sm font-medium text-ecobus-red">
            View all
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {popularRoutes.map((route) => (
            <Card
              key={route}
              className="p-5 hover:shadow-md transition cursor-pointer"
            >
              <p className="text-xs text-slate-500">Popular route</p>
              <h3 className="mt-2 text-base sm:text-lg font-semibold">
                {route}
              </h3>
            </Card>
          ))}

        </div>

      </section>

    </div>
  );
}