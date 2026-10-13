# Market Better — GHL Email Marketing Setup

Technical implementation plan for building an 8,000-email sending operation in GoHighLevel with LC Email. Includes 18 core tasks, four event-sync tasks, implementation guides, ASCII diagrams and a local evidence tracker.

This repository contains the plan and tracker. It does not configure GHL, send email or deploy a CRM integration.

## Open the project

Open `index.html` in a browser, or use the GitHub Pages address after publishing:

https://josephlegacypodcasting.github.io/ghl-email-marketing-setup/

The HTML embeds its styles, brand logo, fonts and scripts. It needs no build step or runtime dependencies.

## Continue editing from Codex

Use this repository as the project checkout. Ask Codex to update the plan, task guides, diagram or tracker. Review the changes and run the checks before pushing updates.

- `index.html`: complete standalone page.
- `data/tasks.json`: task definitions and dependencies used by validation.
- `data/guides.json`: task steps and ASCII maps used by validation.
- `tests/tracker.test.cjs`: behavioral checks for notes, progress, navigation, persistence and HTML export.

When changing task definitions, keep the corresponding data files and page consistent. Retain task IDs where the task still represents the same work, so existing progress and evidence remain associated correctly.

## Evidence and progress

Task progress, drafts and multiple plain-text notes are saved in browser local storage when available. The page can download a standalone HTML copy containing that browser's progress and evidence.

Browser changes do not automatically update GitHub or sync to another person/device. A shared online evidence log would need a separate authenticated backend. The initial repository page has no embedded user progress or evidence notes. Keep secrets and lead records out of this public repository.

## Run checks

With Node.js installed:

```sh
npm test
```

No package installation is required. Checks cover dependency validity, note isolation, legacy-note migration, plain-text handling, timestamps, storage fallback, export/reopen, task navigation and progress.

## Publish on GitHub Pages

In repository Settings → Pages, select Deploy from a branch, `main`, and `/(root)`. The entry point is `index.html`. Publishing the page does not make the email system itself live.

## Operating context

- GHL / LC Email: invitations to the historical opted-in audience and eligible nonregistrant follow-ups.
- Eventbrite: event promotion and new-contact acquisition.
- Contrast: event registration, attendee confirmations and event reminders.
- GHL: migrated CRM data plus new/existing registration updates through a verified sync or reconciled import.

8,000/day is a target after authentication, capacity checks and warm-up. No provider guarantees inbox or Gmail Primary placement.
