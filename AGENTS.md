# Agent guidance

Career Consulting is a public, MIT-licensed collection of career tools, skills, prompts, and repository links. Start with README.md and the relevant app or skill instructions. The working resume editor is in `apps/career-studio/`. Keep app changes grounded in its shared document model and reviewed agent proposal contract.

Do not commit original resumes, private notes, credentials, browser profile data, or deployment identities. Use fictional samples. A code contribution does not authorize sending applications or outreach messages.

<!-- Copied from zach-hynek/digital-command-center docs/testing-policy.md. Edit there, then recopy here. -->

# Testing policy: build it right, verify once, test weekly

This rule applies to every coding agent session (Claude Code and Codex) in every one of Zach's repos.
It started on 2026-10-08 as an experiment. Source of truth: `docs/testing-policy.md` in
`zach-hynek/digital-command-center`. The weekly review is run from the Digital Command Center (DCC).

## 1. During a dev cycle

1. Do not write new unit tests, integration tests, or end-to-end tests.
2. Do not run the existing test suite. Not before a commit, not after a push, not "to be safe".
3. Do not poll or wait on CI checks after a push. Report the push and stop.
4. Spend the saved effort before you write code. Read the code you will change. Trace its callers.
   Plan the change. Get it right the first time.
5. Verify the change once, directly, with the fastest check that proves this one change works:
   - typecheck or compile the files you changed (for example `tsc --noEmit`, `python -m py_compile`, `swift build`);
   - run the changed command, function, or page once by hand and show the real output;
   - for a UI change, load the page once and look at it.
   One pass. If it passes, stop. Do not add a test to "lock it in".
6. In your handoff write one line in this form:
   `Verified by: <what you ran>. Tests: not run (weekly review policy).`
   Never say tests passed if you did not run them.
7. If a repo's own CLAUDE.md or AGENTS.md says "run the tests before handing off", this rule wins.
   Say in the handoff that you skipped them under the weekly review policy.

## 2. Exceptions

Run or write a test only when one of these is true:

- Zach asks for tests in this session.
- You are fixing a bug that already escaped once. Write one failing test that reproduces it, make it pass, stop.
- The change touches money, authentication, credential handling, data deletion, or a database migration.
- You are the weekly review agent (section 3).

## 3. Weekly review

- Each repo gets one GitHub Actions workflow, `.github/workflows/weekly-tests.yml`. It runs the full suite
  once a week and when started by hand. It does not run on push or on pull requests.
- DCC shows the result on the project's DCC page under recent workflow checks.
- A red weekly run becomes one assignment in the command center: **Start work → "Weekly test review"**.
- The weekly review agent reads the week's commits, runs the full suite, fixes what broke, writes tests only
  for that week's changes where a test adds real protection, and opens one pull request. Zach reviews it.
- The agent writes the result as a report. Nothing is accepted automatically.
