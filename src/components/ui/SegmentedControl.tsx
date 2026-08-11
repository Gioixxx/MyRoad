import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  name: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        "inline-flex max-w-full min-w-0 flex-wrap rounded-md border border-(--color-border) bg-(--color-background)/60 p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-w-0 flex-1 rounded px-3 py-3 text-sm font-semibold transition-[background,color,box-shadow] duration-150 sm:px-4 sm:py-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
              selected
                ? "gold-metal shadow-sm"
                : "text-(--color-text-muted) hover:text-(--color-text)",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
