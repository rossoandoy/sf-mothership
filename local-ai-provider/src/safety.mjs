export const MAX_BODY_BYTES = 64 * 1024;

const SECRET_KEY_PATTERN = /(sessionid|sid|token|password|authorization|secret|cookie)/i;

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export function sanitizePayload(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const sanitized = {};
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      sanitized[key] = '[removed]';
      continue;
    }
    sanitized[key] = sanitizePayload(child);
  }
  return sanitized;
}

export async function readJsonBody(request, maxBytes = MAX_BODY_BYTES) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.byteLength;
    if (totalBytes > maxBytes) {
      throw new HttpError(413, `Request body is too large. Max ${maxBytes} bytes.`);
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) {
    throw new HttpError(400, 'Request body is required.');
  }

  try {
    return sanitizePayload(JSON.parse(raw));
  } catch (e) {
    throw new HttpError(400, `Invalid JSON body: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}
