import { DEFAULT_GREETING } from "../../domain/greeting.js";
import type { GetGreeting } from "../ports/in/get-greeting.js";
import type { GreetingRepository } from "../ports/out/greeting-repository.js";

/**
 * USE CASE: implements an inbound port by orchestrating domain + outbound ports.
 * Knows nothing about HTTP, SQL or Hono.
 */
export class GetGreetingUseCase implements GetGreeting {
  constructor(private readonly greetings: GreetingRepository) {}

  async execute() {
    return (await this.greetings.findLatest()) ?? DEFAULT_GREETING;
  }
}
