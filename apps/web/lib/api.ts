export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable = false,
  ) {
    super(message);
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; retryable?: boolean };
}

/** fetch wrapper: JSON in/out, API error shape → ApiError, network failure → ApiError("network"). */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(0, "network", "Can't reach the Porichoy server. Check that the API is running.", true);
  }
  if (!res.ok) {
    let body: ErrorBody = {};
    try {
      body = (await res.json()) as ErrorBody;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, body.error?.code ?? `http_${res.status}`, body.error?.message ?? `Request failed (${res.status}).`, body.error?.retryable ?? res.status >= 500);
  }
  return (await res.json()) as T;
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
