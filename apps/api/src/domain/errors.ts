/** A rule in the domain was violated. `fields` maps a field name to a readable message. */
export class DomainValidationError extends Error {
  override readonly name = "DomainValidationError";
  constructor(
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
