/**
 * DOMAIN: pure business types and rules.
 * No imports from application, adapters, frameworks or I/O.
 */
export type Greeting = {
  readonly message: string;
};

export class InvalidGreetingError extends Error {
  override readonly name = "InvalidGreetingError";
}

export function createGreeting(message: string): Greeting {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new InvalidGreetingError("Greeting message must not be empty");
  }
  return { message: trimmed };
}

export const DEFAULT_GREETING = createGreeting("Hello from Lifeline (nothing stored yet)");
