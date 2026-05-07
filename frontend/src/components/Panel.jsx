export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-black/10 bg-white/80 shadow-sm backdrop-blur ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
          {title && <h2 className="text-sm font-bold uppercase tracking-wide text-black/65">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
