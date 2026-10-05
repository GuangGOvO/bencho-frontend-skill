"""Build a deterministic standalone skill ZIP with file hashes and original licence."""
from pathlib import Path
import hashlib
import json
import zipfile
from validate import ROOT, SKILL, validate


def build():
    validate()
    version = (ROOT / 'VERSION').read_text(encoding='utf-8').strip()
    contents = {p.relative_to(SKILL).as_posix(): p.read_bytes() for p in SKILL.rglob('*') if p.is_file()}
    for name in ['LICENSE', 'THIRD_PARTY_NOTICES.md']:
        contents[name] = (ROOT / name).read_bytes()
    manifest = {'name': 'bencho-frontend', 'version': version, 'files': {name: hashlib.sha256(data).hexdigest() for name, data in sorted(contents.items())}}
    contents['MANIFEST.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    output = ROOT / 'dist'
    output.mkdir(exist_ok=True)
    archive = output / f'bencho-frontend-{version}.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
        for name, data in sorted(contents.items()):
            item = zipfile.ZipInfo('bencho-frontend/' + name, (2026, 1, 1, 0, 0, 0))
            item.compress_type = zipfile.ZIP_DEFLATED
            item.external_attr = 0o100644 << 16
            bundle.writestr(item, data)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (output / (archive.name + '.sha256')).write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None
        assert 'bencho-frontend/SKILL.md' in bundle.namelist()
        for name, expected in manifest['files'].items():
            assert hashlib.sha256(bundle.read('bencho-frontend/' + name)).hexdigest() == expected
    print(f'Built {archive.name} ({archive.stat().st_size} bytes), sha256={digest}')
    return archive


if __name__ == '__main__':
    build()
