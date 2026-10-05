"""Validate the standalone skill and the maintenance baseline without dependencies."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / 'skills' / 'bencho-frontend'


def validate():
    version = (ROOT / 'VERSION').read_text(encoding='utf-8').strip()
    assert re.fullmatch(r'\d+\.\d+\.\d+', version), 'Invalid VERSION'
    assert json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version'] == version, 'Package version mismatch'
    source = (SKILL / 'SKILL.md').read_text(encoding='utf-8')
    assert source.startswith('---\n'), 'Missing YAML frontmatter'
    header, body = source[4:].split('\n---\n', 1)
    assert re.search(r'^name: bencho-frontend$', header, re.M), 'Invalid name'
    assert re.search(r'^description: .+', header, re.M), 'Missing description'
    assert f'version: "{version}"' in header, 'Version mismatch'
    assert len(body.splitlines()) < 180, 'Entrypoint too long'
    assert '[TODO' not in source and 'TODO:' not in source, 'Unfinished scaffold'
    for path in SKILL.rglob('*.md'):
        for link in re.findall(r'\]\(([^)]+)\)', path.read_text(encoding='utf-8')):
            if '://' not in link and not link.startswith('#'):
                target = (path.parent / link.split('#', 1)[0]).resolve()
                assert target.is_relative_to(SKILL.resolve()) and target.is_file(), f'Broken link {path.name}: {link}'
    snapshot = json.loads((ROOT / 'data/upstream-baseline.json').read_text(encoding='utf-8'))
    assert snapshot['schemaVersion'] == 1
    assert 0 < len(snapshot['catalog']) <= 1000
    ids = [item['id'] for item in snapshot['catalog']]
    assert len(ids) == len(set(ids)), 'Duplicate component ID'
    catalog = (SKILL / 'references/catalog.md').read_text(encoding='utf-8')
    for item in snapshot['catalog']:
        assert item['url'] == 'https://bencho.dev/blocks/' + item['id']
        assert item['url'] in catalog, 'Catalog documentation is stale'
    for path in SKILL.rglob('*'):
        assert not path.is_symlink(), f'Symlink cannot enter package: {path}'
        if path.is_file():
            assert path.suffix.lower() not in {'.png', '.jpg', '.woff', '.woff2'}, 'No upstream media in package'
    print(f'Valid skill {version}: {len(ids)} upstream references')


if __name__ == '__main__':
    validate()
