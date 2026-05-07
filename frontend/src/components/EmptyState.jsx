export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed border-black/15 bg-black/[0.02] p-6 text-center">
      {Icon && <Icon className="mb-3 h-7 w-7 text-black/35" />}
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-black/55">{text}</p>}
    </div>
  );
}
