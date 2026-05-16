function timestamp() {
  return new Date().toISOString();
}

function write(level, scope, message, meta) {
  const line = `[${scope}] ${message}`;
  const payload = meta ? { ...meta, at: timestamp() } : undefined;

  if (level === "warn") {
    payload ? console.warn(line, payload) : console.warn(line);
    return;
  }

  if (level === "error") {
    payload ? console.error(line, payload) : console.error(line);
    return;
  }

  payload ? console.log(line, payload) : console.log(line);
}

export const logger = {
  info: (scope, message, meta) => write("info", scope, message, meta),
  warn: (scope, message, meta) => write("warn", scope, message, meta),
  error: (scope, message, meta) => write("error", scope, message, meta),
  ready: (scope, message, meta) => write("info", scope, `${message} ready`, meta),
  connected: (scope, message, meta) => write("info", scope, `${message} connected`, meta),
  skipped: (scope, message, meta) => write("warn", scope, `${message} skipped`, meta)
};
