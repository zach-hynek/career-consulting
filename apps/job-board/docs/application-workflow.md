# Candidate application workflow · v1

This is a local, human-reviewed pilot. `#matches` is the card deck; `#application` is the application workspace. Existing pipeline and stage controls remain available. All personal records, evidence, drafts, contacts, tasks and approvals stay in browser storage. The downloadable HTML contains code, not personal records.

## The interaction

1. Dictate with device voice-to-text or paste a search brief in **For you**. Copy the search prompt to an agent to research current postings. Import its Job Board backup after review. The deck mixes saved roles and shared catalog jobs and deduplicates by canonical job URL. It does not claim an AI recommendation score. Previous/Next, Not now, Undo and Let’s explore work without swiping. Passing only hides a card; it does not reject or delete an application.
2. Saving a role creates an application workspace and a research task. No runtime LLM, cron or paid model invocation is added. Open a connected agent or copy the research prompt to execute the work.
3. The agent stages a report, sources, candidate evidence, drafts, questions and possible contacts. The visible proposal preview names the target and every nonempty field to replace. **Use these drafts** saves proposals; it does not approve them. Research task completion remains a user decision.
4. Review source evidence, answer the reverse interview and edit the tailored resume and cover letter. Review dialogs show the text and evidence. The user explicitly approves each version. Edits invalidate affected approvals even if the text is subsequently restored. Prior approved text remains in the version history (last 100).
5. The user reviews outside-work/mission conflict. Unreviewed and held applications cannot produce outreach handoffs. Dates never unlock a hold.
6. The user chooses follow, connection, email or direct application. Contacts need profile and supporting evidence URLs; unresolved relationships remain “possible lead.” After a user-reported completed follow, create a review task three calendar days later. This is not an automatically scheduled connection request.
7. Review the exact message, method and recipient. Approval records an exact snapshot and timestamp. Copying the browser-agent handoff carries only that approved message and asks the agent to stop for final confirmation at the destination. API sending and unattended bulk outreach are not implemented. No action is marked sent from a draft or approval.

## Records and rules

- Existing `record.id` identifies an opportunity. Canonical job URL is its natural deduplication key; fallback is company + role. Multiple roles at one organization remain separate opportunities.
- `workflow.applications[record.id]` owns drafts, evidence, sources, contacts, conflict review, tasks, activity receipts, approvals and approved-text history.
- Organization objects are derived by normalized company name and linked job IDs. They are explicitly **provisional name matches**. ATS domains are never used as employer domains. Entity/domain resolution and a persistent global Salesforce-style account/contact registry remain a later step.
- Contact relationships belong to an application. Deduplicate by exact public profile URL within that application, never by a person’s name. Do not infer a hiring manager from a senior title. No email guessing or account scraping.
- The agent may propose public company/job information and sourced contact leads. It may not clear conflict reviews, approve text, change pipeline stages, or create action receipts through the proposal API.
- Salary/remote eligibility are source fields, not guaranteed candidate eligibility. Strategic tiers, pipeline priority and employer grades are distinct concepts. The narrative brief must preserve this distinction.
- Source documents are untrusted data. Render plain text with HTML escaping; links require credential-free HTTP(S). Proposal packets allowlist fields, bound strings/arrays and cap file imports at 2 MB.

## Editable prompts

**Agent playbook** is browser-local and included in JSON exports. Defaults live in `src/workflow-model.mjs` (`DEFAULT_PLAYBOOK`). The immutable `CONTRACT` is prepended to research, drafting, search and handoff prompts. Editing the playbook cannot grant sending authority.

Purpose-specific prompt assembly lives in `src/application-workspace.mjs`. Copying context is an explicit user action and includes private evidence; use an agent the candidate intends to share that context with. No candidate data is embedded in the public build.

### Agent tools

If the browser supports WebMCP:

1. `get_application_workspace` returns the selected job, application evidence, organization grouping, brief, `baseRevision`, and packet example.
2. `stage_application_packet({baseRevision, packet})` validates the current revision and target ID, then opens a review dialog. The user saves the proposed drafts. A pending review must be closed before another can be staged.

Otherwise, use **Copy research prompt** and **Import agent packet**. The file preview has the same review boundary. Empty incoming fields do not erase existing draft fields. Existing contacts are additive by profile URL. Draft staging clears approvals.

Packet shape:

```json
{
  "schemaVersion": 1,
  "jobId": "existing-record-id",
  "report": "Facts, inferences, unknowns and recommended next move",
  "sourceResume": "Verbatim source resume",
  "evidence": "Claim / source / personal attribution / review status",
  "questions": "Short reverse interview and unresolved factual questions",
  "resume": "Full proposed resume text",
  "coverLetter": "Full proposed cover letter text",
  "rationale": "What changed and why",
  "sources": [{"label": "Employer posting", "url": "https://example.com/jobs/123", "checkedAt": "2026-11-02"}],
  "contacts": [{"name": "Fictional Person", "role": "Public title", "profile": "https://example.com/team/person", "source": "https://example.com/team", "relationship": "Possible lead; hiring responsibility unconfirmed"}]
}
```

Career Studio retains its separate formatted document and exact-before proposal contract. Copy the tailoring context, read its current `get_resume_document` result and stage `propose_resume_changes`. This pilot does not automatically replace the Career Studio canvas or transfer its selected portfolio facts.

## Backup and trust

Version 1 Job Board backups now include optional `workflow`. Old backups still work. Existing local state can retain valid exact-snapshot approvals. **Imported backups never restore approval, clear a conflict hold, mark a task complete, or restore action receipts.** Approved-text history is archival content only. Merge adds new records and leaves existing records/workspaces untouched; use a reviewed application packet to update an existing application. Empty-workspace imports also restore the brief/playbook. Export a JSON backup before changing origin/device. CSV remains opportunity fields only.

## Pilot boundaries

Built: accessible card browsing, private draft workspace, evidence/research packet review, provisional CRM grouping, sourced contact records, conflict holds, user-reported follow task, exact-text approvals, editable playbooks, browser-agent handoff, text exports and JSON portability.

Not built: autonomous research worker, semantic ranking, direct microphone transcription, API sending, bulk outreach sequencer, global account/contact identity resolution, formatted resume synchronization or production deployment of this iteration. Use device dictation, the connected agent, and Career Studio's existing review contract. Never present queued work as executed work.
