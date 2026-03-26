import { readJsonBody } from "./http.js";

export type WsProcessResponse = {
  id: string;
  status: "pending";
};

export async function postWsProcess(): Promise<WsProcessResponse> {
  const res = await fetch("/api/events/ws-process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await readJsonBody<
    | { success: true; data: WsProcessResponse }
    | { success: false; error: { message: string } }
  >(res);
  if (!json.success) {
    throw new Error(json.error.message);
  }
  return json.data;
}
