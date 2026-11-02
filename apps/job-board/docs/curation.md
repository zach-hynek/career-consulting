# Curating Zach’s Top 100

The initial directory intentionally contains no companies. Research is a separate session; no company is implied to be selected because an adapter was inspected during development.

## October 29 research draft

The [Employer Atlas](../research/employer-atlas-2026-10-29/README.md) contains seven 50-employer research collections (315 distinct selections), an overall Top 100 with expanded dossiers, source links, workforce flags and explicit evidence gaps. Open its standalone `employer-atlas.html` to review locally and export keep/hold/remove decisions. These decisions do not approve a job source or publish a company.

The research proposes **five industry collections** (AI/software; nuclear/grid/energy; climate/industrial technology; space/defense/robotics; life science/scientific tools) and **two overlapping lenses** (established public STEM employers; remote/flexible work). The application and database still use the three original industry values below. Review the selection and implement the taxonomy deliberately before importing the expanded directory; do not map aerospace or life science into an unrelated legacy category. Research CSVs are editorial exports, not drop-in production company imports.

All research source records remain `approved=false`, `enabled=false`, `apiVerified=false`, with reuse review pending. Observed ATS board tokens are candidates only. Career-page access, funding, low reported turnover or remote branding does not establish a good employer or permission to redistribute listings.

## Research worksheet

Use `supabase/companies-template.csv` for import. Research candidates on LinkedIn and Built In through ordinary browsing, then verify the employer’s own career page. Record:

- Company name; industry (`nuclear-energy`, `climate-deep-tech`, `ai-startups`).
- A short rationale explaining why Zach would want to work there.
- Career-page URL and research source URLs.
- Feed support: `greenhouse`, `lever`, `ashby`, or `manual`; the exact board token; `global` or Lever `eu`.
- Access/reuse review date, source status, and optional approved employer host/path prefixes.

Aim for 100 thoughtfully chosen companies across the three collections. Keep candidates as drafts (`approved=false`, `enabled=false`) until Zach reviews them. Never invent company preferences, job openings, recruiter details, or rationale. Do not publish personal research notes, resumes, or connection information.

Supabase CSV array columns use PostgreSQL array syntax, such as `{"https://employer.com/careers"}` for research links. `approved_hosts` is JSON, for example `[{"host":"careers.employer.com","paths":["/jobs","/careers"]}]`; quote CSV JSON correctly. No real employers or approved hosts are seeded by this repository. Approved path prefixes must be specific; `/` is rejected.

## Source verification

Read the relevant source’s access and reuse conditions and verify the board token before approval. Public API availability alone is not a blanket redistribution license. Link directly to the employer and preserve source attribution.

```sh
npx deno run --allow-net --config supabase/functions/deno.json scripts/inspect-source.ts greenhouse BOARD_TOKEN
```

Replace `greenhouse` with `lever` or `ashby`; use a third `eu` argument for Lever EU boards. This command is read-only: it reports a count and a short example without approving, importing, or publishing anything. Only inspect sources appropriate to the research session. It uses the same bounded adapters as ingestion.

Adapters use the employer board’s structured API, not the LinkedIn or Built In page. Greenhouse returns a complete board, Lever is paginated with a 30-page bound, and Ashby excludes explicitly unlisted jobs. Unknown fields stay unknown. A response over 2 MB, failed request, or incomplete pagination is retained as a source failure; do not work around it by silently truncating jobs. Add a maintained adapter or adjust the reviewed limit deliberately if a selected employer needs it.

Set `reuse_reviewed_at`, `approved=true`, and `enabled=true` only after review. Source status becomes healthy after successful collection. A `manual` company can be approved with its public career-page link even without automatic collection; no empty-job promise is made about its site. Manual visitor imports and personal company targets never enter this directory.

## Daily behavior

The scheduler processes each approved automatic source once per UTC day. Every complete successful fetch upserts current jobs and increments absence only for previously active listings not returned. Two successful absences close a job. Refresh errors retain everything and label the source stale/blocked. Reappearing listings reopen with the original first-seen date; a source-ID change at the same canonical URL retains the existing record.

Posting dates come only from supplied publication fields. Greenhouse list fields and Ashby `publishedAt` are used when present. Lever publication date remains unknown. Role/function is approximated from the title and can be edited in the user’s private record.

After all due sources finish, the system publishes summaries by industry. Descriptions are available on demand. Changes to draft companies do not leak into public responses. Visitors can filter the shared selection and shortlist companies locally; they cannot request arbitrary automated watchlists or trigger collection.

## Iterating the collection

Review stale sources and hiring coverage during deliberate curation sessions. If an employer has no useful API, keep its career-page link and manually save interesting roles in your private tracker. Add another connector only when the selected list justifies its maintenance. Avoid broad scraping, automatic company discovery, and LLM-based extraction in v1.
