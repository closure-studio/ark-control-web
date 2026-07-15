# ark-control-web

Single React control-plane dashboard served by a Cloudflare Worker:

```text
/dashboard
/vps
/accounts
/releases
```

The SPA uses React, Tailwind CSS, and DaisyUI. It calls the same-origin
`ark-control-api` resource routes under `/api/*`. Configure Cloudflare routing
so the API Worker owns the more-specific `console.example.com/api/*` route and
this Worker owns `console.example.com/*`.

```sh
npm install
npm test
npm run typecheck
npm run build
npm run dev
npm run deploy
```
