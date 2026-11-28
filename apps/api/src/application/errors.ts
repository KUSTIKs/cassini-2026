export class NotFoundError extends Error {
  override readonly name = "NotFoundError";
  constructor(entity: string, id: string) {
    super(`${entity} ${id} was not found.`);
  }
}

/** An external service (OSM, Copernicus, …) failed or timed out. */
export class UpstreamError extends Error {
  override readonly name = "UpstreamError";
  constructor(service: string, cause?: unknown) {
    super(`${service} did not respond. Try again in a minute.`, { cause });
  }
}

/** The signed-in user's role doesn't allow this action. */
export class ForbiddenError extends Error {
  override readonly name = "ForbiddenError";
  constructor(message = "Your role doesn't allow this.") {
    super(message);
  }
}
