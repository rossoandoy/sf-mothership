import { err, ok } from '@/shared/result';
import type { Result } from '@/shared/result';
import type { AiRequest, AiResponse } from './types';

interface JsonSchemaLike {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer' | 'null';
  required?: string[];
  properties?: Record<string, JsonSchemaLike>;
  items?: JsonSchemaLike;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonSchemaLike(value: unknown): value is JsonSchemaLike {
  return isRecord(value);
}

function validateType(value: unknown, type: JsonSchemaLike['type']): boolean {
  if (!type) return true;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return isRecord(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'null') return value === null;
  return typeof value === type;
}

function validateSchema(value: unknown, schema: JsonSchemaLike, path = '$'): string | null {
  if (!validateType(value, schema.type)) {
    return `${path} does not match schema type ${schema.type}`;
  }

  if (schema.type === 'object' && isRecord(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) {
        return `${path}.${key} is required by schema`;
      }
    }

    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (key in value) {
        const childError = validateSchema(value[key], childSchema, `${path}.${key}`);
        if (childError) return childError;
      }
    }
  }

  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i += 1) {
      const childError = validateSchema(value[i], schema.items, `${path}[${i}]`);
      if (childError) return childError;
    }
  }

  return null;
}

function parseJson(content: string): Result<unknown> {
  try {
    return ok(JSON.parse(content));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    return err(`AI output JSON parse failed: ${message}`);
  }
}

export function processAiOutput<T = unknown>(
  request: AiRequest,
  response: AiResponse<T>
): Result<AiResponse<T>> {
  const outputMode = request.outputMode ?? (request.responseSchema ? 'json' : 'text');

  if (outputMode === 'text' || outputMode === 'draft') {
    return ok(response);
  }

  const parsed = parseJson(response.content);
  if (!parsed.ok) return parsed;

  if (request.responseSchema && isJsonSchemaLike(request.responseSchema)) {
    const schemaError = validateSchema(parsed.data, request.responseSchema);
    if (schemaError) {
      return err(`AI output schema validation failed: ${schemaError}`);
    }
  }

  return ok({
    ...response,
    parsed: parsed.data as T,
  });
}
