"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<PaymentFailedShell reason="Payment could not be completed." />}>
      <PaymentFailedContent />
    </Suspense>
  );
}

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Payment could not be completed.";

  return <PaymentFailedShell reason={reason} />;
}

function PaymentFailedShell({ reason }: { reason: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="p-6 text-center space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-xl font-bold">Payment not completed</h1>
          <p className="mt-2 text-sm text-slate-500">{reason}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/payment">
            <Button className="w-full">Try again</Button>
          </Link>
          <Link href="/search">
            <Button className="w-full" variant="secondary">
              Book another trip
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
