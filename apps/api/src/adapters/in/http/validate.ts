import { z } from "zod";
import { BadRequestError } from "./errors.js";

/** Parses a request part with a contract schema; turns zod issues into field messages. */
export const parseWith = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields = Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
  throw new BadRequestError("The request is not valid.", fields);
};

export const Id = z.uuid();
