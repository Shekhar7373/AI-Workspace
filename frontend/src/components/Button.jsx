export function Button({ children, variant = "primary", className = "", type = "button", ...props }) {
  const variants = {
    primary: "bg-ink text-white hover:bg-black",
    secondary: "bg-white text-ink border border-black/10 hover:border-black/25",
    ghost: "text-ink hover:bg-black/5",
    danger: "bg-clay text-white hover:bg-[#974f39]"
  };

  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
