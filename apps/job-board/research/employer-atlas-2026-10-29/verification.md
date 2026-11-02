# Employer Atlas handoff

November 2 interface addition: a private, reviewed voice-to-text search brief now filters the historical directory and explains shared interests. Device/chat dictation supplies text; no audio recorder, model service or live vacancy crawler was added. A focused browser walkthrough converted a climate/energy/operations narrative into editable interests and showed employer matches with explicit unverified constraints. Sort order remains user-selectable. This did not refresh company research, publish employers or activate feeds.

Research cutoff: October 29, 2026. Interface and icon assets updated October 30, 2026. Local research artifact only; no company publication or job-feed activation.

- Seven collections retain exactly 50 members each; 350 memberships cover 315 selected employers, with 322 screened records and 100 expanded dossiers.
- All 322 employer IDs have embedded PNG logos/icons with source URLs and provenance: 287 official-site assets, 34 cached website icons and one employer-supplied press logo. All contact sheets were visually inspected. No runtime logo requests or paid logo API.
- Added a private six-criterion A–D scorecard, 30 detailed rating anchors, editable weights, explicit uncertainty ranges, recorded evidence basis, role/team context, hard-constraint checks and workforce-context review.
- No company was assigned an automatic culture or personal-fit score. Unknown research fields remain unknown. User ratings and research facts remain separate.
- Built the HTML/CSV/JSON/ZIP pack and parsed inline JavaScript with `node --check`.
- Called the score function directly once with illustrative values: six 3/4 ratings yielded B at 75; location unknown yielded 71.25–76.25; a failed constraint prevented a supported grade; unknown inputs and all-zero weights produced no grade.
- Focused browser walkthrough inspected desktop and 390px mobile layouts, employer logo/dossier/criterion controls, source links and the per-criterion math. Temporary ratings persisted after reload and a failed hard constraint displayed “do not advance.”
- All temporary ratings, reasons and opportunity text were cleared through the interface. Existing review decisions/notes/weights were preserved. A blank scorecard record may remain with no active ratings.
- Review JSON successfully downloaded and parsed as schema v2 / rubric 1.0, with no active verification ratings. This supersedes the earlier unverified export status. Automatic review-backup import remains outside this atlas interface.
- Screenshots: `../../docs/review/employer-atlas-scorecard-desktop.png`, `employer-atlas-scorecard-mobile.png`, and `employer-atlas-scorecard-mobile-detail.png` in that same folder.
- No routine test suite, CI polling, backend deployment, database mutation or public catalog change.

To regenerate: edit the canonical data, rubric, template, enhancement sources or brief, then run `python3 build_atlas.py`. Icon maintenance is a separate manual `fetch_logos.py` command requiring Pillow (and Node/Sharp only for SVG source wordmarks).

Verified by: offline build, JavaScript syntax check, direct score calculations and a focused desktop/mobile browser walkthrough including reload and JSON export. Tests: not run (weekly review policy).
