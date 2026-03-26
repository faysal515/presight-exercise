import { MongoClient, type Db } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

export const USERS_COLLECTION = "users";

let client: MongoClient | undefined;
let db: Db | undefined;
let memoryServer: MongoMemoryServer | undefined;

export async function connectMongo(): Promise<void> {
  const uriFromEnv = process.env.MONGODB_URI;
  if (uriFromEnv) {
    client = new MongoClient(uriFromEnv);
    await client.connect();
  } else {
    memoryServer = await MongoMemoryServer.create();
    client = new MongoClient(memoryServer.getUri());
    await client.connect();
  }
  db = client.db(process.env.MONGODB_DB_NAME ?? "presight");
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectMongo() first.");
  }
  return db;
}

export async function closeMongo(): Promise<void> {
  try {
    if (client) {
      await client.close();
    }
  } finally {
    client = undefined;
    db = undefined;
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = undefined;
    }
  }
}
