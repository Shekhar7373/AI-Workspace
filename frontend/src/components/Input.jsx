export function Input({ label, className = "", ...props }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      {label && <span>{label}</span>}
      <input
        className={`h-10 rounded-md border border-black/10 bg-white px-3 text-sm outline-none transition placeholder:text-black/35 focus:border-moss focus:ring-2 focus:ring-moss/15 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      {label && <span>{label}</span>}
      <textarea
        className={`min-h-28 resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-black/35 focus:border-moss focus:ring-2 focus:ring-moss/15 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, className = "", children, ...props }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      {label && <span>{label}</span>}
      <select
        className={`h-10 rounded-md border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
