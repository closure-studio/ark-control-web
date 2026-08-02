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

The Cloud Shell setup copied from the Accounts page prompts for the existing
`ADMIN_TOKEN` and uses it only for the account registration request.

VPS inventory records have a fixed role chosen at creation: `redroid` hosts
participate in APK delivery, while `arkhost` hosts participate in maintenance
pre-actions. The Automation toggle includes or excludes a host from the work
owned by its role.

The Dashboard keeps scheduler repair explicit. Its `Repair alarms` action calls
the authenticated, idempotent `/api/scheduler/ensure` endpoint; normal Alarm
creation remains part of the API deployment workflow.

```sh
npm install
npm test
npm run typecheck
npm run build
npm run dev
npm run deploy
```
