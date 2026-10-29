# Career Studio

A free, browser-local resume and application toolkit, inspired by Zach Hynek's supplied resume designs. Plain HTML, CSS, and JavaScript. No installation, accounts, API keys, or paid services.

## Run locally

From this folder:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. Use a local HTTP server rather than opening `index.html` directly; the site loads its editable content and export assets with `fetch`.

## Visual resume editor

Open `/#/builder`. The resume itself is now the default editing surface.

- Click any text on the page to type directly. Click a section or experience to show its linked inspector.
- Drag dotted handles to move entire sections, experience entries, or education entries. The outline offers the same section moves; arrow buttons and Alt + Arrow keys provide alternatives to dragging.
- Switch templates, move sections between the main column and sidebar, rename headings, or hide sections without losing their text.
- Undo/redo covers inline text, inspector edits, moves, layout changes, and applied agent proposals. History is retained for the current page session; document data is autosaved across reloads.
- Select **Agent**, describe the requested change, and copy a contextual request into your preferred assistant. Paste its returned proposal for a before/after review. A supported browser agent can read the document and stage proposals directly through WebMCP. The site never calls an LLM provider itself.
- **Apply changes** is explicit. Proposals require the current document revision and exact original text. Stale proposals are rejected. One undo reverses the entire application.
- **Guided questions & drafts** keeps the earlier interview and application tools available against the same profile.

Read [the agent editing contract](docs/editor-agent.md) for the tool and proposal format.

## What works

- Six-step guided profile editor with repeatable experience and education entries.
- Three live resume layouts, an accent picker, and browser Print / Save as PDF.
- Editable cover letter and outreach drafts assembled from the user's own answers. These are deterministic templates, not an AI generation service.
- A personal website preview and a self-contained, script-free HTML download.
- Local autosave, versioned JSON import/export, and plain-text resume export.
- General interview and personalized application prompts to copy into an assistant.
- A landing-page copy editor that previews locally and exports `content.json`.
- A source archive, MIT license, and agent-ready build plan.

Profile edits update the preview immediately. Letter and email drafts only regenerate on request, preserving manual edits; a notice appears if answers change afterward. The job description is included in the copied application prompt, but is not automatically analyzed by the local draft builder.

## Edit the website

- `dist/content.json`: author, hero copy, four principles, and past website links.
- `dist/index.html`: landing-page structure and static editorial copy.
- `dist/styles.css`: design, responsive behavior, and print formatting.
- `dist/app.js`: shared profile, guided questions, deterministic drafts, exports, and local storage.
- `dist/resume-editor.js`: document model/rendering, inline editing, inspector, undo/redo, drag/drop, and validated agent proposals.
- `dist/resume-editor.css`: visual editor layout, editing states, responsive controls, and print refinements.

The **Edit site copy** button changes the current browser's preview. Download the resulting `content.json`, replace `dist/content.json`, and deploy to make those changes visible to everyone. This editor is not a hosted CMS or an authenticated administrator interface. A browser-local override takes precedence over the deployed JSON for that browser.

The resume profile and website copy are separate. Downloading a personal website produces a standalone portfolio, not a new hosted copy of Career Studio.

## Deploy anywhere

Serve `dist/` as static files. No build command is needed. For Vercel, use the supplied `vercel.json` (or import this folder, choose Other, leave the build command empty, and set the output directory to `dist`). Keep existing domain/DNS and email configuration intact when connecting it.

This public source omits the original private deployment identity. Create your own hosting project when deploying a copy.

## Make a source release

```sh
python3 scripts/package_source.py
```

This creates `dist/career-studio-source.zip` from an explicit source allowlist and copies the build plan, agent prompt, and license into `dist/`. It excludes Git state, Site identity, local profile data, original resumes, and private research notes. Run it after source changes, before deploying.

## Privacy and data

Personal data lives in localStorage on the current browser and origin. No profile is uploaded or sent to an AI provider. Anyone with access to the same browser profile can access it. Export backups to move between devices; private browsing, clearing site data, and storage restrictions may remove or prevent local saves. Exported profile JSON, PDFs, text, prompts, and HTML contain the data the user chooses to include. Import only Career Studio profile JSON, up to 1 MB. The app has no PDF parsing feature.

Sample content is fictional and labeled. The original resume PDFs, personal phone/email details, and disputed claims are not distributed. Documentary examples explain structure, not interview or admission guarantees. User-supplied text is escaped in previews and exports; website links accept only HTTP(S), and exported websites do not execute scripts.

## PDF behavior

Use the browser's Print / Save as PDF, select US Letter, and disable browser headers and footers. Printed resumes use one column in the chosen section order, including when the on-screen layout uses a sidebar. Hidden sections and blank placeholders are omitted. Content flows across pages instead of shrinking to fit or cutting off. There is no universal automated-screening guarantee. Follow the target application's file-format requirements.

## Reference and scope

Editorial principles are adaptations inferred from the supplied templates, not verbatim statements of Zach's personal advice. Additional general guidance: [Harvard's resume and cover-letter guide](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/). These principles can be rewritten in the site copy editor.

The full source lives in [zach-hynek/career-consulting](https://github.com/zach-hynek/career-consulting), alongside career skills and prompts. Live AI, accounts, shared storage, arbitrary PDF import, and a hosted CMS are left for a later version when there is a concrete need.

## Verification policy

Follow Zach's weekly review policy: no new automated tests or routine suite runs during development. Perform one direct browser check of a focused change. Do not poll CI after pushing. See `docs/build-plan.md` for the release checks and future acceptance criteria.

## License

MIT. See [LICENSE](LICENSE).
