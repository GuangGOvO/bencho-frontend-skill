import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT } from './upstream.mjs';

const repo = process.env.GITHUB_REPOSITORY;
if (!repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('GITHUB_REPOSITORY must be owner/repo');
const diff = JSON.parse(await readFile(resolve(ROOT, 'work/upstream-diff.json'), 'utf8'));
if (diff.changed) {
  if (!/^[a-f0-9]{64}$/.test(diff.fingerprint)) throw new Error('Invalid fingerprint');
  const title = `Bencho upstream update ${diff.fingerprint.slice(0, 12)}`;
  const existing = JSON.parse(execFileSync('gh', ['issue', 'list', '--repo', repo, '--state', 'all', '--search', `"${title}" in:title`, '--json', 'number,title', '--limit', '100'], { encoding: 'utf8' }));
  if (!existing.some(issue => issue.title === title)) {
    // Generated body contains sanitized catalog facts only. No shell interpolation.
    const url = execFileSync('gh', ['issue', 'create', '--repo', repo, '--title', title, '--body-file', resolve(ROOT, 'work/upstream-report.md')], { encoding: 'utf8' });
    console.log(url.trim());
  } else console.log('This upstream fingerprint was already reported.');
} else console.log('No update notification needed.');
