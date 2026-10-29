# Career Consulting

Free, open-source tools, agent skills, and practical guides for people looking for their next role. Created by [Zach Hynek](https://github.com/zach-hynek).

Start with the experience you already have. Make your contribution clear, support claims with evidence, and adapt your materials to the opportunity. The aim is to make that work easier for anyone, with or without a coding background.

## Start here

| Need | Use |
| --- | --- |
| Write and arrange a resume | [Career Studio](apps/career-studio): finished templates with zoomable previews, resume upload and guided intake, click-to-edit canvas, drag-and-drop sections and entries, and agent proposals |
| Work through your experience with an assistant | [Resume review skill](skills/career-resume-review/SKILL.md) |
| Tailor an application using confirmed facts | [Application prompt](prompts/tailor-application.md) |
| Draft a cover letter | [Cover-letter prompt](prompts/cover-letter.md) |
| Write a first outreach message | [Outreach prompt](prompts/outreach.md) |
| Find reusable tools and related repositories | [Resource catalog](docs/catalog.md) |
| Copy or extend the website with an agent | [Build prompt](apps/career-studio/docs/agent-prompt.md) and [build plan](apps/career-studio/docs/build-plan.md) |

## Run the resume editor

Clone this repository, then run a static server from its root:

```sh
git clone https://github.com/zach-hynek/career-consulting.git
cd career-consulting
python3 -m http.server 4173 --directory apps/career-studio/dist
```

Open **http://localhost:4173/#/builder**. Click text on the resume to edit it, use the linked section panel, or drag dotted handles to rearrange sections and entries. Changes save in the current browser. Download a profile JSON backup to move between browsers or devices.

The app also includes guided questions, editable cover-letter and outreach templates, and a downloadable personal website. It uses plain HTML, CSS, and JavaScript. The browser app needs no account, paid service, API key, or installation.

Agents can stage changes through supported browser tools or copy/paste proposals. You review before/after text and choose whether to apply it. The app itself does not call a model provider. See the [agent editing contract](apps/career-studio/docs/editor-agent.md).

## Use the skill or prompts

For Codex, copy the `skills/career-resume-review` folder into `~/.codex/skills/`, then start a new session and invoke `$career-resume-review`. Other assistants can use its instructions as a reference. The skill is included here; cloning this repository does not install it automatically.

For a simpler starting point, copy a prompt from `prompts/` into your preferred assistant and provide your own resume and target role. Share only material you want that service to receive. Prompts ask the assistant to preserve facts, clarify gaps, and leave sending applications and messages to you.

## What belongs here

This repository is the entry point and shared home for small career tools. Working applications live in `apps/`, reusable agent workflows in `skills/`, copy/paste instructions in `prompts/`, and guides and repository links in `docs/`. Larger tools can move into their own repositories and remain discoverable in the catalog.

The first working tool is the resume editor. See the [roadmap](docs/roadmap.md) for possible additions and the criteria for moving to a dedicated organization.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Useful contributions include accessible editing improvements, portable exports, well-explained writing workflows, and maintained open-source tools. Keep fictional examples clearly labeled and distinguish implemented features from ideas.

Personal resumes and application data belong outside the repository. The included examples are fictional; Zach's original resume PDFs and personal contact details are excluded. Browser storage can be cleared, so keep exported backups. PDF output uses the browser print dialog; pagination still needs manual verification for your document. No tool here guarantees interviews, admission, or automated screening results.

## License

[MIT](LICENSE). Use, adapt, and share the tools, prompts, and skills with the license notice. Linked projects retain their own licenses.
