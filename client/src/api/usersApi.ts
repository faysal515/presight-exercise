import { readJsonBody } from "./http.js";
import type {
  PersonRecord,
  RankedHobby,
  RankedNationality,
  UsersListMeta,
} from "./types.js";

export async function fetchUsersList(params: {
  page: number;
  limit?: number;
  search?: string;
  nationalities?: string[];
  hobbies?: string[];
}): Promise<{ users: PersonRecord[]; meta: UsersListMeta }> {
  const limit = params.limit ?? 20;
  const q = new URLSearchParams();
  q.set("page", String(params.page));
  q.set("limit", String(limit));
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.nationalities?.length) {
    q.set("nationality", params.nationalities.join(","));
  }
  if (params.hobbies?.length) {
    q.set("hobbies", params.hobbies.join(","));
  }

  const res = await fetch(`/api/users?${q.toString()}`);
  const json = await readJsonBody<
    | { success: true; data: PersonRecord[]; meta: UsersListMeta }
    | { success: false; error: { message: string } }
  >(res);

  if (!json.success) {
    throw new Error(json.error.message);
  }

  return { users: json.data, meta: json.meta };
}

export async function fetchUserFilters(): Promise<{
  nationalities: RankedNationality[];
  hobbies: RankedHobby[];
}> {
  const res = await fetch("/api/users/filters");
  const json = await readJsonBody<
    | {
        success: true;
        data: {
          nationalities: RankedNationality[];
          hobbies: RankedHobby[];
        };
      }
    | { success: false; error: { message: string } }
  >(res);

  if (!json.success) {
    throw new Error(json.error.message);
  }

  return json.data;
}
