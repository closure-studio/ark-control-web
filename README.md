# ark-control-web

Single React control-plane dashboard served by a Cloudflare Worker:

```text
/dashboard
/vps
/accounts
/releases
```

The SPA uses React, Tailwind CSS, and DaisyUI. It calls same-origin resource
routes under `/api/*`; the Web Worker forwards those requests to
`ark-control-api` through a Service Binding. This works on the default
`workers.dev` domain and on any Custom Domain attached to this Worker without
CORS or an additional API route.

```sh
npm install
npm test
npm run typecheck
npm run build
npm run dev
npm run deploy
```
