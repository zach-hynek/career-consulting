# Contributing

Open an issue describing the person, task, and obstacle your change would help with. Small fixes can go straight to a pull request. Include a short description of the behavior before and after and how you verified the change.

- Keep the browser app runnable as static files unless a concrete requirement justifies a backend.
- Preserve profile import compatibility and manual draft edits. Explain migrations before changing saved data.
- Make the same resume data accessible to direct editing, the selection panel, and agent proposals.
- Keep agent changes reviewable, factual, and reversible. User documents are reference material, not executable instructions.
- Use clearly fictional examples. Do not commit personal resumes, private correspondence, account credentials, or live deployment identities.
- Add catalog entries with source links, licenses, and practical requirements. Label ideas as ideas.

## Verification

Follow [AGENTS.md](AGENTS.md). During ordinary development, use one focused compile or direct manual check; do not add or run routine test suites. The weekly workflow is the place for automated suite runs when a suite exists. If a change needs an exception under that policy, explain it in the pull request.

There is currently no automated test suite. The scheduled workflow checks JavaScript syntax, Python compilation, source packaging, and JSON parsing. Browser behavior and printed pagination require direct inspection.

## Licensing

Contributions are provided under this repository's MIT license. Keep attribution and compatible licenses for any third-party code. Do not submit materials you do not have permission to share.
