export function chunkText(text, chunkSize = 500, overlap = 100) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}
