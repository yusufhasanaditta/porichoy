export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path
        d="M11 23V9h6.2a4.6 4.6 0 0 1 0 9.2H11"
        fill="none"
        stroke="var(--primary-fg)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="22.5" r="2.6" fill="var(--accent)" />
    </svg>
  );
}
