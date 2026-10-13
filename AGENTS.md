# Project instructions

- Keep the project focused on the technical GHL + LC Email build. Do not add vendor-selection meetings or commercial approval tasks.
- Keep page content in English and maintain the Market Better branding already embedded in `index.html`.
- Preserve the standalone HTML format: inline CSS/JavaScript and embedded fonts/logo; no required remote runtime assets.
- Preserve existing task IDs, evidence notes and draft text when modifying the tracker. Preserve notes associated with retired tasks.
- Render evidence as plain text, not HTML. Escape embedded JSON safely when exporting an HTML snapshot.
- Keep `data/tasks.json`, `data/guides.json` and task markup consistent when task definitions change.
- Maintain the system split: GHL sends invitations; Contrast handles registrant confirmation/reminders; registration syncing must preserve consent and suppression.
- Run `npm test` after changes to task structure or tracker behavior. Check other changes appropriately.
- Never commit credentials, contact exports or private evidence. Browser progress does not automatically sync to GitHub.
