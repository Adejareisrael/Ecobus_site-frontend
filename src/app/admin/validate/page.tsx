"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ScanLine, ShieldCheck, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth-store";
import { useSearchParams } from "next/navigation";
import { BarcodeDetectorConstructor, parseTicketQr } from "@/lib/ticket-qr";

type ValidationResult = {
  valid: boolean;
  reference: string;
  status: string;
  routeLabel: string;
  travelDate: string;
  departureTime: string;
  seats: string[];
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedInBy: string | null;
  passenger: {
    fullName: string;
    phone: string;
    email: string;
  };
};

export default function AdminValidateTicketPage() {
  return (
    <Suspense fallback={<Card className="p-6 text-slate-500">Loading validator...</Card>}>
      <AdminValidateTicketContent />
    </Suspense>
  );
}

function AdminValidateTicketContent() {
  const token = useAuthStore((s) => s.token);
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("reference") ?? "");
  const [bookingId] = useState(searchParams.get("bookingId") ?? "");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const validateTicket = useCallback(async (value: string, id = bookingId) => {
    if (!token) return;
    setLoading(true);
    setMessage("");
    setResult(null);

    const params = new URLSearchParams();
    if (id) params.set("bookingId", id);
    if (value) params.set("reference", value);

    const res = await fetch(`/api/tickets/validate?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage((data as { error?: string }).error ?? "Ticket could not be validated.");
      setLoading(false);
      return;
    }

    setResult(data as ValidationResult);
    setLoading(false);
  }, [bookingId, token]);

  const stopScanner = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startScanner = async () => {
    setScanMessage("");
    const BarcodeDetector =
      (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor })
        .BarcodeDetector;

    if (!BarcodeDetector) {
      setScanMessage(
        "This browser does not support QR camera scanning yet. Use Chrome or enter the reference manually."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const rawValue = codes[0]?.rawValue;
          if (rawValue) {
            const parsed = parseTicketQr(rawValue);
            setQuery(parsed.reference ?? parsed.raw);
            stopScanner();
            await validateTicket(parsed.reference ?? "", parsed.bookingId ?? "");
            return;
          }
        } catch {
          setScanMessage("The QR code could not be read. Please try again.");
        }
        frameRef.current = requestAnimationFrame(scan);
      };

      frameRef.current = requestAnimationFrame(scan);
    } catch {
      setScanMessage("Camera access was blocked or unavailable on this device.");
      stopScanner();
    }
  };

  useEffect(() => {
    if (!bookingId || !token) return;

    let cancelled = false;
    async function runInitialValidation() {
      setLoading(true);
      setMessage("");
      setResult(null);

      const params = new URLSearchParams({ bookingId });
      const res = await fetch(`/api/tickets/validate?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (cancelled) return;

      if (!res.ok) {
        setMessage((data as { error?: string }).error ?? "Ticket could not be validated.");
      } else {
        setResult(data as ValidationResult);
      }

      setLoading(false);
    }

    void runInitialValidation();
    return () => {
      cancelled = true;
    };
  }, [bookingId, token]);

  useEffect(() => stopScanner, [stopScanner]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void validateTicket(query);
  };

  const checkInPassenger = async () => {
    if (!token || !result) return;
    setCheckingIn(true);
    setMessage("");

    const res = await fetch("/api/tickets/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reference: result.reference }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage((data as { error?: string }).error ?? "Ticket could not be checked in.");
      setResult(data as ValidationResult);
      setCheckingIn(false);
      return;
    }

    setResult(data as ValidationResult);
    setCheckingIn(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Validate ticket</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scan a QR code or enter a booking reference to verify boarding.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ECO-123456"
          />
          <Button type="submit" className="gap-2" disabled={loading || !query.trim()}>
            <Search className="h-4 w-4" />
            {loading ? "Checking..." : "Check"}
          </Button>
        </form>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Scan ticket QR</h2>
            <p className="text-sm text-slate-500">
              Use the device camera to validate a passenger ticket.
            </p>
          </div>
          {scanning ? (
            <Button variant="ghost" onClick={stopScanner} className="gap-2">
              <X className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button onClick={startScanner} className="gap-2">
              <Camera className="h-4 w-4" />
              Start scanner
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
          <video
            ref={videoRef}
            muted
            playsInline
            className={`aspect-video w-full object-cover ${scanning ? "block" : "hidden"}`}
          />
          {!scanning && (
            <div className="flex aspect-video items-center justify-center text-slate-400">
              <ScanLine className="h-10 w-10" />
            </div>
          )}
        </div>

        {scanMessage && <p className="text-sm text-amber-600">{scanMessage}</p>}
      </Card>

      {message && (
        <Card className="border-red-100 bg-red-50 p-5 text-sm text-red-600">
          {message}
        </Card>
      )}

      {result && (
        <Card className="p-5 space-y-4">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              result.valid && !result.checkedIn
                ? "bg-emerald-50 text-emerald-600"
                : result.checkedIn
                  ? "bg-blue-50 text-blue-600"
                  : "bg-red-50 text-red-600"
            }`}
          >
            {result.checkedIn ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {result.checkedIn ? "Checked in" : result.valid ? "Valid ticket" : "Do not board"}
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-2">
            <Info label="Reference" value={result.reference} />
            <Info label="Status" value={result.status} />
            <Info label="Passenger" value={result.passenger.fullName} />
            <Info label="Phone" value={result.passenger.phone} />
            <Info label="Route" value={result.routeLabel} />
            <Info label="Date" value={result.travelDate} />
            <Info label="Departure" value={result.departureTime} />
            <Info label="Seats" value={result.seats.join(", ")} />
            <Info
              label="Boarding"
              value={
                result.checkedIn
                  ? `Checked in${result.checkedInAt ? ` at ${new Date(result.checkedInAt).toLocaleString()}` : ""}`
                  : "Not checked in"
              }
            />
            {result.checkedInBy && <Info label="Checked in by" value={result.checkedInBy} />}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="gap-2"
              disabled={!result.valid || result.checkedIn || checkingIn}
              onClick={checkInPassenger}
            >
              <CheckCircle2 className="h-4 w-4" />
              {checkingIn
                ? "Checking in..."
                : result.checkedIn
                  ? "Passenger checked in"
                  : "Check in passenger"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
