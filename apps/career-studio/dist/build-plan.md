# Career Studio: build plan and handoff

## Purpose

Give people a free, practical place to explain their experience and prepare a coherent application. Start from the useful structures in Zach Hynek's career, sales, and graduate-school resume templates; make the result easy to use through a GUI and straightforward to change in code.

The career toolkit can stand alone or become a `/career` section linked from Zach's personal portfolio. Its focus is helping visitors create their own materials. Existing personal-website interview records remain separate source material for the recruiter-facing portfolio.

## Template selection and intake

The homepage leads with finished resume examples and three steps: choose a template, bring experience, and refine the result. A dedicated template directory supports search and category filtering. Previews use the actual document renderer with selected author experience, plus a zoomable, scrollable dialog. Selection opens an intake page and preserves the visitor's profile.

Intake supports PDF text extraction with vendored PDF.js, pasted notes, plain text, and profile JSON. Text-based PDFs up to 20 pages and uploads up to 10 MB are supported; scans need pasted text. Raw text feeds a ready-made assistant prompt rather than an undocumented heuristic parser. ChatGPT and Claude links copy the contextual prompt and open the chosen assistant; they do not establish a direct provider integration. The returned profile JSON is normalized and previewed before the user applies it. Guided questions and direct canvas editing are alternatives.

## Current focus: editing the resume itself

The default builder route now opens a visual document editor. The canvas is editable text, not a read-only preview beside a form. A section outline and selection inspector share the same underlying profile. Users can drag sections and individual experience/education entries, rename or hide sections, change their column placement, and undo/redo edits.

The optional `document` property adds ordered section keys, editable section titles, column placement, and hidden sections to existing version 1 profile exports. Old profiles migrate to default structure on read. Original text is preserved. Plain text and print outputs honor the structure and omit hidden sections.

Agent edits have two paths: copy/paste a contextual JSON proposal, or use the browser's live `get_resume_document` and `propose_resume_changes` tools. All proposed text goes through a field allowlist, length limits, a content revision check, exact-before comparison, and visible review. Agents stage changes; the user applies them. The same commit and undo path handles human and agent edits. No AI-provider backend or API key is involved.

Direct verification covered inline editing, inspector-to-canvas sync, section drag, entry drag, undo, agent read/propose/apply, outdated proposal rejection, and a mobile inspection. Print pagination remains a native-dialog verification limitation.

## Original toolkit foundation

1. Landing page: editorial introduction, template chooser, four writing principles, application tools, resume-archive commentary, source download, and copyable agent prompt.
2. Guided builder: direction, introduction, experience, education, supporting evidence, and final review. Repeatable entries and experience reordering.
3. Resume: essential single column, professional sidebar, and leadership emphasis. One shared profile; editable accent color and live preview. Printing always uses single-column reading order.
4. Application materials: deterministic cover-letter and outreach templates; users edit text directly. Explicit regeneration protects manual work, and stale drafts are flagged.
5. Personal website: preview and self-contained HTML export with no JavaScript dependencies.
6. Portability: local autosave, JSON profile import/export, plain text, print-to-PDF, editable site content JSON, source ZIP, MIT license, and AI interview/build prompts.

## Architecture

Use the smallest deployable system: buildless static files in `dist/`. The browser holds a schema-versioned profile with contact information, role/program target, motivation, optional job brief, experience entries, education entries, skills, supporting work, and one strongest evidence sentence. The same data renders the resume and personal site; drafts keep a snapshot of the profile they were generated from so subsequent edits can be detected.

Content is a separate JSON object. GUI edits preview in browser storage; exporting and deploying the content file changes the shared site. Avoid implying that local edits are published.

No server, account system, analytics, LLM integration, dependency installation, or billable API is required. Use system fonts. Escape user content, validate imported schema, and permit HTTP(S) only for portfolio links. Keep any later credentials on a server, never in browser code.

## Source interpretation

- 2026 career PDF: spacious name/contact header, education/skills rail, experience hierarchy, compact one-page ambition.
- Downloaded 2025 career PDF: similar two-column system and condensed business/science story.
- Cloud Drive 2025 PDF: contains lorem ipsum; a layout reference only.
- Booth and Kellogg: tailored summaries, leadership-first framing, community contributions, and supporting qualifications; two-page references.
- Notion sales resume: distinctive name treatment and explicit results subsections.

These are adaptations rather than pixel-perfect reproductions. Do not silently merge conflicting chronology or statistics into a public biography. Do not present copied metrics as outcomes for a fictional visitor. Do not include original PDFs or direct personal contact details in the source download.

## Decisions for the owner

- Supply the past website URLs and descriptions to show in the examples area. `content.json` already supports a list of websites; the GUI edits the first entry.
- Rewrite the four principles in Zach's preferred voice. Current copy is inferred from the templates, not a verbatim interview or a final articulation of his methodology.
- Confirm disputed dates, figures, degree wording, and source typos before publishing any full personal resume.
- Decide whether the career toolkit belongs at a standalone domain, subdomain, or portfolio route.
- Public source is maintained in `zach-hynek/career-consulting`. The original hosted review copy remains private; deploy a separate public instance when its content and hosting are ready.

## Direct release verification

Load the landing page and use the actual builder once. Check desktop/mobile composition, input-to-preview updates, a template change, draft creation/edit preservation, and export controls. Inspect an actual printed output when print automation is available; otherwise report that print pagination remains a manual browser-dialog check. Check that no original resumes, private notes, credentials, or Site identity are in the source ZIP. No routine test suite or CI polling under the weekly policy.

## Next releases when justified

1. Owner content: verified website examples, authentic application tips, and approved anonymized before/after writing examples.
2. Portfolio integration: adopt the personal site's typography/navigation, deploy under the selected Vercel project, and preserve existing DNS/email records.
3. Optional variants: multiple saved application profiles and user-defined sections. Add migration logic before changing the profile schema.
4. Optional AI: first define what it improves over copy/paste prompts; use a server-side provider integration, clear user consent, rate limits, and cost controls. Preserve truthful drafting and explicit human review.
5. Optional collaboration/CMS: only introduce authentication and cloud persistence if users need cross-device or shared editing.

## Completion boundaries

The code provides a functioning local editor and downloadable files. It does not send emails, apply for jobs, claim ATS certification, guarantee interviews, publish personal websites automatically, or run AI generation. A GitHub-ready source archive is not evidence that a GitHub repository exists.
