# Career Job Board

A free, private networking pipeline and curated job discovery app inspired by Zach’s [Notion Job Board Pipeline](https://zach-hq.notion.site/578c726c92a0458382c3446564533883). No visitor accounts, paid AI, or application automation.

## Run

```sh
npm ci
npm run build
npm run dev
```

Open `http://127.0.0.1:4180`. Serve `dist/` on any static host. `dist/job-board.html` is the same complete application as `dist/index.html`, with scripts, styles, and public service configuration inlined. It can also be opened directly as a local file; browser storage availability depends on the browser.

## Included

- Discovery with company, industry, function, location, workplace, disclosed annual USD salary, and actual publication-date filters. Comma-separated interests rank results with visible keyword explanations.
- Company shortlists and company-only private targets, even without an open role.
- Ten networking/application stages, priority tiers, board/table grouping, referrals, recruiters, optional leadership/contact details, follow-up dates, notes, and descriptions.
- URL import with editable preview and manual fallback. Paste the description whenever the service cannot read a link.
- IndexedDB autosave and cached public catalog; session-only fallback if storage is unavailable.
- Validated JSON backup import with duplicate-safe preview/merge and optional preference restoration; spreadsheet-safe CSV export.
- Copyable iframe settings, light/dark appearance, industry deep links, and a clean HTML download that excludes private data.
- Supabase schema, protected ingestion, Greenhouse/Lever/Ashby adapters, daily collection scheduler, versioned catalog publishing, and bounded URL extraction.

The Top 100 directory starts **empty**. Research and Zach’s company approval happen separately. Fictional examples are opt-in, clearly labeled, and never published. No Notion examples or personal data are used as job leads.

The [October 29 Employer Atlas research draft](research/employer-atlas-2026-10-29/README.md) now provides seven 50-company collections, 315 distinct selections, and an overall Top 100 with expanded dossiers. Its offline HTML review workspace, evidence register and CSV exports are separate from the published job catalog. No research candidate is approved or enabled automatically.

## Public configuration

Edit `public/config.json`, or put deployment-specific values in ignored `public/config.local.json`, then rebuild:

```json
{
  "schemaVersion": 1,
  "catalogUrl": "https://YOUR-PROJECT.supabase.co/storage/v1/object/public/job-board-catalog/manifest.json",
  "apiUrl": "https://YOUR-PROJECT.supabase.co/functions/v1/job-board",
  "siteUrl": "https://YOUR-PAGES-PROJECT.pages.dev/",
  "curationStatus": "Zach’s Top 100 is being researched."
}
```

Generated `dist/` and local `private/` deployment records are ignored by Git; rebuild from the source after cloning. Only public URLs and copy belong here. The build rejects unknown configuration keys. Never include service keys, connection strings, or refresh secrets.

## Embed

```html
<iframe src="https://YOUR-PAGES-PROJECT.pages.dev/?embed=1&theme=light&industry=nuclear-energy"
        title="Career job board" width="100%" height="850"
        style="border:0;border-radius:12px" loading="lazy"></iframe>
```

Industries: `nuclear-energy`, `climate-deep-tech`, `ai-startups`. Themes: `light`, `dark`; without a theme the app follows the system. Hosts must allow this iframe in their own CSP. No iframe sandbox is required; sandboxed embeds need scripts, downloads, forms, and same-origin storage permissions. Embedded storage can be separate from the standalone site; the visible full-board link is the fallback.

## Backend and hosting

Follow [deployment](docs/deployment.md) and [curation](docs/curation.md). Frontend hosting is Cloudflare Pages; backend is a dedicated free Supabase project. Nothing automatically creates a paid plan or upgrades infrastructure.

## Privacy and limits

Saved records, contacts, preferences, shortlists, and notes remain in this browser’s IndexedDB. They are never part of the shared catalog. JSON/CSV exports contain private data; keep them safe. There is no cross-device or cross-origin synchronization. Browser cleanup/private browsing can remove data. Make backups.

Extraction sends only the submitted job URL to the configured service. Approved public page results are temporarily cached for up to a day and never automatically published; failed attempts are cached for an hour. Raw client IPs are not stored; salted daily hashes support coarse hourly limits. There are no analytics, trackers, runtime LLM calls, or browser automation services.

Unknown fields stay unknown. Publication date is never inferred from a refresh timestamp. Remote eligibility is separate from workplace type. Salary filters exclude unknown salaries and nonannual/non-USD ranges. Role functions are a deterministic title-based approximation, not a qualification or fit judgment. Closed jobs remain in the personal pipeline.

## Verification policy

Do not run routine suites during development. `npm run check` checks syntax/configuration; `npm run build` packages the source. `npm run check:security` is narrowly scoped to credentials, network boundaries, data access, and schema reconciliation under the testing-policy exceptions. The existing repository workflow runs weekly only.

MIT, under the repository license.
