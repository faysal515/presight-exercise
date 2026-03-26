import { faker } from "@faker-js/faker";
import { logger } from "../logger.js";
import { connectMongo, getDb, USERS_COLLECTION } from "../db/mongo.js";
import type { PersonRecord } from "../types/person.js";

export type RankedHobby = {
  hobby: string;
  count: number;
};

export type RankedNationality = {
  nationality: string;
  count: number;
};

const RECORD_COUNT = 10_000;
const TOP_N = 20;

const HOBBY_POOL = [
  "Reading",
  "Gaming",
  "Cooking",
  "Hiking",
  "Photography",
  "Travel",
  "Music",
  "Painting",
  "Running",
  "Swimming",
  "Cycling",
  "Gardening",
  "Writing",
  "Yoga",
  "Dancing",
  "Fishing",
  "Chess",
  "Knitting",
  "Woodworking",
  "Movies",
  "Theatre",
  "Volunteering",
  "Blogging",
  "Camping",
  "Skiing",
  "Surfing",
  "Astronomy",
  "Birdwatching",
  "Collecting",
  "Pottery",
] as const;

type UserDoc = PersonRecord & {
  full_name_lower: string;
  nationality_lower: string;
  hobbies_lower: string[];
};

export let topHobbies: RankedHobby[] = [];
export let topNationalities: RankedNationality[] = [];

function toUserDoc(base: PersonRecord): UserDoc {
  const full_name_lower = `${base.first_name} ${base.last_name}`.toLowerCase();
  return {
    ...base,
    full_name_lower,
    nationality_lower: base.nationality.toLowerCase(),
    hobbies_lower: base.hobbies.map((h) => h.toLowerCase()),
  };
}

function buildPeople(): UserDoc[] {
  return Array.from({ length: RECORD_COUNT }, () => {
    const avatar = faker.image.avatar();
    const first_name = faker.person.firstName();
    const last_name = faker.person.lastName();
    const age = faker.number.int({ min: 18, max: 80 });
    const nationality = faker.location.country();
    const hobbies = faker.helpers.arrayElements([...HOBBY_POOL], {
      min: 1,
      max: 5,
    });
    return toUserDoc({
      avatar,
      first_name,
      last_name,
      age,
      nationality,
      hobbies,
    });
  });
}

async function seedUsers(): Promise<void> {
  const col = getDb().collection<UserDoc>(USERS_COLLECTION);
  await col.deleteMany({});
  const docs = buildPeople();
  await col.insertMany(docs);
}

async function loadAggregates(): Promise<void> {
  const col = getDb().collection(USERS_COLLECTION);

  const hobbyRows = await col
    .aggregate([
      { $unwind: "$hobbies" },
      { $group: { _id: "$hobbies", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: TOP_N },
      { $project: { _id: 0, hobby: "$_id", count: 1 } },
    ])
    .toArray();
  topHobbies = hobbyRows as RankedHobby[];

  const natRows = await col
    .aggregate([
      { $group: { _id: "$nationality", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: TOP_N },
      { $project: { _id: 0, nationality: "$_id", count: 1 } },
    ])
    .toArray();
  topNationalities = natRows as RankedNationality[];
}

/**
 * Connects to MongoDB (in-memory if MONGODB_URI is unset), seeds users, and loads aggregates.
 */
export async function runStartupScript(): Promise<void> {
  await connectMongo();

  const startedAt = performance.now();

  await seedUsers();
  await loadAggregates();

  const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;

  logger.info({
    message: "Startup data script completed",
    durationMs,
    recordCount: RECORD_COUNT,
    topHobbiesCount: topHobbies.length,
    topNationalitiesCount: topNationalities.length,
    mongoMode: process.env.MONGODB_URI ? "uri" : "memory-server",
  });
}
