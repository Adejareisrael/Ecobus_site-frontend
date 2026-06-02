import { cn } from "@/lib/utils";

type Props = {
  name: string;
  className?: string;
};

export function BrandWordmark({ name, className }: Props) {
  return (
    <span
      className={cn(
        "relative inline-flex w-fit items-end pt-[0.42em] font-black uppercase italic tracking-wide text-[#26358c]",
        className
      )}
    >
      <span className="absolute left-[0.22em] top-0 flex -skew-x-[16deg] gap-[0.13em] text-ecobus-red">
        <span className="block h-[0.85em] w-[0.18em] bg-current" />
        <span className="block h-[0.85em] w-[0.18em] bg-current" />
      </span>
      <span className="-skew-x-[8deg] leading-none">{name}</span>
    </span>
  );
}
