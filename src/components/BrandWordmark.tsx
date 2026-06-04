import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  className?: string;
};

export function BrandWordmark({ name, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        className
      )}
    >
      <Image
        src="/ecobus-wordmark.png"
        alt={`${name} logo`}
        width={900}
        height={277}
        className="h-full w-auto object-contain dark:hidden"
        priority
      />
      <Image
        src="/ecobus-wordmark-dark.png"
        alt={`${name} logo`}
        width={900}
        height={277}
        className="hidden h-full w-auto object-contain dark:block"
        priority
      />
    </span>
  );
}
