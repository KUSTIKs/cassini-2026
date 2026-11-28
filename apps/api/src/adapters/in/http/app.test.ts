import { GreetingResponse } from "@lifeline/contracts";
import { describe, expect, it } from "vitest";
import { GetGreetingUseCase } from "../../../application/use-cases/get-greeting.js";
import { InMemoryGreetingRepository } from "../../out/memory/in-memory-greeting-repository.js";
import { createHttpApp } from "./app.js";

describe("GET /greeting", () => {
  it("returns a greeting that matches the shared contract", async () => {
    const app = createHttpApp({
      getGreeting: new GetGreetingUseCase(new InMemoryGreetingRepository(["hi"])),
      storage: "memory",
      webOrigin: "http://localhost:3000",
    });
    const res = await app.request("/greeting");
    expect(res.status).toBe(200);
    const body = GreetingResponse.parse(await res.json());
    expect(body).toMatchObject({ message: "hi", source: "memory" });
  });
});
