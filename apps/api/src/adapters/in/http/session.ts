import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless session tokens: base64url({ sub, exp }) + "." + HMAC-SHA256 signature.
 * Demo-grade: no revocation list. In production the session comes from NIA (OpenID Connect).
 */
export type SessionCodec = {
  issue(userId: string, now: Date): { token: string; expiresAt: Date };
  verify(token: string, now: Date): string | null;
};

export const createSessionCodec = ({ secret, ttlHours }: { secret: string; ttlHours: number }): SessionCodec => {
  const sign = (payload: string) => createHmac("sha256", secret).update(payload).digest("base64url");

  return {
    issue(userId, now) {
      const expiresAt = new Date(now.getTime() + ttlHours * 3_600_000);
      const payload = Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt.getTime() })).toString("base64url");
      return { token: `${payload}.${sign(payload)}`, expiresAt };
    },
    verify(token, now) {
      const [payload, signature, extra] = token.split(".");
      if (!payload || !signature || extra !== undefined) return null;
      const expected = Buffer.from(sign(payload));
      const given = Buffer.from(signature);
      if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
      try {
        const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: unknown; exp?: unknown };
        if (typeof sub !== "string" || typeof exp !== "number" || exp <= now.getTime()) return null;
        return sub;
      } catch {
        return null;
      }
    },
  };
};
