import { z } from "zod";

/** Express `req.query` values: string, repeated keys as string[], or missing. */
const expressQueryValue = z.union([z.string(), z.array(z.string())]).optional();

/** Integer query param with `z.coerce` + fallback when missing or invalid. */
export const pageQueryParam = z.coerce
  .number()
  .int()
  .min(1)
  .max(100_000)
  .catch(1);

export const limitQueryParam = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .catch(20);

/** Trimmed, control-stripped search string (optional). */
export const searchQueryParam = expressQueryValue
  .transform((v) => {
    if (v === undefined) return undefined;
    const s = Array.isArray(v) ? v[0] : v;
    const t = s
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 200);
    return t === "" ? undefined : t;
  })
  .pipe(z.string().max(200).optional());

/**
 * Comma-separated OR list from a single query key (or repeated keys joined).
 * Built from Zod unions + transform + pipe — no imperative parsing helpers.
 */
export function commaSeparatedQueryParam(maxItems: number, maxItemLen: number) {
  return expressQueryValue
    .transform((v) => {
      if (v === undefined) return [] as string[];
      const raw = Array.isArray(v) ? v.join(",") : v;
      return raw
        .split(",")
        .map((x) => x.replace(/[\u0000-\u001F\u007F]/g, "").trim())
        .filter((x) => x.length > 0)
        .slice(0, maxItems)
        .map((x) => x.slice(0, maxItemLen));
    })
    .pipe(z.array(z.string().max(maxItemLen)).max(maxItems));
}
