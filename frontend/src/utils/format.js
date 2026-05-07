export function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function clampText(value, fallback = "Untitled") {
  return String(value || fallback).trim();
}
