export interface Env {
  API: Fetcher;
  ASSETS: Fetcher;
}

function assetRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url, request);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return env.API.fetch(request);
    }

    if (url.pathname === "/") {
      return Response.redirect(new URL("/dashboard", url), 302);
    }

    const lastSegment = url.pathname.split("/").at(-1) ?? "";
    if (lastSegment.includes(".")) {
      return env.ASSETS.fetch(request);
    }
    return env.ASSETS.fetch(assetRequest(request, "/index.html"));
  }
} satisfies ExportedHandler<Env>;
