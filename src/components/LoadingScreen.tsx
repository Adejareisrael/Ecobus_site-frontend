import Image from "next/image";

type Props = {
  label?: string;
};

export function LoadingScreen({ label = "Loading" }: Props) {
  return (
    <div className="grid min-h-[55vh] place-items-center px-4">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-ecobus-red/20" />
          <div className="relative grid h-20 w-20 place-items-center rounded-full border border-slate-200 bg-white shadow-sm">
            <Image
              src="/ecobus-logo.jpg"
              alt="Ecobus Logo"
              width={28}
              height={28}
              className="h-7 w-auto object-contain"
              priority
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <div className="mx-auto flex w-28 items-center gap-1">
            <span className="h-1.5 flex-1 animate-pulse rounded-full bg-ecobus-red" />
            <span className="h-1.5 flex-1 animate-pulse rounded-full bg-ecobus-purple [animation-delay:120ms]" />
            <span className="h-1.5 flex-1 animate-pulse rounded-full bg-emerald-500 [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
