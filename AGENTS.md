# Maintaining this repository

The deliverable is `skills/bencho-frontend`, an independent Chinese frontend interaction skill. Preserve the separation between verified upstream facts, original recommendations, and unverified behavior. Do not redistribute the Bencho application, brand, licensed photographs, or fonts.

Maintenance commands: `npm ci`, `npm run check`, `npm test`, `npm run build`, `python scripts/validate.py`, `python -m unittest discover -s tests -p '*_test.py'`, `python scripts/package.py`.

For upstream work read `skills/bencho-frontend/references/maintenance.md`. `node scripts/upstream.mjs` writes ignored candidates; `--accept` changes the tracked baseline and reference catalog only after review. Never execute downloaded JS. Adapter failures must stay failures; no empty baseline fallback.

Bump `VERSION`, `package.json`, SKILL metadata, and CHANGELOG together for released guidance changes. Use `update/<topic>` branches and a reviewable PR for scheduled semantic maintenance; do not automatically merge or publish a release. Routine monitoring is silent when unchanged. Update the managed local skill only from reviewed main, and preserve local edits if the installer reports a conflict.
