export class AdminFieldError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "AdminFieldError";
    this.field = field;
  }
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstString(item);
      if (message) {
        return message;
      }
    }
  }

  if (isRecord(value)) {
    return firstString(value["message"] ?? value["error"]);
  }

  return undefined;
}

/**
 * Server mutations in the design either return void on success or a result
 * object. This adapter accepts both so a small API response-shape difference
 * does not turn into a false success message.
 */
export function assertMutationSucceeded(
  result: unknown,
  options: { duplicateField?: string } = {},
): void {
  if (result === undefined || result === null || result === true) {
    return;
  }

  if (!isRecord(result)) {
    throw new Error("The server returned an invalid response.");
  }

  const failed = result["success"] === false || result["ok"] === false;
  if (!failed) {
    return;
  }

  const errors = result["errors"];
  if (isRecord(errors)) {
    for (const [field, value] of Object.entries(errors)) {
      const message = firstString(value);
      if (message) {
        throw new AdminFieldError(field, message);
      }
    }
  }

  const message =
    firstString(result["message"]) ??
    (options.duplicateField
      ? `${options.duplicateField} is already in use.`
      : "The server could not save this item.");

  if (options.duplicateField && /duplicate|already in use|unique/i.test(message)) {
    throw new AdminFieldError(options.duplicateField, "This value is already in use.");
  }

  throw new Error(message);
}

export function getSafeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AdminFieldError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
