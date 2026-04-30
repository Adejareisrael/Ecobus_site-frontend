"use client";

import { Card } from "@/components/ui/Card";

export default function AdminPage() {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold">Admin Overview</h1>
      <p className="text-slate-500 mt-1">
        Manage bookings, trips, and system activity
      </p>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 w-full">

        <Card className="p-5 w-full">
          <p className="text-sm text-slate-500">Total Trips</p>
          <h2 className="text-2xl font-bold text-ecobus-red mt-1">24</h2>
        </Card>

        <Card className="p-5 w-full">
          <p className="text-sm text-slate-500">Bookings</p>
          <h2 className="text-2xl font-bold mt-1">128</h2>
        </Card>

        <Card className="p-5 w-full">
          <p className="text-sm text-slate-500">Revenue</p>
          <h2 className="text-2xl font-bold text-ecobus-purple mt-1">
            ₦1,240,000
          </h2>
        </Card>

      </div>
    </div>
  );
}