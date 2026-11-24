import {
  HOST_RUN_STATUSES,
  type AccountInput,
  type CreateVpsInput,
  type GcpAccount,
  type GcpOperationResult,
  type HostRun,
  type HostRunListState,
  type HostRunStatus,
  type OperationsResponse,
  type ProvisionVpsInput,
  type ReleaseSummary,
  type ReleasesResponse,
  type RunLog,
  type RunsResponse,
  type SchedulerEnsureResponse,
  type UpdateVpsInput,
  type VerifyResult,
  type VpsInventoryResponse,
  type VpsResource
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

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unwrapData(body: unknown): unknown {
  if (isJsonObject(body) && Object.hasOwn(body, "data")) return body.data;
  return body;
}

function invalidHostRunResponse(httpStatus: number, field: string, rule: string): ApiError {
  return new ApiError(
    "invalid_response",
    `${field} ${rule}. Allowed host-run statuses: ${HOST_RUN_STATUSES.join(", ")}.`,
    httpStatus
  );
}

function parseHostRunStatus(value: unknown, field: string, httpStatus: number): HostRunStatus {
  const status = HOST_RUN_STATUSES.find((allowed) => allowed === value);
  if (status === undefined) {
    throw invalidHostRunResponse(httpStatus, field, "must be a recognized host-run status");
  }
  return status;
}

type RawRunList = { runs: (Omit<HostRun, "status"> & { status: unknown })[] };

function parseRuns<T extends RawRunList>(body: unknown, httpStatus: number) {
  const response = body as T;
  if (!Array.isArray(response?.runs)) {
    throw invalidHostRunResponse(httpStatus, "runs", "must be an array of host runs");
  }
  return {
    ...response,
    runs: response.runs.map((run, index) => ({
      ...run,
      status: parseHostRunStatus(run?.status, `runs[${index}].status`, httpStatus)
    }))
  };
}

function parseStatusCounts(value: unknown, field: string, httpStatus: number): ReleaseSummary["statusCounts"] {
  if (!isJsonObject(value)) {
    throw invalidHostRunResponse(httpStatus, field, "must be an object keyed by host-run status");
  }
  const counts: ReleaseSummary["statusCounts"] = {};
  for (const [key, count] of Object.entries(value)) {
    const status = parseHostRunStatus(key, `${field} key`, httpStatus);
    if (typeof count !== "number" || !Number.isFinite(count) || count < 0) {
      throw invalidHostRunResponse(httpStatus, `${field}.${status}`, "must be a finite, non-negative number");
    }
    counts[status] = count;
  }
  return counts;
}

type RawReleaseList = Omit<ReleasesResponse, "releases"> & {
  releases: (Omit<ReleaseSummary, "statusCounts"> & { statusCounts: unknown })[];
};

function parseReleases(body: unknown, httpStatus: number): ReleasesResponse {
  const response = body as RawReleaseList;
  if (!Array.isArray(response?.releases)) {
    throw invalidHostRunResponse(httpStatus, "releases", "must be an array of releases");
  }
  return {
    ...response,
    releases: response.releases.map((release, index) => ({
      ...release,
      statusCounts: parseStatusCounts(release?.statusCounts, `releases[${index}].statusCounts`, httpStatus)
    }))
  };
}

function parseApiError(body: unknown, status: number) {
  const fallbackMessage = `Request failed with status ${status}.`;
  if (!isJsonObject(body)) {
    return { code: "request_failed", message: fallbackMessage, details: undefined };
  }

  if (isJsonObject(body.error)) {
    return {
      code: typeof body.error.code === "string" ? body.error.code : "request_failed",
      message: typeof body.error.message === "string" ? body.error.message : fallbackMessage,
      details: body.error.details
    };
  }

  return {
    code: typeof body.error === "string" ? body.error : "request_failed",
    message: typeof body.message === "string" ? body.message : fallbackMessage,
    details: body.details
  };
}

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
  async function request<T>(
    path: string,
    init: RequestInit = {},
    parseData: (body: unknown, httpStatus: number) => T = (body) => body as T
  ): Promise<T> {
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
      const apiError = parseApiError(body, response.status);
      if (response.status === HTTP_UNAUTHORIZED) onUnauthorized();
      throw new ApiError(
        apiError.code,
        apiError.message,
        response.status,
        apiError.details
      );
    }
    return parseData(unwrapData(body), response.status);
  }

  return {
    listAccounts: () => request<{ accounts: GcpAccount[] }>("/api/accounts"),
    listOperations: (limit: number, offset: number) =>
      request<OperationsResponse>(`/api/operations?limit=${limit}&offset=${offset}`),
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
    provisionVps: (accountId: number, input: ProvisionVpsInput) =>
      request<{ vps: VpsResource; operation: GcpOperationResult }>(`/api/accounts/${accountId}/vps`, {
        method: "POST",
        body: JSON.stringify(input)
      }),
    listVps: () => request<VpsInventoryResponse>("/api/vps"),
    createVps: (input: CreateVpsInput) =>
      request<{ vps: VpsResource }>("/api/vps", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    updateVps: (id: number, input: UpdateVpsInput) =>
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
      request(`/api/releases?limit=${limit}&offset=${offset}`, undefined, parseReleases),
    listReleaseRuns: (releaseId: number) =>
      request<{ runs: HostRun[] }>(`/api/releases/${releaseId}/host-runs`, undefined, parseRuns),
    listRuns: (state: HostRunListState, limit: number, offset: number) =>
      request<RunsResponse>(
        `/api/host-runs?state=${state}&limit=${limit}&offset=${offset}`,
        undefined,
        parseRuns<RawRunList & Pick<RunsResponse, "pagination">>
      ),
    getRunLog: (runId: number) => request<RunLog>(`/api/host-runs/${runId}/log`),
    ensureSchedulerAlarms: () =>
      request<SchedulerEnsureResponse>("/api/scheduler/ensure", { method: "POST" })
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
