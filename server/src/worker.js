import { parentPort } from "node:worker_threads";
import { faker } from "@faker-js/faker";

// export type WorkerMessageIn = { id: string };
// export type WorkerMessageOut = { id: string; result: string };

parentPort?.on("message", (msg) => {
  setTimeout(() => {
    const result = faker.lorem.sentence();
    parentPort?.postMessage({ id: msg.id, result });
  }, 2000);
});
