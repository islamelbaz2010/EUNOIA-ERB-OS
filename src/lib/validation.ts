import { z } from "zod";

/**
 * Turns a camelCase field name into a readable label, e.g. "dueDate" -> "Due Date".
 */
function humanizeField(field: string): string {
  if (!field) return "";
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Converts a ZodError into a single, clear English sentence naming the offending
 * field instead of the generic "Validation error" string. Used by every API route
 * so users never see raw internal error text.
 */
export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "Invalid request data";

  const field = first.path.length ? humanizeField(String(first.path[first.path.length - 1])) : "";
  if (!field) return first.message;
  if (first.message === "Required") return `${field} is required`;
  return `${field}: ${first.message}`;
}
