/**
 * Reads the response body as JSON with clear errors when the body is empty
 * or not valid JSON (avoids "Unexpected end of JSON input" from Response.json()).
 */
export async function readJsonBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();

  if (!trimmed) {
    if (!res.ok) {
      throw new Error(
        `Request failed (${res.status} ${res.statusText || "Error"}). The response was empty — is the API running?`
      );
    }
    throw new Error(
      "The server returned an empty response. Check that the API is running and reachable."
    );
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    if (!res.ok) {
      throw new Error(
        `Request failed (${res.status} ${res.statusText || "Error"}). The response was not JSON (e.g. a proxy or HTML error page).`
      );
    }
    throw new Error(
      "The server returned an invalid response (not JSON). Check that you are calling the API, not another URL."
    );
  }
}
