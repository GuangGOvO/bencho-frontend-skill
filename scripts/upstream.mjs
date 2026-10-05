import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://bencho.dev';
const CATEGORIES = new Set(['Hover', 'Press', 'Drag', 'Slide', 'Swipe', 'Type', 'Select']);
export const sha256 = (text) => createHash('sha256').update(text).digest('hex');

export function discoverAssets(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => new URL(match[1], ORIGIN));
  const styles = [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter(match => /\brel=["']stylesheet["']/i.test(match[0]))
    .map(match => /\bhref=["']([^"']+)["']/i.exec(match[0])?.[1])
    .filter(Boolean).map(href => new URL(href, ORIGIN));
  const runtime = scripts.filter(url => url.origin === ORIGIN && /^\/assets\/index-[^/]+\.js$/.test(url.pathname));
  const css = styles.filter(url => url.origin === ORIGIN && /^\/assets\/index-[^/]+\.css$/.test(url.pathname));
  if (runtime.length !== 1 || css.length !== 1) {
    throw new Error(`Asset adapter needs review: expected one main JS/CSS, found ${runtime.length}/${css.length}`);
  }
  return { script: runtime[0].href, stylesheet: css[0].href };
}

export function extractCatalog(bundle) {
  // Read literal metadata only; never eval/import upstream code.
  const heads = [...bundle.matchAll(/\{id:([`"'])([a-z][a-z0-9-]*)\1,seo:([`"'])([^`"']+)\3/g)];
  if (heads.length === 0 || heads.length > 1000) throw new Error('Catalog adapter found no credible metadata table');
  const seen = new Set();
  return heads.map((head, index) => {
    const section = bundle.slice(head.index, heads[index + 1]?.index ?? bundle.length)
      .split(/\b(?:demo|css|params):/, 1)[0];
    const field = key => new RegExp(`\\b${key}:([\x60"'])([^\x60"']+)\\1`).exec(section)?.[2];
    const id = head[2], name = field('name'), category = field('cat'), kind = field('kind');
    if (!name || name.length > 100 || /[<>{}@\r\n]/.test(name) || !CATEGORIES.has(category) || kind !== category || seen.has(id)) {
      throw new Error(`Incomplete, unsafe or duplicate catalog metadata: ${id}`);
    }
    seen.add(id);
    return { id, name, category, url: `${ORIGIN}/blocks/${id}` };
  }).sort((a, b) => a.id.localeCompare(b.id, 'en'));
}

export async function fetchText(url, maxBytes = 5_000_000) {
  const target = new URL(url);
  if (target.origin !== ORIGIN) throw new Error('Upstream origin must remain https://bencho.dev');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(target, { signal: AbortSignal.timeout(25_000), redirect: 'error', headers: {
        'User-Agent': 'bencho-frontend-skill/0.1 (+https://github.com/GuangGOvO/bencho-frontend-skill)',
        Accept: 'text/html, application/javascript, text/css',
      } });
      if (!response.ok) throw new Error(`Upstream HTTP ${response.status}: ${target.pathname}`);
      if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Upstream response too large');
      let size = 0;
      const chunks = [];
      for await (const chunk of response.body) {
        size += chunk.byteLength;
        if (size > maxBytes) throw new Error('Upstream response too large');
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks).toString('utf8');
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
}

export function createSnapshot(html, bundle, css, licenceHtml, assets, capturedAt = new Date().toISOString()) {
  return {
    schemaVersion: 1, capturedAt, source: `${ORIGIN}/`,
    assets: {
      script: { url: assets.script, sha256: sha256(bundle) },
      stylesheet: { url: assets.stylesheet, sha256: sha256(css) },
      licencePage: { url: `${ORIGIN}/licence`, sha256: sha256(licenceHtml) },
    },
    catalog: extractCatalog(bundle),
  };
}

export function compareSnapshots(previous, current) {
  if (previous.schemaVersion !== 1 || current.schemaVersion !== 1) throw new Error('Unsupported snapshot schema');
  const oldMap = new Map(previous.catalog.map(item => [item.id, item]));
  const newMap = new Map(current.catalog.map(item => [item.id, item]));
  const added = current.catalog.filter(item => !oldMap.has(item.id));
  const removed = previous.catalog.filter(item => !newMap.has(item.id));
  const modified = current.catalog.filter(item => oldMap.has(item.id) && JSON.stringify(item) !== JSON.stringify(oldMap.get(item.id)));
  const assetsChanged = Object.keys(current.assets).filter(key => current.assets[key].sha256 !== previous.assets[key]?.sha256);
  const catalogChanged = added.length + removed.length + modified.length > 0;
  const fingerprint = sha256(JSON.stringify({ catalog: current.catalog, digests: Object.values(current.assets).map(asset => asset.sha256) }));
  return { changed: catalogChanged || assetsChanged.length > 0, catalogChanged, added, removed, modified, assetsChanged, fingerprint };
}

export function renderReport(diff, snapshot) {
  const lines = ['# Bencho upstream check', '', `Captured: ${snapshot.capturedAt}`, `Components: ${snapshot.catalog.length}`, '',
    diff.changed ? 'Changes detected; browser review is required before updating the Skill.' : 'No changes detected.', '',
    `Fingerprint: \`${diff.fingerprint}\``, '',
    `Added: ${diff.added.length}; removed: ${diff.removed.length}; modified: ${diff.modified.length}.`,
    `Changed assets: ${diff.assetsChanged.join(', ') || 'none'}.`, '',
    'Asset changes are a review signal, not proof of a visible feature change.',
  ];
  for (const key of ['added', 'removed', 'modified']) {
    if (diff[key].length) lines.push('', `## ${key}`, '', ...diff[key].map(item => `- [${item.name.replace(/[\[\]\\]/g, '')}](${item.url}) — ${item.category}`));
  }
  lines.push('', 'Do not execute downloaded source. Inspect the relevant public pages, update facts and original guidance, validate, and propose a PR.', '');
  return lines.join('\n');
}

export function renderCatalog(snapshot) {
  return `# Bencho 组件索引\n\n来源：[bencho.dev](https://bencho.dev/)。快照：${snapshot.capturedAt}，共 ${snapshot.catalog.length} 项。分类来自公开目录；不是逐项人工测试声明。\n\n| 组件 | 交互 | 原站 |\n| --- | --- | --- |\n` +
    snapshot.catalog.map(item => `| ${item.name} | ${item.category} | [打开](${item.url}) |`).join('\n') + '\n';
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--accept', '--fixture'].includes(arg))) throw new Error('Usage: node scripts/upstream.mjs [--accept] [--fixture]');
  const accept = args.includes('--accept');
  let html, bundle, css, licenceHtml;
  if (args.includes('--fixture')) {
    [html, bundle, css, licenceHtml] = await Promise.all(['home.html', 'app.js', 'app.css', 'licence.html'].map(name => readFile(resolve(ROOT, 'work/source', name), 'utf8')));
  } else {
    html = await fetchText(`${ORIGIN}/`, 1_000_000);
    const urls = discoverAssets(html);
    [bundle, css, licenceHtml] = await Promise.all([fetchText(urls.script), fetchText(urls.stylesheet), fetchText(`${ORIGIN}/licence`, 1_000_000)]);
  }
  const snapshot = createSnapshot(html, bundle, css, licenceHtml, discoverAssets(html));
  const baselinePath = resolve(ROOT, 'data/upstream-baseline.json');
  let previous;
  try { previous = JSON.parse(await readFile(baselinePath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT' || !accept) throw error;
    previous = snapshot;
  }
  const diff = compareSnapshots(previous, snapshot);
  const report = renderReport(diff, snapshot);
  await mkdir(resolve(ROOT, 'work'), { recursive: true });
  await writeFile(resolve(ROOT, 'work/upstream-current.json'), JSON.stringify(snapshot, null, 2) + '\n');
  await writeFile(resolve(ROOT, 'work/upstream-diff.json'), JSON.stringify(diff, null, 2) + '\n');
  await writeFile(resolve(ROOT, 'work/upstream-report.md'), report);
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, report, { flag: 'a' });
  if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `changed=${diff.changed}\nfingerprint=${diff.fingerprint}\n`, { flag: 'a' });
  if (accept) {
    await mkdir(dirname(baselinePath), { recursive: true });
    await writeFile(baselinePath, JSON.stringify(snapshot, null, 2) + '\n');
    await writeFile(resolve(ROOT, 'skills/bencho-frontend/references/catalog.md'), renderCatalog(snapshot));
  }
  console.log(JSON.stringify({ changed: diff.changed, components: snapshot.catalog.length, accepted: accept, fingerprint: diff.fingerprint }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
