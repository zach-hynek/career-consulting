# Job Board implementation — October 29, 2026

## Implemented locally

The standalone frontend is in `dist/index.html` and `dist/job-board.html`. Private manual tracking, company targets, ten pipeline stages, board/table grouping, JSON backup preview/merge, CSV export, URL fallback, embedded-storage warnings, light/dark appearance, and downloadable HTML are implemented. Source modules remain independently editable in `src/`.

The backend includes a disabled-by-default Supabase migration, RLS/revoked public table privileges, protected resumable company ingestion, Greenhouse/Lever/Ashby adapters, daily cron setup, snapshot reconciliation, immutable industry catalogs with manifest-last publication, on-demand descriptions, bounded extraction, and quotas. The reviewed Top 100 remains a separate research/approval session; no company is seeded or published.

## Deployment state

The free Cloudflare Pages frontend is **published and verified live**. Its project name and production URL are recorded in ignored `private/deployment.json`. After the owner enabled the ChatGPT Chrome extension’s file-upload permission, all three static assets uploaded successfully. Cloudflare reported a successful deployment, and the production page rendered correctly with working navigation, discovery filters, a curation notice, and browser storage status. A screenshot is saved as `docs/review/live.png`. No paid plan or DNS change was needed.

Supabase is installed, its OAuth connection is confirmed, and the connected database tools are now available. The owner created a dedicated project; its identity is recorded only in ignored private deployment metadata. Inspect the selected project's schema and Storage policies before applying anything. No hosted schema, cron, function secrets, or catalog have been deployed by this agent. No billing, DNS setting, or existing application was changed.

The ignored local frontend configuration contains only the intended public Pages URL. Catalog/API URLs remain empty until the backend is deployed. This is intentional: the app visibly explains that curation is pending and manual tracking is usable now.

## Verification performed

- Built the inline HTML and checked JavaScript/configuration syntax. Corrected a packaging issue discovered in the first browser load; the repaired bundle parses and renders.
- Deno typechecked both Supabase functions successfully.
- Ran the focused credential/migration checks using embedded PostgreSQL: anonymous/authenticated roles cannot access the private tables or invoke admin RPCs; source leases, atomic rollback of duplicate snapshots, two-successful-absence closure, canonical URL continuity, and quotas behaved as expected. These checks use a minimal mocked Supabase Storage schema, not a hosted Supabase instance.
- Inspected Greenhouse’s own live employer feed once: 18 postings on October 29, 2026. This did not add or approve Greenhouse in the directory. Lever and Ashby were typechecked but not live-exercised.
- In the browser, manually saved the live Commercial Counsel link with an explicitly fictional QA referral, a next action, and a November 2 follow-up. Changed the stage to Applied w/ Referral Link and reloaded; the record persisted with the October 29 applied date.
- Exported an actual JSON backup, inspected its fields, and imported it through the review UI. It correctly reported zero additions and one duplicate and retained the existing record. No private catalog cache was included in the backup.
- Reviewed desktop and 390px mobile layouts; fixed the cramped mobile navigation. Screenshots are in `docs/review/`.
- Used a temporary localhost-only catalog of the already-inspected posting to exercise catalog rendering, match explanations, actual posting-date filtering, stale-source labeling, and on-demand description loading. This fixture is outside the repository and was not deployed or approved as curated content.
- Verified an iframe without same-origin storage shows a session-only warning and a full-board fallback.
- Downloaded the HTML through the actual UI and parsed its inline JavaScript successfully.
- Inspected the final standalone bundle: inline JavaScript parses and the private QA record is absent.

Verified by: production page inspection after successful Cloudflare deployment, focused browser walkthrough, live Greenhouse adapter inspection (18 postings), standalone build, Deno typecheck, and credential/migration exception checks. Tests: not run (weekly review policy), except the two focused security/migration checks authorized by that policy.

## Remaining

The separate company research session produced the [Employer Atlas draft](../research/employer-atlas-2026-10-29/README.md): seven overlapping 50-company collections, 315 distinct selections, 322 screened candidates and 100 expanded dossiers. All companies and source connectors remain unapproved/disabled. The proposed five industries plus public/remote lenses require an intentional product/schema update after review; the live application still uses its original taxonomy. The Supabase connection tools are available in the current session, but the user’s latest request prioritized the employer research. Backend deployment has not been resumed or represented as complete.

1. Use the connected Supabase tools to inspect the owner-created project, apply the migration and functions, configure secrets/Vault/cron, and enable the backend. Do not create another project or change billing.
2. Add the public backend URLs to local deployment config, rebuild, and redeploy the frontend.
3. Review the completed company research draft with Zach, implement the approved taxonomy, approve individual sources, and publish the selected catalog.

No routine suite or CI polling was performed. The repository’s existing weekly workflow was extended to build this app and run its scoped security checks weekly; it still has no push/PR trigger.
