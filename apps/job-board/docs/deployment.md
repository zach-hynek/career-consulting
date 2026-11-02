# Deploy a free pilot

Use a **dedicated free Supabase project** and a free Cloudflare Pages site. Do not reuse a database with broad existing Storage policies. No paid upgrades or billing changes are part of deployment. The app is fully usable for private manual tracking before these services are connected.

## 1. Supabase

Sign in or connect the Supabase integration, choose/create a dedicated Free project, and keep its database password outside this repository. Project creation, account terms, and credential entry happen in the owner’s account. Do not paste credentials into chat or frontend configuration.

From this app directory, with a current Supabase CLI installed:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy job-board --no-verify-jwt
supabase functions deploy refresh-jobs --no-verify-jwt
```

`db push` applies only the migration in this app’s `supabase/migrations/`. Review the linked project before running it; the migration starts disabled and creates no company records. Run `supabase/checks/security.test.mjs` locally under the testing-policy exception before applying a modified migration. The check uses actual embedded PostgreSQL with a minimal Storage schema; it is not a substitute for confirming policies on the chosen hosted project.

Set two random independent 32+ character secrets in the Supabase Edge Functions secrets dashboard:

- `JOB_BOARD_REFRESH_SECRET`: authorizes only the scheduled/manual ingestion endpoint.
- `JOB_BOARD_RATE_SALT`: salts short-lived client rate-limit hashes.

The runtime automatically supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Do not override or expose them. No visitor key is required by this app; the public function handles reads and bounded extraction.

Create Vault secrets named `job_board_project_url` (the project’s HTTPS URL) and `job_board_refresh_secret` (matching the Edge Function secret). Use the Supabase UI/SQL editor with private values; never save a secret-bearing SQL script to Git. Apply `supabase/schedule.sql` through the SQL editor. It replaces only the named Career job-board schedule and runs once per minute during 04:00–05:59 UTC daily. Each invocation processes one due company; a later invocation publishes after due sources finish. All subsequent invocations are idle.

Review `jb_settings` in the table editor. Defaults: ingestion cap 120 company attempts/day, extraction cap 300 requests/day, 10 imports/client/hour. Enable `enabled` only after secrets and schedule are configured. With no approved companies, the first refresh publishes an honestly empty catalog. Keep this disabled if the pilot is not ready.

Call the protected refresh function from a private REST client with the `x-job-board-secret` header to process one company or publish. Never put this secret in a public URL or command argument. The daily schedule also calls it automatically.

## 2. Public frontend configuration

Create ignored `public/config.local.json`:

```json
{
  "catalogUrl": "https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/job-board-catalog/manifest.json",
  "apiUrl": "https://YOUR_PROJECT_REF.supabase.co/functions/v1/job-board",
  "siteUrl": "https://YOUR_PAGES_PROJECT.pages.dev/"
}
```

Rebuild with `npm run build`. These three URLs are public; no secrets belong in this file. The generated HTML includes them so downloaded copies use the same service. Each industry catalog is capped at the configured Storage object size; full descriptions are fetched separately. A failed refresh preserves the previous manifest and frontend cache.

## 3. Cloudflare Pages

After signing into Cloudflare, either connect this Git repository to Pages or upload `dist/` directly. Git integration settings:

- Root directory: `apps/job-board`
- Build command: `npm ci && npm run build`
- Output directory: `dist`
- Node version: 22

For Git integration, set public URLs in tracked `public/config.json` once the deployment identity is approved for the public repository; ignored config is only present for local/direct builds. Do not put secrets in Git or the compiled HTML. A Cloudflare account integration is required before deployment; no substitute host is created automatically.

For a direct upload, sign in using `npx wrangler login`, then:

```sh
npx wrangler pages project create YOUR_PAGES_PROJECT --production-branch main
npx wrangler pages deploy dist --project-name YOUR_PAGES_PROJECT
```

Pick a project name available in your account. `npm run deploy` defaults to `career-job-board`; change that argument if necessary. Deploying requires the user’s Cloudflare account; installing Wrangler does not authenticate it. `_headers` supplies CSP, privacy headers, and embedding support. No custom domain or DNS changes are necessary.

## Interfaces

- Storage: `job-board-catalog/manifest.json` → versioned industry shards. `schemaVersion: 1`, generation ID, publication time, collections, and company count. Read-only and public.
- `GET /functions/v1/job-board/jobs/:uuid`: published company’s description, closure flag, last verification; 404 for drafts/disabled companies.
- `POST /functions/v1/job-board/extract`: `{ "url": "https://…" }` → `{ status, fields, provenance?, message? }`. Status is `complete`, `partial`, or `manual_required`. No private tracker data is sent. Quota failures return HTTP 429 and a manual fallback; backend outages return 503.
- `POST /functions/v1/refresh-jobs`: requires a 32+ character `x-job-board-secret`; returns disabled/idle/refreshed/retained/published. Public and missing secrets receive 401.

## Cost, monitoring, and recovery

Start on free tiers and do not enable paid overages. These limits bound **application work**, not a contractual dollar cap. Stay on free plans to avoid usage charges. Public traffic still consumes provider quotas; exhausted quotas can make discovery/import temporarily unavailable while the local tracker remains usable.

Review provider usage, `jb_runs`, company source status, and publication timestamp in the Supabase dashboard. Raw IPs are not logged by application code. Infrastructure may keep its own access logs. The frontend warns when catalogs are over 48 hours old or the live service is unreachable. Free Supabase projects can pause for low activity; restore through the dashboard, then invoke refresh or await the next window.

Set `jb_settings.enabled=false` to pause collection and URL extraction. Previously published catalogs remain readable. Revoke publication by disabling a company and completing the next daily publication; use Storage controls for urgent removal, since old public copies cannot be recalled. Old catalog generations are removed after retaining the current and immediately previous generation. Internal runs expire after 30 days, URL cache/rate buckets after their expiry, and closed public jobs after 90 days. None of this touches private browser records.

If publication fails, immutable incomplete shards are ignored because the manifest is written last. A later invocation retries after the publication lease expires. A suspicious >90% collapse on an employer with at least 10 active jobs requires curator investigation; it does not mark those jobs closed. Source/API/pagination failures do not count as absence.

A plan change, custom domain, paid crawler, proxy, AI API, or paid database requires a separate explicit choice. $100/month is a ceiling, not a target or permission to buy a subscription.
