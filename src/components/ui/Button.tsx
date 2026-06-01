import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  disabled,
  ...props
}: Props) {
  const styles = {
    primary:
      "bg-ecobus-red text-white hover:opacity-90 shadow-soft",

    secondary:
      "bg-ecobus-purple text-white hover:opacity-90",

    ghost:
      "bg-transparent text-ecobus-dark hover:bg-ecobus-light dark:text-slate-100 dark:hover:bg-slate-800",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-ecobus-red/30",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
