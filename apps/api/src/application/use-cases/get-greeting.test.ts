import { describe, expect, it } from "vitest";
import { InMemoryGreetingRepository } from "../../adapters/out/memory/in-memory-greeting-repository.js";
import { DEFAULT_GREETING } from "../../domain/greeting.js";
import { GetGreetingUseCase } from "./get-greeting.js";

describe("GetGreetingUseCase", () => {
  it("returns the latest stored greeting", async () => {
    const repo = new InMemoryGreetingRepository(["first", "latest"]);
    const result = await new GetGreetingUseCase(repo).execute();
    expect(result.message).toBe("latest");
  });

  it("falls back to the default greeting when storage is empty", async () => {
    const result = await new GetGreetingUseCase(new InMemoryGreetingRepository()).execute();
    expect(result).toEqual(DEFAULT_GREETING);
  });
});
