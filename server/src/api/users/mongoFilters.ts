import type { Document, Filter } from "mongodb";
import type { ListUsersQuery } from "./listUsersQuery.js";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchFilter(searchLower: string | undefined): object | null {
  if (searchLower === undefined) return null;
  const q = searchLower.replace(/\s+/g, " ").trim();
  if (q === "") return null;
  const escaped = escapeRegex(q);
  const full = { full_name_lower: { $regex: escaped, $options: "" } };
  const fn = { first_name: { $regex: escaped, $options: "i" } };
  const ln = { last_name: { $regex: escaped, $options: "i" } };
  const contiguousOr = { $or: [full, fn, ln] };
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return contiguousOr;
  const tokenAnd = {
    $and: tokens.map((t) => ({
      $or: [
        { first_name: { $regex: escapeRegex(t), $options: "i" } },
        { last_name: { $regex: escapeRegex(t), $options: "i" } },
      ],
    })),
  };
  return { $or: [contiguousOr, tokenAnd] };
}

export function buildUsersFilter(q: ListUsersQuery): Filter<Document> {
  const clauses: object[] = [];
  const search = buildSearchFilter(q.search?.toLowerCase());
  if (search) clauses.push(search);
  if (q.nationality.length > 0) {
    clauses.push({
      nationality_lower: {
        $in: q.nationality.map((n) => n.toLowerCase()),
      },
    });
  }
  if (q.hobbies.length > 0) {
    clauses.push({
      hobbies_lower: { $in: q.hobbies.map((h) => h.toLowerCase()) },
    });
  }
  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0] as Filter<Document>;
  return { $and: clauses };
}
