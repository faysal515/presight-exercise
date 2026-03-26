import type { PersonRecord } from "../../types/person.js";
import { getDb, USERS_COLLECTION } from "../../db/mongo.js";
import type { ListUsersQuery } from "./listUsersQuery.js";
import { buildUsersFilter } from "./mongoFilters.js";

export type PersonWithId = PersonRecord & { id: string };

export async function findUsers(q: ListUsersQuery): Promise<{
  rows: PersonWithId[];
  total: number;
}> {
  const col = getDb().collection(USERS_COLLECTION);
  const filter = buildUsersFilter(q);
  const total = await col.countDocuments(filter);
  const skip = (q.page - 1) * q.limit;
  const docs = await col
    .find(filter)
    .skip(skip)
    .limit(q.limit)
    .project({
      full_name_lower: 0,
      nationality_lower: 0,
      hobbies_lower: 0,
    })
    .toArray();

  const rows: PersonWithId[] = docs.map((d) => {
    const { _id, ...rest } = d as typeof d & {
      avatar: string;
      first_name: string;
      last_name: string;
      age: number;
      nationality: string;
      hobbies: string[];
    };
    return {
      id: _id.toString(),
      avatar: rest.avatar,
      first_name: rest.first_name,
      last_name: rest.last_name,
      age: rest.age,
      nationality: rest.nationality,
      hobbies: rest.hobbies,
    };
  });

  return { rows, total };
}
