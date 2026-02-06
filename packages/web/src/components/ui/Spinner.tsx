type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-10 w-10",
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  "aria-label"?: string;
}

export function Spinner({ size = "md", className = "", "aria-label": ariaLabel = "Loading" }: SpinnerProps) {
  const sizeClass = sizeClasses[size];
  return (
    <svg
      className={`animate-spin text-[var(--amber-core)] ${sizeClass} ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
