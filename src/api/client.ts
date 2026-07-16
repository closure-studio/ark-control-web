import type {
  AccountInput,
  DashboardResponse,
  GcpAccount,
  GcpOperationResult,
  HostRun,
  ReleasesResponse,
  RunLog,
  VerifyResult,
  VpsFormInput,
  VpsInventoryResponse,
  VpsResource
} from "@/types";

const HTTP_UNAUTHORIZED = 401;

class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ErrorBody = { error?: string; message?: string; details?: unknown };

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function createApiClient(token: string, onUnauthorized: () => void) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(path, {
        ...init,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
          ...(init.body ? { "content-type": "application/json" } : {}),
          ...init.headers
        }
      });
    } catch (error) {
      throw new ApiError(
        "network_error",
        error instanceof Error ? error.message : "Unable to reach the control API.",
        0
      );
    }

    const body = await parseJson(response);
    if (!response.ok) {
      const errorBody = (body && typeof body === "object" ? body : {}) as ErrorBody;
      if (response.status === HTTP_UNAUTHORIZED) onUnauthorized();
      throw new ApiError(
        errorBody.error ?? "request_failed",
        errorBody.message ?? `Request failed with status ${response.status}.`,
        response.status,
        errorBody.details
      );
    }
    return body as T;
  }

  return {
    getDashboard: () => request<DashboardResponse>("/api/dashboard"),
    listAccounts: () => request<{ accounts: GcpAccount[] }>("/api/accounts"),
    createAccount: (input: AccountInput) =>
      request<{ account: GcpAccount }>("/api/accounts", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    updateAccount: (id: number, input: Partial<AccountInput> & { enabled?: boolean }) =>
      request<{ account: GcpAccount }>(`/api/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    deleteAccount: (id: number) =>
      request<{ deleted: true }>(`/api/accounts/${id}`, {
        method: "DELETE"
      }),
    provisionVps: (accountId: number) =>
      request<{ vps: VpsResource; operation: GcpOperationResult }>(`/api/accounts/${accountId}/vps`, {
        method: "POST"
      }),
    listVps: () => request<VpsInventoryResponse>("/api/vps"),
    createVps: (input: VpsFormInput & { password: string }) =>
      request<{ vps: VpsResource }>("/api/vps", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    updateVps: (id: number, input: Partial<VpsFormInput>) =>
      request<{ vps: VpsResource }>(`/api/vps/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    deleteVps: (id: number) =>
      request<{ id: number; name: string; deleted: true }>(`/api/vps/${id}`, {
        method: "DELETE"
      }),
    verifyVps: (id: number) =>
      request<{ result: VerifyResult }>(`/api/vps/${id}/verify`, { method: "POST" }),
    listReleases: (limit: number, offset: number) =>
      request<ReleasesResponse>(`/api/releases?limit=${limit}&offset=${offset}`),
    listReleaseRuns: (releaseId: number) =>
      request<{ runs: HostRun[] }>(`/api/releases/${releaseId}/runs`),
    getRunLog: (runId: number) => request<RunLog>(`/api/runs/${runId}/log`)
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
