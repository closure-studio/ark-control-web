export interface Env {
  API: Fetcher;
  ASSETS: Fetcher;
}

const API_ROOT_PATH = "/api";
const DASHBOARD_PATH = "/dashboard";
const HTTP_FOUND = 302;
const INDEX_PATH = "/index.html";
const ROOT_PATH = "/";

function assetRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url, request);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === API_ROOT_PATH || url.pathname.startsWith(`${API_ROOT_PATH}/`)) {
      return env.API.fetch(request);
    }

    if (url.pathname === ROOT_PATH) {
      return Response.redirect(new URL(DASHBOARD_PATH, url), HTTP_FOUND);
    }

    const lastSegment = url.pathname.split("/").at(-1) ?? "";
    if (lastSegment.includes(".")) {
      return env.ASSETS.fetch(request);
    }
    return env.ASSETS.fetch(assetRequest(request, INDEX_PATH));
  }
} satisfies ExportedHandler<Env>;
