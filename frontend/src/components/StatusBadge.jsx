export function StatusBadge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-black/5 text-black/65",
    success: "bg-fern/15 text-moss",
    warning: "bg-wheat/35 text-[#7b5f1f]",
    danger: "bg-clay/15 text-clay",
    info: "bg-steel/15 text-steel"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
