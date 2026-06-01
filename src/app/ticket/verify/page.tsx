"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ScanLine, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { uppercaseCodeInput } from "@/lib/form-input";
import { BarcodeDetectorConstructor, parseTicketQr } from "@/lib/ticket-qr";

export default function TicketVerifyPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const stopScanner = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const openScannedTicket = (rawValue: string) => {
    const parsed = parseTicketQr(rawValue);
    if (parsed.confirmationPath) {
      router.push(parsed.confirmationPath);
      return true;
    }

    if (parsed.bookingId) {
      router.push(`/confirmation/${parsed.bookingId}`);
      return true;
    }

    if (parsed.reference) {
      setReference(parsed.reference);
      setMessage("Reference found. Use booking lookup to open the ticket.");
      return true;
    }

    setMessage("This QR code is not an Ecobus ticket.");
    return false;
  };

  const startScanner = async () => {
    setMessage("");
    const BarcodeDetector =
      (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor })
        .BarcodeDetector;

    if (!BarcodeDetector) {
      setMessage("This browser does not support QR camera scanning yet. Use Chrome or booking lookup.");
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
          if (rawValue && openScannedTicket(rawValue)) {
            stopScanner();
            return;
          }
        } catch {
          setMessage("The QR code could not be read. Please try again.");
        }
        frameRef.current = requestAnimationFrame(scan);
      };

      frameRef.current = requestAnimationFrame(scan);
    } catch {
      setMessage("Camera access was blocked or unavailable on this device.");
      stopScanner();
    }
  };

  useEffect(() => stopScanner, [stopScanner]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold lg:text-3xl">Verify ticket</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scan an Ecobus ticket QR code to open and confirm the booking.
        </p>
      </div>

      <Card className="p-5 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Ticket scanner</h2>
            <p className="text-sm text-slate-500">Point the camera at the QR code on the ticket.</p>
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

        {message && <p className="text-sm text-amber-600">{message}</p>}

        <form
          className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (reference.trim()) router.push(`/lookup?reference=${encodeURIComponent(reference.trim())}`);
          }}
        >
          <Input
            value={reference}
            onChange={(event) => setReference(uppercaseCodeInput(event.target.value))}
            placeholder="Enter booking reference"
          />
          <Button type="submit" variant="secondary" className="gap-2" disabled={!reference.trim()}>
            <Search className="h-4 w-4" />
            Find ticket
          </Button>
        </form>
      </Card>
    </div>
  );
}
